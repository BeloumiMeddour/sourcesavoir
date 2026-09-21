// Importer le client Prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client Prisma
const prisma = new PrismaClient();

/**
 * Normalise une date pour éviter les décalages de fuseau horaire.
 * Convertit "2026-04-03" en 2026-04-03T12:00:00Z (midi UTC)
 */
function normalizeDate(dateInput) {
    if (!dateInput) return dateInput;
    const str = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
    const datePart = str.split('T')[0];
    return new Date(datePart + 'T12:00:00Z');
}

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
            dateDebut: normalizeDate(dateDebut),
            dateFin: normalizeDate(dateFin),
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
            dateDebut: data.dateDebut ? normalizeDate(data.dateDebut) : undefined,
            dateFin: data.dateFin ? normalizeDate(data.dateFin) : undefined,
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
