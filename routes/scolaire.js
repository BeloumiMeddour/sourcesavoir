// API du socle scolaire : droits vérifiés côté serveur, historique conservé.
import { Router } from "express";
import { ROLES, aRole, exigerLectureEleve, MESSAGE_ELEVE_INTROUVABLE } from "../middleware/permissions.js";
import { ErreurValidation, ErreurIntrouvable, ErreurConflit, ID_MAX } from "../model/validation.js";
import { listerAnnees, creerAnnee } from "../model/anneeScolaire.js";
import { listerNiveaux, creerNiveau } from "../model/niveau.js";
import { listerGroupes, creerGroupe } from "../model/groupe.js";
import { listerEleves, obtenirEleve, creerEleve } from "../model/eleve.js";
import { creerTuteur } from "../model/tuteur.js";
import { creerLien, modifierLien } from "../model/lienEleveTuteur.js";
import { listerInscriptions, creerInscription, promouvoirEleve } from "../model/inscription.js";

const routeur = Router();
const gestion = aRole(ROLES.ADMIN, ROLES.RESPONSABLE);
const lectureReferentiel = aRole(ROLES.ADMIN, ROLES.RESPONSABLE, ROLES.ENSEIGNANT);

// Le rôle historique user ne donne aucun droit sur les données scolaires.
routeur.use(aRole(ROLES.ADMIN, ROLES.RESPONSABLE, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.ELEVE));

/** Identifiant de chemin : chiffres décimaux de 1 à ID_MAX, sinon le 404 du message donné. */
const idDepuisChemin = (valeur, message) => {
    if (!/^\d+$/.test(valeur) || Number(valeur) < 1 || Number(valeur) > ID_MAX) {
        throw new ErreurIntrouvable(message);
    }
    return Number(valeur);
};

/** Un identifiant incorrect produit le même 404 qu'une fiche inaccessible. */
const idEleve = (req) => idDepuisChemin(req.params.id, MESSAGE_ELEVE_INTROUVABLE);

routeur.get("/eleves", async (req, res) => {
    res.json(await listerEleves(req.user));
});
routeur.get("/eleves/:id", exigerLectureEleve(), async (req, res) => {
    // Le modèle réapplique le filtre lors de la lecture : une révocation du lien
    // depuis le passage de la garde ne doit pas ouvrir l'accès à la fiche.
    res.json(await obtenirEleve(req.user, idEleve(req)));
});
routeur.get("/eleves/:id/inscriptions", exigerLectureEleve(), async (req, res) => {
    res.json(await listerInscriptions(req.user, idEleve(req)));
});
routeur.post("/eleves", gestion, async (req, res) => {
    res.status(201).json(await creerEleve(req.body));
});
routeur.post("/tuteurs", gestion, async (req, res) => {
    res.status(201).json(await creerTuteur(req.body));
});
routeur.post("/eleves/:id/liens", gestion, async (req, res) => {
    res.status(201).json(await creerLien(idEleve(req), req.body));
});
// Révocation ou modification des droits d'un lien : le lien reste en base (historique).
routeur.patch("/eleves/:id/liens/:idLien", gestion, async (req, res) => {
    const eleve = idEleve(req);
    const lien = idDepuisChemin(req.params.idLien, "Lien introuvable.");
    res.json(await modifierLien(eleve, lien, req.body));
});
routeur.post("/inscriptions", gestion, async (req, res) => {
    res.status(201).json(await creerInscription(req.body));
});
routeur.post("/eleves/:id/promotion", gestion, async (req, res) => {
    res.status(201).json(await promouvoirEleve(idEleve(req), req.body));
});

routeur.get("/annees", lectureReferentiel, async (_req, res) => res.json(await listerAnnees()));
routeur.get("/niveaux", lectureReferentiel, async (_req, res) => res.json(await listerNiveaux()));
routeur.get("/groupes", lectureReferentiel, async (_req, res) => res.json(await listerGroupes()));
routeur.post("/annees", gestion, async (req, res) => res.status(201).json(await creerAnnee(req.body)));
routeur.post("/niveaux", gestion, async (req, res) => res.status(201).json(await creerNiveau(req.body)));
routeur.post("/groupes", gestion, async (req, res) => res.status(201).json(await creerGroupe(req.body)));

routeur.use((_req, res) => res.status(404).json({ error: "Route scolaire introuvable." }));

const MESSAGE_CORPS_INVALIDE = "La requête est invalide.";
const MESSAGES_CORPS = {
    413: "Le corps de la requête est trop volumineux.",
    415: "Le format du corps de la requête n'est pas pris en charge.",
};

// Les erreurs internes ne traversent jamais la frontière HTTP. Les messages de
// validation sont écrits par nos validateurs, sans recopier les valeurs reçues.
export const gererErreurScolaire = (erreur, _req, res, _next) => {
    if (erreur instanceof ErreurValidation) {
        return res.status(400).json({ error: erreur.message });
    }
    if (erreur instanceof ErreurIntrouvable) {
        return res.status(404).json({ error: erreur.message });
    }
    if (erreur instanceof ErreurConflit) {
        return res.status(409).json({ error: erreur.message });
    }
    if (erreur.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Le corps de la requête doit être un JSON valide." });
    }
    // Autres erreurs 4xx de lecture du corps (body-parser : entity.too.large, encoding.unsupported,
    // charset.unsupported...) : le statut est conservé, le message est générique car celui de
    // l'erreur peut recopier des valeurs de la requête.
    if (typeof erreur.type === "string" && Number.isInteger(erreur.status) && erreur.status >= 400 && erreur.status < 500) {
        return res.status(erreur.status).json({ error: MESSAGES_CORPS[erreur.status] || MESSAGE_CORPS_INVALIDE });
    }
    if (erreur.code === "P2002") {
        return res.status(409).json({ error: "Cet enregistrement existe déjà." });
    }
    if (erreur.code === "P2003") {
        return res.status(409).json({ error: "Référence invalide ou enregistrement utilisé." });
    }
    if (erreur.code === "P2025") {
        return res.status(404).json({ error: "Enregistrement introuvable." });
    }
    if (erreur.code === "P2034") {
        return res.status(409).json({ error: "Une modification simultanée a eu lieu. Veuillez réessayer." });
    }
    // Ne pas journaliser l'objet Prisma : il peut contenir les données reçues
    // ou des informations de connexion. Le code permet de diagnostiquer l'échec.
    const code = typeof erreur.code === "string" && /^P\d{4}$/.test(erreur.code) ? erreur.code : "inconnu";
    console.error("Échec de l'API scolaire (code : %s).", code);
    return res.status(500).json({ error: "Erreur interne du serveur." });
};

routeur.use(gererErreurScolaire);

export default routeur;
