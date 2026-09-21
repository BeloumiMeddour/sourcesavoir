/** Chaîne HTTP réelle ; Prisma simulé, aucune connexion à une base. */
import express from "express";
import request from "supertest";

jest.mock("../../model/prisma.js", () => {
    const modele = () => ({
        count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(),
        findUnique: jest.fn(), create: jest.fn(), update: jest.fn(),
    });
    return { prisma: {
        eleve: modele(), tuteur: modele(), lienEleveTuteur: modele(), user: modele(),
        anneeScolaire: modele(), niveau: modele(), groupe: modele(), inscription: modele(),
        $transaction: jest.fn(),
    } };
});

import { prisma } from "../../model/prisma.js";
import routeur, { gererErreurScolaire } from "../../routes/scolaire.js";
import { gardeRoutesHeritees } from "../../middleware/permissions.js";

const eleve = { id: 1, matricule: "E-001", nom: "Exemple", prenom: "Lina", dateNaissance: null };
const creerApp = (role, etat = "valide") => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
        req.user = role ? { id: 10, role, etat } : undefined;
        req.isAuthenticated = () => Boolean(role);
        next();
    });
    app.use(gardeRoutesHeritees);
    app.use("/api/scolaire", routeur, gererErreurScolaire);
    return app;
};
const routesLecture = ["/eleves", "/eleves/1", "/eleves/1/inscriptions", "/annees", "/niveaux", "/groupes"];
const routesCreation = ["/eleves", "/tuteurs", "/eleves/1/liens", "/inscriptions", "/eleves/1/promotion", "/annees", "/niveaux", "/groupes"];

beforeEach(() => {
    jest.resetAllMocks();
    prisma.eleve.count.mockResolvedValue(1);
    prisma.eleve.findMany.mockResolvedValue([eleve]);
    prisma.eleve.findFirst.mockResolvedValue({ ...eleve, inscriptions: [] });
    prisma.eleve.create.mockResolvedValue(eleve);
    prisma.anneeScolaire.findMany.mockResolvedValue([]);
    prisma.niveau.findMany.mockResolvedValue([]);
    prisma.groupe.findMany.mockResolvedValue([]);
});

describe("API scolaire : rôles et authentification", () => {
    test.each([
        ...routesLecture.map((chemin) => ["get", chemin]),
        ...routesCreation.map((chemin) => ["post", chemin]),
    ])("anonyme %s %s : 401 JSON même sous un routeur monté", async (methode, chemin) => {
        const res = await request(creerApp())[methode](`/api/scolaire${chemin}`).send({});
        expect(res.status).toBe(401);
        expect(res.type).toBe("application/json");
        expect(res.headers.location).toBeUndefined();
        expect(prisma.eleve.count).not.toHaveBeenCalled();
    });

    test.each(["user", "inconnu", "parent", "eleve", "enseignant"].flatMap((role) =>
        routesCreation.map((chemin) => [role, chemin])
    ))("%s ne peut pas créer via %s", async (role, chemin) => {
        const res = await request(creerApp(role)).post(`/api/scolaire${chemin}`).send({});
        expect(res.status).toBe(403);
        expect(prisma.eleve.create).not.toHaveBeenCalled();
    });

    test.each(["user", "inconnu"].flatMap((role) => routesLecture.map((chemin) => [role, chemin])))
    ("%s ne peut pas lire %s", async (role, chemin) => {
        expect((await request(creerApp(role)).get(`/api/scolaire${chemin}`)).status).toBe(403);
    });

    test.each(["admin", "responsable", "parent", "eleve", "enseignant"])
    ("%s peut lister ses élèves", async (role) => {
        const res = await request(creerApp(role)).get("/api/scolaire/eleves");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([eleve]);
    });

    test.each(["parent", "eleve"].flatMap((role) => ["/annees", "/niveaux", "/groupes"].map((chemin) => [role, chemin])))
    ("%s ne peut pas consulter le référentiel %s", async (role, chemin) => {
        expect((await request(creerApp(role)).get(`/api/scolaire${chemin}`)).status).toBe(403);
    });

    test.each(["admin", "responsable", "enseignant"].flatMap((role) => ["/annees", "/niveaux", "/groupes"].map((chemin) => [role, chemin])))
    ("%s peut consulter %s", async (role, chemin) => {
        expect((await request(creerApp(role)).get(`/api/scolaire${chemin}`)).status).toBe(200);
    });

    test.each(["admin", "responsable", "parent", "eleve", "enseignant"])
    ("%s non validé est refusé avant toute lecture", async (role) => {
        expect((await request(creerApp(role, "en_attente")).get("/api/scolaire/eleves")).status).toBe(403);
        expect(prisma.eleve.findMany).not.toHaveBeenCalled();
    });
});

describe("API scolaire : périmètre famille", () => {
    test("liste parent : utilise le filtre des liens actifs autorisés", async () => {
        await request(creerApp("parent")).get("/api/scolaire/eleves");
        expect(prisma.eleve.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { liens: { some: { actif: true, peutLire: true, tuteur: { id_user: 10 } } } },
            select: { id: true, matricule: true, nom: true, prenom: true, dateNaissance: true },
        }));
    });

    test.each(["", "/inscriptions"])("élève étranger, absent ou identifiant invalide : même 404 (%s)", async (suffixe) => {
        prisma.eleve.count.mockResolvedValue(0);
        const app = creerApp("parent");
        const interdit = await request(app).get(`/api/scolaire/eleves/2${suffixe}`);
        const absent = await request(app).get(`/api/scolaire/eleves/999${suffixe}`);
        const invalide = await request(app).get(`/api/scolaire/eleves/2abc${suffixe}`);
        for (const res of [interdit, absent, invalide]) {
            expect(res.status).toBe(404);
            expect(res.text).toBe('{"error":"Élève introuvable."}');
        }
        expect(prisma.eleve.findFirst).not.toHaveBeenCalled();
    });

    test.each(["", "/inscriptions"])("lien révoqué entre garde et lecture : 404 (%s)", async (suffixe) => {
        prisma.eleve.findFirst.mockResolvedValue(null);
        const res = await request(creerApp("parent")).get(`/api/scolaire/eleves/1${suffixe}`);
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Élève introuvable." });
    });

    test("lecture de l'historique d'un enfant autorisé", async () => {
        prisma.eleve.findFirst.mockResolvedValue({ inscriptions: [{ id: 4, statut: "active" }] });
        const res = await request(creerApp("parent")).get("/api/scolaire/eleves/1/inscriptions");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 4, statut: "active" }]);
    });
});

describe("API scolaire : liens parent-enfant", () => {
    const lien = { id: 8, id_eleve: 1, id_tuteur: 7, parente: "mere", peutLire: true, peutAgir: false, actif: false };
    const patch = (app, chemin, corps) => request(app).patch(`/api/scolaire${chemin}`).send(corps);

    beforeEach(() => {
        prisma.lienEleveTuteur.findFirst.mockResolvedValue({ peutLire: true, peutAgir: false });
        prisma.lienEleveTuteur.update.mockResolvedValue(lien);
    });

    test("anonyme : 401 JSON", async () => {
        const res = await patch(creerApp(), "/eleves/1/liens/8", { actif: false });
        expect(res.status).toBe(401);
        expect(res.type).toBe("application/json");
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test.each(["user", "inconnu", "parent", "eleve", "enseignant"])("%s ne peut pas modifier un lien : 403", async (role) => {
        const res = await patch(creerApp(role), "/eleves/1/liens/8", { actif: false });
        expect(res.status).toBe(403);
        expect(prisma.lienEleveTuteur.findFirst).not.toHaveBeenCalled();
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test.each(["admin", "responsable"])("%s révoque un lien : 200", async (role) => {
        const res = await patch(creerApp(role), "/eleves/1/liens/8", { actif: false });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(lien);
        expect(prisma.lienEleveTuteur.findFirst).toHaveBeenCalledWith({
            where: { id: 8, id_eleve: 1 }, select: { peutLire: true, peutAgir: true },
        });
        expect(prisma.lienEleveTuteur.update).toHaveBeenCalledWith(expect.objectContaining({ data: { actif: false } }));
    });

    test("compte non validé : 403 avant toute lecture", async () => {
        const res = await patch(creerApp("admin", "en_attente"), "/eleves/1/liens/8", { actif: false });
        expect(res.status).toBe(403);
        expect(prisma.lienEleveTuteur.findFirst).not.toHaveBeenCalled();
    });

    test.each([
        ["lien inexistant", "/eleves/1/liens/999", null],
        ["lien d'un autre élève (hors périmètre de la recherche)", "/eleves/2/liens/8", null],
    ])("%s : 404 sans écriture", async (_etiquette, chemin, trouve) => {
        prisma.lienEleveTuteur.findFirst.mockResolvedValue(trouve);
        const res = await patch(creerApp("admin"), chemin, { actif: false });
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Lien introuvable." });
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test.each([
        "/eleves/abc/liens/8", "/eleves/1/liens/abc", "/eleves/1/liens/0", "/eleves/0/liens/8",
        "/eleves/1/liens/-1", "/eleves/1/liens/8abc", "/eleves/1/liens/2147483648", "/eleves/1/liens/1.5",
    ])("identifiant invalide %s : 404 sans lecture ni écriture", async (chemin) => {
        const res = await patch(creerApp("admin"), chemin, { actif: false });
        expect(res.status).toBe(404);
        expect(prisma.lienEleveTuteur.findFirst).not.toHaveBeenCalled();
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test.each([
        ["champ hors liste blanche", { id_tuteur: 3 }],
        ["booléen sous forme de chaîne", { actif: "false" }],
        ["booléen sous forme d'entier", { peutLire: 0 }],
        ["corps vide", {}],
        ["opération imbriquée", { actif: { set: false } }],
        ["agir sans lire", { peutAgir: true, peutLire: false }],
    ])("corps invalide (%s) : 400", async (_etiquette, corps) => {
        const res = await patch(creerApp("admin"), "/eleves/1/liens/8", corps);
        expect(res.status).toBe(400);
        expect(res.body.error).toEqual(expect.any(String));
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test("peutAgir: true sur un lien sans droit de lecture : 400", async () => {
        prisma.lienEleveTuteur.findFirst.mockResolvedValue({ peutLire: false, peutAgir: false });
        const res = await patch(creerApp("admin"), "/eleves/1/liens/8", { peutAgir: true });
        expect(res.status).toBe(400);
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test("modification concurrente : 409 sans détail interne", async () => {
        prisma.lienEleveTuteur.update.mockRejectedValue(Object.assign(new Error("secret SQL interne"), { code: "P2025" }));
        const res = await patch(creerApp("admin"), "/eleves/1/liens/8", { actif: false });
        expect(res.status).toBe(409);
        expect(res.text).not.toContain("secret");
    });

    test("création d'un lien avec peutAgir sans peutLire : 400", async () => {
        const res = await request(creerApp("admin")).post("/api/scolaire/eleves/1/liens")
            .send({ id_tuteur: 7, parente: "mere", peutAgir: true, peutLire: false });
        expect(res.status).toBe(400);
        expect(prisma.lienEleveTuteur.create).not.toHaveBeenCalled();
    });
});

describe("API scolaire : compte rattaché (id_user)", () => {
    const corps = {
        "/eleves": { matricule: "E-001", nom: "Exemple", prenom: "Lina", id_user: 9 },
        "/tuteurs": { nom: "Exemple", prenom: "Camille", id_user: 9 },
    };
    const roleAttendu = { "/eleves": "eleve", "/tuteurs": "parent" };
    const modele = { "/eleves": () => prisma.eleve, "/tuteurs": () => prisma.tuteur };

    test.each(["/eleves", "/tuteurs"])("%s : compte inexistant, 400", async (chemin) => {
        prisma.user.findUnique.mockResolvedValue(null);
        const res = await request(creerApp("admin")).post(`/api/scolaire${chemin}`).send(corps[chemin]);
        expect(res.status).toBe(400);
        expect(res.body.error).toContain("id_user");
        expect(modele[chemin]().create).not.toHaveBeenCalled();
    });

    test.each(["/eleves", "/tuteurs"])("%s : compte d'un autre rôle, 400", async (chemin) => {
        prisma.user.findUnique.mockResolvedValue({ id: 9, role: "admin" });
        const res = await request(creerApp("admin")).post(`/api/scolaire${chemin}`).send(corps[chemin]);
        expect(res.status).toBe(400);
        expect(res.body.error).toContain(roleAttendu[chemin]);
        expect(modele[chemin]().create).not.toHaveBeenCalled();
    });

    test.each(["/eleves", "/tuteurs"])("%s : compte déjà rattaché, 409", async (chemin) => {
        prisma.user.findUnique.mockResolvedValue({ id: 9, role: roleAttendu[chemin] });
        modele[chemin]().findFirst.mockResolvedValue({ id: 3 });
        const res = await request(creerApp("admin")).post(`/api/scolaire${chemin}`).send(corps[chemin]);
        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/déjà rattaché/);
        expect(modele[chemin]().create).not.toHaveBeenCalled();
    });

    test.each(["/eleves", "/tuteurs"])("%s : compte valide et libre, 201", async (chemin) => {
        prisma.user.findUnique.mockResolvedValue({ id: 9, role: roleAttendu[chemin] });
        modele[chemin]().findFirst.mockResolvedValue(null);
        modele[chemin]().create.mockResolvedValue({ id: 1 });
        const res = await request(creerApp("admin")).post(`/api/scolaire${chemin}`).send(corps[chemin]);
        expect(res.status).toBe(201);
    });
});

describe("API scolaire : validation et erreurs", () => {
    test.each(["admin", "responsable"])("%s crée un élève : 201", async (role) => {
        const res = await request(creerApp(role)).post("/api/scolaire/eleves").send({
            matricule: "E-001", nom: "Exemple", prenom: "Lina",
        });
        expect(res.status).toBe(201);
        expect(res.body).toEqual(eleve);
    });

    test.each(routesCreation)("corps incomplet : 400 sur %s", async (chemin) => {
        const res = await request(creerApp("admin")).post(`/api/scolaire${chemin}`).send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toEqual(expect.any(String));
    });

    test("objet Prisma imbriqué rejeté", async () => {
        const res = await request(creerApp("admin")).post("/api/scolaire/eleves").send({
            matricule: "E-001", nom: { set: "Exemple" }, prenom: "Lina",
        });
        expect(res.status).toBe(400);
        expect(prisma.eleve.create).not.toHaveBeenCalled();
    });

    test("JSON malformé : 400 JSON sans contenu reçu", async () => {
        const res = await request(creerApp("admin")).post("/api/scolaire/eleves")
            .set("Content-Type", "application/json").send('{"secret":');
        expect(res.status).toBe(400);
        expect(res.type).toBe("application/json");
        expect(res.text).not.toContain("secret");
    });

    test.each([["P2002", 409], ["P2003", 409], ["P2025", 404], ["P2034", 409]])
    ("erreur %s : %s sans détail interne", async (code, statut) => {
        prisma.eleve.create.mockRejectedValue(Object.assign(new Error("secret SQL interne"), { code }));
        const res = await request(creerApp("admin")).post("/api/scolaire/eleves").send({
            matricule: "E-001", nom: "Exemple", prenom: "Lina",
        });
        expect(res.status).toBe(statut);
        expect(res.text).not.toContain("secret");
    });

    test("corps trop volumineux : 413 JSON générique, jamais 500", async () => {
        const res = await request(creerApp("admin")).post("/api/scolaire/eleves")
            .set("Content-Type", "application/json")
            .send(JSON.stringify({ matricule: "E", nom: "x".repeat(200 * 1024), prenom: "L" }));
        expect(res.status).toBe(413);
        expect(res.type).toBe("application/json");
        expect(res.body).toEqual({ error: "Le corps de la requête est trop volumineux." });
        expect(prisma.eleve.create).not.toHaveBeenCalled();
    });

    test.each([
        ["encodage de contenu inconnu", { "Content-Type": "application/json", "Content-Encoding": "secret-codec" }],
        ["jeu de caractères non pris en charge", { "Content-Type": "application/json; charset=secret-charset" }],
    ])("corps non pris en charge (%s) : 415 JSON générique sans écho", async (_etiquette, entetes) => {
        const res = await request(creerApp("admin")).post("/api/scolaire/eleves").set(entetes).send("{}");
        expect(res.status).toBe(415);
        expect(res.type).toBe("application/json");
        expect(res.body).toEqual({ error: "Le format du corps de la requête n'est pas pris en charge." });
        expect(res.text).not.toContain("secret");
    });

    describe("gererErreurScolaire : erreurs de corps", () => {
        const reponse = () => {
            const res = { statut: null, corps: null };
            res.status = (code) => { res.statut = code; return res; };
            res.json = (corps) => { res.corps = corps; return res; };
            return res;
        };
        const journal = () => jest.spyOn(console, "error").mockImplementation(() => {});

        test.each([
            [413, "entity.too.large", "Le corps de la requête est trop volumineux."],
            [415, "encoding.unsupported", "Le format du corps de la requête n'est pas pris en charge."],
            [415, "charset.unsupported", "Le format du corps de la requête n'est pas pris en charge."],
            [400, "request.size.invalid", "La requête est invalide."],
            [400, "request.aborted", "La requête est invalide."],
        ])("statut %s (%s) réutilisé avec un message générique", (statut, type, message) => {
            const res = reponse();
            gererErreurScolaire(Object.assign(new Error("détail interne secret"), { status: statut, type }), {}, res, () => {});
            expect(res.statut).toBe(statut);
            expect(res.corps).toEqual({ error: message });
        });

        test.each([
            ["sans type de corps", { status: 418 }],
            ["statut serveur avec type", { status: 500, type: "entity.too.large" }],
            ["statut hors bornes", { status: 99, type: "entity.too.large" }],
            ["statut non entier", { status: "413", type: "entity.too.large" }],
            ["type non texte", { status: 413, type: 42 }],
        ])("%s : reste une erreur interne 500", (_etiquette, proprietes) => {
            const espion = journal();
            try {
                const res = reponse();
                gererErreurScolaire(Object.assign(new Error("secret"), proprietes), {}, res, () => {});
                expect(res.statut).toBe(500);
                expect(res.corps).toEqual({ error: "Erreur interne du serveur." });
            } finally {
                espion.mockRestore();
            }
        });
    });

    test("erreur de base dans la garde : 500 générique", async () => {
        prisma.eleve.count.mockRejectedValue(new Error("secret SQL interne"));
        const journal = jest.spyOn(console, "error").mockImplementation(() => {});
        try {
            const res = await request(creerApp("parent")).get("/api/scolaire/eleves/1");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Erreur interne du serveur." });
            expect(journal).toHaveBeenCalled();
        } finally {
            journal.mockRestore();
        }
    });
});
