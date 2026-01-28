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
    const { matricule, nom, prenom, email, specialite, telephone } = professeurData;
    
    const newProfesseur = await prisma.professeur.create({
        data: {
            matricule,
            nom,
            prenom,
            email,
            specialite,
            telephone,
        },
    });
    return newProfesseur;
};

/**
 * Retourne la liste des professeurs
 * @param {Object} filters - Filtres optionnels
 * @returns liste des professeurs
 */
const getProfesseurs = async (filters = {}) => {
    const { specialite, disponible } = filters;
    
    let whereClause = {};
    
    // Filtre par spécialité
    if (specialite) {
        whereClause.specialite = specialite;
    }
    
    // Si on veut filtrer par disponibilité
    const include = disponible ? {
        disponibilites: true
    } : undefined;
    
    return await prisma.professeur.findMany({
        where: whereClause,
        include,
    });
};

/**
 * Retourne un professeur par son ID
 * @param {number} id
 * @returns le professeur correspondant ou null
 */
const getProfesseurById = async (id) => {
    return await prisma.professeur.findUnique({
        where: { id_professeur: id },
        include: {
            disponibilites: true,
            seances: true,  // CHANGÉ: cours → seances
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
        where: { id_professeur: id },
    });
    
    if (!professeur) {
        throw new Error("Professeur non trouvé");
    }
    
    const updatedProfesseur = await prisma.professeur.update({
        where: { id_professeur: id },
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
        where: { id_professeur: id },
        include: {
            seances: {  // CHANGÉ: cours → seances
                where: {
                    estPasse: false, // Séances non passées
                },
            },
        },
    });
    
    if (!professeur) {
        throw new Error("Professeur non trouvé");
    }
    
    // Vérifier si le professeur a des séances planifiées non passées
    if (professeur.seances && professeur.seances.length > 0) {
        throw new Error("Impossible de supprimer ce professeur car il a des séances planifiées non passées");
    }
    
    await prisma.professeur.delete({
        where: { id_professeur: id },
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
 * @param {number} jourSemaine - 0 = Dimanche, 1 = Lundi, etc.
 * @returns liste des professeurs disponibles ce jour
 */
const getProfesseursByDisponibilite = async (jourSemaine) => {
    return await prisma.professeur.findMany({
        where: {
            disponibilites: {
                some: {
                    jourSemaine: jourSemaine,
                    recurrent: true,
                },
            },
        },
        include: {
            disponibilites: {
                where: {
                    jourSemaine: jourSemaine,
                },
            },
        },
    });
};

export { 
    addProfesseur, 
    getProfesseurs, 
    getProfesseurById, 
    updateProfesseur, 
    deleteProfesseur,
    getProfesseursBySpecialite,
    getProfesseursByDisponibilite
};