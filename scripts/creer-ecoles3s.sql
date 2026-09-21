-- Crée la base ecoles3S comme COPIE de la base Planify : sauvegarde, contrôle, restauration.
-- La base Planify n'est PAS modifiée : elle reste intacte comme filet de sécurité.
--
-- Usage (SQL Server local, authentification Windows) :
--   sqlcmd -S localhost -E -C -b -i scripts\creer-ecoles3s.sql
--
-- Le script s'arrête sans rien modifier si ecoles3S existe déjà ou si Planify est introuvable.
-- Retour arrière : DROP DATABASE ecoles3S, puis supprimer le fichier .bak du dossier de sauvegarde.
SET NOCOUNT ON;

IF DB_ID('Planify') IS NULL
    THROW 50000, 'La base Planify est introuvable : arrêt, rien n''est modifié.', 1;
IF DB_ID('ecoles3S') IS NOT NULL
    THROW 50000, 'La base ecoles3S existe déjà : arrêt, rien n''est modifié.', 1;
IF (SELECT COUNT(*) FROM sys.master_files WHERE database_id = DB_ID('Planify') AND type IN (0, 1)) <> 2
    THROW 50000, 'Planify a plus d''un fichier de données ou de journal : copie manuelle nécessaire, arrêt.', 1;

DECLARE @dossierSauvegarde NVARCHAR(400) = CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS NVARCHAR(400));
DECLARE @dossierDonnees NVARCHAR(400) = CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS NVARCHAR(400));
IF RIGHT(@dossierSauvegarde, 1) <> N'\' SET @dossierSauvegarde += N'\';
IF RIGHT(@dossierDonnees, 1) <> N'\' SET @dossierDonnees += N'\';

DECLARE @fichier NVARCHAR(500) = @dossierSauvegarde + N'Planify_avant_ecoles3S.bak';
DECLARE @logiqueDonnees SYSNAME = (SELECT name FROM sys.master_files WHERE database_id = DB_ID('Planify') AND type = 0);
DECLARE @logiqueJournal SYSNAME = (SELECT name FROM sys.master_files WHERE database_id = DB_ID('Planify') AND type = 1);
DECLARE @cheminDonnees NVARCHAR(500) = @dossierDonnees + N'ecoles3S.mdf';
DECLARE @cheminJournal NVARCHAR(500) = @dossierDonnees + N'ecoles3S_log.ldf';

PRINT N'1/3 Sauvegarde de Planify (copie seule, avec somme de contrôle) : ' + @fichier;
BACKUP DATABASE [Planify] TO DISK = @fichier
    WITH COPY_ONLY, CHECKSUM, INIT, NAME = N'Planify avant ecoles3S';

PRINT N'2/3 Contrôle que la sauvegarde est relisible';
RESTORE VERIFYONLY FROM DISK = @fichier WITH CHECKSUM;

PRINT N'3/3 Création de ecoles3S à partir de la sauvegarde';
RESTORE DATABASE [ecoles3S] FROM DISK = @fichier
    WITH MOVE @logiqueDonnees TO @cheminDonnees, MOVE @logiqueJournal TO @cheminJournal;

PRINT N'Contrôle : nombre de lignes par table dans les deux bases';
SELECT a.nom AS [table], a.n AS Planify, b.n AS ecoles3S,
       IIF(a.n = b.n, N'identique', N'DIFFERENT') AS controle
FROM (SELECT t.name AS nom, CAST(SUM(p.rows) AS INT) AS n
      FROM Planify.sys.tables t
      JOIN Planify.sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
      GROUP BY t.name) a
JOIN (SELECT t.name AS nom, CAST(SUM(p.rows) AS INT) AS n
      FROM ecoles3S.sys.tables t
      JOIN ecoles3S.sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
      GROUP BY t.name) b ON a.nom = b.nom
ORDER BY a.nom;
