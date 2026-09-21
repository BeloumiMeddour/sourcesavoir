/**
 * Tests unitaires pour le modèle Salle
 */
import { jest } from '@jest/globals';
import * as salleModel from '../../model/salle.js';
import { testSalles } from '../fixtures/testData.js';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        salle: {
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

describe('Salle Model', () => {
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
    });

    describe('addSalle', () => {
        test('devrait ajouter une nouvelle salle', async () => {
            const mockSalle = {
                id: 1,
                ...testSalles.salle1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.salle.create.mockResolvedValue(mockSalle);

            const result = await salleModel.addSalle(testSalles.salle1);

            expect(mockPrisma.salle.create).toHaveBeenCalledWith({
                data: testSalles.salle1,
            });
            expect(result.code).toBe(testSalles.salle1.code);
            expect(result.type).toBe(testSalles.salle1.type);
        });

        test('devrait rejeter les codes en doublon', async () => {
            mockPrisma.salle.create.mockRejectedValue(
                new Error('Unique constraint failed on the \"code\" field')
            );

            await expect(
                salleModel.addSalle(testSalles.salle1)
            ).rejects.toThrow();
        });

        test('devrait valider la capacité positive', () => {
            const salleValid = testSalles.salle1;
            expect(salleValid.capacite).toBeGreaterThan(0);
        });
    });

    describe('getSalles', () => {
        test('devrait retourner la liste de toutes les salles triées', async () => {
            const mockList = [
                { id: 1, ...testSalles.salle1, createdAt: new Date() },
                { id: 2, ...testSalles.salle2, createdAt: new Date() },
                { id: 3, ...testSalles.salle3, createdAt: new Date() },
            ];

            mockPrisma.salle.findMany.mockResolvedValue(mockList);

            const result = await salleModel.getSalles();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(3);
            expect(mockPrisma.salle.findMany).toHaveBeenCalledWith({
                orderBy: { code: 'asc' },
            });
        });

        test('devrait retourner un tableau vide s\'il n\'y a pas de salle', async () => {
            mockPrisma.salle.findMany.mockResolvedValue([]);

            const result = await salleModel.getSalles();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('getSalleById', () => {
        test('devrait retourner une salle par son ID', async () => {
            const mockSalle = {
                id: 1,
                ...testSalles.salle1,
                createdAt: new Date(),
            };

            mockPrisma.salle.findUnique.mockResolvedValue(mockSalle);

            const result = await salleModel.getSalleById(1);

            expect(result.id).toBe(1);
            expect(result.code).toBe(testSalles.salle1.code);
        });

        test('devrait retourner null si la salle n\'existe pas', async () => {
            mockPrisma.salle.findUnique.mockResolvedValue(null);

            const result = await salleModel.getSalleById(999);

            expect(result).toBeNull();
        });
    });

    describe('getSallesByType', () => {
        test('devrait filtrer les salles par type', async () => {
            const mockList = [
                { id: 1, ...testSalles.salle2, type: 'Classe', createdAt: new Date() },
            ];

            mockPrisma.salle.findMany.mockResolvedValue(mockList);

            const result = await salleModel.getSallesByType('Classe');

            expect(mockPrisma.salle.findMany).toHaveBeenCalledWith({
                where: { type: 'Classe' },
            });
            expect(result.length).toBe(1);
            expect(result[0].type).toBe('Classe');
        });

        test('devrait retourner un tableau vide si aucune salle du type', async () => {
            mockPrisma.salle.findMany.mockResolvedValue([]);

            const result = await salleModel.getSallesByType('TypeInexistant');

            expect(result).toEqual([]);
        });
    });

    describe('updateSalle', () => {
        test('devrait mettre à jour une salle existante', async () => {
            mockPrisma.salle.findUnique.mockResolvedValue({ id: 1 });

            const updateData = { capacite: 40 };
            const mockUpdated = {
                id: 1,
                ...testSalles.salle1,
                ...updateData,
            };

            mockPrisma.salle.update.mockResolvedValue(mockUpdated);

            const result = await salleModel.updateSalle(1, updateData);

            expect(result.capacite).toBe(40);
        });

        test('devrait lancer une erreur si la salle n\'existe pas', async () => {
            mockPrisma.salle.findUnique.mockResolvedValue(null);

            await expect(
                salleModel.updateSalle(999, { capacite: 50 })
            ).rejects.toThrow('Salle non trouvée');
        });

        describe('liste blanche des champs (mass-assignment)', () => {
            const CHAMPS_AUTORISES = ['code', 'type', 'capacite'];

            beforeEach(() => {
                mockPrisma.salle.findUnique.mockResolvedValue({ id: 1 });
                mockPrisma.salle.update.mockResolvedValue({ id: 1 });
            });

            test('devrait transmettre les champs autorisés et rien d\'autre', async () => {
                await salleModel.updateSalle(1, {
                    code: 'A999',
                    type: 'Classe',
                    capacite: 45,
                    id: 99,
                    createdAt: new Date('2020-01-01'),
                    affectations: { deleteMany: {} },
                    disponibilites: { deleteMany: {} },
                });

                const { where, data } = mockPrisma.salle.update.mock.calls[0][0];
                expect(where).toEqual({ id: 1 });
                expect(data).toEqual({ code: 'A999', type: 'Classe', capacite: 45 });
                expect(CHAMPS_AUTORISES).toEqual(expect.arrayContaining(Object.keys(data)));
            });

            test('ne devrait jamais transmettre une écriture imbriquée sur une relation', async () => {
                await salleModel.updateSalle(1, {
                    affectations: { deleteMany: {} },
                    disponibilites: { create: { jour: 'Lundi', plageHoraire: '08:00-09:00', typeConflit: 'Salle' } },
                });

                const { data } = mockPrisma.salle.update.mock.calls[0][0];
                expect(data).toEqual({});
                expect(CHAMPS_AUTORISES).toEqual(expect.arrayContaining(Object.keys(data)));
            });

            test('ne devrait pas laisser modifier id, createdAt ni updatedAt', async () => {
                await salleModel.updateSalle(1, {
                    id: 2,
                    createdAt: new Date('2020-01-01'),
                    updatedAt: new Date('2020-01-01'),
                });

                const { data } = mockPrisma.salle.update.mock.calls[0][0];
                expect(Object.keys(data)).not.toContain('id');
                expect(Object.keys(data)).not.toContain('createdAt');
                expect(Object.keys(data)).not.toContain('updatedAt');
            });

            test('devrait permettre une mise à jour partielle', async () => {
                await salleModel.updateSalle(1, { capacite: 40 });

                const { data } = mockPrisma.salle.update.mock.calls[0][0];
                expect(data).toEqual({ capacite: 40 });
            });

            describe('valeurs non primitives (opérateurs Prisma)', () => {
                // { increment: 1 }, { set: ... } ou { connect: ... } sont des instructions pour Prisma, pas des données
                test.each([
                    ['un opérateur d\'incrément', { increment: 1 }],
                    ['un opérateur set', { set: 5000 }],
                    ['un tableau', [1, 2]],
                    ['un objet imbriqué', { connect: { id: 1 } }],
                    ['une date', new Date('2020-01-01')],
                ])('devrait ignorer capacite quand la valeur est %s', async (_libelle, valeur) => {
                    await salleModel.updateSalle(1, { capacite: valeur });

                    const { data } = mockPrisma.salle.update.mock.calls[0][0];
                    expect(data.capacite).toBeUndefined();
                });

                test('devrait ignorer les champs sous forme d\'objet et garder les champs valides', async () => {
                    await salleModel.updateSalle(1, { code: { set: 'HACK' }, type: 'Classe', capacite: 45 });

                    const { data } = mockPrisma.salle.update.mock.calls[0][0];
                    expect(data.code).toBeUndefined();
                    expect(data).toEqual({ type: 'Classe', capacite: 45 });
                });

                test('ne devrait transmettre aucune valeur objet, quel que soit le champ', async () => {
                    await salleModel.updateSalle(1, {
                        code: { set: 'x' },
                        type: ['Classe'],
                        capacite: { increment: 1 },
                    });

                    const { data } = mockPrisma.salle.update.mock.calls[0][0];
                    const valeursObjet = Object.values(data).filter((v) => typeof v === 'object' && v !== null);
                    expect(valeursObjet).toEqual([]);
                });

                test('devrait conserver les valeurs primitives, y compris 0 et null', async () => {
                    await salleModel.updateSalle(1, { code: 'B12', type: null, capacite: 0 });

                    const { data } = mockPrisma.salle.update.mock.calls[0][0];
                    expect(data).toEqual({ code: 'B12', type: null, capacite: 0 });
                    expect(data.type).toBeNull();
                    expect(data.capacite).toBe(0);
                });
            });
        });
    });

    describe('deleteSalle', () => {
        test('devrait supprimer une salle sans affectations', async () => {
            const mockSalle = {
                id: 1,
                ...testSalles.salle1,
                affectations: [],
            };

            mockPrisma.salle.findUnique.mockResolvedValue(mockSalle);
            mockPrisma.salle.delete.mockResolvedValue(mockSalle);

            const result = await salleModel.deleteSalle(1);

            expect(mockPrisma.salle.delete).toHaveBeenCalled();
        });

        test('devrait rejeter la suppression d\'une salle avec affectations', async () => {
            const mockSalle = {
                id: 1,
                ...testSalles.salle1,
                affectations: [{ id: 1 }],
            };

            mockPrisma.salle.findUnique.mockResolvedValue(mockSalle);

            await expect(
                salleModel.deleteSalle(1)
            ).rejects.toThrow('cours planifiés');
        });

        test('devrait lancer une erreur si la salle n\'existe pas', async () => {
            mockPrisma.salle.findUnique.mockResolvedValue(null);

            await expect(
                salleModel.deleteSalle(999)
            ).rejects.toThrow('Salle non trouvée');
        });
    });

    describe('Validation capacité', () => {
        test('devrait valider les types de salle', () => {
            const types = ['Salle', 'Labo', 'Classe', 'Amphithéâtre'];
            
            Object.values(testSalles).forEach(salle => {
                expect(['Salle', 'Labo', 'Classe', 'Amphithéâtre']).toContain(salle.type);
            });
        });

        test('devrait assurer que capacité est un nombre positif', () => {
            Object.values(testSalles).forEach(salle => {
                expect(typeof salle.capacite).toBe('number');
                expect(salle.capacite).toBeGreaterThan(0);
            });
        });
    });
});
