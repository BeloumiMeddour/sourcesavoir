-- Fix JourFerie insertion using direct IDs
-- From previous query: Hiver 2026 = 21, Été 2026 = 22
DELETE FROM JourFerie;

INSERT INTO JourFerie (id_semestre, date, description, createdAt) VALUES
    (21, '2026-02-16', 'Journée relâche', GETDATE()),
    (21, '2026-03-30', 'Lundi de Pâques', GETDATE()),
    (22, '2026-07-01', 'Fête du Canada', GETDATE()),
    (22, '2026-09-07', 'Fête du Travail', GETDATE()),
    (22, '2026-10-12', 'Thanksgiving', GETDATE());

-- Final statistics
SELECT 'Test Data Population Complete - Final Statistics' AS [===== RÉSUMÉ =====];
SELECT '---' AS [---];
SELECT 'Semestres' AS Type, COUNT(*) AS Nombre FROM Semestre
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
SELECT 'Utilisateurs', COUNT(*) FROM [User]
ORDER BY Type;
