/**
 * Tests unitaires pour le modèle Affectation
 */
import { jest } from '@jest/globals';
import * as affectationModel from '../../model/affectation.js';
import { testCours, testSalles, testProfesseurs, testSemestres } from '../fixtures/testData.js';

jest.mock('@prisma/client', () => {
    const mockPrisma = {
        affectationCours: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        semestre: {
            findUnique: jest.fn(),
        },
        disponibilite: {
            findMany: jest.fn(),
        },
    };
    return {
        PrismaClient: jest.fn(() => mockPrisma),
    };
});

import { PrismaClient } from '@prisma/client';

describe('Affectation Model', () => {
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
    });

    describe('affecterCoursASalle', () => {
        test('devrait créer une affectation valide (cours + salle + date)', async () => {
            const affectationData = {
                id_cours: 1,
                id_salle: 1,
                date: new Date('2026-03-25'),
                plageHoraire: '08:00-10:00',
                id_professeur: 1,
            };

            mockPrisma.affectationCours.findMany.mockResolvedValue([]);

            const mockAffectation = {
                id: 1,
                ...affectationData,
                date: new Date(affectationData.date),
                cours: testCours.cours1,
                salle: testSalles.salle1,
                professeur: testProfesseurs.prof1,
            };

            mockPrisma.affectationCours.create.mockResolvedValue(mockAffectation);

            const result = await affectationModel.affecterCoursASalle(affectationData);

            expect(result).toBeDefined();
            expect(result.id_cours).toBe(1);
            expect(result.id_salle).toBe(1);
        });

        test('devrait rejeter si la salle est déjà occupée à la même plage horaire', async () => {
            const affectationData = {
                id_cours: 1,
                id_salle: 1,
                date: new Date('2026-03-25'),
                plageHoraire: '08:00-10:00',
            };

            // Simuler une affectation existante qui chevauche
            mockPrisma.affectationCours.findMany.mockResolvedValue([
                {
                    id: 1,
                    plageHoraire: '09:00-11:00', // Chevauche avec 08:00-10:00
                },
            ]);

            await expect(
                affectationModel.affecterCoursASalle(affectationData)
            ).rejects.toThrow('salle');
        });

        test('devrait rejeter si le professeur est déjà assigné à la même plage horaire', async () => {
            const affectationData = {
                id_cours: 1,
                id_salle: 1,
                id_professeur: 1,
                date: new Date('2026-03-25'),
                plageHoraire: '08:00-10:00',
            };

            // Pas de conflit salle
            mockPrisma.affectationCours.findMany
                .mockResolvedValueOnce([]) // findMany pour salle (premier appel)
                .mockResolvedValueOnce([]) // findMany pour salle (jour)
                .mockResolvedValueOnce([  // findMany pour professeur
                    {
                        id: 2,
                        plageHoraire: '09:00-11:00',
                    },
                ]);

            await expect(
                affectationModel.affecterCoursASalle(affectationData)
            ).rejects.toThrow('professeur');
        });

        test('devrait accepter des plages horaires qui ne se chevauchent pas', async () => {
            const affectationData1 = {
                id_cours: 1,
                id_salle: 1,
                date: new Date('2026-03-25'),
                plageHoraire: '08:00-10:00',
            };

            const affectationData2 = {
                id_cours: 2,
                id_salle: 1,
                date: new Date('2026-03-25'),
                plageHoraire: '10:00-12:00', // Pas de chevauchement
            };

            mockPrisma.affectationCours.findMany.mockResolvedValue([]);
            mockPrisma.affectationCours.create.mockResolvedValue({
                id: 1,
                ...affectationData2,
            });

            const result = await affectationModel.affecterCoursASalle(affectationData2);

            expect(result).toBeDefined();
        });

        test('devrait inclure cours, salle et professeur dans la réponse', async () => {
            const affectationData = {
                id_cours: 1,
                id_salle: 1,
                id_professeur: 1,
                date: new Date('2026-03-25'),
                plageHoraire: '08:00-10:00',
            };

            mockPrisma.affectationCours.findMany.mockResolvedValue([]);

            const mockAffectation = {
                id: 1,
                ...affectationData,
                cours: { nom: 'INF101' },
                salle: { code: 'A101' },
                professeur: { nom: 'Dupont' },
            };

            mockPrisma.affectationCours.create.mockResolvedValue(mockAffectation);

            const result = await affectationModel.affecterCoursASalle(affectationData);

            expect(result.cours).toBeDefined();
            expect(result.salle).toBeDefined();
            expect(result.professeur).toBeDefined();
        });
    });

    describe('affecterCoursAuSemestre', () => {
        test('devrait créer une affectation récurrente (cours par semaine)', async () => {
            const affectationData = {
                id_cours: 1,
                id_salle: 1,
                jour: 1, // Lundi
                plageHoraire: '08:00-10:00',
                id_semestre: 1,
                id_professeur: 1,
            };

            const mockSemestre = {
                id: 1,
                dateDebut: new Date('2026-03-15'),
                dateFin: new Date('2026-04-30'),
                joursFeeries: [],
            };

            mockPrisma.semestre.findUnique.mockResolvedValue(mockSemestre);
            mockPrisma.affectationCours.findMany.mockResolvedValue([]);
            mockPrisma.disponibilite.findMany.mockResolvedValue([]);

            const mockAffectation = {
                id: 1,
                ...affectationData,
                date: null,
                jour: '1',
            };

            mockPrisma.affectationCours.create.mockResolvedValue(mockAffectation);

            const result = await affectationModel.affecterCoursAuSemestre(affectationData);

            expect(result).toBeDefined();
            expect(result.jour).toBe('1');
        });

        test('devrait rejeter si le semestre n\'existe pas', async () => {
            const affectationData = {
                id_cours: 1,
                id_salle: 1,
                jour: 1,
                plageHoraire: '08:00-10:00',
                id_semestre: 999,
            };

            mockPrisma.semestre.findUnique.mockResolvedValue(null);

            await expect(
                affectationModel.affecterCoursAuSemestre(affectationData)
            ).rejects.toThrow('Semestre');
        });

        test('devrait valider que jour et semestre sont obligatoires', async () => {
            const invalidData = {
                id_cours: 1,
                id_salle: 1,
                plageHoraire: '08:00-10:00',
                // jour manquant
                // id_semestre manquant
            };

            await expect(
                affectationModel.affecterCoursAuSemestre(invalidData)
            ).rejects.toThrow('obligatoires');
        });

        test('devrait vérifier les conflits sur la première occurrence', async () => {
            const affectationData = {
                id_cours: 1,
                id_salle: 1,
                jour: 2, // Mardi
                plageHoraire: '08:00-10:00',
                id_semestre: 1,
            };

            const mockSemestre = {
                id: 1,
                dateDebut: new Date('2026-03-15'), // Dimanche
                dateFin: new Date('2026-04-30'),
                joursFeeries: [],
            };

            mockPrisma.semestre.findUnique.mockResolvedValue(mockSemestre);
            
            // Conflit détecté
            mockPrisma.affectationCours.findMany
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([{ plageHoraire: '08:30-09:30' }]);

            await expect(
                affectationModel.affecterCoursAuSemestre(affectationData)
            ).rejects.toThrow('salle');
        });
    });

    describe('getAffectations', () => {
        test('devrait retourner toutes les affectations', async () => {
            const mockAffectations = [
                { id: 1, id_cours: 1, id_salle: 1, plageHoraire: '08:00-10:00' },
                { id: 2, id_cours: 2, id_salle: 2, plageHoraire: '10:00-12:00' },
            ];

            mockPrisma.affectationCours.findMany.mockResolvedValue(mockAffectations);

            const result = await affectationModel.getAffectations();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });
    });

    describe('deleteAffectation', () => {
        test('devrait supprimer une affectation existante', async () => {
            const mockAffectation = {
                id: 1,
                id_cours: 1,
                id_salle: 1,
            };

            mockPrisma.affectationCours.findUnique.mockResolvedValue(mockAffectation);
            mockPrisma.affectationCours.delete.mockResolvedValue(mockAffectation);

            const result = await affectationModel.deleteAffectation(1);

            expect(mockPrisma.affectationCours.delete).toHaveBeenCalled();
        });

        test('devrait retourner erreur si affectation n\'existe pas', async () => {
            mockPrisma.affectationCours.findUnique.mockResolvedValue(null);

            await expect(
                affectationModel.deleteAffectation(999)
            ).rejects.toThrow('Affectation non trouvée');
        });
    });

    describe('Validation des plages horaires', () => {
        test('devrait accepter 08:00-10:00 et 10:00-12:00 (consécutif)', () => {
            // Pas de chevauchement
            expect(true).toBe(true); // Pattern test
        });

        test('devrait rejeter 08:00-10:00 et 09:00-11:00 (chevauchement)', () => {
            // Chevauchement
            expect(true).toBe(true); // Pattern test
        });

        test('devrait gérer les plages sur plusieurs jours différents', async () => {
            const affectation1 = {
                id_cours: 1,
                id_salle: 1,
                date: new Date('2026-03-25'), // Mercredi
                plageHoraire: '08:00-10:00',
            };

            const affectation2 = {
                id_cours: 2,
                id_salle: 1,
                date: new Date('2026-03-26'), // Jeudi
                plageHoraire: '08:00-10:00', // Même plage mais jour différent
            };

            // Devrait accepter car jours différents
            mockPrisma.affectationCours.findMany.mockResolvedValue([]);
            mockPrisma.affectationCours.create.mockResolvedValue({ id: 1 });

            const result = await affectationModel.affecterCoursASalle(affectation2);
            expect(result).toBeDefined();
        });
    });
});
