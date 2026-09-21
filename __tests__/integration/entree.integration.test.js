/**
 * Branchement HTTP des protections de l'entrée (middleware/entree.js) :
 * garde CSRF, limitation des connexions et des inscriptions, adresse IP lue
 * derrière un mandataire. Application Express réelle, sans base de données.
 */
import express from "express";
import request from "supertest";
import { brancherProtectionsEntree, lireSautsMandataire } from "../../middleware/entree.js";

const HOTE = "planify.test";
const ORIGINE = "https://planify.test";

const creerApp = (env = {}) => {
    const app = express();
    app.use(express.json());
    brancherProtectionsEntree(app, env);
    // Routes factices : seules les protections en amont sont examinées
    app.post("/connexion", (req, res) => res.status(401).json({ error: "identifiants_invalides" }));
    app.post("/inscription", (req, res) => res.status(201).json({ ok: true }));
    app.post("/api/cours", (req, res) => res.status(201).json({ ok: true }));
    app.get("/connexion", (req, res) => res.status(200).send("page"));
    return app;
};

const connexion = (app, email, entetes = {}) =>
    request(app).post("/connexion").set("Host", HOTE).set("Origin", ORIGINE).set(entetes).send({ email, password: "x" });

const inscription = (app, email, entetes = {}) =>
    request(app).post("/inscription").set("Host", HOTE).set("Origin", ORIGINE).set(entetes).send({ email });

describe("lireSautsMandataire", () => {
    test("0 par défaut, hors Azure", () => {
        expect(lireSautsMandataire({})).toBe(0);
    });

    test("1 saut sur Azure App Service (WEBSITE_SITE_NAME défini)", () => {
        expect(lireSautsMandataire({ WEBSITE_SITE_NAME: "planify-app" })).toBe(1);
    });

    test("TRUST_PROXY valide est prioritaire, y compris 0 sur Azure", () => {
        expect(lireSautsMandataire({ TRUST_PROXY: "2" })).toBe(2);
        expect(lireSautsMandataire({ TRUST_PROXY: " 3 ", WEBSITE_SITE_NAME: "x" })).toBe(3);
        expect(lireSautsMandataire({ TRUST_PROXY: "0", WEBSITE_SITE_NAME: "x" })).toBe(0);
    });

    test.each(["true", "loopback", "-1", "1.5", "11", "99", "", "1 2"])(
        "TRUST_PROXY %j est ignoré (retour à la valeur par défaut)",
        (valeur) => {
            expect(lireSautsMandataire({ TRUST_PROXY: valeur })).toBe(0);
            expect(lireSautsMandataire({ TRUST_PROXY: valeur, WEBSITE_SITE_NAME: "x" })).toBe(1);
        }
    );
});

describe("garde CSRF branchée", () => {
    test("refuse une écriture venue d'un autre site (403)", async () => {
        const res = await request(creerApp())
            .post("/api/cours")
            .set("Host", HOTE)
            .set("Origin", "https://evil.example")
            .send({});
        expect(res.status).toBe(403);
    });

    test("accepte une écriture du même site", async () => {
        const res = await request(creerApp()).post("/api/cours").set("Host", HOTE).set("Origin", ORIGINE).send({});
        expect(res.status).toBe(201);
    });

    test("accepte du JSON sans en-tête Origin, refuse un formulaire sans Origin", async () => {
        const app = creerApp();
        const json = await request(app).post("/api/cours").set("Host", HOTE).send({});
        expect(json.status).toBe(201);

        const formulaire = await request(app).post("/api/cours").set("Host", HOTE).type("form").send("a=1");
        expect(formulaire.status).toBe(403);
    });

    test("ORIGINES_AUTORISEES ajoute un hôte accepté", async () => {
        const app = creerApp({ ORIGINES_AUTORISEES: "https://portail.example" });
        const res = await request(app).post("/api/cours").set("Host", HOTE).set("Origin", "https://portail.example").send({});
        expect(res.status).toBe(201);
    });

    test("ne contrôle pas les lectures", async () => {
        const res = await request(creerApp()).get("/connexion").set("Origin", "https://evil.example");
        expect(res.status).toBe(200);
    });

    test("une requête refusée par la garde ne consomme pas les tentatives du courriel", async () => {
        const app = creerApp({ LIMITE_CONNEXION_COURRIEL_MAX: "1" });
        for (let i = 0; i < 3; i++) {
            const res = await request(app)
                .post("/connexion")
                .set("Host", HOTE)
                .set("Origin", "https://evil.example")
                .send({ email: "victime@example.invalid", password: "x" });
            expect(res.status).toBe(403);
        }
        // La vraie personne peut encore tenter sa connexion
        const legitime = await connexion(app, "victime@example.invalid");
        expect(legitime.status).toBe(401);
    });
});

describe("limitation des connexions", () => {
    test("bloque un courriel après la limite (429 avec Retry-After), sans gêner un autre courriel", async () => {
        const app = creerApp({ LIMITE_CONNEXION_COURRIEL_MAX: "3" });
        for (let i = 0; i < 3; i++) {
            expect((await connexion(app, "a@example.invalid")).status).toBe(401);
        }
        const bloque = await connexion(app, "a@example.invalid");
        expect(bloque.status).toBe(429);
        expect(Number(bloque.headers["retry-after"])).toBeGreaterThan(0);
        expect(bloque.body).toEqual({ error: expect.any(String) });

        expect((await connexion(app, "b@example.invalid")).status).toBe(401);
    });

    test("le courriel est normalisé : la casse et les espaces ne contournent pas la limite", async () => {
        const app = creerApp({ LIMITE_CONNEXION_COURRIEL_MAX: "2" });
        await connexion(app, "a@example.invalid");
        await connexion(app, "  A@EXAMPLE.INVALID ");
        expect((await connexion(app, "a@Example.invalid")).status).toBe(429);
    });

    test("bloque une adresse IP après la limite, quel que soit le courriel", async () => {
        const app = creerApp({ LIMITE_CONNEXION_IP_MAX: "2" });
        expect((await connexion(app, "a@example.invalid")).status).toBe(401);
        expect((await connexion(app, "b@example.invalid")).status).toBe(401);
        expect((await connexion(app, "c@example.invalid")).status).toBe(429);
    });

    test("ne limite pas l'affichage de la page de connexion", async () => {
        const app = creerApp({ LIMITE_CONNEXION_IP_MAX: "1" });
        for (let i = 0; i < 5; i++) {
            expect((await request(app).get("/connexion")).status).toBe(200);
        }
    });
});

describe("limitation des inscriptions", () => {
    test("bloque une adresse IP après la limite", async () => {
        const app = creerApp({ LIMITE_INSCRIPTION_IP_MAX: "2" });
        expect((await inscription(app, "a@example.invalid")).status).toBe(201);
        expect((await inscription(app, "b@example.invalid")).status).toBe(201);
        expect((await inscription(app, "c@example.invalid")).status).toBe(429);
    });

    test("est indépendante de la limitation des connexions", async () => {
        const app = creerApp({ LIMITE_INSCRIPTION_IP_MAX: "1", LIMITE_CONNEXION_IP_MAX: "5" });
        expect((await inscription(app, "a@example.invalid")).status).toBe(201);
        expect((await inscription(app, "b@example.invalid")).status).toBe(429);
        expect((await connexion(app, "a@example.invalid")).status).toBe(401);
    });
});

describe("adresse IP derrière un mandataire", () => {
    test("sans TRUST_PROXY, X-Forwarded-For est ignoré : changer d'adresse ne contourne pas la limite", async () => {
        const app = creerApp({ LIMITE_CONNEXION_IP_MAX: "2" });
        await connexion(app, "a@example.invalid", { "X-Forwarded-For": "10.0.0.1" });
        await connexion(app, "b@example.invalid", { "X-Forwarded-For": "10.0.0.2" });
        const res = await connexion(app, "c@example.invalid", { "X-Forwarded-For": "10.0.0.3" });
        expect(res.status).toBe(429);
    });

    test("avec TRUST_PROXY=1, chaque client a sa propre limite", async () => {
        const app = creerApp({ TRUST_PROXY: "1", LIMITE_CONNEXION_IP_MAX: "2" });
        await connexion(app, "a@example.invalid", { "X-Forwarded-For": "10.0.0.1" });
        await connexion(app, "b@example.invalid", { "X-Forwarded-For": "10.0.0.1" });
        expect((await connexion(app, "c@example.invalid", { "X-Forwarded-For": "10.0.0.1" })).status).toBe(429);
        expect((await connexion(app, "c@example.invalid", { "X-Forwarded-For": "10.0.0.2" })).status).toBe(401);
    });

    test("avec TRUST_PROXY=1, l'adresse suivie d'un port (format Azure) est ramenée à l'adresse seule", async () => {
        const app = creerApp({ TRUST_PROXY: "1", LIMITE_CONNEXION_IP_MAX: "2" });
        await connexion(app, "a@example.invalid", { "X-Forwarded-For": "10.0.0.1:50001" });
        await connexion(app, "b@example.invalid", { "X-Forwarded-For": "10.0.0.1:50002" });
        const res = await connexion(app, "c@example.invalid", { "X-Forwarded-For": "10.0.0.1:50003" });
        expect(res.status).toBe(429);
    });
});
