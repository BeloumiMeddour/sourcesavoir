// Importer le client Prisma
import { PrismaClient } from "@prisma/client";
import { primitiveOuIgnoree } from "./valeursPrimitives.js";

// Créer une instance du client Prisma
const prisma = new PrismaClient();

/**
 * Ajoute un cours
 * @param {Object} coursData - Les données du cours
 * @returns le cours ajouté
 */
const addCours = async (coursData) => {
    const { code, nom, duree, programme,etapeEtude, typeSalle } = coursData;

    const newCours = await prisma.cours.create({
        data: {
            code,
            nom,
            duree,
            programme,
            etapeEtude,
            typeSalle,
        },
    });
    return newCours;
};

/**
 * Retourne la liste des cours
 * @returns liste des cours
 */
const getCours = async () => {
    return await prisma.cours.findMany({
        orderBy: { createdAt: "desc" },
    });
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

    // Liste blanche : on ne transmet jamais le corps de la requête tel quel à Prisma
    // (id, createdAt, écritures imbriquées sur les relations...). Un champ undefined est ignoré.
    // Seules les valeurs primitives passent : { increment: 1 } ou { set: ... } serait une opération Prisma.
    const { code, nom, duree, programme, etapeEtude, typeSalle } = coursData;

    const updatedCours = await prisma.cours.update({
        where: { id: id },
        data: {
            code: primitiveOuIgnoree(code),
            nom: primitiveOuIgnoree(nom),
            duree: primitiveOuIgnoree(duree),
            programme: primitiveOuIgnoree(programme),
            etapeEtude: primitiveOuIgnoree(etapeEtude),
            typeSalle: primitiveOuIgnoree(typeSalle),
        },
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
        include: { affectations: true },
    });

    if (!cours) {
        throw new Error("Cours non trouvé");
    }

    if (cours.affectations.length > 0) {
        throw new Error("Impossible de supprimer ce cours car il a des affectations planifiées");
    }

    await prisma.cours.delete({
        where: { id: id },
    });

    return true;
};

/**
 * Retourne les cours par programme
 * @param {string} programme
 * @returns liste des cours de ce programme
 */
const getCoursByProgramme = async (programme) => {
    return await prisma.cours.findMany({
        where: { programme: programme },
    });
};

/**
 * Retourne les cours par type de salle
 * @param {string} typeSalle
 * @returns liste des cours de ce type de salle
 */
const getCoursByTypeSalle = async (typeSalle) => {
    return await prisma.cours.findMany({
        where: { typeSalle: typeSalle },
    });
};

export {
    addCours,
    getCours,
    getCoursById,
    updateCours,
    deleteCours,
    getCoursByProgramme,
    getCoursByTypeSalle,
};