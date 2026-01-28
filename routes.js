import { Router } from "express";
import { createUser } from "./model/user.js";
import {
  createCours,
  getAllCours,
  getCoursById,
  updateCours,
  deleteCours,
} from "./model/cours.js";

const router = Router();

// Importation du passport
import passport from "passport";

/* ===========================
   AUTHENTIFICATION
=========================== */

// Route pour l'inscription d'un nouvel utilisateur
router.post("/inscription", async (request, response, next) => {
    try {
        await createUser(request.body.email, request.body.password);
        response.sendStatus(201);
    } catch (error) {
        if (error.code === "P2002") {
            response.sendStatus(409);
        } else {
            next(error);
        }
    }
});

// Route pour connexion utilisateur
router.post("/connexion", (req, res, next) => {
    passport.authenticate("local", (err, utilisateur, info) => {
        if (err) return next(err);
        if (!utilisateur) return res.status(401).json(info);

        req.login(utilisateur, (err) => {
            if (err) return next(err);

            // Ajouter email et rôle à la session
            req.session.user_email = utilisateur.email;
            req.session.user_role = utilisateur.role;

            return res.json({
                msg: "Connexion réussie",
                utilisateur,
            });
        });
    })(req, res, next);
});

// Route pour déconnexion utilisateur
router.post("/deconnexion", (request, response, next) => {
    request.logOut((erreur) => {
        if (erreur) {
            next(erreur);
        } else {
            response.status(200).end();
        }
    });
});

/* ===========================
   PAGES AUTH
=========================== */

// Page d'inscription
router.get("/inscription", (request, response) => {
    response.render("auth", {
        title: "Inscription | Planify",
        styles: ["./css/style.css", "/css/auth.css"],
        scripts: ["/js/inscription.js"],
        type: "Inscription",
        user_email: request.session.user_email || null,
        is_admin: request.session.user_role === "admin",
    });
});

// Page de connexion
router.get("/connexion", (request, response) => {
    response.render("auth", {
        title: "Connexion | Planify",
        styles: ["./css/style.css", "/css/auth.css"],
        scripts: ["/js/connexion.js"],
        type: "Connexion",
        user_email: request.session.user_email || null,
        is_admin: request.session.user_role === "admin",
    });
});

/* ===========================
   PAGES GÉNÉRALES
=========================== */

// Page d'accueil
router.get("/", (req, res) => {
    res.render("accueil", {
        titre: "Planify – Gestion des horaires",
        styles: ["./css/style.css", "./css/home.css"],
        scripts: ["./js/script.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Page de contact
router.get("/contact", (req, res) => {
    res.render("contact", {
        titre: "Contact | Planify",
        styles: ["./css/style.css", "./css/contact.css"],
        scripts: ["./js/contact.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

/* ===========================
   API - COURS
=========================== */

// Créer un cours
router.post("/api/cours", async (req, res, next) => {
  try {
    const cours = await createCours(req.body);
    res.status(201).json(cours);
  } catch (error) {
    next(error);
  }
});

// Lister tous les cours
router.get("/api/cours", async (req, res, next) => {
  try {
    const cours = await getAllCours();
    res.json(cours);
  } catch (error) {
    next(error);
  }
});

// Obtenir un cours par ID
router.get("/api/cours/:id", async (req, res, next) => {
  try {
    const cours = await getCoursById(Number(req.params.id));
    res.json(cours);
  } catch (error) {
    next(error);
  }
});

// Modifier un cours
router.put("/api/cours/:id", async (req, res, next) => {
  try {
    const cours = await updateCours(Number(req.params.id), req.body);
    res.json(cours);
  } catch (error) {
    next(error);
  }
});

// Supprimer un cours
router.delete("/api/cours/:id", async (req, res, next) => {
  try {
    await deleteCours(Number(req.params.id));
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});


export default router;
