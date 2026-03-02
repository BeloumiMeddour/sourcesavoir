/*
  Warnings:

  - Added the required column `etapeEtude` to the `Cours` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[AffectationCours] DROP CONSTRAINT [AffectationCours_id_professeur_fkey];

-- AlterTable
ALTER TABLE [dbo].[AffectationCours] ALTER COLUMN [id_professeur] INT NULL;

-- AlterTable
ALTER TABLE [dbo].[Cours] ADD [etapeEtude] NVARCHAR(1000) NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[AffectationCours] ADD CONSTRAINT [AffectationCours_id_professeur_fkey] FOREIGN KEY ([id_professeur]) REFERENCES [dbo].[Professeur]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
