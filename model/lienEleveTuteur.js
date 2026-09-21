import { prisma } from "./prisma.js";
import {
    exigerObjet, chaineObligatoire, identifiant, booleen, ErreurValidation, ErreurIntrouvable, ErreurConflit,
} from "./validation.js";

const CHAMPS = ["id_tuteur", "parente", "peutLire", "peutAgir", "actif"];
// Seuls les droits et l'état d'un lien se modifient : ni l'élève, ni le tuteur, ni la parenté.
const CHAMPS_MODIFIABLES = ["actif", "peutLire", "peutAgir"];
const SELECTION = {
    id: true, id_eleve: true, id_tuteur: true, parente: true, peutLire: true, peutAgir: true, actif: true,
};
const MESSAGE_AGIR_SANS_LIRE = "Le droit « peutAgir » exige le droit « peutLire ».";

export const creerLien = async (idEleve, donnees) => {
    exigerObjet(donnees);
    if (Object.keys(donnees).some((champ) => !CHAMPS.includes(champ))) {
        throw new ErreurValidation("Le corps contient un champ non autorisé pour un lien élève-tuteur.");
    }
    const data = {
        id_eleve: identifiant(idEleve, "id_eleve"),
        id_tuteur: identifiant(donnees.id_tuteur, "id_tuteur"),
        parente: chaineObligatoire(donnees.parente, "parente", 30),
        peutLire: booleen(donnees.peutLire, "peutLire", true),
        peutAgir: booleen(donnees.peutAgir, "peutAgir", false),
        actif: booleen(donnees.actif, "actif", true),
    };
    if (data.peutAgir && !data.peutLire) {
        throw new ErreurValidation(MESSAGE_AGIR_SANS_LIRE);
    }
    const eleve = await prisma.eleve.findUnique({ where: { id: data.id_eleve }, select: { id: true } });
    if (!eleve) {
        throw new ErreurIntrouvable("Élève introuvable.");
    }
    const tuteur = await prisma.tuteur.findUnique({ where: { id: data.id_tuteur }, select: { id: true } });
    if (!tuteur) {
        throw new ErreurIntrouvable("Tuteur introuvable.");
    }
    return prisma.lienEleveTuteur.create({ data, select: SELECTION });
};

/**
 * Modifie l'état ou les droits d'un lien (révocation : actif false). Le lien est
 * cherché dans le périmètre de l'élève du chemin : un lien d'un autre élève est
 * introuvable. Un lien n'est jamais supprimé (historique conservé).
 * @param {number} idEleve
 * @param {number} idLien
 * @param {{ actif?: boolean, peutLire?: boolean, peutAgir?: boolean }} donnees
 */
export const modifierLien = async (idEleve, idLien, donnees) => {
    exigerObjet(donnees);
    if (Object.keys(donnees).some((champ) => !CHAMPS_MODIFIABLES.includes(champ))) {
        throw new ErreurValidation("Le corps contient un champ non modifiable pour un lien élève-tuteur.");
    }
    const id_eleve = identifiant(idEleve, "id_eleve");
    const id = identifiant(idLien, "idLien");
    // booleen(undefined, ..., undefined) laisse passer l'absence ; toute autre valeur doit être un booléen strict.
    const data = {};
    for (const champ of CHAMPS_MODIFIABLES) {
        const valeur = booleen(donnees[champ], champ, undefined);
        if (valeur !== undefined) {
            data[champ] = valeur;
        }
    }
    if (Object.keys(data).length === 0) {
        throw new ErreurValidation("Le corps doit contenir au moins un des champs actif, peutLire ou peutAgir.");
    }
    if (data.peutAgir === true && data.peutLire === false) {
        throw new ErreurValidation(MESSAGE_AGIR_SANS_LIRE);
    }

    const courant = await prisma.lienEleveTuteur.findFirst({
        where: { id, id_eleve }, select: { peutLire: true, peutAgir: true },
    });
    if (!courant) {
        throw new ErreurIntrouvable("Lien introuvable.");
    }
    const peutLire = data.peutLire ?? courant.peutLire;
    const peutAgir = data.peutAgir ?? courant.peutAgir;
    if (peutAgir && !peutLire) {
        throw new ErreurValidation(MESSAGE_AGIR_SANS_LIRE);
    }

    try {
        // Les droits lus servent de condition : un lien modifié entre-temps n'est pas écrasé,
        // ce qui maintient « peutAgir implique peutLire » même sous requêtes simultanées.
        return await prisma.lienEleveTuteur.update({
            where: { id, id_eleve, peutLire: courant.peutLire, peutAgir: courant.peutAgir },
            data,
            select: SELECTION,
        });
    } catch (erreur) {
        if (erreur?.code === "P2025") {
            throw new ErreurConflit("Le lien a été modifié ou supprimé entre-temps. Veuillez réessayer.");
        }
        throw erreur;
    }
};
