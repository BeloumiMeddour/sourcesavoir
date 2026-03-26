/**
 * Tests unitaires pour le modèle User
 */
import { jest } from '@jest/globals';
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

// Import après le mock
import { PrismaClient } from '@prisma/client';

describe('User Model', () => {
    let mockPrisma;

    beforeEach(() => {
        // Réinitialiser tous les mocks avant chaque test
        jest.clearAllMocks();
        mockPrisma = new PrismaClient();
    });

    describe('createUser', () => {
        test('devrait créer un nouvel utilisateur avec email et mot de passe hashé', async () => {
            const { email, password, role } = testUsers.user;
            const hashedPassword = await bcrypt.hash(password, 10);

            const mockUser = {
                id: 1,
                email,
                password: hashedPassword,
                role,
                nom: testUsers.user.nom,
                prenom: testUsers.user.prenom,
                createdAt: new Date(),
            };

            mockPrisma.user.create.mockResolvedValue(mockUser);

            const result = await userModel.createUser(
                email,
                password,
                role,
                testUsers.user.nom,
                testUsers.user.prenom
            );

            expect(mockPrisma.user.create).toHaveBeenCalled();
            expect(result.email).toBe(email);
            expect(result.role).toBe(role);
        });

        test('devrait créer un utilisateur avec rôle par défaut "user"', async () => {
            const mockUser = {
                id: 2,
                email: 'newuser@test.com',
                password: 'hashed_password',
                role: 'user',
                nom: null,
                prenom: null,
                createdAt: new Date(),
            };

            mockPrisma.user.create.mockResolvedValue(mockUser);

            const result = await userModel.createUser(
                'newuser@test.com',
                'password123'
            );

            expect(result.role).toBe('user');
        });

        test('devrait rejeter les emails en doublon', async () => {
            const { email, password } = testUsers.user;
            mockPrisma.user.create.mockRejectedValue(
                new Error('Unique constraint failed on the \"email\" field')
            );

            await expect(
                userModel.createUser(email, password)
            ).rejects.toThrow();
        });
    });

    describe('getUserByEmail', () => {
        test('devrait retourner un utilisateur par son email', async () => {
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

            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: testUsers.user.email },
            });
            expect(result.email).toBe(testUsers.user.email);
        });

        test('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const result = await userModel.getUserByEmail('nonexistent@test.com');

            expect(result).toBeNull();
        });
    });

    describe('getUsers', () => {
        test('devrait retourner la liste de tous les utilisateurs sans les mots de passe', async () => {
            const mockUsers = [
                {
                    id: 1,
                    email: testUsers.user.email,
                    role: 'user',
                    nom: testUsers.user.nom,
                    prenom: testUsers.user.prenom,
                    createdAt: new Date(),
                },
                {
                    id: 2,
                    email: testUsers.admin.email,
                    role: 'admin',
                    nom: testUsers.admin.nom,
                    prenom: testUsers.admin.prenom,
                    createdAt: new Date(),
                },
            ];

            mockPrisma.user.findMany.mockResolvedValue(mockUsers);

            const result = await userModel.getUsers();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].email).toBe(testUsers.user.email);
            // Vérifier que le mot de passe n'existe pas
            expect(result[0].password).toBeUndefined();
        });

        test('devrait retourner un tableau vide si aucun utilisateur', async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);

            const result = await userModel.getUsers();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('getUserById', () => {
        test('devrait retourner un utilisateur par son ID', async () => {
            const mockUser = {
                id: 1,
                email: testUsers.user.email,
                role: 'user',
                nom: testUsers.user.nom,
                prenom: testUsers.user.prenom,
                createdAt: new Date(),
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            const result = await userModel.getUserById(1);

            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                select: expect.objectContaining({
                    id: true,
                    email: true,
                    role: true,
                }),
            });
            expect(result.id).toBe(1);
        });

        test('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const result = await userModel.getUserById(999);

            expect(result).toBeNull();
        });
    });

    describe('updateUser', () => {
        test('devrait mettre à jour les données d\'un utilisateur', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
            
            const updatedData = {
                nom: 'NouveauNom',
                prenom: 'NouveauPrenom',
            };

            const mockUpdatedUser = {
                id: 1,
                email: 'user@test.com',
                password: 'hashed_password',
                role: 'user',
                nom: 'NouveauNom',
                prenom: 'NouveauPrenom',
                createdAt: new Date(),
            };

            mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

            const result = await userModel.updateUser(1, updatedData);

            expect(mockPrisma.user.update).toHaveBeenCalled();
            expect(result.nom).toBe('NouveauNom');
        });

        test('devrait lancer une erreur si l\'utilisateur n\'existe pas', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(
                userModel.updateUser(999, { nom: 'Test' })
            ).rejects.toThrow('Utilisateur non trouvé');
        });
    });
});
