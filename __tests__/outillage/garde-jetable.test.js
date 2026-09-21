/**
 * Tests du garde-fou « base jetable » (scripts/garde-jetable.js)
 *
 * Toutes les URL sont factices. Aucune connexion à une base n'est ouverte.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { analyserUrl, evaluerGarde } from "../../scripts/garde-jetable.js";

const SCRIPT = path.resolve(__dirname, "../../scripts/garde-jetable.js");
const MOT_DE_PASSE = "MotDePasseSecret123";

describe("Garde-fou base jetable", () => {
    describe("analyserUrl", () => {
        test("extrait l'hôte et le nom de base (hôte:port)", () => {
            const url = `sqlserver://localhost:1433;database=planify_jetable;user=sa;password=${MOT_DE_PASSE};trustServerCertificate=true`;
            expect(analyserUrl(url)).toEqual({ hote: "localhost", base: "planify_jetable" });
        });

        test("ignore l'instance nommée et met en minuscules", () => {
            const url = "sqlserver://(LocalDB)\\MSSQLLocalDB;database=Scratch_1;integratedSecurity=true";
            expect(analyserUrl(url)).toEqual({ hote: "(localdb)", base: "scratch_1" });
        });

        test("ignore les identifiants placés avant l'arobase (format du README)", () => {
            const url = `sqlserver://utilisateur:${MOT_DE_PASSE}@localhost:1433;database=planify;trustServerCertificate=true`;
            expect(analyserUrl(url)).toEqual({ hote: "localhost", base: "planify" });
        });

        test("accepte « initial catalog », la casse des clés et les accolades", () => {
            const url = "sqlserver://127.0.0.1;Initial Catalog={ma_base_test};user=sa";
            expect(analyserUrl(url)).toEqual({ hote: "127.0.0.1", base: "ma_base_test" });
        });

        test("un mot de passe entre accolades contenant « ; » ne peut pas injecter un nom de base", () => {
            const url = `sqlserver://localhost:1433;database=planify;user=sa;password={${MOT_DE_PASSE};database=test}`;
            expect(analyserUrl(url)).toEqual({ hote: "localhost", base: "planify" });
            expect(evaluerGarde(url).ok).toBe(false);
        });

        test("retourne base null quand la propriété database est absente", () => {
            expect(analyserUrl("sqlserver://localhost:1433;user=sa")).toEqual({ hote: "localhost", base: null });
        });

        test.each([[undefined], [null], [42], [""], ["postgres://localhost/test"], ["localhost;database=test"]])(
            "retourne null pour une valeur non SQL Server : %p",
            (valeur) => {
                expect(analyserUrl(valeur)).toBeNull();
            },
        );
    });

    describe("evaluerGarde : bases autorisées", () => {
        test.each([
            ["localhost + jetable", "sqlserver://localhost:1433;database=planify_jetable;user=sa;password=x"],
            ["127.0.0.1 + scratch", "sqlserver://127.0.0.1:1433;database=scratch;user=sa;password=x"],
            ["(localdb) + test", "sqlserver://(localdb)\\MSSQLLocalDB;database=planify_test;integratedSecurity=true"],
            ["casse ignorée", "SQLSERVER://LOCALHOST;DATABASE=Planify_JETABLE;user=sa"],
            ["format du README", "sqlserver://utilisateur:x@localhost:1433;database=planify_test;trustServerCertificate=true"],
        ])("accepte %s", (_etiquette, url) => {
            expect(evaluerGarde(url)).toEqual({ ok: true });
        });
    });

    describe("evaluerGarde : refus", () => {
        test.each([[undefined], [null], [""], ["   "]])("refuse quand DATABASE_URL est absente ou vide : %p", (valeur) => {
            const resultat = evaluerGarde(valeur);
            expect(resultat.ok).toBe(false);
            expect(resultat.raison).toMatch(/absente/);
        });

        test("refuse une URL qui n'est pas au format SQL Server", () => {
            const resultat = evaluerGarde(`postgres://sa:${MOT_DE_PASSE}@localhost/planify_test`);
            expect(resultat.ok).toBe(false);
            expect(resultat.raison).toMatch(/format/);
        });

        test.each([
            ["hôte distant, base test", "sqlserver://serveur.database.windows.net:1433;database=planify_test;user=sa;password=x"],
            ["hôte imitant localhost", "sqlserver://localhost.exemple.com;database=planify_test;user=sa"],
            ["arobase trompeur", "sqlserver://localhost:secret@serveur.exemple.com;database=planify_test"],
            ["adresse IP distante", "sqlserver://10.0.0.5:1433;database=planify_jetable;user=sa"],
        ])("refuse un hôte non local : %s", (_etiquette, url) => {
            const resultat = evaluerGarde(url);
            expect(resultat.ok).toBe(false);
            expect(resultat.raison).toMatch(/hôte/);
        });

        test.each([
            ["nom de la base réelle", "sqlserver://localhost:1433;database=planify;user=sa;password=x"],
            ["nom de production", "sqlserver://localhost:1433;database=planify_prod;user=sa;password=x"],
        ])("refuse une base locale non jetable : %s", (_etiquette, url) => {
            const resultat = evaluerGarde(url);
            expect(resultat.ok).toBe(false);
            expect(resultat.raison).toMatch(/nom de la base/);
        });

        test("refuse quand le nom de la base est absent", () => {
            const resultat = evaluerGarde("sqlserver://localhost:1433;user=sa;password=x");
            expect(resultat.ok).toBe(false);
            expect(resultat.raison).toMatch(/absent/);
        });

        test("ne recopie jamais l'URL, le mot de passe, l'hôte ni le nom de base dans la raison", () => {
            const urls = [
                `sqlserver://serveur-reel.database.windows.net:1433;database=planify_reelle;user=admin;password=${MOT_DE_PASSE}`,
                `sqlserver://localhost:1433;database=planify_reelle;user=admin;password=${MOT_DE_PASSE}`,
                `sqlserver://localhost:1433;user=admin;password=${MOT_DE_PASSE}`,
                `postgres://admin:${MOT_DE_PASSE}@serveur-reel/planify_reelle`,
            ];
            for (const url of urls) {
                const { ok, raison } = evaluerGarde(url);
                expect(ok).toBe(false);
                for (const secret of [MOT_DE_PASSE, "serveur-reel", "planify_reelle", "admin", url]) {
                    expect(raison).not.toContain(secret);
                }
            }
        });
    });

    describe("evaluerGarde : nom de base par segment", () => {
        const url = (base) => `sqlserver://localhost:1433;database=${base};user=sa;password=x`;

        test.each([
            "les3s_scratch_142530", "planify_jetable", "test", "scratch", "jetable", "a.test", "ma-base-test",
            "Planify_TEST", "test_1", "JETABLE-2",
        ])("accepte %s : un segment est exactement jetable, scratch ou test", (base) => {
            expect(evaluerGarde(url(base))).toEqual({ ok: true });
        });

        test.each([
            "latest", "contest", "attestation_prod", "testing", "jetable2", "test1", "xtest", "mytest_db",
            "scratchpad", "les3s_scratchy", "planify", "tes_t",
        ])("refuse %s : aucun segment n'est exactement jetable, scratch ou test", (base) => {
            const resultat = evaluerGarde(url(base));
            expect(resultat.ok).toBe(false);
            expect(resultat.raison).toMatch(/nom de la base/);
            expect(resultat.raison).not.toContain(base);
        });

        test("le motif ne s'applique qu'au nom de base, pas au reste de l'URL", () => {
            const resultat = evaluerGarde("sqlserver://localhost:1433;database=planify;user=test;password=jetable;applicationName=scratch");
            expect(resultat.ok).toBe(false);
        });
    });

    describe("evaluerGarde : plusieurs propriétés database", () => {
        test.each([
            ["test puis réelle", "sqlserver://localhost;database=planify_test;database=planify"],
            ["réelle puis test", "sqlserver://localhost;database=planify;database=planify_test"],
            ["deux jetables", "sqlserver://localhost;database=planify_test;database=planify_jetable"],
            ["alias initial catalog", "sqlserver://localhost;database=planify_test;initial catalog=planify"],
            ["casse des clés", "sqlserver://localhost;DATABASE=planify_test;Database=planify"],
        ])("refuse : %s", (_etiquette, url) => {
            const resultat = evaluerGarde(url);
            expect(resultat.ok).toBe(false);
            expect(resultat.raison).toMatch(/plusieurs/);
            expect(resultat.raison).not.toContain("planify");
        });

        test("analyserUrl signale l'ambiguïté et ne choisit aucune base", () => {
            expect(analyserUrl("sqlserver://localhost;database=a_test;database=b")).toEqual({
                hote: "localhost", base: null, basesMultiples: true,
            });
        });

        test("un « database= » dans un mot de passe entre accolades ne compte pas", () => {
            const url = "sqlserver://localhost;database=planify_test;password={x;database=y}";
            expect(evaluerGarde(url)).toEqual({ ok: true });
        });
    });

    describe("evaluerGarde : hôte strict", () => {
        test.each([
            ["espace avant l'hôte", "sqlserver:// localhost;database=planify_test"],
            ["espace après l'hôte", "sqlserver://localhost ;database=planify_test"],
            ["espace après le port", "sqlserver://localhost:1433 ;database=planify_test"],
            ["tabulation", "sqlserver://localhost\t;database=planify_test"],
            ["espace insécable", "sqlserver://localhost ;database=planify_test"],
            ["espace dans l'hôte", "sqlserver://local host;database=planify_test"],
            ["hôte suffixé", "sqlserver://127.0.0.1.exemple.com;database=planify_test"],
            ["port non numérique", "sqlserver://localhost:abc;database=planify_test"],
            ["second port", "sqlserver://localhost:1433:9;database=planify_test"],
            ["virgule à la place du port", "sqlserver://localhost,1433;database=planify_test"],
            ["localdb avec espace", "sqlserver://( localdb );database=planify_test"],
            ["lettre latine lookalike", "sqlserver://locaLhosṫ;database=planify_test"],
            ["hôte vide après les identifiants", "sqlserver://sa:x@;database=planify_test"],
        ])("refuse : %s", (_etiquette, url) => {
            expect(evaluerGarde(url).ok).toBe(false);
        });

        test.each([
            ["casse mixte", "sqlserver://LocalHost:1433;database=planify_test"],
            ["localdb en casse mixte", "sqlserver://(LocalDB)\\MSSQLLocalDB;database=planify_test"],
            ["instance nommée locale", "sqlserver://localhost\\SQLEXPRESS;database=planify_test"],
            ["127.0.0.1 avec port", "sqlserver://127.0.0.1:14330;database=planify_test"],
            ["identifiants avant l'arobase", "sqlserver://sa:x@localhost:1433;database=planify_test"],
        ])("accepte : %s", (_etiquette, url) => {
            expect(evaluerGarde(url)).toEqual({ ok: true });
        });

        test("l'URL entière peut être entourée d'espaces (variable d'environnement)", () => {
            expect(evaluerGarde("  sqlserver://localhost;database=planify_test  ")).toEqual({ ok: true });
        });
    });

    describe("ligne de commande", () => {
        // Lance le script avec un environnement explicite (sans dotenv : .env n'est pas lu)
        const lancer = (url) => {
            const env = { ...process.env };
            delete env.DATABASE_URL;
            if (url !== undefined) env.DATABASE_URL = url;
            return spawnSync(process.execPath, [SCRIPT], { env, encoding: "utf8" });
        };

        test("sort en code 0 pour une base locale jetable", () => {
            const resultat = lancer(`sqlserver://localhost:1433;database=planify_jetable;user=sa;password=${MOT_DE_PASSE}`);
            expect(resultat.status).toBe(0);
            expect(resultat.stdout).toMatch(/OK/);
        });

        test("sort en code 1 sans DATABASE_URL", () => {
            const resultat = lancer(undefined);
            expect(resultat.status).toBe(1);
            expect(resultat.stderr).toMatch(/REFUSÉ/);
        });

        test("sort en code 1 pour une base non jetable, sans rien divulguer", () => {
            const resultat = lancer(`sqlserver://serveur-reel:1433;database=planify_reelle;user=admin;password=${MOT_DE_PASSE}`);
            expect(resultat.status).toBe(1);
            expect(resultat.stderr).toMatch(/REFUSÉ/);
            const sortie = `${resultat.stdout}${resultat.stderr}`;
            for (const secret of [MOT_DE_PASSE, "serveur-reel", "planify_reelle", "admin"]) {
                expect(sortie).not.toContain(secret);
            }
        });
    });
});
