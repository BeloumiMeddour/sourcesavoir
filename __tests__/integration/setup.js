/**
 * Configuration et helpers pour les tests d'intégration
 */
import { jest } from '@jest/globals';

// Mock de la base de données Prisma
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        cours: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        professeur: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        salle: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        affectationCours: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
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

// Mock du middleware d'authentification
export const createMockRequest = (options = {}) => {
    return {
        isAuthenticated: jest.fn(() => options.authenticated || false),
        user: options.user || null,
        session: {
            user_email: options.email || null,
            user_role: options.role || 'user',
        },
        body: options.body || {},
        params: options.params || {},
        query: options.query || {},
        ...options,
    };
};

export const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.sendStatus = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.render = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
};

export const createMockNext = () => jest.fn();

/**
 * Simule une requête authentifiée
 */
export const mockAuthenticatedRequest = (options = {}) => {
    return createMockRequest({
        authenticated: true,
        email: options.email || 'user@test.com',
        role: options.role || 'user',
        user: {
            id: options.userId || 1,
            email: options.email || 'user@test.com',
            role: options.role || 'user',
        },
        ...options,
    });
};

/**
 * Simule une requête d'admin
 */
export const mockAdminRequest = (options = {}) => {
    return mockAuthenticatedRequest({
        email: 'admin@test.com',
        role: 'admin',
        userId: 1,
        ...options,
    });
};
