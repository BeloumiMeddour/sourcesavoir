/**
 * Page « Gestion des Élèves » : droit exposé aux vues (exposerDroitsVues), constructeurs de
 * HTML (rendu.js) et cohérence entre views/eleves.handlebars, public/js/eleves.js et l'en-tête.
 */
import fs from "node:fs";
import path from "node:path";
import { jest } from "@jest/globals";
import { ROLES, exposerDroitsVues } from "../../middleware/permissions.js";
import { dateNaissanceAffichee, htmlLigneEleve, htmlLigneVideEleves } from "../../public/js/rendu.js";

const lire = (...segments) => fs.readFileSync(path.join(__dirname, "..", "..", ...segments), "utf8");

describe("exposerDroitsVues", () => {
    const executer = (user) => {
        const req = { user };
        const res = { locals: {} };
        const next = jest.fn();
        exposerDroitsVues(req, res, next);
        return { res, next };
    };

    test.each([ROLES.ADMIN, ROLES.RESPONSABLE])("%s dont le compte est validé peut gérer le scolaire", (role) => {
        expect(executer({ role, etat: "valide" }).res.locals.peut_gerer_scolaire).toBe(true);
    });

    test.each([ROLES.ADMIN, ROLES.RESPONSABLE])("%s dont le compte n'est pas validé ne le peut pas", (role) => {
        expect(executer({ role, etat: "en_attente" }).res.locals.peut_gerer_scolaire).toBe(false);
    });

    test.each([ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.ELEVE, ROLES.USER])("%s ne le peut pas", (role) => {
        expect(executer({ role, etat: "valide" }).res.locals.peut_gerer_scolaire).toBe(false);
    });

    test.each([undefined, null, {}, { role: "inconnu", etat: "valide" }])("sans rôle utilisable (%j), faux", (user) => {
        expect(executer(user).res.locals.peut_gerer_scolaire).toBe(false);
    });

    test("passe toujours la main, sans erreur", () => {
        const { next } = executer(undefined);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });
});

describe("dateNaissanceAffichee", () => {
    test("garde les dix premiers caractères d'une date ISO renvoyée par l'API", () => {
        expect(dateNaissanceAffichee("2014-04-12T00:00:00.000Z")).toBe("2014-04-12");
        expect(dateNaissanceAffichee("2014-04-12")).toBe("2014-04-12");
    });

    test.each([null, undefined, 20140412, new Date("2014-04-12"), {}, "", "pas une date", "2014-4-12", "12/04/2014"])(
        "donne une chaîne vide pour %j",
        (valeur) => {
            expect(dateNaissanceAffichee(valeur)).toBe("");
        }
    );
});

describe("htmlLigneEleve", () => {
    const eleve = { id: 7, matricule: "E-2026-001", nom: "Tremblay", prenom: "Lina", dateNaissance: "2014-04-12T00:00:00.000Z" };

    test("produit quatre cellules dans l'ordre du tableau", () => {
        const cellules = [...htmlLigneEleve(eleve).matchAll(/<td>([^<]*)<\/td>/g)].map((m) => m[1]);
        expect(cellules).toEqual(["E-2026-001", "Tremblay", "Lina", "2014-04-12"]);
    });

    test("laisse la date vide quand l'élève n'en a pas", () => {
        const cellules = [...htmlLigneEleve({ ...eleve, dateNaissance: null }).matchAll(/<td>([^<]*)<\/td>/g)].map((m) => m[1]);
        expect(cellules[3]).toBe("");
    });

    test("échappe les données saisies par un utilisateur (aucune balise injectée)", () => {
        const html = htmlLigneEleve({
            ...eleve,
            matricule: '"><script>alert(1)</script>',
            nom: "<img src=x onerror=alert(1)>",
            prenom: "O'Brien & fils",
        });
        expect(html).not.toContain("<script");
        expect(html).not.toContain("<img");
        expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
        expect(html).toContain("O&#39;Brien &amp; fils");
    });
});

describe("htmlLigneVideEleves", () => {
    test("occupe toute la largeur du tableau et indique qu'il n'y a aucun élève", () => {
        const html = htmlLigneVideEleves(4);
        expect(html).toContain('colspan="4"');
        expect(html).toContain("Aucun élève");
    });
});

describe("views/eleves.handlebars et public/js/eleves.js", () => {
    const vue = lire("views", "eleves.handlebars");
    const script = lire("public", "js", "eleves.js");
    const idsDeLaVue = new Set([...vue.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

    test("chaque identifiant lu par le script existe dans la vue", () => {
        const idsDuScript = [...script.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]);
        expect(idsDuScript.length).toBeGreaterThan(0);
        for (const id of idsDuScript) {
            expect(idsDeLaVue).toContain(id);
        }
    });

    test("le tableau interrogé par le script existe dans la vue", () => {
        expect(script).toContain("#table-eleves");
        expect(idsDeLaVue).toContain("table-eleves");
        expect(script).toContain('activerTriTableau("table-eleves")');
    });

    test("le formulaire propose les champs de l'API : matricule, nom, prénom, date de naissance", () => {
        for (const id of ["matricule", "nom", "prenom", "date-naissance"]) {
            expect(idsDeLaVue).toContain(id);
        }
        expect(script).toContain("/api/scolaire/eleves");
        expect(script).toContain('"Content-Type": "application/json"');
    });

    test("le lien de l'en-tête n'apparaît que sous la condition peut_gerer_scolaire", () => {
        const entete = lire("views", "partials", "header.handlebars");
        expect(entete).toMatch(/\{\{#if peut_gerer_scolaire\}\}[\s\S]*?href="\/eleves"[\s\S]*?\{\{\/if\}\}/);
        expect(entete.match(/href="\/eleves"/g)).toHaveLength(1);
    });
});
