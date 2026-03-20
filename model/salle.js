// importer le client prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client prisma
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
            capacite: parseInt(capacite),
        },
    });
    return newSalle;
};

/**
 * Retourne la liste de toutes les salles
 * @returns liste des salles
 */
const getSalles = async () => {
    return await prisma.salle.findMany();
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
        include: {
            affectations: {
                where: {
                    date: {
                        gte: new Date(),
                    },
                },
            },
        },
    });
    
    if (!salle) {
        throw new Error("Salle non trouvée");
    }
    
    // Vérifier si la salle a des affectations futures
    if (salle.affectations && salle.affectations.length > 0) {
        throw new Error("Impossible de supprimer cette salle car elle a des cours planifiés futurs");
    }
    
    await prisma.salle.delete({
        where: { id: id },
    });
    
    return true;
};

/**
 * Filtre les salles par type
 * @param {string} type
 * @returns liste des salles de ce type
 */
const getSallesByType = async (type) => {
    return await prisma.salle.findMany({
        where: { type },
    });
};

/**
 * Filtre les salles par code
 * @param {string} code
 * @returns liste des salles avec ce code
 */
const getSallesByCode = async (code) => {
    return await prisma.salle.findMany({
        where: { code },
    });
};

export {
    addSalle,
    getSalles,
    getSalleById,
    updateSalle,
    deleteSalle,
    getSallesByType,
    getSallesByCode,
};