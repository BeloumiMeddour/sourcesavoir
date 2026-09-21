// importer le client prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client prisma
const prisma = new PrismaClient();

//import bcrypt pour le hash des mots de passe
import bcrypt from "bcrypt";

// Rôles connus de l'application
import { ROLES } from "../middleware/permissions.js";

const REGEX_COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Politique du courriel d'un compte (inscription et création par un admin).
 * @param {unknown} email
 * @returns {string|null} le message d'erreur, ou null si le courriel est acceptable
 */
const validerCourriel = (email) => {
    if (typeof email !== "string" || email.trim().length === 0) {
        return "L'adresse courriel est obligatoire.";
    }
    if (!REGEX_COURRIEL.test(email.trim())) {
        return "L'adresse courriel n'est pas valide.";
    }
    if (email.trim().length > 150) {
        return "L'adresse courriel ne peut pas dépasser 150 caractères.";
    }
    return null;
};

/**
 * Politique du mot de passe d'un compte (inscription et création par un admin).
 * @param {unknown} password
 * @returns {string|null} le message d'erreur, ou null si le mot de passe est acceptable
 */
const validerMotDePasse = (password) => {
    if (typeof password !== "string" || password.length === 0) {
        return "Le mot de passe est obligatoire.";
    }
    if (password.length < 8) {
        return "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (password.length > 128) {
        return "Le mot de passe ne peut pas dépasser 128 caractères.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Le mot de passe doit contenir au moins une lettre majuscule.";
    }
    if (!/[0-9]/.test(password)) {
        return "Le mot de passe doit contenir au moins un chiffre.";
    }
    return null;
};

/**
 * Créer un nouvel utilisateur avec un email, mot de passe et rôle
 * @param {string} email
 * @param {string} password
 * @param {string} role
 * @param {string} nom
 * @param {string} prenom
 * @param {string|null} etat - "valide" ou "en_attente" ; par défaut, selon le rôle
 * @returns Un nouvel utilisateur créé
 */
const createUser = async (email, password, role = "user", nom = null, prenom = null, etat = null) => {
    // Hasher ou crypter le mot de passe avant de le stocker
    //10 est le nombre de salage (salt rounds) pour bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Sans état explicite, les comptes admin/responsable sont validés automatiquement
    // (la création par un admin passe "valide" ; l'inscription publique n'en passe pas)
    etat = etat ?? ((role === "admin" || role === "responsable") ? "valide" : "en_attente");

    // Créer un nouvel utilisateur dans la base de données
    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role,
            etat,
            nom,
            prenom,
        },
    });
    return newUser;
};

/**
 * Récupérer un utilisateur par son email
 * @param {string} email
 * @returns L'utilisateur correspondant à l'email ou null s'il n'existe pas
 */
const getUserByEmail = async (email) => {
    // Rechercher un utilisateur par son email dans la base de données
    const user = await prisma.user.findUnique({
        where: { email },
    });
    return user;
};

/**
 * Retourne la liste de tous les utilisateurs (sans le mot de passe)
 * @returns liste des utilisateurs
 */
const getUsers = async () => {
    return await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            etat: true,
            nom: true,
            prenom: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
};

/**
 * Retourne un utilisateur par son ID (sans le mot de passe)
 * @param {number} id
 * @returns l'utilisateur correspondant ou null
 */
const getUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id: id },
        select: {
            id: true,
            email: true,
            role: true,
            etat: true,
            nom: true,
            prenom: true,
            createdAt: true,
        },
    });
};

/**
 * Met à jour les informations d'un utilisateur
 * @param {number} id
 * @param {Object} userData - { email, nom, prenom, role }
 * @returns l'utilisateur mis à jour
 */
const updateUser = async (id, userData) => {
    const user = await prisma.user.findUnique({
        where: { id: id },
    });

    if (!user) {
        throw new Error("Utilisateur non trouvé");
    }

    const { email, nom, prenom, role } = userData;

    const updatedUser = await prisma.user.update({
        where: { id: id },
        data: { email, nom, prenom, role },
        select: {
            id: true,
            email: true,
            role: true,
            nom: true,
            prenom: true,
            createdAt: true,
        },
    });

    return updatedUser;
};

/**
 * Attribue un rôle à un utilisateur
 * @param {number} id
 * @param {string} role - "admin" ou "responsable"
 * @returns l'utilisateur mis à jour
 */
const assignRole = async (id, role) => {
    const user = await prisma.user.findUnique({
        where: { id: id },
    });

    if (!user) {
        throw new Error("Utilisateur non trouvé");
    }

    const updatedUser = await prisma.user.update({
        where: { id: id },
        data: { role: role },
        select: {
            id: true,
            email: true,
            role: true,
            nom: true,
            prenom: true,
            createdAt: true,
        },
    });

    return updatedUser;
};

/**
 * Supprime un utilisateur par son ID
 * @param {number} id
 * @returns true si l'utilisateur a été supprimé
 */
const deleteUser = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id: id },
    });

    if (!user) {
        throw new Error("Utilisateur non trouvé");
    }

    await prisma.user.delete({
        where: { id: id },
    });

    return true;
};

/**
 * Valide un compte utilisateur (passe de en_attente à valide) en lui attribuant
 * le rôle choisi par l'admin. Rôle et état sont écrits en UNE seule mise à jour :
 * un compte ne peut pas être validé avec un rôle par défaut jamais examiné.
 * @param {number} id
 * @param {string} role - un des rôles de ROLES, sans valeur par défaut
 * @returns l'utilisateur mis à jour
 */
const validerUser = async (id, role) => {
    if (typeof role !== "string" || !Object.values(ROLES).includes(role)) {
        throw new Error("Rôle invalide");
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("Utilisateur non trouvé");
    if (user.etat === "valide") throw new Error("Ce compte est déjà validé");

    return await prisma.user.update({
        where: { id },
        data: { etat: "valide", role },
        select: { id: true, email: true, role: true, etat: true, nom: true, prenom: true, createdAt: true },
    });
};

export {
    createUser,
    getUserByEmail,
    getUsers,
    getUserById,
    updateUser,
    assignRole,
    deleteUser,
    validerUser,
    validerCourriel,
    validerMotDePasse,
};
