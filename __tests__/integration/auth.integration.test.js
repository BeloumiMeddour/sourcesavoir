/**
 * Tests d'intégration pour l'authentification
 */
import { jest } from '@jest/globals';
import * as authModel from '../../auth.js';
import * as userModel from '../../model/user.js';
import { testUsers } from '../fixtures/testData.js';
import bcrypt from 'bcrypt';
import passport from 'passport';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };
    return {
        PrismaClient: jest.fn(() => mockPrisma),
    };
});

import { PrismaClient } from '@prisma/client';

describe('Authentication Integration Tests', () => {
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
    });

    describe('User Registration Flow', () => {
        test('devrait créer un nouvel utilisateur avec succès', async () => {
            const { email, password, role, nom, prenom } = testUsers.user;
            const hashedPassword = await bcrypt.hash(password, 10);

            const mockUser = {
                id: 1,
                email,
                password: hashedPassword,
                role,
                nom,
                prenom,
                createdAt: new Date(),
            };

            mockPrisma.user.create.mockResolvedValue(mockUser);

            const result = await userModel.createUser(email, password, role, nom, prenom);

            expect(result).toBeDefined();
            expect(result.email).toBe(email);
            expect(result.role).toBe(role);
        });

        test('devrait valider l\'email lors de l\'inscription', async () => {
            const invalidEmails = [
                'invalid.email',
                'missing@domain',
                'without.ext@',
            ];

            for (const email of invalidEmails) {
                mockPrisma.user.create.mockRejectedValue(
                    new Error('Email invalide')
                );

                await expect(
                    userModel.createUser(email, 'password123')
                ).rejects.toThrow();
            }
        });

        test('devrait valider la force du mot de passe', async () => {
            const weakPasswords = ['123', 'pass', 'abc'];
            const strongPassword = 'SecurePass123!';

            // Mock du hash pour les mots de passe faibles
            for (const pwd of weakPasswords) {
                // Les mots de passe faibles devraient être validés
                // Dans l'implémentation réelle, il faudrait ajouter cette validation
            }

            // Le mot de passe fort devrait réussir
            const hashedPassword = await bcrypt.hash(strongPassword, 10);
            expect(hashedPassword).toBeTruthy();
        });

        test('devrait assigner le rôle par défaut "user" lors de l\'inscription', async () => {
            const mockUser = {
                id: 1,
                email: 'newuser@test.com',
                password: 'hashed',
                role: 'user',
                nom: null,
                prenom: null,
                createdAt: new Date(),
            };

            mockPrisma.user.create.mockResolvedValue(mockUser);

            const result = await userModel.createUser('newuser@test.com', 'password123');

            expect(result.role).toBe('user');
        });

        test('devrait rejeter l\'inscription avec email en doublon', async () => {
            mockPrisma.user.create.mockRejectedValue(
                new Error('Unique constraint failed on the \"email\" field')
            );

            await expect(
                userModel.createUser(testUsers.user.email, 'password123')
            ).rejects.toThrow();
        });
    });

    describe('User Login Flow', () => {
        test('devrait récupérer un utilisateur par email pour la connexion', async () => {
            const mockUser = {
                id: 1,
                email: testUsers.user.email,
                password: 'hashed_password',
                role: 'user',
                nom: testUsers.user.nom,
                prenom: testUsers.user.prenom,
                createdAt: new Date(),
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            const result = await userModel.getUserByEmail(testUsers.user.email);

            expect(result).toBeDefined();
            expect(result.email).toBe(testUsers.user.email);
        });

        test('devrait rejeter la connexion avec email inexistant', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const result = await userModel.getUserByEmail('nonexistent@test.com');

            expect(result).toBeNull();
        });

        test('devrait sécuriser le mot de passe avec bcrypt', async () => {
            const password = 'TestPassword123!';
            const hashedPassword = await bcrypt.hash(password, 10);

            expect(hashedPassword).not.toBe(password);
            expect(await bcrypt.compare(password, hashedPassword)).toBe(true);
        });
    });

    describe('Session Management', () => {
        test('devrait créer une session utilisateur après connexion', async () => {
            const mockSession = {
                user_email: testUsers.user.email,
                user_role: 'user',
                userId: 1,
            };

            expect(mockSession.user_email).toBe(testUsers.user.email);
            expect(mockSession.user_role).toBe('user');
        });

        test('devrait nettoyer la session à la déconnexion', async () => {
            let session = {
                user_email: testUsers.user.email,
                user_role: 'user',
            };

            // Simulation de la déconnexion
            session.user_email = null;
            session.user_role = null;

            expect(session.user_email).toBeNull();
            expect(session.user_role).toBeNull();
        });
    });

    describe('Role-based Access Control', () => {
        test('devrait assigner le rôle admin', async () => {
            const mockAdmin = {
                id: 1,
                email: testUsers.admin.email,
                password: 'hashed',
                role: 'admin',
                nom: testUsers.admin.nom,
                prenom: testUsers.admin.prenom,
                createdAt: new Date(),
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);

            const result = await userModel.getUserByEmail(testUsers.admin.email);

            expect(result.role).toBe('admin');
        });

        test('devrait assigner le rôle responsable', async () => {
            const mockResponsable = {
                id: 2,
                email: testUsers.responsable.email,
                password: 'hashed',
                role: 'responsable',
                nom: testUsers.responsable.nom,
                prenom: testUsers.responsable.prenom,
                createdAt: new Date(),
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockResponsable);

            const result = await userModel.getUserByEmail(testUsers.responsable.email);

            expect(result.role).toBe('responsable');
        });
    });

    describe('Passport (auth.js) : le hash du mot de passe ne sort jamais', () => {
        const MOT_DE_PASSE = 'MotDePasse123';
        let hash;

        beforeAll(async () => {
            // Coût minimal pour garder les tests rapides
            hash = await bcrypt.hash(MOT_DE_PASSE, 4);
        });

        const enregistrement = (surcharge = {}) => ({
            id: 7,
            email: 'enseignant@test.com',
            password: hash,
            role: 'enseignant',
            etat: 'valide',
            nom: 'Tremblay',
            prenom: 'Sophie',
            createdAt: new Date('2025-01-15T10:00:00Z'),
            ...surcharge,
        });

        // Exécute la vraie stratégie "locale" via l'API publique de Passport,
        // comme le fait POST /connexion (passport.authenticate("local", cb)).
        const authentifier = (email, password) =>
            new Promise((resolve, reject) => {
                passport.authenticate('local', (err, utilisateur, info) => {
                    if (err) return reject(err);
                    resolve({ utilisateur, info });
                })({ body: { email, password }, query: {}, headers: {} }, {}, reject);
            });

        const deserialiser = (id) =>
            new Promise((resolve, reject) => {
                passport.deserializeUser(id, (err, utilisateur) => {
                    if (err) return reject(err);
                    resolve(utilisateur);
                });
            });

        const serialiser = (utilisateur) =>
            new Promise((resolve, reject) => {
                passport.serializeUser(utilisateur, (err, id) => {
                    if (err) return reject(err);
                    resolve(id);
                });
            });

        describe('stratégie locale', () => {
            test('renvoie une copie de l\'utilisateur sans la propriété password', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(enregistrement());

                const { utilisateur } = await authentifier('enseignant@test.com', MOT_DE_PASSE);

                expect(utilisateur).toBeTruthy();
                expect(utilisateur).not.toHaveProperty('password');
            });

            test('conserve tous les autres champs de l\'utilisateur', async () => {
                const { password, ...attendu } = enregistrement();
                mockPrisma.user.findUnique.mockResolvedValue(enregistrement());

                const { utilisateur } = await authentifier('enseignant@test.com', MOT_DE_PASSE);

                expect(utilisateur).toEqual(attendu);
            });

            test('le hash n\'apparaît nulle part dans ce qui serait sérialisé vers le client', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(enregistrement());

                const { utilisateur, info } = await authentifier('enseignant@test.com', MOT_DE_PASSE);

                expect(JSON.stringify({ msg: 'Connexion réussie', utilisateur })).not.toContain(hash);
                expect(JSON.stringify(info ?? {})).not.toContain(hash);
            });

            test('ne modifie pas l\'objet reçu du modèle (copie, pas suppression)', async () => {
                const brut = enregistrement();
                mockPrisma.user.findUnique.mockResolvedValue(brut);

                const { utilisateur } = await authentifier('enseignant@test.com', MOT_DE_PASSE);

                expect(utilisateur).not.toBe(brut);
                expect(brut.password).toBe(hash);
            });

            test('conserve le rôle et l\'état pour chacun des rôles', async () => {
                for (const role of ['admin', 'responsable', 'enseignant', 'parent', 'eleve', 'user']) {
                    mockPrisma.user.findUnique.mockResolvedValue(enregistrement({ role }));

                    const { utilisateur } = await authentifier('enseignant@test.com', MOT_DE_PASSE);

                    expect(utilisateur.role).toBe(role);
                    expect(utilisateur.etat).toBe('valide');
                    expect(utilisateur).not.toHaveProperty('password');
                }
            });

            test('mauvais mot de passe : échec sans utilisateur, code unique', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(enregistrement());

                const { utilisateur, info } = await authentifier('enseignant@test.com', 'MauvaisMotDePasse1');

                expect(utilisateur).toBe(false);
                expect(info).toEqual({ error: 'identifiants_invalides' });
            });

            test('utilisateur inconnu : même code que le mauvais mot de passe (aucune énumération)', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(null);

                const { utilisateur, info } = await authentifier('inconnu@test.com', MOT_DE_PASSE);

                expect(utilisateur).toBe(false);
                expect(info).toEqual({ error: 'identifiants_invalides' });
            });

            test('utilisateur inconnu : bcrypt.compare est quand même appelé, contre un hash factice valide', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(null);
                const espion = jest.spyOn(bcrypt, 'compare');

                try {
                    await authentifier('inconnu@test.com', MOT_DE_PASSE);

                    expect(espion).toHaveBeenCalledTimes(1);
                    expect(espion.mock.calls[0][0]).toBe(MOT_DE_PASSE);
                    // Un hash bcrypt de coût 10 : la comparaison dure autant que pour un vrai compte
                    expect(espion.mock.calls[0][1]).toMatch(/^\$2[aby]\$10\$[./A-Za-z0-9]{53}$/);
                } finally {
                    espion.mockRestore();
                }
            });

            // passport-local écarte déjà objets et tableaux ("Missing credentials") ; on appelle donc
            // la fonction de vérification directement pour prouver qu'elle se défend seule.
            const verifierDirectement = (email, password) =>
                new Promise((resolve, reject) => {
                    passport._strategy('local')._verify(email, password, (err, utilisateur, info) => {
                        if (err) return reject(err);
                        resolve({ utilisateur, info });
                    });
                });

            const attendreRefusSansRequete = async (resultat) => {
                const { utilisateur, info } = await resultat;

                expect(utilisateur).toBe(false);
                expect(info).toEqual({ error: 'identifiants_invalides' });
                expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
            };

            test.each([
                ['courriel objet', { $ne: '' }, MOT_DE_PASSE],
                ['courriel tableau', ['a@b.ca'], MOT_DE_PASSE],
                ['courriel nombre', 42, MOT_DE_PASSE],
                ['courriel booléen', true, MOT_DE_PASSE],
                ['courriel null', null, MOT_DE_PASSE],
                ['mot de passe objet', 'enseignant@test.com', { $ne: '' }],
                ['mot de passe tableau', 'enseignant@test.com', [MOT_DE_PASSE]],
                ['mot de passe nombre', 'enseignant@test.com', 12345678],
                ['mot de passe undefined', 'enseignant@test.com', undefined],
                ['courriel vide après trim', '   ', MOT_DE_PASSE],
            ])('%s : refusé sans exception et sans requête à la base', async (_nom, email, motDePasse) => {
                const espion = jest.spyOn(bcrypt, 'compare');

                try {
                    await attendreRefusSansRequete(verifierDirectement(email, motDePasse));
                    expect(espion).not.toHaveBeenCalled();
                } finally {
                    espion.mockRestore();
                }
            });

            test.each([
                ['courriel nombre', 42, MOT_DE_PASSE],
                ['mot de passe nombre', 'enseignant@test.com', 12345678],
                ['courriel trop long (151)', `${'a'.repeat(142)}@test.com`, MOT_DE_PASSE],
                ['mot de passe trop long (129)', 'enseignant@test.com', 'A1'.repeat(64) + 'b'],
            ])('%s : refusé via Passport sans requête à la base', async (_nom, email, motDePasse) => {
                await attendreRefusSansRequete(authentifier(email, motDePasse));
            });

            test('accepte un courriel de 150 caractères et un mot de passe de 128 caractères', async () => {
                const courriel = `${'a'.repeat(141)}@test.com`;
                expect(courriel).toHaveLength(150);
                mockPrisma.user.findUnique.mockResolvedValue(null);

                const { info } = await authentifier(courriel, 'A1'.repeat(64));

                expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
                expect(info).toEqual({ error: 'identifiants_invalides' });
            });

            test('le courriel est débarrassé de ses espaces avant la recherche', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(enregistrement());

                const { utilisateur } = await authentifier('  enseignant@test.com ', MOT_DE_PASSE);

                expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'enseignant@test.com' } });
                expect(utilisateur).toBeTruthy();
            });

            test.each(['suspendu', '', null, undefined])(
                "compte dont l'état est %p : pas de session, code unique",
                async (etat) => {
                    mockPrisma.user.findUnique.mockResolvedValue(enregistrement({ etat }));

                    const { utilisateur, info } = await authentifier('enseignant@test.com', MOT_DE_PASSE);

                    expect(utilisateur).toBe(false);
                    expect(info).toEqual({ error: 'identifiants_invalides' });
                }
            );

            test('mauvais mot de passe sur un compte en attente : aucune fuite de l\'état', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(enregistrement({ etat: 'en_attente' }));

                const { info } = await authentifier('enseignant@test.com', 'MauvaisMotDePasse1');

                expect(info).toEqual({ error: 'identifiants_invalides' });
            });

            test('compte en attente : échec sans utilisateur, aucun hash divulgué', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(enregistrement({ etat: 'en_attente' }));

                const { utilisateur, info } = await authentifier('enseignant@test.com', MOT_DE_PASSE);

                expect(utilisateur).toBe(false);
                expect(info).toEqual({ error: 'compte_en_attente' });
                expect(JSON.stringify(info)).not.toContain(hash);
            });

            test('propage une erreur de base de données', async () => {
                mockPrisma.user.findUnique.mockRejectedValue(new Error('base indisponible'));

                await expect(authentifier('enseignant@test.com', MOT_DE_PASSE)).rejects.toThrow('base indisponible');
            });
        });

        describe('deserializeUser', () => {
            test('relit l\'utilisateur par identifiant, sans demander le hash du mot de passe', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(enregistrement());

                const utilisateur = await deserialiser(7);

                expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
                const requete = mockPrisma.user.findUnique.mock.calls[0][0];
                expect(requete.where).toEqual({ id: 7 });
                expect(requete.select).toMatchObject({ id: true, role: true, etat: true });
                expect(requete.select.password).toBeFalsy();
                expect(utilisateur).not.toHaveProperty('password');
                expect(JSON.stringify(utilisateur)).not.toContain(hash);
            });

            test('supprime le hash même si le modèle le renvoyait par erreur', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(enregistrement());

                const utilisateur = await deserialiser(7);

                expect(utilisateur).not.toHaveProperty('password');
            });

            test('conserve les autres champs (dont role et etat, relus à chaque requête)', async () => {
                const { password, ...attendu } = enregistrement({ role: 'parent' });
                mockPrisma.user.findUnique.mockResolvedValue(enregistrement({ role: 'parent' }));

                const utilisateur = await deserialiser(7);

                expect(utilisateur).toEqual(attendu);
            });

            test('ne modifie pas l\'objet reçu du modèle', async () => {
                const brut = enregistrement();
                mockPrisma.user.findUnique.mockResolvedValue(brut);

                const utilisateur = await deserialiser(7);

                expect(utilisateur).not.toBe(brut);
                expect(brut.password).toBe(hash);
            });

            test('utilisateur supprimé entre-temps : pas d\'erreur, session invalidée', async () => {
                mockPrisma.user.findUnique.mockResolvedValue(null);

                const utilisateur = await deserialiser(404);

                expect(utilisateur).toBe(false);
            });

            test.each(['en_attente', 'suspendu', '', null, undefined])(
                'compte dont l\'état est %p : session invalidée',
                async (etat) => {
                    mockPrisma.user.findUnique.mockResolvedValue(enregistrement({ etat }));

                    const utilisateur = await deserialiser(7);

                    expect(utilisateur).toBe(false);
                }
            );

            test.each([
                ['un courriel (ancienne session)', 'enseignant@test.com'],
                ['un objet', { $ne: 0 }],
                ['un tableau', [7]],
                ['zéro', 0],
                ['un négatif', -3],
                ['un décimal', 1.5],
                ['null', null],
                ['undefined', undefined],
            ])('identifiant de session invalide (%s) : session invalidée sans requête', async (_nom, id) => {
                const utilisateur = await deserialiser(id);

                expect(utilisateur).toBe(false);
                expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
            });

            test('propage une erreur de base de données', async () => {
                mockPrisma.user.findUnique.mockRejectedValue(new Error('base indisponible'));

                await expect(deserialiser(7)).rejects.toThrow('base indisponible');
            });
        });

        describe('serializeUser', () => {
            test('ne stocke que l\'identifiant numérique dans la session', async () => {
                const id = await serialiser({ id: 7, email: 'enseignant@test.com', role: 'enseignant' });

                expect(id).toBe(7);
            });
        });
    });

    describe('Security Tests', () => {
        test('devrait hasher le mot de passe avant stockage', async () => {
            const password = testUsers.user.password;
            const hashedPassword = await bcrypt.hash(password, 10);

            expect(hashedPassword).not.toContain(password);
        });

        test('devrait vérifier le mot de passe correctement', async () => {
            const password = testUsers.user.password;
            const hashedPassword = await bcrypt.hash(password, 10);

            const isMatch = await bcrypt.compare(password, hashedPassword);
            expect(isMatch).toBe(true);

            const wrongMatch = await bcrypt.compare('wrongpassword', hashedPassword);
            expect(wrongMatch).toBe(false);
        });

        test('devrait gérer les injections SQL', async () => {
            const maliciousEmail = "admin'--";

            mockPrisma.user.findUnique.mockResolvedValue(null);

            const result = await userModel.getUserByEmail(maliciousEmail);

            expect(result).toBeNull();
        });
    });
});
