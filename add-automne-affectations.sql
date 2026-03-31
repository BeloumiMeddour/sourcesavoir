-- ===========================
-- AFFECTATIONS POUR AUTOMNE 2026 (copie des affectations Hiver 2026)
-- ===========================
DECLARE @sem_automne INT, @cours_id_base INT, @prof_id_min INT, @salle_id_min INT;
SELECT @sem_automne = id FROM Semestre WHERE nom = 'Automne 2026';
SELECT @cours_id_base = MIN(id) FROM Cours;
SELECT @prof_id_min = MIN(id) FROM Professeur;
SELECT @salle_id_min = MIN(id) FROM Salle;

-- GÉNIE INFORMATIQUE - 50 affectations
INSERT INTO AffectationCours (id_cours, id_salle, id_semestre, jour, plageHoraire, id_professeur, createdAt, updatedAt) VALUES
    (@cours_id_base + 0, @salle_id_min + 0, @sem_automne, 'Lundi', '08:00-11:00', @prof_id_min + 0, GETDATE(), GETDATE()),
    (@cours_id_base + 0, @salle_id_min + 0, @sem_automne, 'Jeudi', '08:00-11:00', @prof_id_min + 0, GETDATE(), GETDATE()),
    (@cours_id_base + 1, @salle_id_min + 1, @sem_automne, 'Mardi', '09:00-12:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 1, @salle_id_min + 1, @sem_automne, 'Vendredi', '09:00-12:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 2, @salle_id_min + 2, @sem_automne, 'Lundi', '13:00-16:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 2, @salle_id_min + 2, @sem_automne, 'Mercredi', '13:00-16:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 3, @salle_id_min + 3, @sem_automne, 'Mardi', '13:00-16:00', @prof_id_min + 6, GETDATE(), GETDATE()),
    (@cours_id_base + 3, @salle_id_min + 3, @sem_automne, 'Jeudi', '13:00-16:00', @prof_id_min + 6, GETDATE(), GETDATE()),
    (@cours_id_base + 4, @salle_id_min + 4, @sem_automne, 'Lundi', '08:00-11:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 4, @salle_id_min + 4, @sem_automne, 'Jeudi', '08:00-11:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 5, @salle_id_min + 0, @sem_automne, 'Mardi', '13:00-16:00', @prof_id_min + 3, GETDATE(), GETDATE()),
    (@cours_id_base + 5, @salle_id_min + 0, @sem_automne, 'Vendredi', '13:00-16:00', @prof_id_min + 3, GETDATE(), GETDATE()),
    (@cours_id_base + 6, @salle_id_min + 1, @sem_automne, 'Mercredi', '08:00-11:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 6, @salle_id_min + 1, @sem_automne, 'Jeudi', '08:00-11:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 7, @salle_id_min + 8, @sem_automne, 'Lundi', '13:00-15:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 7, @salle_id_min + 8, @sem_automne, 'Mercredi', '13:00-15:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 8, @salle_id_min + 2, @sem_automne, 'Mardi', '08:00-11:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 8, @salle_id_min + 2, @sem_automne, 'Vendredi', '08:00-11:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 9, @salle_id_min + 3, @sem_automne, 'Lundi', '08:00-11:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 9, @salle_id_min + 3, @sem_automne, 'Mercredi', '08:00-11:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 10, @salle_id_min + 4, @sem_automne, 'Mardi', '08:00-11:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 10, @salle_id_min + 4, @sem_automne, 'Jeudi', '08:00-11:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 11, @salle_id_min + 5, @sem_automne, 'Lundi', '14:00-16:00', @prof_id_min + 8, GETDATE(), GETDATE()),
    (@cours_id_base + 11, @salle_id_min + 5, @sem_automne, 'Mercredi', '14:00-16:00', @prof_id_min + 8, GETDATE(), GETDATE()),
    (@cours_id_base + 12, @salle_id_min + 6, @sem_automne, 'Mardi', '14:00-17:00', @prof_id_min + 9, GETDATE(), GETDATE()),
    (@cours_id_base + 12, @salle_id_min + 6, @sem_automne, 'Jeudi', '14:00-17:00', @prof_id_min + 9, GETDATE(), GETDATE()),
    (@cours_id_base + 13, @salle_id_min + 7, @sem_automne, 'Mercredi', '08:00-11:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 13, @salle_id_min + 7, @sem_automne, 'Vendredi', '08:00-11:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 14, @salle_id_min + 0, @sem_automne, 'Lundi', '09:00-11:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 14, @salle_id_min + 0, @sem_automne, 'Jeudi', '09:00-11:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 0, @salle_id_min + 1, @sem_automne, 'Mercredi', '09:00-12:00', @prof_id_min + 0, GETDATE(), GETDATE()),
    (@cours_id_base + 1, @salle_id_min + 2, @sem_automne, 'Lundi', '14:00-17:00', @prof_id_min + 6, GETDATE(), GETDATE()),
    (@cours_id_base + 2, @salle_id_min + 3, @sem_automne, 'Mardi', '09:00-12:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 3, @salle_id_min + 4, @sem_automne, 'Vendredi', '08:00-11:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 4, @salle_id_min + 5, @sem_automne, 'Mercredi', '08:00-11:00', @prof_id_min + 3, GETDATE(), GETDATE()),
    (@cours_id_base + 5, @salle_id_min + 6, @sem_automne, 'Lundi', '13:00-16:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 6, @salle_id_min + 7, @sem_automne, 'Mardi', '13:00-16:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 7, @salle_id_min + 8, @sem_automne, 'Jeudi', '09:00-11:00', @prof_id_min + 6, GETDATE(), GETDATE()),
    (@cours_id_base + 8, @salle_id_min + 0, @sem_automne, 'Mercredi', '13:00-16:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 9, @salle_id_min + 1, @sem_automne, 'Mardi', '09:00-12:00', @prof_id_min + 8, GETDATE(), GETDATE()),
    (@cours_id_base + 10, @salle_id_min + 2, @sem_automne, 'Vendredi', '13:00-16:00', @prof_id_min + 9, GETDATE(), GETDATE()),
    (@cours_id_base + 11, @salle_id_min + 3, @sem_automne, 'Jeudi', '09:00-11:00', @prof_id_min + 7, GETDATE(), GETDATE()),
    (@cours_id_base + 12, @salle_id_min + 4, @sem_automne, 'Lundi', '09:00-12:00', @prof_id_min + 8, GETDATE(), GETDATE()),
    (@cours_id_base + 13, @salle_id_min + 5, @sem_automne, 'Mercredi', '09:00-11:00', @prof_id_min + 9, GETDATE(), GETDATE()),
    (@cours_id_base + 14, @salle_id_min + 6, @sem_automne, 'Mardi', '09:00-12:00', @prof_id_min + 0, GETDATE(), GETDATE()),
    (@cours_id_base + 0, @salle_id_min + 7, @sem_automne, 'Jeudi', '09:00-12:00', @prof_id_min + 1, GETDATE(), GETDATE()),
    (@cours_id_base + 1, @salle_id_min + 8, @sem_automne, 'Vendredi', '13:00-16:00', @prof_id_min + 2, GETDATE(), GETDATE()),
    (@cours_id_base + 2, @salle_id_min + 0, @sem_automne, 'Lundi', '14:00-17:00', @prof_id_min + 3, GETDATE(), GETDATE()),
    (@cours_id_base + 3, @salle_id_min + 1, @sem_automne, 'Mercredi', '14:00-17:00', @prof_id_min + 4, GETDATE(), GETDATE()),
    (@cours_id_base + 4, @salle_id_min + 2, @sem_automne, 'Jeudi', '14:00-17:00', @prof_id_min + 5, GETDATE(), GETDATE()),
    (@cours_id_base + 5, @salle_id_min + 3, @sem_automne, 'Vendredi', '09:00-12:00', @prof_id_min + 6, GETDATE(), GETDATE());

-- GÉNIE RÉSEAUX - 40 affectations
INSERT INTO AffectationCours (id_cours, id_salle, id_semestre, jour, plageHoraire, id_professeur, createdAt, updatedAt) VALUES
    (@cours_id_base + 15, @salle_id_min + 0, @sem_automne, 'Lundi', '08:00-11:00', @prof_id_min + 10, GETDATE(), GETDATE()),
    (@cours_id_base + 15, @salle_id_min + 0, @sem_automne, 'Jeudi', '08:00-11:00', @prof_id_min + 10, GETDATE(), GETDATE()),
    (@cours_id_base + 16, @salle_id_min + 1, @sem_automne, 'Mardi', '09:00-12:00', @prof_id_min + 11, GETDATE(), GETDATE()),
    (@cours_id_base + 16, @salle_id_min + 1, @sem_automne, 'Vendredi', '09:00-12:00', @prof_id_min + 11, GETDATE(), GETDATE()),
    (@cours_id_base + 17, @salle_id_min + 2, @sem_automne, 'Lundi', '13:00-16:00', @prof_id_min + 13, GETDATE(), GETDATE()),
    (@cours_id_base + 17, @salle_id_min + 2, @sem_automne, 'Mercredi', '13:00-16:00', @prof_id_min + 13, GETDATE(), GETDATE()),
    (@cours_id_base + 18, @salle_id_min + 3, @sem_automne, 'Mardi', '13:00-16:00', @prof_id_min + 14, GETDATE(), GETDATE()),
    (@cours_id_base + 18, @salle_id_min + 3, @sem_automne, 'Jeudi', '13:00-16:00', @prof_id_min + 14, GETDATE(), GETDATE()),
    (@cours_id_base + 19, @salle_id_min + 4, @sem_automne, 'Lundi', '08:00-11:00', @prof_id_min + 12, GETDATE(), GETDATE()),
    (@cours_id_base + 19, @salle_id_min + 4, @sem_automne, 'Jeudi', '08:00-11:00', @prof_id_min + 12, GETDATE(), GETDATE()),
    (@cours_id_base + 20, @salle_id_min + 9, @sem_automne, 'Mardi', '13:00-15:00', @prof_id_min + 15, GETDATE(), GETDATE()),
    (@cours_id_base + 20, @salle_id_min + 9, @sem_automne, 'Vendredi', '13:00-15:00', @prof_id_min + 15, GETDATE(), GETDATE()),
    (@cours_id_base + 21, @salle_id_min + 5, @sem_automne, 'Mercredi', '08:00-11:00', @prof_id_min + 16, GETDATE(), GETDATE()),
    (@cours_id_base + 21, @salle_id_min + 5, @sem_automne, 'Jeudi', '08:00-11:00', @prof_id_min + 16, GETDATE(), GETDATE()),
    (@cours_id_base + 22, @salle_id_min + 10, @sem_automne, 'Lundi', '13:00-15:00', @prof_id_min + 17, GETDATE(), GETDATE()),
    (@cours_id_base + 22, @salle_id_min + 10, @sem_automne, 'Mercredi', '13:00-15:00', @prof_id_min + 17, GETDATE(), GETDATE()),
    (@cours_id_base + 23, @salle_id_min + 6, @sem_automne, 'Mardi', '08:00-11:00', @prof_id_min + 11, GETDATE(), GETDATE()),
    (@cours_id_base + 23, @salle_id_min + 6, @sem_automne, 'Vendredi', '08:00-11:00', @prof_id_min + 11, GETDATE(), GETDATE()),
    (@cours_id_base + 24, @salle_id_min + 7, @sem_automne, 'Lundi', '08:00-11:00', @prof_id_min + 12, GETDATE(), GETDATE()),
    (@cours_id_base + 24, @salle_id_min + 7, @sem_automne, 'Mercredi', '08:00-11:00', @prof_id_min + 12, GETDATE(), GETDATE());

-- GÉNIE GÉNÉRAL - 35 affectations
INSERT INTO AffectationCours (id_cours, id_salle, id_semestre, jour, plageHoraire, id_professeur, createdAt, updatedAt) VALUES
    (@cours_id_base + 27, @salle_id_min + 8, @sem_automne, 'Lundi', '08:00-11:00', @prof_id_min + 19, GETDATE(), GETDATE()),
    (@cours_id_base + 27, @salle_id_min + 8, @sem_automne, 'Jeudi', '08:00-11:00', @prof_id_min + 19, GETDATE(), GETDATE()),
    (@cours_id_base + 28, @salle_id_min + 9, @sem_automne, 'Mardi', '09:00-12:00', @prof_id_min + 20, GETDATE(), GETDATE()),
    (@cours_id_base + 28, @salle_id_min + 9, @sem_automne, 'Vendredi', '09:00-12:00', @prof_id_min + 20, GETDATE(), GETDATE()),
    (@cours_id_base + 29, @salle_id_min + 0, @sem_automne, 'Lundi', '13:00-16:00', @prof_id_min + 18, GETDATE(), GETDATE()),
    (@cours_id_base + 29, @salle_id_min + 0, @sem_automne, 'Mercredi', '13:00-16:00', @prof_id_min + 18, GETDATE(), GETDATE()),
    (@cours_id_base + 30, @salle_id_min + 1, @sem_automne, 'Mardi', '13:00-16:00', @prof_id_min + 21, GETDATE(), GETDATE()),
    (@cours_id_base + 30, @salle_id_min + 1, @sem_automne, 'Jeudi', '13:00-16:00', @prof_id_min + 21, GETDATE(), GETDATE()),
    (@cours_id_base + 31, @salle_id_min + 2, @sem_automne, 'Lundi', '08:00-11:00', @prof_id_min + 22, GETDATE(), GETDATE()),
    (@cours_id_base + 31, @salle_id_min + 2, @sem_automne, 'Jeudi', '08:00-11:00', @prof_id_min + 22, GETDATE(), GETDATE());

SELECT 'Affectations pour Automne 2026 créées avec succès!' AS Message;
SELECT COUNT(*) AS 'Nombre d''affectations Automne 2026' FROM AffectationCours WHERE id_semestre = @sem_automne;
