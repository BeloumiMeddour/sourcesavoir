-- ============================================================
-- SEED DE TEST - EPlanify
-- Compte admin : admin@lacite.ca / Admin123!
-- IDs explicites (IDENTITY_INSERT) pour eviter le bug ID=0
-- Vider toutes les tables avant d'inserer
-- ============================================================

USE Planify;
GO

-- ============================================================
-- 1. VIDER LES TABLES (ordre inverse des FK)
-- ============================================================
DELETE FROM [dbo].[JourFerie];
DELETE FROM [dbo].[Disponibilite];
DELETE FROM [dbo].[AffectationCours];
DELETE FROM [dbo].[Cours];
DELETE FROM [dbo].[Salle];
DELETE FROM [dbo].[Professeur];
DELETE FROM [dbo].[Semestre];
DELETE FROM [dbo].[Utilisateur];

-- Remettre les compteurs IDENTITY a 0 (prochain INSERT = 1)
DBCC CHECKIDENT ('[dbo].[Cours]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[Salle]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[Professeur]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[Semestre]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[AffectationCours]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[Disponibilite]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[JourFerie]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[Utilisateur]', RESEED, 0);
GO

-- ============================================================
-- 2. UTILISATEUR ADMIN
-- ============================================================
SET IDENTITY_INSERT [dbo].[Utilisateur] ON;
INSERT INTO [dbo].[Utilisateur] (id, nom, prenom, email, motDePasse, role, createdAt, updatedAt)
VALUES (1, NULL, NULL, 'admin@lacite.ca', '$2b$10$iyqKOK6dsbho0o5B/7tkKONW.SkCx1SqP59Msdmt3dxUDy43IvlzW', 'ADMIN', GETDATE(), GETDATE());
SET IDENTITY_INSERT [dbo].[Utilisateur] OFF;
GO

-- ============================================================
-- 3. SEMESTRES (3 semestres)
-- ============================================================
SET IDENTITY_INSERT [dbo].[Semestre] ON;
INSERT INTO [dbo].[Semestre] (id, nom, dateDebut, dateFin, createdAt, updatedAt) VALUES
(1, 'Automne 2025', '2025-09-01', '2025-12-20', GETDATE(), GETDATE()),
(2, 'Hiver 2026',   '2026-01-12', '2026-04-30', GETDATE(), GETDATE()),
(3, 'Ete 2026',     '2026-05-04', '2026-08-14', GETDATE(), GETDATE());
SET IDENTITY_INSERT [dbo].[Semestre] OFF;
GO

-- ============================================================
-- 4. SALLES (8 salles)
-- ============================================================
SET IDENTITY_INSERT [dbo].[Salle] ON;
INSERT INTO [dbo].[Salle] (id, code, capacite, typeSalle, createdAt, updatedAt) VALUES
(1, 'A101', 35, 'Laboratoire', GETDATE(), GETDATE()),
(2, 'A102', 35, 'Laboratoire', GETDATE(), GETDATE()),
(3, 'B201', 40, 'Cours', GETDATE(), GETDATE()),
(4, 'B202', 40, 'Cours', GETDATE(), GETDATE()),
(5, 'C301', 30, 'Laboratoire', GETDATE(), GETDATE()),
(6, 'C302', 30, 'Laboratoire', GETDATE(), GETDATE()),
(7, 'D101', 50, 'Cours', GETDATE(), GETDATE()),
(8, 'D102', 25, 'Cours', GETDATE(), GETDATE());
SET IDENTITY_INSERT [dbo].[Salle] OFF;
GO

-- ============================================================
-- 5. PROFESSEURS (8 professeurs)
-- ============================================================
SET IDENTITY_INSERT [dbo].[Professeur] ON;
INSERT INTO [dbo].[Professeur] (id, nom, prenom, email, chargeMax, createdAt, updatedAt) VALUES
(1, 'Tremblay',  'Jean',    'jean.tremblay@lacite.ca',    18, GETDATE(), GETDATE()),
(2, 'Dupont',    'Marie',   'marie.dupont@lacite.ca',     15, GETDATE(), GETDATE()),
(3, 'Gagnon',    'Pierre',  'pierre.gagnon@lacite.ca',    18, GETDATE(), GETDATE()),
(4, 'Martin',    'Sophie',  'sophie.martin@lacite.ca',    12, GETDATE(), GETDATE()),
(5, 'Bouchard',  'Luc',     'luc.bouchard@lacite.ca',     18, GETDATE(), GETDATE()),
(6, 'Leblanc',   'Claire',  'claire.leblanc@lacite.ca',   15, GETDATE(), GETDATE()),
(7, 'Cote',      'Marc',    'marc.cote@lacite.ca',        18, GETDATE(), GETDATE()),
(8, 'Fortin',    'Isabelle','isabelle.fortin@lacite.ca',  12, GETDATE(), GETDATE());
SET IDENTITY_INSERT [dbo].[Professeur] OFF;
GO

-- ============================================================
-- 6. COURS (12 cours)
-- ============================================================
SET IDENTITY_INSERT [dbo].[Cours] ON;
INSERT INTO [dbo].[Cours] (id, code, nom, duree, programme, etapeEtude, typeSalle, createdAt, updatedAt) VALUES
(1,  'INF101', 'Introduction a la programmation',      3, 'Techniques de l''informatique', '1ere annee', 'Laboratoire', GETDATE(), GETDATE()),
(2,  'INF102', 'Programmation orientee objet',         3, 'Techniques de l''informatique', '1ere annee', 'Laboratoire', GETDATE(), GETDATE()),
(3,  'INF201', 'Bases de donnees relationnelles',      3, 'Techniques de l''informatique', '2eme annee', 'Laboratoire', GETDATE(), GETDATE()),
(4,  'INF202', 'Reseaux informatiques',                3, 'Techniques de l''informatique', '2eme annee', 'Laboratoire', GETDATE(), GETDATE()),
(5,  'INF301', 'Developpement web avance',             3, 'Techniques de l''informatique', '3eme annee', 'Laboratoire', GETDATE(), GETDATE()),
(6,  'INF302', 'Securite informatique',                3, 'Techniques de l''informatique', '3eme annee', 'Cours',       GETDATE(), GETDATE()),
(7,  'GES101', 'Gestion de projet',                    3, 'Gestion et technologies de l''information', '1ere annee', 'Cours', GETDATE(), GETDATE()),
(8,  'GES201', 'Systemes d''information',              3, 'Gestion et technologies de l''information', '2eme annee', 'Cours', GETDATE(), GETDATE()),
(9,  'MAT101', 'Mathematiques discretes',              3, 'Techniques de l''informatique', '1ere annee', 'Cours',       GETDATE(), GETDATE()),
(10, 'MAT201', 'Statistiques appliquees',              3, 'Techniques de l''informatique', '2eme annee', 'Cours',       GETDATE(), GETDATE()),
(11, 'COM101', 'Communication professionnelle',        2, 'Gestion et technologies de l''information', '1ere annee', 'Cours', GETDATE(), GETDATE()),
(12, 'ANA301', 'Analyse et conception de systemes',   3, 'Gestion et technologies de l''information', '3eme annee', 'Cours', GETDATE(), GETDATE());
SET IDENTITY_INSERT [dbo].[Cours] OFF;
GO

-- ============================================================
-- 7. DISPONIBILITES (plages horaires des professeurs)
-- Jours: 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi
-- ============================================================
SET IDENTITY_INSERT [dbo].[Disponibilite] ON;
INSERT INTO [dbo].[Disponibilite] (id, id_professeur, id_semestre, jour, heureDebut, heureFin, createdAt, updatedAt) VALUES
-- Jean Tremblay (id=1) - Semestre Hiver 2026 (id=2)
(1,  1, 2, 'Lundi',     '08:00', '12:00', GETDATE(), GETDATE()),
(2,  1, 2, 'Lundi',     '13:00', '18:00', GETDATE(), GETDATE()),
(3,  1, 2, 'Mardi',     '08:00', '12:00', GETDATE(), GETDATE()),
(4,  1, 2, 'Mercredi',  '08:00', '17:00', GETDATE(), GETDATE()),
(5,  1, 2, 'Jeudi',     '09:00', '15:00', GETDATE(), GETDATE()),
-- Marie Dupont (id=2) - Semestre Hiver 2026 (id=2)
(6,  2, 2, 'Lundi',     '08:00', '17:00', GETDATE(), GETDATE()),
(7,  2, 2, 'Mardi',     '08:00', '12:00', GETDATE(), GETDATE()),
(8,  2, 2, 'Jeudi',     '13:00', '18:00', GETDATE(), GETDATE()),
(9,  2, 2, 'Vendredi',  '08:00', '12:00', GETDATE(), GETDATE()),
-- Pierre Gagnon (id=3) - Semestre Hiver 2026 (id=2)
(10, 3, 2, 'Mardi',     '08:00', '17:00', GETDATE(), GETDATE()),
(11, 3, 2, 'Mercredi',  '08:00', '17:00', GETDATE(), GETDATE()),
(12, 3, 2, 'Vendredi',  '08:00', '12:00', GETDATE(), GETDATE()),
-- Sophie Martin (id=4) - Semestre Hiver 2026 (id=2)
(13, 4, 2, 'Lundi',     '13:00', '18:00', GETDATE(), GETDATE()),
(14, 4, 2, 'Mercredi',  '09:00', '15:00', GETDATE(), GETDATE()),
(15, 4, 2, 'Vendredi',  '08:00', '17:00', GETDATE(), GETDATE()),
-- Luc Bouchard (id=5) - Semestre Hiver 2026 (id=2)
(16, 5, 2, 'Lundi',     '08:00', '12:00', GETDATE(), GETDATE()),
(17, 5, 2, 'Mardi',     '13:00', '18:00', GETDATE(), GETDATE()),
(18, 5, 2, 'Jeudi',     '08:00', '17:00', GETDATE(), GETDATE()),
-- Claire Leblanc (id=6) - Semestre Hiver 2026 (id=2)
(19, 6, 2, 'Lundi',     '08:00', '17:00', GETDATE(), GETDATE()),
(20, 6, 2, 'Mercredi',  '08:00', '12:00', GETDATE(), GETDATE()),
(21, 6, 2, 'Vendredi',  '13:00', '18:00', GETDATE(), GETDATE()),
-- Marc Cote (id=7) - Semestre Hiver 2026 (id=2)
(22, 7, 2, 'Mardi',     '08:00', '12:00', GETDATE(), GETDATE()),
(23, 7, 2, 'Jeudi',     '08:00', '17:00', GETDATE(), GETDATE()),
(24, 7, 2, 'Vendredi',  '08:00', '17:00', GETDATE(), GETDATE()),
-- Isabelle Fortin (id=8) - Semestre Hiver 2026 (id=2)
(25, 8, 2, 'Lundi',     '13:00', '18:00', GETDATE(), GETDATE()),
(26, 8, 2, 'Mercredi',  '08:00', '17:00', GETDATE(), GETDATE()),
(27, 8, 2, 'Jeudi',     '08:00', '12:00', GETDATE(), GETDATE()),
-- Jean Tremblay (id=1) - Semestre Ete 2026 (id=3)
(28, 1, 3, 'Lundi',     '08:00', '17:00', GETDATE(), GETDATE()),
(29, 1, 3, 'Mercredi',  '08:00', '17:00', GETDATE(), GETDATE()),
-- Marie Dupont (id=2) - Semestre Ete 2026 (id=3)
(30, 2, 3, 'Mardi',     '08:00', '17:00', GETDATE(), GETDATE()),
(31, 2, 3, 'Jeudi',     '08:00', '17:00', GETDATE(), GETDATE()),
-- Pierre Gagnon (id=3) - Semestre Automne 2025 (id=1)
(32, 3, 1, 'Lundi',     '08:00', '12:00', GETDATE(), GETDATE()),
(33, 3, 1, 'Mercredi',  '08:00', '17:00', GETDATE(), GETDATE()),
(34, 3, 1, 'Vendredi',  '08:00', '17:00', GETDATE(), GETDATE()),
-- Luc Bouchard (id=5) - Semestre Automne 2025 (id=1)
(35, 5, 1, 'Mardi',     '08:00', '17:00', GETDATE(), GETDATE()),
(36, 5, 1, 'Jeudi',     '08:00', '12:00', GETDATE(), GETDATE()),
-- Marc Cote (id=7) - Semestre Automne 2025 (id=1)
(37, 7, 1, 'Lundi',     '08:00', '17:00', GETDATE(), GETDATE()),
(38, 7, 1, 'Vendredi',  '08:00', '12:00', GETDATE(), GETDATE());
SET IDENTITY_INSERT [dbo].[Disponibilite] OFF;
GO

-- ============================================================
-- 8. AFFECTATIONS
-- Jour: '1'=Lundi, '2'=Mardi, '3'=Mercredi, '4'=Jeudi, '5'=Vendredi
-- ============================================================
SET IDENTITY_INSERT [dbo].[AffectationCours] ON;
INSERT INTO [dbo].[AffectationCours] (id, id_semestre, id_cours, id_professeur, id_salle, jour, heureDebut, heureFin, createdAt, updatedAt) VALUES
-- === HIVER 2026 (semestre id=2) ===
(1,  2, 1,  1, 1, '1', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF101 | Tremblay | A101 | Lundi
(2,  2, 2,  2, 2, '2', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF102 | Dupont   | A102 | Mardi
(3,  2, 3,  3, 1, '2', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF201 | Gagnon   | A101 | Mardi
(4,  2, 4,  5, 5, '4', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF202 | Bouchard | C301 | Jeudi
(5,  2, 5,  7, 2, '4', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF301 | Cote     | A102 | Jeudi
(6,  2, 6,  6, 3, '3', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF302 | Leblanc  | B201 | Mercredi
(7,  2, 7,  4, 4, '1', '13:00', '16:00', GETDATE(), GETDATE()),  -- GES101 | Martin   | B202 | Lundi
(8,  2, 8,  8, 7, '3', '08:00', '11:00', GETDATE(), GETDATE()),  -- GES201 | Fortin   | D101 | Mercredi
(9,  2, 9,  2, 4, '4', '13:00', '16:00', GETDATE(), GETDATE()),  -- MAT101 | Dupont   | B202 | Jeudi
(10, 2, 10, 3, 3, '3', '08:00', '11:00', GETDATE(), GETDATE()),  -- MAT201 | Gagnon   | B201 | Mercredi
(11, 2, 11, 4, 8, '3', '09:00', '11:00', GETDATE(), GETDATE()),  -- COM101 | Martin   | D102 | Mercredi
(12, 2, 12, 8, 7, '4', '08:00', '11:00', GETDATE(), GETDATE()),  -- ANA301 | Fortin   | D101 | Jeudi
(13, 2, 1,  1, 1, '3', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF101 | Tremblay | A101 | Mercredi (2e groupe)
(14, 2, 2,  2, 2, '1', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF102 | Dupont   | A102 | Lundi (2e groupe)
(15, 2, 6,  6, 3, '1', '13:00', '16:00', GETDATE(), GETDATE()),  -- INF302 | Leblanc  | B201 | Lundi (2e groupe)
-- === ETE 2026 (semestre id=3) ===
(16, 3, 5,  1, 5, '1', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF301 | Tremblay | C301 | Lundi
(17, 3, 7,  2, 4, '2', '08:00', '11:00', GETDATE(), GETDATE()),  -- GES101 | Dupont   | B202 | Mardi
(18, 3, 11, 2, 8, '4', '08:00', '10:00', GETDATE(), GETDATE()),  -- COM101 | Dupont   | D102 | Jeudi
(19, 3, 12, 1, 7, '3', '08:00', '11:00', GETDATE(), GETDATE()),  -- ANA301 | Tremblay | D101 | Mercredi
-- === AUTOMNE 2025 (semestre id=1) ===
(20, 1, 1,  3, 1, '1', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF101 | Gagnon   | A101 | Lundi
(21, 1, 9,  5, 3, '2', '08:00', '11:00', GETDATE(), GETDATE()),  -- MAT101 | Bouchard | B201 | Mardi
(22, 1, 7,  7, 4, '1', '13:00', '16:00', GETDATE(), GETDATE()),  -- GES101 | Cote     | B202 | Lundi
(23, 1, 2,  3, 2, '3', '08:00', '11:00', GETDATE(), GETDATE()),  -- INF102 | Gagnon   | A102 | Mercredi
(24, 1, 3,  5, 5, '4', '08:00', '11:00', GETDATE(), GETDATE());  -- INF201 | Bouchard | C301 | Jeudi
SET IDENTITY_INSERT [dbo].[AffectationCours] OFF;
GO

-- ============================================================
-- 9. JOURS FERIES
-- ============================================================
SET IDENTITY_INSERT [dbo].[JourFerie] ON;
INSERT INTO [dbo].[JourFerie] (id, id_semestre, nom, date, createdAt, updatedAt) VALUES
-- Automne 2025 (id=1)
(1, 1, 'Action de grace',          '2025-10-13', GETDATE(), GETDATE()),
(2, 1, 'Remembrance Day',          '2025-11-11', GETDATE(), GETDATE()),
(3, 1, 'Conge pedagogique',        '2025-10-20', GETDATE(), GETDATE()),
-- Hiver 2026 (id=2)
(4, 2, 'Saint-Valentin conge',     '2026-02-16', GETDATE(), GETDATE()),
(5, 2, 'Conge de mars',            '2026-03-02', GETDATE(), GETDATE()),
(6, 2, 'Vendredi saint',           '2026-04-03', GETDATE(), GETDATE()),
(7, 2, 'Lundi de Paques',          '2026-04-06', GETDATE(), GETDATE()),
-- Ete 2026 (id=3)
(8, 3, 'Fete nationale du Quebec', '2026-06-24', GETDATE(), GETDATE()),
(9, 3, 'Fete du Canada',           '2026-07-01', GETDATE(), GETDATE());
SET IDENTITY_INSERT [dbo].[JourFerie] OFF;
GO

-- ============================================================
-- VERIFICATION FINALE
-- ============================================================
SELECT 'Utilisateurs' AS [Table], COUNT(*) AS [Nb] FROM [dbo].[Utilisateur]
UNION ALL SELECT 'Semestres',     COUNT(*) FROM [dbo].[Semestre]
UNION ALL SELECT 'Salles',        COUNT(*) FROM [dbo].[Salle]
UNION ALL SELECT 'Professeurs',   COUNT(*) FROM [dbo].[Professeur]
UNION ALL SELECT 'Cours',         COUNT(*) FROM [dbo].[Cours]
UNION ALL SELECT 'Disponibilites',COUNT(*) FROM [dbo].[Disponibilite]
UNION ALL SELECT 'Affectations',  COUNT(*) FROM [dbo].[AffectationCours]
UNION ALL SELECT 'JoursFeries',   COUNT(*) FROM [dbo].[JourFerie];
GO
