// Garde-fou des commandes Prisma qui touchent à une base (migrate status / deploy) :
// elles ne sont autorisées que sur une base LOCALE dont le nom indique qu'elle est jetable.
//
// Usage : npm run db:garde   (appelé automatiquement par db:status et db:deploy:jetable)
// Code de sortie : 0 = base jetable autorisée ; 1 = refus (variable absente, base non locale,
// plusieurs propriétés database ou nom de base sans segment jetable/scratch/test).
// Le nom est découpé sur _ - . et l'un des segments doit être EXACTEMENT jetable, scratch
// ou test (planify_test oui ; latest, contest, attestation_prod non). L'hôte est comparé
// tel quel (casse ignorée, aucun espace toléré) à localhost, 127.0.0.1 ou (localdb).
//
// DATABASE_URL est lue dans l'environnement du PROCESSUS, sans dotenv : le fichier .env n'est
// volontairement pas lu. Prisma donne priorité à l'environnement du processus sur .env, donc
// la valeur contrôlée ici est bien celle que Prisma utilisera. Pour cibler la base jetable :
//   PowerShell : $env:DATABASE_URL = "sqlserver://localhost:1433;database=planify_jetable;user=...;password=...;trustServerCertificate=true"
//   Bash       : export DATABASE_URL="sqlserver://localhost:1433;database=planify_jetable;..."
//
// Le mot de passe et l'URL ne sont JAMAIS affichés : les messages ne donnent que la raison du
// refus, sans recopier la moindre partie de la valeur.

const HOTES_AUTORISES = ["localhost", "127.0.0.1", "(localdb)"];
const MOTS_JETABLES = ["jetable", "scratch", "test"];
const PREFIXE_URL = /^sqlserver:\/\//i;
// Hôte suivi d'un port numérique facultatif puis d'une instance nommée facultative.
// Aucun espace, deux-points ou barre oblique inverse supplémentaire n'est toléré.
const REGEX_HOTE = /^([^:\\\s]*)(?::\d{1,5})?(?:\\[^\s:\\]+)?$/;

// Découpe sur « ; » en ignorant ceux qui sont entre accolades (valeur du type password={a;b}),
// pour qu'un mot de passe ne puisse jamais être pris pour une propriété (ex. database=...)
function decouperProprietes(texte) {
    const morceaux = [];
    let profondeur = 0;
    let courant = "";
    for (const caractere of texte) {
        if (caractere === "{") profondeur++;
        if (caractere === "}" && profondeur > 0) profondeur--;
        if (caractere === ";" && profondeur === 0) {
            morceaux.push(courant);
            courant = "";
        } else {
            courant += caractere;
        }
    }
    morceaux.push(courant);
    return morceaux;
}

// Extrait l'hôte et le nom de base d'une URL Prisma SQL Server :
//   sqlserver://HOTE[:PORT][\INSTANCE];database=BASE;user=...;password=...
// Retourne null si l'URL n'a pas le format attendu.
export function analyserUrl(url) {
    if (typeof url !== "string") return null;
    const texte = url.trim();
    if (!PREFIXE_URL.test(texte)) return null;

    const [debut, ...proprietes] = decouperProprietes(texte.replace(PREFIXE_URL, ""));

    // Hôte : ce qui suit un éventuel « utilisateur:motdepasse@ », avant le port ou l'instance.
    // Aucun nettoyage des espaces : « localhost » suivi d'un espace ou d'une tabulation
    // est une valeur différente, refusée plus loin (le pilote pourrait l'interpréter autrement).
    // Le reste (port numérique, instance) doit avoir la forme attendue, sinon l'hôte
    // est la chaîne entière, qui ne figure pas dans la liste des hôtes autorisés.
    const sansIdentifiants = debut.slice(debut.lastIndexOf("@") + 1);
    const correspondance = REGEX_HOTE.exec(sansIdentifiants);
    const hote = (correspondance ? correspondance[1] : sansIdentifiants).toLowerCase();

    // Nom de base : propriété « database » (ou « initial catalog »), valeur éventuellement entre accolades.
    // Plusieurs propriétés : ambiguïté (le pilote et ce contrôle pourraient retenir des valeurs
    // différentes), donc aucune base n'est choisie.
    const bases = [];
    for (const propriete of proprietes) {
        const separateur = propriete.indexOf("=");
        if (separateur < 0) continue;
        const cle = propriete.slice(0, separateur).trim().toLowerCase();
        if (cle === "database" || cle === "initial catalog") {
            bases.push(propriete
                .slice(separateur + 1)
                .trim()
                .replace(/^\{(.*)\}$/, "$1")
                .toLowerCase());
        }
    }
    if (bases.length > 1) {
        return { hote, base: null, basesMultiples: true };
    }

    return { hote, base: bases.length === 1 ? bases[0] : null };
}

// Un nom de base est jetable si l'un de ses SEGMENTS (découpe sur _ - .) vaut exactement
// un mot jetable : « planify_test » oui ; « latest », « contest », « attestation_prod » non.
function estNomJetable(base) {
    return base.split(/[_\-.]/).some((segment) => MOTS_JETABLES.includes(segment));
}

// Évalue l'URL : { ok: true } si la base est locale ET jetable, sinon { ok: false, raison }.
export function evaluerGarde(url) {
    if (typeof url !== "string" || url.trim() === "") {
        return {
            ok: false,
            raison: "DATABASE_URL est absente de l'environnement du processus (le fichier .env n'est pas lu : exporter la variable vers la base jetable).",
        };
    }

    const analyse = analyserUrl(url);
    if (!analyse || analyse.hote === "") {
        return {
            ok: false,
            raison: "DATABASE_URL n'a pas le format attendu (sqlserver://HOTE;database=BASE;...).",
        };
    }

    if (!HOTES_AUTORISES.includes(analyse.hote)) {
        return {
            ok: false,
            raison: "l'hôte de la base n'est pas local (seuls localhost, 127.0.0.1 et (localdb) sont acceptés).",
        };
    }

    if (analyse.basesMultiples) {
        return {
            ok: false,
            raison: "DATABASE_URL contient plusieurs propriétés database : la base visée serait ambiguë.",
        };
    }

    if (!analyse.base) {
        return {
            ok: false,
            raison: "le nom de la base (database=...) est absent de DATABASE_URL.",
        };
    }

    if (!estNomJetable(analyse.base)) {
        return {
            ok: false,
            raison: "le nom de la base n'a aucun segment (séparé par _ - .) égal à « jetable », « scratch » ou « test ».",
        };
    }

    return { ok: true };
}

function principal() {
    const resultat = evaluerGarde(process.env.DATABASE_URL);
    if (!resultat.ok) {
        console.error(`Garde-fou base jetable : REFUSÉ, ${resultat.raison}`);
        console.error("Aucune commande Prisma n'a été lancée.");
        process.exit(1);
    }
    console.log("Garde-fou base jetable : OK (hôte local, base jetable).");
}

// Exécute le contrôle seulement quand le fichier est lancé directement (pas à l'import, ex. tests)
if (process.argv[1] && /garde-jetable\.js$/.test(process.argv[1].replace(/\\/g, "/"))) {
    principal();
}
