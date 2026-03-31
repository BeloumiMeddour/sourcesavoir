-- Vérifier l'état de la base de données
SELECT 'Professeurs' AS Type, COUNT(*) AS Nombre FROM Professeur
UNION ALL
SELECT 'Cours', COUNT(*) FROM Cours
UNION ALL
SELECT 'Salles', COUNT(*) FROM Salle
UNION ALL
SELECT 'Semestres', COUNT(*) FROM Semestre
UNION ALL
SELECT 'Disponibilités', COUNT(*) FROM Disponibilite
UNION ALL
SELECT 'Affectations', COUNT(*) FROM AffectationCours
ORDER BY Type;

-- Vérifier les données de chaque table un peu plus en détail
SELECT 'Disponibilités avec profs:' AS CheckType;
SELECT TOP 5 p.prenom + ' ' + p.nom AS Prof, d.jour, d.plageHoraire
FROM Disponibilite d
JOIN Professeur p ON d.id_professeur = p.id;

SELECT 'Affectations:' AS CheckType;
SELECT TOP 5 c.code, p.prenom + ' ' + p.nom AS Prof, s.code AS Salle, a.jour, a.plageHoraire
FROM AffectationCours a
JOIN Cours c ON a.id_cours = c.id
JOIN Professeur p ON a.id_professeur = p.id
JOIN Salle s ON a.id_salle = s.id;
