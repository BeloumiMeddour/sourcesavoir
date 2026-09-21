/**
 * Tests unitaires du filtre de valeurs primitives (model/valeursPrimitives.js)
 *
 * Les corps de requête arrivent en JSON : une valeur peut être un objet ou un tableau que Prisma
 * interpréterait comme une instruction ({ increment: 1 }, { set: ... }, { connect: ... }).
 * Les fonctions update* ne doivent transmettre que des données : string, number, boolean ou null.
 */
import { primitiveOuIgnoree } from '../../model/valeursPrimitives.js';

describe('primitiveOuIgnoree', () => {
    describe('valeurs conservées', () => {
        test.each([
            ['une chaîne', 'INF101'],
            ['une chaîne vide', ''],
            ['une chaîne avec des caractères spéciaux', "O'Brien <b> \"x\" 🎓"],
            ['un entier', 45],
            ['zéro', 0],
            ['un nombre négatif', -1.5],
            ['true', true],
            ['false', false],
            ['null', null],
        ])('devrait conserver %s', (_libelle, valeur) => {
            expect(primitiveOuIgnoree(valeur)).toBe(valeur);
        });
    });

    describe('valeurs ignorées (undefined : champ ignoré par Prisma)', () => {
        test.each([
            ['undefined', undefined],
            ['un opérateur d\'incrément', { increment: 1 }],
            ['un opérateur set', { set: 5 }],
            ['un objet imbriqué', { connect: { id: 1 } }],
            ['un objet vide', {}],
            ['un tableau', [1, 2]],
            ['un tableau vide', []],
            ['une date', new Date('2020-01-01')],
            ['une fonction', () => 1],
            ['un symbole', Symbol('x')],
            ['un bigint', 10n],
        ])('devrait ignorer %s', (_libelle, valeur) => {
            expect(primitiveOuIgnoree(valeur)).toBeUndefined();
        });

        test('ne devrait pas convertir un objet en chaîne', () => {
            const piege = { toString: () => 'x', valueOf: () => 1 };

            expect(primitiveOuIgnoree(piege)).toBeUndefined();
        });

        test('devrait ignorer un objet créé sans prototype', () => {
            expect(primitiveOuIgnoree(Object.create(null))).toBeUndefined();
        });
    });
});
