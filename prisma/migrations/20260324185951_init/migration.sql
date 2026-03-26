BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'user',
    [nom] NVARCHAR(1000),
    [prenom] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Cours] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL,
    [nom] NVARCHAR(1000) NOT NULL,
    [duree] INT NOT NULL,
    [programme] NVARCHAR(1000) NOT NULL,
    [etapeEtude] NVARCHAR(1000) NOT NULL CONSTRAINT [Cours_etapeEtude_df] DEFAULT '',
    [typeSalle] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Cours_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Cours_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Cours_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Salle] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [capacite] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Salle_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Salle_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Salle_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Professeur] (
    [id] INT NOT NULL IDENTITY(1,1),
    [matricule] NVARCHAR(1000) NOT NULL,
    [nom] NVARCHAR(1000) NOT NULL,
    [prenom] NVARCHAR(1000) NOT NULL,
    [specialite] NVARCHAR(1000) NOT NULL,
    [chargeMax] INT NOT NULL CONSTRAINT [Professeur_chargeMax_df] DEFAULT 30,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Professeur_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Professeur_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Professeur_matricule_key] UNIQUE NONCLUSTERED ([matricule])
);

-- CreateTable
CREATE TABLE [dbo].[Disponibilite] (
    [id] INT NOT NULL IDENTITY(1,1),
    [jour] NVARCHAR(1000) NOT NULL,
    [plageHoraire] NVARCHAR(1000) NOT NULL,
    [typeConflit] NVARCHAR(1000) NOT NULL,
    [id_professeur] INT,
    [id_salle] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Disponibilite_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Disponibilite_pkey] PRIMARY KEY CLUSTERED ([id])
);

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

-- CreateTable
CREATE TABLE [dbo].[AffectationCours] (
    [id] INT NOT NULL IDENTITY(1,1),
    [session] NVARCHAR(1000),
    [jour] NVARCHAR(1000),
    [plageHoraire] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2,
    [id_cours] INT NOT NULL,
    [id_professeur] INT,
    [id_salle] INT NOT NULL,
    [id_semestre] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AffectationCours_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AffectationCours_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Disponibilite] ADD CONSTRAINT [Disponibilite_id_professeur_fkey] FOREIGN KEY ([id_professeur]) REFERENCES [dbo].[Professeur]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Disponibilite] ADD CONSTRAINT [Disponibilite_id_salle_fkey] FOREIGN KEY ([id_salle]) REFERENCES [dbo].[Salle]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[JourFerie] ADD CONSTRAINT [JourFerie_id_semestre_fkey] FOREIGN KEY ([id_semestre]) REFERENCES [dbo].[Semestre]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AffectationCours] ADD CONSTRAINT [AffectationCours_id_cours_fkey] FOREIGN KEY ([id_cours]) REFERENCES [dbo].[Cours]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AffectationCours] ADD CONSTRAINT [AffectationCours_id_professeur_fkey] FOREIGN KEY ([id_professeur]) REFERENCES [dbo].[Professeur]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AffectationCours] ADD CONSTRAINT [AffectationCours_id_salle_fkey] FOREIGN KEY ([id_salle]) REFERENCES [dbo].[Salle]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

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
