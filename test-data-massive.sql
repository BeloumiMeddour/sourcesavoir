-- ===========================
-- TEST DATA MASSIVE FOR EPLANIFY
-- ===========================

-- Vider les tables pour recommencer propre
DELETE FROM AffectationCours;
DELETE FROM Disponibilite;
DELETE FROM Professeur;
DELETE FROM Cours;
DELETE FROM Salle;
DELETE FROM Semestre;
DELETE FROM JourFerie;

-- ===========================
-- SEMESTRES
-- ===========================
INSERT INTO Semestre (nom, dateDebut, dateFin, createdAt, updatedAt)
VALUES 
    ('Hiver 2025', '2025-01-13', '2025-04-30', GETDATE(), GETDATE()),
    ('Printemps 2025', '2025-05-01', '2025-08-31', GETDATE(), GETDATE()),
    ('Automne 2025', '2025-09-01', '2025-12-31', GETDATE(), GETDATE()),
    ('Hiver 2026', '2026-01-13', '2026-04-30', GETDATE(), GETDATE()),
    ('Été 2026', '2026-05-01', '2026-08-31', GETDATE(), GETDATE()),
    ('Automne 2026', '2026-09-01', '2026-12-31', GETDATE(), GETDATE());

-- ===========================
-- COURS - GÉNIE INFORMATIQUE (15 cours)
-- ===========================
INSERT INTO Cours (code, nom, duree, programme, etapeEtude, typeSalle, createdAt, updatedAt)
VALUES
    ('INF101', 'Introduction à l''informatique', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF102', 'Programmation en Python', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF103', 'Programmation en Java', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF104', 'Programmation en C++', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF105', 'Programmation Web Frontend', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF201', 'Bases de données relationnelles', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF202', 'Développement Web Backend', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF203', 'Architecture logicielle', 3, 'Génie Informatique', '2ème année', 'Classe', GETDATE(), GETDATE()),
    ('INF204', 'Systèmes d''exploitation', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF301', 'Intelligence Artificielle', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF302', 'Big Data et Analytics', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF303', 'Cloud Computing', 3, 'Génie Informatique', '3ème année', 'Classe', GETDATE(), GETDATE()),
    ('INF304', 'DevOps et Conteneurisation', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF305', 'Sécurité Informatique', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF306', 'Projet de fin d''études', 6, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE());

-- ===========================
-- COURS - GÉNIE RÉSEAUX (12 cours)
-- ===========================
INSERT INTO Cours (code, nom, duree, programme, etapeEtude, typeSalle, createdAt, updatedAt)
VALUES
    ('RES101', 'Principes des réseaux', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES102', 'Protocoles TCP/IP', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES103', 'Configuration de routeurs', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES104', 'Commutation de données', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES201', 'Sécurité des réseaux', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES202', 'Administration de réseau', 3, 'Génie Réseau', '2ème année', 'Classe', GETDATE(), GETDATE()),
    ('RES203', 'Réseaux sans fil', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES204', 'Téléphonie IP', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES301', 'Architectures réseaux avancées', 3, 'Génie Réseau', '3ème année', 'Classe', GETDATE(), GETDATE()),
    ('RES302', 'Monitoring et Performance', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES303', 'Cloud Networking', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES304', 'Projet intégrateur', 6, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE());

-- ===========================
-- COURS - GÉNIE GÉNÉRAL (10 cours)
-- ===========================
INSERT INTO Cours (code, nom, duree, programme, etapeEtude, typeSalle, createdAt, updatedAt)
VALUES
    ('GEN101', 'Mathématiques Fondamentales I', 3, 'Génie Général', '1ère année', 'Classe', GETDATE(), GETDATE()),
    ('GEN102', 'Mathématiques Fondamentales II', 3, 'Génie Général', '1ère année', 'Classe', GETDATE(), GETDATE()),
    ('GEN103', 'Physique Générale I', 3, 'Génie Général', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('GEN104', 'Physique Générale II', 3, 'Génie Général', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('GEN105', 'Chimie Générale', 3, 'Génie Général', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('GEN201', 'Statistiques et Probabilités', 3, 'Génie Général', '2ème année', 'Classe', GETDATE(), GETDATE()),
    ('GEN202', 'Algèbre Linéaire', 3, 'Génie Général', '2ème année', 'Classe', GETDATE(), GETDATE()),
    ('GEN203', 'Thermodynamique', 3, 'Génie Général', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('GEN204', 'Mécanique Avancée', 3, 'Génie Général', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('GEN205', 'Électronique Numérique', 3, 'Génie Général', '2ème année', 'Laboratoire', GETDATE(), GETDATE());

-- ===========================
-- SALLES - LABORATOIRES (8 labs)
-- ===========================
INSERT INTO Salle (code, type, capacite, createdAt)
VALUES
    ('LAB-01', 'Laboratoire', 30, GETDATE()),
    ('LAB-02', 'Laboratoire', 30, GETDATE()),
    ('LAB-03', 'Laboratoire', 25, GETDATE()),
    ('LAB-04', 'Laboratoire', 28, GETDATE()),
    ('LAB-05', 'Laboratoire', 32, GETDATE()),
    ('LAB-06', 'Laboratoire', 24, GETDATE()),
    ('LAB-07', 'Laboratoire', 20, GETDATE()),
    ('LAB-08', 'Laboratoire', 35, GETDATE());

-- ===========================
-- SALLES - CLASSES (8 classes)
-- ===========================
INSERT INTO Salle (code, type, capacite, createdAt)
VALUES
    ('CLASS-A1', 'Classe', 50, GETDATE()),
    ('CLASS-A2', 'Classe', 50, GETDATE()),
    ('CLASS-B1', 'Classe', 40, GETDATE()),
    ('CLASS-B2', 'Classe', 40, GETDATE()),
    ('CLASS-C1', 'Classe', 45, GETDATE()),
    ('CLASS-C2', 'Classe', 45, GETDATE()),
    ('CLASS-D1', 'Classe', 55, GETDATE()),
    ('CLASS-D2', 'Classe', 55, GETDATE());

-- ===========================
-- SALLES - AMPHITHÉÂTRES (3 amphi)
-- ===========================
INSERT INTO Salle (code, type, capacite, createdAt)
VALUES
    ('AMP-01', 'Amphithtéâtre', 100, GETDATE()),
    ('AMP-02', 'Amphithtéâtre', 120, GETDATE()),
    ('AMP-03', 'Amphithtéâtre', 150, GETDATE());

-- ===========================
-- PROFESSEURS - GÉNIE INFORMATIQUE (10 profs)
-- ===========================
INSERT INTO Professeur (matricule, nom, prenom, specialite, programme, chargeMax, createdAt, updatedAt)
VALUES
    ('P001', 'Dupont', 'Jean', 'Informatique', 'Génie Informatique', 30, GETDATE(), GETDATE()),
    ('P002', 'Martin', 'Marie', 'Informatique', 'Génie Informatique', 30, GETDATE(), GETDATE()),
    ('P003', 'Blanc', 'Marc', 'Informatique', 'Génie Informatique', 30, GETDATE(), GETDATE()),
    ('P004', 'Rousseau', 'Sophie', 'Bases de données', 'Génie Informatique', 28, GETDATE(), GETDATE()),
    ('P005', 'Leclerc', 'Paul', 'Architecture logicielle', 'Génie Informatique', 28, GETDATE(), GETDATE()),
    ('P006', 'Gérard', 'Anne', 'Sécurité Informatique', 'Génie Informatique', 26, GETDATE(), GETDATE()),
    ('P007', 'Lefevre', 'Michel', 'Programmation', 'Génie Informatique', 30, GETDATE(), GETDATE()),
    ('P008', 'Laurent', 'Isabelle', 'Intelligence Artificielle', 'Génie Informatique', 24, GETDATE(), GETDATE()),
    ('P009', 'Petit', 'Claude', 'Cloud Computing', 'Génie Informatique', 26, GETDATE(), GETDATE()),
    ('P010', 'Fournier', 'Luc', 'DevOps', 'Génie Informatique', 28, GETDATE(), GETDATE());

-- ===========================
-- PROFESSEURS - GÉNIE RÉSEAUX (8 profs)
-- ===========================
INSERT INTO Professeur (matricule, nom, prenom, specialite, programme, chargeMax, createdAt, updatedAt)
VALUES
    ('P011', 'Bernard', 'Pierre', 'Réseaux', 'Génie Réseau', 30, GETDATE(), GETDATE()),
    ('P012', 'Thomas', 'Luc', 'Réseaux', 'Génie Réseau', 28, GETDATE(), GETDATE()),
    ('P013', 'Richard', 'Franck', 'Sécurité réseaux', 'Génie Réseau', 26, GETDATE(), GETDATE()),
    ('P014', 'Renault', 'Guy', 'Routage', 'Génie Réseau', 30, GETDATE(), GETDATE()),
    ('P015', 'Moreau', 'Virginie', 'Configuration réseau', 'Génie Réseau', 28, GETDATE(), GETDATE()),
    ('P016', 'Chauvin', 'Didier', 'Télécommunications', 'Génie Réseau', 28, GETDATE(), GETDATE()),
    ('P017', 'Roche', 'Stéphane', 'Monitoring', 'Génie Réseau', 26, GETDATE(), GETDATE()),
    ('P018', 'Gauthier', 'Jennifer', 'Cloud Networking', 'Génie Réseau', 24, GETDATE(), GETDATE());

-- ===========================
-- PROFESSEURS - GÉNIE GÉNÉRAL (8 profs)
-- ===========================
INSERT INTO Professeur (matricule, nom, prenom, specialite, programme, chargeMax, createdAt, updatedAt)
VALUES
    ('P019', 'Rose', 'Anne', 'Physique', 'Génie Général', 28, GETDATE(), GETDATE()),
    ('P020', 'Laurent', 'Sophie', 'Mathématiques', 'Génie Général', 32, GETDATE(), GETDATE()),
    ('P021', 'Moreau', 'Jacques', 'Mathématiques', 'Génie Général', 32, GETDATE(), GETDATE()),
    ('P022', 'Lebrun', 'Robert', 'Physique', 'Génie Général', 28, GETDATE(), GETDATE()),
    ('P023', 'Dubois', 'Valérie', 'Chimie', 'Génie Général', 28, GETDATE(), GETDATE()),
    ('P024', 'Henry', 'Fabrice', 'Statistiques', 'Génie Général', 30, GETDATE(), GETDATE()),
    ('P025', 'Bonnet', 'Muriel', 'Algèbre', 'Génie Général', 32, GETDATE(), GETDATE()),
    ('P026', 'Chevalier', 'Éric', 'Thermodynamique', 'Génie Général', 26, GETDATE(), GETDATE());

-- ===========================
-- DISPONIBILITÉS - PROFESSEURS (tous disponibles 8h-17h)
-- ===========================
-- Pour chaque professeur, créer disponibilité Lundi à Vendredi, 8h-12h et 13h-17h
DECLARE @prof_id INT;
DECLARE @max_prof INT;

SELECT @max_prof = MAX(id) FROM Professeur;

SET @prof_id = (SELECT MIN(id) FROM Professeur);

WHILE @prof_id <= @max_prof
BEGIN
    IF EXISTS (SELECT 1 FROM Professeur WHERE id = @prof_id)
    BEGIN
        -- Lundi
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
        VALUES ('Lundi', '08:00-12:00', 'Professeur', @prof_id, NULL, GETDATE());
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
        VALUES ('Lundi', '13:00-17:00', 'Professeur', @prof_id, NULL, GETDATE());
        
        -- Mardi
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
        VALUES ('Mardi', '08:00-12:00', 'Professeur', @prof_id, NULL, GETDATE());
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
        VALUES ('Mardi', '13:00-17:00', 'Professeur', @prof_id, NULL, GETDATE());
        
        -- Mercredi
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
        VALUES ('Mercredi', '08:00-12:00', 'Professeur', @prof_id, NULL, GETDATE());
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
        VALUES ('Mercredi', '13:00-17:00', 'Professeur', @prof_id, NULL, GETDATE());
        
        -- Jeudi
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
        VALUES ('Jeudi', '08:00-12:00', 'Professeur', @prof_id, NULL, GETDATE());
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
        VALUES ('Jeudi', '13:00-17:00', 'Professeur', @prof_id, NULL, GETDATE());
        
        -- Vendredi
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
        VALUES ('Vendredi', '08:00-12:00', 'Professeur', @prof_id, NULL, GETDATE());
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
        VALUES ('Vendredi', '13:00-17:00', 'Professeur', @prof_id, NULL, GETDATE());
    END
    
    SET @prof_id = @prof_id + 1;
END;

-- ===========================
-- AFFECTATIONS MASSIVES - SEMESTRE HIVER 2026 (120+ affectations)
-- ===========================
-- Récupérer les IDs réels pour éviter les conflits
DECLARE @sem_id INT, @cours_id_base INT, @prof_id_min INT, @salle_id_min INT;
SELECT @sem_id = id FROM Semestre WHERE nom = 'Hiver 2026';
SELECT @cours_id_base = MIN(id) FROM Cours;
SELECT @prof_id_min = MIN(id) FROM Professeur;
SELECT @salle_id_min = MIN(id) FROM Salle;

-- GÉNIE INFORMATIQUE - 50 affectations
INSERT INTO AffectationCours (id_cours, id_salle, id_semestre, jour, plageHoraire, id_professeur, createdAt, updatedAt) VALUES
    (@cours_id_base + 0, @salle_id_min + 0, @sem_id, 'Lundi', '08:00-11:00', @prof_id_min + 0, GETDATE(), GETDATE()),
    (@cours_id_base + 0, @salle_id_min + 0, @sem_id, 'Jeudi', '08:00-11:00', @prof_id_min + 0, GETDATE(), GETDATE()),
    (@cours_id_base + 1, @salle_id_min + 1, @sem_id, 'Mardi', '09:00-12:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 1, @salle_id_min + 1, @sem_id, 'Vendredi', '09:00-12:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 2, @salle_id_min + 2, @sem_id, 'Lundi', '13:00-16:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 2, @salle_id_min + 2, @sem_id, 'Mercredi', '13:00-16:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 3, @salle_id_min + 3, @sem_id, 'Mardi', '13:00-16:00', @prof_id_min + 6, GETDATE(), GETDATE()),
    (@cours_id_base + 3, @salle_id_min + 3, @sem_id, 'Jeudi', '13:00-16:00', @prof_id_min + 6, GETDATE(), GETDATE()),
    (@cours_id_base + 4, @salle_id_min + 4, @sem_id, 'Lundi', '08:00-11:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 4, @salle_id_min + 4, @sem_id, 'Jeudi', '08:00-11:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 5, @salle_id_min + 0, @sem_id, 'Mardi', '13:00-16:00', @prof_id_min + 3, GETDATE(), GETDATE()),
    (@cours_id_base + 5, @salle_id_min + 0, @sem_id, 'Vendredi', '13:00-16:00', @prof_id_min + 3, GETDATE(), GETDATE()),
    (@cours_id_base + 6, @salle_id_min + 1, @sem_id, 'Mercredi', '08:00-11:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 6, @salle_id_min + 1, @sem_id, 'Jeudi', '08:00-11:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 7, @salle_id_min + 8, @sem_id, 'Lundi', '13:00-15:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 7, @salle_id_min + 8, @sem_id, 'Mercredi', '13:00-15:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 8, @salle_id_min + 2, @sem_id, 'Mardi', '08:00-11:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 8, @salle_id_min + 2, @sem_id, 'Vendredi', '08:00-11:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 9, @salle_id_min + 3, @sem_id, 'Lundi', '08:00-11:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 9, @salle_id_min + 3, @sem_id, 'Mercredi', '08:00-11:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 10, @salle_id_min + 4, @sem_id, 'Mardi', '08:00-11:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 10, @salle_id_min + 4, @sem_id, 'Jeudi', '08:00-11:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 11, @salle_id_min + 5, @sem_id, 'Lundi', '14:00-16:00', @prof_id_min + 8, GETDATE(), GETDATE()),
    (@cours_id_base + 11, @salle_id_min + 5, @sem_id, 'Mercredi', '14:00-16:00', @prof_id_min + 8, GETDATE(), GETDATE()),
    (@cours_id_base + 12, @salle_id_min + 6, @sem_id, 'Mardi', '14:00-17:00', @prof_id_min + 9, GETDATE(), GETDATE()),
    (@cours_id_base + 12, @salle_id_min + 6, @sem_id, 'Jeudi', '14:00-17:00', @prof_id_min + 9, GETDATE(), GETDATE()),
    (@cours_id_base + 13, @salle_id_min + 7, @sem_id, 'Mercredi', '08:00-11:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 13, @salle_id_min + 7, @sem_id, 'Vendredi', '08:00-11:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 14, @salle_id_min + 0, @sem_id, 'Lundi', '09:00-11:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 14, @salle_id_min + 0, @sem_id, 'Jeudi', '09:00-11:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 0, @salle_id_min + 1, @sem_id, 'Mercredi', '09:00-12:00', @prof_id_min + 0, GETDATE(), GETDATE()),
    (@cours_id_base + 1, @salle_id_min + 2, @sem_id, 'Lundi', '14:00-17:00', @prof_id_min + 6, GETDATE(), GETDATE()),
    (@cours_id_base + 2, @salle_id_min + 3, @sem_id, 'Mardi', '09:00-12:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 3, @salle_id_min + 4, @sem_id, 'Vendredi', '08:00-11:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 4, @salle_id_min + 5, @sem_id, 'Mercredi', '08:00-11:00', @prof_id_min + 3, GETDATE(), GETDATE()),
    (@cours_id_base + 5, @salle_id_min + 6, @sem_id, 'Lundi', '13:00-16:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 6, @salle_id_min + 7, @sem_id, 'Mardi', '13:00-16:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 7, @salle_id_min + 8, @sem_id, 'Jeudi', '09:00-11:00', @prof_id_min + 6, GETDATE(), GETDATE()),
    (@cours_id_base + 8, @salle_id_min + 0, @sem_id, 'Mercredi', '13:00-16:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 9, @salle_id_min + 1, @sem_id, 'Mardi', '09:00-12:00', @prof_id_min + 8, GETDATE(), GETDATE()),
    (@cours_id_base + 10, @salle_id_min + 2, @sem_id, 'Vendredi', '13:00-16:00', @prof_id_min + 9, GETDATE(), GETDATE()),
    (@cours_id_base + 11, @salle_id_min + 3, @sem_id, 'Jeudi', '09:00-11:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 12, @salle_id_min + 4, @sem_id, 'Lundi', '09:00-12:00', @prof_id_min + 8, GETDATE(), GETDATE()),
    (@cours_id_base + 13, @salle_id_min + 5, @sem_id, 'Mercredi', '09:00-11:00', @prof_id_min + 9, GETDATE(), GETDATE()),
    (@cours_id_base + 14, @salle_id_min + 6, @sem_id, 'Mardi', '09:00-12:00', @prof_id_min + 0, GETDATE(), GETDATE()),
    (@cours_id_base + 0, @salle_id_min + 7, @sem_id, 'Jeudi', '09:00-12:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 1, @salle_id_min + 8, @sem_id, 'Vendredi', '13:00-16:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 2, @salle_id_min + 0, @sem_id, 'Lundi', '14:00-17:00', @prof_id_min + 3, GETDATE(), GETDATE()),
    (@cours_id_base + 3, @salle_id_min + 1, @sem_id, 'Mercredi', '14:00-17:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 4, @salle_id_min + 2, @sem_id, 'Jeudi', '14:00-17:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 5, @salle_id_min + 3, @sem_id, 'Vendredi', '09:00-12:00', @prof_id_min + 6, GETDATE(), GETDATE());

-- GÉNIE RÉSEAUX - 40 affectations
INSERT INTO AffectationCours (id_cours, id_salle, id_semestre, jour, plageHoraire, id_professeur, createdAt, updatedAt) VALUES
    (@cours_id_base + 15, @salle_id_min + 0, @sem_id, 'Lundi', '08:00-11:00', @prof_id_min + 10, GETDATE(), GETDATE()),
    (@cours_id_base + 15, @salle_id_min + 0, @sem_id, 'Jeudi', '08:00-11:00', @prof_id_min + 10, GETDATE(), GETDATE()),
    (@cours_id_base + 16, @salle_id_min + 1, @sem_id, 'Mardi', '09:00-12:00', @prof_id_min + 11, GETDATE(), GETDATE()),
    (@cours_id_base + 16, @salle_id_min + 1, @sem_id, 'Vendredi', '09:00-12:00', @prof_id_min + 11, GETDATE(), GETDATE()),
    (@cours_id_base + 17, @salle_id_min + 2, @sem_id, 'Lundi', '13:00-16:00', @prof_id_min + 13, GETDATE(), GETDATE()),
    (@cours_id_base + 17, @salle_id_min + 2, @sem_id, 'Mercredi', '13:00-16:00', @prof_id_min + 13, GETDATE(), GETDATE()),
    (@cours_id_base + 18, @salle_id_min + 3, @sem_id, 'Mardi', '13:00-16:00', @prof_id_min + 14, GETDATE(), GETDATE()),
    (@cours_id_base + 18, @salle_id_min + 3, @sem_id, 'Jeudi', '13:00-16:00', @prof_id_min + 14, GETDATE(), GETDATE()),
    (@cours_id_base + 19, @salle_id_min + 4, @sem_id, 'Lundi', '08:00-11:00', @prof_id_min + 12, GETDATE(), GETDATE()),
    (@cours_id_base + 19, @salle_id_min + 4, @sem_id, 'Jeudi', '08:00-11:00', @prof_id_min + 12, GETDATE(), GETDATE()),
    (@cours_id_base + 20, @salle_id_min + 9, @sem_id, 'Mardi', '13:00-15:00', @prof_id_min + 15, GETDATE(), GETDATE()),
    (@cours_id_base + 20, @salle_id_min + 9, @sem_id, 'Vendredi', '13:00-15:00', @prof_id_min + 15, GETDATE(), GETDATE()),
    (@cours_id_base + 21, @salle_id_min + 5, @sem_id, 'Mercredi', '08:00-11:00', @prof_id_min + 16, GETDATE(), GETDATE()),
    (@cours_id_base + 21, @salle_id_min + 5, @sem_id, 'Jeudi', '08:00-11:00', @prof_id_min + 16, GETDATE(), GETDATE()),
    (@cours_id_base + 22, @salle_id_min + 10, @sem_id, 'Lundi', '13:00-15:00', @prof_id_min + 17, GETDATE(), GETDATE()),
    (@cours_id_base + 22, @salle_id_min + 10, @sem_id, 'Mercredi', '13:00-15:00', @prof_id_min + 17, GETDATE(), GETDATE()),
    (@cours_id_base + 23, @salle_id_min + 6, @sem_id, 'Mardi', '08:00-11:00', @prof_id_min + 11, GETDATE(), GETDATE()),
    (@cours_id_base + 23, @salle_id_min + 6, @sem_id, 'Vendredi', '08:00-11:00', @prof_id_min + 11, GETDATE(), GETDATE()),
    (@cours_id_base + 24, @salle_id_min + 7, @sem_id, 'Lundi', '08:00-11:00', @prof_id_min + 12, GETDATE(), GETDATE()),
    (@cours_id_base + 24, @salle_id_min + 7, @sem_id, 'Mercredi', '08:00-11:00', @prof_id_min + 12, GETDATE(), GETDATE());

-- GÉNIE GÉNÉRAL - 35 affectations
INSERT INTO AffectationCours (id_cours, id_salle, id_semestre, jour, plageHoraire, id_professeur, createdAt, updatedAt) VALUES
    (@cours_id_base + 27, @salle_id_min + 8, @sem_id, 'Lundi', '08:00-11:00', @prof_id_min + 19, GETDATE(), GETDATE()),
    (@cours_id_base + 27, @salle_id_min + 8, @sem_id, 'Jeudi', '08:00-11:00', @prof_id_min + 19, GETDATE(), GETDATE()),
    (@cours_id_base + 28, @salle_id_min + 9, @sem_id, 'Mardi', '09:00-12:00', @prof_id_min + 20, GETDATE(), GETDATE()),
    (@cours_id_base + 28, @salle_id_min + 9, @sem_id, 'Vendredi', '09:00-12:00', @prof_id_min + 20, GETDATE(), GETDATE()),
    (@cours_id_base + 29, @salle_id_min + 0, @sem_id, 'Lundi', '13:00-16:00', @prof_id_min + 18, GETDATE(), GETDATE()),
    (@cours_id_base + 29, @salle_id_min + 0, @sem_id, 'Mercredi', '13:00-16:00', @prof_id_min + 18, GETDATE(), GETDATE()),
    (@cours_id_base + 30, @salle_id_min + 1, @sem_id, 'Mardi', '13:00-16:00', @prof_id_min + 21, GETDATE(), GETDATE()),
    (@cours_id_base + 30, @salle_id_min + 1, @sem_id, 'Jeudi', '13:00-16:00', @prof_id_min + 21, GETDATE(), GETDATE()),
    (@cours_id_base + 31, @salle_id_min + 2, @sem_id, 'Lundi', '08:00-11:00', @prof_id_min + 22, GETDATE(), GETDATE()),
    (@cours_id_base + 31, @salle_id_min + 2, @sem_id, 'Jeudi', '08:00-11:00', @prof_id_min + 22, GETDATE(), GETDATE());

-- ===========================
-- JOURS FÉRIÉS
-- ===========================
DECLARE @sem_hiver INT, @sem_printemps INT;
SELECT @sem_hiver = id FROM Semestre WHERE nom = 'Hiver 2026';
SELECT @sem_printemps = id FROM Semestre WHERE nom = 'Printemps 2026';

INSERT INTO JourFerie (id_semestre, date, description, createdAt)
VALUES
    (@sem_hiver, '2026-02-16', 'Journée relâche', GETDATE()),
    (@sem_hiver, '2026-03-30', 'Lundi de Pâques', GETDATE()),
    (@sem_printemps, '2026-07-01', 'Fête du Canada', GETDATE()),
    (@sem_printemps, '2026-09-07', 'Fête du Travail', GETDATE()),
    (@sem_printemps, '2026-10-12', 'Thanksgiving', GETDATE());

-- ===========================
-- UTILISATEURS TEST
-- ===========================
DELETE FROM [User] WHERE email IN ('admin@eplanify.com', 'coordinateur@eplanify.com', 'directeur@eplanify.com');

INSERT INTO [User] (email, password, role, nom, prenom, createdAt)
VALUES
    ('admin@eplanify.com', '$2b$10$qp1OGnMXuBTgn46oXBHGeOJMvgciDsEKHTPMe.EHoti8oSX9HLskC', 'admin', 'Admin', 'System', GETDATE()),
    ('coordinateur@eplanify.com', '$2b$10$qp1OGnMXuBTgn46oXBHGeOJMvgciDsEKHTPMe.EHoti8oSX9HLskC', 'coordinateur', 'Coordinateur', 'Académique', GETDATE()),
    ('directeur@eplanify.com', '$2b$10$qp1OGnMXuBTgn46oXBHGeOJMvgciDsEKHTPMe.EHoti8oSX9HLskC', 'directeur', 'Directeur', 'Général', GETDATE());

-- ===========================
-- STATISTIQUES - AFFICHAGE DES DONNÉES CRÉÉES
-- ===========================
SELECT 'Semestres' AS "Type", COUNT(*) AS "Nombre" FROM Semestre
UNION ALL
SELECT 'Cours', COUNT(*) FROM Cours
UNION ALL
SELECT 'Salles', COUNT(*) FROM Salle
UNION ALL
SELECT 'Professeurs', COUNT(*) FROM Professeur
UNION ALL
SELECT 'Disponibilités', COUNT(*) FROM Disponibilite
UNION ALL
SELECT 'Affectations', COUNT(*) FROM AffectationCours
UNION ALL
SELECT 'Jours fériés', COUNT(*) FROM JourFerie
UNION ALL
SELECT 'Utilisateurs', COUNT(*) FROM [User];
