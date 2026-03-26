/**
 * Tests unitaires pour les middlewares d'authentification
 */
import { jest } from '@jest/globals';
import {
    estAuthentifie,
    estAdmin,
    estResponsableOuAdmin,
} from '../../middleware/auth.js';

describe('Authentication Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            isAuthenticated: jest.fn(),
            path: '/api/test',
            session: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            redirect: jest.fn(),
            send: jest.fn(),
        };

        next = jest.fn();
    });

    describe('estAuthentifie', () => {
        test('devrait appeler next() si l\'utilisateur est authentifié', () => {
            req.isAuthenticated.mockReturnValue(true);

            estAuthentifie(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('devrait retourner 401 JSON pour les routes API si non authentifié', () => {
            req.isAuthenticated.mockReturnValue(false);
            req.path = '/api/users';

            estAuthentifie(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('Non authentifié'),
                })
            );
        });

        test('devrait rediriger vers /connexion pour les pages si non authentifié', () => {
            req.isAuthenticated.mockReturnValue(false);
            req.path = '/dashboard';

            estAuthentifie(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/connexion');
        });
    });

    describe('estAdmin', () => {
        test('devrait appeler next() si l\'utilisateur est authentifié et admin', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.session.user_role = 'admin';

            estAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('devrait retourner 403 JSON pour les routes API si rôle insuffisant', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.session.user_role = 'user';
            req.path = '/api/users';

            estAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('administrateur'),
                })
            );
        });

        test('devrait retourner 401 si non authentifié et c\'est une API', () => {
            req.isAuthenticated.mockReturnValue(false);
            req.path = '/api/users';

            estAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('devrait rediriger vers /connexion si non authentifié', () => {
            req.isAuthenticated.mockReturnValue(false);
            req.path = '/admin';

            estAdmin(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/connexion');
        });

        test('devrait retourner 403 pour les pages si rôle insuffisant', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.session.user_role = 'user';
            req.path = '/admin';

            estAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalled();
        });
    });

    describe('estResponsableOuAdmin', () => {
        test('devrait appeler next() si utilisateur est admin', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.session.user_role = 'admin';

            estResponsableOuAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('devrait appeler next() si utilisateur est responsable', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.session.user_role = 'responsable';

            estResponsableOuAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('devrait retourner 403 si utilisateur est simple user', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.session.user_role = 'user';
            req.path = '/api/planning';

            estResponsableOuAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalled();
        });

        test('devrait retourner 401 si non authentifié pour API', () => {
            req.isAuthenticated.mockReturnValue(false);
            req.path = '/api/planning';

            estResponsableOuAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('devrait rediriger vers /connexion si non authentifié pour page', () => {
            req.isAuthenticated.mockReturnValue(false);
            req.path = '/planning';

            estResponsableOuAdmin(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/connexion');
        });
    });
});
