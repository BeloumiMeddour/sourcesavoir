-- Désactiver les contraintes de clés étrangères
EXEC sp_MSForEachTable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'
GO

-- Supprimer toutes les tables
DROP TABLE IF EXISTS [dbo].[_prisma_migrations];
DROP TABLE IF EXISTS [dbo].[JourFerie];
DROP TABLE IF EXISTS [dbo].[AffectationCours];
DROP TABLE IF EXISTS [dbo].[Disponibilite];
DROP TABLE IF EXISTS [dbo].[Cours];
DROP TABLE IF EXISTS [dbo].[Salle];
DROP TABLE IF EXISTS [dbo].[Professeur];
DROP TABLE IF EXISTS [dbo].[Semestre];
DROP TABLE IF EXISTS [dbo].[Users];
DROP TABLE IF EXISTS [dbo].[User];
GO

-- Créer les tables depuis zéro
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL UNIQUE,
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL DEFAULT 'user',
    [nom] NVARCHAR(1000),
    [prenom] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id])
);
GO

CREATE TABLE [dbo].[Semestre] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nom] NVARCHAR(1000) NOT NULL UNIQUE,
    [dateDebut] DATETIME2 NOT NULL,
    [dateFin] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Semestre_pkey] PRIMARY KEY CLUSTERED ([id])
);
GO

CREATE TABLE [dbo].[Cours] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL UNIQUE,
    [nom] NVARCHAR(1000) NOT NULL,
    [duree] INT NOT NULL,
    [programme] NVARCHAR(1000) NOT NULL,
    [etapeEtude] NVARCHAR(1000) NOT NULL,
    [typeSalle] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Cours_pkey] PRIMARY KEY CLUSTERED ([id])
);
GO

CREATE TABLE [dbo].[Salle] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL UNIQUE,
    [type] NVARCHAR(1000) NOT NULL,
    [capacite] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Salle_pkey] PRIMARY KEY CLUSTERED ([id])
);
GO

CREATE TABLE [dbo].[Professeur] (
    [id] INT NOT NULL IDENTITY(1,1),
    [matricule] NVARCHAR(1000) NOT NULL UNIQUE,
    [nom] NVARCHAR(1000) NOT NULL,
    [prenom] NVARCHAR(1000) NOT NULL,
    [specialite] NVARCHAR(1000) NOT NULL,
    [programme] NVARCHAR(1000),
    [chargeMax] INT NOT NULL DEFAULT 30,
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Professeur_pkey] PRIMARY KEY CLUSTERED ([id])
);
GO

CREATE TABLE [dbo].[Disponibilite] (
    [id] INT NOT NULL IDENTITY(1,1),
    [jour] NVARCHAR(1000) NOT NULL,
    [plageHoraire] NVARCHAR(1000) NOT NULL,
    [typeConflit] NVARCHAR(1000) NOT NULL,
    [id_professeur] INT,
    [id_salle] INT,
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Disponibilite_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Disponibilite_id_professeur_fkey] FOREIGN KEY ([id_professeur]) REFERENCES [dbo].[Professeur]([id]) ON DELETE CASCADE,
    CONSTRAINT [Disponibilite_id_salle_fkey] FOREIGN KEY ([id_salle]) REFERENCES [dbo].[Salle]([id]) ON DELETE CASCADE
);
GO

CREATE TABLE [dbo].[AffectationCours] (
    [id] INT NOT NULL IDENTITY(1,1),
    [session] NVARCHAR(1000),
    [jour] NVARCHAR(1000),
    [plageHoraire] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2,
    [id_cours] INT NOT NULL,
    [id_professeur] INT NOT NULL,
    [id_salle] INT NOT NULL,
    [id_semestre] INT,
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AffectationCours_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AffectationCours_id_cours_fkey] FOREIGN KEY ([id_cours]) REFERENCES [dbo].[Cours]([id]) ON DELETE CASCADE,
    CONSTRAINT [AffectationCours_id_professeur_fkey] FOREIGN KEY ([id_professeur]) REFERENCES [dbo].[Professeur]([id]) ON DELETE CASCADE,
    CONSTRAINT [AffectationCours_id_salle_fkey] FOREIGN KEY ([id_salle]) REFERENCES [dbo].[Salle]([id]) ON DELETE CASCADE,
    CONSTRAINT [AffectationCours_id_semestre_fkey] FOREIGN KEY ([id_semestre]) REFERENCES [dbo].[Semestre]([id]) ON DELETE SET NULL
);
GO

CREATE TABLE [dbo].[JourFerie] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATETIME2 NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [id_semestre] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [JourFerie_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [JourFerie_id_semestre_fkey] FOREIGN KEY ([id_semestre]) REFERENCES [dbo].[Semestre]([id]) ON DELETE CASCADE,
    CONSTRAINT [JourFerie_id_semestre_date_key] UNIQUE NONCLUSTERED ([id_semestre], [date])
);
GO

CREATE TABLE [dbo].[_prisma_migrations] (
    [id] NVARCHAR(36) NOT NULL PRIMARY KEY,
    [checksum] NVARCHAR(64) NOT NULL,
    [finished_at] DATETIMEOFFSET,
    [migration_name] NVARCHAR(255) NOT NULL,
    [logs] NVARCHAR(MAX),
    [rolled_back_at] DATETIMEOFFSET,
    [started_at] DATETIMEOFFSET NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [applied_steps_count] INT NOT NULL DEFAULT 0
);
GO

-- Créer les indices
CREATE NONCLUSTERED INDEX [Disponibilite_id_professeur_idx] ON [dbo].[Disponibilite] ([id_professeur]);
CREATE NONCLUSTERED INDEX [Disponibilite_id_salle_idx] ON [dbo].[Disponibilite] ([id_salle]);
CREATE NONCLUSTERED INDEX [AffectationCours_id_cours_idx] ON [dbo].[AffectationCours] ([id_cours]);
CREATE NONCLUSTERED INDEX [AffectationCours_id_professeur_idx] ON [dbo].[AffectationCours] ([id_professeur]);
CREATE NONCLUSTERED INDEX [AffectationCours_id_salle_idx] ON [dbo].[AffectationCours] ([id_salle]);
CREATE NONCLUSTERED INDEX [AffectationCours_id_semestre_idx] ON [dbo].[AffectationCours] ([id_semestre]);
GO

-- Réactiver les contraintes
EXEC sp_MSForEachTable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'
GO

PRINT 'Base de données recréée avec succès !'
