import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";

// ─── Couleurs & Polices ────────────────────────────────────────
const VERT_FONCE = "1B4332";
const VERT_MOYEN = "2D6A4F";
const VERT_CLAIR = "D8F3DC";
const BLANC = "FFFFFF";
const NOIR = "1A1A1A";
const GRIS = "6B7280";
const GRIS_CLAIR = "F3F4F6";
const FONT = "Segoe UI";

// ─── Helpers ───────────────────────────────────────────────────
function addHeader(slide) {
    slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.6,
        fill: { color: VERT_FONCE },
    });
    slide.addText([
        { text: "LA CITÉ", options: { bold: true, color: BLANC, fontSize: 14, fontFace: FONT } },
        { text: "  •  ", options: { color: "E63946", fontSize: 14 } },
        { text: "EPlanify", options: { bold: true, color: BLANC, fontSize: 14, fontFace: FONT } },
    ], { x: 0.5, y: 0.1, w: 4, h: 0.4 });
}

function addTitle(slide, title) {
    slide.addText(title, {
        x: 0.6, y: 0.8, w: 11, h: 0.7,
        fontSize: 28, fontFace: FONT, bold: true, color: NOIR,
    });
    slide.addShape(pptx.ShapeType.line, {
        x: 0.6, y: 1.5, w: 11.5, h: 0,
        line: { color: VERT_CLAIR, width: 1.5 },
    });
}

function addNote(slide, text) {
    slide.addText(text, {
        x: 0.6, y: 7.0, w: 11.5, h: 0.35,
        fontSize: 9, fontFace: FONT, color: GRIS, italic: true,
    });
}

function addCard(slide, x, y, w, h, items, title) {
    slide.addShape(pptx.ShapeType.roundRect, {
        x, y, w, h, rectRadius: 0.1,
        fill: { color: GRIS_CLAIR }, line: { color: "E5E7EB", width: 0.5 },
    });
    let currentY = y + 0.15;
    if (title) {
        slide.addText(title, {
            x: x + 0.2, y: currentY, w: w - 0.4, h: 0.35,
            fontSize: 12, fontFace: FONT, bold: true, color: NOIR,
        });
        currentY += 0.35;
    }
    items.forEach((item) => {
        slide.addText([
            { text: "✓ ", options: { color: VERT_MOYEN, bold: true } },
            { text: item.title, options: { bold: true, fontSize: 10.5, color: NOIR } },
            item.desc ? { text: "\n   " + item.desc, options: { fontSize: 9, color: GRIS } } : { text: "" },
        ], {
            x: x + 0.2, y: currentY, w: w - 0.4, h: item.desc ? 0.55 : 0.35,
            fontFace: FONT, valign: "top",
        });
        currentY += item.desc ? 0.55 : 0.38;
    });
}

// ═══════════════════════════════════════════════════════════════
// PAGE 1 — Couverture
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: "100%",
        fill: { color: VERT_FONCE },
    });
    addHeader(slide);

    slide.addText("EPlanify", {
        x: 0.6, y: 2.0, w: 8, h: 1.2,
        fontSize: 54, fontFace: FONT, bold: true, color: BLANC,
    });
    slide.addText("Application de gestion des horaires", {
        x: 0.6, y: 3.3, w: 10, h: 0.6,
        fontSize: 22, fontFace: FONT, bold: true, color: BLANC,
    });
    slide.addText("Collège La Cité — Institut des Technologies, des Arts et Communications (ITAC)", {
        x: 0.6, y: 4.1, w: 10, h: 0.5,
        fontSize: 13, fontFace: FONT, color: BLANC,
    });
    // Badge année
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 5.8, w: 1.2, h: 0.5, rectRadius: 0.1,
        fill: { color: BLANC },
    });
    slide.addText("2026", {
        x: 0.6, y: 5.8, w: 1.2, h: 0.5,
        fontSize: 14, fontFace: FONT, bold: true, color: NOIR, align: "center", valign: "middle",
    });
    slide.addText("Projet académique — Présentation de soutenance", {
        x: 0.6, y: 6.5, w: 6, h: 0.35,
        fontSize: 10, fontFace: FONT, color: BLANC,
    });
}

// ═══════════════════════════════════════════════════════════════
// PAGE 2 — Contexte & Problématique
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Contexte & Problématique");

    // Contexte
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 1.8, w: 5.5, h: 3.5, rectRadius: 0.1,
        fill: { color: GRIS_CLAIR },
    });
    slide.addText("Contexte", {
        x: 0.9, y: 1.95, w: 5, h: 0.4,
        fontSize: 14, fontFace: FONT, bold: true, color: NOIR,
    });
    slide.addText(
        "Le Collège La Cité — Institut des Technologies, des Arts et Communications (ITAC) — souhaite moderniser la gestion des emplois du temps afin d'améliorer la visibilité, la coordination et la fiabilité de la planification.",
        {
            x: 0.9, y: 2.4, w: 5, h: 1.2,
            fontSize: 11, fontFace: FONT, color: GRIS,
        }
    );
    const contexteItems = [
        "Centraliser l'information (cours, professeurs, salles, affectations)",
        "Réagir rapidement aux changements de dernière minute",
        "Améliorer la visibilité et la qualité des décisions",
    ];
    contexteItems.forEach((item, i) => {
        slide.addText([
            { text: "➤ ", options: { color: VERT_MOYEN } },
            { text: item, options: { fontSize: 10, color: NOIR } },
        ], { x: 0.9, y: 3.7 + i * 0.38, w: 5, h: 0.35, fontFace: FONT });
    });

    // Problèmes actuels
    const problemes = [
        { title: "Planification manuelle chronophage", desc: "Saisie répétitive et risques d'erreur" },
        { title: "Conflits d'horaires fréquents", desc: "Cours, professeurs et salles en chevauchement" },
        { title: "Gestion des ressources inefficace", desc: "Manque de visibilité sur l'occupation" },
        { title: "Difficulté d'adaptation aux changements", desc: "Salles, professeurs, semestres, imprévus" },
    ];
    addCard(slide, 6.5, 1.8, 5.7, 3.5, problemes, "Problèmes actuels");

    addNote(slide, "Constat : une solution centralisée et automatisée est nécessaire pour fiabiliser la planification.");
}

// ═══════════════════════════════════════════════════════════════
// PAGE 3 — Objectifs du projet
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Objectifs du projet");

    // Objectif principal
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 1.8, w: 11.5, h: 1.0, rectRadius: 0.1,
        fill: { color: GRIS_CLAIR },
    });
    slide.addText("OBJECTIF PRINCIPAL", {
        x: 0.9, y: 1.85, w: 5, h: 0.3,
        fontSize: 10, fontFace: FONT, bold: true, color: GRIS,
    });
    slide.addText("Développer une application web de gestion des horaires pour centraliser, automatiser et fiabiliser la planification.", {
        x: 0.9, y: 2.15, w: 10.5, h: 0.55,
        fontSize: 14, fontFace: FONT, bold: true, color: NOIR,
    });

    // Objectifs spécifiques
    slide.addText("Objectifs spécifiques", {
        x: 0.6, y: 3.1, w: 5, h: 0.4,
        fontSize: 14, fontFace: FONT, bold: true, color: NOIR,
    });

    const objGauche = [
        { title: "Optimiser la planification des cours", desc: "Saisie rapide, organisation par semestre et programme" },
        { title: "Prévenir automatiquement les conflits", desc: "Détection des chevauchements prof/salle/créneau" },
        { title: "Gérer efficacement les ressources", desc: "Salles, cours, professeurs, affectations" },
    ];
    addCard(slide, 0.6, 3.5, 5.5, 3.0, objGauche);

    const objDroite = [
        { title: "Garantir l'accessibilité via navigateur", desc: "Interface responsive, usage multi-postes" },
        { title: "Assurer la sécurité des données", desc: "Authentification, rôles, chiffrement et validation" },
    ];
    addCard(slide, 6.5, 3.5, 5.7, 2.2, objDroite);

    addNote(slide, "Résultat attendu : une planification plus fiable, plus rapide et plus transparente pour l'ITAC.");
}

// ═══════════════════════════════════════════════════════════════
// PAGE 4 — Phases du projet & Planning (CORRIGÉ)
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Phases du projet & Planning");

    slide.addText([
        { text: "Déroulement du projet EPlanify : " },
        { text: "jalons", options: { bold: true } },
        { text: ", livrables et suivi via " },
        { text: "Jira", options: { bold: true } },
        { text: "." },
    ], { x: 0.6, y: 1.7, w: 11, h: 0.4, fontSize: 12, fontFace: FONT, color: NOIR });

    const phases = [
        {
            num: "PHASE 1", title: "Initialisation &\ncadrage",
            items: ["Besoins & périmètre", "Acteurs & rôles", "Backlog initial", "Risques & contraintes"],
        },
        {
            num: "PHASE 2", title: "Conception",
            items: ["UML & modèle de données", "Architecture API & sécurité", "UX / maquettes UI", "Critères de validation"],
        },
        {
            num: "PHASE 3", title: "Développement",
            // CORRIGÉ : Handlebars au lieu de React.js
            items: ["Frontend : Handlebars + JS", "Backend : Node.js / Express", "BDD : SQL Server", "API REST + règles métier", "Intégration continue (workflow)"],
        },
        {
            num: "PHASE 4", title: "Tests &\nvalidation",
            items: ["Tests unitaires + intégration", "Validation conflits d'horaires", "Ajustements & stabilisation", "Préparation soutenance"],
        },
    ];

    phases.forEach((phase, i) => {
        const x = 0.6 + i * 3.05;
        slide.addShape(pptx.ShapeType.roundRect, {
            x, y: 2.3, w: 2.8, h: 3.5, rectRadius: 0.1,
            fill: { color: GRIS_CLAIR }, line: { color: "E5E7EB", width: 0.5 },
        });
        slide.addText(phase.num, {
            x: x + 0.15, y: 2.4, w: 2.5, h: 0.25,
            fontSize: 8, fontFace: FONT, bold: true, color: VERT_MOYEN,
        });
        slide.addText(phase.title, {
            x: x + 0.15, y: 2.65, w: 2.5, h: 0.55,
            fontSize: 13, fontFace: FONT, bold: true, color: NOIR,
        });
        phase.items.forEach((item, j) => {
            slide.addText("• " + item, {
                x: x + 0.15, y: 3.3 + j * 0.35, w: 2.5, h: 0.3,
                fontSize: 9, fontFace: FONT, color: NOIR,
            });
        });
    });

    // Jira
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 6.1, w: 11.5, h: 0.65, rectRadius: 0.1,
        fill: { color: VERT_CLAIR },
    });
    slide.addText([
        { text: "Gestion de projet : Jira", options: { bold: true, fontSize: 11 } },
        { text: "\nSuivi des tickets, sprints, priorités et avancement (tableau Kanban + backlog).", options: { fontSize: 9, color: GRIS } },
    ], { x: 0.9, y: 6.15, w: 10, h: 0.55, fontFace: FONT, color: NOIR });

    addNote(slide, "La frise illustre une progression itérative : conception → développement → validation, avec ajustements continus.");
}

// ═══════════════════════════════════════════════════════════════
// PAGE 5 — Utilisateurs & Rôles
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Utilisateurs & Rôles");

    slide.addText([
        { text: "Deux profils principaux utilisent EPlanify : un " },
        { text: "Administrateur", options: { bold: true, underline: true } },
        { text: " pour la supervision et un " },
        { text: "Responsable administratif", options: { bold: true, underline: true } },
        { text: " pour les opérations quotidiennes." },
    ], { x: 0.6, y: 1.7, w: 11, h: 0.5, fontSize: 12, fontFace: FONT, color: NOIR });

    // Admin
    const adminItems = [
        { title: "Gestion des comptes et des rôles", desc: "Création, modification, désactivation, permissions" },
        { title: "Supervision globale", desc: "Paramètres système, audit et contrôle de cohérence" },
        { title: "Support & maintenance", desc: "Gestion des incidents et des accès" },
    ];
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 2.4, w: 5.5, h: 4.0, rectRadius: 0.1,
        fill: { color: GRIS_CLAIR },
    });
    slide.addText("Administrateur", {
        x: 0.9, y: 2.55, w: 5, h: 0.4,
        fontSize: 16, fontFace: FONT, bold: true, color: NOIR,
    });
    slide.addText("Rôle : contrôle d'accès & gouvernance", {
        x: 0.9, y: 2.95, w: 5, h: 0.3,
        fontSize: 9, fontFace: FONT, color: GRIS,
    });
    slide.addText("RESPONSABILITÉS", {
        x: 0.9, y: 3.4, w: 5, h: 0.3,
        fontSize: 9, fontFace: FONT, bold: true, color: VERT_MOYEN,
    });
    adminItems.forEach((item, i) => {
        slide.addText([
            { text: "✓ ", options: { color: VERT_MOYEN, bold: true } },
            { text: item.title, options: { bold: true, fontSize: 10.5 } },
            { text: "\n   " + item.desc, options: { fontSize: 9, color: GRIS } },
        ], { x: 0.9, y: 3.75 + i * 0.65, w: 5, h: 0.6, fontFace: FONT, color: NOIR });
    });

    // Responsable
    const respItems = [
        { title: "Gestion des cours, salles et professeurs", desc: "Création, mise à jour, consultation des fiches" },
        { title: "Création des affectations", desc: "Association cours ↔ salle ↔ créneau ↔ professeur" },
        { title: "Suivi du planning", desc: "Validation, ajustements et export / impression" },
    ];
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.5, y: 2.4, w: 5.7, h: 4.0, rectRadius: 0.1,
        fill: { color: GRIS_CLAIR },
    });
    slide.addText("Responsable administratif", {
        x: 6.8, y: 2.55, w: 5, h: 0.4,
        fontSize: 16, fontFace: FONT, bold: true, color: NOIR,
    });
    slide.addText("Rôle : planification & opérations", {
        x: 6.8, y: 2.95, w: 5, h: 0.3,
        fontSize: 9, fontFace: FONT, color: GRIS,
    });
    slide.addText("RESPONSABILITÉS", {
        x: 6.8, y: 3.4, w: 5, h: 0.3,
        fontSize: 9, fontFace: FONT, bold: true, color: VERT_MOYEN,
    });
    respItems.forEach((item, i) => {
        slide.addText([
            { text: "✓ ", options: { color: VERT_MOYEN, bold: true } },
            { text: item.title, options: { bold: true, fontSize: 10.5 } },
            { text: "\n   " + item.desc, options: { fontSize: 9, color: GRIS } },
        ], { x: 6.8, y: 3.75 + i * 0.65, w: 5, h: 0.6, fontFace: FONT, color: NOIR });
    });

    addNote(slide, "Les permissions sont contrôlées par rôle afin de sécuriser l'accès et de simplifier l'usage au quotidien.");
}

// ═══════════════════════════════════════════════════════════════
// PAGE 6 — Architecture Technique (CORRIGÉ)
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Architecture Technique");

    // Stack technologique
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 1.8, w: 5.0, h: 4.8, rectRadius: 0.1,
        fill: { color: GRIS_CLAIR },
    });
    slide.addText("STACK TECHNOLOGIQUE", {
        x: 0.9, y: 1.95, w: 4, h: 0.3,
        fontSize: 11, fontFace: FONT, bold: true, color: NOIR,
    });

    // CORRIGÉ : Handlebars au lieu de React.js
    const stack = [
        { title: "Frontend — Handlebars + JS vanilla", desc: "Rendu côté serveur (SSR), scripts modulaires", color: VERT_CLAIR },
        { title: "Backend — Node.js / Express.js", desc: "API REST, logique métier, validations", color: VERT_CLAIR },
        { title: "ORM — Prisma", desc: "Mapping objet-relationnel, migrations, typage", color: VERT_CLAIR },
        { title: "BDD — Microsoft SQL Server", desc: "Données structurées, requêtes et intégrité", color: VERT_CLAIR },
        // CORRIGÉ : Passport + Sessions au lieu de JWT
        { title: "Sécurité : Passport.js • Sessions • bcrypt", desc: "Auth par sessions, chiffrement mots de passe", color: VERT_CLAIR },
    ];
    stack.forEach((item, i) => {
        slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.9, y: 2.4 + i * 0.8, w: 4.4, h: 0.7, rectRadius: 0.08,
            fill: { color: item.color }, line: { color: "B7E4C7", width: 0.5 },
        });
        slide.addText([
            { text: item.title, options: { bold: true, fontSize: 10, color: NOIR } },
            { text: "\n" + item.desc, options: { fontSize: 8.5, color: GRIS } },
        ], { x: 1.1, y: 2.42 + i * 0.8, w: 4, h: 0.65, fontFace: FONT });
    });

    // Architecture en couches
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.0, y: 1.8, w: 6.2, h: 4.8, rectRadius: 0.1,
        fill: { color: GRIS_CLAIR },
    });
    slide.addText("ARCHITECTURE EN COUCHES", {
        x: 6.3, y: 1.95, w: 5, h: 0.3,
        fontSize: 11, fontFace: FONT, bold: true, color: NOIR,
    });

    // CORRIGÉ : Handlebars au lieu de React
    const couches = [
        { title: "Client Web", desc: "Handlebars (SSR) — interface, formulaires, filtres, vues calendrier" },
        { title: "API (Serveur)", desc: "Node.js / Express.js — endpoints REST, règles de conflits" },
        { title: "ORM", desc: "Prisma — abstraction SQL, migrations, relations" },
        { title: "Base de données", desc: "SQL Server — cours, salles, professeurs, semestres, affectations" },
    ];
    couches.forEach((item, i) => {
        slide.addShape(pptx.ShapeType.roundRect, {
            x: 6.5, y: 2.4 + i * 1.0, w: 5.2, h: 0.75, rectRadius: 0.08,
            fill: { color: BLANC }, line: { color: "E5E7EB", width: 0.5 },
        });
        slide.addText([
            { text: item.title, options: { bold: true, fontSize: 11, color: NOIR } },
            { text: "\n" + item.desc, options: { fontSize: 8.5, color: GRIS } },
        ], { x: 6.7, y: 2.42 + i * 1.0, w: 4.8, h: 0.7, fontFace: FONT });

        if (i < couches.length - 1) {
            slide.addText("↓", {
                x: 8.8, y: 3.15 + i * 1.0, w: 0.5, h: 0.25,
                fontSize: 14, fontFace: FONT, color: VERT_MOYEN, align: "center",
            });
        }
    });

    // Badge API RESTful
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 10.2, y: 3.2, w: 1.3, h: 0.4, rectRadius: 0.08,
        fill: { color: VERT_CLAIR },
    });
    slide.addText("API RESTful", {
        x: 10.2, y: 3.2, w: 1.3, h: 0.4,
        fontSize: 8, fontFace: FONT, bold: true, color: VERT_FONCE, align: "center", valign: "middle",
    });

    // Note sécurité en bas — CORRIGÉ
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 6.8, w: 11.5, h: 0.45, rectRadius: 0.08,
        fill: { color: VERT_CLAIR },
    });
    slide.addText("🔒 Les accès sont sécurisés par Passport.js (sessions + cookies) et les mots de passe chiffrés avec bcrypt.", {
        x: 0.9, y: 6.82, w: 11, h: 0.4,
        fontSize: 9, fontFace: FONT, color: VERT_FONCE,
    });
}

// ═══════════════════════════════════════════════════════════════
// PAGE 7 — Fonctionnalités principales
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Fonctionnalités principales");

    slide.addText([
        { text: "EPlanify s'articule autour de " },
        { text: "6 modules", options: { bold: true } },
        { text: " conçus pour couvrir l'ensemble du cycle de planification." },
    ], { x: 0.6, y: 1.7, w: 11, h: 0.4, fontSize: 12, fontFace: FONT, color: NOIR });

    const modules = [
        { title: "Gestion des Cours", desc: "Créer et maintenir les fiches de cours (code, durée, programme) avec des données centralisées." },
        { title: "Gestion des Salles", desc: "Définir les salles (capacité, type, équipements) et faciliter l'allocation des ressources." },
        { title: "Gestion des Professeurs", desc: "Gérer les profils, disponibilités et affectations afin d'équilibrer la charge d'enseignement." },
        { title: "Gestion des Affectations", desc: "Associer cours ↔ salle ↔ créneau ↔ professeur avec contrôle automatique des conflits." },
        { title: "Planner (Emploi du temps)", desc: "Visualiser l'horaire en vue hebdomadaire avec filtres, navigation et export / impression." },
        { title: "Gestion des Comptes", desc: "Administrer utilisateurs, rôles et permissions pour sécuriser l'accès à l'application." },
    ];

    modules.forEach((mod, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 0.6 + col * 3.9;
        const y = 2.3 + row * 2.3;

        slide.addShape(pptx.ShapeType.roundRect, {
            x, y, w: 3.6, h: 2.0, rectRadius: 0.1,
            fill: { color: GRIS_CLAIR }, line: { color: "E5E7EB", width: 0.5 },
        });
        slide.addText(mod.title, {
            x: x + 0.2, y: y + 0.15, w: 3.2, h: 0.4,
            fontSize: 12, fontFace: FONT, bold: true, color: NOIR,
        });
        slide.addText(mod.desc, {
            x: x + 0.2, y: y + 0.65, w: 3.2, h: 1.1,
            fontSize: 9.5, fontFace: FONT, color: GRIS,
        });
    });

    addNote(slide, "Chaque module est conçu pour être cohérent, réutilisable et aligné sur les besoins de planification de l'ITAC.");
}

// ═══════════════════════════════════════════════════════════════
// PAGE 8 — Module Gestion des Affectations
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Module : Gestion des Affectations");

    // But du module
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 1.8, w: 11.5, h: 0.8, rectRadius: 0.1,
        fill: { color: VERT_CLAIR },
    });
    slide.addText([
        { text: "But du module\n", options: { bold: true, fontSize: 11 } },
        { text: "Centraliser les associations ", options: { fontSize: 10 } },
        { text: "cours ↔ salle ↔ créneau ↔ professeur", options: { bold: true, fontSize: 10 } },
        { text: " et sécuriser la planification grâce à des contrôles automatiques.", options: { fontSize: 10 } },
    ], { x: 0.9, y: 1.85, w: 11, h: 0.7, fontFace: FONT, color: NOIR });

    // Capacités clés
    const capacites = [
        { title: "Affecter un cours à une salle et une plage horaire", desc: "Création rapide d'une affectation (jour, heure, durée)" },
        { title: "Affecter un professeur à un cours", desc: "Association enseignant ↔ cours, avec visibilité sur la charge" },
        { title: "Vérification automatique des conflits", desc: "Chevauchements prof/salle/créneau détectés avant validation" },
        { title: "Compatibilité type de salle / besoins du cours", desc: "Capacité, équipements, type (lab, classe, etc.)" },
        { title: "Avertissements et alternatives", desc: "Suggestions de créneaux ou de salles disponibles en cas de blocage" },
    ];
    addCard(slide, 0.6, 2.9, 6.5, 4.0, capacites, "CAPACITÉS CLÉS");

    // Flux
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 7.5, y: 2.9, w: 4.7, h: 4.0, rectRadius: 0.1,
        fill: { color: GRIS_CLAIR },
    });
    slide.addText("Flux d'affectation", {
        x: 7.8, y: 3.05, w: 4, h: 0.35,
        fontSize: 12, fontFace: FONT, bold: true, color: NOIR,
    });
    const flux = [
        { title: "Choisir le cours", desc: "Code, programme, semestre" },
        { title: "Sélectionner salle + créneau", desc: "Type, capacité, jour/heure" },
        { title: "Moteur de validation", desc: "Conflits + compatibilités vérifiés en temps réel" },
    ];
    flux.forEach((item, i) => {
        slide.addShape(pptx.ShapeType.roundRect, {
            x: 7.8, y: 3.5 + i * 1.1, w: 4.1, h: 0.8, rectRadius: 0.08,
            fill: { color: BLANC },
        });
        slide.addText([
            { text: item.title, options: { bold: true, fontSize: 10.5, color: NOIR } },
            { text: "\n" + item.desc, options: { fontSize: 8.5, color: GRIS } },
        ], { x: 8.0, y: 3.52 + i * 1.1, w: 3.7, h: 0.75, fontFace: FONT });

        if (i < flux.length - 1) {
            slide.addText("↓", {
                x: 9.6, y: 4.3 + i * 1.1, w: 0.5, h: 0.25,
                fontSize: 14, fontFace: FONT, color: VERT_MOYEN, align: "center",
            });
        }
    });

    addNote(slide, "Impact : une planification plus fiable grâce à des contrôles systématiques avant l'enregistrement des affectations.");
}

// ═══════════════════════════════════════════════════════════════
// PAGE 9 — Module Planner
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Module : Planner (Emploi du temps)");

    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 1.8, w: 11.5, h: 0.8, rectRadius: 0.1,
        fill: { color: VERT_CLAIR },
    });
    slide.addText([
        { text: "But du module\n", options: { bold: true, fontSize: 11 } },
        { text: "Offrir une ", options: { fontSize: 10 } },
        { text: "vue hebdomadaire", options: { bold: true, fontSize: 10 } },
        { text: " claire du planning avec filtres, navigation et options d'export.", options: { fontSize: 10 } },
    ], { x: 0.9, y: 1.85, w: 11, h: 0.7, fontFace: FONT, color: NOIR });

    // Fonctionnalités
    const fonctions = [
        { title: "Calendrier hebdomadaire", desc: "Vue claire, responsive, lecture rapide des créneaux" },
        { title: "Filtres avancés", desc: "Semestre • Programme • Professeur • Salle" },
        { title: "Navigation semaine par semaine", desc: "Aller/retour rapide, contexte conservé" },
        { title: "Export / impression", desc: "Partage et archivage du planning" },
    ];
    addCard(slide, 0.6, 2.9, 5.5, 3.5, fonctions, "FONCTIONNALITÉS");

    // Maquette calendrier
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.5, y: 2.9, w: 5.7, h: 3.5, rectRadius: 0.1,
        fill: { color: BLANC }, line: { color: "E5E7EB", width: 0.5 },
    });
    slide.addText("Semaine 12 — Extrait d'affichage", {
        x: 6.8, y: 3.0, w: 5, h: 0.3,
        fontSize: 10, fontFace: FONT, bold: true, color: NOIR,
    });
    const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
    jours.forEach((j, i) => {
        slide.addText(j, {
            x: 6.9 + i * 1.0, y: 3.4, w: 0.9, h: 0.3,
            fontSize: 9, fontFace: FONT, bold: true, color: GRIS, align: "center",
        });
    });
    // Exemples de créneaux
    const creneaux = [
        { code: "DEV-310", time: "08:30–10:30 • Lab A", x: 6.9, y: 3.8, w: 1.5 },
        { code: "UX-220", time: "10:30–12:00 • Salle 204", x: 8.5, y: 3.8, w: 1.5 },
        { code: "BD-140", time: "13:00–15:00 • Lab B", x: 6.9, y: 4.7, w: 1.8 },
    ];
    creneaux.forEach((c) => {
        slide.addShape(pptx.ShapeType.roundRect, {
            x: c.x, y: c.y, w: c.w, h: 0.65, rectRadius: 0.06,
            fill: { color: VERT_CLAIR },
        });
        slide.addText([
            { text: c.code, options: { bold: true, fontSize: 9, color: NOIR } },
            { text: "\n" + c.time, options: { fontSize: 7.5, color: GRIS } },
        ], { x: c.x + 0.1, y: c.y + 0.05, w: c.w - 0.2, h: 0.55, fontFace: FONT });
    });

    // Filtres en bas
    const filtres = ["Semestre", "Programme", "Professeur", "Salle"];
    filtres.forEach((f, i) => {
        slide.addShape(pptx.ShapeType.roundRect, {
            x: 6.8 + i * 1.3, y: 5.7, w: 1.15, h: 0.35, rectRadius: 0.06,
            fill: { color: GRIS_CLAIR },
        });
        slide.addText(f, {
            x: 6.8 + i * 1.3, y: 5.7, w: 1.15, h: 0.35,
            fontSize: 8, fontFace: FONT, bold: true, color: NOIR, align: "center", valign: "middle",
        });
    });

    addNote(slide, "Le Planner sert de point central pour consulter, valider et partager l'emploi du temps.");
}

// ═══════════════════════════════════════════════════════════════
// PAGE 10 — Tableau de bord (Dashboard)
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Tableau de bord (Dashboard)");

    slide.addText([
        { text: "Une vue d'ensemble instantanée du planning : " },
        { text: "KPIs", options: { bold: true } },
        { text: ", taux d'occupation et indicateurs de charge." },
    ], { x: 0.6, y: 1.7, w: 11, h: 0.4, fontSize: 12, fontFace: FONT, color: NOIR });

    // KPI cards
    const kpis = [
        { title: "COURS", desc: "Total de cours actifs (par semestre)" },
        { title: "PROFESSEURS", desc: "Enseignants planifiés / disponibles" },
        { title: "SALLES", desc: "Ressources disponibles (types & capacité)" },
        { title: "AFFECTATIONS", desc: "Cours placés dans l'horaire" },
    ];
    kpis.forEach((kpi, i) => {
        const x = 0.6 + i * 3.0;
        slide.addShape(pptx.ShapeType.roundRect, {
            x, y: 2.3, w: 2.7, h: 1.2, rectRadius: 0.1,
            fill: { color: GRIS_CLAIR },
        });
        slide.addText(kpi.title, {
            x: x + 0.15, y: 2.4, w: 2.4, h: 0.3,
            fontSize: 9, fontFace: FONT, bold: true, color: VERT_MOYEN,
        });
        slide.addText("{—}", {
            x: x + 0.15, y: 2.7, w: 2.4, h: 0.35,
            fontSize: 18, fontFace: FONT, bold: true, color: NOIR,
        });
        slide.addText(kpi.desc, {
            x: x + 0.15, y: 3.1, w: 2.4, h: 0.3,
            fontSize: 8, fontFace: FONT, color: GRIS,
        });
    });

    // Indicateurs supplémentaires
    const indicators = [
        { title: "Occupation des créneaux (hebdomadaire)", desc: "Synthèse visuelle par jour de la semaine" },
        { title: "Charge des professeurs", desc: "Suivi hebdo des heures / affectations" },
        { title: "Occupation des salles", desc: "Taux d'utilisation" },
        { title: "Complétion du planning", desc: "Cours planifiés vs total" },
    ];
    indicators.forEach((ind, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 0.6 + col * 6.0;
        const y = 3.9 + row * 1.3;

        slide.addShape(pptx.ShapeType.roundRect, {
            x, y, w: 5.7, h: 1.0, rectRadius: 0.08,
            fill: { color: GRIS_CLAIR },
        });
        slide.addText([
            { text: ind.title, options: { bold: true, fontSize: 10, color: NOIR } },
            { text: "\n" + ind.desc, options: { fontSize: 8.5, color: GRIS } },
        ], { x: x + 0.2, y: y + 0.05, w: 5.3, h: 0.9, fontFace: FONT });
    });

    addNote(slide, "Les valeurs affichées peuvent être calculées par semestre/programme via filtres (ex. pour la semaine courante).");
}

// ═══════════════════════════════════════════════════════════════
// PAGE 11 — Sécurité (CORRIGÉ)
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Sécurité");

    slide.addText([
        { text: "EPlanify applique des mesures de " },
        { text: "sécurité applicative", options: { bold: true, underline: true } },
        { text: " pour protéger l'accès, les données et les échanges réseau." },
    ], { x: 0.6, y: 1.7, w: 11, h: 0.4, fontSize: 12, fontFace: FONT, color: NOIR });

    // CORRIGÉ : Passport + sessions au lieu de JWT
    const mesures = [
        { title: "Authentification via Passport.js", desc: "Sessions stateful côté serveur, cookies sécurisés, expiration configurée" },
        { title: "Hachage des mots de passe (bcrypt)", desc: "Stockage sécurisé avec salage + coût configuré" },
        { title: "Rôles & permissions granulaires", desc: "Accès contrôlé selon le profil (admin / responsable)" },
        { title: "HTTPS / communications chiffrées", desc: "Chiffrement en transit pour protéger identifiants et données" },
        { title: "Validation des entrées (anti-injection SQL, XSS)", desc: "Prisma ORM + Helmet CSP + règles de validation côté API" },
    ];
    addCard(slide, 0.6, 2.1, 6.5, 4.5, mesures, "MESURES CLÉS");

    // Approche
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 7.5, y: 2.1, w: 4.7, h: 4.5, rectRadius: 0.1,
        fill: { color: GRIS_CLAIR },
    });
    slide.addText("Approche", {
        x: 7.8, y: 2.25, w: 4, h: 0.35,
        fontSize: 13, fontFace: FONT, bold: true, color: NOIR,
    });
    slide.addText("Défense en profondeur", {
        x: 7.8, y: 2.6, w: 4, h: 0.3,
        fontSize: 10, fontFace: FONT, color: GRIS,
    });

    // CORRIGÉ : niveaux de sécurité
    const niveaux = [
        { title: "Niveau 1 — Accès", desc: "Passport.js + rôles + permissions" },
        { title: "Niveau 2 — Transport", desc: "HTTPS pour chiffrer les échanges" },
        { title: "Niveau 3 — Données", desc: "bcrypt + Prisma ORM + validation des entrées" },
    ];
    niveaux.forEach((n, i) => {
        slide.addShape(pptx.ShapeType.roundRect, {
            x: 7.8, y: 3.1 + i * 1.1, w: 4.1, h: 0.85, rectRadius: 0.08,
            fill: { color: VERT_CLAIR },
        });
        slide.addText([
            { text: n.title, options: { bold: true, fontSize: 10.5, color: NOIR } },
            { text: "\n" + n.desc, options: { fontSize: 8.5, color: GRIS } },
        ], { x: 8.0, y: 3.12 + i * 1.1, w: 3.7, h: 0.8, fontFace: FONT });
    });

    addNote(slide, "Ces mesures réduisent les risques d'accès non autorisé, de fuite de données et de vulnérabilités courantes (OWASP).");
}

// ═══════════════════════════════════════════════════════════════
// PAGE 12 — Conclusion & Perspectives (CORRIGÉ)
// ═══════════════════════════════════════════════════════════════
{
    const slide = pptx.addSlide();
    addHeader(slide);
    addTitle(slide, "Conclusion & Perspectives");

    // Synthèse
    slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 1.8, w: 11.5, h: 0.9, rectRadius: 0.1,
        fill: { color: VERT_CLAIR },
    });
    slide.addText([
        { text: "Synthèse\n", options: { bold: true, fontSize: 12 } },
        { text: "EPlanify est une ", options: { fontSize: 10.5 } },
        { text: "solution complète", options: { bold: true, fontSize: 10.5 } },
        { text: " et ", options: { fontSize: 10.5 } },
        { text: "moderne", options: { bold: true, fontSize: 10.5 } },
        { text: " pour gérer les horaires du Collège La Cité (ITAC) : planification, ressources, conflits et consultation centralisée.", options: { fontSize: 10.5 } },
    ], { x: 0.9, y: 1.85, w: 11, h: 0.8, fontFace: FONT, color: NOIR });

    // Points clés — CORRIGÉ
    const pointsCles = [
        { title: "Moins de planification manuelle", desc: "Centralise les données et accélère la création d'un planning cohérent." },
        { title: "Conflits d'horaires réduits", desc: "Contrôles automatiques (prof/salle/créneau) lors des affectations." },
        // CORRIGÉ : Handlebars + Passport au lieu de React + JWT
        { title: "Stack robuste & sécurisée", desc: "Handlebars + Node/Express + Prisma + SQL Server, Passport.js/bcrypt, rôles." },
        { title: "Évolutif & maintenable", desc: "Architecture API et modules prêts pour de futures intégrations." },
    ];
    addCard(slide, 0.6, 3.0, 5.5, 3.8, pointsCles, "POINTS CLÉS");

    // Perspectives
    const perspectives = [
        { title: "Intégrations institutionnelles (SIS / SSO)", desc: "Synchronisation des données + authentification centralisée." },
        { title: "Version mobile", desc: "Consultation rapide du planning et accès hors bureau." },
        { title: "Analytics avancés", desc: "Statistiques d'occupation, charge, tendances et prévisions." },
        { title: "Notifications", desc: "Alertes sur changements, conflits potentiels et validations." },
    ];
    addCard(slide, 6.5, 3.0, 5.7, 3.8, perspectives, "PERSPECTIVES");

    addNote(slide, "EPlanify pose une base solide pour une gestion d'horaires fiable, sécurisée et adaptable aux besoins futurs de l'ITAC.");
}

// ═══════════════════════════════════════════════════════════════
// Sauvegarde
// ═══════════════════════════════════════════════════════════════
const outputPath = "Presentation-EPLANIFY-corrigee.pptx";
pptx.writeFile({ fileName: outputPath })
    .then(() => console.log(`✅ Fichier créé : ${outputPath}`))
    .catch((err) => console.error("Erreur :", err));
