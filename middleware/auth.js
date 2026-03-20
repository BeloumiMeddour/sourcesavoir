/**
 * Middleware : vérifie que l'utilisateur est connecté.
 * - Pour les routes API : retourne 401 en JSON
 * - Pour les pages : redirige vers /connexion
 */
const estAuthentifie = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    if (req.path.startsWith("/api/")) {
        return res.status(401).json({ error: "Non authentifié. Veuillez vous connecter." });
    }
    return res.redirect("/connexion");
};

/**
 * Middleware : vérifie que l'utilisateur est admin.
 * - Pour les routes API : retourne 403 en JSON
 * - Pour les pages : retourne 403
 */
const estAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.session.user_role === "admin") {
        return next();
    }
    if (!req.isAuthenticated()) {
        if (req.path.startsWith("/api/")) {
            return res.status(401).json({ error: "Non authentifié. Veuillez vous connecter." });
        }
        return res.redirect("/connexion");
    }
    if (req.path.startsWith("/api/")) {
        return res.status(403).json({ error: "Accès refusé. Droits administrateur requis." });
    }
    return res.status(403).send("Accès refusé. Droits administrateur requis.");
};

/**
 * Middleware : vérifie que l'utilisateur est admin ou responsable.
 * - Pour les routes API : retourne 403 en JSON
 * - Pour les pages : retourne 403
 */
const estResponsableOuAdmin = (req, res, next) => {
    const role = req.session.user_role;
    if (req.isAuthenticated() && (role === "admin" || role === "responsable")) {
        return next();
    }
    if (!req.isAuthenticated()) {
        if (req.path.startsWith("/api/")) {
            return res.status(401).json({ error: "Non authentifié. Veuillez vous connecter." });
        }
        return res.redirect("/connexion");
    }
    if (req.path.startsWith("/api/")) {
        return res.status(403).json({ error: "Accès refusé. Droits insuffisants." });
    }
    return res.status(403).send("Accès refusé. Droits insuffisants.");
};

export { estAuthentifie, estAdmin, estResponsableOuAdmin };
