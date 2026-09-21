// Chargement des variables d'environnement depuis le fichier .env
import "dotenv/config";

// Importation des modules nécessaires
import express, { json } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import routeExterne from "./routes.js";
import routeurScolaire, { gererErreurScolaire } from "./routes/scolaire.js";
import { gardeRoutesHeritees } from "./middleware/permissions.js";
import cspOptions from "./csp-options.js";
import { engine } from "express-handlebars";

//import pour la gestion des sessions et cookies
import session from "express-session";
import memorystore from "memorystore";

// Import pour l'authentification
import passport from "passport";

//import des strategies d'authentification
import "./auth.js";

// Création du serveur
const app = express();

// Configuration d'engin de rendu
app.engine("handlebars", engine()); // Définition du moteur de template Handlebars
app.set("view engine", "handlebars"); // Définition de l'extension par défaut des fichiers de vue
app.set("views", "./views"); // Définition du dossier des vues

// Configuration de la memoire pour les sessions
const MemoryStore = memorystore(session);

// Ajout de middlewares
app.use(helmet(cspOptions));
app.use(compression());
app.use(cors());
app.use(json());
app.use(express.urlencoded({ extended: true }));

//Middleware de gestion des sessions
app.use(
    session({
        cookie: { maxAge: 3600000 }, // 1 heure en millisecondes pour la durée de vie du cookie
        name: process.env.npm_package_name,
        store: new MemoryStore({ checkPeriod: 3600000 }),
        resave: false,
        saveUninitialized: false,
        rolling: true,
        secret: process.env.SESSION_SECRET,
    })
);

// Initialisation de passport pour l'authentification
app.use(passport.initialize());
app.use(passport.session());

// Définition du dossier des fichiers statiques
app.use(express.static("public"));

// Servir les librairies PDF depuis node_modules
app.use("/node_modules/html2canvas", express.static("node_modules/html2canvas"));
app.use("/node_modules/jspdf", express.static("node_modules/jspdf"));

// Garde des routes héritées : empêche les rôles enseignant, parent et élève
// d'atteindre les routes qui n'exigent que l'authentification
app.use(gardeRoutesHeritees);
app.use("/api/scolaire", routeurScolaire, gererErreurScolaire);

app.use(routeExterne);

// Renvoyer une erreur 404 pour les routes non définies
app.use((request, response) => {
    // Renvoyer simplement une chaîne de caractère indiquant que la page n'existe pas
    response.status(404).send(`${request.originalUrl} Route introuvable.`);
});

// Démarrage du serveur
app.listen(process.env.PORT);
console.log(`Le serveur démarré sur le port ${process.env.PORT}`);
console.log(`http://localhost:${process.env.PORT}`);
