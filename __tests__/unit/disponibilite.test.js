/**
 * Tests unitaires pour le modèle Disponibilité
 */
import { jest } from '@jest/globals';
import * as disponibiliteModel from '../../model/disponibilite.js';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        disponibilite: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        affectationCours: {
            findMany: jest.fn(),
        },
    };
    return {
        PrismaClient: jest.fn(() => mockPrisma),
    };
});

import { PrismaClient } from '@prisma/client';

describe('Disponibilité Model', () => {
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
    });

    describe('updateDisponibilite', () => {
        const CHAMPS_AUTORISES = ['jour', 'plageHoraire', 'id_professeur'];

        test('devrait lancer une erreur si la disponibilité n\'existe pas', async () => {
            mockPrisma.disponibilite.findUnique.mockResolvedValue(null);

            await expect(
                disponibiliteModel.updateDisponibilite(999, { jour: 'Lundi' })
            ).rejects.toThrow('Disponibilité non trouvée');
            expect(mockPrisma.disponibilite.update).not.toHaveBeenCalled();
        });

        test('devrait retourner la disponibilité mise à jour', async () => {
            const miseAJour = { id: 1, jour: 'Mardi', plageHoraire: '09:00-12:00', id_professeur: 3 };
            mockPrisma.disponibilite.findUnique.mockResolvedValue({ id: 1 });
            mockPrisma.disponibilite.update.mockResolvedValue(miseAJour);

            const result = await disponibiliteModel.updateDisponibilite(1, {
                jour: 'Mardi',
                plageHoraire: '09:00-12:00',
            });

            expect(result).toEqual(miseAJour);
        });

        describe('liste blanche des champs (mass-assignment)', () => {
            beforeEach(() => {
                mockPrisma.disponibilite.findUnique.mockResolvedValue({ id: 1 });
                mockPrisma.disponibilite.update.mockResolvedValue({ id: 1 });
            });

            test('devrait transmettre les champs autorisés et rien d\'autre', async () => {
                await disponibiliteModel.updateDisponibilite(1, {
                    jour: 'Jeudi',
                    plageHoraire: '10:00-12:00',
                    id_professeur: 4,
                    id: 99,
                    createdAt: new Date('2020-01-01'),
                    typeConflit: 'Salle',
                    id_salle: 7,
                    professeur: { delete: true },
                    salle: { connect: { id: 1 } },
                });

                const { where, data } = mockPrisma.disponibilite.update.mock.calls[0][0];
                expect(where).toEqual({ id: 1 });
                expect(data).toEqual({ jour: 'Jeudi', plageHoraire: '10:00-12:00', id_professeur: 4 });
                expect(CHAMPS_AUTORISES).toEqual(expect.arrayContaining(Object.keys(data)));
            });

            test('ne devrait jamais transmettre une écriture imbriquée sur une relation', async () => {
                await disponibiliteModel.updateDisponibilite(1, {
                    professeur: { delete: true },
                    salle: { update: { code: 'HACK' } },
                });

                const { data } = mockPrisma.disponibilite.update.mock.calls[0][0];
                expect(data).toEqual({});
                expect(CHAMPS_AUTORISES).toEqual(expect.arrayContaining(Object.keys(data)));
            });

            test('ne devrait pas laisser modifier id ni createdAt', async () => {
                await disponibiliteModel.updateDisponibilite(1, {
                    id: 2,
                    createdAt: new Date('2020-01-01'),
                });

                const { data } = mockPrisma.disponibilite.update.mock.calls[0][0];
                expect(Object.keys(data)).not.toContain('id');
                expect(Object.keys(data)).not.toContain('createdAt');
            });

            test('devrait permettre une mise à jour partielle', async () => {
                await disponibiliteModel.updateDisponibilite(1, { plageHoraire: '08:00-10:00' });

                const { data } = mockPrisma.disponibilite.update.mock.calls[0][0];
                expect(data).toEqual({ plageHoraire: '08:00-10:00' });
            });

            describe('valeurs non primitives (opérateurs Prisma)', () => {
                // { increment: 1 }, { set: ... } ou { connect: ... } sont des instructions pour Prisma, pas des données
                test.each([
                    ['un opérateur d\'incrément', { increment: 1 }],
                    ['un opérateur set', { set: 9 }],
                    ['un tableau', [1, 2]],
                    ['un objet imbriqué', { connect: { id: 1 } }],
                    ['une date', new Date('2020-01-01')],
                ])('devrait ignorer id_professeur quand la valeur est %s', async (_libelle, valeur) => {
                    await disponibiliteModel.updateDisponibilite(1, { id_professeur: valeur });

                    const { data } = mockPrisma.disponibilite.update.mock.calls[0][0];
                    expect(data.id_professeur).toBeUndefined();
                });

                test('devrait ignorer les champs texte sous forme d\'objet et garder les champs valides', async () => {
                    await disponibiliteModel.updateDisponibilite(1, {
                        jour: { set: 'Dimanche' },
                        plageHoraire: '08:00-10:00',
                        id_professeur: 4,
                    });

                    const { data } = mockPrisma.disponibilite.update.mock.calls[0][0];
                    expect(data.jour).toBeUndefined();
                    expect(data).toEqual({ plageHoraire: '08:00-10:00', id_professeur: 4 });
                });

                test('ne devrait transmettre aucune valeur objet, quel que soit le champ', async () => {
                    await disponibiliteModel.updateDisponibilite(1, {
                        jour: ['Lundi'],
                        plageHoraire: { set: 'x' },
                        id_professeur: { connect: { id: 1 } },
                    });

                    const { data } = mockPrisma.disponibilite.update.mock.calls[0][0];
                    const valeursObjet = Object.values(data).filter((v) => typeof v === 'object' && v !== null);
                    expect(valeursObjet).toEqual([]);
                });

                test('devrait conserver les valeurs primitives, y compris 0', async () => {
                    await disponibiliteModel.updateDisponibilite(1, { jour: 'Lundi', id_professeur: 0 });

                    const { data } = mockPrisma.disponibilite.update.mock.calls[0][0];
                    expect(data).toEqual({ jour: 'Lundi', id_professeur: 0 });
                    expect(data.id_professeur).toBe(0);
                });
            });
        });
    });
});
