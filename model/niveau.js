import { prisma } from "./prisma.js";
import { exigerObjet, chaineObligatoire, entierBorne, ID_MAX, ErreurValidation } from "./validation.js";

const CHAMPS = ["code", "libelle", "ordre"];
const SELECTION = { id: true, code: true, libelle: true, ordre: true };

export const listerNiveaux = async () => prisma.niveau.findMany({
    select: SELECTION,
    orderBy: [{ ordre: "asc" }, { code: "asc" }],
});

export const creerNiveau = async (donnees) => {
    exigerObjet(donnees);
    if (Object.keys(donnees).some((champ) => !CHAMPS.includes(champ))) {
        throw new ErreurValidation("Le corps contient un champ non autorisé pour un niveau.");
    }
    const data = {
        code: chaineObligatoire(donnees.code, "code", 20),
        libelle: chaineObligatoire(donnees.libelle, "libelle", 100),
        ordre: entierBorne(donnees.ordre, "ordre", 0, ID_MAX),
    };
    return prisma.niveau.create({ data, select: SELECTION });
};
