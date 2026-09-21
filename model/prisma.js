// Client Prisma partagé, réservé aux nouveaux modèles du socle scolaire
// (AnneeScolaire, Niveau, Groupe, Eleve, Tuteur, LienEleveTuteur, Inscription).
// Les modèles existants (cours, salle, professeur...) gardent leur propre instance.
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
