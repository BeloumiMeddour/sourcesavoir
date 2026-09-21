/**
 * Tests unitaires pour model/acces.js : règles de visibilité des élèves.
 *
 * Prisma est simulé. Ces tests prouvent la FORME exacte des filtres produits et
 * la logique de décision (qui appelle quoi, avec quels arguments), pas la
 * sémantique réelle des where Prisma (à prouver sur une vraie base).
 */
import { jest } from "@jest/globals";

jest.mock("../../model/prisma.js", () => ({
    prisma: {
        eleve: { count: jest.fn() },
        lienEleveTuteur: { count: jest.fn() },
    },
}));

import { prisma } from "../../model/prisma.js";
import { ROLES } from "../../middleware/permissions.js";
import { filtreElevesVisibles, filtreInscriptionsVisibles, peutLireEleve, peutAgirPourEleve } from "../../model/acces.js";

const MAINTENANT = new Date("2026-09-20T12:00:00.000Z");
const ID_USER = 42;

const utilisateur = (role, id = ID_USER) => ({ id, role, etat: "valide" });

const filtreParent = (id = ID_USER) => ({
    liens: { some: { actif: true, peutLire: true, tuteur: { id_user: id } } },
});

const filtreEleve = (id = ID_USER) => ({ id_user: id });

const filtreEnseignant = (id = ID_USER, maintenant = MAINTENANT) => ({
    inscriptions: {
        some: {
            statut: "active",
            groupe: {
                annee: {
                    dateDebut: { lte: new Date(maintenant.toISOString().slice(0, 10) + "T00:00:00.000Z") },
                    dateFin: { gte: new Date(maintenant.toISOString().slice(0, 10) + "T00:00:00.000Z") },
                },
                affectations: { some: { professeur: { id_user: id } } },
            },
        },
    },
});

// Identifiants qui ne doivent JAMAIS atteindre Prisma : undefined ou null feraient
// disparaître la condition (where sans filtre) ou cibleraient les lignes sans compte.
const IDS_INVALIDES = [undefined, null, 0, -1, 1.5, NaN, Infinity, "42", "", {}, [42], true, 2147483648];

describe("filtreElevesVisibles", () => {
    test("parent : liens actifs en lecture vers un tuteur rattaché à son compte", () => {
        expect(filtreElevesVisibles(utilisateur(ROLES.PARENT), { maintenant: MAINTENANT })).toStrictEqual(
            filtreParent()
        );
    });

    test("eleve : uniquement sa propre fiche", () => {
        expect(filtreElevesVisibles(utilisateur(ROLES.ELEVE), { maintenant: MAINTENANT })).toStrictEqual(
            filtreEleve()
        );
    });

    test("enseignant : élèves inscrits (active) dans un groupe de l'année en cours où il a une affectation", () => {
        expect(filtreElevesVisibles(utilisateur(ROLES.ENSEIGNANT), { maintenant: MAINTENANT })).toStrictEqual(
            filtreEnseignant()
        );
    });

    test.each([ROLES.ADMIN, ROLES.RESPONSABLE])("%s : filtre vide (tous les élèves)", (role) => {
        expect(filtreElevesVisibles(utilisateur(role), { maintenant: MAINTENANT })).toStrictEqual({});
    });

    test("user (rôle hérité) : aucun accès scolaire", () => {
        expect(filtreElevesVisibles(utilisateur(ROLES.USER), { maintenant: MAINTENANT })).toBeNull();
    });

    test.each([undefined, null, "admin", 42, true, []])("utilisateur absent ou invalide (%p) : aucun accès", (user) => {
        expect(filtreElevesVisibles(user, { maintenant: MAINTENANT })).toBeNull();
    });

    test.each([
        ["superviseur"],
        ["professeur"],
        ["Admin"],
        ["ADMIN"],
        ["admin "],
        [" parent"],
        ["Parent"],
        [""],
        [null],
        [undefined],
        [0],
        [{}],
        [["admin"]],
    ])("rôle inconnu ou mal formé (%p) : aucun accès", (role) => {
        expect(filtreElevesVisibles({ id: ID_USER, role }, { maintenant: MAINTENANT })).toBeNull();
    });

    test.each([ROLES.PARENT, ROLES.ELEVE, ROLES.ENSEIGNANT])(
        "%s : un identifiant invalide donne aucun accès (jamais un where sans condition)",
        (role) => {
            for (const id of IDS_INVALIDES) {
                expect(filtreElevesVisibles({ id, role }, { maintenant: MAINTENANT })).toBeNull();
            }
        }
    );

    test("admin et responsable n'ont pas besoin d'identifiant", () => {
        expect(filtreElevesVisibles({ role: ROLES.ADMIN })).toStrictEqual({});
        expect(filtreElevesVisibles({ role: ROLES.RESPONSABLE })).toStrictEqual({});
    });

    test("l'identifiant utilisé est celui de req.user, pas un champ du corps ou d'ailleurs", () => {
        const user = { id: 7, role: ROLES.PARENT, id_user: 999, userId: 999, tuteur: { id_user: 999 } };
        expect(filtreElevesVisibles(user)).toStrictEqual(filtreParent(7));
    });

    describe("date de référence de l'enseignant", () => {
        test("l'année reste visible jusqu'à la fin de son dernier jour UTC", () => {
            const filtre = filtreElevesVisibles(utilisateur(ROLES.ENSEIGNANT), {
                maintenant: new Date("2027-06-30T23:59:59.999Z"),
            });
            const { annee } = filtre.inscriptions.some.groupe;
            const dernierJour = new Date("2027-06-30T00:00:00.000Z");
            expect(dernierJour >= annee.dateFin.gte).toBe(true);
            expect(annee.dateDebut.lte).toEqual(dernierJour);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("par défaut : le jour UTC courant", () => {
            jest.useFakeTimers({ now: MAINTENANT });

            const filtre = filtreElevesVisibles(utilisateur(ROLES.ENSEIGNANT));

            expect(filtre).toStrictEqual(filtreEnseignant());
            expect(filtre.inscriptions.some.groupe.annee.dateDebut.lte).toBeInstanceOf(Date);
        });

        test("un second argument vide ou sans maintenant retombe sur le jour UTC courant", () => {
            jest.useFakeTimers({ now: MAINTENANT });

            expect(filtreElevesVisibles(utilisateur(ROLES.ENSEIGNANT), {})).toStrictEqual(filtreEnseignant());
            expect(filtreElevesVisibles(utilisateur(ROLES.ENSEIGNANT), { maintenant: undefined })).toStrictEqual(
                filtreEnseignant()
            );
        });

        test("la date fournie est utilisée pour les deux bornes de l'année", () => {
            const autre = new Date("2027-01-15T00:00:00.000Z");

            const filtre = filtreElevesVisibles(utilisateur(ROLES.ENSEIGNANT), { maintenant: autre });

            const { annee } = filtre.inscriptions.some.groupe;
            expect(annee.dateDebut.lte).toEqual(autre);
            expect(annee.dateFin.gte).toEqual(autre);
        });
    });

    test("chaque appel retourne un objet neuf (aucun état partagé entre requêtes)", () => {
        const premier = filtreElevesVisibles(utilisateur(ROLES.PARENT));
        premier.liens.some.tuteur.id_user = 999;
        premier.pirate = true;

        expect(filtreElevesVisibles(utilisateur(ROLES.PARENT))).toStrictEqual(filtreParent());
        expect(filtreElevesVisibles(utilisateur(ROLES.ADMIN))).toStrictEqual({});
    });

    test("les rôles utilisés correspondent à ROLES de middleware/permissions.js", () => {
        // acces.js n'importe pas permissions.js (dépendance circulaire) : ce test détecte une dérive.
        const avecAcces = Object.values(ROLES).filter(
            (role) => filtreElevesVisibles({ id: ID_USER, role }, { maintenant: MAINTENANT }) !== null
        );
        expect(avecAcces.sort()).toEqual(
            [ROLES.ADMIN, ROLES.RESPONSABLE, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.ELEVE].sort()
        );
    });
});

describe("filtreInscriptionsVisibles", () => {
    test.each([ROLES.ADMIN, ROLES.RESPONSABLE, ROLES.PARENT, ROLES.ELEVE])("%s : seule la visibilité de l'élève filtre les inscriptions", (role) => {
        const user = utilisateur(role);
        expect(filtreInscriptionsVisibles(user, { maintenant: MAINTENANT })).toStrictEqual({
            eleve: filtreElevesVisibles(user, { maintenant: MAINTENANT }),
        });
    });

    test("enseignant : inscriptions actives des groupes de l'année en cours qui lui sont affectés", () => {
        const attendu = filtreEnseignant();
        expect(filtreInscriptionsVisibles(utilisateur(ROLES.ENSEIGNANT), { maintenant: MAINTENANT })).toStrictEqual({
            eleve: attendu,
            ...attendu.inscriptions.some,
        });
    });

    test("enseignant : le groupe doit lui être affecté (son propre compte, pas un autre)", () => {
        const { groupe } = filtreInscriptionsVisibles(utilisateur(ROLES.ENSEIGNANT, 7), { maintenant: MAINTENANT });
        expect(groupe.affectations).toStrictEqual({ some: { professeur: { id_user: 7 } } });
    });

    test.each([ROLES.USER, "inconnu", undefined, null])("rôle %p : aucun accès (null)", (role) => {
        expect(filtreInscriptionsVisibles({ id: ID_USER, role })).toBeNull();
    });

    test.each([undefined, null, "admin", 42, []])("utilisateur invalide %p : null", (user) => {
        expect(filtreInscriptionsVisibles(user)).toBeNull();
    });

    test.each(IDS_INVALIDES.map((id) => [JSON.stringify(id) ?? String(id), id]))(
        "enseignant avec identifiant invalide (%s) : null",
        (_nom, id) => {
            expect(filtreInscriptionsVisibles({ id, role: ROLES.ENSEIGNANT })).toBeNull();
        }
    );
});

describe("peutLireEleve", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.eleve.count.mockResolvedValue(1);
    });

    test("aucun accès (filtre null) : false sans interroger la base", async () => {
        expect(await peutLireEleve(utilisateur(ROLES.USER), 5)).toBe(false);
        expect(await peutLireEleve(undefined, 5)).toBe(false);
        expect(await peutLireEleve(null, 5)).toBe(false);
        expect(await peutLireEleve({ id: ID_USER, role: "inconnu" }, 5)).toBe(false);

        expect(prisma.eleve.count).not.toHaveBeenCalled();
    });

    test("interroge count avec l'id ET le filtre de visibilité du rôle (AND)", async () => {
        expect(await peutLireEleve(utilisateur(ROLES.PARENT), 5)).toBe(true);

        expect(prisma.eleve.count).toHaveBeenCalledTimes(1);
        expect(prisma.eleve.count).toHaveBeenCalledWith({ where: { AND: [{ id: 5 }, filtreParent()] } });
    });

    test("eleve : filtre sur son propre compte", async () => {
        await peutLireEleve(utilisateur(ROLES.ELEVE), 5);

        expect(prisma.eleve.count).toHaveBeenCalledWith({ where: { AND: [{ id: 5 }, filtreEleve()] } });
    });

    test("enseignant : filtre par groupe et année en cours", async () => {
        // Horloge figée : le filtre compare le jour UTC courant, il faut connaître ce jour
        jest.useFakeTimers({ now: MAINTENANT });
        try {
            await peutLireEleve(utilisateur(ROLES.ENSEIGNANT), 5);
        } finally {
            jest.useRealTimers();
        }

        expect(prisma.eleve.count).toHaveBeenCalledWith({
            where: { AND: [{ id: 5 }, filtreEnseignant(ID_USER, MAINTENANT)] },
        });
    });

    test.each([ROLES.ADMIN, ROLES.RESPONSABLE])("%s : filtre vide, mais l'existence de l'élève est vérifiée", async (role) => {
        await peutLireEleve(utilisateur(role), 5);

        expect(prisma.eleve.count).toHaveBeenCalledWith({ where: { AND: [{ id: 5 }, {}] } });
    });

    test("count = 0 : false (élève inexistant ou hors périmètre, indiscernables)", async () => {
        prisma.eleve.count.mockResolvedValue(0);

        expect(await peutLireEleve(utilisateur(ROLES.PARENT), 5)).toBe(false);
    });

    test("count > 0 : true", async () => {
        prisma.eleve.count.mockResolvedValue(3);

        expect(await peutLireEleve(utilisateur(ROLES.ADMIN), 5)).toBe(true);
    });

    test.each(IDS_INVALIDES.map((id) => [JSON.stringify(id) ?? String(id), id]))(
        "identifiant d'élève invalide (%s) : false sans interroger la base",
        async (_nom, id) => {
            expect(await peutLireEleve(utilisateur(ROLES.ADMIN), id)).toBe(false);
            expect(prisma.eleve.count).not.toHaveBeenCalled();
        }
    );

    test("une erreur de base remonte (jamais un true ou un false silencieux)", async () => {
        prisma.eleve.count.mockRejectedValue(new Error("base indisponible"));

        await expect(peutLireEleve(utilisateur(ROLES.PARENT), 5)).rejects.toThrow("base indisponible");
    });

    test("un seul générateur de filtre : le détail utilise exactement le where de la liste", async () => {
        jest.useFakeTimers({ now: MAINTENANT });
        try {
            for (const role of Object.values(ROLES)) {
                prisma.eleve.count.mockClear();
                const user = utilisateur(role);

                await peutLireEleve(user, 5);

                const filtreListe = filtreElevesVisibles(user);
                if (filtreListe === null) {
                    expect(prisma.eleve.count).not.toHaveBeenCalled();
                } else {
                    expect(prisma.eleve.count).toHaveBeenCalledWith({ where: { AND: [{ id: 5 }, filtreListe] } });
                }
            }
        } finally {
            jest.useRealTimers();
        }
    });

    test("l'id demandé est un élément de la conjonction : il ne peut pas remplacer le filtre", async () => {
        await peutLireEleve(utilisateur(ROLES.PARENT), 5);

        const { where } = prisma.eleve.count.mock.calls[0][0];
        expect(Object.keys(where)).toEqual(["AND"]);
        expect(where.AND).toHaveLength(2);
        expect(where.AND[0]).toStrictEqual({ id: 5 });
    });
});

describe("peutAgirPourEleve", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.lienEleveTuteur.count.mockResolvedValue(1);
    });

    test.each([ROLES.ADMIN, ROLES.RESPONSABLE])("%s : true sans interroger la base", async (role) => {
        expect(await peutAgirPourEleve(utilisateur(role), 5)).toBe(true);

        expect(prisma.lienEleveTuteur.count).not.toHaveBeenCalled();
    });

    test("parent : lien actif avec peutLire ET peutAgir vers un tuteur rattaché à son compte", async () => {
        expect(await peutAgirPourEleve(utilisateur(ROLES.PARENT), 5)).toBe(true);

        expect(prisma.lienEleveTuteur.count).toHaveBeenCalledTimes(1);
        expect(prisma.lienEleveTuteur.count).toHaveBeenCalledWith({
            where: { id_eleve: 5, actif: true, peutLire: true, peutAgir: true, tuteur: { id_user: ID_USER } },
        });
    });

    test("parent sans lien qualifié (count = 0) : false", async () => {
        prisma.lienEleveTuteur.count.mockResolvedValue(0);

        expect(await peutAgirPourEleve(utilisateur(ROLES.PARENT), 5)).toBe(false);
    });

    test.each([ROLES.ENSEIGNANT, ROLES.ELEVE, ROLES.USER, "inconnu", "Admin", "", null, undefined])(
        "rôle %p : false sans interroger la base",
        async (role) => {
            expect(await peutAgirPourEleve({ id: ID_USER, role }, 5)).toBe(false);

            expect(prisma.lienEleveTuteur.count).not.toHaveBeenCalled();
        }
    );

    test.each([undefined, null, "admin", 42, []])("utilisateur absent ou invalide (%p) : false", async (user) => {
        expect(await peutAgirPourEleve(user, 5)).toBe(false);

        expect(prisma.lienEleveTuteur.count).not.toHaveBeenCalled();
    });

    test.each(IDS_INVALIDES.map((id) => [JSON.stringify(id) ?? String(id), id]))(
        "parent avec identifiant d'utilisateur invalide (%s) : false (sinon le filtre tuteur serait vide)",
        async (_nom, id) => {
            expect(await peutAgirPourEleve({ id, role: ROLES.PARENT }, 5)).toBe(false);

            expect(prisma.lienEleveTuteur.count).not.toHaveBeenCalled();
        }
    );

    test.each(IDS_INVALIDES.map((id) => [JSON.stringify(id) ?? String(id), id]))(
        "parent avec identifiant d'élève invalide (%s) : false sans interroger la base",
        async (_nom, id) => {
            expect(await peutAgirPourEleve(utilisateur(ROLES.PARENT), id)).toBe(false);

            expect(prisma.lienEleveTuteur.count).not.toHaveBeenCalled();
        }
    );

    test("une erreur de base remonte", async () => {
        prisma.lienEleveTuteur.count.mockRejectedValue(new Error("base indisponible"));

        await expect(peutAgirPourEleve(utilisateur(ROLES.PARENT), 5)).rejects.toThrow("base indisponible");
    });

    test("agir exige de pouvoir lire : un lien peutAgir sans peutLire ne suffit jamais", async () => {
        await peutAgirPourEleve(utilisateur(ROLES.PARENT), 5);

        const { where } = prisma.lienEleveTuteur.count.mock.calls[0][0];
        expect(where.peutAgir).toBe(true);
        expect(where.peutLire).toBe(true);
        expect(where.actif).toBe(true);
    });
});
