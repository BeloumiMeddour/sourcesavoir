-- ============================================================================
-- Retour arrière EXPLICITE du socle scolaire (Étape 1)
-- ============================================================================
-- Ce fichier est volontairement HORS de prisma/migrations : Prisma ne l'exécute
-- jamais. C'est un outil manuel, à lancer avec sqlcmd / Azure Data Studio, et
-- uniquement sur une base jetable (jamais sur la base réelle : là, un retour
-- arrière se fait par une NOUVELLE migration « avant », jamais en modifiant ni
-- en supprimant une migration déjà déployée).
--
-- Ordre inverse de l'application :
--   1) 20260920100300_socle_index_filtres      (M3)
--   2) 20260920100200_socle_liens_nullables    (M2)
--   3) 20260920100100_socle_tables             (M1)
--   M0 (20260920100000_user_etat) n'est PAS défaite, voir plus bas.
--
-- Garde-fou : le script refuse de s'exécuter si le socle contient des données.
-- Pour accepter la perte de ces données (base jetable), passer @forcer à 1.
--
-- Avec @forcer = 1, le script refuse aussi de s'exécuter si le nom de la base
-- courante (DB_NAME()) ne contient pas, comme segment entier, « jetable »,
-- « scratch » ou « test ». Les segments sont délimités par _ - . ou par les
-- bornes du nom (les3s_scratch_142530 passe ; latest, contest, prod ne passent pas).
--
-- Après exécution, l'historique Prisma est nettoyé (lignes M1, M2, M3 retirées
-- de _prisma_migrations) pour que « prisma migrate deploy » puisse réappliquer
-- ces migrations sur la base jetable.
-- ============================================================================

-- Options de session requises par les index filtrés (sqlcmd les désactive par défaut)
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @forcer BIT = 0; -- 1 = accepter la suppression des données du socle

BEGIN TRY

-- ---------------------------------------------------------------------------
-- Garde-fou de la base : @forcer = 1 n'est admis que sur une base jetable.
-- Le nom est entouré de « _ » puis comparé segment par segment (LIKE avec
-- échappement : « _ » est sinon un joker). Aucune recherche de sous-chaîne.
-- ---------------------------------------------------------------------------
DECLARE @segments NVARCHAR(300) = N'_' + REPLACE(REPLACE(LOWER(DB_NAME()), N'-', N'_'), N'.', N'_') + N'_';
IF @forcer = 1 AND NOT (
       @segments LIKE N'%\_jetable\_%' ESCAPE N'\'
    OR @segments LIKE N'%\_scratch\_%' ESCAPE N'\'
    OR @segments LIKE N'%\_test\_%' ESCAPE N'\'
)
BEGIN
    THROW 51001, N'Retour arriere force refuse : le nom de la base courante ne contient pas de segment jetable, scratch ou test.', 1;
END;

BEGIN TRAN;

-- ---------------------------------------------------------------------------
-- Garde-fou : refuse si le socle contient des données (sauf @forcer = 1)
-- ---------------------------------------------------------------------------
IF @forcer = 0 AND (
       EXISTS (SELECT 1 FROM [dbo].[AnneeScolaire])
    OR EXISTS (SELECT 1 FROM [dbo].[Niveau])
    OR EXISTS (SELECT 1 FROM [dbo].[Groupe])
    OR EXISTS (SELECT 1 FROM [dbo].[Eleve])
    OR EXISTS (SELECT 1 FROM [dbo].[Tuteur])
    OR EXISTS (SELECT 1 FROM [dbo].[LienEleveTuteur])
    OR EXISTS (SELECT 1 FROM [dbo].[Inscription])
    OR EXISTS (SELECT 1 FROM [dbo].[Professeur] WHERE [id_user] IS NOT NULL)
    OR EXISTS (SELECT 1 FROM [dbo].[Semestre] WHERE [id_annee] IS NOT NULL)
    OR EXISTS (SELECT 1 FROM [dbo].[AffectationCours] WHERE [id_groupe] IS NOT NULL)
)
BEGIN
    THROW 51000, N'Retour arriere refuse : le socle scolaire contient des donnees. Sauvegarder puis, sur une base jetable seulement, passer @forcer a 1.', 1;
END;

-- ---------------------------------------------------------------------------
-- 1) Défaire M3 : 20260920100300_socle_index_filtres
-- ---------------------------------------------------------------------------
ALTER TABLE [dbo].[Inscription] DROP CONSTRAINT [Inscription_statut_ck];

DROP INDEX [Inscription_eleve_annee_active_uq] ON [dbo].[Inscription];
DROP INDEX [Tuteur_id_user_uq] ON [dbo].[Tuteur];
DROP INDEX [Eleve_id_user_uq] ON [dbo].[Eleve];
DROP INDEX [Professeur_id_user_uq] ON [dbo].[Professeur];

-- ---------------------------------------------------------------------------
-- 2) Défaire M2 : 20260920100200_socle_liens_nullables
--    (clés étrangères, puis index, puis colonnes)
-- ---------------------------------------------------------------------------
ALTER TABLE [dbo].[AffectationCours] DROP CONSTRAINT [AffectationCours_id_groupe_fkey];
ALTER TABLE [dbo].[Semestre] DROP CONSTRAINT [Semestre_id_annee_fkey];
ALTER TABLE [dbo].[Professeur] DROP CONSTRAINT [Professeur_id_user_fkey];

DROP INDEX [AffectationCours_id_professeur_idx] ON [dbo].[AffectationCours];
DROP INDEX [AffectationCours_id_groupe_idx] ON [dbo].[AffectationCours];
DROP INDEX [Semestre_id_annee_idx] ON [dbo].[Semestre];

ALTER TABLE [dbo].[AffectationCours] DROP COLUMN [id_groupe];
ALTER TABLE [dbo].[Semestre] DROP COLUMN [id_annee];
ALTER TABLE [dbo].[Professeur] DROP COLUMN [id_user];

-- ---------------------------------------------------------------------------
-- 3) Défaire M1 : 20260920100100_socle_tables
--    (clés étrangères, puis tables des plus dépendantes aux moins dépendantes ;
--     les index propres à chaque table disparaissent avec elle)
-- ---------------------------------------------------------------------------
ALTER TABLE [dbo].[Inscription] DROP CONSTRAINT [Inscription_id_groupe_id_annee_fkey];
ALTER TABLE [dbo].[Inscription] DROP CONSTRAINT [Inscription_id_eleve_fkey];
ALTER TABLE [dbo].[LienEleveTuteur] DROP CONSTRAINT [LienEleveTuteur_id_tuteur_fkey];
ALTER TABLE [dbo].[LienEleveTuteur] DROP CONSTRAINT [LienEleveTuteur_id_eleve_fkey];
ALTER TABLE [dbo].[Tuteur] DROP CONSTRAINT [Tuteur_id_user_fkey];
ALTER TABLE [dbo].[Eleve] DROP CONSTRAINT [Eleve_id_user_fkey];
ALTER TABLE [dbo].[Groupe] DROP CONSTRAINT [Groupe_id_niveau_fkey];
ALTER TABLE [dbo].[Groupe] DROP CONSTRAINT [Groupe_id_annee_fkey];

DROP TABLE [dbo].[Inscription];
DROP TABLE [dbo].[LienEleveTuteur];
DROP TABLE [dbo].[Tuteur];
DROP TABLE [dbo].[Eleve];
DROP TABLE [dbo].[Groupe];
DROP TABLE [dbo].[Niveau];
DROP TABLE [dbo].[AnneeScolaire];

-- ---------------------------------------------------------------------------
-- 4) M0 (20260920100000_user_etat) : NON défaite, volontairement
-- ---------------------------------------------------------------------------
-- M0 ajoute User.etat, une colonne que l'application utilise DÉJÀ (le schéma et
-- le code la portent depuis avant le socle : M0 ne fait que rattraper une dérive
-- de l'historique). La supprimer casserait l'application en cours (validation
-- des comptes « en_attente ») et détruirait des données qui ne proviennent pas
-- du socle. M0 reste donc appliquée et reste dans _prisma_migrations.

-- ---------------------------------------------------------------------------
-- 5) Historique Prisma : oublier M1, M2, M3 (pas M0)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'[dbo].[_prisma_migrations]', N'U') IS NOT NULL
BEGIN
    DELETE FROM [dbo].[_prisma_migrations]
    WHERE [migration_name] IN (
        N'20260920100300_socle_index_filtres',
        N'20260920100200_socle_liens_nullables',
        N'20260920100100_socle_tables'
    );
END;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
