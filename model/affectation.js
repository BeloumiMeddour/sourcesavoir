// importer le client prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client prisma
const prisma = new PrismaClient();

/**
 * Crée une affectation (cours → salle + professeur + date/heure)
 * @param {Object} affectationData - Les données de l'affectation
 * @returns l'affectation créée
 */
const addAffectation = async (affectationData) => {
    const { id_cours, id_professeur, id_salle, date, plageHoraire } = affectationData;
    
    const newAffectation = await prisma.affectationCours.create({
        data: {
            id_cours: parseInt(id_cours),
            id_professeur: parseInt(id_professeur),
            id_salle: parseInt(id_salle),
            date: new Date(date),
            plageHoraire,
        },
    });
    return newAffectation;
};

/**
 * Retourne la liste de toutes les affectations
 * @returns liste des affectations
 */
const getAffectations = async () => {
    return await prisma.affectationCours.findMany({
        include: {
            cours: true,
            professeur: true,
            salle: true,
        },
    });
};

/**
 * Retourne une affectation par son ID
 * @param {number} id
 * @returns l'affectation correspondante ou null
 */
const getAffectationById = async (id) => {
    return await prisma.affectationCours.findUnique({
        where: { id: id },
        include: {
            cours: true,
            professeur: true,
            salle: true,
        },
    });
};

/**
 * Supprime une affectation par son ID
 * @param {number} id
 * @returns true si l'affectation a été supprimée
 */
const deleteAffectation = async (id) => {
    const affectation = await prisma.affectationCours.findUnique({
        where: { id: id },
    });
    
    if (!affectation) {
        throw new Error("Affectation non trouvée");
    }
    
    await prisma.affectationCours.delete({
        where: { id: id },
    });
    
    return true;
};

/**
 * Vérifie si une salle est déjà occupée à une date et plage horaire donnée
 * @param {number} id_salle
 * @param {string} date
 * @param {string} plageHoraire
 * @returns l'affectation en conflit ou null
 */
const getConflitSalle = async (id_salle, date, plageHoraire) => {
    return await prisma.affectationCours.findFirst({
        where: {
            id_salle: parseInt(id_salle),
            date: new Date(date),
            plageHoraire: plageHoraire,
        },
        include: {
            cours: true,
            salle: true,
        },
    });
};

/**
 * Vérifie si un professeur est déjà assigné à une date et plage horaire donnée
 * @param {number} id_professeur
 * @param {string} date
 * @param {string} plageHoraire
 * @returns l'affectation en conflit ou null
 */
const getConflitProfesseur = async (id_professeur, date, plageHoraire) => {
    return await prisma.affectationCours.findFirst({
        where: {
            id_professeur: parseInt(id_professeur),
            date: new Date(date),
            plageHoraire: plageHoraire,
        },
        include: {
            cours: true,
            professeur: true,
        },
    });
};

/**
 * Retourne les affectations d'une salle pour une date donnée
 * @param {number} id_salle
 * @param {string} date
 * @returns les affectations de la salle pour cette date
 */
const getAffectationsBySalle = async (id_salle, date) => {
    return await prisma.affectationCours.findMany({
        where: {
            id_salle: parseInt(id_salle),
            date: new Date(date),
        },
        include: {
            cours: true,
            professeur: true,
        },
    });
};

/**
 * Retourne les affectations d'un professeur pour une date donnée
 * @param {number} id_professeur
 * @param {string} date
 * @returns les affectations du professeur pour cette date
 */
const getAffectationsByProfesseur = async (id_professeur, date) => {
    return await prisma.affectationCours.findMany({
        where: {
            id_professeur: parseInt(id_professeur),
            date: new Date(date),
        },
        include: {
            cours: true,
            salle: true,
        },
    });
};

export { 
    addAffectation, 
    getAffectations, 
    getAffectationById, 
    deleteAffectation,
    getConflitSalle,
    getConflitProfesseur,
    getAffectationsBySalle,
    getAffectationsByProfesseur,
};
