import { prisma } from "./prisma.js";
import { exigerObjet, chaineObligatoire, dateISO, ErreurValidation } from "./validation.js";

const CHAMPS = ["libelle", "dateDebut", "dateFin"];
const SELECTION = { id: true, libelle: true, dateDebut: true, dateFin: true };

export const listerAnnees = async () => prisma.anneeScolaire.findMany({
    select: SELECTION,
    orderBy: [{ dateDebut: "desc" }, { id: "desc" }],
});

export const creerAnnee = async (donnees) => {
    exigerObjet(donnees);
    if (Object.keys(donnees).some((champ) => !CHAMPS.includes(champ))) {
        throw new ErreurValidation("Le corps contient un champ non autorisé pour une année scolaire.");
    }
    const libelle = chaineObligatoire(donnees.libelle, "libelle", 20);
    const dateDebut = dateISO(donnees.dateDebut, "dateDebut");
    const dateFin = dateISO(donnees.dateFin, "dateFin");
    if (dateFin <= dateDebut) {
        throw new ErreurValidation("La date de fin doit être postérieure à la date de début.");
    }
    return prisma.anneeScolaire.create({ data: { libelle, dateDebut, dateFin }, select: SELECTION });
};
