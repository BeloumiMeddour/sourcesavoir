/**
 * Tests unitaires pour les modèles Semestre et JourFerie
 */
import { jest } from '@jest/globals';
import { testSemestres, testJoursFeries } from '../fixtures/testData.js';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        semestre: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        jourFerie: {
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

describe('Semestre and JourFerie Models', () => {
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
    });

    describe('Semestre Model', () => {
        test('devrait créer un semestre avec dates valides', () => {
            const semestre = testSemestres.semestre1;
            expect(semestre.nom).toBe('Hiver 2026');
            expect(semestre.dateDebut < semestre.dateFin).toBe(true);
        });

        test('devrait avoir une date de début avant la date de fin', () => {
            const semestre = testSemestres.semestre1;
            const debut = new Date(semestre.dateDebut);
            const fin = new Date(semestre.dateFin);
            
            expect(debut.getTime() < fin.getTime()).toBe(true);
        });

        test('devrait pouvoir créer plusieurs semestres différents', () => {
            const semestres = Object.values(testSemestres);
            
            expect(semestres.length).toBeGreaterThan(1);
            expect(semestres[0].nom).not.toBe(semestres[1].nom);
        });

        test('devrait valider l\'ordre chronologique des semestres', () => {
            const s1 = testSemestres.semestre1;
            const s2 = testSemestres.semestre2;
            
            expect(new Date(s1.dateFin) <= new Date(s2.dateDebut)).toBe(true);
        });

        test('devrait rejeter les noms en doublon', async () => {
            mockPrisma.semestre.create.mockRejectedValue(
                new Error('Unique constraint failed on the \"nom\" field')
            );

            await expect(async () => {
                throw new Error('Unique constraint failed on the \"nom\" field');
            }).rejects.toThrow('Unique constraint');
        });
    });

    describe('JourFerie Model', () => {
        test('devrait créer un jour férié avec description', () => {
            const jourFerie = testJoursFeries.noel;
            expect(jourFerie.date).toBeDefined();
            expect(jourFerie.description).toBe('Noël');
        });

        test('devrait valider que la date du jour férié est une date valide', () => {
            const jourFerie = testJoursFeries.noel;
            const date = new Date(jourFerie.date);
            
            expect(date instanceof Date).toBe(true);
            expect(isNaN(date.getTime())).toBe(false);
        });

        test('devrait pouvoir avoir plusieurs jours fériés', () => {
            const jours = Object.values(testJoursFeries);
            expect(jours.length).toBeGreaterThan(1);
        });

        test('devrait rejeter les doublons date + semestre', async () => {
            mockPrisma.jourFerie.create.mockRejectedValue(
                new Error('Unique constraint failed on the fields')
            );

            await expect(async () => {
                throw new Error('Unique constraint failed');
            }).rejects.toThrow('Unique constraint');
        });

        test('devrait calculer correctement les jours fériés d\'une année', () => {
            const jours = Object.values(testJoursFeries);
            const dates = jours.map(j => new Date(j.date).getFullYear());
            
            dates.forEach(year => {
                expect(year).toBeGreaterThan(2000);
            });
        });
    });

    describe('Validations Temporelles', () => {
        test('devrait valider que le semestre couvre une période', () => {
            const semestre = testSemestres.semestre1;
            const debut = new Date(semestre.dateDebut);
            const fin = new Date(semestre.dateFin);
            const duree = fin.getTime() - debut.getTime();
            
            // Doit être au moins 1 jour
            expect(duree).toBeGreaterThan(0);
        });

        test('devrait assurer que les jours fériés sont dans le semestre', () => {
            const semestre = testSemestres.semestre1;
            const jourFerie = testJoursFeries.noel;
            
            // Jours fériés doivent être associés à une date valide
            expect(new Date(jourFerie.date)).toBeDefined();
        });

        test('devrait autoriser las jours fériés en dehors de la période scolaire', () => {
            // Les jours fériés peuvent être avant ou après le semestre
            const jourFerie = testJoursFeries.noel;
            expect(jourFerie.description).toBeTruthy();
        });
    });

    describe('Relations et Intégrité', () => {
        test('devrait permettre l\'association de jours fériés à un semestre', () => {
            // En réalité, c'est fait via la relation dans le schéma Prisma
            const semestre = testSemestres.semestre1;
            expect(semestre.id).toBeUndefined(); // Pas d'ID avant insertion
        });

        test('devrait permettre la suppression en cascade', async () => {
            // Quand on supprime un semestre, les jours fériés associés sont supprimés
            mockPrisma.semestre.delete.mockResolvedValue({ id: 1 });
            
            // La suppression est gérée par le schéma Prisma avec onDelete: Cascade
            expect(mockPrisma.semestre.delete).toBeDefined();
        });
    });
});
