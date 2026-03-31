-- ===========================
-- CREATE DATABASE SCHEMA FOR EPLANIFY
-- ===========================

-- Drop foreign keys and tables if they exist (for fresh start)
-- Comment these out if you want to preserve existing data

-- User table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='[User]' AND xtype='U')
BEGIN
    CREATE TABLE [User] (
        id INT PRIMARY KEY IDENTITY(1,1),
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(MAX) NOT NULL,
        role NVARCHAR(MAX) DEFAULT 'user',
        nom NVARCHAR(MAX) NULL,
        prenom NVARCHAR(MAX) NULL,
        createdAt DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table [User] created';
END

-- Semestre table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Semestre' AND xtype='U')
BEGIN
    CREATE TABLE Semestre (
        id INT PRIMARY KEY IDENTITY(1,1),
        nom NVARCHAR(255) UNIQUE NOT NULL,
        dateDebut DATETIME2 NOT NULL,
        dateFin DATETIME2 NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table Semestre created';
END

-- Cours table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Cours' AND xtype='U')
BEGIN
    CREATE TABLE Cours (
        id INT PRIMARY KEY IDENTITY(1,1),
        code NVARCHAR(255) UNIQUE NOT NULL,
        nom NVARCHAR(MAX) NOT NULL,
        duree INT NOT NULL,
        programme NVARCHAR(255) NOT NULL,
        etapeEtude NVARCHAR(255) NOT NULL,
        typeSalle NVARCHAR(255) NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table Cours created';
END

-- Salle table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Salle' AND xtype='U')
BEGIN
    CREATE TABLE Salle (
        id INT PRIMARY KEY IDENTITY(1,1),
        code NVARCHAR(255) UNIQUE NOT NULL,
        type NVARCHAR(255) NOT NULL,
        capacite INT NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table Salle created';
END

-- Professeur table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Professeur' AND xtype='U')
BEGIN
    CREATE TABLE Professeur (
        id INT PRIMARY KEY IDENTITY(1,1),
        matricule NVARCHAR(255) UNIQUE NOT NULL,
        nom NVARCHAR(255) NOT NULL,
        prenom NVARCHAR(255) NOT NULL,
        specialite NVARCHAR(255) NOT NULL,
        programme NVARCHAR(255) NULL,
        chargeMax INT DEFAULT 30,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table Professeur created';
END

-- Disponibilite table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Disponibilite' AND xtype='U')
BEGIN
    CREATE TABLE Disponibilite (
        id INT PRIMARY KEY IDENTITY(1,1),
        jour NVARCHAR(255) NOT NULL,
        plageHoraire NVARCHAR(255) NOT NULL,
        typeConflit NVARCHAR(255) NOT NULL,
        id_professeur INT NULL,
        id_salle INT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (id_professeur) REFERENCES Professeur(id) ON DELETE CASCADE,
        FOREIGN KEY (id_salle) REFERENCES Salle(id) ON DELETE CASCADE
    );
    PRINT 'Table Disponibilite created';
END

-- JourFerie table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='JourFerie' AND xtype='U')
BEGIN
    CREATE TABLE JourFerie (
        id INT PRIMARY KEY IDENTITY(1,1),
        date DATETIME2 NOT NULL,
        description NVARCHAR(255) NOT NULL,
        id_semestre INT NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        UNIQUE(id_semestre, date),
        FOREIGN KEY (id_semestre) REFERENCES Semestre(id) ON DELETE CASCADE
    );
    PRINT 'Table JourFerie created';
END

-- AffectationCours table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AffectationCours' AND xtype='U')
BEGIN
    CREATE TABLE AffectationCours (
        id INT PRIMARY KEY IDENTITY(1,1),
        session NVARCHAR(255) NULL,
        jour NVARCHAR(255) NULL,
        plageHoraire NVARCHAR(255) NOT NULL,
        date DATETIME2 NULL,
        id_cours INT NOT NULL,
        id_professeur INT NULL,
        id_salle INT NOT NULL,
        id_semestre INT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (id_cours) REFERENCES Cours(id),
        FOREIGN KEY (id_professeur) REFERENCES Professeur(id),
        FOREIGN KEY (id_salle) REFERENCES Salle(id),
        FOREIGN KEY (id_semestre) REFERENCES Semestre(id)
    );
    PRINT 'Table AffectationCours created';
END

-- ===========================
-- VERIFY SCHEMA
-- ===========================
PRINT '';
PRINT '=== Database Schema Verification ===';
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;
