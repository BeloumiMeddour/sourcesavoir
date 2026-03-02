// Importer le client Prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client Prisma
const prisma = new PrismaClient();

/**
 * Ajoute une salle
 * @param {Object} salleData - Les données de la salle
 * @returns la salle ajoutée
 */
const addSalle = async (salleData) => {
    const { code, type, capacite } = salleData;

    const newSalle = await prisma.salle.create({
        data: {
            code,
            type,
            capacite,
        },
    });
    return newSalle;
};

/**
 * Retourne la liste des salles
 * @returns liste des salles
 */
const getSalles = async () => {
    return await prisma.salle.findMany({
        orderBy: { code: "asc" },
    });
};

/**
 * Retourne une salle par son ID
 * @param {number} id
 * @returns la salle correspondante ou null
 */
const getSalleById = async (id) => {
    return await prisma.salle.findUnique({
        where: { id: id },
    });
};

/**
 * Retourne les salles par type
 * @param {string} type
 * @returns liste des salles de ce type
 */
const getSallesByType = async (type) => {
    return await prisma.salle.findMany({
        where: { type: type },
    });
};

/**
 * Met à jour une salle
 * @param {number} id
 * @param {Object} salleData - Les nouvelles données
 * @returns la salle mise à jour
 */
const updateSalle = async (id, salleData) => {
    const salle = await prisma.salle.findUnique({
        where: { id: id },
    });

    if (!salle) {
        throw new Error("Salle non trouvée");
    }

    const updatedSalle = await prisma.salle.update({
        where: { id: id },
        data: salleData,
    });

    return updatedSalle;
};

/**
 * Supprime une salle par son ID
 * @param {number} id
 * @returns true si la salle a été supprimée
 */
const deleteSalle = async (id) => {
    const salle = await prisma.salle.findUnique({
        where: { id: id },
        include: { affectations: true },
    });

    if (!salle) {
        throw new Error("Salle non trouvée");
    }

    if (salle.affectations.length > 0) {
        throw new Error("Impossible de supprimer cette salle car elle a des cours planifiés");
    }

    await prisma.salle.delete({
        where: { id: id },
    });

    return true;
};

/**
 * Retourne les salles par code
 * @param {string} code
 * @returns la salle correspondante ou null
 */
const getSalleByCode = async (code) => {
    return await prisma.salle.findUnique({
        where: { code: code },
    });
};

export {
    addSalle,
    getSalles,
    getSalleById,
    getSalleByCode,
    getSallesByType,
    updateSalle,
    deleteSalle,
};