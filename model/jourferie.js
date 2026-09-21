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
 * Ajoute un jour férié à un semestre
 * @param {number} id_semestre
 * @param {Date} date
 * @param {string} description - ex: "Noël", "Congé de printemps"
 * @returns le jour férié créé
 */
const addJourFerie = async (id_semestre, date, description) => {
    const newJourFerie = await prisma.jourFerie.create({
        data: {
            date: normalizeDate(date),
            description: description,
            id_semestre: id_semestre,
        },
    });
    return newJourFerie;
};

/**
 * Retourne tous les jours fériés d'un semestre
 * @param {number} id_semestre
 * @returns liste des jours fériés
 */
const getJoursFeeries = async (id_semestre) => {
    return await prisma.jourFerie.findMany({
        where: { id_semestre: id_semestre },
        orderBy: { date: "asc" },
    });
};

/**
 * Retourne un jour férié par son ID
 * @param {number} id
 * @returns le jour férié ou null
 */
const getJourFerieById = async (id) => {
    return await prisma.jourFerie.findUnique({
        where: { id: id },
    });
};

/**
 * Met à jour un jour férié
 * @param {number} id
 * @param {Object} data - { date, description }
 * @returns le jour férié mis à jour
 */
const updateJourFerie = async (id, data) => {
    const updated = await prisma.jourFerie.update({
        where: { id: id },
        data: {
            date: data.date ? normalizeDate(data.date) : undefined,
            description: data.description || undefined,
        },
    });
    return updated;
};

/**
 * Supprime un jour férié
 * @param {number} id
 * @returns true si supprimé
 */
const deleteJourFerie = async (id) => {
    const jourFerie = await prisma.jourFerie.findUnique({
        where: { id: id },
    });

    if (!jourFerie) {
        throw new Error("Jour férié non trouvé");
    }

    await prisma.jourFerie.delete({
        where: { id: id },
    });

    return true;
};

export {
    addJourFerie,
    getJoursFeeries,
    getJourFerieById,
    updateJourFerie,
    deleteJourFerie,
};
