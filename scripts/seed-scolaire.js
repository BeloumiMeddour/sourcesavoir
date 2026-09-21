// Jeu scolaire fictif, indépendant de seed-demo.js : garde sans lecture .env,
// URL du client explicitement contrôlée. Prisma peut lire .env à son import après la garde.
// DATABASE_URL doit viser une base locale jetable ; SEED_SCOLAIRE_PASSWORD est obligatoire
// (12 caractères minimum, avec majuscule, minuscule, chiffre et symbole).
import { evaluerGarde } from "./garde-jetable.js";

class ErreurSeedScolaire extends Error {}

function verifierEnvironnement(env) {
    const garde = evaluerGarde(env.DATABASE_URL);
    if (!garde.ok) {
        throw new ErreurSeedScolaire(`Seed scolaire : REFUSÉ, ${garde.raison}`);
    }
    verifierMotDePasse(env.SEED_SCOLAIRE_PASSWORD);
}

// Complexité minimale du mot de passe de recette : 12 caractères, une majuscule, une
// minuscule, un chiffre et un symbole (ni lettre, ni chiffre, ni espace). Les messages
// nomment la règle violée sans jamais recopier le mot de passe.
function verifierMotDePasse(motDePasse) {
    const message = "Seed scolaire : SEED_SCOLAIRE_PASSWORD doit contenir au moins 12 caractères, "
        + "dont une majuscule, une minuscule, un chiffre et un symbole";
    if (typeof motDePasse !== "string" || motDePasse.length < 12) {
        throw new ErreurSeedScolaire(`${message}.`);
    }
    const manquants = [
        [/\p{Lu}/u, "majuscule"],
        [/\p{Ll}/u, "minuscule"],
        [/\p{Nd}/u, "chiffre"],
        [/[^\p{L}\p{Nd}\s]/u, "symbole"],
    ].filter(([motif]) => !motif.test(motDePasse)).map(([, nom]) => nom);
    if (manquants.length > 0) {
        throw new ErreurSeedScolaire(`${message} (manque : ${manquants.join(", ")}).`);
    }
}

function verifierIdentite(existant, attendu) {
    const incompatible = Object.entries(attendu).some(([cle, valeur]) => valeur instanceof Date
        ? !(existant[cle] instanceof Date) || existant[cle].getTime() !== valeur.getTime()
        : existant[cle] !== valeur);
    if (incompatible) {
        throw new ErreurSeedScolaire("Seed scolaire : collision avec des données existantes ; transaction annulée.");
    }
}

async function hacher(motDePasse) {
    const { default: bcrypt } = await import("bcrypt");
    return bcrypt.hash(motDePasse, 12);
}

const COMPTES = {
    parentA: { email: "les3s.seed.parent-a@example.invalid", role: "parent", nom: "FamilleTestA", prenom: "Parent" },
    parentB: { email: "les3s.seed.parent-b@example.invalid", role: "parent", nom: "FamilleTestB", prenom: "Parent" },
    secondTuteur: { email: "les3s.seed.second-tuteur@example.invalid", role: "parent", nom: "FamilleTestA", prenom: "SecondTuteur" },
    eleveA1: { email: "les3s.seed.eleve-a1@example.invalid", role: "eleve", nom: "FamilleTestA", prenom: "EnfantUn" },
};

/**
 * Remplit un client injecté après contrôle de l'environnement du processus.
 * Les options permettent des tests sans connexion ; le client fourni doit viser l'URL contrôlée.
 * Retourne uniquement des identifiants, jamais de comptes complets ni de mots de passe.
 */
export async function seedScolaire(prisma, { env = process.env, hacherMotDePasse = hacher } = {}) {
    verifierEnvironnement(env);
    // Hors transaction : le calcul bcrypt ne retient pas une connexion SQL.
    const empreinte = await hacherMotDePasse(env.SEED_SCOLAIRE_PASSWORD);

    return prisma.$transaction(async (tx) => {
        const comptes = {};
        for (const [cle, identite] of Object.entries(COMPTES)) {
            const existant = await tx.user.findUnique({
                where: { email: identite.email },
                select: { id: true, email: true, role: true, nom: true, prenom: true },
            });
            if (existant) {
                verifierIdentite(existant, identite);
                comptes[cle] = existant;
            } else {
                comptes[cle] = await tx.user.create({
                    data: { ...identite, password: empreinte, etat: "valide" },
                    select: { id: true, email: true, role: true, nom: true, prenom: true },
                });
            }
        }

        const identiteAnnee = {
            libelle: "2026-2027", dateDebut: new Date("2026-09-01T00:00:00Z"), dateFin: new Date("2027-06-30T00:00:00Z"),
        };
        const annee = await tx.anneeScolaire.upsert({
            where: { libelle: "2026-2027" },
            update: {},
            create: identiteAnnee,
        });
        verifierIdentite(annee, identiteAnnee);
        const groupes = [];
        for (const ordre of [1, 2]) {
            const identiteNiveau = { code: `SEC${ordre}`, libelle: `Secondaire ${ordre}`, ordre };
            const niveau = await tx.niveau.upsert({
                where: { code: `SEC${ordre}` },
                update: {},
                create: identiteNiveau,
            });
            verifierIdentite(niveau, identiteNiveau);
            const code = `SEED-SEC${ordre}-A`;
            const groupe = await tx.groupe.upsert({
                where: { id_annee_code: { id_annee: annee.id, code } },
                update: {},
                create: { code, capacite: 30, id_annee: annee.id, id_niveau: niveau.id },
            });
            verifierIdentite(groupe, { id_niveau: niveau.id });
            groupes.push(groupe);
        }

        const tuteurs = {};
        for (const cle of ["parentA", "parentB", "secondTuteur"]) {
            const compte = comptes[cle];
            const identite = { id_user: compte.id, nom: compte.nom, prenom: compte.prenom, courriel: compte.email };
            // id_user possède un index filtré SQL Server, pas un @unique Prisma.
            const existant = await tx.tuteur.findFirst({ where: { id_user: compte.id } });
            if (existant) verifierIdentite(existant, identite);
            tuteurs[cle] = existant || await tx.tuteur.create({ data: identite });
        }

        const eleves = {};
        const scenarios = [
            { cle: "a1", matricule: "SEED-SCOL-A1", nom: "FamilleTestA", prenom: "EnfantUn", id_user: comptes.eleveA1.id, groupe: groupes[0] },
            { cle: "a2", matricule: "SEED-SCOL-A2", nom: "FamilleTestA", prenom: "EnfantDeux", id_user: null, groupe: groupes[1] },
            { cle: "b1", matricule: "SEED-SCOL-B1", nom: "FamilleTestB", prenom: "EnfantUn", id_user: null, groupe: groupes[0] },
        ];
        for (const { cle, groupe, ...identite } of scenarios) {
            const eleve = await tx.eleve.upsert({
                where: { matricule: identite.matricule }, update: {}, create: identite,
            });
            verifierIdentite(eleve, identite);
            eleves[cle] = eleve;
            const inscription = await tx.inscription.findFirst({
                where: { id_eleve: eleve.id, id_annee: annee.id, statut: "active" },
            });
            if (inscription) {
                verifierIdentite(inscription, { id_groupe: groupe.id });
            } else {
                await tx.inscription.create({
                    data: { id_eleve: eleve.id, id_annee: annee.id, id_groupe: groupe.id, statut: "active" },
                });
            }
        }

        for (const [enfant, tuteur, peutAgir] of [
            ["a1", "parentA", true], ["a2", "parentA", true],
            ["b1", "parentB", true], ["a1", "secondTuteur", false],
        ]) {
            const identite = {
                id_eleve: eleves[enfant].id, id_tuteur: tuteurs[tuteur].id,
                parente: "tuteur", peutLire: true, peutAgir, actif: true,
            };
            const lien = await tx.lienEleveTuteur.upsert({
                where: { id_eleve_id_tuteur: { id_eleve: identite.id_eleve, id_tuteur: identite.id_tuteur } },
                update: {}, create: identite,
            });
            // Une relance ne réactive pas un lien retiré et n'élargit pas ses droits.
            verifierIdentite(lien, identite);
        }

        return {
            annee: annee.id,
            groupes: groupes.map(({ id }) => id),
            comptes: Object.fromEntries(Object.entries(comptes).map(([cle, { id }]) => [cle, id])),
            familleA: { tuteur: tuteurs.parentA.id, eleves: [eleves.a1.id, eleves.a2.id] },
            familleB: { tuteur: tuteurs.parentB.id, eleves: [eleves.b1.id] },
            secondTuteur: { tuteur: tuteurs.secondTuteur.id, eleves: [eleves.a1.id] },
        };
    });
}

async function creerClientPrisma(url) {
    const { PrismaClient } = await import("@prisma/client");
    // L'URL contrôlée est transmise explicitement : aucune résolution par un module applicatif.
    return new PrismaClient({ datasources: { db: { url } } });
}

/** Exécution CLI injectable : contrôle avant import/création du client ; erreurs expurgées. */
export async function executerSeedScolaire({ env = process.env, creerClient = creerClientPrisma, sortie = console } = {}) {
    let prisma;
    let code = 0;
    try {
        verifierEnvironnement(env);
        prisma = await creerClient(env.DATABASE_URL);
        const resultat = await seedScolaire(prisma, { env });
        sortie.log("Seed scolaire : 2 familles, 3 élèves et 4 comptes fictifs disponibles.");
        sortie.log(JSON.stringify(resultat));
    } catch (erreur) {
        sortie.error(erreur instanceof ErreurSeedScolaire
            ? erreur.message
            : "Seed scolaire : échec ; aucun détail de connexion ni donnée sensible n'est affiché.");
        code = 1;
    } finally {
        if (prisma) {
            try {
                await prisma.$disconnect();
            } catch {
                sortie.error("Seed scolaire : fermeture du client impossible.");
                code = 1;
            }
        }
    }
    return code;
}

// Compatible ESM et transformation Babel/Jest ; aucun import.meta ni démarrage à l'import.
if (process.argv[1] && /(?:^|\/)seed-scolaire\.js$/.test(process.argv[1].replace(/\\/g, "/"))) {
    executerSeedScolaire().then((code) => { process.exitCode = code; });
}
