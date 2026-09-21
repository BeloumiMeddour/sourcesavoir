import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import { getUserByEmail, getUserById } from "./model/user.js";

// Configuration générale de la stratégie.
// On indique ici qu'on s'attends à ce que le client
// envoit un variable "email" et "password" au
// serveur pour l'authentification.
const config = {
    usernameField: "email",
    passwordField: "password",
};

// Code unique renvoyé pour tout échec d'identification (compte inconnu,
// mauvais mot de passe, entrée mal formée) : le client ne peut pas savoir
// si un courriel correspond à un compte.
export const CODE_IDENTIFIANTS_INVALIDES = "identifiants_invalides";

// Mêmes bornes que l'inscription : au-delà, on ne touche ni à la base ni à bcrypt.
const LONGUEUR_MAX_COURRIEL = 150;
const LONGUEUR_MAX_MOT_DE_PASSE = 128;

// Borne des identifiants : INT SQL Server (32 bits signé).
const ID_MAX = 2147483647;

// Hash bcrypt (coût 10, comme createUser) d'un mot de passe aléatoire jeté.
// Quand le compte n'existe pas, on compare quand même contre ce hash pour que
// la durée de la réponse ne trahisse pas l'existence du compte.
const HASH_FACTICE = "$2b$10$7yQchg.ELjIsqcHv7fgayum9YmI6fY/MJbGbLB3ywGuKtZ2pgPTea";

// Retourne une copie de l'utilisateur sans le hash du mot de passe.
// Ce qui sort de ce module (req.user, réponse de POST /connexion)
// ne doit jamais contenir le hash bcrypt.
const sansMotDePasse = (utilisateur) => {
    const { password, ...utilisateurPublic } = utilisateur;
    return utilisateurPublic;
};

// Échec d'identification avec le code unique.
const refuser = (done) => done(null, false, { error: CODE_IDENTIFIANTS_INVALIDES });

// Configuration de la stratégie d'authentification locale
passport.use(
    new Strategy(config, async (email, password, done) => {
        // S'il y a une erreur avec la base de données,
        // on retourne l'erreur au serveur
        try {
            // Le corps JSON peut contenir n'importe quoi (objet, tableau,
            // nombre) : on n'accepte que des chaînes de longueur raisonnable,
            // avant toute requête.
            if (typeof email !== "string" || typeof password !== "string") {
                return refuser(done);
            }
            const courriel = email.trim();
            if (
                courriel.length === 0 ||
                courriel.length > LONGUEUR_MAX_COURRIEL ||
                password.length > LONGUEUR_MAX_MOT_DE_PASSE
            ) {
                return refuser(done);
            }

            // On va chercher l'utilisateur dans la base
            // de données avec son identifiant, le
            // email ici
            const utilisateur = await getUserByEmail(courriel);

            // On compare toujours le mot de passe envoyé à un hash bcrypt :
            // celui du compte s'il existe, sinon le hash factice.
            const valide = await bcrypt.compare(
                password,
                utilisateur ? utilisateur.password : HASH_FACTICE
            );

            // Compte inconnu ou mot de passe qui ne concorde pas :
            // même réponse dans les deux cas
            if (!utilisateur || !valide) {
                return refuser(done);
            }

            // Vérifier si le compte est validé par un admin
            // (indiqué seulement après un mot de passe correct)
            if (utilisateur.etat === "en_attente") {
                return done(null, false, { error: "compte_en_attente" });
            }

            // Tout autre état que "valide" n'ouvre pas de session
            if (utilisateur.etat !== "valide") {
                return refuser(done);
            }

            // Si les mot de passe concorde, on retourne
            // l'information de l'utilisateur au serveur,
            // sans le hash du mot de passe
            return done(null, sansMotDePasse(utilisateur));
        } catch (error) {
            return done(error);
        }
    })
);

// Sérialisation de l'utilisateur dans la session
// Cela permet de stocker uniquement une partie de
// l'information de l'utilisateur dans la session
passport.serializeUser((utilisateur, done) => {
    // On mets uniquement l'identifiant numérique dans la session : un compte
    // supprimé puis recréé avec le même courriel reçoit un nouvel identifiant
    // et n'hérite donc pas de l'ancienne session.
    done(null, utilisateur.id);
});

// Désérialisation de l'utilisateur à partir de la session
// Cela permet de récupérer l'information complète de
// l'utilisateur à partir de l'information stockée
// dans la session
passport.deserializeUser(async (id, done) => {
    // S'il y a une erreur de base de donnée, on
    // retourne l'erreur au serveur
    try {
        // Une session qui ne contient pas un identifiant entier valide (par
        // exemple une ancienne session qui stockait le courriel) est invalidée
        // sans requête.
        if (!Number.isInteger(id) || id < 1 || id > ID_MAX) {
            return done(null, false);
        }

        // Puisqu'on a juste l'identifiant dans la
        // session, on doit être capable d'aller chercher
        // l'utilisateur avec celle-ci dans la base de
        // données (sans le hash du mot de passe).
        const utilisateur = await getUserById(id);

        // Utilisateur supprimé ou compte qui n'est plus validé depuis
        // l'ouverture de la session : Passport invalide la session.
        if (!utilisateur || utilisateur.etat !== "valide") {
            return done(null, false);
        }

        // Copie sans le hash, par précaution
        done(null, sansMotDePasse(utilisateur));
    } catch (error) {
        done(error);
    }
});
