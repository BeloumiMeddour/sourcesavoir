// Importer le client Prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client Prisma
const prisma = new PrismaClient();

/**
 * Crée un nouveau semestre
 * @param {string} nom - ex: "Hiver 2026"
 * @param {Date} dateDebut
 * @param {Date} dateFin
 * @returns le semestre créé
 */
const addSemestre = async (nom, dateDebut, dateFin) => {
    const newSemestre = await prisma.semestre.create({
        data: {
            nom: nom,
            dateDebut: new Date(dateDebut),
            dateFin: new Date(dateFin),
        },
    });
    return newSemestre;
};

/**
 * Retourne tous les semestres
 * @returns liste des semestres
 */
const getSemestres = async () => {
    return await prisma.semestre.findMany({
        orderBy: {
            dateDebut: "desc",
        },
        include: {
            joursFeeries: true,
        },
    });
};

/**
 * Retourne un semestre par son ID
 * @param {number} id
 * @returns le semestre ou null
 */
const getSemestreById = async (id) => {
    return await prisma.semestre.findUnique({
        where: { id: id },
        include: {
            joursFeeries: true,
            affectations: true,
        },
    });
};

/**
 * Met à jour un semestre
 * @param {number} id
 * @param {Object} data - { nom, dateDebut, dateFin }
 * @returns le semestre mis à jour
 */
const updateSemestre = async (id, data) => {
    const updated = await prisma.semestre.update({
        where: { id: id },
        data: {
            nom: data.nom || undefined,
            dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
            dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
        },
        include: {
            joursFeeries: true,
        },
    });
    return updated;
};

/**
 * Supprime un semestre et tous ses jours fériés associés
 * @param {number} id
 * @returns true si supprimé
 */
const deleteSemestre = async (id) => {
    const semestre = await prisma.semestre.findUnique({
        where: { id: id },
    });

    if (!semestre) {
        throw new Error("Semestre non trouvé");
    }

    await prisma.semestre.delete({
        where: { id: id },
    });

    return true;
};

export {
    addSemestre,
    getSemestres,
    getSemestreById,
    updateSemestre,
    deleteSemestre,
};
