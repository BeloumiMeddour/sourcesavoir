import { prisma } from "./prisma.js";
import {
    exigerObjet, chaineObligatoire, identifiant, entierBorneOptionnel,
    ID_MAX, ErreurValidation, ErreurIntrouvable,
} from "./validation.js";

const CHAMPS = ["code", "capacite", "id_annee", "id_niveau"];
const SELECTION = {
    id: true, code: true, capacite: true, id_annee: true, id_niveau: true,
    annee: { select: { id: true, libelle: true, dateDebut: true, dateFin: true } },
    niveau: { select: { id: true, code: true, libelle: true, ordre: true } },
};

export const listerGroupes = async () => prisma.groupe.findMany({
    select: SELECTION,
    orderBy: [{ id_annee: "desc" }, { code: "asc" }],
});

export const creerGroupe = async (donnees) => {
    exigerObjet(donnees);
    if (Object.keys(donnees).some((champ) => !CHAMPS.includes(champ))) {
        throw new ErreurValidation("Le corps contient un champ non autorisé pour un groupe.");
    }
    const data = {
        code: chaineObligatoire(donnees.code, "code", 30),
        capacite: entierBorneOptionnel(donnees.capacite, "capacite", 1, ID_MAX),
        id_annee: identifiant(donnees.id_annee, "id_annee"),
        id_niveau: identifiant(donnees.id_niveau, "id_niveau"),
    };
    const annee = await prisma.anneeScolaire.findUnique({ where: { id: data.id_annee }, select: { id: true } });
    if (!annee) {
        throw new ErreurIntrouvable("Année scolaire introuvable.");
    }
    const niveau = await prisma.niveau.findUnique({ where: { id: data.id_niveau }, select: { id: true } });
    if (!niveau) {
        throw new ErreurIntrouvable("Niveau introuvable.");
    }
    return prisma.groupe.create({ data, select: SELECTION });
};
