/**
 * Indique si la requête vise l'API (réponses JSON) plutôt qu'une page.
 * On lit req.originalUrl et non req.path : dans un routeur monté sur un
 * préfixe (ex. /api/scolaire), req.path est relatif à ce point de montage.
 * La comparaison ignore la casse : Express route /API/cours comme /api/cours.
 * @param {import("express").Request} req
 * @returns {boolean}
 */
const estRequeteApi = (req) => {
    const url = req.originalUrl || req.path || "";
    return url.toLowerCase().startsWith("/api/");
};

/**
 * Middleware : vérifie que l'utilisateur est connecté.
 * - Pour les routes API : retourne 401 en JSON
 * - Pour les pages : redirige vers /connexion
 */
const estAuthentifie = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    if (estRequeteApi(req)) {
        return res.status(401).json({ error: "Non authentifié. Veuillez vous connecter." });
    }
    return res.redirect("/connexion");
};

/**
 * Middleware : vérifie que l'utilisateur est admin.
 * Le rôle est lu sur req.user (relu en base à chaque requête par
 * deserializeUser), et non dans la session, figée à la connexion.
 * - Pour les routes API : retourne 403 en JSON
 * - Pour les pages : retourne 403
 */
const estAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user?.role === "admin") {
        return next();
    }
    if (!req.isAuthenticated()) {
        if (estRequeteApi(req)) {
            return res.status(401).json({ error: "Non authentifié. Veuillez vous connecter." });
        }
        return res.redirect("/connexion");
    }
    if (estRequeteApi(req)) {
        return res.status(403).json({ error: "Accès refusé. Droits administrateur requis." });
    }
    return res.status(403).send("Accès refusé. Droits administrateur requis.");
};

/**
 * Middleware : vérifie que l'utilisateur est admin ou responsable.
 * Le rôle est lu sur req.user (voir estAdmin).
 * - Pour les routes API : retourne 403 en JSON
 * - Pour les pages : retourne 403
 */
const estResponsableOuAdmin = (req, res, next) => {
    const role = req.user?.role;
    if (req.isAuthenticated() && (role === "admin" || role === "responsable")) {
        return next();
    }
    if (!req.isAuthenticated()) {
        if (estRequeteApi(req)) {
            return res.status(401).json({ error: "Non authentifié. Veuillez vous connecter." });
        }
        return res.redirect("/connexion");
    }
    if (estRequeteApi(req)) {
        return res.status(403).json({ error: "Accès refusé. Droits insuffisants." });
    }
    return res.status(403).send("Accès refusé. Droits insuffisants.");
};

export { estAuthentifie, estAdmin, estResponsableOuAdmin, estRequeteApi };
