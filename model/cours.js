// importer le client prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client prisma
const prisma = new PrismaClient();

/**
 * Ajoute un cours
 * @param {Object} coursData - Les données du cours
 * @returns le cours ajouté
 */
const addCours = async (coursData) => {
    const { code, nom, duree, programme, etapeEtude, typeSalle } = coursData;
    
    const newCours = await prisma.cours.create({
        data: {
            code,
            nom,
            duree: parseInt(duree),
            programme,
            etapeEtude: etapeEtude || "",
            typeSalle,
        },
    });
    return newCours;
};

/**
 * Retourne la liste de tous les cours
 * @returns liste des cours
 */
const getCours = async () => {
    return await prisma.cours.findMany();
};

/**
 * Retourne un cours par son ID
 * @param {number} id
 * @returns le cours correspondant ou null
 */
const getCoursById = async (id) => {
    return await prisma.cours.findUnique({
        where: { id: id },
    });
};

/**
 * Met à jour un cours
 * @param {number} id
 * @param {Object} coursData - Les nouvelles données
 * @returns le cours mis à jour
 */
const updateCours = async (id, coursData) => {
    const cours = await prisma.cours.findUnique({
        where: { id: id },
    });
    
    if (!cours) {
        throw new Error("Cours non trouvé");
    }
    
    const updatedCours = await prisma.cours.update({
        where: { id: id },
        data: coursData,
    });
    
    return updatedCours;
};

/**
 * Supprime un cours par son ID
 * @param {number} id
 * @returns true si le cours a été supprimé
 */
const deleteCours = async (id) => {
    const cours = await prisma.cours.findUnique({
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
    
    if (!cours) {
        throw new Error("Cours non trouvé");
    }
    
    // Vérifier si le cours a des affectations futures
    if (cours.affectations && cours.affectations.length > 0) {
        throw new Error("Impossible de supprimer ce cours car il a des affectations futures");
    }
    
    await prisma.cours.delete({
        where: { id: id },
    });
    
    return true;
};

/**
 * Filtre les cours par programme
 * @param {string} programme
 * @returns liste des cours de ce programme
 */
const getCoursByProgramme = async (programme) => {
    return await prisma.cours.findMany({
        where: { programme },
    });
};

/**
 * Filtre les cours par durée
 * @param {number} duree
 * @returns liste des cours de cette durée
 */
const getCoursByDuree = async (duree) => {
    return await prisma.cours.findMany({
        where: { duree: parseInt(duree) },
    });
};

/**
 * Filtre les cours par type de salle
 * @param {string} typeSalle
 * @returns liste des cours nécessitant ce type de salle
 */
const getCoursByTypeSalle = async (typeSalle) => {
    return await prisma.cours.findMany({
        where: { typeSalle },
    });
};

/**
 * Filtre les cours par étape d'étude
 * @param {string} etapeEtude
 * @returns liste des cours de cette étape d'étude
 */
const getCoursByEtapeEtude = async (etapeEtude) => {
    return await prisma.cours.findMany({
        where: { etapeEtude },
    });
};

export {
    addCours,
    getCours,
    getCoursById,
    updateCours,
    deleteCours,
    getCoursByProgramme,
    getCoursByDuree,
    getCoursByTypeSalle,
    getCoursByEtapeEtude,
};