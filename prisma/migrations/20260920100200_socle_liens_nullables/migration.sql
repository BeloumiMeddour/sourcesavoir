BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Professeur] ADD [id_user] INT;

-- AlterTable
ALTER TABLE [dbo].[Semestre] ADD [id_annee] INT;

-- AlterTable
ALTER TABLE [dbo].[AffectationCours] ADD [id_groupe] INT;

-- CreateIndex
CREATE NONCLUSTERED INDEX [Semestre_id_annee_idx] ON [dbo].[Semestre]([id_annee]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AffectationCours_id_groupe_idx] ON [dbo].[AffectationCours]([id_groupe]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AffectationCours_id_professeur_idx] ON [dbo].[AffectationCours]([id_professeur]);

-- AddForeignKey
ALTER TABLE [dbo].[Professeur] ADD CONSTRAINT [Professeur_id_user_fkey] FOREIGN KEY ([id_user]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Semestre] ADD CONSTRAINT [Semestre_id_annee_fkey] FOREIGN KEY ([id_annee]) REFERENCES [dbo].[AnneeScolaire]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AffectationCours] ADD CONSTRAINT [AffectationCours_id_groupe_fkey] FOREIGN KEY ([id_groupe]) REFERENCES [dbo].[Groupe]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

