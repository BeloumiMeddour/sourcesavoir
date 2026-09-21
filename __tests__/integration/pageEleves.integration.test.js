/**
 * Page GET /eleves : droits d'accès et rendu réel (moteur Handlebars, layout, en-tête).
 * Vraie route de routes.js ; seuls Prisma et l'identification sont simulés :
 * le rôle est passé par l'en-tête x-role, avec les propriétés que pose Passport
 * (req.user et req.isAuthenticated). Aucune base de données n'est ouverte.
 */
import { jest } from "@jest/globals";
import path from "node:path";
import express from "express";
import session from "express-session";
import { engine } from "express-handlebars";
import request from "supertest";

jest.mock("@prisma/client", () => {
    const modele = () => ({
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    });
    const mockPrisma = { user: modele() };
    return { PrismaClient: jest.fn(() => mockPrisma) };
});

// Le service de courriel crée un transport nodemailer à l'import : inutile ici.
jest.mock("../../services/email.js", () => ({ envoyerEmailValidation: jest.fn() }));

import routes from "../../routes.js";
import { ROLES, exposerDroitsVues } from "../../middleware/permissions.js";

const creerApp = () => {
    const app = express();

    // Même moteur que server.js : layout main et partiels de views/
    app.engine("handlebars", engine());
    app.set("view engine", "handlebars");
    app.set("views", path.join(__dirname, "..", "..", "views"));

    app.use(express.json());
    app.use(session({ secret: "secret-de-test", resave: false, saveUninitialized: false }));
    app.use((req, _res, next) => {
        const role = req.get("x-role");
        req.isAuthenticated = () => role !== undefined;
        req.user =
            role === undefined
                ? undefined
                : { id: 1, email: `${role}@test.com`, role, etat: req.get("x-etat") ?? "valide" };
        // La connexion réelle (POST /connexion) pose aussi ces deux valeurs dans la session :
        // les anciennes pages en tirent l'affichage du menu
        if (req.user) {
            req.session.user_email = req.user.email;
            req.session.user_role = req.user.role;
        }
        next();
    });
    app.use(exposerDroitsVues);
    app.use(routes);
    return app;
};

const lienEleves = /href="\/eleves"/g;

describe("GET /eleves", () => {
    const app = creerApp();
    const page = (role, etat) => {
        const req = request(app).get("/eleves");
        if (role) req.set("x-role", role);
        if (etat) req.set("x-etat", etat);
        return req;
    };

    test("redirige un visiteur non connecté vers la page de connexion", async () => {
        const res = await page();
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/connexion");
    });

    test.each([ROLES.ADMIN, ROLES.RESPONSABLE])("affiche la page à %s", async (role) => {
        const res = await page(role);
        expect(res.status).toBe(200);
        expect(res.text).toContain("<title>Élèves | Planify</title>");
        expect(res.text).toContain("Gestion des Élèves");
        expect(res.text).toContain('id="form-eleve"');
        expect(res.text).toContain('id="table-eleves"');
    });

    test.each([ROLES.ADMIN, ROLES.RESPONSABLE])("charge le script de la page pour %s", async (role) => {
        const res = await page(role);
        expect(res.text).toContain('<script type="module" src="./js/eleves.js"></script>');
    });

    test.each([ROLES.ADMIN, ROLES.RESPONSABLE])("le lien du menu apparaît une seule fois pour %s", async (role) => {
        const res = await page(role);
        expect(res.text.match(lienEleves)).toHaveLength(1);
    });

    test("seul l'administrateur voit l'étiquette « Administrateur »", async () => {
        expect((await page(ROLES.ADMIN)).text).toContain("Administrateur");
        expect((await page(ROLES.RESPONSABLE)).text).not.toContain("sidebar-role");
    });

    test.each([ROLES.USER, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.ELEVE])("refuse la page à %s (403)", async (role) => {
        const res = await page(role);
        expect(res.status).toBe(403);
        expect(res.text).not.toContain("Gestion des Élèves");
    });

    test.each([ROLES.ADMIN, ROLES.RESPONSABLE])("refuse %s dont le compte n'est pas validé (403)", async (role) => {
        const res = await page(role, "en_attente");
        expect(res.status).toBe(403);
    });

    test("un rôle inconnu est refusé (403)", async () => {
        expect((await page("pirate")).status).toBe(403);
    });
});

describe("lien « Gestion des Élèves » dans le menu des autres pages", () => {
    const app = creerApp();
    const salles = (role) => request(app).get("/salles").set("x-role", role);

    test.each([ROLES.ADMIN, ROLES.RESPONSABLE])("est proposé à %s", async (role) => {
        const res = await salles(role);
        expect(res.status).toBe(200);
        expect(res.text.match(lienEleves)).toHaveLength(1);
    });

    test("n'est pas proposé au rôle historique user", async () => {
        const res = await salles(ROLES.USER);
        expect(res.status).toBe(200);
        expect(res.text).not.toMatch(lienEleves);
    });

    test("n'est pas proposé à un responsable dont le compte n'est pas validé", async () => {
        const res = await request(app).get("/salles").set("x-role", ROLES.RESPONSABLE).set("x-etat", "en_attente");
        expect(res.text).not.toMatch(lienEleves);
    });
});
