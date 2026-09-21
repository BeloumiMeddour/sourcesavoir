/**
 * Tests unitaires pour exigerLectureEleve (middleware/permissions.js).
 *
 * Garantie centrale : une ressource non lisible et une ressource inexistante
 * produisent EXACTEMENT la même réponse 404 (statut et corps), pour qu'un
 * parent ne puisse pas deviner l'existence d'un enfant d'une autre famille.
 * model/acces.js est simulé : seule la décision du middleware est testée.
 */
import { jest } from "@jest/globals";

jest.mock("../../model/acces.js", () => ({
    filtreElevesVisibles: jest.fn(),
    peutLireEleve: jest.fn(),
    peutAgirPourEleve: jest.fn(),
}));

import { peutLireEleve } from "../../model/acces.js";
import { ROLES, exigerLectureEleve } from "../../middleware/permissions.js";

const creerReq = (options = {}) => {
    const { authentifie = true, role = ROLES.PARENT, url = "/api/scolaire/eleves/5", params = { id: "5" } } = options;
    // "etat" absent => "valide" ; "etat: undefined" explicite => propriété absente
    const etat = "etat" in options ? options.etat : "valide";

    return {
        isAuthenticated: jest.fn(() => authentifie),
        user: authentifie ? { id: 7, email: "a@b.ca", role, etat } : undefined,
        originalUrl: url,
        // Dans un routeur monté, path est relatif au point de montage
        path: url.replace(/^\/api\/scolaire/, "").split("?")[0],
        method: "GET",
        params,
    };
};

const creerRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
    redirect: jest.fn(),
});

/**
 * Exécute le middleware et retourne req, res, next.
 */
const executer = async (options = {}, param) => {
    const req = creerReq(options);
    const res = creerRes();
    const next = jest.fn();
    const middleware = param === undefined ? exigerLectureEleve() : exigerLectureEleve(param);

    await middleware(req, res, next);

    return { req, res, next };
};

const attendreEleveIntrouvable = ({ res, next }) => {
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.redirect).not.toHaveBeenCalled();
};

describe("exigerLectureEleve", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        peutLireEleve.mockResolvedValue(true);
    });

    test("est une fabrique : retourne un middleware Express (req, res, next)", () => {
        const middleware = exigerLectureEleve();

        expect(typeof middleware).toBe("function");
        expect(middleware.length).toBe(3);
    });

    test("des middlewares créés séparément ne partagent pas d'état", async () => {
        const surId = exigerLectureEleve("id");
        const surAutre = exigerLectureEleve("idEleve");

        const a = { req: creerReq({ params: { id: "5" } }), res: creerRes(), next: jest.fn() };
        const b = { req: creerReq({ params: { id: "5" } }), res: creerRes(), next: jest.fn() };
        await surId(a.req, a.res, a.next);
        await surAutre(b.req, b.res, b.next);

        expect(a.next).toHaveBeenCalledTimes(1);
        expect(b.next).not.toHaveBeenCalled();
        expect(b.res.status).toHaveBeenCalledWith(404);
    });

    describe("chargement", () => {
        test("importer permissions.js ne charge pas model/acces.js (ni Prisma) : import différé", () => {
            let chargements = 0;

            jest.isolateModules(() => {
                jest.doMock("../../model/acces.js", () => {
                    chargements += 1;
                    return {};
                });
                require("../../middleware/permissions.js");
            });

            expect(chargements).toBe(0);
        });
    });

    describe("utilisateur non authentifié", () => {
        test("API : 401 JSON, sans interroger la base", async () => {
            const { res, next } = await executer({ authentifie: false });

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: expect.stringContaining("Non authentifié") })
            );
            expect(res.redirect).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
            expect(peutLireEleve).not.toHaveBeenCalled();
        });

        test("page : redirection vers /connexion", async () => {
            const { res, next } = await executer({ authentifie: false, url: "/eleves/5" });

            expect(res.redirect).toHaveBeenCalledWith("/connexion");
            expect(res.status).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
            expect(peutLireEleve).not.toHaveBeenCalled();
        });

        test("routeur monté : path relatif (/eleves/5) mais originalUrl API -> 401 JSON, pas de redirection", async () => {
            const { req, res } = await executer({ authentifie: false, url: "/api/scolaire/eleves/5" });

            expect(req.path).toBe("/eleves/5");
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test("le 401 passe avant la validation de l'identifiant (rien n'est révélé à un anonyme)", async () => {
            const { res } = await executer({ authentifie: false, params: { id: "abc" } });

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.status).not.toHaveBeenCalledWith(404);
        });
    });

    describe("compte non validé", () => {
        test.each(["en_attente", "refuse", "Valide", "", null, undefined])(
            "état %p : 403 sans interroger la base (comme aRole)",
            async (etat) => {
                const { res, next } = await executer({ etat });

                expect(res.status).toHaveBeenCalledWith(403);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({ error: expect.stringContaining("Accès refusé") })
                );
                expect(next).not.toHaveBeenCalled();
                expect(peutLireEleve).not.toHaveBeenCalled();
            }
        );

        test("page : 403 texte", async () => {
            const { res } = await executer({ etat: "en_attente", url: "/eleves/5" });

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith(expect.stringContaining("Accès refusé"));
            expect(res.json).not.toHaveBeenCalled();
        });

        test("authentifié mais sans req.user : 403 sans exception", async () => {
            const req = creerReq();
            req.user = undefined;
            const res = creerRes();
            const next = jest.fn();

            await expect(exigerLectureEleve()(req, res, next)).resolves.not.toThrow();

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
            expect(peutLireEleve).not.toHaveBeenCalled();
        });
    });

    describe("identifiant invalide : 404, sans interroger la base", () => {
        test.each([
            ["abc"],
            ["1.5"],
            ["-1"],
            ["+5"],
            ["1e3"],
            ["0x10"],
            ["5abc"],
            ["abc5"],
            [" 5"],
            ["5 "],
            ["5\n"],
            [""],
            ["0"],
            ["٥"],
            ["5%20"],
            ["5;DROP TABLE Eleve"],
            ["5' OR '1'='1"],
            ["2147483648"],
            ["99999999999999999999"],
            [undefined],
            [null],
            [5],
            [["5"]],
            [{ id: "5" }],
        ])("id %p", async (id) => {
            const resultat = await executer({ params: { id } });

            attendreEleveIntrouvable(resultat);
            expect(peutLireEleve).not.toHaveBeenCalled();
        });

        test("params absent : 404 sans exception", async () => {
            const req = creerReq();
            delete req.params;
            const res = creerRes();
            const next = jest.fn();

            await exigerLectureEleve()(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("identifiant valide", () => {
        test.each([
            ["1", 1],
            ["5", 5],
            ["007", 7],
            ["2147483647", 2147483647],
        ])("id %s : interroge peutLireEleve(req.user, %d) avec un nombre", async (chaine, nombre) => {
            const { req, next } = await executer({ params: { id: chaine } });

            expect(peutLireEleve).toHaveBeenCalledTimes(1);
            expect(peutLireEleve).toHaveBeenCalledWith(req.user, nombre);
            expect(typeof peutLireEleve.mock.calls[0][1]).toBe("number");
            expect(next).toHaveBeenCalledTimes(1);
        });

        test("lisible : next() sans argument et aucune réponse envoyée", async () => {
            const { res, next } = await executer();

            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(res.send).not.toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test("le nom du paramètre de route est configurable", async () => {
            const { req, next } = await executer({ params: { idEleve: "12" } }, "idEleve");

            expect(peutLireEleve).toHaveBeenCalledWith(req.user, 12);
            expect(next).toHaveBeenCalledTimes(1);
        });

        test("avec un paramètre personnalisé, l'ancien nom (id) n'est pas lu", async () => {
            const resultat = await executer({ params: { id: "5" } }, "idEleve");

            attendreEleveIntrouvable(resultat);
            expect(peutLireEleve).not.toHaveBeenCalled();
        });

        test.each(Object.values(ROLES))("le rôle %s est évalué par peutLireEleve, pas par le middleware", async (role) => {
            peutLireEleve.mockResolvedValue(false);

            const resultat = await executer({ role });

            attendreEleveIntrouvable(resultat);
            expect(peutLireEleve).toHaveBeenCalledTimes(1);
        });
    });

    describe("ressource non lisible ou inexistante : réponses strictement identiques", () => {
        // Trois causes différentes, une seule réponse.
        const scenarios = {
            "élève inexistant": { params: { id: "999" }, lisible: false },
            "élève d'une autre famille": { params: { id: "5" }, lisible: false },
            "identifiant invalide": { params: { id: "abc" }, lisible: false },
            "rôle sans accès scolaire": { params: { id: "5" }, lisible: false, role: ROLES.USER },
        };

        const reponseDe = async ({ params, lisible, role }, url) => {
            peutLireEleve.mockResolvedValue(lisible);
            const { res } = await executer({ params, role, url });
            return { statut: res.status.mock.calls, json: res.json.mock.calls, texte: res.send.mock.calls };
        };

        test("API : même statut 404 et même corps JSON, octet pour octet", async () => {
            const reponses = {};
            for (const [nom, scenario] of Object.entries(scenarios)) {
                reponses[nom] = await reponseDe(scenario);
            }

            const reference = reponses["élève inexistant"];
            expect(reference.statut).toEqual([[404]]);
            expect(reference.json).toHaveLength(1);
            expect(typeof reference.json[0][0].error).toBe("string");

            for (const reponse of Object.values(reponses)) {
                expect(reponse).toEqual(reference);
                expect(JSON.stringify(reponse.json)).toBe(JSON.stringify(reference.json));
            }
        });

        test("page : même statut 404 et même corps texte", async () => {
            const reponses = {};
            for (const [nom, scenario] of Object.entries(scenarios)) {
                reponses[nom] = await reponseDe(scenario, "/eleves/5");
            }

            const reference = reponses["élève inexistant"];
            expect(reference.statut).toEqual([[404]]);
            expect(reference.texte).toHaveLength(1);
            expect(typeof reference.texte[0][0]).toBe("string");
            expect(reference.json).toHaveLength(0);

            for (const reponse of Object.values(reponses)) {
                expect(reponse).toEqual(reference);
            }
        });

        test("le corps ne mentionne ni l'identifiant demandé, ni le rôle, ni une notion de droits", async () => {
            peutLireEleve.mockResolvedValue(false);
            const { res } = await executer({ params: { id: "5" }, role: ROLES.PARENT });

            const corps = JSON.stringify(res.json.mock.calls[0][0]);
            expect(corps).not.toMatch(/5/);
            expect(corps).not.toMatch(/parent|refus|droit|autoris|permission|accès|famille/i);
        });
    });

    describe("erreur inattendue", () => {
        test("une erreur de peutLireEleve est transmise à next(erreur) : aucun accès accordé, aucune réponse", async () => {
            const erreur = new Error("base indisponible");
            peutLireEleve.mockRejectedValue(erreur);

            const { res, next } = await executer();

            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith(erreur);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(res.send).not.toHaveBeenCalled();
        });

        test("une erreur synchrone de peutLireEleve est traitée de la même façon", async () => {
            const erreur = new Error("boum");
            peutLireEleve.mockImplementation(() => {
                throw erreur;
            });

            const { next } = await executer();

            expect(next).toHaveBeenCalledWith(erreur);
        });
    });

    describe("source des informations", () => {
        test("lit l'utilisateur sur req.user et jamais sur la session", async () => {
            const req = creerReq({ role: ROLES.PARENT });
            req.session = { user_role: "admin", passport: { user: 1 } };
            const res = creerRes();

            await exigerLectureEleve()(req, res, jest.fn());

            expect(peutLireEleve).toHaveBeenCalledWith(req.user, 5);
        });

        test("lit l'identifiant dans req.params, pas dans le corps ni la query", async () => {
            const req = creerReq({ params: { id: "5" } });
            req.body = { id: "6" };
            req.query = { id: "7" };

            await exigerLectureEleve()(req, creerRes(), jest.fn());

            expect(peutLireEleve).toHaveBeenCalledWith(req.user, 5);
        });
    });
});
