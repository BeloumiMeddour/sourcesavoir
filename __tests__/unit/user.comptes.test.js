/**
 * Tests du modèle User : politique des comptes (courriel, mot de passe),
 * état initial à la création et validation d'un compte avec choix du rôle.
 */
import { jest } from "@jest/globals";
import * as userModel from "../../model/user.js";
import { ROLES } from "../../middleware/permissions.js";

jest.mock("@prisma/client", () => {
    const mockPrisma = {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };
    return { PrismaClient: jest.fn(() => mockPrisma) };
});

import { PrismaClient } from "@prisma/client";

describe("validerCourriel", () => {
    test.each(["a@b.ca", "prenom.nom@lacite.ca", `${"a".repeat(141)}@test.com`])("accepte %s", (courriel) => {
        expect(userModel.validerCourriel(courriel)).toBeNull();
    });

    test.each([
        [undefined, "obligatoire"],
        [null, "obligatoire"],
        ["", "obligatoire"],
        ["   ", "obligatoire"],
        [42, "obligatoire"],
        [{ $ne: "" }, "obligatoire"],
        [["a@b.ca"], "obligatoire"],
        ["sans-arobase", "pas valide"],
        ["a@b", "pas valide"],
        ["a b@c.ca", "pas valide"],
        [`${"a".repeat(142)}@test.com`, "150 caractères"],
    ])("refuse %p avec un message contenant « %s »", (courriel, fragment) => {
        expect(userModel.validerCourriel(courriel)).toContain(fragment);
    });
});

describe("validerMotDePasse", () => {
    test.each(["Abcdefg1", "MotDePasse123", `A1${"x".repeat(126)}`])("accepte un mot de passe conforme", (mdp) => {
        expect(userModel.validerMotDePasse(mdp)).toBeNull();
    });

    test.each([
        [undefined, "obligatoire"],
        [null, "obligatoire"],
        ["", "obligatoire"],
        [12345678, "obligatoire"],
        [{ a: 1 }, "obligatoire"],
        ["Ab1", "au moins 8 caractères"],
        [`A1${"x".repeat(127)}`, "128 caractères"],
        ["abcdefg1", "majuscule"],
        ["Abcdefgh", "chiffre"],
    ])("refuse %p avec un message contenant « %s »", (mdp, fragment) => {
        expect(userModel.validerMotDePasse(mdp)).toContain(fragment);
    });
});

describe("modèle User : comptes", () => {
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
        mockPrisma.user.create.mockImplementation(async ({ data }) => ({ id: 5, ...data }));
    });

    describe("createUser : état initial", () => {
        test.each([
            [ROLES.USER, "en_attente"],
            [ROLES.PARENT, "en_attente"],
            [ROLES.ENSEIGNANT, "en_attente"],
            [ROLES.ADMIN, "valide"],
            [ROLES.RESPONSABLE, "valide"],
        ])("sans état explicite, le rôle %s donne l'état %s (comportement historique)", async (role, etat) => {
            await userModel.createUser("a@b.ca", "Motdepasse1", role);

            expect(mockPrisma.user.create.mock.calls[0][0].data.etat).toBe(etat);
        });

        test.each([ROLES.USER, ROLES.PARENT, ROLES.ELEVE, ROLES.ENSEIGNANT])(
            "un état explicite « valide » (création par un admin) s'applique au rôle %s",
            async (role) => {
                await userModel.createUser("a@b.ca", "Motdepasse1", role, null, null, "valide");

                expect(mockPrisma.user.create.mock.calls[0][0].data).toMatchObject({ role, etat: "valide" });
            }
        );

        test("le mot de passe est haché avant d'être stocké", async () => {
            await userModel.createUser("a@b.ca", "Motdepasse1", ROLES.USER);

            const { password } = mockPrisma.user.create.mock.calls[0][0].data;
            expect(password).not.toBe("Motdepasse1");
            expect(password).toMatch(/^\$2[aby]\$/);
        });
    });

    describe("validerUser(id, role)", () => {
        const enAttente = { id: 9, email: "p@test.com", role: "user", etat: "en_attente" };

        test("applique le rôle ET l'état valide en UNE seule mise à jour", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(enAttente);
            mockPrisma.user.update.mockResolvedValue({ ...enAttente, role: ROLES.PARENT, etat: "valide" });

            const resultat = await userModel.validerUser(9, ROLES.PARENT);

            expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
            const appel = mockPrisma.user.update.mock.calls[0][0];
            expect(appel.where).toEqual({ id: 9 });
            expect(appel.data).toEqual({ etat: "valide", role: ROLES.PARENT });
            expect(appel.select.password).toBeFalsy();
            expect(resultat).toMatchObject({ role: ROLES.PARENT, etat: "valide" });
        });

        test.each(Object.values(ROLES))("accepte le rôle %s", async (role) => {
            mockPrisma.user.findUnique.mockResolvedValue(enAttente);
            mockPrisma.user.update.mockResolvedValue({ ...enAttente, role, etat: "valide" });

            await userModel.validerUser(9, role);

            expect(mockPrisma.user.update.mock.calls[0][0].data).toEqual({ etat: "valide", role });
        });

        test.each(["superadmin", "Admin", "", null, undefined, 42, ["admin"], { role: "admin" }])(
            "refuse le rôle %p sans rien écrire",
            async (role) => {
                mockPrisma.user.findUnique.mockResolvedValue(enAttente);

                await expect(userModel.validerUser(9, role)).rejects.toThrow("Rôle invalide");
                expect(mockPrisma.user.update).not.toHaveBeenCalled();
            }
        );

        test("un rôle omis n'est jamais présumé (aucune valeur par défaut)", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(enAttente);

            await expect(userModel.validerUser(9)).rejects.toThrow("Rôle invalide");
            expect(mockPrisma.user.update).not.toHaveBeenCalled();
        });

        test("compte inexistant : « Utilisateur non trouvé »", async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(userModel.validerUser(404, ROLES.USER)).rejects.toThrow("Utilisateur non trouvé");
            expect(mockPrisma.user.update).not.toHaveBeenCalled();
        });

        test("compte déjà validé : refusé, rien n'est écrit", async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ ...enAttente, etat: "valide" });

            await expect(userModel.validerUser(9, ROLES.ADMIN)).rejects.toThrow("Ce compte est déjà validé");
            expect(mockPrisma.user.update).not.toHaveBeenCalled();
        });
    });
});
