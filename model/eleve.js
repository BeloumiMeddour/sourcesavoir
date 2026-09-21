import { prisma } from "./prisma.js";
import { filtreElevesVisibles, verifierCompteRattachable } from "./acces.js";
import {
    exigerObjet, chaineObligatoire, identifiant, identifiantOptionnel,
    dateISOOptionnelle, ErreurValidation, ErreurIntrouvable,
} from "./validation.js";

const CHAMPS = ["matricule", "nom", "prenom", "dateNaissance", "id_user"];
// Les comptes et liens familiaux ne font pas partie des fiches accessibles.
const SELECTION = { id: true, matricule: true, nom: true, prenom: true, dateNaissance: true };

export const listerEleves = async (user) => {
    const filtre = filtreElevesVisibles(user);
    if (filtre === null) {
        return [];
    }
    return prisma.eleve.findMany({
        where: filtre,
        select: SELECTION,
        orderBy: [{ nom: "asc" }, { prenom: "asc" }, { id: "asc" }],
    });
};

export const obtenirEleve = async (user, idEleve) => {
    const id = identifiant(idEleve, "id_eleve");
    const filtre = filtreElevesVisibles(user);
    if (filtre === null) {
        throw new ErreurIntrouvable("Élève introuvable.");
    }
    const eleve = await prisma.eleve.findFirst({ where: { AND: [{ id }, filtre] }, select: SELECTION });
    if (!eleve) {
        throw new ErreurIntrouvable("Élève introuvable.");
    }
    return eleve;
};

export const creerEleve = async (donnees) => {
    exigerObjet(donnees);
    if (Object.keys(donnees).some((champ) => !CHAMPS.includes(champ))) {
        throw new ErreurValidation("Le corps contient un champ non autorisé pour un élève.");
    }
    const data = {
        matricule: chaineObligatoire(donnees.matricule, "matricule", 30),
        nom: chaineObligatoire(donnees.nom, "nom", 100),
        prenom: chaineObligatoire(donnees.prenom, "prenom", 100),
        dateNaissance: dateISOOptionnelle(donnees.dateNaissance, "dateNaissance"),
        id_user: identifiantOptionnel(donnees.id_user, "id_user"),
    };
    // Le compte doit exister, avoir le rôle eleve et ne pas être déjà rattaché
    // (l'index filtré SQL reste le dernier garde-fou contre une création simultanée).
    await verifierCompteRattachable(data.id_user, "eleve", prisma.eleve, "un élève");
    return prisma.eleve.create({ data, select: SELECTION });
};
