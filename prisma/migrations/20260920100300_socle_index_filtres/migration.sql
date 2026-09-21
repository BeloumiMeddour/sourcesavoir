-- Index UNIQUE filtrés et contrainte CHECK du socle scolaire (SQL écrit à la main).
--
-- Prisma ne sait pas modéliser un index filtré : ce fichier n'a donc pas d'équivalent dans
-- schema.prisma. Le moteur de migration ignore les index filtrés à l'introspection
-- (sys.indexes.filter_definition IS NULL), donc ils ne créent pas de dérive.
--
-- SQL Server n'accepte qu'UN SEUL NULL dans un index UNIQUE ordinaire : l'unicité 0..1 de
-- id_user (plusieurs profils sans compte, un seul profil par compte) passe par un index
-- filtré WHERE id_user IS NOT NULL.
--
-- Les options de session ci-dessous sont obligatoires pour créer un index filtré.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

BEGIN TRY

BEGIN TRAN;

-- Un compte utilisateur ne peut être rattaché qu'à un seul professeur
CREATE UNIQUE NONCLUSTERED INDEX [Professeur_id_user_uq] ON [dbo].[Professeur]([id_user]) WHERE [id_user] IS NOT NULL;

-- Un compte utilisateur ne peut être rattaché qu'à un seul élève
CREATE UNIQUE NONCLUSTERED INDEX [Eleve_id_user_uq] ON [dbo].[Eleve]([id_user]) WHERE [id_user] IS NOT NULL;

-- Un compte utilisateur ne peut être rattaché qu'à un seul tuteur
CREATE UNIQUE NONCLUSTERED INDEX [Tuteur_id_user_uq] ON [dbo].[Tuteur]([id_user]) WHERE [id_user] IS NOT NULL;

-- Un élève n'a qu'une seule inscription active par année scolaire
CREATE UNIQUE NONCLUSTERED INDEX [Inscription_eleve_annee_active_uq] ON [dbo].[Inscription]([id_eleve],[id_annee]) WHERE [statut] = 'active';

-- Valeurs autorisées pour le statut d'une inscription (table créée vide par la migration précédente)
ALTER TABLE [dbo].[Inscription] ADD CONSTRAINT [Inscription_statut_ck] CHECK ([statut] IN ('active','terminee','annulee'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
