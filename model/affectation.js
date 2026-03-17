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
    // Chercher les affectations avec la même date spécifique
    const where = {
        id_salle: id_salle,
        date: date,
    };
    if (exclureId) {
        where.id = { not: exclureId };
    }

    const affectationsDate = await prisma.affectationCours.findMany({ where });

    // Chercher aussi les affectations par jour (date=null) qui correspondent au même jour de la semaine
    const jourDeLaSemaine = date.getDay();
    const affectationsJour = await prisma.affectationCours.findMany({
        where: {
            id_salle: id_salle,
            date: null,
            jour: jourDeLaSemaine.toString(),
        },
    });

    const toutesAffectations = [...affectationsDate, ...affectationsJour];

    return toutesAffectations.some(function (a) {
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
    // Chercher les affectations avec la même date spécifique
    const where = {
        id_professeur: id_professeur,
        date: date,
    };
    if (exclureId) {
        where.id = { not: exclureId };
    }

    const affectationsDate = await prisma.affectationCours.findMany({ where });

    // Chercher aussi les affectations par jour (date=null) qui correspondent au même jour de la semaine
    const jourDeLaSemaine = date.getDay();
    const affectationsJour = await prisma.affectationCours.findMany({
        where: {
            id_professeur: id_professeur,
            date: null,
            jour: jourDeLaSemaine.toString(),
        },
    });

    const toutesAffectations = [...affectationsDate, ...affectationsJour];

    return toutesAffectations.some(function (a) {
        return plagesSeChevauchent(plageHoraire, a.plageHoraire);
    });
};

/**
 * Affecte un cours à une salle avec une date et plage horaire
 * @param {Object} affectationData - { id_cours, id_salle, date, plageHoraire, id_semestre?, id_professeur?, session? }
 * @returns l'affectation créée
 */
const affecterCoursASalle = async (affectationData) => {
    const { id_cours, id_salle, date, plageHoraire, id_semestre, id_professeur, session } = affectationData;

    // Vérifier si la salle est déjà occupée
    const salleOccupee = await verifierConflitSalle(id_salle, new Date(date), plageHoraire);
    if (salleOccupee) {
        throw new Error("Conflit : cette salle est déjà occupée à cette date et plage horaire");
    }

    // Vérifier si le professeur est déjà occupé (si fourni)
    if (id_professeur) {
        const profOccupe = await verifierConflitProfesseur(id_professeur, new Date(date), plageHoraire);
        if (profOccupe) {
            throw new Error("Conflit : ce professeur est déjà assigné à un cours à cette date et plage horaire");
        }
    }

    const newAffectation = await prisma.affectationCours.create({
        data: {
            id_cours,
            id_salle,
            id_professeur: id_professeur || null,
            id_semestre: id_semestre || null,
            date: new Date(date),
            plageHoraire,
            session: session || "Non défini", // Gardé pour compatibilité
        },
        include: {
            cours: true,
            salle: true,
            professeur: true,
        },
    });
    return newAffectation;
};

/**
 * Affecte un cours à un semestre pour un jour spécifique de la semaine
 * Crée UNE SEULE affectation "template" avec le jour de la semaine
 * Le planner génère les occurrences pour chaque semaine du semestre
 * @param {Object} affectationData - { id_cours, id_salle, jour, plageHoraire, id_semestre, id_professeur? }
 * jour: 0=dimanche, 1=lundi, ..., 6=samedi
 * @returns l'affectation créée
 */
const affecterCoursAuSemestre = async (affectationData) => {
    const { id_cours, id_salle, jour, plageHoraire, id_semestre, id_professeur } = affectationData;

    // Valider les données obligatoires
    if (!id_semestre || jour === undefined || jour === null) {
        throw new Error("Semestre et jour sont obligatoires");
    }

    // Récupérer le semestre
    const semestre = await prisma.semestre.findUnique({
        where: { id: id_semestre },
        include: { joursFeeries: true },
    });

    if (!semestre) {
        throw new Error("Semestre non trouvé");
    }

    // Vérifier les conflits potentiels sur la première occurrence du jour
    const dateDebut = new Date(semestre.dateDebut);
    let dateActuelle = new Date(dateDebut);
    const jourActuel = dateActuelle.getDay();
    const joursAAvancer = (jour - jourActuel + 7) % 7;
    dateActuelle.setDate(dateActuelle.getDate() + joursAAvancer);
    
    const salleOccupee = await verifierConflitSalle(id_salle, dateActuelle, plageHoraire);
    if (salleOccupee) {
        throw new Error("Conflit : cette salle est déjà occupée à ce jour et cette plage horaire");
    }

    // Vérifier si le professeur est déjà occupé (si fourni)
    if (id_professeur) {
        const profOccupe = await verifierConflitProfesseur(id_professeur, dateActuelle, plageHoraire);
        if (profOccupe) {
            throw new Error("Conflit : ce professeur est déjà assigné à un cours à ce jour et cette plage horaire");
        }
    }

    // Créer UNE SEULE affectation "template"
    const newAffectation = await prisma.affectationCours.create({
        data: {
            id_cours,
            id_salle,
            id_professeur: id_professeur || null,
            id_semestre: id_semestre,
            jour: jour.toString(), // Stocker le jour de la semaine (0-6)
            date: null, // Pas de date spécifique, le planner génère les occurrences
            plageHoraire,
        },
        include: {
            cours: true,
            salle: true,
            professeur: true,
            semestre: true,
        },
    });

    return newAffectation;
};
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
 * @param {Object} data - { id_cours, id_salle, id_professeur, id_semestre, date, plageHoraire }
 * @returns l'affectation mise à jour
 */
const updateAffectation = async (id, data) => {
    const affectation = await prisma.affectationCours.findUnique({
        where: { id: id },
    });

    if (!affectation) {
        throw new Error("Affectation non trouvée");
    }

    // Gérer le jour et la date
    const newDate = data.date ? new Date(data.date) : affectation.date;
    // Convertir jour en string si c'est un entier
    const newJour = data.jour !== undefined ? (typeof data.jour === 'number' ? data.jour.toString() : data.jour) : affectation.jour;
    
    const newPlage = data.plageHoraire || affectation.plageHoraire;
    const newSalle = data.id_salle !== undefined ? data.id_salle : affectation.id_salle;
    const newProf = data.id_professeur !== undefined ? data.id_professeur : affectation.id_professeur;
    const newSemestre = data.id_semestre !== undefined ? data.id_semestre : affectation.id_semestre;

    // Vérifier conflit salle (exclure l'affectation courante)
    if (newSalle && newDate) {
        const salleOccupee = await verifierConflitSalle(newSalle, newDate, newPlage, id);
        if (salleOccupee) {
            throw new Error("Conflit : cette salle est déjà occupée à cette date et plage horaire");
        }
    }

    // Vérifier conflit professeur (exclure l'affectation courante)
    if (newProf && newDate) {
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
            id_semestre: newSemestre,
            jour: newJour || null,
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

/**
 * Calcule la charge horaire d'un professeur pour un semestre donné
 * @param {number} id_professeur
 * @param {number} id_semestre
 * @returns {number} nombre d'heures totales
 */
const calculerChargeHoraireProfesseur = async (id_professeur, id_semestre) => {
    const affectations = await prisma.affectationCours.findMany({
        where: {
            id_professeur: id_professeur,
            id_semestre: id_semestre,
        },
    });

    let totalMinutes = 0;
    affectations.forEach(function(aff) {
        const [debut, fin] = aff.plageHoraire.split("-").map(heureEnMinutes);
        const minutes = fin - debut;
        if (aff.jour !== null && aff.jour !== undefined) {
            // Affectation par jour : multiplier par le nombre de semaines (approximation : ~4 semaines)
            totalMinutes += minutes * 4;
        } else {
            // Affectation unique
            totalMinutes += minutes;
        }
    });

    return Math.round(totalMinutes / 60); // Conversion en heures
};

/**
 * Calcule la charge horaire d'une salle pour un semestre donné
 * @param {number} id_salle
 * @param {number} id_semestre
 * @returns {number} nombre d'heures totales
 */
const calculerChargeHoraireSalle = async (id_salle, id_semestre) => {
    const affectations = await prisma.affectationCours.findMany({
        where: {
            id_salle: id_salle,
            id_semestre: id_semestre,
        },
    });

    let totalMinutes = 0;
    affectations.forEach(function(aff) {
        const [debut, fin] = aff.plageHoraire.split("-").map(heureEnMinutes);
        const minutes = fin - debut;
        if (aff.jour !== null && aff.jour !== undefined) {
            // Affectation par jour : multiplier par le nombre de semaines
            totalMinutes += minutes * 4;
        } else {
            // Affectation unique
            totalMinutes += minutes;
        }
    });

    return Math.round(totalMinutes / 60); // Conversion en heures
};

export {
    affecterCoursASalle,
    affecterCoursAuSemestre,
    assignerProfesseur,
    getAffectations,
    getAffectationById,
    getAffectationsBySalle,
    getAffectationsByProfesseur,
    updateAffectation,
    deleteAffectation,
    calculerChargeHoraireProfesseur,
    calculerChargeHoraireSalle,
};
