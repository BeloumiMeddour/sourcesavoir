// Limitation des tentatives (connexion, inscription), écrite à la main :
// fenêtre glissante, en mémoire du processus, mémoire bornée.
// Limite connue : les compteurs ne sont pas partagés entre plusieurs instances
// du serveur et repartent à zéro au redémarrage.

export const MESSAGE_TROP_DE_TENTATIVES = "Trop de tentatives. Veuillez réessayer plus tard.";

// Longueur maximale d'une clé de courriel gardée en mémoire (un courriel valide
// en compte 150 au plus).
const LONGUEUR_MAX_CLE = 200;

/**
 * Fabrique un middleware qui refuse (429) au-delà de `max` tentatives par clé
 * dans une fenêtre glissante de `fenetreMs`.
 * - Une tentative refusée n'est pas enregistrée : elle ne prolonge pas le blocage.
 * - Une clé null (courriel absent ou mal formé) ne compte pas : l'autre limiteur
 *   (IP) reste seul à jouer son rôle.
 * - Mémoire bornée : au plus `maxCles` clés, avec `max` horodatages chacune. Les
 *   clés expirées sont purgées périodiquement, puis la plus ancienne est évincée
 *   si la table est encore pleine.
 * @param {object} options
 * @param {number} options.max - tentatives permises dans la fenêtre
 * @param {number} options.fenetreMs - durée de la fenêtre en millisecondes
 * @param {(req: import("express").Request) => string|null} options.cle - clé de la requête
 * @param {number} [options.maxCles=10000] - nombre maximal de clés gardées
 * @returns {import("express").RequestHandler & { taille: () => number }}
 */
export const creerLimiteur = ({ max, fenetreMs, cle, maxCles = 10000 }) => {
    // clé -> horodatages (croissants) des tentatives acceptées dans la fenêtre
    const tentatives = new Map();
    let dernierNettoyage = Date.now();

    // Retire les horodatages sortis de la fenêtre ; retourne ce qui reste
    const garderRecentes = (horodatages, maintenant) => {
        let premier = 0;
        while (premier < horodatages.length && maintenant - horodatages[premier] >= fenetreMs) {
            premier++;
        }
        if (premier > 0) horodatages.splice(0, premier);
        return horodatages;
    };

    // Supprime toutes les clés dont chaque tentative a expiré
    const purger = (maintenant) => {
        for (const [uneCle, horodatages] of tentatives) {
            if (garderRecentes(horodatages, maintenant).length === 0) {
                tentatives.delete(uneCle);
            }
        }
        dernierNettoyage = maintenant;
    };

    const limiteur = (req, res, next) => {
        const uneCle = cle(req);
        if (uneCle === null || uneCle === undefined) {
            return next();
        }

        const maintenant = Date.now();
        if (maintenant - dernierNettoyage >= fenetreMs) {
            purger(maintenant);
        }

        const existant = tentatives.get(uneCle);
        if (existant) {
            garderRecentes(existant, maintenant);
            if (existant.length >= max) {
                const secondes = Math.max(1, Math.ceil((existant[0] + fenetreMs - maintenant) / 1000));
                res.set("Retry-After", String(secondes));
                return res.status(429).json({ error: MESSAGE_TROP_DE_TENTATIVES });
            }
            existant.push(maintenant);
            return next();
        }

        // Nouvelle clé : faire de la place si la table est pleine
        if (tentatives.size >= maxCles) {
            purger(maintenant);
        }
        if (tentatives.size >= maxCles) {
            tentatives.delete(tentatives.keys().next().value);
        }
        tentatives.set(uneCle, [maintenant]);
        return next();
    };

    // Nombre de clés gardées (surveillance et tests)
    limiteur.taille = () => tentatives.size;

    return limiteur;
};

/**
 * Ramène une adresse IP à sa forme sans port ni préfixe IPv4-mappé.
 * Derrière Azure App Service, X-Forwarded-For contient « adresse:port » : le port
 * change à chaque connexion et permettrait de contourner le limiteur.
 * @param {unknown} ip
 * @returns {string} l'adresse, ou "inconnue" (clé partagée) si elle est inutilisable
 */
export const normaliserIp = (ip) => {
    if (typeof ip !== "string" || ip.length === 0) {
        return "inconnue";
    }
    const crochets = ip.match(/^\[([^\]]+)\](?::\d+)?$/);
    if (crochets) {
        return crochets[1];
    }
    const sansPrefixe = ip.replace(/^::ffff:/i, "");
    const ipv4AvecPort = sansPrefixe.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    return ipv4AvecPort ? ipv4AvecPort[1] : sansPrefixe;
};

/**
 * Clé par adresse IP : req.ip, que seul Express calcule (X-Forwarded-For n'est
 * cru que si "trust proxy" est activé, voir middleware/entree.js).
 */
export const cleIp = (req) => normaliserIp(req.ip);

/**
 * Clé par courriel normalisé (espaces retirés, minuscules), lu comme le fait
 * passport-local : dans le corps, puis dans la query string. Retourne null si
 * aucun courriel utilisable n'est fourni.
 */
export const cleCourriel = (req) => {
    for (const valeur of [req.body?.email, req.query?.email]) {
        if (typeof valeur === "string" && valeur.trim().length > 0) {
            return valeur.trim().toLowerCase().slice(0, LONGUEUR_MAX_CLE);
        }
    }
    return null;
};

// Entier strictement positif, sinon la valeur par défaut : une variable mal
// écrite ne doit jamais désactiver la limitation.
const entierPositif = (valeur, defaut) => {
    if (typeof valeur !== "string" || !/^[1-9]\d*$/.test(valeur.trim())) {
        return defaut;
    }
    const nombre = Number(valeur.trim());
    return Number.isSafeInteger(nombre) ? nombre : defaut;
};

/**
 * Lit les réglages dans les variables d'environnement.
 * LIMITE_FENETRE_SECONDES (900), LIMITE_CONNEXION_IP_MAX (30),
 * LIMITE_CONNEXION_COURRIEL_MAX (10), LIMITE_INSCRIPTION_IP_MAX (10),
 * LIMITE_MAX_CLES (10000).
 * Le plafond par IP est plus haut que celui par courriel : plusieurs personnes
 * d'un même établissement peuvent partager la même adresse publique.
 * @param {Record<string, string|undefined>} [env=process.env]
 */
export const lireReglages = (env = process.env) => ({
    fenetreMs: entierPositif(env.LIMITE_FENETRE_SECONDES, 900) * 1000,
    connexionIpMax: entierPositif(env.LIMITE_CONNEXION_IP_MAX, 30),
    connexionCourrielMax: entierPositif(env.LIMITE_CONNEXION_COURRIEL_MAX, 10),
    inscriptionIpMax: entierPositif(env.LIMITE_INSCRIPTION_IP_MAX, 10),
    maxCles: entierPositif(env.LIMITE_MAX_CLES, 10000),
});

/**
 * Crée les trois limiteurs de l'entrée de l'application.
 * @param {Record<string, string|undefined>} [env=process.env]
 * @returns {{ connexionIp: Function, connexionCourriel: Function, inscriptionIp: Function }}
 */
export const creerLimiteursAuth = (env = process.env) => {
    const r = lireReglages(env);
    const commun = { fenetreMs: r.fenetreMs, maxCles: r.maxCles };
    return {
        connexionIp: creerLimiteur({ ...commun, max: r.connexionIpMax, cle: cleIp }),
        connexionCourriel: creerLimiteur({ ...commun, max: r.connexionCourrielMax, cle: cleCourriel }),
        inscriptionIp: creerLimiteur({ ...commun, max: r.inscriptionIpMax, cle: cleIp }),
    };
};
