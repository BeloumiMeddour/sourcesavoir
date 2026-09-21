/**
 * Tests d'intégration des permissions.
 *
 * Vraie chaîne Express (session, Passport, gardeRoutesHeritees, routes.js)
 * pilotée par supertest ; seule la base de données (Prisma) et le rendu des
 * vues sont simulés. Aucune connexion à une base n'est ouverte.
 */
import { jest } from "@jest/globals";
import path from "node:path";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import bcrypt from "bcrypt";

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

import { PrismaClient } from "@prisma/client";
import "../../auth.js";
import routes from "../../routes.js";
import { ROLES, gardeRoutesHeritees } from "../../middleware/permissions.js";

const MOT_DE_PASSE = "MotDePasse123";
const ID_CIBLE = 99;

/**
 * Assemble les middlewares dans le même ordre que server.js.
 */
const creerApp = () => {
    const app = express();

    // Rendu simulé : on garde la résolution réelle des fichiers de views/
    app.engine("handlebars", (_chemin, _options, callback) => callback(null, "page"));
    app.set("view engine", "handlebars");
    app.set("views", path.join(__dirname, "..", "..", "views"));

    app.use(express.json());
    app.use(session({ secret: "secret-de-test", resave: false, saveUninitialized: false }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(gardeRoutesHeritees);
    app.use(routes);
    app.use((req, res) => res.status(404).send(`${req.originalUrl} Route introuvable.`));

    return app;
};

const bloque = (statut) => statut === 401 || statut === 403;

describe("Permissions (intégration)", () => {
    let app;
    let mockPrisma;
    let hash;
    let utilisateurs;

    const emailDe = (role) => `${role}@test.com`;

    const creerUtilisateur = (id, role, surcharge = {}) => ({
        id,
        email: emailDe(role),
        password: hash,
        role,
        etat: "valide",
        nom: "Tremblay",
        prenom: "Sophie",
        createdAt: new Date("2025-01-15T10:00:00Z"),
        ...surcharge,
    });

    const seConnecter = async (role) => {
        const agent = request.agent(app);
        const reponse = await agent.post("/connexion").send({ email: emailDe(role), password: MOT_DE_PASSE });
        expect(reponse.status).toBe(200);
        return agent;
    };

    const changerRoleEnBase = (role, nouveauRole) => {
        utilisateurs.find((u) => u.email === emailDe(role)).role = nouveauRole;
    };

    beforeAll(async () => {
        // Coût minimal pour garder les tests rapides
        hash = await bcrypt.hash(MOT_DE_PASSE, 4);
        app = creerApp();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();

        utilisateurs = [
            ...Object.values(ROLES).map((role, i) => creerUtilisateur(i + 1, role)),
            creerUtilisateur(ID_CIBLE, "user", { email: "cible@test.com" }),
        ];

        // Comme Prisma : sans "select" l'enregistrement complet, sinon les seuls champs demandés
        const projeter = (enregistrement, select) =>
            select
                ? Object.fromEntries(Object.keys(select).filter((k) => select[k]).map((k) => [k, enregistrement[k]]))
                : { ...enregistrement };

        mockPrisma.user.findUnique.mockImplementation(async ({ where, select }) => {
            const trouve = utilisateurs.find((u) =>
                where.email !== undefined ? u.email === where.email : u.id === where.id
            );
            return trouve ? projeter(trouve, select) : null;
        });
        mockPrisma.user.findMany.mockImplementation(async ({ select } = {}) =>
            utilisateurs.map((u) => projeter(u, select))
        );
        mockPrisma.user.update.mockImplementation(async ({ where, data, select }) => {
            const trouve = utilisateurs.find((u) => u.id === where.id);
            Object.assign(trouve, data);
            return projeter(trouve, select);
        });
    });

    describe("POST /connexion", () => {
        test("ne renvoie jamais le hash du mot de passe", async () => {
            const reponse = await request(app)
                .post("/connexion")
                .send({ email: emailDe(ROLES.ENSEIGNANT), password: MOT_DE_PASSE });

            expect(reponse.status).toBe(200);
            expect(reponse.body.msg).toBe("Connexion réussie");
            expect(reponse.body.utilisateur).toMatchObject({
                email: emailDe(ROLES.ENSEIGNANT),
                role: ROLES.ENSEIGNANT,
                etat: "valide",
            });
            expect(reponse.body.utilisateur).not.toHaveProperty("password");
            expect(JSON.stringify(reponse.body)).not.toContain(hash);
            expect(reponse.text).not.toContain(hash);
        });

        test("mauvais mot de passe : 401 sans fuite", async () => {
            const reponse = await request(app)
                .post("/connexion")
                .send({ email: emailDe(ROLES.ADMIN), password: "Incorrect123" });

            expect(reponse.status).toBe(401);
            expect(reponse.body).toEqual({ error: "identifiants_invalides" });
            expect(reponse.text).not.toContain(hash);
        });

        test("compte en attente : 401", async () => {
            utilisateurs.find((u) => u.email === emailDe(ROLES.PARENT)).etat = "en_attente";

            const reponse = await request(app)
                .post("/connexion")
                .send({ email: emailDe(ROLES.PARENT), password: MOT_DE_PASSE });

            expect(reponse.status).toBe(401);
            expect(reponse.body).toEqual({ error: "compte_en_attente" });
        });
    });

    describe("PUT /api/utilisateurs/:id/role", () => {
        test.each(Object.values(ROLES))("un admin peut attribuer le rôle %s", async (role) => {
            const agent = await seConnecter(ROLES.ADMIN);

            const reponse = await agent.put(`/api/utilisateurs/${ID_CIBLE}/role`).send({ role });

            expect(reponse.status).toBe(200);
            expect(reponse.body.user.role).toBe(role);
            expect(mockPrisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: ID_CIBLE }, data: { role } })
            );
        });

        test.each([
            ["superadmin"],
            ["Admin"],
            ["ENSEIGNANT"],
            ["enseignant "],
            [""],
            [null],
            [42],
            [["admin"]],
            [{ role: "admin" }],
        ])("un rôle invalide (%p) est refusé avec 400 et rien n'est écrit", async (role) => {
            const agent = await seConnecter(ROLES.ADMIN);

            const reponse = await agent.put(`/api/utilisateurs/${ID_CIBLE}/role`).send({ role });

            expect(reponse.status).toBe(400);
            expect(mockPrisma.user.update).not.toHaveBeenCalled();
        });

        test("l'absence de rôle dans le corps est refusée avec 400", async () => {
            const agent = await seConnecter(ROLES.ADMIN);

            const reponse = await agent.put(`/api/utilisateurs/${ID_CIBLE}/role`).send({});

            expect(reponse.status).toBe(400);
            expect(mockPrisma.user.update).not.toHaveBeenCalled();
        });

        test("le message d'erreur liste tous les rôles acceptés", async () => {
            const agent = await seConnecter(ROLES.ADMIN);

            const reponse = await agent.put(`/api/utilisateurs/${ID_CIBLE}/role`).send({ role: "superadmin" });

            expect(reponse.status).toBe(400);
            for (const role of Object.values(ROLES)) {
                expect(reponse.body.error).toContain(role);
            }
        });

        test.each([ROLES.RESPONSABLE, ROLES.USER, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.ELEVE])(
            "le rôle %s ne peut pas attribuer de rôle (403)",
            async (roleAppelant) => {
                const agent = await seConnecter(roleAppelant);

                const reponse = await agent
                    .put(`/api/utilisateurs/${ID_CIBLE}/role`)
                    .send({ role: ROLES.ADMIN });

                expect(reponse.status).toBe(403);
                expect(mockPrisma.user.update).not.toHaveBeenCalled();
            }
        );

        test("non authentifié : 401 JSON", async () => {
            const reponse = await request(app)
                .put(`/api/utilisateurs/${ID_CIBLE}/role`)
                .send({ role: ROLES.ENSEIGNANT });

            expect(reponse.status).toBe(401);
            expect(reponse.body).toHaveProperty("error");
            expect(mockPrisma.user.update).not.toHaveBeenCalled();
        });
    });

    describe("rôle relu en base à chaque requête (session ouverte)", () => {
        test("un admin rétrogradé perd immédiatement l'accès admin", async () => {
            const agent = await seConnecter(ROLES.ADMIN);
            expect((await agent.get("/api/utilisateurs")).status).toBe(200);

            changerRoleEnBase(ROLES.ADMIN, ROLES.USER);

            const reponse = await agent.get("/api/utilisateurs");
            expect(reponse.status).toBe(403);
            expect((await agent.get("/admin")).status).toBe(403);
        });

        test("un utilisateur promu admin obtient l'accès sans se reconnecter", async () => {
            const agent = await seConnecter(ROLES.USER);
            expect((await agent.get("/api/utilisateurs")).status).toBe(403);

            changerRoleEnBase(ROLES.USER, ROLES.ADMIN);

            expect((await agent.get("/api/utilisateurs")).status).toBe(200);
        });

        test("un utilisateur rétrogradé vers parent est bloqué sur l'héritage", async () => {
            const agent = await seConnecter(ROLES.USER);
            expect(bloque((await agent.post("/api/cours").send({})).status)).toBe(false);

            changerRoleEnBase(ROLES.USER, ROLES.PARENT);

            expect((await agent.post("/api/cours").send({})).status).toBe(403);
            expect((await agent.get("/api/cours")).status).toBe(403);
        });

        test("un compte supprimé en base perd sa session (401)", async () => {
            const agent = await seConnecter(ROLES.RESPONSABLE);
            expect(bloque((await agent.post("/api/cours").send({})).status)).toBe(false);

            utilisateurs = utilisateurs.filter((u) => u.email !== emailDe(ROLES.RESPONSABLE));

            const reponse = await agent.get("/api/cours");
            expect(reponse.status).toBe(401);
            expect(reponse.body).toHaveProperty("error");
        });

        test("aucune requête ne fait ressortir le hash du mot de passe", async () => {
            const agent = await seConnecter(ROLES.ADMIN);

            const reponses = [
                await agent.get("/api/utilisateurs"),
                await agent.get(`/api/utilisateurs/${ID_CIBLE}`),
                await agent.get("/admin"),
            ];

            for (const reponse of reponses) {
                expect(reponse.text).not.toContain(hash);
            }
        });
    });

    describe("garde des routes héritées (bout en bout)", () => {
        describe.each([ROLES.PARENT, ROLES.ELEVE])("rôle %s", (role) => {
            let agent;

            beforeEach(async () => {
                agent = await seConnecter(role);
            });

            test.each(["/", "/contact"])("peut lire la page publique %s", async (url) => {
                const reponse = await agent.get(url);
                expect(reponse.status).toBe(200);
            });

            test("peut se déconnecter, puis n'est plus authentifié", async () => {
                expect((await agent.post("/deconnexion")).status).toBe(200);
                expect((await agent.get("/api/cours")).status).toBe(401);
            });

            test.each([
                ["get", "/api/cours"],
                ["post", "/api/cours"],
                ["put", "/api/salles/1"],
                ["delete", "/api/professeurs/1"],
                ["get", "/api/affectations"],
                ["get", "/api/utilisateurs"],
            ])("%s %s : 403 JSON", async (methode, url) => {
                const reponse = await agent[methode](url).send({});

                expect(reponse.status).toBe(403);
                expect(reponse.type).toBe("application/json");
                expect(reponse.body).toHaveProperty("error");
            });

            test.each(["/cours", "/professeurs", "/salles", "/affectations", "/planner", "/admin", "/gerer-semestres"])(
                "page %s : 403 texte",
                async (url) => {
                    const reponse = await agent.get(url);

                    expect(reponse.status).toBe(403);
                    expect(reponse.text).toContain("Accès refusé");
                }
            );

            test("l'espace /api/scolaire n'est pas bloqué par la garde", async () => {
                const reponse = await agent.get("/api/scolaire/x");
                expect(bloque(reponse.status)).toBe(false);
            });
        });

        describe("rôle enseignant", () => {
            let agent;

            beforeEach(async () => {
                agent = await seConnecter(ROLES.ENSEIGNANT);
            });

            test("peut lire les pages héritées (GET)", async () => {
                expect((await agent.get("/cours")).status).toBe(200);
                expect((await agent.get("/salles")).status).toBe(200);
            });

            test.each([
                ["post", "/api/cours"],
                ["put", "/api/salles/1"],
                ["delete", "/api/professeurs/1"],
                ["post", "/api/affectations"],
                ["post", "/api/disponibilites"],
            ])("%s %s : écriture refusée (403 JSON)", async (methode, url) => {
                const reponse = await agent[methode](url).send({});

                expect(reponse.status).toBe(403);
                expect(reponse.type).toBe("application/json");
            });

            test("l'administration reste interdite (estAdmin lit req.user)", async () => {
                expect((await agent.get("/admin")).status).toBe(403);
                expect((await agent.get("/api/utilisateurs")).status).toBe(403);
            });

            test("peut se déconnecter", async () => {
                expect((await agent.post("/deconnexion")).status).toBe(200);
            });

            test("peut écrire sous /api/scolaire (la garde ne bloque pas)", async () => {
                const reponse = await agent.post("/api/scolaire/x").send({});
                expect(bloque(reponse.status)).toBe(false);
            });
        });

        describe.each([ROLES.RESPONSABLE, ROLES.USER])("rôle hérité %s (inchangé)", (role) => {
            let agent;

            beforeEach(async () => {
                agent = await seConnecter(role);
            });

            test("atteint toujours les routes héritées (pas de 401 ni 403)", async () => {
                expect((await agent.get("/cours")).status).toBe(200);
                expect(bloque((await agent.post("/api/cours").send({})).status)).toBe(false);
                expect(bloque((await agent.delete("/api/cours/1")).status)).toBe(false);
            });

            test("n'accède pas à l'administration", async () => {
                expect((await agent.get("/admin")).status).toBe(403);
                expect((await agent.get("/api/utilisateurs")).status).toBe(403);
            });
        });

        describe("rôle admin (inchangé)", () => {
            test("atteint les routes héritées et l'administration", async () => {
                const agent = await seConnecter(ROLES.ADMIN);

                expect((await agent.get("/cours")).status).toBe(200);
                expect((await agent.get("/admin")).status).toBe(200);
                expect((await agent.get("/api/utilisateurs")).status).toBe(200);
                expect(bloque((await agent.post("/api/cours").send({})).status)).toBe(false);
            });
        });

        describe("non authentifié", () => {
            test("l'héritage gère le 401 JSON", async () => {
                const reponse = await request(app).get("/api/cours");

                expect(reponse.status).toBe(401);
                expect(reponse.body).toHaveProperty("error");
            });

            test("l'héritage gère la redirection des pages", async () => {
                const reponse = await request(app).get("/cours");

                expect(reponse.status).toBe(302);
                expect(reponse.headers.location).toBe("/connexion");
            });

            test("les pages publiques restent accessibles", async () => {
                expect((await request(app).get("/")).status).toBe(200);
                expect((await request(app).get("/contact")).status).toBe(200);
                expect((await request(app).get("/connexion")).status).toBe(200);
            });
        });
    });
});
