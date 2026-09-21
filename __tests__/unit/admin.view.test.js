/**
 * Tests de la vue views/admin.handlebars : les deux listes déroulantes de rôle
 * (création et modification d'un compte) doivent proposer tous les rôles de ROLES.
 */
import fs from "node:fs";
import path from "node:path";
import { ROLES } from "../../middleware/permissions.js";

const source = fs.readFileSync(path.join(__dirname, "..", "..", "views", "admin.handlebars"), "utf8");

/**
 * Extrait les options { value, label } du <select> portant l'identifiant donné.
 */
const optionsDuSelect = (id) => {
    const select = source.match(new RegExp(`<select id="${id}">([\\s\\S]*?)</select>`));
    if (!select) return null;

    return [...select[1].matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)].map(
        ([, value, label]) => ({ value, label: label.trim() })
    );
};

describe("views/admin.handlebars - listes déroulantes de rôle", () => {
    describe.each([
        ["role", "création d'un compte"],
        ["mod-role", "modification d'un compte"],
    ])("#%s (%s)", (id) => {
        test("le select existe", () => {
            expect(optionsDuSelect(id)).not.toBeNull();
        });

        test("propose exactement les valeurs de ROLES, sans doublon", () => {
            const valeurs = optionsDuSelect(id).map((o) => o.value);

            expect([...valeurs].sort()).toEqual(Object.values(ROLES).sort());
        });

        test("conserve les rôles existants", () => {
            const valeurs = optionsDuSelect(id).map((o) => o.value);

            expect(valeurs).toEqual(expect.arrayContaining(["user", "responsable", "admin"]));
        });

        test.each([
            ["enseignant", "Enseignant"],
            ["parent", "Parent"],
            ["eleve", "Élève"],
        ])("propose le rôle %s avec l'étiquette %s", (valeur, etiquette) => {
            expect(optionsDuSelect(id)).toContainEqual({ value: valeur, label: etiquette });
        });
    });
});
