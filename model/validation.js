// Validateurs partagés par les modèles du socle scolaire.
// Chaque validateur retourne une valeur primitive propre (ou Date) ou lève une
// ErreurValidation dont le message, rédigé ici, peut être renvoyé tel quel au
// client : il cite le champ, jamais la valeur reçue ni un détail interne.

/**
 * Erreur de validation des données reçues (l'appelant répond 400).
 */
export class ErreurValidation extends Error {
    constructor(message) {
        super(message);
        this.name = "ErreurValidation";
    }
}

/**
 * Ressource introuvable (l'appelant répond 404).
 */
export class ErreurIntrouvable extends Error {
    constructor(message) {
        super(message);
        this.name = "ErreurIntrouvable";
    }
}

/**
 * Conflit avec l'état actuel des données (l'appelant répond 409) : compte déjà
 * rattaché, lien modifié en parallèle.
 */
export class ErreurConflit extends Error {
    constructor(message) {
        super(message);
        this.name = "ErreurConflit";
    }
}

/** Borne des identifiants : INT SQL Server (32 bits signé). */
export const ID_MAX = 2147483647;

// Bornes de plausibilité des dates (dates de naissance, années scolaires).
const ANNEE_MIN = 1900;
const ANNEE_MAX = 2100;

const REGEX_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const REGEX_COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Caractères de contrôle (NUL, retours à la ligne, tabulations...) : jamais dans un nom ou un code.
const REGEX_CONTROLE = /[\u0000-\u001F\u007F]/;

/**
 * Exige un objet simple (le corps de la requête) : ni null, ni tableau, ni primitive.
 * @param {unknown} donnees
 * @returns {object}
 */
export const exigerObjet = (donnees) => {
    if (donnees === null || typeof donnees !== "object" || Array.isArray(donnees)) {
        throw new ErreurValidation("Le corps de la requête doit être un objet JSON.");
    }
    return donnees;
};

/**
 * Valide une chaîne fournie et la retourne sans les espaces de bordure.
 * La longueur est comptée en unités UTF-16, comme NVARCHAR(n).
 */
const nettoyerChaine = (valeur, nom, max) => {
    if (typeof valeur !== "string") {
        throw new ErreurValidation(`Le champ « ${nom} » doit être une chaîne de caractères.`);
    }
    const chaine = valeur.trim();
    if (chaine.length > max) {
        throw new ErreurValidation(`Le champ « ${nom} » ne doit pas dépasser ${max} caractères.`);
    }
    if (REGEX_CONTROLE.test(chaine)) {
        throw new ErreurValidation(`Le champ « ${nom} » contient des caractères non autorisés.`);
    }
    return chaine;
};

/**
 * Chaîne obligatoire, non vide après suppression des espaces de bordure.
 * @param {unknown} valeur
 * @param {string} nom - Nom du champ (pour le message)
 * @param {number} max - Longueur maximale (celle de la colonne)
 * @returns {string}
 */
export const chaineObligatoire = (valeur, nom, max) => {
    if (valeur === undefined || valeur === null) {
        throw new ErreurValidation(`Le champ « ${nom} » est obligatoire.`);
    }
    const chaine = nettoyerChaine(valeur, nom, max);
    if (chaine.length === 0) {
        throw new ErreurValidation(`Le champ « ${nom} » est obligatoire.`);
    }
    return chaine;
};

/**
 * Chaîne facultative : absente, null ou vide donnent null.
 * @returns {string|null}
 */
export const chaineOptionnelle = (valeur, nom, max) => {
    if (valeur === undefined || valeur === null) {
        return null;
    }
    const chaine = nettoyerChaine(valeur, nom, max);
    return chaine.length === 0 ? null : chaine;
};

/**
 * Adresse courriel facultative : absente, null ou vide donnent null.
 * @returns {string|null}
 */
export const courrielOptionnel = (valeur, nom, max) => {
    const courriel = chaineOptionnelle(valeur, nom, max);
    if (courriel !== null && !REGEX_COURRIEL.test(courriel)) {
        throw new ErreurValidation(`Le champ « ${nom} » n'est pas une adresse courriel valide.`);
    }
    return courriel;
};

/**
 * Entier (type number, sans conversion depuis une chaîne) compris entre min et max inclus.
 * @returns {number}
 */
export const entierBorne = (valeur, nom, min, max) => {
    if (!Number.isInteger(valeur) || valeur < min || valeur > max) {
        throw new ErreurValidation(`Le champ « ${nom} » doit être un entier compris entre ${min} et ${max}.`);
    }
    return valeur;
};

/**
 * Entier facultatif : absent ou null donnent null.
 * @returns {number|null}
 */
export const entierBorneOptionnel = (valeur, nom, min, max) => {
    if (valeur === undefined || valeur === null) {
        return null;
    }
    return entierBorne(valeur, nom, min, max);
};

/**
 * Identifiant de ligne (entier de 1 à ID_MAX). Un objet du type { connect: ... }
 * ou une chaîne sont refusés : jamais d'écriture imbriquée.
 * @returns {number}
 */
export const identifiant = (valeur, nom) => entierBorne(valeur, nom, 1, ID_MAX);

/**
 * Identifiant facultatif : absent ou null donnent null.
 * @returns {number|null}
 */
export const identifiantOptionnel = (valeur, nom) => entierBorneOptionnel(valeur, nom, 1, ID_MAX);

/**
 * Date AAAA-MM-JJ (colonne @db.Date) convertie en Date UTC à minuit.
 * La chaîne est validée par expression régulière et par aller-retour calendaire
 * (2026-02-30 est refusée, pas décalée au 2 mars).
 * @param {unknown} valeur
 * @param {string} nom - Nom du champ (pour le message)
 * @returns {Date}
 */
export const dateISO = (valeur, nom) => {
    const message = `Le champ « ${nom} » doit être une date valide au format AAAA-MM-JJ (entre ${ANNEE_MIN} et ${ANNEE_MAX}).`;

    const correspondance = typeof valeur === "string" ? REGEX_DATE.exec(valeur) : null;
    if (correspondance === null) {
        throw new ErreurValidation(message);
    }

    const annee = Number(correspondance[1]);
    if (annee < ANNEE_MIN || annee > ANNEE_MAX) {
        throw new ErreurValidation(message);
    }

    const date = new Date(`${valeur}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== valeur) {
        throw new ErreurValidation(message);
    }
    return date;
};

/**
 * Date facultative : absente, null ou vide donnent null.
 * @returns {Date|null}
 */
export const dateISOOptionnelle = (valeur, nom) => {
    if (valeur === undefined || valeur === null || valeur === "") {
        return null;
    }
    return dateISO(valeur, nom);
};

/**
 * Booléen strict (aucune conversion depuis "true", 0, 1...). Absent : valeur par défaut.
 * @param {unknown} valeur
 * @param {string} nom
 * @param {boolean} parDefaut
 * @returns {boolean}
 */
export const booleen = (valeur, nom, parDefaut) => {
    if (valeur === undefined) {
        return parDefaut;
    }
    if (typeof valeur !== "boolean") {
        throw new ErreurValidation(`Le champ « ${nom} » doit être un booléen (true ou false).`);
    }
    return valeur;
};
