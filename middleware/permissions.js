import { estRequeteApi } from "./auth.js";

/**
 * Rôles connus de l'application.
 * "responsable" est le planificateur hérité ; "user" est le rôle par défaut
 * des comptes créés via /inscription.
 */
export const ROLES = Object.freeze({
    ADMIN: "admin",
    RESPONSABLE: "responsable",
    ENSEIGNANT: "enseignant",
    PARENT: "parent",
    ELEVE: "eleve",
    USER: "user",
});

const MESSAGE_NON_AUTHENTIFIE = "Non authentifié. Veuillez vous connecter.";
const MESSAGE_ACCES_REFUSE = "Accès refusé. Droits insuffisants.";

/**
 * Répond 401 (JSON pour l'API) ou redirige vers /connexion (pages).
 */
const exigerConnexion = (req, res) => {
    if (estRequeteApi(req)) {
        return res.status(401).json({ error: MESSAGE_NON_AUTHENTIFIE });
    }
    return res.redirect("/connexion");
};

/**
 * Répond 403 (JSON pour l'API, texte pour les pages).
 */
const refuserAcces = (req, res) => {
    if (estRequeteApi(req)) {
        return res.status(403).json({ error: MESSAGE_ACCES_REFUSE });
    }
    return res.status(403).send(MESSAGE_ACCES_REFUSE);
};

/**
 * Fabrique un middleware qui n'autorise que les rôles listés.
 * Le rôle et l'état sont lus sur req.user (relu en base à chaque requête par
 * deserializeUser), jamais dans la session. Le compte doit être validé.
 * - Non authentifié : 401 JSON (API) ou redirection vers /connexion (page)
 * - Rôle absent de la liste ou compte non validé : 403 (JSON ou texte)
 * Sans aucun rôle en paramètre, personne n'est autorisé.
 * @param {...string} roles - Rôles autorisés (voir ROLES)
 * @returns {import("express").RequestHandler}
 */
export const aRole = (...roles) => (req, res, next) => {
    if (!req.isAuthenticated()) {
        return exigerConnexion(req, res);
    }
    if (!roles.includes(req.user?.role) || req.user?.etat !== "valide") {
        return refuserAcces(req, res);
    }
    return next();
};

/**
 * Expose aux vues Handlebars le droit de gérer les données scolaires, pour que
 * l'en-tête n'affiche le lien « Élèves » qu'à ceux qui peuvent l'ouvrir. C'est un
 * simple confort d'affichage : les routes vérifient elles-mêmes les droits.
 * Le rôle est lu sur req.user (relu à chaque requête), avec un compte validé.
 * @type {import("express").RequestHandler}
 */
export const exposerDroitsVues = (req, res, next) => {
    const role = req.user?.role;
    res.locals.peut_gerer_scolaire =
        req.user?.etat === "valide" && (role === ROLES.ADMIN || role === ROLES.RESPONSABLE);
    next();
};

// Message unique pour tous les cas de « fiche élève non accessible » (voir exigerLectureEleve).
export const MESSAGE_ELEVE_INTROUVABLE = "Élève introuvable.";

// Borne des identifiants : INT SQL Server (32 bits signé).
const ID_MAX = 2147483647;

/**
 * Convertit un paramètre de route en identifiant (entier de 1 à 2147483647).
 * Retourne null pour tout ce qui n'est pas une suite de chiffres ASCII.
 * @param {unknown} valeur
 * @returns {number|null}
 */
const analyserIdentifiant = (valeur) => {
    if (typeof valeur !== "string" || !/^\d+$/.test(valeur)) {
        return null;
    }
    const id = Number(valeur);
    return id >= 1 && id <= ID_MAX ? id : null;
};

/**
 * Répond 404 (JSON pour l'API, texte pour les pages). Une seule fonction sert
 * tous les cas : la réponse est ainsi identique octet pour octet.
 */
const repondreEleveIntrouvable = (req, res) => {
    if (estRequeteApi(req)) {
        return res.status(404).json({ error: MESSAGE_ELEVE_INTROUVABLE });
    }
    return res.status(404).send(MESSAGE_ELEVE_INTROUVABLE);
};

/**
 * Fabrique un middleware qui n'autorise la suite que si l'utilisateur peut lire
 * la fiche de l'élève désigné par le paramètre de route (voir peutLireEleve).
 * - Non authentifié : 401 JSON (API) ou redirection vers /connexion (page)
 * - Compte non validé : 403 (comme aRole)
 * - Identifiant invalide, élève inexistant OU non lisible : 404 avec un corps
 *   strictement identique. Un parent ne doit pas pouvoir deviner l'existence
 *   d'un enfant d'une autre famille : jamais de 403 sur une fiche précise.
 * - Erreur inattendue (base indisponible) : next(erreur), aucun accès accordé
 * L'import de model/acces.js est différé : le charger ici construirait le client
 * Prisma dès l'import de ce module, qui sert aussi à la garde des routes héritées.
 * @param {string} [param="id"] - Nom du paramètre de route contenant l'identifiant
 * @returns {import("express").RequestHandler}
 */
export const exigerLectureEleve = (param = "id") => async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return exigerConnexion(req, res);
    }
    if (req.user?.etat !== "valide") {
        return refuserAcces(req, res);
    }

    const id = analyserIdentifiant(req.params?.[param]);
    if (id === null) {
        return repondreEleveIntrouvable(req, res);
    }

    let lisible;
    try {
        const { peutLireEleve } = await import("../model/acces.js");
        lisible = await peutLireEleve(req.user, id);
    } catch (erreur) {
        return next(erreur);
    }

    if (lisible !== true) {
        return repondreEleveIntrouvable(req, res);
    }
    return next();
};

// Rôles pour lesquels les routes héritées restent inchangées.
const ROLES_HERITES = new Set([ROLES.ADMIN, ROLES.RESPONSABLE, ROLES.USER]);

// Chemins exacts (sans query string) accessibles aux rôles parent et élève.
const CHEMINS_PARENT_ELEVE = new Set([
    "/",
    "/connexion",
    "/deconnexion",
    "/inscription",
    "/contact",
    "/api/statistiques",
]);

// Préfixe de la future API scolaire, ouverte aux nouveaux rôles.
const PREFIXE_SCOLAIRE = "/api/scolaire";

// Méthodes de lecture, seules permises à l'enseignant sur l'héritage.
const METHODES_LECTURE = new Set(["GET", "HEAD"]);

/**
 * Chemin de la requête sans query string ni ancre, en minuscules : Express
 * route sans distinction de casse (/API/scolaire atteint /api/scolaire), la
 * garde doit donc comparer de la même façon. On lit req.originalUrl
 * (req.path est relatif au point de montage d'un routeur).
 */
const cheminDeRequete = (req) => {
    const url = req.originalUrl || req.path || "";
    return String(url).split(/[?#]/, 1)[0].toLowerCase();
};

/**
 * Vrai pour /api/scolaire et tout ce qui est en dessous (préfixe borné :
 * /api/scolaires ou /api/scolaire-x ne correspondent pas).
 */
const estCheminScolaire = (chemin) =>
    chemin === PREFIXE_SCOLAIRE || chemin.startsWith(`${PREFIXE_SCOLAIRE}/`);

/**
 * Indique si un rôle non hérité peut atteindre l'héritage avec cette requête.
 * Tout rôle inconnu est refusé.
 */
const heritageAutorise = (role, methode, chemin) => {
    switch (role) {
        case ROLES.PARENT:
        case ROLES.ELEVE:
            return CHEMINS_PARENT_ELEVE.has(chemin) || estCheminScolaire(chemin);
        case ROLES.ENSEIGNANT:
            return (
                METHODES_LECTURE.has(methode) ||
                estCheminScolaire(chemin) ||
                (methode === "POST" && chemin === "/deconnexion")
            );
        default:
            return false;
    }
};

/**
 * Garde montée dans server.js juste avant le routeur historique.
 * Les routes héritées n'exigent que estAuthentifie : sans cette garde, un
 * compte enseignant, parent ou élève pourrait les appeler.
 * - Non authentifié : next() (l'héritage gère le 401 / la redirection)
 * - admin, responsable, user : next() (inchangé)
 * - parent, eleve : chemins listés et /api/scolaire, sinon 403
 * - enseignant : GET/HEAD, POST /deconnexion et /api/scolaire, sinon 403
 * - Rôle inconnu : 403
 * @type {import("express").RequestHandler}
 */
export const gardeRoutesHeritees = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }

    const role = req.user?.role;
    if (ROLES_HERITES.has(role)) {
        return next();
    }

    if (heritageAutorise(role, req.method, cheminDeRequete(req))) {
        return next();
    }
    return refuserAcces(req, res);
};
