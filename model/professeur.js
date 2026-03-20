// importer le client prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client prisma
const prisma = new PrismaClient();

/**
 * Ajoute un professeur
 * @param {Object} professeurData - Les données du professeur
 * @returns le professeur ajouté
 */
const addProfesseur = async (professeurData) => {
    const { matricule, nom, prenom, specialite } = professeurData;
    
    const newProfesseur = await prisma.professeur.create({
        data: {
            matricule,
            nom,
            prenom,
            specialite,
        },
    });
    return newProfesseur;
};

/**
 * Retourne la liste de tous les professeurs
 * @returns liste des professeurs
 */
const getProfesseurs = async () => {
    return await prisma.professeur.findMany();
};

/**
 * Retourne un professeur par son ID
 * @param {number} id
 * @returns le professeur correspondant ou null
 */
const getProfesseurById = async (id) => {
    return await prisma.professeur.findUnique({
        where: { id: id },
        include: {
            disponibilites: true,
            affectations: true,
        },
    });
};

/**
 * Met à jour un professeur
 * @param {number} id
 * @param {Object} professeurData - Les nouvelles données
 * @returns le professeur mis à jour
 */
const updateProfesseur = async (id, professeurData) => {
    const professeur = await prisma.professeur.findUnique({
        where: { id: id },
    });
    
    if (!professeur) {
        throw new Error("Professeur non trouvé");
    }
    
    const updatedProfesseur = await prisma.professeur.update({
        where: { id: id },
        data: professeurData,
    });
    
    return updatedProfesseur;
};

/**
 * Supprime un professeur par son ID
 * @param {number} id
 * @returns true si le professeur a été supprimé, false sinon
 */
const deleteProfesseur = async (id) => {
    const professeur = await prisma.professeur.findUnique({
        where: { id: id },
        include: {
            affectations: {
                where: {
                    date: {
                        gte: new Date(), // Affectations futures
                    },
                },
            },
        },
    });
    
    if (!professeur) {
        throw new Error("Professeur non trouvé");
    }
    
    // Vérifier si le professeur a des cours planifiés futurs
    if (professeur.affectations && professeur.affectations.length > 0) {
        throw new Error("Impossible de supprimer ce professeur car il a des cours planifiés futurs");
    }
    
    await prisma.professeur.delete({
        where: { id: id },
    });
    
    return true;
};

/**
 * Filtre les professeurs par spécialité
 * @param {string} specialite
 * @returns liste des professeurs de cette spécialité
 */
const getProfesseursBySpecialite = async (specialite) => {
    return await prisma.professeur.findMany({
        where: { specialite },
    });
};

/**
 * Filtre les professeurs par disponibilité pour un jour donné
 * @param {string} jour - "Lundi", "Mardi", etc.
 * @returns liste des professeurs disponibles ce jour
 */
const getProfesseursByDisponibilite = async (jour) => {
    return await prisma.professeur.findMany({
        where: {
            disponibilites: {
                some: {
                    jour: jour,
                },
            },
        },
        include: {
            disponibilites: {
                where: {
                    jour: jour,
                },
            },
        },
    });
};

/**
 * Définir une plage horaire de disponibilité pour un professeur
 * @param {number} id_professeur
 * @param {Object} dispoData - { jour, plageHoraire }
 * @returns la disponibilité créée
 */
const addDisponibiliteProfesseur = async (id_professeur, dispoData) => {
    const { jour, plageHoraire } = dispoData;
    
    const professeur = await prisma.professeur.findUnique({
        where: { id: parseInt(id_professeur) },
    });
    
    if (!professeur) {
        throw new Error("Professeur non trouvé");
    }
    
    const newDispo = await prisma.disponibilite.create({
        data: {
            jour,
            plageHoraire,
            typeConflit: "Professeur",
            id_professeur: parseInt(id_professeur),
        },
    });
    return newDispo;
};

/**
 * Supprime une disponibilité d'un professeur
 * @param {number} id - ID de la disponibilité
 * @returns true si la disponibilité a été supprimée
 */
const deleteDisponibiliteProfesseur = async (id) => {
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
    addProfesseur, 
    getProfesseurs, 
    getProfesseurById, 
    updateProfesseur, 
    deleteProfesseur,
    getProfesseursBySpecialite,
    getProfesseursByDisponibilite,
    addDisponibiliteProfesseur,
    deleteDisponibiliteProfesseur,
};