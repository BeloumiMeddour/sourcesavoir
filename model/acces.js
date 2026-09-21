// Règles de visibilité des élèves.
// UN SEUL générateur de filtre (filtreElevesVisibles) sert la liste ET le détail :
// deux règles distinctes divergent tôt ou tard et ouvrent une faille IDOR.
import { prisma } from "./prisma.js";
import { ErreurValidation, ErreurConflit } from "./validation.js";

// Valeurs de ROLES (middleware/permissions.js). Ce module ne l'importe pas :
// permissions.js dépend de lui (exigerLectureEleve), l'inverse ferait une boucle.
// Un test (acces.test.js) vérifie l'alignement avec ROLES.
const ROLE_ADMIN = "admin";
const ROLE_RESPONSABLE = "responsable";
const ROLE_ENSEIGNANT = "enseignant";
const ROLE_PARENT = "parent";
const ROLE_ELEVE = "eleve";

// Borne des identifiants : INT SQL Server (32 bits signé).
const ID_MAX = 2147483647;

/**
 * Vrai si la valeur est un identifiant utilisable dans un filtre Prisma.
 * undefined disparaîtrait du where (aucune condition) et null cibleraient les
 * lignes sans compte : ni l'un ni l'autre ne doit passer.
 * @param {unknown} valeur
 * @returns {boolean}
 */
const estIdentifiant = (valeur) => Number.isInteger(valeur) && valeur > 0 && valeur <= ID_MAX;

/**
 * Retourne le where Prisma (sur Eleve) des élèves visibles par l'utilisateur.
 * - parent : élèves liés (lien actif, lecture permise) à un tuteur rattaché à son compte
 * - eleve : sa propre fiche
 * - enseignant : élèves inscrits (active) dans un groupe de l'année en cours où il a une affectation
 * - admin, responsable : tous les élèves ({})
 * - tout autre rôle (dont "user"), utilisateur absent ou sans identifiant valide : null (aucun accès)
 * @param {{ id: number, role: string }} user - req.user (rôle relu en base à chaque requête)
 * @param {{ maintenant?: Date }} [options] - Date de référence de l'année en cours (enseignant)
 * @returns {object|null} where Prisma, ou null si aucun accès
 */
export const filtreElevesVisibles = (user, { maintenant = new Date() } = {}) => {
    const role = user?.role;

    if (role === ROLE_ADMIN || role === ROLE_RESPONSABLE) {
        return {};
    }

    if (role !== ROLE_PARENT && role !== ROLE_ELEVE && role !== ROLE_ENSEIGNANT) {
        return null;
    }
    if (!estIdentifiant(user.id)) {
        return null;
    }

    if (role === ROLE_PARENT) {
        return { liens: { some: { actif: true, peutLire: true, tuteur: { id_user: user.id } } } };
    }

    if (role === ROLE_ELEVE) {
        return { id_user: user.id };
    }

    // Les bornes sont des colonnes SQL DATE : comparer les jours UTC, sinon
    // l'accès serait coupé dès minuit du dernier jour de l'année scolaire.
    const jourCourant = new Date(maintenant);
    jourCourant.setUTCHours(0, 0, 0, 0);
    return {
        inscriptions: {
            some: {
                statut: "active",
                groupe: {
                    annee: { dateDebut: { lte: jourCourant }, dateFin: { gte: jourCourant } },
                    affectations: { some: { professeur: { id_user: user.id } } },
                },
            },
        },
    };
};

/**
 * Retourne le where Prisma (sur Inscription) des inscriptions visibles par l'utilisateur.
 * Dérivé de filtreElevesVisibles (même instant de référence, même règle) :
 * - toujours : l'élève doit être visible ({ eleve: filtre })
 * - enseignant : seulement les inscriptions qui lui donnent la visibilité (statut active,
 *   groupe de l'année en cours qui lui est affecté), pas l'historique des autres
 *   années ni des autres groupes de l'élève
 * - aucun accès : null
 * @param {{ id: number, role: string }} user
 * @param {{ maintenant?: Date }} [options]
 * @returns {object|null}
 */
export const filtreInscriptionsVisibles = (user, options) => {
    const filtreEleve = filtreElevesVisibles(user, options);
    if (filtreEleve === null) {
        return null;
    }
    if (user.role === ROLE_ENSEIGNANT) {
        return { eleve: filtreEleve, ...filtreEleve.inscriptions.some };
    }
    return { eleve: filtreEleve };
};

/**
 * Vérifie qu'un compte peut être rattaché à un profil (Eleve ou Tuteur) :
 * il existe, a le rôle attendu et n'est pas déjà rattaché à un autre profil de
 * la même table. id_user null (profil sans compte) : rien à vérifier.
 * @param {number|null} idUser
 * @param {string} role - Rôle exigé du compte (eleve pour Eleve, parent pour Tuteur)
 * @param {{ findFirst: Function }} modeleProfil - Modèle Prisma portant id_user (prisma.eleve ou prisma.tuteur)
 * @param {string} libelleProfil - Libellé pour le message (« un élève », « un tuteur »)
 * @returns {Promise<void>}
 * @throws {ErreurValidation} compte inexistant ou de mauvais rôle
 * @throws {ErreurConflit} compte déjà rattaché
 */
export const verifierCompteRattachable = async (idUser, role, modeleProfil, libelleProfil) => {
    if (idUser === null) {
        return;
    }
    const compte = await prisma.user.findUnique({ where: { id: idUser }, select: { id: true, role: true } });
    if (!compte || compte.role !== role) {
        throw new ErreurValidation(`Le champ « id_user » doit désigner un compte existant de rôle ${role}.`);
    }
    const existant = await modeleProfil.findFirst({ where: { id_user: idUser }, select: { id: true } });
    if (existant) {
        throw new ErreurConflit(`Ce compte est déjà rattaché à ${libelleProfil}.`);
    }
};

/**
 * Indique si l'utilisateur peut lire la fiche de l'élève.
 * Même filtre que la liste, combiné à l'identifiant demandé. Faux aussi quand
 * l'élève n'existe pas : les deux cas sont indiscernables pour l'appelant.
 * @param {{ id: number, role: string }} user
 * @param {number} idEleve
 * @returns {Promise<boolean>}
 */
export const peutLireEleve = async (user, idEleve) => {
    const filtre = filtreElevesVisibles(user);
    if (filtre === null || !estIdentifiant(idEleve)) {
        return false;
    }
    const nombre = await prisma.eleve.count({ where: { AND: [{ id: idEleve }, filtre] } });
    return nombre > 0;
};

/**
 * Indique si l'utilisateur peut agir (et pas seulement lire) pour l'élève.
 * - admin, responsable : oui
 * - parent : s'il existe un lien actif avec peutLire ET peutAgir vers un tuteur rattaché à son
 *   compte (agir sans pouvoir lire n'a pas de sens : le lien créé ou modifié l'interdit déjà,
 *   cette condition protège aussi les données déjà présentes)
 * - tout autre cas : non
 * @param {{ id: number, role: string }} user
 * @param {number} idEleve
 * @returns {Promise<boolean>}
 */
export const peutAgirPourEleve = async (user, idEleve) => {
    const role = user?.role;

    if (role === ROLE_ADMIN || role === ROLE_RESPONSABLE) {
        return true;
    }
    if (role !== ROLE_PARENT || !estIdentifiant(user.id) || !estIdentifiant(idEleve)) {
        return false;
    }

    const nombre = await prisma.lienEleveTuteur.count({
        where: { id_eleve: idEleve, actif: true, peutLire: true, peutAgir: true, tuteur: { id_user: user.id } },
    });
    return nombre > 0;
};
