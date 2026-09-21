/**
 * Page « Années, niveaux et groupes » : constructeurs de HTML (rendu.js) et cohérence entre
 * views/structure.handlebars, public/js/structure.js et l'en-tête.
 */
import fs from "node:fs";
import path from "node:path";
import {
    dateAffichee, dateNaissanceAffichee, htmlLigneVide, htmlLigneVideEleves,
    htmlLigneAnnee, htmlLigneNiveau, htmlLigneGroupe, htmlOptionsSelect,
} from "../../public/js/rendu.js";

const lire = (...segments) => fs.readFileSync(path.join(__dirname, "..", "..", ...segments), "utf8");
const cellules = (html) => [...html.matchAll(/<td>([^<]*)<\/td>/g)].map((m) => m[1]);

describe("dateAffichee", () => {
    test("garde les dix premiers caractères d'une date ISO", () => {
        expect(dateAffichee("2026-09-01T00:00:00.000Z")).toBe("2026-09-01");
    });

    test.each([null, undefined, 20260901, new Date("2026-09-01"), "", "septembre"])("donne \"\" pour %j", (valeur) => {
        expect(dateAffichee(valeur)).toBe("");
    });

    test("dateNaissanceAffichee reste disponible et se comporte pareil", () => {
        expect(dateNaissanceAffichee("2014-04-12T00:00:00.000Z")).toBe("2014-04-12");
        expect(dateNaissanceAffichee(null)).toBe("");
    });
});

describe("htmlLigneVide", () => {
    test("occupe toute la largeur et affiche le titre et la consigne", () => {
        const html = htmlLigneVide(3, "Aucune année", "Ajoutez-en une.");
        expect(html).toContain('colspan="3"');
        expect(html).toContain("<h3>Aucune année</h3>");
        expect(html).toContain("<p>Ajoutez-en une.</p>");
    });

    test("échappe le titre et la consigne", () => {
        const html = htmlLigneVide(1, "<script>alert(1)</script>", '"><img src=x>');
        expect(html).not.toContain("<script");
        expect(html).not.toContain("<img");
    });

    test("htmlLigneVideEleves s'appuie dessus et garde son texte", () => {
        const html = htmlLigneVideEleves(4);
        expect(html).toContain('colspan="4"');
        expect(html).toContain("Aucun élève");
    });
});

describe("htmlLigneAnnee", () => {
    test("produit libellé, début et fin dans l'ordre du tableau", () => {
        const annee = { id: 1, libelle: "2026-2027", dateDebut: "2026-09-01T00:00:00.000Z", dateFin: "2027-06-30T00:00:00.000Z" };
        expect(cellules(htmlLigneAnnee(annee))).toEqual(["2026-2027", "2026-09-01", "2027-06-30"]);
    });

    test("échappe le libellé saisi par un utilisateur", () => {
        const html = htmlLigneAnnee({ libelle: "<img src=x onerror=alert(1)>", dateDebut: null, dateFin: null });
        expect(html).not.toContain("<img");
        expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    });
});

describe("htmlLigneNiveau", () => {
    test("produit ordre, code et libellé dans l'ordre du tableau", () => {
        expect(cellules(htmlLigneNiveau({ id: 3, ordre: 6, code: "6E", libelle: "6e année" }))).toEqual(["6", "6E", "6e année"]);
    });

    test("affiche l'ordre 0 (valeur valide, pas une valeur vide)", () => {
        expect(cellules(htmlLigneNiveau({ ordre: 0, code: "M", libelle: "Maternelle" }))[0]).toBe("0");
    });

    test("échappe le code et le libellé", () => {
        const html = htmlLigneNiveau({ ordre: 1, code: "<b>", libelle: '"O\'Brien" & fils' });
        expect(html).not.toContain("<b>");
        expect(html).toContain("&quot;O&#39;Brien&quot; &amp; fils");
    });
});

describe("htmlLigneGroupe", () => {
    const groupe = {
        id: 9, code: "6A", capacite: 25,
        annee: { id: 1, libelle: "2026-2027" },
        niveau: { id: 3, code: "6E", libelle: "6e année" },
    };

    test("produit code, année, niveau et capacité dans l'ordre du tableau", () => {
        expect(cellules(htmlLigneGroupe(groupe))).toEqual(["6A", "2026-2027", "6E", "25"]);
    });

    test("affiche un tiret quand la capacité n'est pas définie", () => {
        expect(cellules(htmlLigneGroupe({ ...groupe, capacite: null }))[3]).toBe("—");
        expect(cellules(htmlLigneGroupe({ ...groupe, capacite: undefined }))[3]).toBe("—");
    });

    test("supporte l'absence d'année ou de niveau sans lever d'erreur", () => {
        expect(cellules(htmlLigneGroupe({ id: 1, code: "X", capacite: 5 }))).toEqual(["X", "", "", "5"]);
    });

    test("échappe le code du groupe", () => {
        const html = htmlLigneGroupe({ ...groupe, code: "<script>alert(1)</script>" });
        expect(html).not.toContain("<script");
    });
});

describe("htmlOptionsSelect", () => {
    test("une option par élément : valeur = identifiant, texte choisi par l'appelant", () => {
        const html = htmlOptionsSelect([{ id: 1, code: "6E" }, { id: 2, code: "7E" }], (n) => n.code);
        expect(html).toBe('<option value="1">6E</option><option value="2">7E</option>');
    });

    test("liste vide : aucune balise", () => {
        expect(htmlOptionsSelect([], (e) => e.id)).toBe("");
    });

    test("échappe le texte et la valeur (aucun attribut ni balise injectés)", () => {
        const html = htmlOptionsSelect([{ id: '1"><script>', code: '"><img src=x onerror=alert(1)>' }], (n) => n.code);
        expect(html).not.toContain("<script");
        expect(html).not.toContain("<img");
        expect(html.match(/<option/g)).toHaveLength(1);
    });
});

describe("views/structure.handlebars et public/js/structure.js", () => {
    const vue = lire("views", "structure.handlebars");
    const script = lire("public", "js", "structure.js");
    const idsDeLaVue = new Set([...vue.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

    const idsCites = (motif) => [...script.matchAll(motif)].map((m) => m[1]);

    test("chaque identifiant lu par le script existe dans la vue", () => {
        const ids = [
            ...idsCites(/getElementById\("([^"]+)"\)/g),
            ...idsCites(/nombreOuVide\("([^"]+)"\)/g),
            ...idsCites(/remplirSelect\("([^"]+)"/g),
            ...idsCites(/remplirTableau\("([^"]+)"/g),
            ...idsCites(/activerTriTableau\("([^"]+)"\)/g),
        ];
        expect(ids.length).toBeGreaterThan(10);
        for (const id of ids) {
            expect(idsDeLaVue).toContain(id);
        }
    });

    test("chaque champ du script a une entrée dans la vue, et les trois formulaires existent", () => {
        for (const id of [
            "form-annee", "annee-libelle", "annee-debut", "annee-fin",
            "form-niveau", "niveau-code", "niveau-libelle", "niveau-ordre",
            "form-groupe", "groupe-code", "groupe-annee", "groupe-niveau", "groupe-capacite",
            "table-annees", "table-niveaux", "table-groupes", "msg-annee", "msg-niveau", "msg-groupe",
        ]) {
            expect(idsDeLaVue).toContain(id);
        }
    });

    test("le script appelle les trois API scolaires et envoie du JSON", () => {
        for (const url of ["/api/scolaire/annees", "/api/scolaire/niveaux", "/api/scolaire/groupes"]) {
            expect(script).toContain(url);
        }
        expect(script).toContain('"Content-Type": "application/json"');
    });

    test("les identifiants de la vue sont uniques", () => {
        const tous = [...vue.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
        expect(new Set(tous).size).toBe(tous.length);
    });

    test("le lien de l'en-tête est sous la condition peut_gerer_scolaire, une seule fois", () => {
        const entete = lire("views", "partials", "header.handlebars");
        expect(entete).toMatch(/\{\{#if peut_gerer_scolaire\}\}[\s\S]*?href="\/structure"[\s\S]*?\{\{\/if\}\}/);
        expect(entete.match(/href="\/structure"/g)).toHaveLength(1);
    });
});
