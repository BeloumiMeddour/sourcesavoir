/**
 * Tests d'intégration pour les routes des cours
 */
import { jest } from '@jest/globals';
import * as coursModel from '../../model/cours.js';
import { testCours } from '../fixtures/testData.js';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        cours: {
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

describe('Cours API Integration Tests', () => {
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
    });

    describe('CRUD Operations', () => {
        test('devrait créer et retourner un nouveau cours', async () => {
            const mockCours = {
                id: 1,
                ...testCours.cours1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.cours.create.mockResolvedValue(mockCours);

            const result = await coursModel.addCours(testCours.cours1);

            expect(result).toBeDefined();
            expect(result.code).toBe(testCours.cours1.code);
            expect(result.id).toBe(1);
        });

        test('devrait récupérer tous les cours avec succès', async () => {
            const mockCoursList = [
                { id: 1, ...testCours.cours1, createdAt: new Date() },
                { id: 2, ...testCours.cours2, createdAt: new Date() },
                { id: 3, ...testCours.cours3, createdAt: new Date() },
            ];

            mockPrisma.cours.findMany.mockResolvedValue(mockCoursList);

            const result = await coursModel.getCours();

            expect(result.length).toBe(3);
            expect(result[0].code).toBe('INF101');
        });

        test('devrait récupérer un cours par ID', async () => {
            const mockCours = {
                id: 1,
                ...testCours.cours1,
                createdAt: new Date(),
            };

            mockPrisma.cours.findUnique.mockResolvedValue(mockCours);

            const result = await coursModel.getCoursById(1);

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.nom).toBe(testCours.cours1.nom);
        });

        test('devrait mettre à jour un cours existant', async () => {
            mockPrisma.cours.findUnique.mockResolvedValue({ id: 1 });

            const updatedData = {
                nom: 'Informatique Mise à jour',
                duree: 40,
            };

            const mockUpdatedCours = {
                id: 1,
                ...testCours.cours1,
                ...updatedData,
                updatedAt: new Date(),
            };

            mockPrisma.cours.update.mockResolvedValue(mockUpdatedCours);

            const result = await coursModel.updateCours(1, updatedData);

            expect(result.nom).toBe(updatedData.nom);
            expect(result.duree).toBe(updatedData.duree);
        });

        test('devrait supprimer un cours sans affectations', async () => {
            const mockCours = { id: 1, ...testCours.cours1, affectations: [] };
            mockPrisma.cours.findUnique.mockResolvedValue(mockCours);
            mockPrisma.cours.delete.mockResolvedValue(mockCours);

            const result = await coursModel.deleteCours(1);

            expect(result).toBe(true);
            expect(mockPrisma.cours.delete).toHaveBeenCalled();
        });
    });

    describe('Validation et Erreurs', () => {
        test('devrait valider les champs requis lors de la création', async () => {
            const invalidCours = {
                // manque 'code'
                nom: 'Test',
                duree: 30,
                programme: 'Test',
            };

            mockPrisma.cours.create.mockRejectedValue(
                new Error('Champ requis: code')
            );

            await expect(
                coursModel.addCours(invalidCours)
            ).rejects.toThrow();
        });

        test('devrait retourner 404 pour un cours inexistant', async () => {
            mockPrisma.cours.findUnique.mockResolvedValue(null);

            const result = await coursModel.getCoursById(999);

            expect(result).toBeNull();
        });

        test('devrait empêcher la suppression d\'un cours avec affectations', async () => {
            const mockCours = {
                id: 1,
                ...testCours.cours1,
                affectations: [{ id: 1, id_cours: 1 }],
            };

            mockPrisma.cours.findUnique.mockResolvedValue(mockCours);

            await expect(
                coursModel.deleteCours(1)
            ).rejects.toThrow('affectations');
        });
    });

    describe('Contraintes de données', () => {
        test('devrait rejeter le code en doublon', async () => {
            mockPrisma.cours.create.mockRejectedValue(
                new Error('Unique constraint failed on the \"code\" field')
            );

            await expect(
                coursModel.addCours(testCours.cours1)
            ).rejects.toThrow('Unique constraint');
        });

        test('devrait assurer la cohérence des données de cours', async () => {
            const mockCours = {
                id: 1,
                ...testCours.cours1,
                createdAt: new Date(),
            };

            mockPrisma.cours.findUnique.mockResolvedValue(mockCours);

            const result = await coursModel.getCoursById(1);

            expect(result.code).toBeTruthy();
            expect(result.nom).toBeTruthy();
            expect(result.duree).toBeGreaterThan(0);
            expect(result.programme).toBeTruthy();
        });
    });
});
