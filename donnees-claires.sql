-- ============================================================
-- DONNÉES CLAIRES POUR EPLANIFY - Collège La Cité
-- ============================================================
-- À exécuter dans SQL Server Management Studio (SSMS)
-- ou via sqlcmd connecté à votre base de données
--
-- AVERTISSEMENT : Ce script EFFACE toutes les données existantes
-- avant d'insérer les nouvelles données.
-- ============================================================


-- ============================================================
-- ÉTAPE 1 : VIDER LES TABLES (ordre important: enfants avant parents)
-- ============================================================
DELETE FROM AffectationCours;
DELETE FROM JourFerie;
DELETE FROM Disponibilite;
DELETE FROM Cours;
DELETE FROM Salle;
DELETE FROM Professeur;
DELETE FROM Semestre;
DELETE FROM [User];

-- Réinitialiser les compteurs d'identité pour que les IDs repartent à 1
DBCC CHECKIDENT ('AffectationCours', RESEED, 0);
DBCC CHECKIDENT ('JourFerie', RESEED, 0);
DBCC CHECKIDENT ('Disponibilite', RESEED, 0);
DBCC CHECKIDENT ('Cours', RESEED, 0);
DBCC CHECKIDENT ('Salle', RESEED, 0);
DBCC CHECKIDENT ('Professeur', RESEED, 0);
DBCC CHECKIDENT ('Semestre', RESEED, 0);
DBCC CHECKIDENT ('[User]', RESEED, 0);


-- ============================================================
-- ÉTAPE 2 : SEMESTRES
-- IDs générés automatiquement : 1=Hiver 2026, 2=Été 2026, 3=Automne 2026
-- ============================================================
INSERT INTO Semestre (nom, dateDebut, dateFin, createdAt, updatedAt) VALUES
    ('Hiver 2026',   '2026-01-13', '2026-04-30', GETDATE(), GETDATE()),
    ('Été 2026',     '2026-05-04', '2026-08-21', GETDATE(), GETDATE()),
    ('Automne 2026', '2026-09-02', '2026-12-18', GETDATE(), GETDATE());


-- ============================================================
-- ÉTAPE 3 : SALLES
-- IDs générés automatiquement : 1 à 6
-- ============================================================
INSERT INTO Salle (code, type, capacite, createdAt) VALUES
    ('A101', 'Classe',       40, GETDATE()),  -- ID 1 : Classe standard
    ('A102', 'Classe',       40, GETDATE()),  -- ID 2 : Classe standard
    ('B201', 'Laboratoire',  25, GETDATE()),  -- ID 3 : Labo informatique
    ('B202', 'Laboratoire',  25, GETDATE()),  -- ID 4 : Labo informatique
    ('B203', 'Laboratoire',  20, GETDATE()),  -- ID 5 : Petit labo
    ('C301', 'Amphithéâtre', 80, GETDATE());  -- ID 6 : Grand amphi


-- ============================================================
-- ÉTAPE 4 : PROFESSEURS
-- IDs générés automatiquement : 1 à 6
-- chargeMax = nombre d'heures max par semestre
-- ============================================================
INSERT INTO Professeur (matricule, nom, prenom, specialite, programme, chargeMax, createdAt, updatedAt) VALUES
    ('PROF-001', 'Tremblay', 'Marie',    'Programmation',          'Techniques de l''informatique', 40, GETDATE(), GETDATE()),  -- ID 1
    ('PROF-002', 'Gagnon',   'Luc',      'Bases de données',       'Techniques de l''informatique', 35, GETDATE(), GETDATE()),  -- ID 2
    ('PROF-003', 'Bouchard', 'Sophie',   'Réseaux et sécurité',    'Techniques de l''informatique', 38, GETDATE(), GETDATE()),  -- ID 3
    ('PROF-004', 'Côté',     'Pierre',   'Développement web',      'Techniques de l''informatique', 36, GETDATE(), GETDATE()),  -- ID 4
    ('PROF-005', 'Lavoie',   'Isabelle', 'Mathématiques',          'Sciences de la nature',         40, GETDATE(), GETDATE()),  -- ID 5
    ('PROF-006', 'Fortin',   'Marc',     'Gestion et comptabilité','Administration',                 38, GETDATE(), GETDATE());  -- ID 6


-- ============================================================
-- ÉTAPE 5 : COURS
-- IDs générés automatiquement : 1 à 8
-- duree = nombre d'heures par séance
-- typeSalle = doit correspondre au type de salle disponible
-- ============================================================
INSERT INTO Cours (code, nom, duree, programme, etapeEtude, typeSalle, createdAt, updatedAt) VALUES
    ('INF101', 'Introduction à la programmation',  3, 'Techniques de l''informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),  -- ID 1
    ('INF102', 'Programmation orientée objet',     3, 'Techniques de l''informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),  -- ID 2
    ('INF201', 'Bases de données relationnelles',  3, 'Techniques de l''informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),  -- ID 3
    ('INF202', 'Développement web front-end',      3, 'Techniques de l''informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),  -- ID 4
    ('INF301', 'Sécurité des réseaux',             2, 'Techniques de l''informatique', '3ème année', 'Classe',      GETDATE(), GETDATE()),  -- ID 5
    ('INF302', 'Administration des systèmes',      3, 'Techniques de l''informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),  -- ID 6
    ('MAT101', 'Calcul différentiel',              3, 'Sciences de la nature',         '1ère année', 'Classe',      GETDATE(), GETDATE()),  -- ID 7
    ('ADM101', 'Comptabilité générale',            3, 'Administration',                '1ère année', 'Classe',      GETDATE(), GETDATE());  -- ID 8


-- ============================================================
-- ÉTAPE 6 : DISPONIBILITÉS DES PROFESSEURS
-- format plageHoraire : "HH:MM-HH:MM"
-- Chaque prof est disponible du lundi au vendredi
-- ============================================================

-- Marie Tremblay (ID 1) : Lundi à Vendredi, 8h-17h
INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt) VALUES
    ('Lundi',    '08:00-17:00', 'Professeur', 1, NULL, GETDATE()),
    ('Mardi',    '08:00-17:00', 'Professeur', 1, NULL, GETDATE()),
    ('Mercredi', '08:00-17:00', 'Professeur', 1, NULL, GETDATE()),
    ('Jeudi',    '08:00-17:00', 'Professeur', 1, NULL, GETDATE()),
    ('Vendredi', '08:00-17:00', 'Professeur', 1, NULL, GETDATE());

-- Luc Gagnon (ID 2) : Lundi à Jeudi, 9h-18h (pas disponible le vendredi)
INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt) VALUES
    ('Lundi',    '09:00-18:00', 'Professeur', 2, NULL, GETDATE()),
    ('Mardi',    '09:00-18:00', 'Professeur', 2, NULL, GETDATE()),
    ('Mercredi', '09:00-18:00', 'Professeur', 2, NULL, GETDATE()),
    ('Jeudi',    '09:00-18:00', 'Professeur', 2, NULL, GETDATE());

-- Sophie Bouchard (ID 3) : Mardi, Mercredi, Jeudi, Vendredi, 8h-16h
INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt) VALUES
    ('Mardi',    '08:00-16:00', 'Professeur', 3, NULL, GETDATE()),
    ('Mercredi', '08:00-16:00', 'Professeur', 3, NULL, GETDATE()),
    ('Jeudi',    '08:00-16:00', 'Professeur', 3, NULL, GETDATE()),
    ('Vendredi', '08:00-16:00', 'Professeur', 3, NULL, GETDATE());

-- Pierre Côté (ID 4) : Lundi à Vendredi, 10h-19h
INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt) VALUES
    ('Lundi',    '10:00-19:00', 'Professeur', 4, NULL, GETDATE()),
    ('Mardi',    '10:00-19:00', 'Professeur', 4, NULL, GETDATE()),
    ('Mercredi', '10:00-19:00', 'Professeur', 4, NULL, GETDATE()),
    ('Jeudi',    '10:00-19:00', 'Professeur', 4, NULL, GETDATE()),
    ('Vendredi', '10:00-19:00', 'Professeur', 4, NULL, GETDATE());

-- Isabelle Lavoie (ID 5) : Lundi, Mardi, Jeudi, 8h-14h
INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt) VALUES
    ('Lundi',    '08:00-14:00', 'Professeur', 5, NULL, GETDATE()),
    ('Mardi',    '08:00-14:00', 'Professeur', 5, NULL, GETDATE()),
    ('Jeudi',    '08:00-14:00', 'Professeur', 5, NULL, GETDATE());

-- Marc Fortin (ID 6) : Mercredi, Jeudi, Vendredi, 9h-17h
INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt) VALUES
    ('Mercredi', '09:00-17:00', 'Professeur', 6, NULL, GETDATE()),
    ('Jeudi',    '09:00-17:00', 'Professeur', 6, NULL, GETDATE()),
    ('Vendredi', '09:00-17:00', 'Professeur', 6, NULL, GETDATE());


-- ============================================================
-- ÉTAPE 7 : AFFECTATIONS POUR LE SEMESTRE HIVER 2026 (ID=1)
--
-- IMPORTANT : le champ "jour" stocke un CHIFFRE (pas un mot) :
--   "1" = Lundi
--   "2" = Mardi
--   "3" = Mercredi
--   "4" = Jeudi
--   "5" = Vendredi
--
-- Ces affectations se répètent chaque semaine du semestre.
-- ============================================================
INSERT INTO AffectationCours (id_cours, id_salle, id_semestre, jour, plageHoraire, id_professeur, createdAt, updatedAt) VALUES
    -- INF101 - Intro programmation : Lundi 09h-12h, Labo B201, Marie Tremblay
    (1, 3, 1, '1', '09:00-12:00', 1, GETDATE(), GETDATE()),

    -- INF102 - Prog orientée objet : Mardi 09h-12h, Labo B202, Marie Tremblay
    (2, 4, 1, '2', '09:00-12:00', 1, GETDATE(), GETDATE()),

    -- INF201 - Bases de données : Mercredi 09h-12h, Labo B201, Luc Gagnon
    (3, 3, 1, '3', '09:00-12:00', 2, GETDATE(), GETDATE()),

    -- INF202 - Développement web : Jeudi 10h-13h, Labo B202, Pierre Côté
    (4, 4, 1, '4', '10:00-13:00', 4, GETDATE(), GETDATE()),

    -- INF301 - Sécurité réseaux : Mardi 13h-15h, Classe A101, Sophie Bouchard
    (5, 1, 1, '2', '13:00-15:00', 3, GETDATE(), GETDATE()),

    -- INF302 - Administration systèmes : Vendredi 09h-12h, Labo B203, Sophie Bouchard
    (6, 5, 1, '5', '09:00-12:00', 3, GETDATE(), GETDATE()),

    -- MAT101 - Calcul différentiel : Lundi 08h-11h, Classe A102, Isabelle Lavoie
    (7, 2, 1, '1', '08:00-11:00', 5, GETDATE(), GETDATE()),

    -- ADM101 - Comptabilité : Mercredi 13h-16h, Classe A101, Marc Fortin
    (8, 1, 1, '3', '13:00-16:00', 6, GETDATE(), GETDATE()),

    -- INF101 - 2ème groupe : Jeudi 13h-16h, Labo B203, Marie Tremblay
    (1, 5, 1, '4', '13:00-16:00', 1, GETDATE(), GETDATE()),

    -- INF201 - 2ème groupe : Vendredi 13h-16h, Labo B201, Luc Gagnon
    (3, 3, 1, '5', '13:00-16:00', 2, GETDATE(), GETDATE());


-- ============================================================
-- ÉTAPE 8 : JOURS FÉRIÉS - HIVER 2026 (id_semestre = 1)
-- ============================================================
INSERT INTO JourFerie (id_semestre, date, description, createdAt) VALUES
    (1, '2026-02-16', 'Relâche scolaire - Semaine de lecture',  GETDATE()),
    (1, '2026-04-03', 'Vendredi Saint',                         GETDATE()),
    (1, '2026-04-06', 'Lundi de Pâques',                        GETDATE());

-- Été 2026 (id_semestre = 2)
INSERT INTO JourFerie (id_semestre, date, description, createdAt) VALUES
    (2, '2026-05-18', 'Journée nationale des patriotes',  GETDATE()),
    (2, '2026-06-24', 'Fête nationale du Québec',          GETDATE()),
    (2, '2026-07-01', 'Fête du Canada',                    GETDATE());

-- Automne 2026 (id_semestre = 3)
INSERT INTO JourFerie (id_semestre, date, description, createdAt) VALUES
    (3, '2026-09-07', 'Fête du Travail',            GETDATE()),
    (3, '2026-10-12', 'Action de grâce',             GETDATE()),
    (3, '2026-11-11', 'Jour du Souvenir',            GETDATE());


-- ============================================================
-- ÉTAPE 9 : COMPTE ADMINISTRATEUR
-- Mot de passe : Admin123!  (hashé avec bcrypt)
-- ============================================================
INSERT INTO [User] (email, password, role, nom, prenom, createdAt) VALUES
    ('admin@lacite.ca', '$2b$10$fTt7PsK5rg5VFGu/G4pITeRh0IufKJ2AXwIeK6QvpOgXBn9SmkczG', 'admin', 'Administrateur', 'Système', GETDATE());


-- ============================================================
-- VÉRIFICATION RAPIDE
-- ============================================================
SELECT 'Semestres'     AS Table_name, COUNT(*) AS Nombre FROM Semestre;
SELECT 'Salles'        AS Table_name, COUNT(*) AS Nombre FROM Salle;
SELECT 'Professeurs'   AS Table_name, COUNT(*) AS Nombre FROM Professeur;
SELECT 'Cours'         AS Table_name, COUNT(*) AS Nombre FROM Cours;
SELECT 'Disponibilites'AS Table_name, COUNT(*) AS Nombre FROM Disponibilite;
SELECT 'Affectations'  AS Table_name, COUNT(*) AS Nombre FROM AffectationCours;
SELECT 'Jours feries'  AS Table_name, COUNT(*) AS Nombre FROM JourFerie;
SELECT 'Utilisateurs'  AS Table_name, COUNT(*) AS Nombre FROM [User];
