import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import { getUserByEmail } from "./model/user.js";

// Configuration générale de la stratégie.
// On indique ici qu'on s'attends à ce que le client
// envoit un variable "email" et "password" au
// serveur pour l'authentification.
const config = {
    usernameField: "email",
    passwordField: "password",
};

// Configuration de la stratégie d'authentification locale
passport.use(
    new Strategy(config, async (email, password, done) => {
        // S'il y a une erreur avec la base de données,
        // on retourne l'erreur au serveur
        try {
            // On va chercher l'utilisateur dans la base
            // de données avec son identifiant, le
            // email ici
            const utilisateur = await getUserByEmail(email);

            // Si on ne trouve pas l'utilisateur, on
            // retourne que l'authentification a échoué
            // avec un code d'erreur
            if (!utilisateur) {
                return done(null, false, { error: "mauvais_utilisateur" });
            }

            // Si on a trouvé l'utilisateur, on compare
            // son mot de passe dans la base de données
            // avec celui envoyé au serveur. On utilise
            // une fonction de bcrypt pour le faire
            const valide = await bcrypt.compare(password, utilisateur.password);

            // Si les mot de passe ne concorde pas, on
            // retourne que l'authentification a échoué
            // avec un code d'erreur
            if (!valide) {
                return done(null, false, { error: "mauvais_mot_de_passe" });
            }

            // Si les mot de passe concorde, on retourne
            // l'information de l'utilisateur au serveur
            return done(null, utilisateur);
        } catch (error) {
            return done(error);
        }
    })
);

// Sérialisation de l'utilisateur dans la session
// Cela permet de stocker uniquement une partie de
// l'information de l'utilisateur dans la session
passport.serializeUser((utilisateur, done) => {
    // On mets uniquement l'identifiant dans la session
    done(null, utilisateur.email);
});

// Désérialisation de l'utilisateur à partir de la session
// Cela permet de récupérer l'information complète de
// l'utilisateur à partir de l'information stockée
// dans la session
passport.deserializeUser(async (email, done) => {
    // S'il y a une erreur de base de donnée, on
    // retourne l'erreur au serveur
    try {
        // Puisqu'on a juste l'identifiant dans la
        // session, on doit être capable d'aller chercher
        // l'utilisateur avec celle-ci dans la base de
        // données.
        const utilisateur = await getUserByEmail(email);
        done(null, utilisateur);
    } catch (error) {
        done(error);
    }
});
