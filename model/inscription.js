import { prisma } from "./prisma.js";
import { filtreElevesVisibles, filtreInscriptionsVisibles } from "./acces.js";
import { exigerObjet, identifiant, ErreurValidation, ErreurIntrouvable } from "./validation.js";

const CHAMPS = ["id_eleve", "id_annee", "id_groupe", "statut"];
const CHAMPS_PROMOTION = ["id_annee", "id_groupe"];
const STATUTS = ["active", "terminee", "annulee"];
// Nombre maximal d'exécutions de la transaction de promotion (conflits de sérialisation).
const ESSAIS_PROMOTION = 3;
const SELECTION = {
    id: true, id_eleve: true, id_annee: true, id_groupe: true, statut: true,
    groupe: {
        select: {
            id: true, code: true, id_niveau: true,
            annee: { select: { id: true, libelle: true, dateDebut: true, dateFin: true } },
        },
    },
};

const verifierReferences = async (client, data) => {
    const eleve = await client.eleve.findUnique({ where: { id: data.id_eleve }, select: { id: true } });
    if (!eleve) {
        throw new ErreurIntrouvable("Élève introuvable.");
    }
    const annee = await client.anneeScolaire.findUnique({
        where: { id: data.id_annee }, select: { id: true, dateDebut: true },
    });
    if (!annee) {
        throw new ErreurIntrouvable("Année scolaire introuvable.");
    }
    const groupe = await client.groupe.findUnique({
        where: { id: data.id_groupe }, select: { id: true, id_annee: true },
    });
    if (!groupe) {
        throw new ErreurIntrouvable("Groupe introuvable.");
    }
    if (groupe.id_annee !== data.id_annee) {
        throw new ErreurValidation("Le groupe doit appartenir à l'année scolaire de l'inscription.");
    }
    return annee;
};

export const listerInscriptions = async (user, idEleve) => {
    const id = identifiant(idEleve, "id_eleve");
    // Un seul instant de référence pour les deux filtres (enseignant : année en cours).
    const options = { maintenant: new Date() };
    const filtre = filtreElevesVisibles(user, options);
    const filtreInscriptions = filtreInscriptionsVisibles(user, options);
    if (filtre === null || filtreInscriptions === null) {
        throw new ErreurIntrouvable("Élève introuvable.");
    }
    // Le filtre porte aussi sur les inscriptions : Prisma peut charger une
    // relation avec une requête SQL distincte de celle de l'élève. L'enseignant
    // ne voit que les inscriptions de ses groupes, pas tout l'historique de l'élève.
    const eleve = await prisma.eleve.findFirst({
        where: { AND: [{ id }, filtre] },
        select: {
            inscriptions: {
                where: filtreInscriptions,
                select: SELECTION,
                orderBy: [{ id_annee: "desc" }, { id: "desc" }],
            },
        },
    });
    if (!eleve) {
        throw new ErreurIntrouvable("Élève introuvable.");
    }
    return eleve.inscriptions;
};

export const creerInscription = async (donnees) => {
    exigerObjet(donnees);
    if (Object.keys(donnees).some((champ) => !CHAMPS.includes(champ))) {
        throw new ErreurValidation("Le corps contient un champ non autorisé pour une inscription.");
    }
    const data = {
        id_eleve: identifiant(donnees.id_eleve, "id_eleve"),
        id_annee: identifiant(donnees.id_annee, "id_annee"),
        id_groupe: identifiant(donnees.id_groupe, "id_groupe"),
        statut: donnees.statut === undefined ? "active" : donnees.statut,
    };
    if (!STATUTS.includes(data.statut)) {
        throw new ErreurValidation("Le statut doit être active, terminee ou annulee.");
    }
    await verifierReferences(prisma, data);
    return prisma.inscription.create({ data, select: SELECTION });
};

export const promouvoirEleve = async (idEleve, donnees) => {
    exigerObjet(donnees);
    if (Object.keys(donnees).some((champ) => !CHAMPS_PROMOTION.includes(champ))) {
        throw new ErreurValidation("Le corps contient un champ non autorisé pour une promotion.");
    }
    const data = {
        id_eleve: identifiant(idEleve, "id_eleve"),
        id_annee: identifiant(donnees.id_annee, "id_annee"),
        id_groupe: identifiant(donnees.id_groupe, "id_groupe"),
        statut: "active",
    };
    // La transaction empêche deux décisions concurrentes fondées sur le même
    // historique. L'index filtré SQL reste garant de l'unicité de l'inscription active.
    const promouvoir = () => prisma.$transaction(async (transaction) => {
        const annee = await verifierReferences(transaction, data);
        const derniere = await transaction.inscription.findFirst({
            where: { id_eleve: data.id_eleve },
            orderBy: { groupe: { annee: { dateDebut: "desc" } } },
            select: { groupe: { select: { annee: { select: { dateDebut: true } } } } },
        });
        if (derniere && annee.dateDebut <= derniere.groupe.annee.dateDebut) {
            throw new ErreurValidation("La promotion exige une année postérieure à toutes les inscriptions de l'élève.");
        }
        // Aucun changement de groupe ni de statut dans les inscriptions passées.
        return transaction.inscription.create({ data, select: SELECTION });
    }, { isolationLevel: "Serializable" });

    // Un conflit de sérialisation (P2034) ne prouve aucune faute : la transaction entière
    // est rejouée (historique relu), trois essais au plus. Toute autre erreur remonte.
    for (let essai = 1; ; essai++) {
        try {
            return await promouvoir();
        } catch (erreur) {
            if (erreur?.code !== "P2034" || essai >= ESSAIS_PROMOTION) {
                throw erreur;
            }
        }
    }
};
