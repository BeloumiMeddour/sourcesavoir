/**
 * Tests unitaires pour middleware/permissions.js : ROLES et aRole(...)
 * (la garde des routes héritées est testée dans gardeRoutesHeritees.test.js)
 */
import { jest } from "@jest/globals";
import { ROLES, aRole } from "../../middleware/permissions.js";

/**
 * Fabrique une requête simulée (Express + Passport).
 */
const creerReq = (options = {}) => {
    const { authentifie = true, role = ROLES.USER, url = "/api/scolaire/x", ...reste } = options;
    // "etat" absent => "valide" ; "etat: undefined" explicite => propriété absente
    const etat = "etat" in options ? options.etat : "valide";
    delete reste.etat;

    return {
        isAuthenticated: jest.fn(() => authentifie),
        user: authentifie ? { id: 1, email: "a@b.ca", role, etat } : undefined,
        originalUrl: url,
        path: url.split("?")[0],
        method: "GET",
        ...reste,
    };
};

const creerRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    redirect: jest.fn(),
    send: jest.fn(),
});

describe("ROLES", () => {
    test("expose exactement les six rôles attendus", () => {
        expect(ROLES).toEqual({
            ADMIN: "admin",
            RESPONSABLE: "responsable",
            ENSEIGNANT: "enseignant",
            PARENT: "parent",
            ELEVE: "eleve",
            USER: "user",
        });
    });

    test("est gelé (aucune modification possible)", () => {
        expect(Object.isFrozen(ROLES)).toBe(true);

        try {
            ROLES.ADMIN = "pirate";
            ROLES.NOUVEAU = "x";
        } catch {
            // Mode strict : l'affectation lève une TypeError, c'est attendu.
        }

        expect(ROLES.ADMIN).toBe("admin");
        expect(ROLES.NOUVEAU).toBeUndefined();
    });

    test("Object.values(ROLES) liste des valeurs uniques", () => {
        const valeurs = Object.values(ROLES);
        expect(new Set(valeurs).size).toBe(valeurs.length);
    });
});

describe("aRole", () => {
    let res, next;

    beforeEach(() => {
        res = creerRes();
        next = jest.fn();
    });

    test("retourne un middleware Express (req, res, next)", () => {
        const middleware = aRole(ROLES.ADMIN);

        expect(typeof middleware).toBe("function");
        expect(middleware.length).toBe(3);
    });

    describe("utilisateur non authentifié", () => {
        test("API : 401 JSON", () => {
            const req = creerReq({ authentifie: false, url: "/api/scolaire/x" });

            aRole(ROLES.ADMIN)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: expect.stringContaining("Non authentifié") })
            );
            expect(res.redirect).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test("page : redirection vers /connexion", () => {
            const req = creerReq({ authentifie: false, url: "/planning" });

            aRole(ROLES.ADMIN)(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith("/connexion");
            expect(res.status).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test("routeur monté : path relatif mais originalUrl API -> 401 JSON", () => {
            const req = creerReq({ authentifie: false, url: "/api/scolaire/x", path: "/x" });

            aRole(ROLES.ENSEIGNANT)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });
    });

    describe("utilisateur authentifié", () => {
        test("rôle présent dans la liste et compte validé : next()", () => {
            const req = creerReq({ role: ROLES.ENSEIGNANT });

            aRole(ROLES.ENSEIGNANT)(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test.each(Object.values(ROLES))("accepte le rôle %s quand il figure dans la liste", (role) => {
            const req = creerReq({ role });

            aRole(...Object.values(ROLES))(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
        });

        test("plusieurs rôles : accepte chacun, refuse les autres", () => {
            const middleware = aRole(ROLES.ENSEIGNANT, ROLES.RESPONSABLE);

            for (const role of [ROLES.ENSEIGNANT, ROLES.RESPONSABLE]) {
                const n = jest.fn();
                middleware(creerReq({ role }), creerRes(), n);
                expect(n).toHaveBeenCalledTimes(1);
            }

            for (const role of [ROLES.ADMIN, ROLES.PARENT, ROLES.ELEVE, ROLES.USER]) {
                const n = jest.fn();
                const r = creerRes();
                middleware(creerReq({ role }), r, n);
                expect(n).not.toHaveBeenCalled();
                expect(r.status).toHaveBeenCalledWith(403);
            }
        });

        test("rôle absent de la liste, API : 403 JSON", () => {
            const req = creerReq({ role: ROLES.PARENT, url: "/api/scolaire/x" });

            aRole(ROLES.ADMIN)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: expect.stringContaining("Accès refusé") })
            );
            expect(res.send).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test("rôle absent de la liste, page : 403 texte", () => {
            const req = creerReq({ role: ROLES.PARENT, url: "/admin" });

            aRole(ROLES.ADMIN)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith(expect.stringContaining("Accès refusé"));
            expect(res.json).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test("routeur monté : path relatif mais originalUrl API -> 403 JSON", () => {
            const req = creerReq({ role: ROLES.PARENT, url: "/api/scolaire/x", path: "/x" });

            aRole(ROLES.ADMIN)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalled();
            expect(res.send).not.toHaveBeenCalled();
        });

        test.each([
            ["en_attente"],
            ["refuse"],
            ["Valide"],
            [" valide"],
            [""],
            [null],
            [undefined],
        ])("compte dont l'état est %p : 403 même avec le bon rôle", (etat) => {
            const req = creerReq({ role: ROLES.ADMIN, etat });

            aRole(ROLES.ADMIN)(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test("aucun rôle autorisé (aRole()) : 403 pour tout le monde, admin compris", () => {
            for (const role of Object.values(ROLES)) {
                const n = jest.fn();
                const r = creerRes();

                aRole()(creerReq({ role }), r, n);

                expect(n).not.toHaveBeenCalled();
                expect(r.status).toHaveBeenCalledWith(403);
            }
        });

        test("rôle proche mais différent (casse, espaces, vide, null) : 403", () => {
            for (const role of ["Admin", "ADMIN", "admin ", " admin", "", null, undefined, "administrateur"]) {
                const n = jest.fn();
                const r = creerRes();

                aRole(ROLES.ADMIN)(creerReq({ role }), r, n);

                expect(n).not.toHaveBeenCalled();
                expect(r.status).toHaveBeenCalledWith(403);
            }
        });

        test("authentifié mais sans req.user : 403 sans exception", () => {
            const req = creerReq({ role: ROLES.ADMIN });
            req.user = undefined;

            expect(() => aRole(ROLES.ADMIN)(req, res, next)).not.toThrow();
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test("lit le rôle sur req.user et jamais sur la session", () => {
            const req = creerReq({ role: ROLES.PARENT });
            req.session = { user_role: "admin" };

            aRole(ROLES.ADMIN)(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test("fonctionne sans session", () => {
            const req = creerReq({ role: ROLES.ADMIN });
            delete req.session;

            expect(() => aRole(ROLES.ADMIN)(req, res, next)).not.toThrow();
            expect(next).toHaveBeenCalledTimes(1);
        });

        test("l'appel du middleware ne modifie pas la liste de rôles fournie", () => {
            const roles = [ROLES.ADMIN, ROLES.ENSEIGNANT];
            const middleware = aRole(...roles);

            middleware(creerReq({ role: ROLES.PARENT }), creerRes(), jest.fn());

            expect(roles).toEqual([ROLES.ADMIN, ROLES.ENSEIGNANT]);
        });

        test("des middlewares créés séparément ne partagent pas d'état", () => {
            const pourAdmin = aRole(ROLES.ADMIN);
            const pourParent = aRole(ROLES.PARENT);

            const n1 = jest.fn();
            const n2 = jest.fn();
            pourAdmin(creerReq({ role: ROLES.PARENT }), creerRes(), n1);
            pourParent(creerReq({ role: ROLES.PARENT }), creerRes(), n2);

            expect(n1).not.toHaveBeenCalled();
            expect(n2).toHaveBeenCalledTimes(1);
        });
    });
});
