import { prisma } from "./prisma.js";
import { verifierCompteRattachable } from "./acces.js";
import {
    exigerObjet, chaineObligatoire, chaineOptionnelle, courrielOptionnel,
    identifiantOptionnel, ErreurValidation,
} from "./validation.js";

const CHAMPS = ["nom", "prenom", "courriel", "telephone", "id_user"];
const SELECTION = { id: true, nom: true, prenom: true, courriel: true, telephone: true };

export const creerTuteur = async (donnees) => {
    exigerObjet(donnees);
    if (Object.keys(donnees).some((champ) => !CHAMPS.includes(champ))) {
        throw new ErreurValidation("Le corps contient un champ non autorisé pour un tuteur.");
    }
    const data = {
        nom: chaineObligatoire(donnees.nom, "nom", 100),
        prenom: chaineObligatoire(donnees.prenom, "prenom", 100),
        courriel: courrielOptionnel(donnees.courriel, "courriel", 150),
        telephone: chaineOptionnelle(donnees.telephone, "telephone", 30),
        id_user: identifiantOptionnel(donnees.id_user, "id_user"),
    };
    // Le compte doit exister, avoir le rôle parent et ne pas être déjà rattaché
    // (l'index filtré SQL reste le dernier garde-fou contre une création simultanée).
    await verifierCompteRattachable(data.id_user, "parent", prisma.tuteur, "un tuteur");
    return prisma.tuteur.create({ data, select: SELECTION });
};
