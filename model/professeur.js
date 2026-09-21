// importer le client prisma
import { PrismaClient } from "@prisma/client";
import { primitiveOuIgnoree } from "./valeursPrimitives.js";

// Créer une instance du client prisma
const prisma = new PrismaClient();

/**
 * Ajoute un professeur
 * @param {Object} professeurData - Les données du professeur
 * @returns le professeur ajouté
 */
const addProfesseur = async (professeurData) => {
    const { matricule, nom, prenom, specialite, programme } = professeurData;
    
    const newProfesseur = await prisma.professeur.create({
        data: {
            matricule,
            nom,
            prenom,
            specialite,
            programme: programme || null,
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
    
    // Liste blanche : on ne transmet jamais le corps de la requête tel quel à Prisma
    // (id, createdAt, écritures imbriquées sur les relations...). Un champ undefined est ignoré,
    // alors que programme peut valoir null (l'interface l'envoie pour effacer le programme).
    // Seules les valeurs primitives passent : { increment: 1 } ou { set: ... } serait une opération Prisma.
    const { matricule, nom, prenom, specialite, programme, chargeMax } = professeurData;

    const updatedProfesseur = await prisma.professeur.update({
        where: { id: id },
        data: {
            matricule: primitiveOuIgnoree(matricule),
            nom: primitiveOuIgnoree(nom),
            prenom: primitiveOuIgnoree(prenom),
            specialite: primitiveOuIgnoree(specialite),
            programme: primitiveOuIgnoree(programme),
            chargeMax: primitiveOuIgnoree(chargeMax),
        },
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

export {
    addProfesseur,
    getProfesseurs,
    getProfesseurById,
    updateProfesseur,
    deleteProfesseur,
    getProfesseursBySpecialite,
};