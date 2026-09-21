import { estRequeteApi } from "./auth.js";

// Méthodes qui modifient des données : les seules contrôlées.
const METHODES_ECRITURE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const MESSAGE_REFUSE = "Requête refusée.";

/**
 * Hôte (avec port) d'une URL d'origine, ou null si l'en-tête n'est pas une
 * origine http(s) valide ("null" envoyé par un contexte isolé, texte libre, etc.).
 */
const hoteDeLOrigine = (origine) => {
    try {
        const url = new URL(origine);
        return url.protocol === "http:" || url.protocol === "https:" ? url.host : null;
    } catch {
        return null;
    }
};

/**
 * Vrai si le Content-Type de la requête est exactement application/json
 * (paramètres comme charset ignorés). Un navigateur ne peut pas émettre ce type
 * depuis un formulaire ou une requête « simple » d'un autre site.
 */
const estJson = (req) => {
    const type = String(req.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    return type === "application/json";
};

/**
 * Vrai si la requête porte un en-tête personnalisé non simple : un autre site ne
 * peut pas l'ajouter sans passer par une pré-vérification CORS. X-Nom-Fichier
 * sert aux envois de fichiers (corps binaire), qui n'ont pas le type JSON.
 */
const aEnteteNonSimple = (req) =>
    ["x-requested-with", "x-nom-fichier"].some((nom) => String(req.get(nom) ?? "").length > 0);

const refuser = (req, res) => {
    if (estRequeteApi(req)) {
        return res.status(403).json({ error: MESSAGE_REFUSE });
    }
    return res.status(403).send(MESSAGE_REFUSE);
};

/**
 * Lit la variable ORIGINES_AUTORISEES : hôtes supplémentaires acceptés dans
 * l'en-tête Origin (séparés par des virgules ; hôte seul ou URL complète). Utile
 * si un mandataire réécrit l'en-tête Host. Vide par défaut.
 * @param {Record<string, string|undefined>} [env=process.env]
 * @returns {string[]}
 */
export const lireHotesAutorises = (env = process.env) =>
    String(env.ORIGINES_AUTORISEES ?? "")
        .split(",")
        .map((element) => element.trim().toLowerCase())
        .filter((element) => element.length > 0)
        .map((element) => (element.includes("://") ? hoteDeLOrigine(element) : element))
        .filter((hote) => hote !== null);

/**
 * Fabrique la protection CSRF pour POST, PUT, PATCH et DELETE. Elle complète le
 * cookie de session SameSite=Lax.
 * (a) En-tête Origin présent : son hôte doit être celui de la requête (req.host,
 *     qui suit X-Forwarded-Host seulement si "trust proxy" est activé) ou un hôte
 *     de la liste blanche ; sinon 403.
 * (b) En-tête Origin absent : Content-Type application/json, ou en-tête
 *     X-Requested-With ou X-Nom-Fichier ; sinon 403.
 * Les méthodes de lecture ne sont jamais contrôlées.
 * @param {{ hotesAutorises?: string[] }} [options]
 * @returns {import("express").RequestHandler}
 */
export const gardeCsrf = ({ hotesAutorises = [] } = {}) => (req, res, next) => {
    if (!METHODES_ECRITURE.has(req.method)) {
        return next();
    }

    const origine = req.get("origin");
    if (origine !== undefined) {
        const hote = hoteDeLOrigine(origine);
        const hoteRequete = String(req.host ?? "").toLowerCase();
        if (hote !== null && (hote === hoteRequete || hotesAutorises.includes(hote))) {
            return next();
        }
        return refuser(req, res);
    }

    if (estJson(req) || aEnteteNonSimple(req)) {
        return next();
    }
    return refuser(req, res);
};
