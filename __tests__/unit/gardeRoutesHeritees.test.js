/**
 * Tests unitaires pour gardeRoutesHeritees (middleware/permissions.js)
 *
 * La garde est montée dans server.js avant le routeur historique. Elle est
 * volontairement grossière : elle ne remplace pas estAuthentifie / estAdmin
 * sur chaque route, elle empêche seulement que les nouveaux rôles (enseignant,
 * parent, eleve) atteignent l'héritage, qui n'exige que estAuthentifie.
 *
 * Règles :
 * - non authentifié          : next() (l'héritage gère 401 / redirection)
 * - admin, responsable, user : next() (inchangé)
 * - parent, eleve            : chemins listés + préfixe /api/scolaire, sinon 403
 * - enseignant               : GET/HEAD, POST /deconnexion, /api/scolaire (toutes méthodes)
 * - rôle inconnu ou absent   : 403
 */
import { jest } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import { ROLES, gardeRoutesHeritees } from "../../middleware/permissions.js";

const METHODES = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"];

/**
 * Exécute la garde sur une requête simulée et retourne req/res/next.
 */
const executer = ({
    role,
    methode = "GET",
    url = "/",
    authentifie = true,
    etat = "valide",
    ...reste
} = {}) => {
    const req = {
        isAuthenticated: jest.fn(() => authentifie),
        user: authentifie ? { id: 1, email: "a@b.ca", role, etat } : undefined,
        method: methode,
        originalUrl: url,
        path: url.split(/[?#]/)[0],
        ...reste,
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
        redirect: jest.fn(),
    };
    const next = jest.fn();

    gardeRoutesHeritees(req, res, next);

    return { req, res, next };
};

const attendreAutorise = ({ res, next }) => {
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
};

const attendreRefuse = ({ res, next }, { json }) => {
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.redirect).not.toHaveBeenCalled();
    if (json) {
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.stringContaining("Accès refusé") })
        );
        expect(res.send).not.toHaveBeenCalled();
    } else {
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining("Accès refusé"));
        expect(res.json).not.toHaveBeenCalled();
    }
};

const estApi = (url) => url.toLowerCase().startsWith("/api/");

describe("gardeRoutesHeritees", () => {
    test("est un middleware Express (req, res, next)", () => {
        expect(typeof gardeRoutesHeritees).toBe("function");
        expect(gardeRoutesHeritees.length).toBe(3);
    });

    describe("utilisateur non authentifié", () => {
        const urls = ["/", "/cours", "/api/cours", "/api/utilisateurs", "/api/scolaire/x", "/inconnu", "/connexion"];

        test.each(METHODES)("%s : laisse passer, l'héritage gère le 401 / la redirection", (methode) => {
            for (const url of urls) {
                attendreAutorise(executer({ authentifie: false, methode, url }));
            }
        });

        test("isAuthenticated() décide : un req.user résiduel de rôle parent n'est pas pris en compte", () => {
            attendreAutorise(
                executer({
                    authentifie: false,
                    url: "/api/cours",
                    user: { role: ROLES.PARENT, etat: "valide" },
                })
            );
        });
    });

    describe.each([ROLES.ADMIN, ROLES.RESPONSABLE, ROLES.USER])("rôle hérité %s (inchangé)", (role) => {
        const requetes = [
            ["GET", "/"],
            ["GET", "/cours"],
            ["GET", "/api/cours"],
            ["POST", "/api/cours"],
            ["PUT", "/api/salles/3"],
            ["PATCH", "/api/professeurs/2"],
            ["DELETE", "/api/professeurs/2"],
            ["POST", "/inscription"],
            ["POST", "/connexion"],
            ["POST", "/deconnexion"],
            ["GET", "/api/utilisateurs"],
            ["PUT", "/api/utilisateurs/1/role"],
            ["GET", "/api/statistiques"],
            ["GET", "/api/scolaire/x"],
            ["POST", "/api/scolaire/x"],
            ["HEAD", "/cours"],
            ["GET", "/inconnu?x=1"],
        ];

        test.each(requetes)("%s %s : next()", (methode, url) => {
            attendreAutorise(executer({ role, methode, url }));
        });
    });

    describe.each([ROLES.PARENT, ROLES.ELEVE])("rôle %s", (role) => {
        const autorises = [
            "/",
            "/connexion",
            "/deconnexion",
            "/inscription",
            "/contact",
            "/api/statistiques",
            "/api/scolaire",
            "/api/scolaire/",
            "/api/scolaire/cours",
            "/api/scolaire/cours/12/notes",
            // La query string et l'ancre ne comptent pas dans le chemin
            "/?a=b",
            "/contact?x=1",
            "/contact#ancre",
            "/api/statistiques?semestre=2",
            "/api/scolaire?x=1",
            "/api/scolaire/x?y=/api/cours",
            // Express route sans distinction de casse : la garde compare en minuscules
            "/Contact",
            "/CONNEXION",
            "/Inscription",
            "/API/scolaire/x",
            "/Api/Scolaire",
            "/API/STATISTIQUES",
        ];

        const refuses = [
            "/cours",
            "/api/cours",
            "/api/cours/1",
            "/professeurs",
            "/api/professeurs",
            "/salles",
            "/api/salles",
            "/planning",
            "/admin",
            "/api/utilisateurs",
            "/api/utilisateurs/1/role",
            "/api/affectations",
            "/api/programmes",
            "/api",
            "/api/",
            "/inconnu",
            // Chemins voisins des chemins autorisés (comparaison exacte / préfixe borné)
            "/api/scolaires",
            "/api/scolaire-x",
            "/api/scolairex/y",
            "/api/scolaire.json",
            "/api/statistiques/1",
            "/api/statistiques/",
            "/connexion/x",
            "/contact/",
            "//contact",
            "/api//scolaire",
            "/x/api/scolaire",
            "/x/api/scolaire/y",
            // La casse ne contourne rien : ces chemins visent l'héritage et restent refusés
            "/Cours",
            "/API/cours",
            "/Api/Utilisateurs",
            "/ADMIN",
            // Un chemin autorisé dans la query string ou l'ancre ne doit rien ouvrir
            "/cours?x=/contact",
            "/cours?/api/scolaire",
            "/api/cours?next=/api/scolaire/x",
            "/cours#/contact",
            "/api/cours#/api/scolaire",
        ];

        test.each(autorises)("autorise %s (toutes méthodes)", (url) => {
            for (const methode of METHODES) {
                attendreAutorise(executer({ role, methode, url }));
            }
        });

        test.each(refuses)("refuse %s avec 403 (toutes méthodes)", (url) => {
            for (const methode of METHODES) {
                attendreRefuse(executer({ role, methode, url }), { json: estApi(url) });
            }
        });
    });

    describe("rôle enseignant", () => {
        const role = ROLES.ENSEIGNANT;
        const lectures = ["GET", "HEAD"];
        const ecritures = ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

        const urlsHeritage = [
            "/",
            "/cours",
            "/api/cours",
            "/api/cours/1",
            "/api/salles",
            "/api/professeurs/3",
            "/api/affectations",
            "/api/utilisateurs",
            "/api/utilisateurs/1/role",
            "/api/statistiques",
            "/inscription",
            "/connexion",
            "/contact",
            "/planning",
            "/inconnu",
        ];

        test.each(urlsHeritage)("autorise la lecture (GET, HEAD) de %s", (url) => {
            for (const methode of lectures) {
                attendreAutorise(executer({ role, methode, url }));
            }
        });

        test.each(urlsHeritage)("refuse l'écriture (POST, PUT, PATCH, DELETE, OPTIONS) sur %s", (url) => {
            for (const methode of ecritures) {
                attendreRefuse(executer({ role, methode, url }), { json: estApi(url) });
            }
        });

        test("autorise POST /deconnexion, avec ou sans query string", () => {
            attendreAutorise(executer({ role, methode: "POST", url: "/deconnexion" }));
            attendreAutorise(executer({ role, methode: "POST", url: "/deconnexion?x=1" }));
        });

        test("refuse les autres méthodes d'écriture sur /deconnexion et ses variantes", () => {
            for (const methode of ["PUT", "PATCH", "DELETE", "OPTIONS"]) {
                attendreRefuse(executer({ role, methode, url: "/deconnexion" }), { json: false });
            }
            attendreRefuse(executer({ role, methode: "POST", url: "/deconnexion/x" }), { json: false });
            attendreRefuse(executer({ role, methode: "POST", url: "/Deconnexion/x" }), { json: false });
        });

        test("autorise POST /Deconnexion (Express route sans distinction de casse)", () => {
            attendreAutorise(executer({ role, methode: "POST", url: "/Deconnexion" }));
        });

        test("refuse l'écriture sur l'héritage quelle que soit la casse du chemin", () => {
            for (const url of ["/API/cours", "/Api/Salles/1", "/API/UTILISATEURS"]) {
                for (const methode of ecritures) {
                    attendreRefuse(executer({ role, methode, url }), { json: true });
                }
            }
        });

        test.each(["/api/scolaire", "/api/scolaire/", "/api/scolaire/x", "/api/scolaire/cours/12/notes", "/api/scolaire/x?y=1", "/API/scolaire/x", "/Api/SCOLAIRE"])(
            "autorise toutes les méthodes sur %s",
            (url) => {
                for (const methode of [...lectures, ...ecritures]) {
                    attendreAutorise(executer({ role, methode, url }));
                }
            }
        );

        test.each([
            "/api/scolaires",
            "/api/scolaire-x",
            "/api/scolairex/y",
            "/api/scolaire.json",
            "/x/api/scolaire",
            "/api//scolaire",
        ])("refuse l'écriture sur le faux préfixe %s", (url) => {
            for (const methode of ecritures) {
                attendreRefuse(executer({ role, methode, url }), { json: estApi(url) });
            }
        });

        test("un chemin autorisé placé dans la query string ou l'ancre n'ouvre rien", () => {
            attendreRefuse(executer({ role, methode: "POST", url: "/api/cours?x=/api/scolaire" }), { json: true });
            attendreRefuse(executer({ role, methode: "POST", url: "/api/cours#/api/scolaire/x" }), { json: true });
            attendreRefuse(executer({ role, methode: "POST", url: "/api/cours?next=/deconnexion" }), { json: true });
        });
    });

    describe("rôle inconnu ou absent", () => {
        const inconnus = ["superviseur", "professeur", "Admin", "ADMIN", "Parent", "parent ", "", null, undefined, 0, {}, ["admin"]];

        test.each(inconnus.map((r) => [JSON.stringify(r) ?? "undefined", r]))(
            "rôle %s : 403 sur lecture, écriture et /deconnexion",
            (_nom, role) => {
                attendreRefuse(executer({ role, methode: "GET", url: "/" }), { json: false });
                attendreRefuse(executer({ role, methode: "GET", url: "/api/statistiques" }), { json: true });
                attendreRefuse(executer({ role, methode: "POST", url: "/deconnexion" }), { json: false });
                attendreRefuse(executer({ role, methode: "POST", url: "/api/scolaire/x" }), { json: true });
                attendreRefuse(executer({ role, methode: "DELETE", url: "/api/cours/1" }), { json: true });
            }
        );

        test("authentifié mais sans req.user : 403 sans exception", () => {
            const req = {
                isAuthenticated: jest.fn(() => true),
                user: undefined,
                method: "GET",
                originalUrl: "/api/cours",
                path: "/api/cours",
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn(), redirect: jest.fn() };
            const next = jest.fn();

            expect(() => gardeRoutesHeritees(req, res, next)).not.toThrow();
            attendreRefuse({ res, next }, { json: true });
        });
    });

    describe("format de la réponse 403", () => {
        test("JSON pour une URL /api/", () => {
            attendreRefuse(executer({ role: ROLES.PARENT, url: "/api/cours" }), { json: true });
        });

        test("texte pour une page", () => {
            attendreRefuse(executer({ role: ROLES.PARENT, url: "/cours" }), { json: false });
        });

        test("JSON pour /api/ même avec une query string", () => {
            attendreRefuse(executer({ role: ROLES.PARENT, url: "/api/cours?x=1" }), { json: true });
        });
    });

    describe("lecture du chemin : originalUrl prioritaire", () => {
        test("path relatif (routeur monté) : originalUrl décide de l'autorisation", () => {
            attendreAutorise(
                executer({ role: ROLES.PARENT, url: "/api/scolaire/x", path: "/x" })
            );
            attendreAutorise(
                executer({ role: ROLES.ENSEIGNANT, methode: "POST", url: "/api/scolaire/x", path: "/x" })
            );
        });

        test("path autorisé mais originalUrl interdit : refusé", () => {
            attendreRefuse(
                executer({ role: ROLES.PARENT, url: "/api/cours", path: "/contact" }),
                { json: true }
            );
        });

        test("path relatif : la réponse 403 est décidée sur originalUrl", () => {
            attendreRefuse(
                executer({ role: ROLES.PARENT, url: "/api/cours/x", path: "/x" }),
                { json: true }
            );
        });

        test("sans originalUrl, retombe sur path", () => {
            const parent = executer({ role: ROLES.PARENT, url: "/contact", originalUrl: undefined });
            attendreAutorise(parent);

            const refus = executer({ role: ROLES.PARENT, url: "/cours", originalUrl: undefined });
            attendreRefuse(refus, { json: false });
        });
    });

    describe("source du rôle", () => {
        test("le rôle vient de req.user, jamais de la session", () => {
            // Session ancienne : admin. Base actuelle : parent.
            const r = executer({ role: ROLES.PARENT, url: "/cours", session: { user_role: "admin" } });
            attendreRefuse(r, { json: false });
        });

        test("fonctionne sans session", () => {
            const r = executer({ role: ROLES.PARENT, url: "/contact", session: undefined });
            attendreAutorise(r);
        });
    });
});

describe("câblage dans server.js", () => {
    // server.js démarre un serveur (app.listen) dès son import : on ne peut pas
    // l'importer dans un test. On vérifie donc l'ordre des instructions dans le
    // source : la garde doit venir après passport.session() et express.static,
    // et juste avant le routeur historique.
    const source = fs.readFileSync(path.join(__dirname, "..", "..", "server.js"), "utf8");
    const position = (fragment) => source.indexOf(fragment);

    test("importe gardeRoutesHeritees depuis ./middleware/permissions.js", () => {
        expect(source).toMatch(
            /import\s*\{[^}]*\bgardeRoutesHeritees\b[^}]*\}\s*from\s*"\.\/middleware\/permissions\.js";/
        );
    });

    test("monte la garde une seule fois", () => {
        expect(source.split("app.use(gardeRoutesHeritees);").length - 1).toBe(1);
    });

    test("monte la garde après passport.session() et express.static", () => {
        const session = position("app.use(passport.session());");
        const statique = position('app.use(express.static("public"));');
        const garde = position("app.use(gardeRoutesHeritees);");

        expect(session).toBeGreaterThan(-1);
        expect(statique).toBeGreaterThan(-1);
        expect(garde).toBeGreaterThan(session);
        expect(garde).toBeGreaterThan(statique);
    });

    test("monte la garde juste avant app.use(routeExterne);", () => {
        const garde = position("app.use(gardeRoutesHeritees);");
        const routes = position("app.use(routeExterne);");

        expect(garde).toBeGreaterThan(-1);
        expect(routes).toBeGreaterThan(garde);

        // Seul le routeur du socle scolaire (phase 2) peut s'intercaler : il s'appuie sur la
        // garde et ne doit pas passer après le routeur historique.
        const entreLesDeux = source
            .slice(garde + "app.use(gardeRoutesHeritees);".length, routes)
            .replace(/app\.use\(\s*"\/api\/scolaire"[^;]*\);/g, "");
        expect(entreLesDeux).not.toMatch(/app\.(use|get|post|put|delete)\(/);
    });

    test("monte le routeur /api/scolaire une seule fois, entre la garde et le routeur historique", () => {
        const montages = source.match(/app\.use\(\s*"\/api\/scolaire"/g) ?? [];
        expect(montages).toHaveLength(1);

        const garde = position("app.use(gardeRoutesHeritees);");
        const scolaire = source.search(/app\.use\(\s*"\/api\/scolaire"/);
        const routes = position("app.use(routeExterne);");

        expect(scolaire).toBeGreaterThan(garde);
        expect(routes).toBeGreaterThan(scolaire);
    });
});
