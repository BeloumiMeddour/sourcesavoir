// Importer le client Prisma
import { PrismaClient } from "@prisma/client";
import { primitiveOuIgnoree } from "./valeursPrimitives.js";

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

    // Liste blanche : on ne transmet jamais le corps de la requête tel quel à Prisma
    // (id, createdAt, écritures imbriquées sur les relations...). Un champ undefined est ignoré.
    // Seules les valeurs primitives passent : { increment: 1 } ou { set: ... } serait une opération Prisma.
    const { code, type, capacite } = salleData;

    const updatedSalle = await prisma.salle.update({
        where: { id: id },
        data: {
            code: primitiveOuIgnoree(code),
            type: primitiveOuIgnoree(type),
            capacite: primitiveOuIgnoree(capacite),
        },
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

export {
    addSalle,
    getSalles,
    getSalleById,
    getSallesByType,
    updateSalle,
    deleteSalle,
};