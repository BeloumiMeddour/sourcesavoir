import { jest } from "@jest/globals";

// Aucun client ni serveur SQL n'est chargé : seuls les contrats des requêtes
// et les validations sont vérifiés ici.
jest.mock("../../model/prisma.js", () => ({
    prisma: {
        anneeScolaire: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
        niveau: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
        groupe: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
        eleve: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
        tuteur: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
        user: { findUnique: jest.fn() },
        lienEleveTuteur: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
        inscription: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
        $transaction: jest.fn(),
    },
}));

import { prisma } from "../../model/prisma.js";
import { filtreElevesVisibles, filtreInscriptionsVisibles } from "../../model/acces.js";
import { ErreurValidation, ErreurIntrouvable, ErreurConflit } from "../../model/validation.js";
import { listerAnnees, creerAnnee } from "../../model/anneeScolaire.js";
import { listerNiveaux, creerNiveau } from "../../model/niveau.js";
import { listerGroupes, creerGroupe } from "../../model/groupe.js";
import { listerEleves, obtenirEleve, creerEleve } from "../../model/eleve.js";
import { creerTuteur } from "../../model/tuteur.js";
import { creerLien, modifierLien } from "../../model/lienEleveTuteur.js";
import { listerInscriptions, creerInscription, promouvoirEleve } from "../../model/inscription.js";

const ANNEE = { libelle: "2026-2027", dateDebut: "2026-09-01", dateFin: "2027-06-30" };
const NIVEAU = { code: "SEC1", libelle: "Secondaire 1", ordre: 1 };
const GROUPE = { code: "A", id_annee: 2, id_niveau: 3 };
const ELEVE = { matricule: "E001", nom: "Martin", prenom: "Lou" };
const TUTEUR = { nom: "Martin", prenom: "Camille" };
const LIEN = { id_tuteur: 7, parente: "parent" };
const INSCRIPTION = { id_eleve: 5, id_annee: 2, id_groupe: 4 };
const SELECT_ELEVE = { id: true, matricule: true, nom: true, prenom: true, dateNaissance: true };
const CREATIONS = [
    ["année", creerAnnee, ANNEE, prisma.anneeScolaire],
    ["niveau", creerNiveau, NIVEAU, prisma.niveau],
    ["groupe", creerGroupe, GROUPE, prisma.groupe],
    ["élève", creerEleve, ELEVE, prisma.eleve],
    ["tuteur", creerTuteur, TUTEUR, prisma.tuteur],
    ["lien", (donnees) => creerLien(5, donnees), LIEN, prisma.lienEleveTuteur],
    ["inscription", creerInscription, INSCRIPTION, prisma.inscription],
];

beforeEach(() => {
    jest.resetAllMocks();
    prisma.anneeScolaire.findUnique.mockResolvedValue({ id: 2, dateDebut: new Date("2026-09-01T00:00:00.000Z") });
    prisma.niveau.findUnique.mockResolvedValue({ id: 3 });
    prisma.groupe.findUnique.mockResolvedValue({ id: 4, id_annee: 2 });
    prisma.eleve.findUnique.mockResolvedValue({ id: 5 });
    prisma.tuteur.findUnique.mockResolvedValue({ id: 7 });
    prisma.inscription.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (operation) => operation(prisma));
});

describe("Contrats de création du socle scolaire", () => {
    test.each(CREATIONS)("%s : refuse un corps non objet et les champs inconnus", async (_nom, creer, donnees, modele) => {
        for (const corps of [null, undefined, [], "texte", 42]) {
            await expect(creer(corps)).rejects.toBeInstanceOf(ErreurValidation);
        }
        for (const champ of ["user", "create", "id", "createdAt", "inconnu"]) {
            await expect(creer({ ...donnees, [champ]: { connect: { id: 99 } } })).rejects.toBeInstanceOf(ErreurValidation);
        }
        expect(modele.create).not.toHaveBeenCalled();
    });

    test.each(CREATIONS)("%s : refuse les opérations imbriquées dans chaque champ scalaire", async (_nom, creer, donnees, modele) => {
        for (const champ of Object.keys(donnees)) {
            await expect(creer({ ...donnees, [champ]: { set: donnees[champ] } })).rejects.toBeInstanceOf(ErreurValidation);
        }
        expect(modele.create).not.toHaveBeenCalled();
    });

    test.each(CREATIONS)("%s : transmet les erreurs Prisma sans les déguiser", async (_nom, creer, donnees, modele) => {
        for (const code of ["P2002", "P2003"]) {
            const erreur = Object.assign(new Error("erreur simulée"), { code });
            modele.create.mockRejectedValueOnce(erreur);
            await expect(creer(donnees)).rejects.toBe(erreur);
        }
    });

    test.each([
        [creerAnnee, ANNEE, "libelle", 20],
        [creerNiveau, NIVEAU, "code", 20],
        [creerNiveau, NIVEAU, "libelle", 100],
        [creerGroupe, GROUPE, "code", 30],
        [creerEleve, ELEVE, "matricule", 30],
        [creerEleve, ELEVE, "nom", 100],
        [creerEleve, ELEVE, "prenom", 100],
        [creerTuteur, TUTEUR, "nom", 100],
        [creerTuteur, TUTEUR, "prenom", 100],
        [creerTuteur, TUTEUR, "telephone", 30],
        [(donnees) => creerLien(5, donnees), LIEN, "parente", 30],
    ])("respecte la taille SQL du champ %s / %s / %s", async (creer, donnees, champ, taille) => {
        await expect(creer({ ...donnees, [champ]: "x".repeat(taille + 1) })).rejects.toBeInstanceOf(ErreurValidation);
    });
});

describe("Années, niveaux et groupes", () => {
    test("crée des dates UTC et nettoie le libellé", async () => {
        await creerAnnee({ ...ANNEE, libelle: " 2026-2027 " });
        expect(prisma.anneeScolaire.create).toHaveBeenCalledWith(expect.objectContaining({ data: {
            libelle: "2026-2027",
            dateDebut: new Date("2026-09-01T00:00:00.000Z"),
            dateFin: new Date("2027-06-30T00:00:00.000Z"),
        } }));
    });

    test.each(["2026-02-30", "2026-09-01T00:00:00Z", "01/09/2026"])("refuse la date %s", async (dateDebut) => {
        await expect(creerAnnee({ ...ANNEE, dateDebut })).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.anneeScolaire.create).not.toHaveBeenCalled();
    });

    test.each(["2026-08-31", "2026-09-01"])("la fin %s doit suivre le début", async (dateFin) => {
        await expect(creerAnnee({ ...ANNEE, dateFin })).rejects.toBeInstanceOf(ErreurValidation);
    });

    test("liste les référentiels dans un ordre stable", async () => {
        await listerAnnees();
        await listerNiveaux();
        await listerGroupes();
        expect(prisma.anneeScolaire.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ dateDebut: "desc" }, { id: "desc" }] }));
        expect(prisma.niveau.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ ordre: "asc" }, { code: "asc" }] }));
        expect(prisma.groupe.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ id_annee: "desc" }, { code: "asc" }] }));
    });

    test.each([-1, 1.2, "1", 2147483648])("refuse un ordre invalide %p", async (ordre) => {
        await expect(creerNiveau({ ...NIVEAU, ordre })).rejects.toBeInstanceOf(ErreurValidation);
    });

    test("le groupe utilise uniquement des références scalaires validées", async () => {
        await creerGroupe({ ...GROUPE, capacite: 25 });
        expect(prisma.groupe.create).toHaveBeenCalledWith(expect.objectContaining({ data: { ...GROUPE, capacite: 25 } }));
        expect(prisma.anneeScolaire.findUnique).toHaveBeenCalledWith({ where: { id: 2 }, select: { id: true } });
        expect(prisma.niveau.findUnique).toHaveBeenCalledWith({ where: { id: 3 }, select: { id: true } });
    });

    test.each(["id_annee", "id_niveau", "capacite"])("refuse une valeur non positive dans %s", async (champ) => {
        for (const valeur of [0, -1, 1.5, "2", 2147483648]) {
            await expect(creerGroupe({ ...GROUPE, [champ]: valeur })).rejects.toBeInstanceOf(ErreurValidation);
        }
        expect(prisma.groupe.create).not.toHaveBeenCalled();
    });

    test.each(["anneeScolaire", "niveau"])("refuse un groupe dont la référence %s est absente", async (modele) => {
        prisma[modele].findUnique.mockResolvedValue(null);
        await expect(creerGroupe(GROUPE)).rejects.toBeInstanceOf(ErreurIntrouvable);
        expect(prisma.groupe.create).not.toHaveBeenCalled();
    });
});

describe("Élèves, tuteurs et liens", () => {
    test("crée une fiche élève sans exposer son compte", async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 9, role: "eleve" });
        await creerEleve({ ...ELEVE, dateNaissance: "2012-02-29", id_user: 9 });
        expect(prisma.eleve.create).toHaveBeenCalledWith({
            data: { ...ELEVE, dateNaissance: new Date("2012-02-29T00:00:00.000Z"), id_user: 9 },
            select: SELECT_ELEVE,
        });
    });

    test.each([creerEleve, creerTuteur])("les comptes optionnels acceptent null, jamais un identifiant mal formé", async (creer) => {
        const donnees = creer === creerEleve ? ELEVE : TUTEUR;
        await creer({ ...donnees, id_user: null });
        for (const id_user of [0, -1, "9", {}, [], 1.5]) {
            await expect(creer({ ...donnees, id_user })).rejects.toBeInstanceOf(ErreurValidation);
        }
    });

    test("valide courriel et téléphone sans transmettre de relations", async () => {
        await creerTuteur({ ...TUTEUR, courriel: " camille@example.org ", telephone: " 0123456789 " });
        expect(prisma.tuteur.create).toHaveBeenCalledWith(expect.objectContaining({ data: {
            ...TUTEUR, courriel: "camille@example.org", telephone: "0123456789", id_user: null,
        } }));
        await expect(creerTuteur({ ...TUTEUR, courriel: "invalide" })).rejects.toBeInstanceOf(ErreurValidation);
        await expect(creerTuteur({ ...TUTEUR, courriel: `${"x".repeat(146)}@a.fr` })).rejects.toBeInstanceOf(ErreurValidation);
    });

    test.each(["parent", "eleve", "enseignant", "admin", "responsable"])("liste et détail appliquent le même filtre pour %s", async (role) => {
        jest.useFakeTimers({ now: new Date("2026-09-20T12:00:00.000Z") });
        try {
            const user = { id: 42, role };
            const filtre = filtreElevesVisibles(user);
            prisma.eleve.findFirst.mockResolvedValue({ id: 5 });
            await listerEleves(user);
            await obtenirEleve(user, 5);
            expect(prisma.eleve.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: filtre, select: SELECT_ELEVE }));
            expect(prisma.eleve.findFirst).toHaveBeenCalledWith({ where: { AND: [{ id: 5 }, filtre] }, select: SELECT_ELEVE });
        } finally {
            jest.useRealTimers();
        }
    });

    test("aucun accès : liste vide et détail introuvable sans requête", async () => {
        expect(await listerEleves({ id: 42, role: "user" })).toEqual([]);
        await expect(obtenirEleve({ id: 42, role: "user" }, 5)).rejects.toBeInstanceOf(ErreurIntrouvable);
        expect(prisma.eleve.findMany).not.toHaveBeenCalled();
        expect(prisma.eleve.findFirst).not.toHaveBeenCalled();
    });

    test("élève absent ou hors périmètre : même erreur sans lecture élargie", async () => {
        prisma.eleve.findFirst.mockResolvedValue(null);
        await expect(obtenirEleve({ id: 42, role: "parent" }, 5)).rejects.toBeInstanceOf(ErreurIntrouvable);
        expect(prisma.eleve.findUnique).not.toHaveBeenCalled();
    });

    test.each([undefined, null, 0, "5", 1.2, 2147483648])("détail : refuse l'identifiant %p", async (id) => {
        await expect(obtenirEleve({ role: "admin" }, id)).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.eleve.findFirst).not.toHaveBeenCalled();
    });

    test("le lien prend son élève dans le chemin et applique les valeurs par défaut", async () => {
        await creerLien(5, LIEN);
        expect(prisma.lienEleveTuteur.create).toHaveBeenCalledWith(expect.objectContaining({ data: {
            id_eleve: 5, ...LIEN, peutLire: true, peutAgir: false, actif: true,
        } }));
        await expect(creerLien(5, { ...LIEN, id_eleve: 99 })).rejects.toBeInstanceOf(ErreurValidation);
    });

    test.each(["peutLire", "peutAgir", "actif"])("le droit %s exige un booléen", async (champ) => {
        await expect(creerLien(5, { ...LIEN, [champ]: "true" })).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.lienEleveTuteur.create).not.toHaveBeenCalled();
    });

    test.each(["eleve", "tuteur"])("un lien exige une référence %s existante", async (modele) => {
        prisma[modele].findUnique.mockResolvedValue(null);
        await expect(creerLien(5, LIEN)).rejects.toBeInstanceOf(ErreurIntrouvable);
        expect(prisma.lienEleveTuteur.create).not.toHaveBeenCalled();
    });
});

describe("Compte rattaché à un élève ou à un tuteur (id_user)", () => {
    const CAS = [
        ["élève", creerEleve, ELEVE, "eleve", "parent", () => prisma.eleve],
        ["tuteur", creerTuteur, TUTEUR, "parent", "eleve", () => prisma.tuteur],
    ];

    test.each(CAS)("%s : un compte existant du bon rôle et encore libre est rattaché", async (_nom, creer, donnees, role, _autre, modele) => {
        prisma.user.findUnique.mockResolvedValue({ id: 9, role });
        modele().findFirst.mockResolvedValue(null);
        await creer({ ...donnees, id_user: 9 });
        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 9 }, select: { id: true, role: true } });
        expect(modele().findFirst).toHaveBeenCalledWith({ where: { id_user: 9 }, select: { id: true } });
        expect(modele().create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id_user: 9 }) }));
    });

    test.each(CAS)("%s : un compte inexistant est refusé (400) sans création", async (_nom, creer, donnees, role, _autre, modele) => {
        prisma.user.findUnique.mockResolvedValue(null);
        const erreur = await creer({ ...donnees, id_user: 9 }).catch((e) => e);
        expect(erreur).toBeInstanceOf(ErreurValidation);
        expect(erreur.message).toContain("id_user");
        expect(erreur.message).toContain(role);
        expect(modele().create).not.toHaveBeenCalled();
    });

    test.each(CAS)("%s : un compte d'un autre rôle est refusé (400) sans création", async (_nom, creer, donnees, role, autre, modele) => {
        for (const roleRefuse of [autre, "admin", "responsable", "enseignant", "user", "inconnu", null]) {
            prisma.user.findUnique.mockResolvedValue({ id: 9, role: roleRefuse });
            const erreur = await creer({ ...donnees, id_user: 9 }).catch((e) => e);
            expect(erreur).toBeInstanceOf(ErreurValidation);
            expect(erreur.message).toContain(role);
        }
        expect(modele().create).not.toHaveBeenCalled();
    });

    test.each(CAS)("%s : un compte déjà rattaché à un autre enregistrement donne un conflit (409)", async (_nom, creer, donnees, role, _autre, modele) => {
        prisma.user.findUnique.mockResolvedValue({ id: 9, role });
        modele().findFirst.mockResolvedValue({ id: 31 });
        const erreur = await creer({ ...donnees, id_user: 9 }).catch((e) => e);
        expect(erreur).toBeInstanceOf(ErreurConflit);
        expect(erreur.message).toMatch(/déjà rattaché/);
        expect(modele().create).not.toHaveBeenCalled();
    });

    test.each(CAS)("%s : sans id_user, aucune lecture de compte", async (_nom, creer, donnees, _role, _autre, modele) => {
        await creer(donnees);
        await creer({ ...donnees, id_user: null });
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
        expect(modele().findFirst).not.toHaveBeenCalled();
        expect(modele().create).toHaveBeenCalledTimes(2);
    });

    test.each(CAS)("%s : le corps invalide est refusé avant la lecture du compte", async (_nom, creer, donnees) => {
        await expect(creer({ ...donnees, nom: 42, id_user: 9 })).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
});

describe("Liens élève-tuteur : cohérence des droits et modification", () => {
    test("peutAgir sans peutLire est refusé à la création, sans lecture en base", async () => {
        const erreur = await creerLien(5, { ...LIEN, peutAgir: true, peutLire: false }).catch((e) => e);
        expect(erreur).toBeInstanceOf(ErreurValidation);
        expect(erreur.message).toContain("peutAgir");
        expect(prisma.eleve.findUnique).not.toHaveBeenCalled();
        expect(prisma.lienEleveTuteur.create).not.toHaveBeenCalled();
    });

    test.each([
        [{ peutAgir: true }], [{ peutAgir: true, peutLire: true }], [{ peutLire: false }],
        [{ peutLire: false, peutAgir: false }], [{ peutLire: true, peutAgir: false, actif: false }],
    ])("la création accepte la combinaison cohérente %j", async (droits) => {
        await creerLien(5, { ...LIEN, ...droits });
        expect(prisma.lienEleveTuteur.create).toHaveBeenCalledTimes(1);
    });

    const LIEN_ACTUEL = { peutLire: true, peutAgir: false };
    const SELECTION_LIEN = { id: true, id_eleve: true, id_tuteur: true, parente: true, peutLire: true, peutAgir: true, actif: true };
    beforeEach(() => {
        prisma.lienEleveTuteur.findFirst.mockResolvedValue(LIEN_ACTUEL);
        prisma.lienEleveTuteur.update.mockResolvedValue({ id: 8, id_eleve: 5, actif: false });
    });

    test("révoque un lien (actif: false) en le cherchant dans le périmètre de l'élève", async () => {
        expect(await modifierLien(5, 8, { actif: false })).toEqual({ id: 8, id_eleve: 5, actif: false });
        expect(prisma.lienEleveTuteur.findFirst).toHaveBeenCalledWith({
            where: { id: 8, id_eleve: 5 }, select: { peutLire: true, peutAgir: true },
        });
        expect(prisma.lienEleveTuteur.update).toHaveBeenCalledWith({
            where: { id: 8, id_eleve: 5, peutLire: true, peutAgir: false },
            data: { actif: false },
            select: SELECTION_LIEN,
        });
    });

    test("ne transmet que les champs fournis (liste blanche actif, peutLire, peutAgir)", async () => {
        await modifierLien(5, 8, { peutLire: true, peutAgir: true, actif: true });
        expect(prisma.lienEleveTuteur.update.mock.calls[0][0].data).toEqual({ peutLire: true, peutAgir: true, actif: true });
    });

    test.each([
        [{ id_tuteur: 2 }], [{ id_eleve: 9 }], [{ parente: "mere" }], [{ id: 3 }], [{ actif: false, inconnu: 1 }],
        [{ actif: { set: false } }],
    ])("refuse les champs hors liste blanche ou imbriqués : %j", async (corps) => {
        await expect(modifierLien(5, 8, corps)).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.lienEleveTuteur.findFirst).not.toHaveBeenCalled();
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test.each(["true", 1, 0, null, "false", []])("refuse le booléen non strict %p", async (valeur) => {
        for (const champ of ["actif", "peutLire", "peutAgir"]) {
            await expect(modifierLien(5, 8, { [champ]: valeur })).rejects.toBeInstanceOf(ErreurValidation);
        }
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test.each([null, undefined, [], "texte", 42, {}])("refuse le corps %p (aucun champ modifiable)", async (corps) => {
        await expect(modifierLien(5, 8, corps)).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test.each([[0], [-1], [1.5], ["8"], [2147483648], [null], [undefined]])("refuse l'identifiant de lien %p", async (idLien) => {
        await expect(modifierLien(5, idLien, { actif: false })).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test("lien inexistant ou d'un autre élève : introuvable, sans écriture", async () => {
        prisma.lienEleveTuteur.findFirst.mockResolvedValue(null);
        await expect(modifierLien(5, 8, { actif: false })).rejects.toBeInstanceOf(ErreurIntrouvable);
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test("peutAgir: true sur un lien sans lecture est refusé à la modification", async () => {
        prisma.lienEleveTuteur.findFirst.mockResolvedValue({ peutLire: false, peutAgir: false });
        await expect(modifierLien(5, 8, { peutAgir: true })).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test("peutAgir et peutLire incohérents dans le même corps : refusé", async () => {
        await expect(modifierLien(5, 8, { peutAgir: true, peutLire: false })).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
    });

    test("retirer peutLire d'un lien qui agit encore est refusé (retirer peutAgir d'abord)", async () => {
        prisma.lienEleveTuteur.findFirst.mockResolvedValue({ peutLire: true, peutAgir: true });
        await expect(modifierLien(5, 8, { peutLire: false })).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.lienEleveTuteur.update).not.toHaveBeenCalled();
        await modifierLien(5, 8, { peutLire: false, peutAgir: false });
        expect(prisma.lienEleveTuteur.update).toHaveBeenCalledTimes(1);
    });

    test("un lien sans lecture peut recevoir peutLire et peutAgir ensemble", async () => {
        prisma.lienEleveTuteur.findFirst.mockResolvedValue({ peutLire: false, peutAgir: false });
        await modifierLien(5, 8, { peutLire: true, peutAgir: true });
        expect(prisma.lienEleveTuteur.update).toHaveBeenCalledTimes(1);
    });

    test("un lien modifié ou supprimé entre la lecture et l'écriture donne un conflit (409)", async () => {
        prisma.lienEleveTuteur.update.mockRejectedValue(Object.assign(new Error("interne"), { code: "P2025" }));
        await expect(modifierLien(5, 8, { actif: false })).rejects.toBeInstanceOf(ErreurConflit);
    });

    test("les autres erreurs Prisma remontent inchangées", async () => {
        const erreur = Object.assign(new Error("panne"), { code: "P1001" });
        prisma.lienEleveTuteur.update.mockRejectedValue(erreur);
        await expect(modifierLien(5, 8, { actif: false })).rejects.toBe(erreur);
    });
});

describe("Inscriptions et promotion", () => {
    test("lit les inscriptions et leur autorisation dans une seule requête", async () => {
        const user = { id: 42, role: "parent" };
        const inscriptions = [{ id: 10, ...INSCRIPTION, statut: "active" }];
        prisma.eleve.findFirst.mockResolvedValue({ inscriptions });
        expect(await listerInscriptions(user, 5)).toEqual(inscriptions);
        expect(prisma.eleve.findFirst).toHaveBeenCalledTimes(1);
        const requete = prisma.eleve.findFirst.mock.calls[0][0];
        expect(requete.where).toEqual({ AND: [{ id: 5 }, filtreElevesVisibles(user)] });
        expect(Object.keys(requete.select)).toEqual(["inscriptions"]);
        expect(requete.select.inscriptions.where).toEqual({ eleve: filtreElevesVisibles(user) });
        const selection = requete.select.inscriptions.select;
        expect(selection).not.toHaveProperty("eleve");
        expect(selection).not.toHaveProperty("liens");
        expect(selection.groupe.select).toHaveProperty("annee.select.libelle", true);
        expect(selection.groupe.select).not.toHaveProperty("inscriptions");
    });

    test("enseignant : seules les inscriptions actives des groupes de l'année en cours qui lui sont affectés sont lues", async () => {
        jest.useFakeTimers({ now: new Date("2026-09-20T12:00:00.000Z") });
        try {
            const user = { id: 42, role: "enseignant" };
            prisma.eleve.findFirst.mockResolvedValue({ inscriptions: [] });
            await listerInscriptions(user, 5);
            const requete = prisma.eleve.findFirst.mock.calls[0][0];
            const filtre = filtreElevesVisibles(user);
            expect(requete.where).toEqual({ AND: [{ id: 5 }, filtre] });
            // Même générateur : la restriction est le prédicat d'inscription du filtre élève.
            expect(requete.select.inscriptions.where).toEqual({ eleve: filtre, ...filtre.inscriptions.some });
            expect(requete.select.inscriptions.where).toEqual(filtreInscriptionsVisibles(user));
            expect(requete.select.inscriptions.where.groupe.affectations).toEqual({ some: { professeur: { id_user: 42 } } });
            expect(requete.select.inscriptions.where.statut).toBe("active");
        } finally {
            jest.useRealTimers();
        }
    });

    test.each(["admin", "responsable", "parent", "eleve"])("%s : l'historique complet reste filtré par la seule visibilité de l'élève", async (role) => {
        const user = { id: 42, role };
        prisma.eleve.findFirst.mockResolvedValue({ inscriptions: [] });
        await listerInscriptions(user, 5);
        expect(prisma.eleve.findFirst.mock.calls[0][0].select.inscriptions.where).toEqual({ eleve: filtreElevesVisibles(user) });
    });

    test("inscriptions non visibles ou absentes : introuvable, jamais une liste élargie", async () => {
        prisma.eleve.findFirst.mockResolvedValue(null);
        await expect(listerInscriptions({ id: 42, role: "parent" }, 5)).rejects.toBeInstanceOf(ErreurIntrouvable);
        prisma.eleve.findFirst.mockClear();
        await expect(listerInscriptions({ role: "user" }, 5)).rejects.toBeInstanceOf(ErreurIntrouvable);
        expect(prisma.eleve.findFirst).not.toHaveBeenCalled();
    });

    test("crée une inscription active par défaut", async () => {
        await creerInscription(INSCRIPTION);
        expect(prisma.inscription.create).toHaveBeenCalledWith(expect.objectContaining({ data: { ...INSCRIPTION, statut: "active" } }));
    });

    test.each(["active", "terminee", "annulee"])("accepte le statut %s", async (statut) => {
        await creerInscription({ ...INSCRIPTION, statut });
        expect(prisma.inscription.create).toHaveBeenCalledWith(expect.objectContaining({ data: { ...INSCRIPTION, statut } }));
    });

    test.each([null, "en_attente", "ACTIVE", true, { set: "active" }])("refuse le statut %p", async (statut) => {
        await expect(creerInscription({ ...INSCRIPTION, statut })).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.inscription.create).not.toHaveBeenCalled();
    });

    test("l'inscription exige un groupe de la même année", async () => {
        prisma.groupe.findUnique.mockResolvedValue({ id: 4, id_annee: 99 });
        await expect(creerInscription(INSCRIPTION)).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.inscription.create).not.toHaveBeenCalled();
    });

    test.each(["eleve", "anneeScolaire", "groupe"])("inscription : la référence %s doit exister", async (modele) => {
        prisma[modele].findUnique.mockResolvedValue(null);
        await expect(creerInscription(INSCRIPTION)).rejects.toBeInstanceOf(ErreurIntrouvable);
        expect(prisma.inscription.create).not.toHaveBeenCalled();
    });

    test("la promotion conserve l'historique et crée dans une transaction sérialisable", async () => {
        const ancienne = { groupe: { annee: { dateDebut: new Date("2025-09-01T00:00:00.000Z") } } };
        prisma.inscription.findFirst.mockResolvedValue(ancienne);
        const nouvelle = { id: 12, ...INSCRIPTION, statut: "active" };
        prisma.inscription.create.mockResolvedValue(nouvelle);
        expect(await promouvoirEleve(5, { id_annee: 2, id_groupe: 4 })).toEqual(nouvelle);
        expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
        expect(prisma.inscription.findFirst).toHaveBeenCalledWith({
            where: { id_eleve: 5 },
            orderBy: { groupe: { annee: { dateDebut: "desc" } } },
            select: { groupe: { select: { annee: { select: { dateDebut: true } } } } },
        });
        expect(prisma.inscription.create).toHaveBeenCalledTimes(1);
        expect(prisma.inscription.create).toHaveBeenCalledWith(expect.objectContaining({ data: nouvelleSansId(nouvelle) }));
        expect(prisma.inscription.update).not.toHaveBeenCalled();
        expect(prisma.inscription.delete).not.toHaveBeenCalled();
        expect(ancienne.groupe.annee.dateDebut.toISOString()).toBe("2025-09-01T00:00:00.000Z");
    });

    test.each(["2026-09-01", "2027-09-01"])("promotion refusée si l'historique atteint %s", async (derniereDate) => {
        prisma.inscription.findFirst.mockResolvedValue({ groupe: { annee: { dateDebut: new Date(`${derniereDate}T00:00:00.000Z`) } } });
        await expect(promouvoirEleve(5, { id_annee: 2, id_groupe: 4 })).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.inscription.create).not.toHaveBeenCalled();
    });

    test("la promotion utilise exclusivement le client transactionnel", async () => {
        const transaction = {
            eleve: { findUnique: jest.fn().mockResolvedValue({ id: 5 }) },
            anneeScolaire: { findUnique: jest.fn().mockResolvedValue({ id: 2, dateDebut: new Date("2026-09-01") }) },
            groupe: { findUnique: jest.fn().mockResolvedValue({ id: 4, id_annee: 2 }) },
            inscription: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 12 }) },
        };
        prisma.$transaction.mockImplementation(async (operation) => operation(transaction));
        expect(await promouvoirEleve(5, { id_annee: 2, id_groupe: 4 })).toEqual({ id: 12 });
        expect(transaction.inscription.create).toHaveBeenCalledTimes(1);
        expect(prisma.eleve.findUnique).not.toHaveBeenCalled();
        expect(prisma.anneeScolaire.findUnique).not.toHaveBeenCalled();
        expect(prisma.groupe.findUnique).not.toHaveBeenCalled();
        expect(prisma.inscription.create).not.toHaveBeenCalled();
    });

    describe("reprise sur conflit de sérialisation (P2034)", () => {
        const conflit = () => Object.assign(new Error("conflit simulé"), { code: "P2034" });
        const nouvelle = { id: 12, ...INSCRIPTION, statut: "active" };

        test("un conflit puis un succès : la promotion aboutit", async () => {
            prisma.inscription.create.mockResolvedValue(nouvelle);
            prisma.$transaction.mockRejectedValueOnce(conflit());
            expect(await promouvoirEleve(5, { id_annee: 2, id_groupe: 4 })).toEqual(nouvelle);
            expect(prisma.$transaction).toHaveBeenCalledTimes(2);
            expect(prisma.$transaction).toHaveBeenLastCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
        });

        test("deux conflits puis un succès : troisième et dernier essai", async () => {
            prisma.inscription.create.mockResolvedValue(nouvelle);
            prisma.$transaction.mockRejectedValueOnce(conflit()).mockRejectedValueOnce(conflit());
            expect(await promouvoirEleve(5, { id_annee: 2, id_groupe: 4 })).toEqual(nouvelle);
            expect(prisma.$transaction).toHaveBeenCalledTimes(3);
        });

        test("trois conflits : l'erreur P2034 remonte après trois essais exactement", async () => {
            const derniere = conflit();
            prisma.$transaction.mockRejectedValueOnce(conflit()).mockRejectedValueOnce(conflit()).mockRejectedValueOnce(derniere);
            await expect(promouvoirEleve(5, { id_annee: 2, id_groupe: 4 })).rejects.toBe(derniere);
            expect(prisma.$transaction).toHaveBeenCalledTimes(3);
            expect(prisma.inscription.create).not.toHaveBeenCalled();
        });

        test.each(["P2002", "P2003", "P1001", undefined])("l'erreur %p n'est pas rejouée", async (code) => {
            const erreur = Object.assign(new Error("autre"), { code });
            prisma.$transaction.mockRejectedValue(erreur);
            await expect(promouvoirEleve(5, { id_annee: 2, id_groupe: 4 })).rejects.toBe(erreur);
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        });

        test("une erreur de validation n'est pas rejouée", async () => {
            prisma.inscription.findFirst.mockResolvedValue({ groupe: { annee: { dateDebut: new Date("2027-09-01T00:00:00.000Z") } } });
            await expect(promouvoirEleve(5, { id_annee: 2, id_groupe: 4 })).rejects.toBeInstanceOf(ErreurValidation);
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        });

        test("chaque essai relit l'historique dans une nouvelle transaction", async () => {
            prisma.inscription.create.mockResolvedValue(nouvelle);
            prisma.$transaction.mockRejectedValueOnce(conflit());
            await promouvoirEleve(5, { id_annee: 2, id_groupe: 4 });
            expect(prisma.inscription.findFirst).toHaveBeenCalledTimes(1);
            expect(prisma.inscription.create).toHaveBeenCalledTimes(1);
        });
    });

    test("la promotion refuse les champs étrangers avant d'ouvrir une transaction", async () => {
        await expect(promouvoirEleve(5, { id_annee: 2, id_groupe: 4, statut: "annulee" })).rejects.toBeInstanceOf(ErreurValidation);
        await expect(promouvoirEleve("5", { id_annee: 2, id_groupe: 4 })).rejects.toBeInstanceOf(ErreurValidation);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("une erreur d'unicité de promotion remonte sans altérer l'historique", async () => {
        const erreur = Object.assign(new Error("doublon simulé"), { code: "P2002" });
        prisma.inscription.create.mockRejectedValue(erreur);
        await expect(promouvoirEleve(5, { id_annee: 2, id_groupe: 4 })).rejects.toBe(erreur);
        expect(prisma.inscription.update).not.toHaveBeenCalled();
        expect(prisma.inscription.delete).not.toHaveBeenCalled();
    });
});

function nouvelleSansId({ id, ...donnees }) {
    return donnees;
}
