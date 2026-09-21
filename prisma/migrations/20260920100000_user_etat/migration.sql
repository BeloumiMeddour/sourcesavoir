BEGIN TRY

BEGIN TRAN;

-- AlterTable
-- Rattrapage : les comptes existants sont anterieurs a la validation des comptes,
-- ils sont donc valides. Le defaut TEMPORAIRE 'valide' remplit la colonne pour
-- eux ; il est retire aussitot puis remplace par le defaut definitif attendu par
-- Prisma (@default("en_attente")) : les comptes crees apres M0 restent en attente.
ALTER TABLE [dbo].[User] ADD [etat] NVARCHAR(1000) NOT NULL CONSTRAINT [User_etat_tmp_df] DEFAULT 'valide';
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_etat_tmp_df];
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_etat_df] DEFAULT 'en_attente' FOR [etat];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

