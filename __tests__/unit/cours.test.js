/**
 * Tests unitaires pour le modèle Cours
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

describe('Cours Model', () => {
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
    });

    describe('addCours', () => {
        test('devrait ajouter un nouveau cours avec toutes les données', async () => {
            const mockCours = {
                id: 1,
                ...testCours.cours1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.cours.create.mockResolvedValue(mockCours);

            const result = await coursModel.addCours(testCours.cours1);

            expect(mockPrisma.cours.create).toHaveBeenCalledWith({
                data: testCours.cours1,
            });
            expect(result.code).toBe(testCours.cours1.code);
            expect(result.nom).toBe(testCours.cours1.nom);
        });

        test('devrait rejeter les codes de cours en doublon', async () => {
            mockPrisma.cours.create.mockRejectedValue(
                new Error('Unique constraint failed on the \"code\" field')
            );

            await expect(
                coursModel.addCours(testCours.cours1)
            ).rejects.toThrow();
        });

        test('devrait créer un cours avec tous les champs requis', async () => {
            const coursData = testCours.cours2;
            
            expect(coursData.code).toBeDefined();
            expect(coursData.nom).toBeDefined();
            expect(coursData.duree).toBeDefined();
            expect(coursData.programme).toBeDefined();
            expect(coursData.etapeEtude).toBeDefined();
            expect(coursData.typeSalle).toBeDefined();
        });
    });

    describe('getCours', () => {
        test('devrait retourner la liste de tous les cours', async () => {
            const mockCoursList = [
                { id: 1, ...testCours.cours1, createdAt: new Date() },
                { id: 2, ...testCours.cours2, createdAt: new Date() },
            ];

            mockPrisma.cours.findMany.mockResolvedValue(mockCoursList);

            const result = await coursModel.getCours();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].code).toBe(testCours.cours1.code);
        });

        test('devrait retourner un tableau vide s\'il n\'y a aucun cours', async () => {
            mockPrisma.cours.findMany.mockResolvedValue([]);

            const result = await coursModel.getCours();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('getCoursById', () => {
        test('devrait retourner un cours par son ID', async () => {
            const mockCours = {
                id: 1,
                ...testCours.cours1,
                createdAt: new Date(),
            };

            mockPrisma.cours.findUnique.mockResolvedValue(mockCours);

            const result = await coursModel.getCoursById(1);

            expect(mockPrisma.cours.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result.code).toBe(testCours.cours1.code);
        });

        test('devrait retourner null si le cours n\'existe pas', async () => {
            mockPrisma.cours.findUnique.mockResolvedValue(null);

            const result = await coursModel.getCoursById(999);

            expect(result).toBeNull();
        });
    });

    describe('updateCours', () => {
        test('devrait mettre à jour un cours existant', async () => {
            mockPrisma.cours.findUnique.mockResolvedValue({ id: 1 });
            
            const updateData = {
                nom: 'Programmation Avancée - Mise à jour',
                duree: 50,
            };

            const mockUpdatedCours = {
                id: 1,
                ...testCours.cours2,
                ...updateData,
                updatedAt: new Date(),
            };

            mockPrisma.cours.update.mockResolvedValue(mockUpdatedCours);

            const result = await coursModel.updateCours(1, updateData);

            expect(mockPrisma.cours.update).toHaveBeenCalled();
            expect(result.nom).toBe(updateData.nom);
            expect(result.duree).toBe(updateData.duree);
        });

        test('devrait lancer une erreur si le cours n\'existe pas', async () => {
            mockPrisma.cours.findUnique.mockResolvedValue(null);

            await expect(
                coursModel.updateCours(999, { nom: 'Test' })
            ).rejects.toThrow('Cours non trouvé');
        });
    });

    describe('deleteCours', () => {
        test('devrait supprimer un cours sans affectations', async () => {
            const mockCours = {
                id: 1,
                ...testCours.cours1,
                affectations: [],
            };

            mockPrisma.cours.findUnique.mockResolvedValue(mockCours);
            mockPrisma.cours.delete.mockResolvedValue(mockCours);

            const result = await coursModel.deleteCours(1);

            expect(result).toBe(true);
            expect(mockPrisma.cours.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        test('devrait rejeter la suppression d\'un cours avec affectations', async () => {
            const mockCours = {
                id: 1,
                ...testCours.cours1,
                affectations: [{ id: 1 }],
            };

            mockPrisma.cours.findUnique.mockResolvedValue(mockCours);

            await expect(
                coursModel.deleteCours(1)
            ).rejects.toThrow('Impossible de supprimer ce cours car il a des affectations planifiées');
        });

        test('devrait lancer une erreur si le cours n\'existe pas', async () => {
            mockPrisma.cours.findUnique.mockResolvedValue(null);

            await expect(
                coursModel.deleteCours(999)
            ).rejects.toThrow('Cours non trouvé');
        });
    });
});
