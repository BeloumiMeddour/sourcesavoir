// Protections de l'entrée de l'application, branchées par server.js :
// confiance envers le mandataire, protection CSRF, limitation des tentatives
// de connexion et d'inscription. Regroupées ici pour être testables sans
// démarrer le serveur.
import { gardeCsrf, lireHotesAutorises } from "./securite.js";
import { creerLimiteursAuth } from "./limiteur.js";

// Nombre maximal de sauts de mandataires acceptés : au-delà, la variable est
// certainement une erreur de frappe.
const SAUTS_MAX = 10;

/**
 * Nombre de mandataires (proxys) inversés à croire pour lire l'adresse IP du client.
 * Sans ce réglage, derrière Azure App Service, req.ip serait celle du mandataire :
 * tous les visiteurs partageraient la même clé de limitation.
 * - TRUST_PROXY : entier de 0 à 10 (0 désactive), prioritaire s'il est valide ;
 * - sinon 1 saut sur Azure App Service (WEBSITE_SITE_NAME est défini), 0 ailleurs.
 * Seul un nombre est accepté : « true » ferait croire n'importe quel
 * X-Forwarded-For et permettrait de falsifier l'adresse.
 * @param {Record<string, string|undefined>} [env=process.env]
 * @returns {number}
 */
export const lireSautsMandataire = (env = process.env) => {
    const brut = typeof env.TRUST_PROXY === "string" ? env.TRUST_PROXY.trim() : "";
    if (/^\d{1,2}$/.test(brut) && Number(brut) <= SAUTS_MAX) {
        return Number(brut);
    }
    return env.WEBSITE_SITE_NAME ? 1 : 0;
};

/**
 * Branche les protections sur l'application, après les analyseurs de corps
 * (le limiteur par courriel lit req.body) et avant les routes.
 * La garde CSRF passe avant les limiteurs : une requête venue d'un autre site
 * ne doit pas consommer les tentatives permises à un courriel.
 * @param {import("express").Express} app
 * @param {Record<string, string|undefined>} [env=process.env]
 */
export const brancherProtectionsEntree = (app, env = process.env) => {
    const sauts = lireSautsMandataire(env);
    app.set("trust proxy", sauts > 0 ? sauts : false);

    app.use(gardeCsrf({ hotesAutorises: lireHotesAutorises(env) }));

    const limiteurs = creerLimiteursAuth(env);
    app.post("/connexion", limiteurs.connexionIp, limiteurs.connexionCourriel);
    app.post("/inscription", limiteurs.inscriptionIp);
};
