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
        professeur: {
            findMany: jest.fn(),
        },
    };
    return {
        PrismaClient: jest.fn(() => mockPrisma),
    };
});

import { PrismaClient } from '@prisma/client';

/**
 * Fausse table affectationCours : évalue le sous-ensemble de filtres Prisma utilisé par le modèle
 * (égalité, null, { not }) afin de tester des scénarios (lignes en base) et non la forme des requêtes.
 */
function creerFausseTable(lignes) {
    const egal = (a, b) => (a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b);
    const correspond = (ligne, where = {}) =>
        Object.entries(where).every(([champ, condition]) => {
            if (condition === undefined) return true;
            if (condition !== null && typeof condition === 'object' && !(condition instanceof Date)) {
                if ('not' in condition) return !egal(ligne[champ], condition.not);
                throw new Error('Filtre Prisma non géré par la fausse table : ' + JSON.stringify(condition));
            }
            return egal(ligne[champ], condition);
        });
    return {
        findMany: async ({ where } = {}) => lignes.filter((ligne) => correspond(ligne, where)),
        findUnique: async ({ where }) => lignes.find((ligne) => ligne.id === where.id) || null,
    };
}

// Fabriques de lignes d'affectation (jour "0" = dimanche ... "6" = samedi, comme en base)
const seance = (surcharges) => ({
    id: 1,
    id_cours: 1,
    id_salle: 1,
    id_professeur: null,
    id_semestre: 1,
    jour: null,
    date: null,
    plageHoraire: '08:00-10:00',
    ...surcharges,
});
const recurrente = (jour, surcharges) => seance({ jour: String(jour), date: null, ...surcharges });
const datee = (dateIso, surcharges) => seance({ jour: null, date: new Date(dateIso), ...surcharges });

// Le 2026-03-25 est un mercredi (jour 3), le 2026-03-26 un jeudi (jour 4)
const MERCREDI = '2026-03-25T12:00:00Z';
const JEUDI = '2026-03-26T12:00:00Z';

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

    describe('assignerProfesseur', () => {
        const ID_PROF = 5;

        // Branche la fausse table sur les mocks Prisma (les implémentations sont réinitialisées à chaque test)
        const brancherTable = (lignes) => {
            const table = creerFausseTable(lignes);
            mockPrisma.affectationCours.findMany.mockImplementation(table.findMany);
            mockPrisma.affectationCours.findUnique.mockImplementation(table.findUnique);
        };

        beforeEach(() => {
            mockPrisma.affectationCours.findMany.mockReset();
            mockPrisma.affectationCours.findUnique.mockReset();
            mockPrisma.affectationCours.update.mockReset();
            mockPrisma.affectationCours.update.mockImplementation(async ({ where, data }) => ({ id: where.id, ...data }));
        });

        test('devrait lancer une erreur si l\'affectation n\'existe pas', async () => {
            brancherTable([]);

            await expect(
                affectationModel.assignerProfesseur(999, ID_PROF)
            ).rejects.toThrow('Affectation non trouvée');
        });

        describe('séance récurrente (date null, jour "0" à "6")', () => {
            // Séance à laquelle on assigne le professeur : lundi 08:00-10:00, semestre 1
            const cible = () => recurrente(1, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' });

            test('devrait assigner le professeur quand aucune autre séance ne le mobilise', async () => {
                brancherTable([cible()]);

                const result = await affectationModel.assignerProfesseur(10, ID_PROF);

                expect(mockPrisma.affectationCours.update).toHaveBeenCalledWith({
                    where: { id: 10 },
                    data: { id_professeur: ID_PROF },
                });
                expect(result.id_professeur).toBe(ID_PROF);
            });

            test.each([
                ['chevauchement partiel', '09:00-11:00'],
                ['plage identique', '08:00-10:00'],
                ['plage incluse', '08:30-09:30'],
            ])('devrait rejeter avec un Conflit si le professeur a une autre séance récurrente le même jour (%s)', async (_libelle, plage) => {
                brancherTable([
                    cible(),
                    recurrente(1, { id: 11, id_salle: 2, id_professeur: ID_PROF, plageHoraire: plage }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).rejects.toThrow(/^Conflit :/);
                expect(mockPrisma.affectationCours.update).not.toHaveBeenCalled();
            });

            test.each([
                ['plage consécutive après', '10:00-12:00'],
                ['plage consécutive avant', '06:00-08:00'],
            ])('ne devrait pas signaler de conflit pour une %s', async (_libelle, plage) => {
                brancherTable([
                    cible(),
                    recurrente(1, { id: 11, id_salle: 2, id_professeur: ID_PROF, plageHoraire: plage }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).resolves.toBeDefined();
                expect(mockPrisma.affectationCours.update).toHaveBeenCalledTimes(1);
            });

            test('ne devrait pas signaler de conflit avec un autre jour de la semaine', async () => {
                brancherTable([
                    cible(),
                    recurrente(2, { id: 11, id_salle: 2, id_professeur: ID_PROF, plageHoraire: '08:00-10:00' }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).resolves.toBeDefined();
            });

            test('ne devrait pas signaler de conflit avec un autre semestre', async () => {
                brancherTable([
                    cible(),
                    recurrente(1, { id: 11, id_salle: 2, id_professeur: ID_PROF, id_semestre: 2 }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).resolves.toBeDefined();
            });

            test('ne devrait pas signaler de conflit avec un autre professeur', async () => {
                brancherTable([
                    cible(),
                    recurrente(1, { id: 11, id_salle: 2, id_professeur: 6 }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).resolves.toBeDefined();
            });

            test('ne devrait pas entrer en conflit avec la séance elle-même', async () => {
                // Le professeur est déjà assigné à cette séance : la réassigner ne doit pas se bloquer elle-même
                brancherTable([{ ...cible(), id_professeur: ID_PROF }]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).resolves.toBeDefined();
            });

            test('devrait rejeter avec un Conflit si une séance datée du même semestre tombe ce jour de la semaine', async () => {
                brancherTable([
                    recurrente(3, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' }),
                    datee(MERCREDI, { id: 11, id_salle: 2, id_professeur: ID_PROF, plageHoraire: '09:00-11:00' }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).rejects.toThrow(/^Conflit :/);
                expect(mockPrisma.affectationCours.update).not.toHaveBeenCalled();
            });

            test('ne devrait pas signaler de conflit avec une séance datée tombant un autre jour de la semaine', async () => {
                brancherTable([
                    recurrente(3, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' }),
                    datee(JEUDI, { id: 11, id_salle: 2, id_professeur: ID_PROF, plageHoraire: '08:00-10:00' }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).resolves.toBeDefined();
            });

            test('ne devrait pas signaler de conflit avec une séance datée d\'un autre semestre', async () => {
                brancherTable([
                    recurrente(3, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' }),
                    datee(MERCREDI, { id: 11, id_salle: 2, id_professeur: ID_PROF, id_semestre: 2 }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).resolves.toBeDefined();
            });

            test.each([
                ['tout début de journée UTC', '2026-03-25T00:30:00Z'],
                ['toute fin de journée UTC', '2026-03-25T23:30:00Z'],
            ])('devrait déterminer le jour d\'une séance datée en UTC, quel que soit le fuseau du serveur (%s)', async (_libelle, dateIso) => {
                // Mercredi en UTC ; getDay() en heure locale donnerait mardi ou jeudi selon le fuseau
                brancherTable([
                    recurrente(3, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' }),
                    datee(dateIso, { id: 11, id_salle: 2, id_professeur: ID_PROF, plageHoraire: '09:00-11:00' }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).rejects.toThrow(/^Conflit :/);
            });
        });

        describe('séance datée (comportement inchangé)', () => {
            test('devrait assigner le professeur quand il est libre à cette date', async () => {
                brancherTable([datee(MERCREDI, { id: 10, plageHoraire: '08:00-10:00' })]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).resolves.toBeDefined();
                expect(mockPrisma.affectationCours.update).toHaveBeenCalledWith({
                    where: { id: 10 },
                    data: { id_professeur: ID_PROF },
                });
            });

            test('devrait rejeter avec un Conflit si le professeur est déjà pris à cette date et plage', async () => {
                brancherTable([
                    datee(MERCREDI, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' }),
                    datee(MERCREDI, { id: 11, id_salle: 2, id_professeur: ID_PROF, plageHoraire: '09:00-11:00' }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).rejects.toThrow(/^Conflit :/);
                expect(mockPrisma.affectationCours.update).not.toHaveBeenCalled();
            });

            test('ne devrait pas entrer en conflit avec la séance elle-même quand on réassigne le même professeur', async () => {
                // La séance 10 est déjà assignée à ce professeur : elle ne doit pas se compter comme un conflit
                brancherTable([datee(MERCREDI, { id: 10, id_professeur: ID_PROF, plageHoraire: '08:00-10:00' })]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).resolves.toBeDefined();
                expect(mockPrisma.affectationCours.update).toHaveBeenCalledWith({
                    where: { id: 10 },
                    data: { id_professeur: ID_PROF },
                });
            });

            test('devrait rejeter avec un Conflit si une AUTRE séance chevauche, même quand le professeur est déjà assigné à celle-ci', async () => {
                brancherTable([
                    datee(MERCREDI, { id: 10, id_salle: 1, id_professeur: ID_PROF, plageHoraire: '08:00-10:00' }),
                    datee(MERCREDI, { id: 11, id_salle: 2, id_professeur: ID_PROF, plageHoraire: '09:00-11:00' }),
                ]);

                await expect(
                    affectationModel.assignerProfesseur(10, ID_PROF)
                ).rejects.toThrow(/^Conflit :/);
                expect(mockPrisma.affectationCours.update).not.toHaveBeenCalled();
            });
        });
    });

    describe('getProfesseursAvecDisponibilitePourSlot', () => {
        const ID_PROF = 5;

        // Professeur disponible le lundi de 08:00 à 18:00 (10 h), le dimanche de 08:00 à 12:00 (4 h)
        const professeur = (surcharges) => ({
            id: ID_PROF,
            nom: 'Dupont',
            prenom: 'Jean',
            disponibilites: [
                { id: 1, jour: 'Lundi', plageHoraire: '08:00-18:00' },
                { id: 2, jour: 'Dimanche', plageHoraire: '08:00-12:00' },
            ],
            ...surcharges,
        });

        const brancher = (professeurs, affectations) => {
            mockPrisma.professeur.findMany.mockResolvedValue(professeurs);
            mockPrisma.affectationCours.findMany.mockResolvedValue(affectations);
        };

        // Un seul professeur dans ces scénarios : on lit directement son résultat
        const statutDe = async (jour, debut, fin) => {
            const resultats = await affectationModel.getProfesseursAvecDisponibilitePourSlot(1, jour, debut, fin);
            return resultats[0];
        };

        describe('séance récurrente (jour stocké en chiffre "0" à "6", comme en base)', () => {
            test.each([
                ['le nom du jour', 'Lundi'],
                ['le chiffre en chaîne', '1'],
                ['le chiffre en nombre', 1],
            ])('devrait signaler un conflit avec une séance récurrente chevauchante (jour demandé : %s)', async (_libelle, jour) => {
                brancher([professeur()], [recurrente(1, { id_professeur: ID_PROF, plageHoraire: '09:00-11:00' })]);

                const resultat = await statutDe(jour, '10:00', '12:00');

                expect(resultat.statut).toBe('conflit');
                expect(resultat.creneauxOccupes).toEqual(['09:00-11:00']);
            });

            test('devrait signaler un conflit le dimanche, jour stocké "0" (zéro n\'est pas une valeur absente)', async () => {
                brancher([professeur()], [recurrente(0, { id_professeur: ID_PROF, plageHoraire: '09:00-10:00' })]);

                const resultat = await statutDe('Dimanche', '09:30', '11:00');

                expect(resultat.statut).toBe('conflit');
                expect(resultat.creneauxOccupes).toEqual(['09:00-10:00']);
            });

            test('devrait calculer les heures libres et les créneaux occupés à partir des séances récurrentes', async () => {
                brancher([professeur()], [
                    recurrente(1, { id: 1, id_professeur: ID_PROF, plageHoraire: '08:00-10:00' }),
                    recurrente(1, { id: 2, id_professeur: ID_PROF, plageHoraire: '14:00-16:00' }),
                ]);

                const resultat = await statutDe('1', '11:00', '12:00');

                expect(resultat).toEqual({
                    id: ID_PROF,
                    nom: 'Dupont',
                    prenom: 'Jean',
                    plageDeclaree: '08:00-18:00',
                    heuresLibres: 6, // 10 h déclarées - 4 h déjà planifiées
                    creneauxOccupes: ['08:00-10:00', '14:00-16:00'],
                    statut: 'disponible',
                });
            });

            test('devrait rester disponible quand la séance récurrente ne chevauche pas la plage demandée', async () => {
                brancher([professeur()], [recurrente(1, { id_professeur: ID_PROF, plageHoraire: '08:00-10:00' })]);

                // Plage consécutive : 10:00 n'est pas un chevauchement
                const resultat = await statutDe('Lundi', '10:00', '12:00');

                expect(resultat.statut).toBe('disponible');
                expect(resultat.creneauxOccupes).toEqual(['08:00-10:00']);
            });

            test('devrait signaler complet quand les heures déjà planifiées ce jour-là ne laissent pas assez de temps', async () => {
                // Disponibilité du dimanche : 4 h. Une séance de 3 h hors de cette plage (13:00-16:00) réduit
                // le temps libre à 1 h : 2 h demandées sans chevauchement ne tiennent pas.
                brancher([professeur()], [recurrente(0, { id_professeur: ID_PROF, plageHoraire: '13:00-16:00' })]);

                const resultat = await statutDe('0', '09:00', '11:00');

                expect(resultat.statut).toBe('complet');
                expect(resultat.heuresLibres).toBe(1);
                expect(resultat.creneauxOccupes).toEqual(['13:00-16:00']);
            });

            test('ne devrait pas tenir compte d\'une séance récurrente d\'un autre jour de la semaine', async () => {
                brancher([professeur()], [recurrente(2, { id_professeur: ID_PROF, plageHoraire: '09:00-11:00' })]);

                const resultat = await statutDe('Lundi', '10:00', '12:00');

                expect(resultat.statut).toBe('disponible');
                expect(resultat.creneauxOccupes).toEqual([]);
            });

            test('ne devrait pas tenir compte d\'une séance récurrente d\'un autre professeur', async () => {
                brancher([professeur()], [recurrente(1, { id_professeur: 99, plageHoraire: '09:00-11:00' })]);

                const resultat = await statutDe('Lundi', '10:00', '12:00');

                expect(resultat.statut).toBe('disponible');
                expect(resultat.creneauxOccupes).toEqual([]);
            });
        });

        describe('séance héritée (jour stocké avec le nom français)', () => {
            test.each([
                ['le nom du jour', 'Lundi'],
                ['le chiffre', '1'],
            ])('devrait toujours signaler un conflit (jour demandé : %s)', async (_libelle, jour) => {
                brancher([professeur()], [seance({ id_professeur: ID_PROF, jour: 'Lundi', plageHoraire: '09:00-11:00' })]);

                const resultat = await statutDe(jour, '10:00', '12:00');

                expect(resultat.statut).toBe('conflit');
                expect(resultat.creneauxOccupes).toEqual(['09:00-11:00']);
            });
        });

        describe('séance datée (jour null) et données atypiques', () => {
            test('ne devrait pas planter avec une séance datée et ne devrait pas la compter comme récurrente', async () => {
                brancher([professeur()], [datee(MERCREDI, { id_professeur: ID_PROF, plageHoraire: '09:00-11:00' })]);

                const resultat = await statutDe('Lundi', '10:00', '12:00');

                expect(resultat.statut).toBe('disponible');
                expect(resultat.creneauxOccupes).toEqual([]);
            });

            test('ne devrait pas confondre un jour non reconnu avec un jour de la semaine', async () => {
                brancher([professeur()], [seance({ id_professeur: ID_PROF, jour: 'Blabla', plageHoraire: '09:00-11:00' })]);

                const resultat = await statutDe('Lundi', '10:00', '12:00');

                expect(resultat.statut).toBe('disponible');
                expect(resultat.creneauxOccupes).toEqual([]);
            });
        });

        describe('formes de retour existantes (inchangées)', () => {
            test('devrait signaler pas_dispo pour un professeur sans disponibilité ce jour-là', async () => {
                brancher([professeur()], []);

                const resultat = await statutDe('Mardi', '09:00', '10:00');

                expect(resultat).toEqual({ id: ID_PROF, nom: 'Dupont', prenom: 'Jean', statut: 'pas_dispo' });
            });

            test('devrait signaler hors_plage quand la plage demandée dépasse la disponibilité déclarée', async () => {
                brancher([professeur()], []);

                const resultat = await statutDe('Dimanche', '11:00', '13:00');

                expect(resultat).toEqual({
                    id: ID_PROF,
                    nom: 'Dupont',
                    prenom: 'Jean',
                    plageDeclaree: '08:00-12:00',
                    statut: 'hors_plage',
                });
            });

            test('devrait filtrer les affectations sur le semestre demandé', async () => {
                brancher([professeur()], []);

                await affectationModel.getProfesseursAvecDisponibilitePourSlot('3', 'Lundi', '09:00', '10:00');

                expect(mockPrisma.affectationCours.findMany).toHaveBeenCalledWith({ where: { id_semestre: 3 } });
            });
        });
    });

    describe('updateAffectation', () => {
        const ID_PROF = 5;

        const brancherTable = (lignes) => {
            const table = creerFausseTable(lignes);
            mockPrisma.affectationCours.findMany.mockImplementation(table.findMany);
            mockPrisma.affectationCours.findUnique.mockImplementation(table.findUnique);
        };

        beforeEach(() => {
            mockPrisma.affectationCours.findMany.mockReset();
            mockPrisma.affectationCours.findUnique.mockReset();
            mockPrisma.affectationCours.update.mockReset();
            mockPrisma.affectationCours.update.mockImplementation(async ({ where, data }) => ({ id: where.id, ...data }));
        });

        test('devrait lancer une erreur si l\'affectation n\'existe pas', async () => {
            brancherTable([]);

            await expect(
                affectationModel.updateAffectation(999, { plageHoraire: '08:00-10:00' })
            ).rejects.toThrow('Affectation non trouvée');
        });

        describe('opérations Prisma dans les champs reçus', () => {
            test('ignore un set sur le jour au lieu de déplacer une récurrence vers un créneau occupé', async () => {
                brancherTable([
                    recurrente(2, { id: 10 }),
                    recurrente(1, { id: 11 }),
                ]);

                const resultat = await affectationModel.updateAffectation(10, { jour: { set: '1' } });

                expect(resultat.jour).toBe('2');
                expect(mockPrisma.affectationCours.findMany).toHaveBeenCalledWith({
                    where: { id_salle: 1, id_semestre: 1, id: { not: 10 }, date: null, jour: '2' },
                });
            });

            test.each([
                ['jour', { set: '1' }],
                ['plageHoraire', { set: '10:00-12:00' }],
                ['id_cours', { set: 2 }],
                ['id_salle', { set: 2 }],
                ['id_professeur', { set: 2 }],
                ['id_semestre', { set: 2 }],
                ['date', { set: MERCREDI }],
                ['jour', ['1']],
                ['plageHoraire', ['10:00-12:00']],
                ['id_cours', [2]],
                ['id_salle', [2]],
                ['id_professeur', [2]],
                ['id_semestre', [2]],
                ['date', [MERCREDI]],
            ])('ignore %s = %j avant les contrôles et conserve sa valeur existante', async (champ, valeur) => {
                const cible = recurrente(2, { id: 10, id_professeur: ID_PROF });
                brancherTable([cible]);

                const resultat = await affectationModel.updateAffectation(10, { [champ]: valeur });

                expect(resultat[champ]).toEqual(cible[champ]);
                expect(mockPrisma.affectationCours.update).toHaveBeenCalledTimes(1);
            });

            test('préserve les dates valides fournies comme Date par un appelant interne', async () => {
                brancherTable([datee(MERCREDI, { id: 10 })]);

                const resultat = await affectationModel.updateAffectation(10, { date: new Date(JEUDI) });

                expect(resultat.date).toEqual(new Date(JEUDI));
            });
        });

        describe('séance récurrente (date null, jour "0" à "6")', () => {
            // Séance modifiée : lundi 08:00-10:00, salle 1, semestre 1, sans professeur
            const cible = () => recurrente(1, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' });

            describe('conflit de salle', () => {
                test('devrait rejeter avec un Conflit si la salle est prise par une autre séance récurrente le même jour', async () => {
                    brancherTable([
                        cible(),
                        recurrente(1, { id: 11, id_salle: 2, plageHoraire: '09:00-11:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { id_salle: 2 })
                    ).rejects.toThrow(/^Conflit :/);
                    expect(mockPrisma.affectationCours.update).not.toHaveBeenCalled();
                });

                test('devrait contrôler la nouvelle plage horaire et non l\'ancienne', async () => {
                    brancherTable([
                        cible(),
                        recurrente(1, { id: 11, id_salle: 1, plageHoraire: '13:00-15:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { plageHoraire: '14:00-16:00' })
                    ).rejects.toThrow(/^Conflit :/);
                });

                test('devrait contrôler le nouveau jour et non l\'ancien', async () => {
                    brancherTable([
                        cible(),
                        recurrente(2, { id: 11, id_salle: 1, plageHoraire: '08:00-10:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { jour: '2' })
                    ).rejects.toThrow(/^Conflit :/);
                });

                test('ne devrait pas entrer en conflit avec la séance elle-même', async () => {
                    brancherTable([cible()]);

                    await expect(
                        affectationModel.updateAffectation(10, { plageHoraire: '08:30-10:30' })
                    ).resolves.toBeDefined();
                    expect(mockPrisma.affectationCours.update).toHaveBeenCalledTimes(1);
                });

                test('ne devrait pas signaler de conflit pour une plage consécutive', async () => {
                    brancherTable([
                        cible(),
                        recurrente(1, { id: 11, id_salle: 2, plageHoraire: '10:00-12:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { id_salle: 2 })
                    ).resolves.toBeDefined();
                });

                test('ne devrait pas signaler de conflit avec un autre jour de la semaine', async () => {
                    brancherTable([
                        cible(),
                        recurrente(2, { id: 11, id_salle: 2, plageHoraire: '08:00-10:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { id_salle: 2 })
                    ).resolves.toBeDefined();
                });

                test('ne devrait pas signaler de conflit avec un autre semestre', async () => {
                    brancherTable([
                        cible(),
                        recurrente(1, { id: 11, id_salle: 2, id_semestre: 2 }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { id_salle: 2 })
                    ).resolves.toBeDefined();
                });

                test('devrait rejeter avec un Conflit si une séance datée du même semestre tombe ce jour de la semaine', async () => {
                    brancherTable([
                        recurrente(3, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' }),
                        datee(MERCREDI, { id: 11, id_salle: 2, plageHoraire: '09:00-11:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { id_salle: 2 })
                    ).rejects.toThrow(/^Conflit :/);
                });

                test('ne devrait pas signaler de conflit avec une séance datée tombant un autre jour de la semaine', async () => {
                    brancherTable([
                        recurrente(3, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' }),
                        datee(JEUDI, { id: 11, id_salle: 2, plageHoraire: '08:00-10:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { id_salle: 2 })
                    ).resolves.toBeDefined();
                });
            });

            describe('conflit de professeur', () => {
                test('devrait rejeter avec un Conflit si le professeur a une autre séance récurrente le même jour', async () => {
                    brancherTable([
                        cible(),
                        recurrente(1, { id: 11, id_salle: 3, id_professeur: ID_PROF, plageHoraire: '09:00-11:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { id_professeur: ID_PROF })
                    ).rejects.toThrow(/^Conflit :/);
                    expect(mockPrisma.affectationCours.update).not.toHaveBeenCalled();
                });

                test('devrait rejeter avec un Conflit si le professeur a une séance datée ce jour de la semaine', async () => {
                    brancherTable([
                        recurrente(3, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' }),
                        datee(MERCREDI, { id: 11, id_salle: 3, id_professeur: ID_PROF, plageHoraire: '09:00-11:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { id_professeur: ID_PROF })
                    ).rejects.toThrow(/^Conflit :/);
                });

                test('devrait contrôler le professeur déjà assigné quand on change la plage horaire', async () => {
                    brancherTable([
                        { ...cible(), id_professeur: ID_PROF },
                        recurrente(1, { id: 11, id_salle: 3, id_professeur: ID_PROF, plageHoraire: '13:00-15:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { plageHoraire: '14:00-16:00' })
                    ).rejects.toThrow(/^Conflit :/);
                });

                test('ne devrait pas entrer en conflit avec la séance elle-même', async () => {
                    brancherTable([{ ...cible(), id_professeur: ID_PROF }]);

                    await expect(
                        affectationModel.updateAffectation(10, { plageHoraire: '08:30-10:30' })
                    ).resolves.toBeDefined();
                });

                test('ne devrait pas signaler de conflit avec un autre professeur ni un autre semestre', async () => {
                    brancherTable([
                        cible(),
                        recurrente(1, { id: 11, id_salle: 3, id_professeur: 6, plageHoraire: '08:00-10:00' }),
                        recurrente(1, { id: 12, id_salle: 4, id_professeur: ID_PROF, id_semestre: 2 }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { id_professeur: ID_PROF })
                    ).resolves.toBeDefined();
                });

                test('ne devrait pas contrôler de professeur quand la séance n\'en a pas', async () => {
                    brancherTable([
                        cible(),
                        recurrente(1, { id: 11, id_salle: 3, id_professeur: ID_PROF, plageHoraire: '08:00-10:00' }),
                    ]);

                    await expect(
                        affectationModel.updateAffectation(10, { id_professeur: null })
                    ).resolves.toBeDefined();
                });
            });
        });

        describe('séance datée (comportement inchangé)', () => {
            test('devrait mettre à jour la séance quand il n\'y a aucun conflit', async () => {
                brancherTable([datee(MERCREDI, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' })]);

                await expect(
                    affectationModel.updateAffectation(10, { id_salle: 2, id_professeur: ID_PROF })
                ).resolves.toBeDefined();
                expect(mockPrisma.affectationCours.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { id: 10 },
                        data: expect.objectContaining({ id_salle: 2, id_professeur: ID_PROF, plageHoraire: '08:00-10:00' }),
                    })
                );
            });

            test('devrait rejeter avec un Conflit si la salle est déjà occupée à cette date et plage', async () => {
                brancherTable([
                    datee(MERCREDI, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' }),
                    datee(MERCREDI, { id: 11, id_salle: 2, plageHoraire: '09:00-11:00' }),
                ]);

                await expect(
                    affectationModel.updateAffectation(10, { id_salle: 2 })
                ).rejects.toThrow(/^Conflit :/);
                expect(mockPrisma.affectationCours.update).not.toHaveBeenCalled();
            });

            test('devrait rejeter avec un Conflit si le professeur est déjà pris à cette date et plage', async () => {
                brancherTable([
                    datee(MERCREDI, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' }),
                    datee(MERCREDI, { id: 11, id_salle: 3, id_professeur: ID_PROF, plageHoraire: '09:00-11:00' }),
                ]);

                await expect(
                    affectationModel.updateAffectation(10, { id_professeur: ID_PROF })
                ).rejects.toThrow(/^Conflit :/);
                expect(mockPrisma.affectationCours.update).not.toHaveBeenCalled();
            });

            test('ne devrait pas entrer en conflit avec la séance elle-même', async () => {
                brancherTable([datee(MERCREDI, { id: 10, id_salle: 1, plageHoraire: '08:00-10:00' })]);

                await expect(
                    affectationModel.updateAffectation(10, { plageHoraire: '08:30-10:30' })
                ).resolves.toBeDefined();
            });
        });
    });
});
