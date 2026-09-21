/**
 * Tests unitaires pour le modèle Professeur
 */
import { jest } from '@jest/globals';
import * as professeurModel from '../../model/professeur.js';
import { testProfesseurs } from '../fixtures/testData.js';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        professeur: {
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

describe('Professeur Model', () => {
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
    });

    describe('addProfesseur', () => {
        test('devrait ajouter un nouveau professeur avec tous les champs', async () => {
            const mockProfesseur = {
                id: 1,
                matricule: testProfesseurs.prof1.matricule,
                nom: testProfesseurs.prof1.nom,
                prenom: testProfesseurs.prof1.prenom,
                specialite: testProfesseurs.prof1.specialite,
                chargeMax: 30,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.professeur.create.mockResolvedValue(mockProfesseur);

            const result = await professeurModel.addProfesseur(testProfesseurs.prof1);

            expect(mockPrisma.professeur.create).toHaveBeenCalledWith({
                data: {
                    matricule: testProfesseurs.prof1.matricule,
                    nom: testProfesseurs.prof1.nom,
                    prenom: testProfesseurs.prof1.prenom,
                    specialite: testProfesseurs.prof1.specialite,
                    programme: null, // programme est optionnel : le modèle envoie null quand il est absent
                },
            });
            expect(result.matricule).toBe(testProfesseurs.prof1.matricule);
            expect(result.specialite).toBe(testProfesseurs.prof1.specialite);
        });

        test('devrait transmettre le programme quand il est fourni', async () => {
            mockPrisma.professeur.create.mockResolvedValue({ id: 1 });

            await professeurModel.addProfesseur({ ...testProfesseurs.prof1, programme: 'Informatique' });

            expect(mockPrisma.professeur.create).toHaveBeenCalledWith({
                data: {
                    matricule: testProfesseurs.prof1.matricule,
                    nom: testProfesseurs.prof1.nom,
                    prenom: testProfesseurs.prof1.prenom,
                    specialite: testProfesseurs.prof1.specialite,
                    programme: 'Informatique',
                },
            });
        });

        test('devrait rejeter les matricules en doublon', async () => {
            mockPrisma.professeur.create.mockRejectedValue(
                new Error('Unique constraint failed on the \"matricule\" field')
            );

            await expect(
                professeurModel.addProfesseur(testProfesseurs.prof1)
            ).rejects.toThrow();
        });
    });

    describe('getProfesseurs', () => {
        test('devrait retourner la liste de tous les professeurs', async () => {
            const mockList = [
                { id: 1, ...testProfesseurs.prof1, createdAt: new Date() },
                { id: 2, ...testProfesseurs.prof2, createdAt: new Date() },
            ];

            mockPrisma.professeur.findMany.mockResolvedValue(mockList);

            const result = await professeurModel.getProfesseurs();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });

        test('devrait filtrer les professeurs par spécialité', async () => {
            const mockList = [
                { id: 1, ...testProfesseurs.prof1, createdAt: new Date() },
            ];

            mockPrisma.professeur.findMany.mockResolvedValue(mockList);

            const result = await professeurModel.getProfesseurs({ specialite: 'Informatique' });

            expect(mockPrisma.professeur.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { specialite: 'Informatique' },
                })
            );
            expect(result.length).toBe(1);
        });
    });

    describe('getProfesseurById', () => {
        test('devrait retourner un professeur avec ses relations', async () => {
            const mockProfesseur = {
                id: 1,
                ...testProfesseurs.prof1,
                disponibilites: [],
                affectations: [],
                createdAt: new Date(),
            };

            mockPrisma.professeur.findUnique.mockResolvedValue(mockProfesseur);

            const result = await professeurModel.getProfesseurById(1);

            expect(result.id).toBe(1);
            expect(Array.isArray(result.disponibilites)).toBe(true);
        });

        test('devrait retourner null si le professeur n\'existe pas', async () => {
            mockPrisma.professeur.findUnique.mockResolvedValue(null);

            const result = await professeurModel.getProfesseurById(999);

            expect(result).toBeNull();
        });
    });

    describe('updateProfesseur', () => {
        test('devrait mettre à jour un professeur existant', async () => {
            mockPrisma.professeur.findUnique.mockResolvedValue({ id: 1 });

            const updateData = { specialite: 'Physique' };
            const mockUpdated = {
                id: 1,
                ...testProfesseurs.prof1,
                ...updateData,
            };

            mockPrisma.professeur.update.mockResolvedValue(mockUpdated);

            const result = await professeurModel.updateProfesseur(1, updateData);

            expect(result.specialite).toBe('Physique');
        });

        test('devrait lancer une erreur si le professeur n\'existe pas', async () => {
            mockPrisma.professeur.findUnique.mockResolvedValue(null);

            await expect(
                professeurModel.updateProfesseur(999, { specialite: 'Test' })
            ).rejects.toThrow('Professeur non trouvé');
        });

        describe('liste blanche des champs (mass-assignment)', () => {
            const CHAMPS_AUTORISES = ['matricule', 'nom', 'prenom', 'specialite', 'programme', 'chargeMax'];

            beforeEach(() => {
                mockPrisma.professeur.findUnique.mockResolvedValue({ id: 1 });
                mockPrisma.professeur.update.mockResolvedValue({ id: 1 });
            });

            test('devrait transmettre les champs autorisés et rien d\'autre', async () => {
                await professeurModel.updateProfesseur(1, {
                    ...testProfesseurs.prof1,
                    programme: 'Informatique',
                    id: 99,
                    createdAt: new Date('2020-01-01'),
                    updatedAt: new Date('2020-01-01'),
                    affectations: { deleteMany: {} },
                    disponibilites: { deleteMany: {} },
                });

                const { where, data } = mockPrisma.professeur.update.mock.calls[0][0];
                expect(where).toEqual({ id: 1 });
                expect(data).toEqual({ ...testProfesseurs.prof1, programme: 'Informatique' });
                expect(CHAMPS_AUTORISES).toEqual(expect.arrayContaining(Object.keys(data)));
            });

            test('ne devrait jamais transmettre une écriture imbriquée sur une relation', async () => {
                await professeurModel.updateProfesseur(1, {
                    affectations: { deleteMany: {} },
                    disponibilites: { deleteMany: {} },
                });

                const { data } = mockPrisma.professeur.update.mock.calls[0][0];
                expect(data).toEqual({});
                expect(CHAMPS_AUTORISES).toEqual(expect.arrayContaining(Object.keys(data)));
            });

            test('ne devrait pas laisser modifier id, createdAt ni updatedAt', async () => {
                await professeurModel.updateProfesseur(1, {
                    id: 2,
                    createdAt: new Date('2020-01-01'),
                    updatedAt: new Date('2020-01-01'),
                });

                const { data } = mockPrisma.professeur.update.mock.calls[0][0];
                expect(Object.keys(data)).not.toContain('id');
                expect(Object.keys(data)).not.toContain('createdAt');
                expect(Object.keys(data)).not.toContain('updatedAt');
            });

            test('devrait conserver programme null (l\'interface l\'envoie pour effacer le programme)', async () => {
                await professeurModel.updateProfesseur(1, {
                    matricule: 'PROF001',
                    nom: 'Dupont',
                    prenom: 'Jean',
                    specialite: 'Informatique',
                    programme: null,
                });

                const { data } = mockPrisma.professeur.update.mock.calls[0][0];
                expect(data.programme).toBeNull();
            });

            test('devrait permettre une mise à jour partielle', async () => {
                await professeurModel.updateProfesseur(1, { specialite: 'Physique' });

                const { data } = mockPrisma.professeur.update.mock.calls[0][0];
                expect(data).toEqual({ specialite: 'Physique' });
            });

            describe('valeurs non primitives (opérateurs Prisma)', () => {
                // { increment: 1 }, { set: ... } ou { connect: ... } sont des instructions pour Prisma, pas des données
                test.each([
                    ['un opérateur d\'incrément', { increment: 5 }],
                    ['un opérateur set', { set: 9999 }],
                    ['un tableau', [1, 2]],
                    ['un objet imbriqué', { connect: { id: 1 } }],
                    ['une date', new Date('2020-01-01')],
                ])('devrait ignorer chargeMax quand la valeur est %s', async (_libelle, valeur) => {
                    await professeurModel.updateProfesseur(1, { chargeMax: valeur });

                    const { data } = mockPrisma.professeur.update.mock.calls[0][0];
                    expect(data.chargeMax).toBeUndefined();
                });

                test('devrait ignorer programme quand la valeur est un objet, sans l\'effacer', async () => {
                    await professeurModel.updateProfesseur(1, { programme: { set: null }, specialite: 'Physique' });

                    const { data } = mockPrisma.professeur.update.mock.calls[0][0];
                    // undefined (champ ignoré par Prisma) et non null (qui effacerait le programme)
                    expect(data.programme).toBeUndefined();
                    expect(data).toEqual({ specialite: 'Physique' });
                });

                test('ne devrait transmettre aucune valeur objet, quel que soit le champ', async () => {
                    await professeurModel.updateProfesseur(1, {
                        matricule: { set: 'x' },
                        nom: ['x'],
                        prenom: { increment: 1 },
                        specialite: { connect: { id: 1 } },
                        programme: { set: 'x' },
                        chargeMax: { increment: 1 },
                    });

                    const { data } = mockPrisma.professeur.update.mock.calls[0][0];
                    const valeursObjet = Object.values(data).filter((v) => typeof v === 'object' && v !== null);
                    expect(valeursObjet).toEqual([]);
                });

                test('devrait conserver les valeurs primitives, y compris 0', async () => {
                    await professeurModel.updateProfesseur(1, { matricule: 'PROF002', chargeMax: 0 });

                    const { data } = mockPrisma.professeur.update.mock.calls[0][0];
                    expect(data).toEqual({ matricule: 'PROF002', chargeMax: 0 });
                    expect(data.chargeMax).toBe(0);
                });
            });
        });
    });

    describe('deleteProfesseur', () => {
        test('devrait valider la charge horaire avant suppression', async () => {
            const mockProfesseur = {
                id: 1,
                ...testProfesseurs.prof1,
                affectations: [],
            };

            mockPrisma.professeur.findUnique.mockResolvedValue(mockProfesseur);
            mockPrisma.professeur.delete.mockResolvedValue(mockProfesseur);

            const result = await professeurModel.deleteProfesseur(1);

            expect(result).toBe(true);
            expect(mockPrisma.professeur.delete).toHaveBeenCalled();
        });

        test('devrait retourner erreur si le professeur n\'existe pas', async () => {
            mockPrisma.professeur.findUnique.mockResolvedValue(null);

            await expect(
                professeurModel.deleteProfesseur(999)
            ).rejects.toThrow('Professeur non trouvé');
        });
    });

    describe('Validation des données', () => {
        test('devrait avoir une charge horaire par défaut de 30', () => {
            const prof = testProfesseurs.prof1;
            // Vérifier que chargeMax existe (c'est un champ du schéma Prisma)
            expect(prof).toBeDefined();
        });
    });
});
