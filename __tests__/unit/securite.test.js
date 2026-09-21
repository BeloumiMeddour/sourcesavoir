/**
 * Tests de la protection CSRF (middleware/securite.js) pour POST, PUT, PATCH et DELETE :
 * (a) en-tête Origin présent : son hôte doit être celui de la requête ;
 * (b) en-tête Origin absent : Content-Type application/json, ou en-tête X-Requested-With
 *     ou X-Nom-Fichier (envois de fichiers), sinon 403.
 */
import { jest } from "@jest/globals";
import { gardeCsrf, lireHotesAutorises } from "../../middleware/securite.js";

const METHODES_ECRITURE = ["POST", "PUT", "PATCH", "DELETE"];

const executer = ({ methode = "POST", url = "/api/cours", host = "planify.test", entetes = {}, options } = {}) => {
    const enTetes = Object.fromEntries(Object.entries(entetes).map(([nom, valeur]) => [nom.toLowerCase(), valeur]));
    const req = {
        method: methode,
        originalUrl: url,
        host,
        get: (nom) => enTetes[nom.toLowerCase()],
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
    };
    const next = jest.fn();

    gardeCsrf(options)(req, res, next);

    return { req, res, next };
};

const attendreAutorise = ({ res, next }) => {
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
};

const attendreRefuse = ({ res, next }, { json = true } = {}) => {
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    if (json) {
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.send).not.toHaveBeenCalled();
    } else {
        expect(res.send).toHaveBeenCalledTimes(1);
        expect(res.json).not.toHaveBeenCalled();
    }
};

describe("gardeCsrf", () => {
    test("est fabriquée sans option et retourne un middleware (req, res, next)", () => {
        expect(gardeCsrf()).toHaveLength(3);
    });

    describe("méthodes de lecture", () => {
        test.each(["GET", "HEAD", "OPTIONS"])("%s n'est jamais contrôlée, même avec une origine étrangère", (methode) => {
            attendreAutorise(executer({ methode, entetes: { Origin: "https://evil.example" } }));
            attendreAutorise(executer({ methode }));
        });
    });

    describe.each(METHODES_ECRITURE)("%s avec en-tête Origin", (methode) => {
        test.each([
            ["http://planify.test", "planify.test"],
            ["https://planify.test", "planify.test"],
            ["http://localhost:3000", "localhost:3000"],
            ["HTTP://PLANIFY.TEST", "planify.test"],
        ])("origine %s pour l'hôte %s : autorisée, quel que soit le Content-Type", (origine, host) => {
            attendreAutorise(executer({ methode, host, entetes: { Origin: origine, "Content-Type": "text/plain" } }));
            attendreAutorise(executer({ methode, host, entetes: { Origin: origine } }));
        });

        test.each([
            ["https://evil.example"],
            ["http://evil.planify.test"],
            ["http://planify.test.evil.example"],
            ["http://planify.test:8080"],
            ["null"],
            ["pas une url"],
            [""],
            ["http://planify.test, http://evil.example"],
        ])("origine %p : refusée avec 403 même avec un Content-Type JSON", (origine) => {
            attendreRefuse(
                executer({ methode, host: "planify.test", entetes: { Origin: origine, "Content-Type": "application/json" } })
            );
        });

        test("l'origine étrangère est refusée même avec X-Requested-With", () => {
            attendreRefuse(
                executer({ methode, entetes: { Origin: "https://evil.example", "X-Requested-With": "fetch" } })
            );
        });

        test("le port compte : localhost:3000 n'accepte pas localhost:4000", () => {
            attendreRefuse(executer({ methode, host: "localhost:3000", entetes: { Origin: "http://localhost:4000" } }));
        });
    });

    describe.each(METHODES_ECRITURE)("%s sans en-tête Origin", (methode) => {
        test.each([
            ["application/json"],
            ["application/json; charset=utf-8"],
            ["Application/JSON"],
        ])("Content-Type %s : autorisé", (type) => {
            attendreAutorise(executer({ methode, entetes: { "Content-Type": type } }));
        });

        test.each([["fetch"], ["XMLHttpRequest"], ["x"]])("X-Requested-With %p : autorisé", (valeur) => {
            attendreAutorise(executer({ methode, entetes: { "X-Requested-With": valeur } }));
        });

        test("X-Nom-Fichier (envoi d'un corps binaire) : autorisé au même titre que X-Requested-With", () => {
            attendreAutorise(
                executer({
                    methode,
                    entetes: { "Content-Type": "application/octet-stream", "X-Nom-Fichier": "notes.pdf" },
                })
            );
        });

        test.each([
            ["aucun en-tête", {}],
            ["text/plain", { "Content-Type": "text/plain" }],
            ["formulaire", { "Content-Type": "application/x-www-form-urlencoded" }],
            ["multipart", { "Content-Type": "multipart/form-data; boundary=x" }],
            ["type voisin", { "Content-Type": "application/jsonx" }],
            ["type caché dans un paramètre", { "Content-Type": "text/plain; application/json" }],
            ["JSON dans un autre en-tête", { Accept: "application/json" }],
            ["X-Requested-With vide", { "X-Requested-With": "" }],
            ["X-Nom-Fichier vide", { "X-Nom-Fichier": "" }],
            ["octet-stream sans en-tête de fichier", { "Content-Type": "application/octet-stream" }],
        ])("%s : refusé avec 403", (_nom, entetes) => {
            attendreRefuse(executer({ methode, entetes }));
        });
    });

    describe("format de la réponse 403", () => {
        test("JSON pour une URL /api/", () => {
            const resultat = executer({ url: "/api/cours/1", methode: "DELETE" });

            attendreRefuse(resultat, { json: true });
            expect(resultat.res.json.mock.calls[0][0]).toHaveProperty("error");
        });

        test("JSON pour /API/ (casse ignorée)", () => {
            attendreRefuse(executer({ url: "/API/cours/1", methode: "DELETE" }), { json: true });
        });

        test("texte pour une page", () => {
            attendreRefuse(executer({ url: "/deconnexion" }), { json: false });
        });

        test("le message est générique : ni l'origine reçue ni l'hôte n'y figurent", () => {
            const { res } = executer({ host: "planify.test", entetes: { Origin: "https://evil.example" } });

            const corps = JSON.stringify(res.json.mock.calls[0][0]);
            expect(corps).not.toContain("evil.example");
            expect(corps).not.toContain("planify.test");
        });
    });

    describe("hôtes autorisés supplémentaires (ORIGINES_AUTORISEES)", () => {
        const options = { hotesAutorises: ["planify.exemple.ca", "www.planify.exemple.ca:8443"] };

        test("une origine listée est acceptée même si l'hôte de la requête diffère (proxy qui réécrit Host)", () => {
            attendreAutorise(executer({ host: "interne:8080", options, entetes: { Origin: "https://planify.exemple.ca" } }));
            attendreAutorise(
                executer({ host: "interne:8080", options, entetes: { Origin: "https://www.planify.exemple.ca:8443" } })
            );
        });

        test("une origine non listée reste refusée", () => {
            attendreRefuse(executer({ host: "interne:8080", options, entetes: { Origin: "https://evil.example" } }));
        });
    });
});

describe("lireHotesAutorises", () => {
    test("liste vide par défaut", () => {
        expect(lireHotesAutorises({})).toEqual([]);
        expect(lireHotesAutorises({ ORIGINES_AUTORISEES: "" })).toEqual([]);
    });

    test("découpe, retire les espaces, met en minuscules et accepte des URL complètes", () => {
        expect(
            lireHotesAutorises({ ORIGINES_AUTORISEES: " Planify.Exemple.ca , https://www.exemple.ca:8443/ ,, " })
        ).toEqual(["planify.exemple.ca", "www.exemple.ca:8443"]);
    });
});
