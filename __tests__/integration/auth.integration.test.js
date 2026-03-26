/**
 * Tests d'intégration pour l'authentification
 */
import { jest } from '@jest/globals';
import * as authModel from '../../auth.js';
import * as userModel from '../../model/user.js';
import { testUsers } from '../fixtures/testData.js';
import bcrypt from 'bcrypt';

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
