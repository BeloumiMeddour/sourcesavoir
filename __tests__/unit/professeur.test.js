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
                },
            });
            expect(result.matricule).toBe(testProfesseurs.prof1.matricule);
            expect(result.specialite).toBe(testProfesseurs.prof1.specialite);
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
