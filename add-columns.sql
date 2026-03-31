-- ===========================
-- AJOUTER LES COLONNES MANQUANTES
-- ===========================

-- Ajouter la colonne 'programme' à Professeur si elle n'existe pas
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Professeur' AND COLUMN_NAME = 'programme')
BEGIN
    ALTER TABLE Professeur ADD programme NVARCHAR(255) NULL;
    PRINT 'Colonne programme ajoutée à Professeur';
END
ELSE
BEGIN
    PRINT 'Colonne programme existe déjà';
END

-- Vérifier que chargeMax existe (devrait exister)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Professeur' AND COLUMN_NAME = 'chargeMax')
BEGIN
    ALTER TABLE Professeur ADD chargeMax INT DEFAULT 30;
    PRINT 'Colonne chargeMax ajoutée à Professeur';
END
ELSE
BEGIN
    PRINT 'Colonne chargeMax existe déjà';
END

-- ===========================
-- AJOUTER LES COLONNES MANQUANTES À AFFECTATIONCOURS
-- ===========================

-- Ajouter la colonne 'id_semestre' à AffectationCours si elle n'existe pas
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AffectationCours' AND COLUMN_NAME = 'id_semestre')
BEGIN
    ALTER TABLE AffectationCours ADD id_semestre INT NULL;
    PRINT 'Colonne id_semestre ajoutée à AffectationCours';
END
ELSE
BEGIN
    PRINT 'Colonne id_semestre existe déjà';
END

-- Ajouter la colonne 'jour' à AffectationCours si elle n'existe pas
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AffectationCours' AND COLUMN_NAME = 'jour')
BEGIN
    ALTER TABLE AffectationCours ADD jour NVARCHAR(50) NULL;
    PRINT 'Colonne jour ajoutée à AffectationCours';
END
ELSE
BEGIN
    PRINT 'Colonne jour existe déjà';
END

-- Ajouter la colonne 'session' à AffectationCours si elle n'existe pas
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AffectationCours' AND COLUMN_NAME = 'session')
BEGIN
    ALTER TABLE AffectationCours ADD session NVARCHAR(MAX) NULL;
    PRINT 'Colonne session ajoutée à AffectationCours';
END
ELSE
BEGIN
    PRINT 'Colonne session existe déjà';
END

-- Ajouter la colonne 'date' à AffectationCours si elle n'existe pas
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AffectationCours' AND COLUMN_NAME = 'date')
BEGIN
    ALTER TABLE AffectationCours ADD date DATETIME2 NULL;
    PRINT 'Colonne date ajoutée à AffectationCours';
END
ELSE
BEGIN
    PRINT 'Colonne date existe déjà';
END

-- ===========================
-- VÉRIFICATION FINALE
-- ===========================

PRINT '=== Professeur Schema ===';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Professeur'
ORDER BY ORDINAL_POSITION;

PRINT '=== AffectationCours Schema ===';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'AffectationCours'
ORDER BY ORDINAL_POSITION;
