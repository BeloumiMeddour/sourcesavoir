// Importer le client Prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client Prisma
const prisma = new PrismaClient();

/**
 * Convertit une chaîne "HH:MM" en minutes depuis minuit
 * @param {string} heure - ex: "08:30"
 * @returns {number} minutes depuis minuit
 */
function heureEnMinutes(heure) {
    const [h, m] = heure.split(":").map(Number);
    return h * 60 + m;
}

/**
 * Vérifie si deux plages horaires se chevauchent
 * @param {string} plage1 - ex: "08:00-11:00"
 * @param {string} plage2 - ex: "10:00-11:30"
 * @returns {boolean} true si elles se chevauchent
 */
function plagesSeChevauchent(plage1, plage2) {
    const [debut1, fin1] = plage1.split("-").map(heureEnMinutes);
    const [debut2, fin2] = plage2.split("-").map(heureEnMinutes);
    // Chevauchement : debut1 < fin2 ET debut2 < fin1
    return debut1 < fin2 && debut2 < fin1;
}

/**
 * Vérifie si une salle est déjà occupée à une date avec chevauchement de plage horaire
 * @param {number} id_salle
 * @param {Date} date
 * @param {string} plageHoraire
 * @param {number|null} exclureId - ID d'affectation à exclure (pour les mises à jour)
 * @returns true si la salle est occupée
 */
const verifierConflitSalle = async (id_salle, date, plageHoraire, exclureId = null) => {
    const where = {
        id_salle: id_salle,
        date: date,
    };
    if (exclureId) {
        where.id = { not: exclureId };
    }

    const affectations = await prisma.affectationCours.findMany({ where });

    return affectations.some(function (a) {
        return plagesSeChevauchent(plageHoraire, a.plageHoraire);
    });
};

/**
 * Vérifie si un professeur est déjà assigné à une date avec chevauchement de plage horaire
 * @param {number} id_professeur
 * @param {Date} date
 * @param {string} plageHoraire
 * @param {number|null} exclureId - ID d'affectation à exclure (pour les mises à jour)
 * @returns true si le professeur est occupé
 */
const verifierConflitProfesseur = async (id_professeur, date, plageHoraire, exclureId = null) => {
    const where = {
        id_professeur: id_professeur,
        date: date,
    };
    if (exclureId) {
        where.id = { not: exclureId };
    }

    const affectations = await prisma.affectationCours.findMany({ where });

    return affectations.some(function (a) {
        return plagesSeChevauchent(plageHoraire, a.plageHoraire);
    });
};

/**
 * Affecte un cours à une salle avec une date et plage horaire
 * @param {Object} affectationData - { id_cours, id_salle, date, plageHoraire }
 * @returns l'affectation créée
 */
const affecterCoursASalle = async (affectationData) => {
    const { id_cours, id_salle, date, plageHoraire } = affectationData;

    // Vérifier si la salle est déjà occupée
    const salleOccupee = await verifierConflitSalle(id_salle, new Date(date), plageHoraire);
    if (salleOccupee) {
        throw new Error("Conflit : cette salle est déjà occupée à cette date et plage horaire");
    }

    const newAffectation = await prisma.affectationCours.create({
        data: {
            id_cours,
            id_salle,
            id_professeur: null, // Sera assigné plus tard
            date: new Date(date),
            plageHoraire,
        },
    });
    return newAffectation;
};

/**
 * Assigne un professeur à une affectation existante
 * @param {number} id_affectation
 * @param {number} id_professeur
 * @returns l'affectation mise à jour
 */
const assignerProfesseur = async (id_affectation, id_professeur) => {
    const affectation = await prisma.affectationCours.findUnique({
        where: { id: id_affectation },
    });

    if (!affectation) {
        throw new Error("Affectation non trouvée");
    }

    // Vérifier si le professeur est déjà occupé à cette date et plage horaire
    const profOccupe = await verifierConflitProfesseur(id_professeur, affectation.date, affectation.plageHoraire);
    if (profOccupe) {
        throw new Error("Conflit : ce professeur est déjà assigné à un cours à cette date et plage horaire");
    }

    const updatedAffectation = await prisma.affectationCours.update({
        where: { id: id_affectation },
        data: { id_professeur: id_professeur },
    });

    return updatedAffectation;
};

/**
 * Retourne toutes les affectations
 * @returns liste des affectations avec les détails
 */
const getAffectations = async () => {
    return await prisma.affectationCours.findMany({
        include: {
            cours: true,
            salle: true,
            professeur: true,
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
            salle: true,
            professeur: true,
        },
    });
};

/**
 * Retourne les affectations d'une salle
 * @param {number} id_salle
 * @returns liste des affectations de cette salle
 */
const getAffectationsBySalle = async (id_salle) => {
    return await prisma.affectationCours.findMany({
        where: { id_salle: id_salle },
        include: {
            cours: true,
            professeur: true,
        },
    });
};

/**
 * Retourne les affectations d'un professeur
 * @param {number} id_professeur
 * @returns liste des affectations de ce professeur
 */
const getAffectationsByProfesseur = async (id_professeur) => {
    return await prisma.affectationCours.findMany({
        where: { id_professeur: id_professeur },
        include: {
            cours: true,
            salle: true,
        },
    });
};

/**
 * Met à jour une affectation
 * @param {number} id
 * @param {Object} data - { id_cours, id_salle, id_professeur, date, plageHoraire }
 * @returns l'affectation mise à jour
 */
const updateAffectation = async (id, data) => {
    const affectation = await prisma.affectationCours.findUnique({
        where: { id: id },
    });

    if (!affectation) {
        throw new Error("Affectation non trouvée");
    }

    const newDate = data.date ? new Date(data.date) : affectation.date;
    const newPlage = data.plageHoraire || affectation.plageHoraire;
    const newSalle = data.id_salle !== undefined ? data.id_salle : affectation.id_salle;
    const newProf = data.id_professeur !== undefined ? data.id_professeur : affectation.id_professeur;

    // Vérifier conflit salle (exclure l'affectation courante)
    if (newSalle) {
        const salleOccupee = await verifierConflitSalle(newSalle, newDate, newPlage, id);
        if (salleOccupee) {
            throw new Error("Conflit : cette salle est déjà occupée à cette date et plage horaire");
        }
    }

    // Vérifier conflit professeur (exclure l'affectation courante)
    if (newProf) {
        const profOccupe = await verifierConflitProfesseur(newProf, newDate, newPlage, id);
        if (profOccupe) {
            throw new Error("Conflit : ce professeur est déjà assigné à un cours à cette date et plage horaire");
        }
    }

    const updated = await prisma.affectationCours.update({
        where: { id: id },
        data: {
            id_cours: data.id_cours || affectation.id_cours,
            id_salle: newSalle,
            id_professeur: newProf,
            date: newDate,
            plageHoraire: newPlage,
        },
        include: {
            cours: true,
            salle: true,
            professeur: true,
        },
    });

    return updated;
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

export {
    verifierConflitSalle,
    verifierConflitProfesseur,
    affecterCoursASalle,
    assignerProfesseur,
    getAffectations,
    getAffectationById,
    getAffectationsBySalle,
    getAffectationsByProfesseur,
    updateAffectation,
    deleteAffectation,
};
