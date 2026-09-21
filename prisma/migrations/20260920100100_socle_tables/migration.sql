BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AnneeScolaire] (
    [id] INT NOT NULL IDENTITY(1,1),
    [libelle] NVARCHAR(20) NOT NULL,
    [dateDebut] DATE NOT NULL,
    [dateFin] DATE NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AnneeScolaire_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AnneeScolaire_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AnneeScolaire_libelle_key] UNIQUE NONCLUSTERED ([libelle])
);

-- CreateTable
CREATE TABLE [dbo].[Niveau] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(20) NOT NULL,
    [libelle] NVARCHAR(100) NOT NULL,
    [ordre] INT NOT NULL,
    CONSTRAINT [Niveau_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Niveau_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Groupe] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(30) NOT NULL,
    [capacite] INT,
    [id_annee] INT NOT NULL,
    [id_niveau] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Groupe_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Groupe_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Groupe_id_annee_code_key] UNIQUE NONCLUSTERED ([id_annee],[code]),
    CONSTRAINT [Groupe_id_id_annee_key] UNIQUE NONCLUSTERED ([id],[id_annee])
);

-- CreateTable
CREATE TABLE [dbo].[Eleve] (
    [id] INT NOT NULL IDENTITY(1,1),
    [matricule] NVARCHAR(30) NOT NULL,
    [nom] NVARCHAR(100) NOT NULL,
    [prenom] NVARCHAR(100) NOT NULL,
    [dateNaissance] DATE,
    [id_user] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Eleve_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Eleve_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Eleve_matricule_key] UNIQUE NONCLUSTERED ([matricule])
);

-- CreateTable
CREATE TABLE [dbo].[Tuteur] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nom] NVARCHAR(100) NOT NULL,
    [prenom] NVARCHAR(100) NOT NULL,
    [courriel] NVARCHAR(150),
    [telephone] NVARCHAR(30),
    [id_user] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Tuteur_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Tuteur_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[LienEleveTuteur] (
    [id] INT NOT NULL IDENTITY(1,1),
    [id_eleve] INT NOT NULL,
    [id_tuteur] INT NOT NULL,
    [parente] NVARCHAR(30) NOT NULL,
    [peutLire] BIT NOT NULL CONSTRAINT [LienEleveTuteur_peutLire_df] DEFAULT 1,
    [peutAgir] BIT NOT NULL CONSTRAINT [LienEleveTuteur_peutAgir_df] DEFAULT 0,
    [actif] BIT NOT NULL CONSTRAINT [LienEleveTuteur_actif_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [LienEleveTuteur_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [LienEleveTuteur_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LienEleveTuteur_id_eleve_id_tuteur_key] UNIQUE NONCLUSTERED ([id_eleve],[id_tuteur])
);

-- CreateTable
CREATE TABLE [dbo].[Inscription] (
    [id] INT NOT NULL IDENTITY(1,1),
    [id_eleve] INT NOT NULL,
    [id_annee] INT NOT NULL,
    [id_groupe] INT NOT NULL,
    [statut] NVARCHAR(20) NOT NULL CONSTRAINT [Inscription_statut_df] DEFAULT 'active',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Inscription_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Inscription_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Groupe_id_niveau_idx] ON [dbo].[Groupe]([id_niveau]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Eleve_nom_prenom_idx] ON [dbo].[Eleve]([nom], [prenom]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LienEleveTuteur_id_tuteur_idx] ON [dbo].[LienEleveTuteur]([id_tuteur]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Inscription_id_eleve_id_annee_idx] ON [dbo].[Inscription]([id_eleve], [id_annee]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Inscription_id_groupe_idx] ON [dbo].[Inscription]([id_groupe]);

-- AddForeignKey
ALTER TABLE [dbo].[Groupe] ADD CONSTRAINT [Groupe_id_annee_fkey] FOREIGN KEY ([id_annee]) REFERENCES [dbo].[AnneeScolaire]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Groupe] ADD CONSTRAINT [Groupe_id_niveau_fkey] FOREIGN KEY ([id_niveau]) REFERENCES [dbo].[Niveau]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Eleve] ADD CONSTRAINT [Eleve_id_user_fkey] FOREIGN KEY ([id_user]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Tuteur] ADD CONSTRAINT [Tuteur_id_user_fkey] FOREIGN KEY ([id_user]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LienEleveTuteur] ADD CONSTRAINT [LienEleveTuteur_id_eleve_fkey] FOREIGN KEY ([id_eleve]) REFERENCES [dbo].[Eleve]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LienEleveTuteur] ADD CONSTRAINT [LienEleveTuteur_id_tuteur_fkey] FOREIGN KEY ([id_tuteur]) REFERENCES [dbo].[Tuteur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Inscription] ADD CONSTRAINT [Inscription_id_eleve_fkey] FOREIGN KEY ([id_eleve]) REFERENCES [dbo].[Eleve]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Inscription] ADD CONSTRAINT [Inscription_id_groupe_id_annee_fkey] FOREIGN KEY ([id_groupe], [id_annee]) REFERENCES [dbo].[Groupe]([id],[id_annee]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

