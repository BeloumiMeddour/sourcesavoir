import { Router } from "express";
import { createUser, getUsers, getUserById, updateUser, assignRole, deleteUser } from "./model/user.js";
import {
    addCours,
    getCours,
    getCoursById,
    updateCours,
    deleteCours,
    getCoursByProgramme,
    getCoursByTypeSalle,
} from "./model/cours.js";

import { 
    addProfesseur, 
    getProfesseurs, 
    getProfesseurById, 
    updateProfesseur, 
    deleteProfesseur,
    getProfesseursBySpecialite 
} from "./model/professeur.js";

import {
    addSalle,
    getSalles,
    getSalleById,
    getSallesByType,
    updateSalle,
    deleteSalle,
} from "./model/salle.js";

import {
    addDisponibilite,
    getDisponibilitesByProfesseur,
    updateDisponibilite,
    deleteDisponibilite,
} from "./model/disponibilite.js";

import {
    affecterCoursASalle,
    assignerProfesseur,
    getAffectations,
    getAffectationById,
    getAffectationsBySalle,
    getAffectationsByProfesseur,
    updateAffectation,
    deleteAffectation,
} from "./model/affectation.js";

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
            // Nettoyer les variables de session
            request.session.user_email = null;
            request.session.user_role = null;
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
        titre: "Inscription | Planify",
        styles: ["./css/style.css"],
        scripts: ["/js/inscription.js"],
        type: "Inscription",
        user_email: request.session.user_email || null,
        is_admin: request.session.user_role === "admin",
    });
});

// Page de connexion
router.get("/connexion", (request, response) => {
    response.render("auth", {
        titre: "Connexion | Planify",
        styles: ["./css/style.css"],
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
        styles: ["./css/style.css"],
        scripts: [],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Page de contact
router.get("/contact", (req, res) => {
    res.render("contact", {
        titre: "Contact | Planify",
        styles: ["./css/style.css"],
        scripts: ["./js/contact.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Page des cours
router.get("/cours", (req, res) => {
    res.render("cours", {
        titre: "Cours | Planify",
        styles: ["./css/style.css"],
        scripts: ["./js/cours.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Page des professeurs
router.get("/professeurs", (req, res) => {
    res.render("professeurs", {
        titre: "Professeurs | Planify",
        styles: ["./css/style.css"],
        scripts: ["./js/professeurs.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Page des salles
router.get("/salles", (req, res) => {
    res.render("salles", {
        titre: "Salles | Planify",
        styles: ["./css/style.css"],
        scripts: ["./js/salles.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Page des affectations
router.get("/affectations", (req, res) => {
    res.render("affectations", {
        titre: "Affectations | Planify",
        styles: ["./css/style.css"],
        scripts: ["./js/affectations.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Page Planner (Emploi du Temps)
router.get("/planner", (req, res) => {
    res.render("planner", {
        titre: "Emploi du Temps | Planify",
        styles: ["./css/style.css"],
        scripts: ["./js/planner.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Page admin
router.get("/admin", (req, res) => {
    res.render("admin", {
        titre: "Administration | Planify",
        styles: ["./css/style.css"],
        scripts: ["./js/admin.js"],
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

/* ===========================
   API - UTILISATEURS (Admin)
=========================== */

// Créer un utilisateur (admin)
router.post("/api/utilisateurs", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await createUser(email, password, role);
        res.status(201).json({ msg: "Utilisateur créé avec succès", user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        if (error.code === "P2002") {
            res.status(409).json({ error: "Un utilisateur avec cet email existe déjà" });
        } else {
            res.status(500).json({ error: "Erreur lors de la création: " + error.message });
        }
    }
});

// Lister tous les utilisateurs
router.get("/api/utilisateurs", async (req, res) => {
    try {
        const users = await getUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs: " + error.message });
    }
});

// Obtenir un utilisateur par ID
router.get("/api/utilisateurs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const user = await getUserById(id);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération: " + error.message });
    }
});

// Modifier un utilisateur
router.put("/api/utilisateurs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const user = await updateUser(id, req.body);
        res.status(200).json({ msg: "Utilisateur mis à jour avec succès", user });
    } catch (error) {
        if (error.message === "Utilisateur non trouvé") {
            res.status(404).json({ error: error.message });
        } else if (error.code === "P2002") {
            res.status(409).json({ error: "Cet email est déjà utilisé" });
        } else {
            res.status(500).json({ error: "Erreur lors de la mise à jour: " + error.message });
        }
    }
});

// Attribuer un rôle à un utilisateur
router.put("/api/utilisateurs/:id/role", async (req, res) => {
    const id = parseInt(req.params.id);
    const { role } = req.body;

    if (role !== "admin" && role !== "responsable" && role !== "user") {
        return res.status(400).json({ error: "Rôle invalide. Utilisez 'admin', 'responsable' ou 'user'" });
    }

    try {
        const user = await assignRole(id, role);
        res.status(200).json({ msg: "Rôle attribué avec succès", user });
    } catch (error) {
        if (error.message === "Utilisateur non trouvé") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de l'attribution du rôle: " + error.message });
        }
    }
});

// Supprimer un utilisateur
router.delete("/api/utilisateurs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteUser(id);
        res.status(200).json({ msg: "Utilisateur supprimé avec succès" });
    } catch (error) {
        if (error.message === "Utilisateur non trouvé") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la suppression: " + error.message });
        }
    }
});

/* ===========================
   API - COURS
=========================== */

// Ajouter un cours
router.post("/api/cours", async (req, res) => {
    try {
        const cours = await addCours(req.body);
        res.status(201).json({ msg: "Cours ajouté avec succès", cours });
    } catch (error) {
        if (error.code === "P2002") {
            res.status(409).json({ error: "Un cours avec ce code existe déjà" });
        } else {
            res.status(500).json({ error: "Erreur lors de l'ajout du cours: " + error.message });
        }
    }
});

// Lister les cours (avec filtre optionnel par programme ou typeSalle)
router.get("/api/cours", async (req, res) => {
    try {
        const { programme, typeSalle } = req.query;
        let cours;

        if (programme) {
            cours = await getCoursByProgramme(programme);
        } else if (typeSalle) {
            cours = await getCoursByTypeSalle(typeSalle);
        } else {
            cours = await getCours();
        }

        res.status(200).json(cours);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des cours: " + error.message });
    }
});

// Obtenir un cours par ID
router.get("/api/cours/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const cours = await getCoursById(id);
        if (!cours) {
            return res.status(404).json({ error: "Cours non trouvé" });
        }
        res.status(200).json(cours);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération du cours: " + error.message });
    }
});

// Modifier un cours
router.put("/api/cours/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const cours = await updateCours(id, req.body);
        res.status(200).json({ msg: "Cours mis à jour avec succès", cours });
    } catch (error) {
        if (error.message === "Cours non trouvé") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la mise à jour du cours: " + error.message });
        }
    }
});

// Supprimer un cours
router.delete("/api/cours/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteCours(id);
        res.status(200).json({ msg: "Cours supprimé avec succès" });
    } catch (error) {
        if (error.message === "Cours non trouvé") {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes("affectations")) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la suppression du cours: " + error.message });
        }
    }
});

/* ===========================
   API - PROFESSEURS
=========================== */

// Ajouter un professeur
router.post("/api/professeurs", async (req, res) => {
    try {
        const professeur = await addProfesseur(req.body);
        res.status(201).json({ msg: "Professeur ajouté avec succès", professeur });
    } catch (error) {
        if (error.code === "P2002") {
            res.status(409).json({ error: "Un professeur avec ce matricule existe déjà" });
        } else {
            res.status(500).json({ error: "Erreur lors de l'ajout du professeur: " + error.message });
        }
    }
});

// Lister les professeurs (avec filtre optionnel par spécialité)
router.get("/api/professeurs", async (req, res) => {
    try {
        const { specialite } = req.query;
        let professeurs;

        if (specialite) {
            professeurs = await getProfesseursBySpecialite(specialite);
        } else {
            professeurs = await getProfesseurs();
        }

        res.status(200).json(professeurs);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des professeurs: " + error.message });
    }
});

// Obtenir un professeur par ID
router.get("/api/professeurs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const professeur = await getProfesseurById(id);
        if (!professeur) {
            return res.status(404).json({ error: "Professeur non trouvé" });
        }
        res.status(200).json(professeur);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération du professeur: " + error.message });
    }
});

// Modifier un professeur
router.put("/api/professeurs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const professeur = await updateProfesseur(id, req.body);
        res.status(200).json({ msg: "Professeur mis à jour avec succès", professeur });
    } catch (error) {
        if (error.message === "Professeur non trouvé") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la mise à jour du professeur: " + error.message });
        }
    }
});

// Supprimer un professeur
router.delete("/api/professeurs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteProfesseur(id);
        res.status(200).json({ msg: "Professeur supprimé avec succès" });
    } catch (error) {
        if (error.message === "Professeur non trouvé") {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes("cours planifiés")) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la suppression du professeur: " + error.message });
        }
    }
});

/* ===========================
   API - SALLES
=========================== */

// Ajouter une salle
router.post("/api/salles", async (req, res) => {
    try {
        const salle = await addSalle(req.body);
        res.status(201).json({ msg: "Salle ajoutée avec succès", salle });
    } catch (error) {
        if (error.code === "P2002") {
            res.status(409).json({ error: "Une salle avec ce code existe déjà" });
        } else {
            res.status(500).json({ error: "Erreur lors de l'ajout de la salle: " + error.message });
        }
    }
});

// Lister les salles (avec filtre optionnel par type)
router.get("/api/salles", async (req, res) => {
    try {
        const { type } = req.query;
        let salles;

        if (type) {
            salles = await getSallesByType(type);
        } else {
            salles = await getSalles();
        }

        res.status(200).json(salles);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des salles: " + error.message });
    }
});

// Obtenir une salle par ID
router.get("/api/salles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const salle = await getSalleById(id);
        if (!salle) {
            return res.status(404).json({ error: "Salle non trouvée" });
        }
        res.status(200).json(salle);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération de la salle: " + error.message });
    }
});

// Modifier une salle
router.put("/api/salles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const salle = await updateSalle(id, req.body);
        res.status(200).json({ msg: "Salle mise à jour avec succès", salle });
    } catch (error) {
        if (error.message === "Salle non trouvée") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la mise à jour de la salle: " + error.message });
        }
    }
});

// Supprimer une salle
router.delete("/api/salles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteSalle(id);
        res.status(200).json({ msg: "Salle supprimée avec succès" });
    } catch (error) {
        if (error.message === "Salle non trouvée") {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes("cours planifiés")) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la suppression de la salle: " + error.message });
        }
    }
});

/* ===========================
   API - DISPONIBILITÉS
=========================== */

// Ajouter une disponibilité pour un professeur
router.post("/api/disponibilites", async (req, res) => {
    try {
        const dispo = await addDisponibilite(req.body);
        res.status(201).json({ msg: "Disponibilité ajoutée avec succès", dispo });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'ajout de la disponibilité: " + error.message });
    }
});

// Obtenir les disponibilités d'un professeur
router.get("/api/disponibilites/professeur/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const dispos = await getDisponibilitesByProfesseur(id);
        res.status(200).json(dispos);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des disponibilités: " + error.message });
    }
});

// Modifier une disponibilité
router.put("/api/disponibilites/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const dispo = await updateDisponibilite(id, req.body);
        res.status(200).json({ msg: "Disponibilité mise à jour avec succès", dispo });
    } catch (error) {
        if (error.message === "Disponibilité non trouvée") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la mise à jour de la disponibilité: " + error.message });
        }
    }
});

// Supprimer une disponibilité
router.delete("/api/disponibilites/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteDisponibilite(id);
        res.status(200).json({ msg: "Disponibilité supprimée avec succès" });
    } catch (error) {
        if (error.message === "Disponibilité non trouvée") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la suppression de la disponibilité: " + error.message });
        }
    }
});

/* ===========================
   API - AFFECTATIONS
=========================== */

// Affecter un cours à une salle (date + plage horaire)
router.post("/api/affectations", async (req, res) => {
    try {
        const affectation = await affecterCoursASalle(req.body);
        res.status(201).json({ msg: "Cours affecté avec succès", affectation });
    } catch (error) {
        if (error.message.includes("Conflit")) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de l'affectation: " + error.message });
        }
    }
});

// Assigner un professeur à une affectation
router.put("/api/affectations/:id/professeur", async (req, res) => {
    const id = parseInt(req.params.id);
    const { id_professeur } = req.body;
    try {
        const affectation = await assignerProfesseur(id, id_professeur);
        res.status(200).json({ msg: "Professeur assigné avec succès", affectation });
    } catch (error) {
        if (error.message.includes("Conflit")) {
            res.status(409).json({ error: error.message });
        } else if (error.message === "Affectation non trouvée") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de l'assignation: " + error.message });
        }
    }
});

// Lister toutes les affectations
router.get("/api/affectations", async (req, res) => {
    try {
        const affectations = await getAffectations();
        res.status(200).json(affectations);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des affectations: " + error.message });
    }
});

// Obtenir une affectation par ID
router.get("/api/affectations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const affectation = await getAffectationById(id);
        if (!affectation) {
            return res.status(404).json({ error: "Affectation non trouvée" });
        }
        res.status(200).json(affectation);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération de l'affectation: " + error.message });
    }
});

// Obtenir les affectations d'une salle
router.get("/api/affectations/salle/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const affectations = await getAffectationsBySalle(id);
        res.status(200).json(affectations);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération: " + error.message });
    }
});

// Obtenir les affectations d'un professeur
router.get("/api/affectations/professeur/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const affectations = await getAffectationsByProfesseur(id);
        res.status(200).json(affectations);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération: " + error.message });
    }
});

// Modifier une affectation
router.put("/api/affectations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const affectation = await updateAffectation(id, req.body);
        res.status(200).json({ msg: "Affectation mise à jour avec succès", affectation });
    } catch (error) {
        if (error.message.includes("Conflit")) {
            res.status(409).json({ error: error.message });
        } else if (error.message === "Affectation non trouvée") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la mise à jour: " + error.message });
        }
    }
});

// Supprimer une affectation
router.delete("/api/affectations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteAffectation(id);
        res.status(200).json({ msg: "Affectation supprimée avec succès" });
    } catch (error) {
        if (error.message === "Affectation non trouvée") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Erreur lors de la suppression: " + error.message });
        }
    }
});

export default router;
