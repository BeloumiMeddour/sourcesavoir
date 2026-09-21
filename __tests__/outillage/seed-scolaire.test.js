import { spawnSync } from "node:child_process";
import path from "node:path";
import bcrypt from "bcrypt";
import { seedScolaire, executerSeedScolaire } from "../../scripts/seed-scolaire.js";

const ENV = {
    DATABASE_URL: "sqlserver://localhost:1433;database=les3s_test;user=fictif;password=SecretConnexionFictif",
    SEED_SCOLAIRE_PASSWORD: "MotDePasse-Fictif-2026",
};
const SCRIPT = path.resolve(__dirname, "../../scripts/seed-scolaire.js");

// Stockage en mémoire transactionnel : une seconde exécution rencontre réellement les lignes
// créées par la première. Aucun import de modèle applicatif, aucun client/base de données.
function creerFausseBase() {
    let lignes = Object.fromEntries([
        "user", "anneeScolaire", "niveau", "groupe", "tuteur", "eleve", "inscription", "lienEleveTuteur",
    ].map((nom) => [nom, []]));
    const correspond = (ligne, where) => Object.entries(where).every(([cle, valeur]) =>
        typeof valeur === "object" && valeur !== null
            ? correspond(ligne, valeur)
            : ligne[cle] === valeur);
    const selectionner = (ligne, select) => ligne && (select
        ? Object.fromEntries(Object.keys(select).filter((cle) => select[cle]).map((cle) => [cle, ligne[cle]]))
        : { ...ligne });
    const prisma = {};
    for (const nom of Object.keys(lignes)) {
        const chercher = ({ where, select }) => selectionner(lignes[nom].find((ligne) => correspond(ligne, where)), select) || null;
        prisma[nom] = {
            findUnique: jest.fn(async (args) => chercher(args)),
            findFirst: jest.fn(async (args) => chercher(args)),
            create: jest.fn(async ({ data, select }) => {
                const ligne = { id: lignes[nom].length + 1, ...data };
                lignes[nom].push(ligne);
                return selectionner(ligne, select);
            }),
            upsert: jest.fn(async ({ where, create, update }) => {
                const existant = lignes[nom].find((ligne) => correspond(ligne, where));
                if (existant) {
                    Object.assign(existant, update);
                    return { ...existant };
                }
                return prisma[nom].create({ data: create });
            }),
        };
    }
    prisma.$transaction = jest.fn(async (operation) => {
        const avant = structuredClone(lignes);
        try {
            return await operation(prisma);
        } catch (erreur) {
            lignes = avant;
            throw erreur;
        }
    });
    prisma.$disconnect = jest.fn(async () => {});
    return { prisma, lire: () => lignes };
}

const options = () => ({ env: { ...ENV }, hacherMotDePasse: jest.fn(async () => "empreinte-factice") });

describe("Seed scolaire fictif", () => {
    test.each([
        undefined,
        "sqlserver://distant.example.invalid;database=les3s_test",
        "sqlserver://localhost;database=les3s_reelle",
    ])("refuse une cible non autorisée avant tout appel base : %p", async (url) => {
        const { prisma } = creerFausseBase();
        const configuration = options();
        configuration.env.DATABASE_URL = url;
        await expect(seedScolaire(prisma, configuration)).rejects.toThrow(/REFUSÉ/);
        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(configuration.hacherMotDePasse).not.toHaveBeenCalled();
    });

    test.each([undefined, "", "trop-court"])("refuse un mot de passe absent ou court avant tout appel base", async (motDePasse) => {
        const { prisma } = creerFausseBase();
        const configuration = options();
        configuration.env.SEED_SCOLAIRE_PASSWORD = motDePasse;
        await expect(seedScolaire(prisma, configuration)).rejects.toThrow(/au moins 12/);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test.each([
        ["sans majuscule", "motdepasse-fictif-2026", /majuscule/],
        ["sans minuscule", "MOTDEPASSE-FICTIF-2026", /minuscule/],
        ["sans chiffre", "MotDePasse-Fictif-Long", /chiffre/],
        ["sans symbole", "MotDePasseFictif2026", /symbole/],
        ["onze caractères seulement", "Abcdefgh-1x", /au moins 12/],
        ["espaces comme seuls symboles", "Mot De Passe 2026", /symbole/],
    ])("refuse un mot de passe faible (%s) avant tout appel base, sans le recopier", async (_etiquette, motDePasse, motif) => {
        const { prisma } = creerFausseBase();
        const configuration = options();
        configuration.env.SEED_SCOLAIRE_PASSWORD = motDePasse;
        const erreur = await seedScolaire(prisma, configuration).catch((e) => e);
        expect(erreur).toBeInstanceOf(Error);
        expect(erreur.message).toMatch(motif);
        expect(erreur.message).not.toContain(motDePasse);
        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(configuration.hacherMotDePasse).not.toHaveBeenCalled();
    });

    test("accepte un mot de passe de douze caractères réunissant les quatre classes", async () => {
        const { prisma } = creerFausseBase();
        const configuration = options();
        configuration.env.SEED_SCOLAIRE_PASSWORD = "Abcdefgh-1xy";
        await expect(seedScolaire(prisma, configuration)).resolves.toBeDefined();
    });

    test("le point d'entrée CLI refuse un mot de passe faible sans créer de client", async () => {
        const creerClient = jest.fn();
        const sortie = { log: jest.fn(), error: jest.fn() };
        const env = { ...ENV, SEED_SCOLAIRE_PASSWORD: "motdepasse-simple-faible" };
        expect(await executerSeedScolaire({ env, creerClient, sortie })).toBe(1);
        expect(creerClient).not.toHaveBeenCalled();
        expect(JSON.stringify(sortie.error.mock.calls)).not.toContain(env.SEED_SCOLAIRE_PASSWORD);
    });

    test("construit deux familles isolées et un second tuteur lecteur d'un seul enfant", async () => {
        const { prisma, lire } = creerFausseBase();
        const configuration = options();
        const resultat = await seedScolaire(prisma, configuration);
        const db = lire();
        expect(db.anneeScolaire[0].libelle).toBe("2026-2027");
        expect(db.niveau).toHaveLength(2);
        expect(db.groupe).toHaveLength(2);
        expect(db.eleve).toHaveLength(3);
        expect(db.user).toHaveLength(4);
        expect(db.user.every((user) => user.email.endsWith("@example.invalid") && user.etat === "valide")).toBe(true);
        expect(configuration.hacherMotDePasse).toHaveBeenCalledWith(ENV.SEED_SCOLAIRE_PASSWORD);
        expect(db.user.every((user) => user.password === "empreinte-factice")).toBe(true);
        expect(db.eleve.find((eleve) => eleve.id === resultat.familleA.eleves[0]).id_user).toBe(resultat.comptes.eleveA1);

        const liensA = db.lienEleveTuteur.filter((lien) => lien.id_tuteur === resultat.familleA.tuteur);
        expect(liensA.map((lien) => lien.id_eleve)).toEqual(resultat.familleA.eleves);
        expect(liensA.every((lien) => lien.peutLire && lien.peutAgir && lien.actif)).toBe(true);
        expect(db.lienEleveTuteur.filter((lien) => lien.id_tuteur === resultat.familleB.tuteur))
            .toEqual([expect.objectContaining({ id_eleve: resultat.familleB.eleves[0], peutLire: true, peutAgir: true })]);
        expect(db.lienEleveTuteur.filter((lien) => lien.id_tuteur === resultat.secondTuteur.tuteur))
            .toEqual([expect.objectContaining({ id_eleve: resultat.familleA.eleves[0], peutLire: true, peutAgir: false, actif: true })]);
        expect(db.inscription).toHaveLength(3);
        for (const inscription of db.inscription) {
            expect(inscription.statut).toBe("active");
            expect(inscription.id_annee).toBe(resultat.annee);
            expect(db.groupe.find((groupe) => groupe.id === inscription.id_groupe).id_annee).toBe(inscription.id_annee);
        }
        expect(JSON.stringify(resultat)).not.toMatch(/password|empreinte|sqlserver|@/);
    });

    test("une relance conserve les identifiants et ne réinitialise ni mots de passe ni état des comptes", async () => {
        const { prisma, lire } = creerFausseBase();
        const premier = await seedScolaire(prisma, options());
        lire().user[0].password = "empreinte-changee-par-utilisateur";
        lire().user[0].etat = "en_attente";
        const avant = structuredClone(lire());
        const deuxieme = await seedScolaire(prisma, {
            env: { ...ENV, SEED_SCOLAIRE_PASSWORD: "UnAutre-MotDePasse-7" },
            hacherMotDePasse: async () => "nouvelle-empreinte",
        });
        expect(deuxieme).toEqual(premier);
        expect(lire()).toEqual(avant);
        expect(prisma.user.create).toHaveBeenCalledTimes(4);
        expect(prisma.tuteur.create).toHaveBeenCalledTimes(3);
        expect(prisma.inscription.create).toHaveBeenCalledTimes(3);
    });

    test("une collision de compte ne modifie pas le compte existant et annule toute la transaction", async () => {
        const { prisma, lire } = creerFausseBase();
        await prisma.user.create({ data: {
            email: "les3s.seed.parent-b@example.invalid", role: "admin", nom: "Autre", prenom: "Personne", password: "a-conserver",
        } });
        const avant = structuredClone(lire());
        await expect(seedScolaire(prisma, options())).rejects.toThrow(/collision/);
        // Le parent A créé plus tôt dans la transaction est lui aussi annulé.
        expect(lire()).toEqual(avant);
    });

    test.each([
        ["dateDebut", new Date("2026-08-15T00:00:00Z")],
        ["dateFin", new Date("2027-07-15T00:00:00Z")],
    ])("refuse une année portant le même libellé avec une autre %s et annule les créations", async (champ, valeur) => {
        const { prisma, lire } = creerFausseBase();
        await prisma.anneeScolaire.create({ data: {
            libelle: "2026-2027", dateDebut: new Date("2026-09-01T00:00:00Z"), dateFin: new Date("2027-06-30T00:00:00Z"),
            [champ]: valeur,
        } });
        const avant = structuredClone(lire());
        await expect(seedScolaire(prisma, options())).rejects.toThrow(/collision/);
        expect(lire()).toEqual(avant);
    });

    test.each([["ordre", 5], ["libelle", "Un autre niveau"]])(
        "refuse un niveau portant le même code avec un autre %s et annule les créations",
        async (champ, valeur) => {
            const { prisma, lire } = creerFausseBase();
            await prisma.niveau.create({ data: { code: "SEC1", libelle: "Secondaire 1", ordre: 1, [champ]: valeur } });
            const avant = structuredClone(lire());
            await expect(seedScolaire(prisma, options())).rejects.toThrow(/collision/);
            expect(lire()).toEqual(avant);
        },
    );

    test("une relance refuse des droits modifiés sans les élargir", async () => {
        const { prisma, lire } = creerFausseBase();
        await seedScolaire(prisma, options());
        lire().lienEleveTuteur[0].peutLire = false;
        const avant = structuredClone(lire());
        await expect(seedScolaire(prisma, options())).rejects.toThrow(/collision/);
        expect(lire()).toEqual(avant);
    });

    test.each([
        [{ ...ENV, DATABASE_URL: undefined }, "REFUSÉ"],
        [{ ...ENV, SEED_SCOLAIRE_PASSWORD: undefined }, "SEED_SCOLAIRE_PASSWORD"],
    ])("le point d'entrée CLI refuse un environnement incomplet avant de créer un client", async (env, raison) => {
        const creerClient = jest.fn();
        const sortie = { log: jest.fn(), error: jest.fn() };
        const code = await executerSeedScolaire({ env, creerClient, sortie });
        expect(code).toBe(1);
        expect(creerClient).not.toHaveBeenCalled();
        expect(sortie.error).toHaveBeenCalledWith(expect.stringContaining(raison));
    });

    test("le CLI utilise bcrypt, transmet la cible contrôlée et ferme le client après succès", async () => {
        const { prisma, lire } = creerFausseBase();
        const creerClient = jest.fn(async () => prisma);
        const sortie = { log: jest.fn(), error: jest.fn() };
        expect(await executerSeedScolaire({ env: ENV, creerClient, sortie })).toBe(0);
        expect(creerClient).toHaveBeenCalledWith(ENV.DATABASE_URL);
        expect(await bcrypt.compare(ENV.SEED_SCOLAIRE_PASSWORD, lire().user[0].password)).toBe(true);
        expect(bcrypt.getRounds(lire().user[0].password)).toBe(12);
        expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
        const messages = JSON.stringify(sortie.log.mock.calls);
        expect(messages).not.toContain(ENV.SEED_SCOLAIRE_PASSWORD);
        expect(messages).not.toContain(lire().user[0].password);
        expect(messages).not.toContain(ENV.DATABASE_URL);
    });

    test("un échec transactionnel ferme aussi le client sans divulguer l'erreur", async () => {
        const { prisma } = creerFausseBase();
        prisma.$transaction.mockRejectedValue(new Error(ENV.DATABASE_URL));
        const sortie = { log: jest.fn(), error: jest.fn() };
        expect(await executerSeedScolaire({ env: ENV, creerClient: async () => prisma, sortie })).toBe(1);
        expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(sortie.error.mock.calls)).not.toContain(ENV.DATABASE_URL);
    });

    test("les erreurs du fournisseur ne divulguent ni URL ni mot de passe", async () => {
        const sortie = { log: jest.fn(), error: jest.fn() };
        const code = await executerSeedScolaire({
            env: ENV, sortie,
            creerClient: async () => { throw new Error(`${ENV.DATABASE_URL} ${ENV.SEED_SCOLAIRE_PASSWORD}`); },
        });
        expect(code).toBe(1);
        const messages = JSON.stringify(sortie.error.mock.calls);
        expect(messages).not.toContain(ENV.DATABASE_URL);
        expect(messages).not.toContain(ENV.SEED_SCOLAIRE_PASSWORD);
        expect(messages).not.toContain("SecretConnexionFictif");
    });

    test("le véritable script refuse sans variable exportée, sans lire .env ni contacter une base", () => {
        const env = { ...process.env, SEED_SCOLAIRE_PASSWORD: ENV.SEED_SCOLAIRE_PASSWORD };
        delete env.DATABASE_URL;
        const resultat = spawnSync(process.execPath, [SCRIPT], { env, encoding: "utf8" });
        expect(resultat.status).toBe(1);
        expect(resultat.stderr).toContain("REFUSÉ");
        expect(`${resultat.stdout}${resultat.stderr}`).not.toContain(ENV.SEED_SCOLAIRE_PASSWORD);
    });
});
