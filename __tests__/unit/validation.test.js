/**
 * Tests unitaires pour model/validation.js : validateurs partagés par les
 * modèles du socle scolaire (aucune dépendance à Prisma).
 */
import {
    ErreurValidation,
    ErreurIntrouvable,
    ErreurConflit,
    ID_MAX,
    exigerObjet,
    chaineObligatoire,
    chaineOptionnelle,
    courrielOptionnel,
    entierBorne,
    entierBorneOptionnel,
    identifiant,
    identifiantOptionnel,
    dateISO,
    dateISOOptionnelle,
    booleen,
} from "../../model/validation.js";

const refuse = (fonction, motif) => {
    expect(fonction).toThrow(ErreurValidation);
    if (motif) {
        expect(fonction).toThrow(motif);
    }
};

describe("classes d'erreur", () => {
    test("ErreurValidation est une Error nommée, avec son message", () => {
        const erreur = new ErreurValidation("Message clair");

        expect(erreur).toBeInstanceOf(Error);
        expect(erreur).toBeInstanceOf(ErreurValidation);
        expect(erreur.name).toBe("ErreurValidation");
        expect(erreur.message).toBe("Message clair");
    });

    test("ErreurConflit est distincte de ErreurValidation et ErreurIntrouvable", () => {
        const erreur = new ErreurConflit("Déjà pris");
        expect(erreur).toBeInstanceOf(Error);
        expect(erreur).toBeInstanceOf(ErreurConflit);
        expect(erreur).not.toBeInstanceOf(ErreurValidation);
        expect(erreur).not.toBeInstanceOf(ErreurIntrouvable);
        expect(erreur.name).toBe("ErreurConflit");
        expect(erreur.message).toBe("Déjà pris");
    });

    test("ErreurIntrouvable est distincte de ErreurValidation", () => {
        const erreur = new ErreurIntrouvable("Absent");

        expect(erreur).toBeInstanceOf(Error);
        expect(erreur).toBeInstanceOf(ErreurIntrouvable);
        expect(erreur).not.toBeInstanceOf(ErreurValidation);
        expect(erreur.name).toBe("ErreurIntrouvable");
        expect(erreur.message).toBe("Absent");
    });

    test("ID_MAX est la borne d'un INT SQL Server", () => {
        expect(ID_MAX).toBe(2147483647);
    });
});

describe("exigerObjet", () => {
    test("retourne l'objet reçu tel quel", () => {
        const donnees = { a: 1 };

        expect(exigerObjet(donnees)).toBe(donnees);
        expect(exigerObjet({})).toEqual({});
    });

    test.each([undefined, null, "texte", 42, true, [], [{ a: 1 }]])("refuse %p", (valeur) => {
        refuse(() => exigerObjet(valeur), "objet JSON");
    });
});

describe("chaineObligatoire", () => {
    test("retourne la chaîne sans les espaces de bordure", () => {
        expect(chaineObligatoire("  SEC1  ", "code", 20)).toBe("SEC1");
    });

    test("accepte la longueur exacte du maximum, refuse le maximum + 1", () => {
        expect(chaineObligatoire("a".repeat(20), "code", 20)).toBe("a".repeat(20));
        refuse(() => chaineObligatoire("a".repeat(21), "code", 20), "20");
    });

    test("la longueur est mesurée après suppression des espaces de bordure", () => {
        expect(chaineObligatoire(` ${"a".repeat(20)} `, "code", 20)).toBe("a".repeat(20));
    });

    test.each([undefined, null, "", "   ", "\t\n"])("refuse une valeur absente ou vide (%p)", (valeur) => {
        refuse(() => chaineObligatoire(valeur, "code", 20), "obligatoire");
    });

    test.each([42, true, {}, [], ["a"], { a: "b" }, () => "a"])("refuse une valeur qui n'est pas une chaîne (%p)", (valeur) => {
        refuse(() => chaineObligatoire(valeur, "code", 20), "chaîne");
    });

    test("le message cite le champ, jamais la valeur reçue", () => {
        try {
            chaineObligatoire("x".repeat(500), "matricule", 30);
        } catch (erreur) {
            expect(erreur.message).toContain("matricule");
            expect(erreur.message).not.toContain("xxxxx");
            return;
        }
        throw new Error("aucune erreur levée");
    });

    test.each(["a\u0000b", "a\nb", "a\rb", "a\tb", "a\u0007b", "a\u007Fb"])("refuse les caractères de contrôle (%j)", (valeur) => {
        refuse(() => chaineObligatoire(valeur, "nom", 100), "non autorisés");
    });

    test.each([
        "O'Brien",
        "Jean-Philippe",
        "Élodie Côté",
        "李小龍",
        "Ελένη",
        "Robert'); DROP TABLE Eleve;--",
        "<script>alert(1)</script>",
        "a\\b/c",
        "😀",
    ])("laisse passer les caractères spéciaux et Unicode tels quels (%s)", (valeur) => {
        expect(chaineObligatoire(valeur, "nom", 100)).toBe(valeur);
    });

    test("la longueur compte les unités UTF-16, comme NVARCHAR(n)", () => {
        expect(chaineObligatoire("😀".repeat(10), "code", 20)).toBe("😀".repeat(10));
        refuse(() => chaineObligatoire("😀".repeat(11), "code", 20));
    });
});

describe("chaineOptionnelle", () => {
    test.each([undefined, null, "", "   "])("valeur absente ou vide (%p) : null", (valeur) => {
        expect(chaineOptionnelle(valeur, "telephone", 30)).toBeNull();
    });

    test("retourne la chaîne sans les espaces de bordure", () => {
        expect(chaineOptionnelle(" 514-555-0100 ", "telephone", 30)).toBe("514-555-0100");
    });

    test("refuse un dépassement de longueur", () => {
        refuse(() => chaineOptionnelle("1".repeat(31), "telephone", 30), "30");
    });

    test.each([42, true, {}, []])("refuse une valeur qui n'est pas une chaîne (%p)", (valeur) => {
        refuse(() => chaineOptionnelle(valeur, "telephone", 30), "chaîne");
    });

    test("refuse les caractères de contrôle", () => {
        refuse(() => chaineOptionnelle("5\u00005", "telephone", 30), "non autorisés");
    });
});

describe("courrielOptionnel", () => {
    test.each([undefined, null, "", "  "])("valeur absente (%p) : null", (valeur) => {
        expect(courrielOptionnel(valeur, "courriel", 150)).toBeNull();
    });

    test("retourne l'adresse sans les espaces de bordure", () => {
        expect(courrielOptionnel(" parent@exemple.ca ", "courriel", 150)).toBe("parent@exemple.ca");
    });

    test.each(["sans-arobase", "a@b", "@b.ca", "a@.ca", "a b@c.ca", "a@b .ca", "a@@b.ca"])(
        "refuse l'adresse mal formée %j",
        (valeur) => {
            refuse(() => courrielOptionnel(valeur, "courriel", 150), "courriel");
        }
    );

    test("refuse une adresse trop longue", () => {
        refuse(() => courrielOptionnel(`${"a".repeat(150)}@exemple.ca`, "courriel", 150), "150");
    });

    test.each([42, true, {}, []])("refuse une valeur qui n'est pas une chaîne (%p)", (valeur) => {
        refuse(() => courrielOptionnel(valeur, "courriel", 150), "chaîne");
    });
});

describe("entierBorne", () => {
    test("accepte les bornes incluses", () => {
        expect(entierBorne(0, "ordre", 0, 1000)).toBe(0);
        expect(entierBorne(1000, "ordre", 0, 1000)).toBe(1000);
        expect(entierBorne(5, "ordre", 0, 1000)).toBe(5);
    });

    test.each([-1, 1001])("refuse hors bornes (%p)", (valeur) => {
        refuse(() => entierBorne(valeur, "ordre", 0, 1000), "entier");
    });

    test.each([undefined, null, "5", "", 1.5, NaN, Infinity, -Infinity, true, {}, [5], "abc", 1e21])(
        "refuse une valeur qui n'est pas un entier (%p)",
        (valeur) => {
            refuse(() => entierBorne(valeur, "ordre", 0, 1000), "entier");
        }
    );
});

describe("entierBorneOptionnel", () => {
    test.each([undefined, null])("valeur absente (%p) : null", (valeur) => {
        expect(entierBorneOptionnel(valeur, "capacite", 1, 1000)).toBeNull();
    });

    test("valide la valeur fournie", () => {
        expect(entierBorneOptionnel(30, "capacite", 1, 1000)).toBe(30);
        refuse(() => entierBorneOptionnel(0, "capacite", 1, 1000));
        refuse(() => entierBorneOptionnel("30", "capacite", 1, 1000));
    });
});

describe("identifiant", () => {
    test.each([1, 42, ID_MAX])("accepte %p", (valeur) => {
        expect(identifiant(valeur, "id_annee")).toBe(valeur);
    });

    test.each([undefined, null, 0, -1, 1.5, ID_MAX + 1, NaN, "1", "", true, {}, [1], { connect: { id: 1 } }])(
        "refuse %p",
        (valeur) => {
            refuse(() => identifiant(valeur, "id_annee"), "id_annee");
        }
    );
});

describe("identifiantOptionnel", () => {
    test.each([undefined, null])("valeur absente (%p) : null", (valeur) => {
        expect(identifiantOptionnel(valeur, "id_user")).toBeNull();
    });

    test("valide la valeur fournie", () => {
        expect(identifiantOptionnel(7, "id_user")).toBe(7);
        refuse(() => identifiantOptionnel(0, "id_user"), "id_user");
        refuse(() => identifiantOptionnel("7", "id_user"), "id_user");
        refuse(() => identifiantOptionnel({ connect: { id: 7 } }, "id_user"), "id_user");
    });
});

describe("dateISO", () => {
    test("convertit AAAA-MM-JJ en date UTC à minuit", () => {
        const date = dateISO("2026-09-01", "dateDebut");

        expect(date).toBeInstanceOf(Date);
        expect(date.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    });

    test.each(["2024-02-29", "2000-02-29", "1900-01-01", "2100-12-31"])("accepte la date valide %s", (valeur) => {
        expect(dateISO(valeur, "d").toISOString().slice(0, 10)).toBe(valeur);
    });

    test.each([
        "2026-02-30",
        "2026-02-29",
        "1900-02-29",
        "2026-13-01",
        "2026-00-10",
        "2026-04-31",
        "2026-09-00",
        "2026-09-32",
        "1899-12-31",
        "2101-01-01",
        "0000-01-01",
        "9999-12-31",
    ])("refuse la date impossible ou hors bornes %s", (valeur) => {
        refuse(() => dateISO(valeur, "dateDebut"), "dateDebut");
    });

    test.each([
        "2026-9-1",
        "26-09-01",
        "2026/09/01",
        "01-09-2026",
        "20260901",
        " 2026-09-01",
        "2026-09-01 ",
        "2026-09-01T00:00:00.000Z",
        "2026-09-01T00:00:00",
        "septembre",
        "",
        "2026-09-01\n",
        "２０２６-09-01",
    ])("refuse le format %j", (valeur) => {
        refuse(() => dateISO(valeur, "dateDebut"), "AAAA-MM-JJ");
    });

    test.each([undefined, null, 20260901, new Date("2026-09-01"), true, {}, [], ["2026-09-01"]])(
        "refuse ce qui n'est pas une chaîne (%p)",
        (valeur) => {
            refuse(() => dateISO(valeur, "dateDebut"), "dateDebut");
        }
    );
});

describe("dateISOOptionnelle", () => {
    test.each([undefined, null, ""])("valeur absente (%p) : null", (valeur) => {
        expect(dateISOOptionnelle(valeur, "dateNaissance")).toBeNull();
    });

    test("valide la valeur fournie", () => {
        expect(dateISOOptionnelle("2012-05-17", "dateNaissance").toISOString()).toBe("2012-05-17T00:00:00.000Z");
        refuse(() => dateISOOptionnelle("2012-02-30", "dateNaissance"), "dateNaissance");
        refuse(() => dateISOOptionnelle(20120517, "dateNaissance"), "dateNaissance");
    });
});

describe("booleen", () => {
    test("retourne la valeur booléenne fournie", () => {
        expect(booleen(true, "peutLire", false)).toBe(true);
        expect(booleen(false, "peutLire", true)).toBe(false);
    });

    test("valeur absente : valeur par défaut", () => {
        expect(booleen(undefined, "peutLire", true)).toBe(true);
        expect(booleen(undefined, "peutAgir", false)).toBe(false);
    });

    test.each([null, "true", "false", 0, 1, "", {}, []])("refuse %p (pas de conversion implicite)", (valeur) => {
        refuse(() => booleen(valeur, "peutAgir", false), "peutAgir");
    });
});
