// Importer le client Prisma
import { PrismaClient } from "@prisma/client";
import { primitiveOuIgnoree } from "./valeursPrimitives.js";

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
 * Convertit une chaîne "HH:MM" en minutes depuis minuit
 * @param {string} heure - ex: "08:30"
 * @returns {number} minutes depuis minuit
 */
function heureEnMinutes(heure) {
    const [h, m] = heure.split(":").map(Number);
    return h * 60 + m;
}

const NOMS_JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

/**
 * Convertit un jour de la semaine en indice (0 = dimanche ... 6 = samedi).
 * Accepte le chiffre (nombre ou chaîne "0" à "6" : format des séances récurrentes) et le nom français
 * ("Lundi"... : format des disponibilités et des anciennes séances).
 * @param {string|number|null|undefined} jour
 * @returns {number|null} l'indice, ou null si le jour est absent ou non reconnu
 */
const indiceJour = (jour) => {
    if (jour === null || jour === undefined) return null;
    const texte = String(jour).trim();
    if (/^[0-6]$/.test(texte)) return Number(texte);
    const indice = NOMS_JOURS.indexOf(texte);
    return indice === -1 ? null : indice;
};

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
const verifierConflitSalle = async (id_salle, date, plageHoraire, exclureId = null, id_semestre = null) => {
    // Chercher les affectations avec la même date spécifique et le même semestre
    const where = {
        id_salle: id_salle,
        date: date,
    };
    if (id_semestre !== null) {
        where.id_semestre = id_semestre;
    }
    if (exclureId) {
        where.id = { not: exclureId };
    }

    const affectationsDate = await prisma.affectationCours.findMany({ where });

    // Chercher aussi les affectations par jour (date=null) qui correspondent au même jour de la semaine et semestre
    const jourDeLaSemaine = date.getDay();
    const whereJour = {
        id_salle: id_salle,
        date: null,
        jour: jourDeLaSemaine.toString(),
    };
    if (id_semestre !== null) {
        whereJour.id_semestre = id_semestre;
    }
    const affectationsJour = await prisma.affectationCours.findMany({
        where: whereJour,
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
const verifierConflitProfesseur = async (id_professeur, date, plageHoraire, exclureId = null, id_semestre = null) => {
    // Chercher les affectations avec la même date spécifique et le même semestre
    const where = {
        id_professeur: id_professeur,
        date: date,
    };
    if (id_semestre !== null) {
        where.id_semestre = id_semestre;
    }
    if (exclureId) {
        where.id = { not: exclureId };
    }

    const affectationsDate = await prisma.affectationCours.findMany({ where });

    // Chercher aussi les affectations par jour (date=null) qui correspondent au même jour de la semaine et semestre
    const jourDeLaSemaine = date.getDay();
    const whereJour = {
        id_professeur: id_professeur,
        date: null,
        jour: jourDeLaSemaine.toString(),
    };
    if (id_semestre !== null) {
        whereJour.id_semestre = id_semestre;
    }
    const affectationsJour = await prisma.affectationCours.findMany({
        where: whereJour,
    });

    const toutesAffectations = [...affectationsDate, ...affectationsJour];

    return toutesAffectations.some(function (a) {
        return plagesSeChevauchent(plageHoraire, a.plageHoraire);
    });
};

/**
 * Indique si une séance est récurrente : pas de date précise, mais un jour de la semaine
 * @param {Date|null} date
 * @param {string|number|null} jour - "0" (dimanche) à "6" (samedi)
 * @returns {boolean}
 */
const estRecurrente = (date, jour) => {
    return !date && jour !== null && jour !== undefined && jour !== "";
};

/**
 * Vérifie si une salle ou un professeur est déjà pris lorsque la séance contrôlée est récurrente
 * (date null, jour "0" à "6"). Compare avec les autres séances récurrentes du même semestre et du
 * même jour, puis avec les séances datées de ce semestre qui tombent ce jour de la semaine.
 * @param {Object} critere - { id_salle } ou { id_professeur }
 * @param {string|number} jour - "0" (dimanche) à "6" (samedi)
 * @param {string} plageHoraire
 * @param {number|null} exclureId - ID de l'affectation contrôlée, exclue de la comparaison
 * @param {number|null} id_semestre
 * @returns true si une autre séance chevauche cette plage horaire ce jour-là
 */
const verifierConflitRecurrent = async (critere, jour, plageHoraire, exclureId = null, id_semestre = null) => {
    const filtres = { ...critere };
    if (id_semestre !== null && id_semestre !== undefined) {
        filtres.id_semestre = id_semestre;
    }
    if (exclureId) {
        filtres.id = { not: exclureId };
    }

    // Autres séances récurrentes le même jour de la semaine
    const affectationsRecurrentes = await prisma.affectationCours.findMany({
        where: { ...filtres, date: null, jour: String(jour) },
    });

    // Séances datées du semestre : Prisma ne filtre pas sur le jour de la semaine, on le fait ici.
    // Les dates sont stockées à midi UTC (normalizeDate) : on lit donc le jour en UTC.
    const jourDeLaSemaine = Number(jour);
    const affectationsDatees = await prisma.affectationCours.findMany({
        where: { ...filtres, date: { not: null } },
    });
    const affectationsDateesCeJour = affectationsDatees.filter(function (a) {
        return new Date(a.date).getUTCDay() === jourDeLaSemaine;
    });

    return [...affectationsRecurrentes, ...affectationsDateesCeJour].some(function (a) {
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
    const salleOccupee = await verifierConflitSalle(id_salle, normalizeDate(date), plageHoraire, null, id_semestre || null);
    if (salleOccupee) {
        throw new Error("Conflit : cette salle est déjà occupée à cette date et plage horaire");
    }

    // Vérifier si le professeur est déjà occupé (si fourni)
    if (id_professeur) {
        const profOccupe = await verifierConflitProfesseur(id_professeur, normalizeDate(date), plageHoraire, null, id_semestre || null);
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
            date: normalizeDate(date),
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
    if (id_semestre === undefined || id_semestre === null || jour === undefined || jour === null) {
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
    
    const salleOccupee = await verifierConflitSalle(id_salle, dateActuelle, plageHoraire, null, id_semestre);
    if (salleOccupee) {
        throw new Error("Conflit : cette salle est déjà occupée à ce jour et cette plage horaire");
    }

    // Vérifier si le professeur est déjà occupé (si fourni)
    if (id_professeur) {
        // 1. Vérifier que le créneau est dans les disponibilités du prof pour ce jour
        const JOURS_NOMS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
        const nomJour = JOURS_NOMS[parseInt(jour)];
        if (nomJour) {
            const dispos = await prisma.disponibilite.findMany({
                where: { id_professeur, jour: nomJour },
            });
            if (dispos.length > 0) {
                const hm = (str) => { const [h,m] = str.split(":").map(Number); return h*60+(m||0); };
                const [debutSlot, finSlot] = plageHoraire.split("-").map(hm);
                const dansUneDispo = dispos.some(d => {
                    const [dDebut, dFin] = d.plageHoraire.split("-").map(hm);
                    return debutSlot >= dDebut && finSlot <= dFin;
                });
                if (!dansUneDispo) {
                    const plages = dispos.map(d => d.plageHoraire).join(", ");
                    throw new Error(`Disponibilité : ce professeur n'est disponible le ${nomJour} que de ${plages}`);
                }
            }
        }

        // 2. Vérifier qu'il n'a pas déjà un cours au même créneau ce semestre
        const profOccupe = await verifierConflitProfesseur(id_professeur, dateActuelle, plageHoraire, null, id_semestre);
        if (profOccupe) {
            throw new Error("Conflit : ce professeur est déjà assigné à un cours à ce jour et cette plage horaire pour ce semestre");
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

    if (estRecurrente(affectation.date, affectation.jour)) {
        // Séance récurrente (date null) : on compare par jour de la semaine et par semestre
        const profOccupe = await verifierConflitRecurrent(
            { id_professeur }, affectation.jour, affectation.plageHoraire, id_affectation, affectation.id_semestre
        );
        if (profOccupe) {
            throw new Error("Conflit : ce professeur est déjà assigné à un cours à ce jour et cette plage horaire pour ce semestre");
        }
    } else {
        // Vérifier si le professeur est déjà occupé à cette date et plage horaire
        // (cette séance est exclue : réassigner le même professeur ne doit pas créer un faux conflit avec elle-même)
        const profOccupe = await verifierConflitProfesseur(id_professeur, affectation.date, affectation.plageHoraire, id_affectation);
        if (profOccupe) {
            throw new Error("Conflit : ce professeur est déjà assigné à un cours à cette date et plage horaire");
        }
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
    // Filtrer avant les contrôles : Prisma interpréterait { set: ... } comme une
    // opération alors que le contrôle de conflit comparerait un objet au jour.
    // Les Date restent acceptées pour les appelants internes du modèle.
    data = {
        id_cours: primitiveOuIgnoree(data.id_cours),
        id_salle: primitiveOuIgnoree(data.id_salle),
        id_professeur: primitiveOuIgnoree(data.id_professeur),
        id_semestre: primitiveOuIgnoree(data.id_semestre),
        jour: primitiveOuIgnoree(data.jour),
        plageHoraire: primitiveOuIgnoree(data.plageHoraire),
        date: data.date instanceof Date ? data.date : primitiveOuIgnoree(data.date),
    };

    const affectation = await prisma.affectationCours.findUnique({
        where: { id: id },
    });

    if (!affectation) {
        throw new Error("Affectation non trouvée");
    }

    // Gérer le jour et la date
    const newDate = data.date ? normalizeDate(data.date) : affectation.date;
    // Convertir jour en string si c'est un entier
    const newJour = data.jour !== undefined ? (typeof data.jour === 'number' ? data.jour.toString() : data.jour) : affectation.jour;
    
    const newPlage = data.plageHoraire || affectation.plageHoraire;
    const newSalle = data.id_salle !== undefined ? data.id_salle : affectation.id_salle;
    const newProf = data.id_professeur !== undefined ? data.id_professeur : affectation.id_professeur;
    const newSemestre = data.id_semestre !== undefined ? data.id_semestre : affectation.id_semestre;

    // Séance récurrente : pas de date précise, contrôlée par jour de la semaine et par semestre
    const recurrente = estRecurrente(newDate, newJour);

    // Vérifier conflit salle (exclure l'affectation courante, même semestre seulement)
    if (newSalle && newDate) {
        const salleOccupee = await verifierConflitSalle(newSalle, newDate, newPlage, id, newSemestre);
        if (salleOccupee) {
            throw new Error("Conflit : cette salle est déjà occupée à cette date et plage horaire pour ce semestre");
        }
    } else if (newSalle && recurrente) {
        const salleOccupee = await verifierConflitRecurrent({ id_salle: newSalle }, newJour, newPlage, id, newSemestre);
        if (salleOccupee) {
            throw new Error("Conflit : cette salle est déjà occupée à ce jour et cette plage horaire pour ce semestre");
        }
    }

    // Vérifier conflit professeur (exclure l'affectation courante, même semestre seulement)
    if (newProf && newDate) {
        const profOccupe = await verifierConflitProfesseur(newProf, newDate, newPlage, id, newSemestre);
        if (profOccupe) {
            throw new Error("Conflit : ce professeur est déjà assigné à un cours à cette date et plage horaire pour ce semestre");
        }
    } else if (newProf && recurrente) {
        const profOccupe = await verifierConflitRecurrent({ id_professeur: newProf }, newJour, newPlage, id, newSemestre);
        if (profOccupe) {
            throw new Error("Conflit : ce professeur est déjà assigné à un cours à ce jour et cette plage horaire pour ce semestre");
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
            // Affectation par jour : 8 jours par semaine
            totalMinutes += minutes * 8;
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
            // Affectation par jour : 6 jours par semaine
            totalMinutes += minutes * 6;
        } else {
            // Affectation unique
            totalMinutes += minutes;
        }
    });

    return Math.round(totalMinutes / 60); // Conversion en heures
};

/**
 * Retourne tous les professeurs avec leur statut de disponibilité pour un créneau donné.
 * Effectue seulement 2 requêtes DB (pas de N+1).
 * @param {number} id_semestre
 * @param {string} jour - "0" à "6" (0=Dimanche)
 * @param {string} debut - ex: "09:00"
 * @param {string} fin   - ex: "11:00"
 * @returns tableau de professeurs avec statut: "disponible" | "hors_plage" | "pas_dispo" | "conflit" | "complet"
 */
const getProfesseursAvecDisponibilitePourSlot = async (id_semestre, jour, debut, fin) => {
    // Normaliser le jour : accepte "Lundi" (string) ou "1" (number)
    let nomJour = jour;
    if (!isNaN(jour)) {
        const joursNoms = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        nomJour = joursNoms[parseInt(jour)];
    }
    
    const plageDemandeStr = debut + "-" + fin;
    const debutMin = heureEnMinutes(debut);
    const finMin = heureEnMinutes(fin);

    // Récupérer tous les professeurs et affectations du semestre
    const [professeurs, toutesAffectations] = await Promise.all([
        prisma.professeur.findMany({ 
            include: { disponibilites: true } 
        }),
        prisma.affectationCours.findMany({ 
            where: { id_semestre: parseInt(id_semestre) } 
        }),
    ]);

    return professeurs.map(function (prof) {
        // Affectations du prof pour ce semestre
        const affectationsProf = toutesAffectations.filter(a => a.id_professeur === prof.id);

        // Chercher la disponibilité pour ce jour
        const dispoJour = prof.disponibilites.find(d => d.jour === nomJour);

        if (!dispoJour) {
            return { 
                id: prof.id, 
                nom: prof.nom, 
                prenom: prof.prenom, 
                statut: "pas_dispo" 
            };
        }

        // Vérifier que la plage demandée est dans la plage déclarée
        const [dispoDebut, dispoFin] = dispoJour.plageHoraire.split("-");
        const dispoDebutMin = heureEnMinutes(dispoDebut);
        const dispoFinMin = heureEnMinutes(dispoFin);

        if (debutMin < dispoDebutMin || finMin > dispoFinMin) {
            return {
                id: prof.id, 
                nom: prof.nom, 
                prenom: prof.prenom,
                plageDeclaree: dispoJour.plageHoraire, 
                statut: "hors_plage",
            };
        }

        // Affectations du prof pour ce jour. Les séances récurrentes stockent le jour en chiffre ("0" à "6"),
        // les séances héritées avec le nom français : on compare donc les indices, pas les libellés.
        const indiceDemande = indiceJour(nomJour);
        const affectationsJour = affectationsProf.filter(function (a) {
            const indiceAffectation = indiceJour(a.jour);
            return indiceAffectation !== null && indiceAffectation === indiceDemande;
        });
        
        // Calculer heures occupées ce jour
        const minutesOccupees = affectationsJour.reduce(function (sum, a) {
            const [d, f] = a.plageHoraire.split("-").map(heureEnMinutes);
            return sum + (f - d);
        }, 0);
        
        const minutesDispo = dispoFinMin - dispoDebutMin;
        const minutesLibres = minutesDispo - minutesOccupees;
        const heuresLibres = Math.round(minutesLibres / 60);
        const dureeDemandeMin = finMin - debutMin;

        // Vérifier les conflits
        const hasConflit = affectationsJour.some(a => plagesSeChevauchent(plageDemandeStr, a.plageHoraire));

        let statut;
        if (hasConflit) {
            statut = "conflit";
        } else if (dureeDemandeMin > minutesLibres) {
            statut = "complet";
        } else {
            statut = "disponible";
        }

        return {
            id: prof.id, 
            nom: prof.nom, 
            prenom: prof.prenom,
            plageDeclaree: dispoJour.plageHoraire,
            heuresLibres: Math.max(0, heuresLibres),
            creneauxOccupes: affectationsJour.map(a => a.plageHoraire),
            statut,
        };
    });
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
    getProfesseursAvecDisponibilitePourSlot,
};
