/**
 * generate-manual.js
 * Génère le manuel d'utilisation EPlanify en .docx et .pdf
 * avec captures d'écran automatiques via Puppeteer.
 *
 * Usage : node scripts/generate-manual.js
 */

import "dotenv/config";
import puppeteer from "puppeteer";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { execSync, spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    ImageRun,
    AlignmentType,
    PageBreak,
    BorderStyle,
    WidthType,
    TableRow,
    TableCell,
    Table,
    ShadingType,
    convertInchesToTwip,
    convertMillimetersToTwip,
    HorizontalPositionAlign,
    VerticalPositionAlign,
    PageNumber,
    Footer,
    Header,
    UnderlineType,
    SpaceType,
} from "docx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const SCREENSHOTS_DIR = resolve(ROOT, "scripts", "screenshots_tmp");
const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}`;

const TEMP_EMAIL = "admin.manuel.tmp@eplanify.local";
const TEMP_PASSWORD = "Manuel@EPlanify2026!";

const PRIMARY = "1a3c5e";
const ACCENT = "2980b9";
const LIGHT_BG = "EBF3FA";
const TEXT_COLOR = "222222";
const GRAY = "7F8C8D";

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────

function log(msg) {
    console.log(`  ▶  ${msg}`);
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, retries = 20, interval = 1500) {
    const { default: fetch } = await import("node-fetch").catch(() => ({ default: null }));
    for (let i = 0; i < retries; i++) {
        try {
            const res = await globalThis.fetch ? globalThis.fetch(url) : new Promise((res, rej) => {
                import("http").then(({ default: http }) => {
                    http.get(url, (r) => res(r)).on("error", rej);
                });
            });
            if (res.status !== undefined || res.statusCode !== undefined) return true;
        } catch {}
        await wait(interval);
    }
    return false;
}

// ─── ÉTAPE 1 : COMPTE ADMIN TEMPORAIRE ────────────────────────────────────────

async function createTempAdmin(prisma) {
    log("Création du compte admin temporaire...");
    const hashed = await bcrypt.hash(TEMP_PASSWORD, 10);
    // Supprimer s'il existe déjà
    await prisma.user.deleteMany({ where: { email: TEMP_EMAIL } });
    await prisma.user.create({
        data: {
            email: TEMP_EMAIL,
            password: hashed,
            role: "admin",
            nom: "Manuel",
            prenom: "Admin",
        },
    });
    log("Compte admin temporaire créé.");
}

async function deleteTempAdmin(prisma) {
    await prisma.user.deleteMany({ where: { email: TEMP_EMAIL } });
    log("Compte admin temporaire supprimé.");
}

// ─── ÉTAPE 2 : DÉMARRER LE SERVEUR ────────────────────────────────────────────

function startServer() {
    log("Démarrage du serveur Express...");
    const server = spawn("node", ["server.js"], {
        cwd: ROOT,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
    });
    server.stdout.on("data", (d) => process.stdout.write(`    [serveur] ${d}`));
    server.stderr.on("data", (d) => process.stderr.write(`    [serveur-err] ${d}`));
    return server;
}

// ─── ÉTAPE 3 : CAPTURES D'ÉCRAN ───────────────────────────────────────────────

async function takeScreenshots(browser, page) {
    const shots = {};

    async function shot(name, url, action) {
        log(`  Screenshot: ${name}`);
        await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle2", timeout: 30000 });
        await wait(800);
        if (action) await action();
        const path = resolve(SCREENSHOTS_DIR, `${name}.png`);
        await page.screenshot({ path, fullPage: false });
        shots[name] = path;
    }

    // — Page de connexion (non authentifié) —
    await shot("connexion", "/connexion");

    // — Se connecter —
    log("  Connexion au compte admin...");
    await page.goto(`${BASE_URL}/connexion`, { waitUntil: "networkidle2" });
    await wait(600);
    await page.type('#input-courriel', TEMP_EMAIL, { delay: 30 });
    await page.type('#input-mot-de-passe', TEMP_PASSWORD, { delay: 30 });
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
        page.click('input[type="submit"]'),
    ]);
    await wait(2000);

    // — Tableau de bord —
    await shot("accueil", "/");

    // — Cours —
    await shot("cours", "/cours");

    // Ouvrir modal ajout cours
    await shot("cours_modal", "/cours", async () => {
        const btn = await page.$('#btn-ajouter-cours, button[data-target="#modalAjoutCours"], button::-p-text(Ajouter)').catch(() => null)
            || await page.$('button').catch(() => null);
        // Chercher le bouton "Ajouter" dans la page cours
        const buttons = await page.$$('button');
        for (const b of buttons) {
            const txt = await page.evaluate(el => el.textContent, b);
            if (txt && txt.trim().toLowerCase().includes('ajouter')) {
                await b.click().catch(() => {});
                await wait(800);
                break;
            }
        }
    });

    // — Professeurs —
    await shot("professeurs", "/professeurs");

    // — Salles —
    await shot("salles", "/salles");

    // — Affectations —
    await shot("affectations", "/affectations");

    // — Planner —
    await shot("planner", "/planner");

    // — Semestres —
    await shot("semestres", "/gerer-semestres");

    // — Admin —
    await shot("admin", "/admin");

    return shots;
}

// ─── ÉTAPE 4 : CONSTRUIRE LE DOCUMENT WORD ────────────────────────────────────

function imgRun(filePath, widthMm = 150) {
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath);
    const widthEmu = convertMillimetersToTwip(widthMm) * 914400 / 1440; // approx
    const w = Math.round(widthMm * 9525); // EMU: 1mm = 9525 EMU (at 96dpi)
    const h = Math.round(w * 0.63); // ratio 16/10
    return new ImageRun({
        data,
        transformation: { width: Math.round(widthMm * 3.78), height: Math.round(widthMm * 3.78 * 0.63) },
        type: "png",
    });
}

function buildImageParagraph(filePath, widthMm = 155) {
    const img = imgRun(filePath, widthMm);
    if (!img) return captionParagraph("[ Capture d'écran non disponible ]");
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 160, after: 160 },
        border: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        },
        children: [img],
    });
}

function captionParagraph(text) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 200 },
        children: [
            new TextRun({
                text,
                italics: true,
                color: GRAY,
                size: 18,
                font: "Calibri",
            }),
        ],
    });
}

function chapterTitle(text, level = HeadingLevel.HEADING_1) {
    const sizes = { [HeadingLevel.HEADING_1]: 36, [HeadingLevel.HEADING_2]: 28, [HeadingLevel.HEADING_3]: 24 };
    return new Paragraph({
        heading: level,
        spacing: { before: 400, after: 160 },
        children: [
            new TextRun({
                text,
                bold: true,
                color: PRIMARY,
                size: sizes[level] || 28,
                font: "Calibri",
            }),
        ],
    });
}

function bodyText(text, { bold = false, color = TEXT_COLOR, size = 22, spacing = { before: 80, after: 80 } } = {}) {
    return new Paragraph({
        spacing,
        children: [
            new TextRun({ text, bold, color, size, font: "Calibri" }),
        ],
    });
}

function bulletItem(text, level = 0) {
    return new Paragraph({
        bullet: { level },
        spacing: { before: 40, after: 40 },
        children: [
            new TextRun({ text, size: 22, font: "Calibri", color: TEXT_COLOR }),
        ],
    });
}

function infoBox(lines) {
    const rows = lines.map((line) =>
        new TableRow({
            children: [
                new TableCell({
                    shading: { fill: LIGHT_BG, type: ShadingType.CLEAR, color: LIGHT_BG },
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 2, color: ACCENT },
                        bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT },
                        left: { style: BorderStyle.THICK, size: 6, color: ACCENT },
                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    },
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: line, size: 20, font: "Calibri", color: TEXT_COLOR })],
                        }),
                    ],
                }),
            ],
        })
    );
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
        borders: { insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    });
}

function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

function hr() {
    return new Paragraph({
        spacing: { before: 160, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" } },
        children: [],
    });
}

function buildDocument(shots) {
    const logoPath = resolve(ROOT, "public", "assets", "logoLacite.jpg");
    const logoData = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;

    const coverChildren = [
        new Paragraph({ spacing: { before: 1200 }, children: [] }),
        ...(logoData
            ? [
                  new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 0, after: 400 },
                      children: [
                          new ImageRun({ data: logoData, transformation: { width: 140, height: 60 }, type: "jpg" }),
                      ],
                  }),
              ]
            : []),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 200 },
            children: [
                new TextRun({ text: "EPlanify", bold: true, size: 72, color: PRIMARY, font: "Calibri" }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 600 },
            children: [
                new TextRun({
                    text: "Manuel d'utilisation",
                    size: 40,
                    color: ACCENT,
                    font: "Calibri",
                    italics: true,
                }),
            ],
        }),
        hr(),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 100 },
            children: [
                new TextRun({ text: "Système de gestion des horaires et planification académique", size: 24, color: GRAY, font: "Calibri" }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
            children: [
                new TextRun({ text: `Version 2.0  |  Avril 2026`, size: 22, color: GRAY, font: "Calibri" }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 800 },
            children: [
                new TextRun({ text: "La Cité — Projet intégrateur", size: 22, color: GRAY, font: "Calibri" }),
            ],
        }),
        pageBreak(),
    ];

    const chapter1 = [
        chapterTitle("1.  Introduction", HeadingLevel.HEADING_1),
        bodyText(
            "EPlanify est une application web de gestion des horaires et de planification académique développée pour l'établissement La Cité. Elle permet aux gestionnaires et au personnel d'organiser efficacement les cours, les professeurs, les salles de classe, ainsi que les affectations semestrielles."
        ),
        bodyText(""),
        chapterTitle("1.1  Objectifs de l'application", HeadingLevel.HEADING_2),
        bulletItem("Centraliser la gestion des cours, professeurs et salles dans un seul outil."),
        bulletItem("Faciliter la création et la visualisation des emplois du temps."),
        bulletItem("Prévenir les conflits d'horaires (salles et professeurs)."),
        bulletItem("Offrir un tableau de bord synthétique avec indicateurs clés."),
        bodyText(""),
        chapterTitle("1.2  Rôles utilisateurs", HeadingLevel.HEADING_2),
        bodyText("L'application distingue deux rôles principaux :"),
        bodyText(""),
        infoBox([
            "👤  Utilisateur standard  —  Accès en lecture/écriture sur les cours, professeurs, salles, affectations, planner et semestres.",
            "🔑  Administrateur (admin)  —  Tous les droits utilisateur + gestion des comptes (créer, modifier, attribuer des rôles, supprimer).",
        ]),
        bodyText(""),
        chapterTitle("1.3  Prérequis techniques", HeadingLevel.HEADING_2),
        bulletItem("Navigateur web moderne (Chrome, Firefox, Edge — version récente recommandée)."),
        bulletItem("Réseau local ou connexion VPN si accès à distance."),
        bulletItem("Compte utilisateur créé par un administrateur ou via la page d'inscription."),
        pageBreak(),
    ];

    const chapter2 = [
        chapterTitle("2.  Accès à l'application", HeadingLevel.HEADING_1),
        chapterTitle("2.1  Page de connexion", HeadingLevel.HEADING_2),
        bodyText("Rendez-vous sur l'adresse de l'application dans votre navigateur. La page de connexion s'affiche automatiquement si vous n'êtes pas encore identifié."),
        bodyText(""),
        buildImageParagraph(shots["connexion"]),
        captionParagraph("Figure 1 — Page de connexion"),
        bodyText(""),
        bodyText("Pour vous connecter :"),
        bulletItem("Saisissez votre adresse courriel dans le champ Courriel."),
        bulletItem("Saisissez votre mot de passe dans le champ Mot de passe."),
        bulletItem("Cliquez sur le bouton Se connecter."),
        bodyText(""),
        infoBox([
            "⚠  En cas d'erreur de connexion, vérifiez votre courriel et mot de passe. Contactez votre administrateur si vous avez oublié vos identifiants.",
        ]),
        bodyText(""),
        chapterTitle("2.2  Inscription d'un nouveau compte", HeadingLevel.HEADING_2),
        bodyText("Si vous ne possédez pas encore de compte, cliquez sur le lien Créer un compte depuis la page de connexion. Remplissez le formulaire (prénom, nom, courriel, mot de passe) puis validez."),
        bodyText(""),
        infoBox([
            "ℹ  Les nouveaux comptes ont le rôle Utilisateur par défaut. Un administrateur peut ensuite modifier le rôle si nécessaire.",
        ]),
        pageBreak(),
    ];

    const chapter3 = [
        chapterTitle("3.  Tableau de bord", HeadingLevel.HEADING_1),
        bodyText("Le tableau de bord est la page d'accueil de l'application. Il présente une vue synthétique de l'ensemble du système."),
        bodyText(""),
        buildImageParagraph(shots["accueil"]),
        captionParagraph("Figure 2 — Tableau de bord"),
        bodyText(""),
        chapterTitle("3.1  Indicateurs clés (KPIs)", HeadingLevel.HEADING_2),
        bodyText("Quatre compteurs sont affichés en haut de page :"),
        bulletItem("Cours — nombre total de cours dans le catalogue."),
        bulletItem("Professeurs — nombre de professeurs enregistrés."),
        bulletItem("Salles — nombre de salles disponibles."),
        bulletItem("Affectations — nombre total d'affectations planifiées."),
        bodyText(""),
        chapterTitle("3.2  Carte de chaleur d'occupation", HeadingLevel.HEADING_2),
        bodyText("En bas de page, une heatmap hebdomadaire montre le taux d'occupation des salles par jour et par plage horaire. Les cases les plus foncées indiquent les créneaux les plus occupés."),
        pageBreak(),
    ];

    const chapter4 = [
        chapterTitle("4.  Gestion des cours", HeadingLevel.HEADING_1),
        bodyText("La page Cours permet de gérer le catalogue complet des cours offerts par l'établissement."),
        bodyText(""),
        buildImageParagraph(shots["cours"]),
        captionParagraph("Figure 3 — Liste des cours"),
        bodyText(""),
        chapterTitle("4.1  Informations d'un cours", HeadingLevel.HEADING_2),
        bodyText("Chaque cours possède les attributs suivants :"),
        bulletItem("Code — identifiant unique du cours (ex. : INF123)."),
        bulletItem("Nom — intitulé complet du cours."),
        bulletItem("Durée — durée en heures (ex. : 3h)."),
        bulletItem("Programme — programme auquel appartient le cours."),
        bulletItem("Étape d'étude — niveau d'étude (ex. : 1re année, 2e année...)."),
        bulletItem("Type de salle — type de local requis (ex. : Laboratoire, Classe, Atelier...)."),
        bodyText(""),
        chapterTitle("4.2  Ajouter un cours", HeadingLevel.HEADING_2),
        bodyText("Cliquez sur le bouton Ajouter un cours. Le formulaire d'ajout s'ouvre."),
        bodyText(""),
        buildImageParagraph(shots["cours_modal"]),
        captionParagraph("Figure 4 — Formulaire d'ajout d'un cours"),
        bodyText(""),
        bulletItem("Remplissez tous les champs obligatoires."),
        bulletItem("Cliquez sur Enregistrer pour valider."),
        bodyText(""),
        chapterTitle("4.3  Modifier ou supprimer un cours", HeadingLevel.HEADING_2),
        bodyText("Dans la liste des cours, chaque ligne dispose de deux boutons d'action :"),
        bulletItem("Modifier (icône crayon) — ouvre le formulaire pré-rempli pour modifier les informations."),
        bulletItem("Supprimer (icône corbeille) — supprime le cours après confirmation."),
        bodyText(""),
        infoBox([
            "⚠  La suppression d'un cours est irréversible et retire toutes les affectations associées.",
        ]),
        pageBreak(),
    ];

    const chapter5 = [
        chapterTitle("5.  Gestion des professeurs", HeadingLevel.HEADING_1),
        bodyText("La page Professeurs centralise la gestion des enseignants de l'établissement."),
        bodyText(""),
        buildImageParagraph(shots["professeurs"]),
        captionParagraph("Figure 5 — Liste des professeurs"),
        bodyText(""),
        chapterTitle("5.1  Informations d'un professeur", HeadingLevel.HEADING_2),
        bulletItem("Matricule — identifiant unique du professeur."),
        bulletItem("Nom / Prénom."),
        bulletItem("Spécialité — domaine d'enseignement."),
        bulletItem("Programme — programme(s) auquel le professeur est rattaché."),
        bulletItem("Charge max — nombre d'heures maximum par semaine (par défaut : 30h)."),
        bodyText(""),
        chapterTitle("5.2  Ajouter, modifier, supprimer", HeadingLevel.HEADING_2),
        bodyText("Le fonctionnement est identique à celui de la gestion des cours (boutons Ajouter, Modifier, Supprimer)."),
        bodyText(""),
        chapterTitle("5.3  Disponibilités", HeadingLevel.HEADING_2),
        bodyText("Pour chaque professeur, il est possible de définir des contraintes de disponibilité (jours et plages horaires où le professeur n'est pas disponible). Ces contraintes sont prises en compte lors de la création des affectations."),
        pageBreak(),
    ];

    const chapter6 = [
        chapterTitle("6.  Gestion des salles", HeadingLevel.HEADING_1),
        bodyText("La page Salles permet de gérer l'inventaire des locaux disponibles pour la planification."),
        bodyText(""),
        buildImageParagraph(shots["salles"]),
        captionParagraph("Figure 6 — Liste des salles"),
        bodyText(""),
        chapterTitle("6.1  Informations d'une salle", HeadingLevel.HEADING_2),
        bulletItem("Code — identifiant unique de la salle (ex. : B-201)."),
        bulletItem("Type — catégorie du local (Classe, Laboratoire, Atelier, Amphithéâtre...)."),
        bulletItem("Capacité — nombre maximum de places assises."),
        bodyText(""),
        chapterTitle("6.2  Ajouter, modifier, supprimer", HeadingLevel.HEADING_2),
        bodyText("Même interface que pour les cours et les professeurs. La suppression d'une salle retire également toutes les affectations liées."),
        pageBreak(),
    ];

    const chapter7 = [
        chapterTitle("7.  Gestion des affectations", HeadingLevel.HEADING_1),
        bodyText("Les affectations représentent la planification concrète d'un cours : elles associent un cours, un professeur, une salle, une date et une plage horaire."),
        bodyText(""),
        buildImageParagraph(shots["affectations"]),
        captionParagraph("Figure 7 — Liste des affectations"),
        bodyText(""),
        chapterTitle("7.1  Créer une affectation", HeadingLevel.HEADING_2),
        bodyText("Cliquez sur Ajouter une affectation. Dans le formulaire :"),
        bulletItem("Sélectionnez le cours à affecter."),
        bulletItem("Choisissez la salle (filtrée automatiquement selon le type de salle du cours)."),
        bulletItem("Choisissez le professeur (filtré selon la disponibilité et la spécialité)."),
        bulletItem("Sélectionnez le semestre."),
        bulletItem("Choisissez la date et la plage horaire."),
        bodyText(""),
        infoBox([
            "✅  Le système vérifie automatiquement les conflits de salle et de professeur avant d'enregistrer l'affectation.",
        ]),
        bodyText(""),
        chapterTitle("7.2  Filtres de recherche", HeadingLevel.HEADING_2),
        bodyText("La liste des affectations peut être filtrée par : cours, professeur, salle, semestre ou plage de dates. Ces filtres permettent de retrouver rapidement une affectation spécifique."),
        bodyText(""),
        chapterTitle("7.3  Assigner un professeur a posteriori", HeadingLevel.HEADING_2),
        bodyText("Il est possible de créer une affectation sans professeur et de l'assigner ultérieurement via le bouton Assigner un professeur dans la liste."),
        pageBreak(),
    ];

    const chapter8 = [
        chapterTitle("8.  Planner — Emploi du temps", HeadingLevel.HEADING_1),
        bodyText("Le Planner offre une vue calendrier interactive de toutes les affectations planifiées."),
        bodyText(""),
        buildImageParagraph(shots["planner"]),
        captionParagraph("Figure 8 — Planner / Emploi du temps"),
        bodyText(""),
        chapterTitle("8.1  Navigation", HeadingLevel.HEADING_2),
        bulletItem("Utilisez les flèches gauche/droite pour naviguer entre les semaines."),
        bulletItem("Le bouton Aujourd'hui ramène à la semaine courante."),
        bulletItem("Chaque bloc de couleur représente une affectation (cours + salle)."),
        bodyText(""),
        chapterTitle("8.2  Filtres disponibles", HeadingLevel.HEADING_2),
        bodyText("Des filtres permettent d'afficher uniquement les affectations d'un professeur spécifique, d'une salle ou d'un cours. Cela facilite la vérification des emplois du temps individuels."),
        pageBreak(),
    ];

    const chapter9 = [
        chapterTitle("9.  Gestion des semestres et jours fériés", HeadingLevel.HEADING_1),
        bodyText("La page Semestres permet de définir les périodes d'études et les jours sans cours."),
        bodyText(""),
        buildImageParagraph(shots["semestres"]),
        captionParagraph("Figure 9 — Gestion des semestres"),
        bodyText(""),
        chapterTitle("9.1  Créer un semestre", HeadingLevel.HEADING_2),
        bodyText("Cliquez sur Ajouter un semestre. Renseignez le nom (ex. : Hiver 2026), la date de début et la date de fin."),
        bodyText(""),
        chapterTitle("9.2  Jours fériés et congés", HeadingLevel.HEADING_2),
        bodyText("Pour chaque semestre, vous pouvez ajouter des jours fériés ou des congés. Ces jours sont pris en compte dans le Planner et lors de la planification des affectations."),
        bulletItem("Cliquez sur le bouton Jours fériés d'un semestre."),
        bulletItem("Ajoutez la date et une description (ex. : Noël, Congé de printemps)."),
        bodyText(""),
        infoBox([
            "ℹ  Les affectations ne peuvent pas être planifiées sur des jours marqués comme fériés.",
        ]),
        pageBreak(),
    ];

    const chapter10 = [
        chapterTitle("10.  Administration", HeadingLevel.HEADING_1),
        bodyText("Le panneau d'administration est réservé aux utilisateurs avec le rôle Administrateur. Il permet de gérer les comptes utilisateurs de l'application."),
        bodyText(""),
        buildImageParagraph(shots["admin"]),
        captionParagraph("Figure 10 — Panneau d'administration"),
        bodyText(""),
        chapterTitle("10.1  Gestion des utilisateurs", HeadingLevel.HEADING_2),
        bodyText("La liste affiche tous les comptes enregistrés avec leur courriel, nom, prénom, rôle et date de création."),
        bodyText(""),
        chapterTitle("10.2  Créer un compte utilisateur", HeadingLevel.HEADING_2),
        bulletItem("Cliquez sur Ajouter un utilisateur."),
        bulletItem("Remplissez les champs : courriel, nom, prénom, mot de passe, rôle."),
        bulletItem("Validez pour créer le compte."),
        bodyText(""),
        chapterTitle("10.3  Modifier le rôle d'un utilisateur", HeadingLevel.HEADING_2),
        bulletItem("Cliquez sur le bouton Modifier le rôle de l'utilisateur concerné."),
        bulletItem("Choisissez le nouveau rôle (user ou admin)."),
        bulletItem("Confirmez la modification."),
        bodyText(""),
        chapterTitle("10.4  Supprimer un compte", HeadingLevel.HEADING_2),
        bulletItem("Cliquez sur l'icône Supprimer."),
        bulletItem("Confirmez la suppression dans la boîte de dialogue."),
        bodyText(""),
        infoBox([
            "⚠  Un administrateur ne peut pas supprimer son propre compte. La suppression est définitive.",
        ]),
        pageBreak(),
    ];

    const chapterGlossaire = [
        chapterTitle("Annexe — Glossaire", HeadingLevel.HEADING_1),
        infoBox([
            "Affectation  —  Association entre un cours, un professeur, une salle, un semestre, une date et une plage horaire.",
            "Charge horaire  —  Nombre total d'heures enseignées par un professeur sur une période donnée.",
            "Conflit  —  Situation où une salle ou un professeur est déjà réservé sur un créneau donné.",
            "KPI  —  Key Performance Indicator. Indicateur clé de performance affiché sur le tableau de bord.",
            "Plage horaire  —  Intervalle de temps représentant un cours (ex. : 08h00–10h00).",
            "Semestre  —  Période académique définie par une date de début et une date de fin (ex. : Hiver 2026).",
        ]),
        bodyText(""),
    ];

    const sections = [
        {
            properties: {},
            children: [
                ...coverChildren,
                ...chapter1,
                ...chapter2,
                ...chapter3,
                ...chapter4,
                ...chapter5,
                ...chapter6,
                ...chapter7,
                ...chapter8,
                ...chapter9,
                ...chapter10,
                ...chapterGlossaire,
            ],
        },
    ];

    return new Document({
        creator: "EPlanify — Projet intégrateur La Cité",
        title: "Manuel d'utilisation EPlanify",
        description: "Manuel d'utilisation de l'application de gestion des horaires EPlanify",
        styles: {
            default: {
                document: {
                    run: { font: "Calibri", size: 22, color: TEXT_COLOR },
                    paragraph: { spacing: { line: 276 } },
                },
            },
        },
        sections,
    });
}

// ─── ÉTAPE 5 : CONVERTIR EN PDF ───────────────────────────────────────────────

function convertToPDF(docxPath, outputDir) {
    const candidates = [
        "soffice",
        "libreoffice",
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    ];
    for (const cmd of candidates) {
        try {
            execSync(`"${cmd}" --headless --convert-to pdf --outdir "${outputDir}" "${docxPath}"`, {
                stdio: "pipe",
                timeout: 60000,
            });
            log("PDF généré avec LibreOffice.");
            return true;
        } catch {}
    }
    log("⚠  LibreOffice non trouvé. Ouvrez le .docx dans Microsoft Word et exportez manuellement en PDF (Fichier → Exporter → PDF).");
    return false;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log("\n════════════════════════════════════════════");
    console.log("  📄  Génération du Manuel EPlanify");
    console.log("════════════════════════════════════════════\n");

    ensureDir(SCREENSHOTS_DIR);

    const prisma = new PrismaClient();
    let serverProcess = null;
    let browser = null;

    let shots = {};

    try {
        // 1. Compte admin temporaire
        await createTempAdmin(prisma);

        // 2. Démarrer le serveur
        serverProcess = startServer();
        log("Attente du démarrage du serveur...");
        await wait(4000);

        // 3. Lancer Puppeteer
        log("Lancement de Puppeteer...");
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
            defaultViewport: { width: 1440, height: 900 },
        });
        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");

        // 4. Captures d'écran
        log("Capture des écrans...");
        shots = await takeScreenshots(browser, page);
        log(`${Object.keys(shots).length} captures effectuées.`);
    } catch (err) {
        console.error("\n❌  Erreur (phase captures) :", err.message);
    } finally {
        // Fermer le navigateur (ignorer les erreurs de permission Windows)
        if (browser) {
            try { await browser.close(); } catch {}
            browser = null;
        }
        // Arrêter le serveur
        if (serverProcess) {
            try { serverProcess.kill("SIGTERM"); } catch {}
            serverProcess = null;
        }
    }

    // 5. Supprimer le compte temporaire
    await deleteTempAdmin(prisma).catch(() => {});
    await prisma.$disconnect().catch(() => {});

    // 6. Construire le document Word (même si certaines captures ont échoué)
    if (Object.keys(shots).length === 0) {
        console.error("❌  Aucune capture disponible, abandon.");
        process.exit(1);
    }

    log("Construction du document Word...");
    const doc = buildDocument(shots);
    const buffer = await Packer.toBuffer(doc);
    const docxPath = resolve(ROOT, "manuel-utilisation-EPlanify.docx");
    fs.writeFileSync(docxPath, buffer);
    log(`✅  Word sauvegardé : ${docxPath}`);

    // 7. Convertir en PDF
    log("Conversion en PDF...");
    convertToPDF(docxPath, ROOT);

    // 8. Nettoyer les screenshots temporaires (ignorer les erreurs)
    try { cleanDir(SCREENSHOTS_DIR); } catch {}

    console.log("\n════════════════════════════════════════════");
    console.log("  ✅  Manuel généré avec succès !");
    console.log(`  📄  ${docxPath}`);
    const pdfPath = resolve(ROOT, "manuel-utilisation-EPlanify.pdf");
    if (fs.existsSync(pdfPath)) {
        console.log(`  📄  ${pdfPath}`);
    }
    console.log("════════════════════════════════════════════\n");
}

main();
