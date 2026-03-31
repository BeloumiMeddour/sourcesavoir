// Importer le client Prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client Prisma
const prisma = new PrismaClient();

function heureEnMinutes(heure) {
    const [h, m] = heure.split(":").map(Number);
    return h * 60 + m;
}

const JOUR_NOM_VERS_NUMERO = {
    "Dimanche": 0, "Lundi": 1, "Mardi": 2, "Mercredi": 3,
    "Jeudi": 4, "Vendredi": 5, "Samedi": 6,
};

/**
 * Vérifie que les affectations existantes du professeur sur ce jour
 * restent dans la nouvelle plage de disponibilité.
 */
async function verifierConflitAvecAffectations(id_professeur, jour, plageHoraire) {
    const jourNum = JOUR_NOM_VERS_NUMERO[jour];
    if (jourNum === undefined) return;

    const [debutDispo, finDispo] = plageHoraire.split("-").map(heureEnMinutes);

    const affectations = await prisma.affectationCours.findMany({
        where: { id_professeur },
        include: { cours: true },
    });

    for (const aff of affectations) {
        let affJourNum = null;
        if (aff.jour !== null && aff.jour !== undefined) {
            affJourNum = parseInt(aff.jour);
        } else if (aff.date !== null) {
            affJourNum = new Date(aff.date).getDay();
        }
        if (affJourNum !== jourNum) continue;

        const [debutAff, finAff] = aff.plageHoraire.split("-").map(heureEnMinutes);
        if (debutAff < debutDispo || finAff > finDispo) {
            throw new Error(
                `Conflit : le professeur a un cours planifié (${aff.cours?.nom || "cours"} ${aff.plageHoraire}) qui dépasse la plage de disponibilité ${plageHoraire} le ${jour}`
            );
        }
    }
}

/**
 * Ajoute une disponibilité pour un professeur
 * @param {Object} dispoData - Les données de la disponibilité
 * @returns la disponibilité ajoutée
 */
const addDisponibilite = async (dispoData) => {
    const { jour, plageHoraire, id_professeur } = dispoData;

    const newDispo = await prisma.disponibilite.create({
        data: {
            jour,
            plageHoraire,
            typeConflit: "Professeur",
            id_professeur,
        },
    });
    return newDispo;
};

/**
 * Retourne les disponibilités d'un professeur
 * @param {number} id_professeur
 * @returns liste des disponibilités
 */
const getDisponibilitesByProfesseur = async (id_professeur) => {
    return await prisma.disponibilite.findMany({
        where: { id_professeur: id_professeur },
    });
};

/**
 * Met à jour une disponibilité
 * @param {number} id
 * @param {Object} dispoData - Les nouvelles données
 * @returns la disponibilité mise à jour
 */
const updateDisponibilite = async (id, dispoData) => {
    const dispo = await prisma.disponibilite.findUnique({
        where: { id: id },
    });

    if (!dispo) {
        throw new Error("Disponibilité non trouvée");
    }

    const updatedDispo = await prisma.disponibilite.update({
        where: { id: id },
        data: dispoData,
    });

    return updatedDispo;
};

/**
 * Supprime une disponibilité par son ID
 * @param {number} id
 * @returns true si la disponibilité a été supprimée
 */
const deleteDisponibilite = async (id) => {
    const dispo = await prisma.disponibilite.findUnique({
        where: { id: id },
    });

    if (!dispo) {
        throw new Error("Disponibilité non trouvée");
    }

    await prisma.disponibilite.delete({
        where: { id: id },
    });

    return true;
};

export {
    addDisponibilite,
    getDisponibilitesByProfesseur,
    updateDisponibilite,
    deleteDisponibilite,
};
