import { Router } from "express";
import { addTodo, deleteTodo, getTodos, updateTodo } from "./model/todo.js";
import { createUser } from "./model/user.js";
import { validerDescription } from "./middlewares/validation.js";

const router = Router();
// Importation du passport
import passport from "passport";

// Définition des routes

//Defintion des routes d'authentification (inscription, connexion, deconnexion)

// Route pour l'inscription d'un nouvel utilisateur
router.post("/inscription", async (request, response, next) => {
    try {
        // Si la validation passe, on crée l'utilisateur
        await createUser(request.body.email, request.body.password);
        response.sendStatus(201, "Utilisateur créé avec succès");
    } catch (error) {
        // S'il y a une erreur de SQL, on regarde
        // si c'est parce qu'il y a conflit
        // d'identifiant
        if (error.code === "P2002") {
            response.sendStatus(409);
        } else {
            next(error);
        }
    }
});

//Route pour connexion user
router.post("/connexion", (req, res, next) => {
    passport.authenticate("local", (err, utilisateur, info) => {
        if (err) {
            return next(err);
        }
        if (!utilisateur) {
            return res.status(401).json(info);
        }
        req.login(utilisateur, (err) => {
            if (err) {
                return next(err);
            }

            //Ajouter email et role a la session
            if (!req.session.user_email) {
                req.session.user_email = utilisateur.email;
                req.session.save();
            }
            if (!req.session.user_role) {
                req.session.user_role = utilisateur.role;
                req.session.save();
            }
            return res.json({
                msg: "Connexion réussie",
                utilisateur,
            });
        });
    })(req, res, next);
});

//Route pour deconnexion user
router.post("/deconnexion", (request, response, next) => {
    // Déconnecter l'utilisateur
    request.logOut((erreur) => {
        if (erreur) {
            // On laisse Express gérer l'erreur
            next(erreur);
        } else {
            // Indiquer que la déconnexion a réussi
            response.status(200).end();
        }
    });
});

// Route pour la page d'inscription
router.get("/inscription", (request, response) => {
    response.render("auth", {
        title: "Inscription | Mon site web",
        styles: ["./css/style.css", "/css/auth.css"],
        scripts: ["/js/inscription.js"],
        type: "Inscription",
        user_email: request.session.user_email || null,
        is_admin: request.session.user_role === "admin",
    });
});

// Route pour la page de connexion
router.get("/connexion", (request, response) => {
    response.render("auth", {
        title: "Connexion | Mon site web",
        styles: ["./css/style.css", "/css/auth.css"],
        scripts: ["/js/connexion.js"],
        type: "Connexion",
        user_email: request.session?.user_email || null,
        is_admin: request.session.user_role === "admin",
    });
});

// Route pour la page d'accueil
router.get("/", async (req, res) => {
    res.render("accueil", {
        titre: "TODO-Accueil",
        styles: ["./css/style.css", "./css/home.css"],
        scripts: ["./js/script.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Route pour la page de contact
router.get("/contact", (req, res) => {
    res.render("contact", {
        titre: "TODO-Contact",
        styles: ["./css/style.css", "./css/contact.css"],
        scripts: ["./js/contact.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Route pour la page de home
router.get("/todo", async (req, res) => {
    //Protection de la route
    if (!req.session.user_email) {
        return res.redirect("/connexion");
    }
    res.render("home", {
        titre: "TODO-Accueil",
        styles: ["./css/style.css", "./css/home.css"],
        scripts: ["./js/script.js"],
        todos: await getTodos(),
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Route pour la page de admin
router.get("/admin", async (req, res) => {
    //Protection de la route
    if (!req.session.user_email) {
        return res.redirect("/connexion");
    }
    if (req.session.user_role !== "admin") {
        return res.status(403).send("Accès refusé");
    }
    res.render("admin", {
        titre: "TODO-Admin",
        styles: ["./css/style.css", "./css/home.css"],
        scripts: ["./js/script.js"],
        todos: await getTodos(),
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Route pour ajouter une tâche
router.post("/api/add-todo", async (req, res) => {
    const { description } = req.body;
    try {
        const tache = await addTodo(description);
        res.status(201).json({
            msg: "Tâche ajoutée avec succès",
            tache,
        });
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de l'ajout de la tâche" + error,
        });
    }
});

// Route pour mettre à jour une tâche
router.put("/api/update-todo/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const tache = await updateTodo(id);
        res.status(200).json({
            msg: "Tâche mise à jour avec succès",
            tache,
        });
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la mise à jour de la tâche" + error,
        });
    }
});

// Route pour mettre à jour une tâche en utilisant query param
router.patch("/api/update-todo", async (req, res) => {
    const id = parseInt(req.query.id);
    try {
        const tache = await updateTodo(id);
        res.status(200).json({
            msg: "Tâche mise à jour avec succès",
            tache,
        });
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la mise à jour de la tâche" + error,
        });
    }
});

//Route pour supprimer une tâche
router.delete("/api/delete-todo/:id", (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const success = deleteTodo(id);
        if (success) {
            res.status(200).json({
                msg: "Tâche supprimée avec succès",
            });
        } else {
            res.status(404).json({
                error: "Tâche non trouvée",
            });
        }
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la suppression de la tâche" + error,
        });
    }
});

// Route pour obtenir la liste des tâches
router.get("/api/todos", async (req, res) => {
    try {
        const todos = await getTodos();
        res.status(200).json(todos);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération des tâches",
        });
    }
});

export default router;
