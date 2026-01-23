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
 * @returns Un nouvel utilisateur créé
 */
const createUser = async (email, password, role = "user") => {
    // Hasher ou crypter le mot de passe avant de le stocker
    //10 est le nombre de salage (salt rounds) pour bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur dans la base de données
    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role,
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

export { createUser, getUserByEmail };
