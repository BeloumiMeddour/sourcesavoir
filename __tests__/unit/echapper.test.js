/**
 * Tests unitaires pour le helper d'échappement HTML (protection contre le XSS stocké)
 *
 * Le helper vit dans un module dédié (public/js/echapper.js) car utils.js touche à
 * `window` dès son chargement et n'est donc pas importable sous Jest (environnement node).
 */
import { echapperHtml } from '../../public/js/echapper.js';

describe('echapperHtml', () => {
    describe('caractères spéciaux', () => {
        test.each([
            ['&', '&amp;'],
            ['<', '&lt;'],
            ['>', '&gt;'],
            ['"', '&quot;'],
            ["'", '&#39;'],
        ])('devrait échapper %s en %s', (entree, attendu) => {
            expect(echapperHtml(entree)).toBe(attendu);
        });

        test('devrait neutraliser une balise script', () => {
            expect(echapperHtml('<script>alert(1)</script>')).toBe(
                '&lt;script&gt;alert(1)&lt;/script&gt;'
            );
        });

        test('devrait neutraliser une balise img avec un gestionnaire onerror', () => {
            const resultat = echapperHtml('<img src=x onerror=alert(1)>');

            expect(resultat).not.toContain('<');
            expect(resultat).not.toContain('>');
            expect(resultat).toBe('&lt;img src=x onerror=alert(1)&gt;');
        });

        test("ne devrait laisser aucun guillemet brut permettant de sortir d'un attribut", () => {
            const resultat = echapperHtml('" onmouseover="alert(1)" x=\'');

            expect(resultat).not.toContain('"');
            expect(resultat).not.toContain("'");
        });

        test("devrait échapper le & en premier pour ne pas produire d'entité exploitable", () => {
            // Une entité déjà présente dans la donnée doit rester du texte littéral une fois affichée
            expect(echapperHtml('&lt;script&gt;')).toBe('&amp;lt;script&amp;gt;');
        });

        test('devrait échapper toutes les occurrences, pas seulement la première', () => {
            expect(echapperHtml('<<>>""\'\'&&')).toBe('&lt;&lt;&gt;&gt;&quot;&quot;&#39;&#39;&amp;&amp;');
        });
    });

    describe('valeurs nulles et vides', () => {
        test('devrait retourner une chaîne vide pour null', () => {
            expect(echapperHtml(null)).toBe('');
        });

        test('devrait retourner une chaîne vide pour undefined', () => {
            expect(echapperHtml(undefined)).toBe('');
        });

        test('devrait retourner une chaîne vide pour une chaîne vide', () => {
            expect(echapperHtml('')).toBe('');
        });

        test('devrait retourner une chaîne vide quand aucun argument n\'est fourni', () => {
            expect(echapperHtml()).toBe('');
        });
    });

    describe('valeurs non textuelles', () => {
        test('devrait convertir un nombre en chaîne', () => {
            expect(echapperHtml(42)).toBe('42');
            expect(echapperHtml(-1.5)).toBe('-1.5');
        });

        test('ne devrait pas avaler zéro (valeur "falsy" légitime)', () => {
            expect(echapperHtml(0)).toBe('0');
        });

        test('ne devrait pas avaler false', () => {
            expect(echapperHtml(false)).toBe('false');
        });

        test('devrait échapper le résultat de la conversion en chaîne d\'un objet', () => {
            const objet = { toString: () => '<b>gras</b>' };

            expect(echapperHtml(objet)).toBe('&lt;b&gt;gras&lt;/b&gt;');
        });

        test('devrait échapper le contenu d\'un tableau converti en chaîne', () => {
            expect(echapperHtml(['<a>', '&'])).toBe('&lt;a&gt;,&amp;');
        });
    });

    describe('contenu sûr', () => {
        test('devrait laisser un texte ordinaire inchangé', () => {
            expect(echapperHtml('Jean Dupont')).toBe('Jean Dupont');
        });

        test('devrait laisser les accents, tirets et emojis inchangés', () => {
            const texte = 'Étape 3 — Élève à l\'école 🎓 ünï';

            // L'apostrophe est le seul caractère de cette chaîne qui doit changer
            expect(echapperHtml(texte)).toBe('Étape 3 — Élève à l&#39;école 🎓 ünï');
        });

        test('devrait laisser inchangés les caractères SQL et de chemin non HTML', () => {
            expect(echapperHtml('a;b--c/*d*/\\e%f')).toBe('a;b--c/*d*/\\e%f');
        });
    });

    describe('grands volumes', () => {
        test('devrait traiter une très longue chaîne sans laisser de caractère dangereux', () => {
            const motif = '<&>"\'';
            const resultat = echapperHtml(motif.repeat(20000));

            // < -> 4, & -> 5, > -> 4, " -> 6, ' -> 5 caractères
            expect(resultat).toHaveLength(20000 * (4 + 5 + 4 + 6 + 5));
            expect(resultat).not.toMatch(/[<>"']/);
        });

        test('devrait traiter 10 000 valeurs successives de façon indépendante', () => {
            const valeurs = Array.from({ length: 10000 }, (_, i) => `<i>${i}</i>`);

            const resultats = valeurs.map(echapperHtml);

            expect(resultats[0]).toBe('&lt;i&gt;0&lt;/i&gt;');
            expect(resultats[9999]).toBe('&lt;i&gt;9999&lt;/i&gt;');
            expect(resultats.every((r) => !/[<>]/.test(r))).toBe(true);
        });
    });

    describe('insertion dans un attribut onclick (contexte JavaScript)', () => {
        // Le navigateur décode les entités HTML d'un attribut AVANT d'exécuter le JavaScript qu'il
        // contient : échapper seulement les apostrophes en &#39; ne protège donc pas une chaîne JS
        // délimitée par des apostrophes. Le motif sûr est echapperHtml(JSON.stringify(valeur)).
        const decoderEntitesHtml = (texte) =>
            texte
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&');

        afterEach(() => {
            delete globalThis.__pirate;
        });

        test.each([
            ["O'Brien"],
            ["x'); globalThis.__pirate = true; //"],
            ['x"); globalThis.__pirate = true; ("'],
            ['barre \\ inverse \\\' et retour\nligne'],
            ['<img src=x onerror=alert(1)> & co'],
        ])('devrait transmettre %j comme argument unique, sans exécuter de code injecté', (nom) => {
            const appels = [];
            const ouvrir = (...args) => appels.push(args);
            const attribut = 'ouvrir(7, ' + echapperHtml(JSON.stringify(nom)) + ')';

            // Ce que voit le moteur JavaScript après le décodage des entités par le navigateur
            new Function('ouvrir', decoderEntitesHtml(attribut))(ouvrir);

            expect(appels).toEqual([[7, nom]]);
            expect(globalThis.__pirate).toBeUndefined();
        });
    });
});
