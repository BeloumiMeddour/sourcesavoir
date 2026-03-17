BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[AffectationCours] ALTER COLUMN [date] DATETIME2 NULL;
ALTER TABLE [dbo].[AffectationCours] ADD [id_semestre] INT,
[jour] NVARCHAR(1000),
[session] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[Semestre] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nom] NVARCHAR(1000) NOT NULL,
    [dateDebut] DATETIME2 NOT NULL,
    [dateFin] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Semestre_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Semestre_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Semestre_nom_key] UNIQUE NONCLUSTERED ([nom])
);

-- CreateTable
CREATE TABLE [dbo].[JourFerie] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATETIME2 NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [id_semestre] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [JourFerie_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [JourFerie_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [JourFerie_id_semestre_date_key] UNIQUE NONCLUSTERED ([id_semestre],[date])
);

-- AddForeignKey
ALTER TABLE [dbo].[JourFerie] ADD CONSTRAINT [JourFerie_id_semestre_fkey] FOREIGN KEY ([id_semestre]) REFERENCES [dbo].[Semestre]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AffectationCours] ADD CONSTRAINT [AffectationCours_id_semestre_fkey] FOREIGN KEY ([id_semestre]) REFERENCES [dbo].[Semestre]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
