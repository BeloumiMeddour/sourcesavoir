import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Créer un cours
 */
export const createCours = async (data) => {
  return prisma.cours.create({
    data,
  });
};

/**
 * Récupérer tous les cours
 */
export const getAllCours = async () => {
  return prisma.cours.findMany({
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Récupérer un cours par ID
 */
export const getCoursById = async (id) => {
  return prisma.cours.findUnique({
    where: { id },
  });
};

/**
 * Modifier un cours
 */
export const updateCours = async (id, data) => {
  return prisma.cours.update({
    where: { id },
    data,
  });
};

/**
 * Supprimer un cours
 */
export const deleteCours = async (id) => {
  return prisma.cours.delete({
    where: { id },
  });
};