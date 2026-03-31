SELECT s.nom AS Semestre, COUNT(a.id) AS 'Nombre Affectations'
FROM Semestre s
LEFT JOIN AffectationCours a ON a.id_semestre = s.id
GROUP BY s.nom, s.dateDebut
ORDER BY s.dateDebut DESC;

-- Vérifier les affectations pour Automne 2026
SELECT 'Affectations pour Automne 2026:' AS [---];
SELECT COUNT(*) FROM AffectationCours WHERE id_semestre = (SELECT id FROM Semestre WHERE nom = 'Automne 2026');

-- Vérifier les professeurs
SELECT 'Professeurs:' AS [---];
SELECT COUNT(*) FROM Professeur;

-- Afficher quelques affectations pour Automne 2026  
SELECT TOP 10 
    a.jour, 
    a.plageHoraire,
    c.code AS 'Code Cours',
    p.prenom + ' ' + p.nom AS 'Professeur',
    s.code AS 'Salle'
FROM AffectationCours a
JOIN Cours c ON a.id_cours = c.id
JOIN Professeur p ON a.id_professeur = p.id
JOIN Salle s ON a.id_salle = s.id
WHERE a.id_semestre = (SELECT id FROM Semestre WHERE nom = 'Automne 2026')
ORDER BY a.jour, a.plageHoraire;
