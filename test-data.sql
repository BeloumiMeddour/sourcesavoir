-- ===========================
-- TEST DATA FOR EPLANIFY
-- ===========================

-- Vider les tables (si test)
-- DELETE FROM Affectations;
-- DELETE FROM Disponibilites;
-- DELETE FROM Professeur;
-- DELETE FROM Salle;
-- DELETE FROM Cours;
-- DELETE FROM Semestre;

-- ===========================
-- SEMESTRES
-- ===========================
INSERT INTO Semestre (nom, dateDebut, dateFin, createdAt, updatedAt)
VALUES 
    ('Hiver 2026', '2026-01-13', '2026-04-30', GETDATE(), GETDATE()),
    ('Été 2026', '2026-05-01', '2026-08-31', GETDATE(), GETDATE()),
    ('Automne 2026', '2026-09-01', '2026-12-31', GETDATE(), GETDATE());

-- ===========================
-- PROGRAMMES
-- ===========================
-- (Les programmes sont des strings dans Cours et Professeur)

-- ===========================
-- COURS
-- ===========================
INSERT INTO Cours (code, nom, duree, programme, etapeEtude, typeSalle, createdAt, updatedAt)
VALUES
    ('INF101', 'Introduction à l''informatique', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF102', 'Programmation en Python', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF201', 'Bases de données', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('INF202', 'Développement Web', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
    ('GEN101', 'Mathématiques Fondamentales', 2, 'Génie Général', '1ère année', 'Classe', GETDATE(), GETDATE()),
    ('GEN102', 'Physique Générale', 2, 'Génie Général', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES101', 'Réseaux Informatiques', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
    ('RES201', 'Sécurité Réseaux', 3, 'Génie Réseau', '2ème année', 'Classe', GETDATE(), GETDATE());

-- ===========================
-- SALLES
-- ===========================
INSERT INTO Salle (code, type, capacite, createdAt)
VALUES
    ('LAB-01', 'Laboratoire', 30, GETDATE()),
    ('LAB-02', 'Laboratoire', 30, GETDATE()),
    ('LAB-03', 'Laboratoire', 25, GETDATE()),
    ('CLASS-A1', 'Classe', 50, GETDATE()),
    ('CLASS-A2', 'Classe', 50, GETDATE()),
    ('CLASS-B1', 'Classe', 40, GETDATE()),
    ('AMP-01', 'Amphithtéâtre', 100, GETDATE());

-- ===========================
-- PROFESSEURS (avec nouveau champ programme)
-- ===========================
INSERT INTO Professeur (matricule, nom, prenom, specialite, programme, chargeMax, createdAt, updatedAt)
VALUES
    ('P001', 'Dupont', 'Jean', 'Informatique', 'Génie Informatique', 30, GETDATE(), GETDATE()),
    ('P002', 'Martin', 'Marie', 'Informatique', 'Génie Informatique', 30, GETDATE(), GETDATE()),
    ('P003', 'Bernard', 'Pierre', 'Réseaux', 'Génie Réseau', 30, GETDATE(), GETDATE()),
    ('P004', 'Thomas', 'Luc', 'Réseaux', 'Génie Réseau', 28, GETDATE(), GETDATE()),
    ('P005', 'Laurent', 'Sophie', 'Mathématiques', 'Génie Général', 32, GETDATE(), GETDATE()),
    ('P006', 'Moreau', 'Jacques', 'Mathématiques', 'Génie Général', 32, GETDATE(), GETDATE()),
    ('P007', 'Rose', 'Anne', 'Physique', 'Génie Général', 28, GETDATE(), GETDATE()),
    ('P008', 'Blanc', 'Marc', 'Informatique', 'Génie Informatique', 30, GETDATE(), GETDATE());

-- ===========================
-- DISPONIBILITES PROFESSEURS (Exemple)
-- ===========================
-- Professeur P001 disponible Lundi-Vendredi 08:00-12:00 et 13:00-17:00
INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt)
VALUES
    ('Lundi', '08:00-12:00', 'Professeur', 1, NULL, GETDATE()),
    ('Lundi', '13:00-17:00', 'Professeur', 1, NULL, GETDATE()),
    ('Mardi', '08:00-12:00', 'Professeur', 1, NULL, GETDATE()),
    ('Mardi', '13:00-17:00', 'Professeur', 1, NULL, GETDATE()),
    ('Mercredi', '08:00-12:00', 'Professeur', 1, NULL, GETDATE()),
    ('Mercredi', '13:00-17:00', 'Professeur', 1, NULL, GETDATE()),
    ('Jeudi', '08:00-12:00', 'Professeur', 1, NULL, GETDATE()),
    ('Jeudi', '13:00-17:00', 'Professeur', 1, NULL, GETDATE()),
    ('Vendredi', '08:00-12:00', 'Professeur', 1, NULL, GETDATE()),
    ('Vendredi', '13:00-17:00', 'Professeur', 1, NULL, GETDATE());

-- ===========================
-- AFFECTATIONS (Cours à des salles/jours)
-- ===========================
-- Affectations avec plageHoraire (format: "HH:MM-HH:MM")
INSERT INTO AffectationCours (id_cours, id_salle, id_semestre, jour, plageHoraire, id_professeur, createdAt, updatedAt)
VALUES
    (1, 1, 1, 'Lundi', '09:00-11:00', 1, GETDATE(), GETDATE()),
    (2, 2, 1, 'Mardi', '09:00-12:00', 2, GETDATE(), GETDATE()),
    (3, 1, 1, 'Mercredi', '13:00-16:00', 1, GETDATE(), GETDATE()),
    (4, 3, 1, 'Jeudi', '09:00-12:00', 8, GETDATE(), GETDATE()),
    (5, 4, 1, 'Lundi', '14:00-16:00', 5, GETDATE(), GETDATE()),
    (6, 5, 1, 'Mardi', '14:00-16:00', 6, GETDATE(), GETDATE()),
    (7, 2, 1, 'Mercredi', '09:00-12:00', 3, GETDATE(), GETDATE()),
    (8, 6, 1, 'Jeudi', '13:00-16:00', 4, GETDATE(), GETDATE());

-- ===========================
-- JOURS FÉRIÉS
-- ===========================
INSERT INTO JourFerie (id_semestre, date, description, createdAt)
VALUES
    (1, '2026-02-16', 'Journée relâche', GETDATE()),
    (1, '2026-03-30', 'Lundi de Pâques', GETDATE()),
    (2, '2026-07-01', 'Fête du Canada', GETDATE());

-- ===========================
-- UTILISATEURS TEST
-- ===========================
-- Password: Admin123! (hashé avec bcrypt)
INSERT INTO [User] (email, password, role, nom, prenom, createdAt)
VALUES
    ('admin@lacite.ca', '$2b$10$qp1OGnMXuBTgn46oXBHGeOJMvgciDsEKHTPMe.EHoti8oSX9HLskC', 'admin', 'Admin', 'Système', GETDATE()),
    ('admin@eplanify.com', '$2b$10$qp1OGnMXuBTgn46oXBHGeOJMvgciDsEKHTPMe.EHoti8oSX9HLskC', 'admin', 'Admin', 'System', GETDATE()),
    ('coordinateur@eplanify.com', '$2b$10$qp1OGnMXuBTgn46oXBHGeOJMvgciDsEKHTPMe.EHoti8oSX9HLskC', 'coordinateur', 'Coordinateur', 'Académique', GETDATE()),
    ('directeur@eplanify.com', '$2b$10$qp1OGnMXuBTgn46oXBHGeOJMvgciDsEKHTPMe.EHoti8oSX9HLskC', 'directeur', 'Directeur', 'Général', GETDATE());

-- ===========================
-- VÉRIFICATION - Voir les données
-- ===========================
-- SELECT * FROM Professeur;
-- SELECT * FROM Cours;
-- SELECT * FROM Salle;
-- SELECT * FROM AffectationCours;
-- SELECT * FROM Semestre;
