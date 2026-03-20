import { Router } from "express";
import { createUser, getUsers, getUserById, updateUserRole, deleteUser } from "./model/user.js";

import { 
    addCours, 
    getCours, 
    getCoursById, 
    updateCours, 
    deleteCours,
    getCoursByProgramme,
    getCoursByDuree,
    getCoursByTypeSalle,
    getCoursByEtapeEtude,
} from "./model/cours.js";

import { 
    addSalle, 
    getSalles, 
    getSalleById, 
    updateSalle, 
    deleteSalle,
    getSallesByType,
    getSallesByCode,
} from "./model/salle.js";

import { 
    addProfesseur, 
    getProfesseurs, 
    getProfesseurById, 
    updateProfesseur, 
    deleteProfesseur,
    getProfesseursBySpecialite,
    getProfesseursByDisponibilite,
    addDisponibiliteProfesseur,
    deleteDisponibiliteProfesseur,
} from "./model/professeur.js";

import { 
    addAffectation, 
    getAffectations, 
    getAffectationById, 
    deleteAffectation,
    getConflitSalle,
    getConflitProfesseur,
    getAffectationsBySalle,
    getAffectationsByProfesseur,
} from "./model/affectation.js";

const router = Router();

// Importation du passport
import passport from "passport";

/* ===========================
   MIDDLEWARE PROTECTION API
=========================== */

// Vérifie que l'utilisateur est connecté et admin pour les routes API
const protegerRouteAPI = (req, res, next) => {
    if (!req.session.user_email) {
        return res.status(401).json({ error: "Non authentifié" });
    }
    if (req.session.user_role !== "admin") {
        return res.status(403).json({ error: "Accès refusé" });
    }
    next();
};

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

// Protéger toutes les routes API
router.use("/api", protegerRouteAPI);

// Route pour ajouter un cours
router.post("/api/add-cours", async (req, res) => {
    const { code, nom, duree, programme, etapeEtude, typeSalle } = req.body;
    try {
        const cours = await addCours({
            code,
            nom,
            duree,
            programme,
            etapeEtude,
            typeSalle,
        });
        res.status(201).json({
            msg: "Cours ajouté avec succès",
            cours,
        });
    } catch (error) {
        if (error.code === "P2002") {
            res.status(409).json({
                error: "Un cours avec ce code existe déjà",
            });
        } else {
            res.status(500).json({
                error: "Erreur lors de l'ajout du cours: " + error.message,
            });
        }
    }
});

// Route pour obtenir la liste des cours
router.get("/api/cours", async (req, res) => {
    try {
        const { programme, duree, typeSalle, etapeEtude } = req.query;
        let cours;
        
        if (programme) {
            cours = await getCoursByProgramme(programme);
        } else if (duree) {
            cours = await getCoursByDuree(duree);
        } else if (typeSalle) {
            cours = await getCoursByTypeSalle(typeSalle);
        } else if (etapeEtude) {
            cours = await getCoursByEtapeEtude(etapeEtude);
        } else {
            cours = await getCours();
        }
        
        res.status(200).json(cours);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération des cours: " + error.message,
        });
    }
});

// Route pour obtenir un cours par son ID
router.get("/api/cours/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const cours = await getCoursById(id);
        if (!cours) {
            return res.status(404).json({
                error: "Cours non trouvé",
            });
        }
        res.status(200).json(cours);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération du cours: " + error.message,
        });
    }
});

// Route pour mettre à jour un cours
router.put("/api/update-cours/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const cours = await updateCours(id, req.body);
        res.status(200).json({
            msg: "Cours mis à jour avec succès",
            cours,
        });
    } catch (error) {
        if (error.message === "Cours non trouvé") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de la mise à jour du cours: " + error.message,
            });
        }
    }
});

// Route pour supprimer un cours
router.delete("/api/delete-cours/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteCours(id);
        res.status(200).json({
            msg: "Cours supprimé avec succès",
        });
    } catch (error) {
        if (error.message === "Cours non trouvé") {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes("affectations futures")) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de la suppression du cours: " + error.message,
            });
        }
    }
});

// ==================== ROUTES SALLES ====================

// Route pour ajouter une salle
router.post("/api/add-salle", async (req, res) => {
    const { code, type, capacite } = req.body;
    try {
        const salle = await addSalle({
            code,
            type,
            capacite,
        });
        res.status(201).json({
            msg: "Salle ajoutée avec succès",
            salle,
        });
    } catch (error) {
        if (error.code === "P2002") {
            res.status(409).json({
                error: "Une salle avec ce code existe déjà",
            });
        } else {
            res.status(500).json({
                error: "Erreur lors de l'ajout de la salle: " + error.message,
            });
        }
    }
});

// Route pour obtenir la liste des salles
router.get("/api/salles", async (req, res) => {
    try {
        const { type, code } = req.query;
        let salles;
        
        if (type) {
            salles = await getSallesByType(type);
        } else if (code) {
            salles = await getSallesByCode(code);
        } else {
            salles = await getSalles();
        }
        
        res.status(200).json(salles);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération des salles: " + error.message,
        });
    }
});

// Route pour obtenir une salle par son ID
router.get("/api/salles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const salle = await getSalleById(id);
        if (!salle) {
            return res.status(404).json({
                error: "Salle non trouvée",
            });
        }
        res.status(200).json(salle);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération de la salle: " + error.message,
        });
    }
});

// Route pour mettre à jour une salle
router.put("/api/update-salle/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const salle = await updateSalle(id, req.body);
        res.status(200).json({
            msg: "Salle mise à jour avec succès",
            salle,
        });
    } catch (error) {
        if (error.message === "Salle non trouvée") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de la mise à jour de la salle: " + error.message,
            });
        }
    }
});

// Route pour supprimer une salle
router.delete("/api/delete-salle/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteSalle(id);
        res.status(200).json({
            msg: "Salle supprimée avec succès",
        });
    } catch (error) {
        if (error.message === "Salle non trouvée") {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes("cours planifiés")) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de la suppression de la salle: " + error.message,
            });
        }
    }
});

// ==================== ROUTES PROFESSEURS ====================

// Route pour la page de gestion des professeurs
router.get("/professeurs", async (req, res) => {
    // Protection de la route
    if (!req.session.user_email) {
        return res.redirect("/connexion");
    }
    if (req.session.user_role !== "admin") {
        return res.status(403).send("Accès refusé");
    }
    
    res.render("professeurs", {
        titre: "Gestion des Professeurs",
        styles: ["./css/style.css", "./css/professeurs.css"],
        scripts: ["./js/professeurs.js"],
        professeurs: await getProfesseurs(),
        user_email: req.session.user_email || null,
        is_admin: req.session.user_role === "admin",
    });
});

// Route pour ajouter un professeur
router.post("/api/add-professeur", async (req, res) => {
    const { matricule, nom, prenom, specialite } = req.body;
    try {
        const professeur = await addProfesseur({
            matricule,
            nom,
            prenom,
            specialite,
        });
        res.status(201).json({
            msg: "Professeur ajouté avec succès",
            professeur,
        });
    } catch (error) {
        if (error.code === "P2002") {
            res.status(409).json({
                error: "Un professeur avec ce matricule existe déjà",
            });
        } else {
            res.status(500).json({
                error: "Erreur lors de l'ajout du professeur: " + error.message,
            });
        }
    }
});

// Route pour obtenir la liste des professeurs
router.get("/api/professeurs", async (req, res) => {
    try {
        const { specialite, disponibilite } = req.query;
        let professeurs;
        
        if (specialite) {
            professeurs = await getProfesseursBySpecialite(specialite);
        } else if (disponibilite) {
            professeurs = await getProfesseursByDisponibilite(disponibilite);
        } else {
            professeurs = await getProfesseurs();
        }
        
        res.status(200).json(professeurs);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération des professeurs: " + error.message,
        });
    }
});

// Route pour obtenir un professeur par son ID
router.get("/api/professeurs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const professeur = await getProfesseurById(id);
        if (!professeur) {
            return res.status(404).json({
                error: "Professeur non trouvé",
            });
        }
        res.status(200).json(professeur);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération du professeur: " + error.message,
        });
    }
});

// Route pour mettre à jour un professeur
router.put("/api/update-professeur/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const professeur = await updateProfesseur(id, req.body);
        res.status(200).json({
            msg: "Professeur mis à jour avec succès",
            professeur,
        });
    } catch (error) {
        if (error.message === "Professeur non trouvé") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de la mise à jour du professeur: " + error.message,
            });
        }
    }
});

// Route pour supprimer un professeur
router.delete("/api/delete-professeur/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteProfesseur(id);
        res.status(200).json({
            msg: "Professeur supprimé avec succès",
        });
    } catch (error) {
        if (error.message === "Professeur non trouvé") {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes("cours planifiés")) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de la suppression du professeur: " + error.message,
            });
        }
    }
});

// ==================== ROUTES DISPONIBILITÉS PROFESSEURS ====================

// Route pour ajouter une disponibilité à un professeur
router.post("/api/professeurs/:id/disponibilites", async (req, res) => {
    const id_professeur = parseInt(req.params.id);
    const { jour, plageHoraire } = req.body;
    try {
        const disponibilite = await addDisponibiliteProfesseur(id_professeur, {
            jour,
            plageHoraire,
        });
        res.status(201).json({
            msg: "Disponibilité ajoutée avec succès",
            disponibilite,
        });
    } catch (error) {
        if (error.message === "Professeur non trouvé") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de l'ajout de la disponibilité: " + error.message,
            });
        }
    }
});

// Route pour supprimer une disponibilité d'un professeur
router.delete("/api/disponibilites/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteDisponibiliteProfesseur(id);
        res.status(200).json({
            msg: "Disponibilité supprimée avec succès",
        });
    } catch (error) {
        if (error.message === "Disponibilité non trouvée") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de la suppression de la disponibilité: " + error.message,
            });
        }
    }
});

// ==================== ROUTES AFFECTATIONS ====================

// Route pour créer une affectation (cours → salle + professeur + date)
router.post("/api/add-affectation", async (req, res) => {
    const { id_cours, id_professeur, id_salle, date, plageHoraire } = req.body;
    try {
        // Récupérer le cours, la salle et le professeur
        const cours = await getCoursById(parseInt(id_cours));
        if (!cours) {
            return res.status(404).json({ error: "Cours non trouvé" });
        }
        
        const salle = await getSalleById(parseInt(id_salle));
        if (!salle) {
            return res.status(404).json({ error: "Salle non trouvée" });
        }
        
        const professeur = await getProfesseurById(parseInt(id_professeur));
        if (!professeur) {
            return res.status(404).json({ error: "Professeur non trouvé" });
        }
        
        // Vérifier compatibilité type de salle
        if (cours.typeSalle !== salle.type) {
            return res.status(400).json({
                error: "Le type de salle ne correspond pas au cours. Le cours nécessite une salle de type: " + cours.typeSalle,
            });
        }
        
        // Vérifier que la spécialité du professeur correspond au programme du cours
        if (professeur.specialite !== cours.programme) {
            return res.status(400).json({
                error: "La spécialité du professeur ne correspond pas au programme du cours",
            });
        }
        
        // Vérifier la disponibilité du professeur pour ce jour
        const dateObj = new Date(date);
        const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const jourSemaine = jours[dateObj.getDay()];
        
        let profDisponible = false;
        if (professeur.disponibilites && professeur.disponibilites.length > 0) {
            for (let i = 0; i < professeur.disponibilites.length; i++) {
                if (professeur.disponibilites[i].jour === jourSemaine && professeur.disponibilites[i].plageHoraire === plageHoraire) {
                    profDisponible = true;
                    break;
                }
            }
        }
        
        if (!profDisponible) {
            return res.status(400).json({
                error: "Le professeur n'est pas disponible ce jour (" + jourSemaine + ") à cette plage horaire",
            });
        }
        
        // Vérifier conflit de salle
        const conflitSalle = await getConflitSalle(id_salle, date, plageHoraire);
        if (conflitSalle) {
            return res.status(409).json({
                error: "La salle est déjà occupée à cette plage horaire",
                conflit: conflitSalle,
            });
        }
        
        // Vérifier conflit de professeur
        const conflitProf = await getConflitProfesseur(id_professeur, date, plageHoraire);
        if (conflitProf) {
            return res.status(409).json({
                error: "Le professeur est déjà assigné à cette plage horaire",
                conflit: conflitProf,
            });
        }
        
        const affectation = await addAffectation({
            id_cours,
            id_professeur,
            id_salle,
            date,
            plageHoraire,
        });
        res.status(201).json({
            msg: "Affectation créée avec succès",
            affectation,
        });
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la création de l'affectation: " + error.message,
        });
    }
});

// Route pour obtenir la liste des affectations
router.get("/api/affectations", async (req, res) => {
    try {
        const affectations = await getAffectations();
        res.status(200).json(affectations);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération des affectations: " + error.message,
        });
    }
});

// Route pour obtenir une affectation par son ID
router.get("/api/affectations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const affectation = await getAffectationById(id);
        if (!affectation) {
            return res.status(404).json({
                error: "Affectation non trouvée",
            });
        }
        res.status(200).json(affectation);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération de l'affectation: " + error.message,
        });
    }
});

// Route pour obtenir les affectations d'une salle pour une date
router.get("/api/affectations/salle/:id_salle/:date", async (req, res) => {
    const id_salle = parseInt(req.params.id_salle);
    const date = req.params.date;
    try {
        const affectations = await getAffectationsBySalle(id_salle, date);
        res.status(200).json(affectations);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération des affectations: " + error.message,
        });
    }
});

// Route pour obtenir les affectations d'un professeur pour une date
router.get("/api/affectations/professeur/:id_professeur/:date", async (req, res) => {
    const id_professeur = parseInt(req.params.id_professeur);
    const date = req.params.date;
    try {
        const affectations = await getAffectationsByProfesseur(id_professeur, date);
        res.status(200).json(affectations);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération des affectations: " + error.message,
        });
    }
});

// Route pour supprimer une affectation
router.delete("/api/delete-affectation/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteAffectation(id);
        res.status(200).json({
            msg: "Affectation supprimée avec succès",
        });
    } catch (error) {
        if (error.message === "Affectation non trouvée") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de la suppression de l'affectation: " + error.message,
            });
        }
    }
});

// ==================== ROUTES GESTION UTILISATEURS (ADMIN) ====================

// Route pour obtenir la liste des utilisateurs
router.get("/api/users", async (req, res) => {
    try {
        const users = await getUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération des utilisateurs: " + error.message,
        });
    }
});

// Route pour obtenir un utilisateur par son ID
router.get("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const user = await getUserById(id);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            error: "Erreur lors de la récupération de l'utilisateur: " + error.message,
        });
    }
});

// Route pour mettre à jour le rôle d'un utilisateur
router.put("/api/update-user/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    try {
        const user = await updateUserRole(id, role);
        res.status(200).json({
            msg: "Rôle mis à jour avec succès",
            user,
        });
    } catch (error) {
        if (error.message === "Utilisateur non trouvé") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de la mise à jour de l'utilisateur: " + error.message,
            });
        }
    }
});

// Route pour supprimer un utilisateur
router.delete("/api/delete-user/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await deleteUser(id);
        res.status(200).json({
            msg: "Utilisateur supprimé avec succès",
        });
    } catch (error) {
        if (error.message === "Utilisateur non trouvé") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({
                error: "Erreur lors de la suppression de l'utilisateur: " + error.message,
            });
        }
    }
});

export default router;