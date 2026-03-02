// Importer le client Prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client Prisma
const prisma = new PrismaClient();

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
 * Retourne une disponibilité par son ID
 * @param {number} id
 * @returns la disponibilité correspondante ou null
 */
const getDisponibiliteById = async (id) => {
    return await prisma.disponibilite.findUnique({
        where: { id: id },
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
    getDisponibiliteById,
    updateDisponibilite,
    deleteDisponibilite,
};
