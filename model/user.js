// importer le client prisma
import { PrismaClient } from "@prisma/client";

// Créer une instance du client prisma
const prisma = new PrismaClient();

//import bcrypt pour le hash des mots de passe
import bcrypt from "bcrypt";

/**
 * Créer un nouvel utilisateur avec un email, mot de passe et rôle
 * @param {string} email
 * @param {string} password
 * @param {string} role
 * @param {string} nom
 * @param {string} prenom
 * @returns Un nouvel utilisateur créé
 */
const createUser = async (email, password, role = "user", nom = null, prenom = null) => {
    // Hasher ou crypter le mot de passe avant de le stocker
    //10 est le nombre de salage (salt rounds) pour bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur dans la base de données
    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role,
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
 * Récupérer tous les utilisateurs
 * @returns liste de tous les utilisateurs
 */
const getUsers = async () => {
    return await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            nom: true,
            prenom: true,
            createdAt: true,
        },
    });
};

/**
 * Récupérer un utilisateur par son ID
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
            nom: true,
            prenom: true,
            createdAt: true,
        },
    });
};

/**
 * Met à jour le rôle d'un utilisateur
 * @param {number} id
 * @param {string} role
 * @returns l'utilisateur mis à jour
 */
const updateUserRole = async (id, role) => {
    const user = await prisma.user.findUnique({
        where: { id: id },
    });
    
    if (!user) {
        throw new Error("Utilisateur non trouvé");
    }
    
    const updatedUser = await prisma.user.update({
        where: { id: id },
        data: { role },
    });
    return updatedUser;
};

/**
 * Supprime un utilisateur
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

export { createUser, getUserByEmail, getUsers, getUserById, updateUserRole, deleteUser };
