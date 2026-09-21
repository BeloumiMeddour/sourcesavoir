/**
 * Tests unitaires pour les middlewares d'authentification
 *
 * Le rôle est lu depuis req.user (relu en base à chaque requête par
 * deserializeUser), et non depuis la session, figée à la connexion.
 * Le caractère "API" est déduit de req.originalUrl (req.path est relatif
 * au point de montage d'un routeur).
 */
import { jest } from '@jest/globals';
import {
    estAuthentifie,
    estAdmin,
    estResponsableOuAdmin,
    estRequeteApi,
} from '../../middleware/auth.js';

describe('Authentication Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            isAuthenticated: jest.fn(),
            path: '/api/test',
            user: undefined,
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            redirect: jest.fn(),
            send: jest.fn(),
        };

        next = jest.fn();
    });

    describe('estRequeteApi', () => {
        test('devrait utiliser originalUrl en priorité', () => {
            expect(estRequeteApi({ originalUrl: '/api/scolaire/x', path: '/x' })).toBe(true);
            expect(estRequeteApi({ originalUrl: '/admin', path: '/api/x' })).toBe(false);
        });

        test('devrait retomber sur path si originalUrl est absent', () => {
            expect(estRequeteApi({ path: '/api/users' })).toBe(true);
            expect(estRequeteApi({ path: '/dashboard' })).toBe(false);
        });

        test('devrait gérer une requête sans url', () => {
            expect(estRequeteApi({})).toBe(false);
        });

        test.each(['/API/cours', '/Api/scolaire/x', '/aPi/x'])(
            'devrait ignorer la casse du préfixe (Express route sans distinction de casse) : %s',
            (url) => {
                expect(estRequeteApi({ originalUrl: url })).toBe(true);
            }
        );

        test('devrait ignorer "/api" sans le slash final et les faux préfixes', () => {
            expect(estRequeteApi({ originalUrl: '/apiary' })).toBe(false);
            expect(estRequeteApi({ originalUrl: '/x/api/y' })).toBe(false);
        });
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

        test('routeur monté : path relatif mais originalUrl /api/scolaire/x non authentifié -> 401 JSON', () => {
            req.isAuthenticated.mockReturnValue(false);
            req.path = '/x';
            req.originalUrl = '/api/scolaire/x';

            estAuthentifie(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('Non authentifié'),
                })
            );
            expect(res.redirect).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test('routeur monté sur une page : originalUrl non API -> redirection', () => {
            req.isAuthenticated.mockReturnValue(false);
            req.path = '/';
            req.originalUrl = '/planning';

            estAuthentifie(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/connexion');
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('estAdmin', () => {
        test('devrait appeler next() si l\'utilisateur est authentifié et admin', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { role: 'admin' };

            estAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('devrait retourner 403 JSON pour les routes API si rôle insuffisant', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { role: 'user' };
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
            req.user = { role: 'user' };
            req.path = '/admin';

            estAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalled();
        });

        test('devrait lire le rôle sur req.user et non sur la session (rôle retiré en base)', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.session = { user_role: 'admin' }; // session figée à la connexion
            req.user = { role: 'user' }; // rôle actuel en base

            estAdmin(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('devrait accepter un admin promu en base malgré une session ancienne', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.session = { user_role: 'user' };
            req.user = { role: 'admin' };

            estAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('devrait fonctionner sans session', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { role: 'admin' };
            delete req.session;

            expect(() => estAdmin(req, res, next)).not.toThrow();
            expect(next).toHaveBeenCalled();
        });

        test('devrait refuser (403) un utilisateur authentifié sans req.user', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = undefined;

            estAdmin(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('devrait refuser un rôle proche mais différent (casse, espace)', () => {
            for (const role of ['Admin', 'ADMIN', 'admin ', '', null, undefined]) {
                res.status.mockClear();
                next.mockClear();
                req.isAuthenticated.mockReturnValue(true);
                req.user = { role };

                estAdmin(req, res, next);

                expect(next).not.toHaveBeenCalled();
                expect(res.status).toHaveBeenCalledWith(403);
            }
        });

        test('routeur monté : originalUrl /api/scolaire/x non authentifié -> 401 JSON', () => {
            req.isAuthenticated.mockReturnValue(false);
            req.path = '/x';
            req.originalUrl = '/api/scolaire/x';

            estAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('routeur monté : rôle insuffisant sur /api/scolaire/x -> 403 JSON', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { role: 'user' };
            req.path = '/x';
            req.originalUrl = '/api/scolaire/x';

            estAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: expect.stringContaining('administrateur') })
            );
            expect(res.send).not.toHaveBeenCalled();
        });
    });

    describe('estResponsableOuAdmin', () => {
        test('devrait appeler next() si utilisateur est admin', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { role: 'admin' };

            estResponsableOuAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('devrait appeler next() si utilisateur est responsable', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { role: 'responsable' };

            estResponsableOuAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('devrait retourner 403 si utilisateur est simple user', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { role: 'user' };
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

        test('devrait retourner 403 texte pour une page si rôle insuffisant', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { role: 'user' };
            req.path = '/planning';

            estResponsableOuAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        test('devrait refuser les nouveaux rôles (enseignant, parent, eleve)', () => {
            for (const role of ['enseignant', 'parent', 'eleve']) {
                res.status.mockClear();
                next.mockClear();
                req.isAuthenticated.mockReturnValue(true);
                req.user = { role };

                estResponsableOuAdmin(req, res, next);

                expect(next).not.toHaveBeenCalled();
                expect(res.status).toHaveBeenCalledWith(403);
            }
        });

        test('devrait lire le rôle sur req.user et non sur la session (rôle retiré en base)', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.session = { user_role: 'responsable' };
            req.user = { role: 'user' };

            estResponsableOuAdmin(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('devrait accepter un responsable promu en base malgré une session ancienne', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.session = { user_role: 'user' };
            req.user = { role: 'responsable' };

            estResponsableOuAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('devrait fonctionner sans session', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { role: 'responsable' };
            delete req.session;

            expect(() => estResponsableOuAdmin(req, res, next)).not.toThrow();
            expect(next).toHaveBeenCalled();
        });

        test('devrait refuser (403) un utilisateur authentifié sans req.user', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = undefined;

            estResponsableOuAdmin(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('routeur monté : originalUrl /api/scolaire/x non authentifié -> 401 JSON', () => {
            req.isAuthenticated.mockReturnValue(false);
            req.path = '/x';
            req.originalUrl = '/api/scolaire/x';

            estResponsableOuAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('routeur monté : rôle insuffisant sur /api/scolaire/x -> 403 JSON', () => {
            req.isAuthenticated.mockReturnValue(true);
            req.user = { role: 'user' };
            req.path = '/x';
            req.originalUrl = '/api/scolaire/x';

            estResponsableOuAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: expect.stringContaining('Droits insuffisants') })
            );
            expect(res.send).not.toHaveBeenCalled();
        });
    });
});
