BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
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
    [etape] NVARCHAR(1000) NOT NULL,
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
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Professeur_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Professeur_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Professeur_matricule_key] UNIQUE NONCLUSTERED ([matricule])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
