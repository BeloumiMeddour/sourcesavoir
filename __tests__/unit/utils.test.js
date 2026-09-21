/**
 * Tests unitaires pour les utilitaires d'interface (public/js/utils.js)
 *
 * utils.js modifie window.fetch dès son chargement et manipule le DOM. Sous Jest (environnement
 * node) on installe donc un faux `window` et un faux `document` minimaux AVANT de l'importer
 * (import dynamique). Le faux DOM refuse toute affectation à `innerHTML` : un message contenant
 * du HTML (typiquement err.error renvoyé par l'API) doit s'afficher comme texte, jamais être interprété.
 */
import { jest } from '@jest/globals';

const CHARGE_XSS = '<img src=x onerror=alert(1)>';

/** Faux élément DOM : juste ce qu'utilise afficherMessage. */
class FauxElement {
    constructor(balise, registre) {
        this.balise = balise;
        this.id = '';
        this.className = '';
        this.parentNode = null;
        this.enfants = [];
        this.attributs = {};
        this.ecouteurs = {};
        this.texte = '';
        this.classList = {
            add: (...noms) => {
                this.className = (this.className + ' ' + noms.join(' ')).trim();
            },
        };
        registre.push(this);
    }

    set innerHTML(valeur) {
        throw new Error('innerHTML interdit : le HTML "' + valeur + '" serait interprété par le navigateur');
    }

    set textContent(valeur) {
        this.texte = String(valeur);
    }

    get textContent() {
        return this.texte;
    }

    appendChild(enfant) {
        enfant.parentNode = this;
        this.enfants.push(enfant);
        return enfant;
    }

    removeChild(enfant) {
        this.enfants = this.enfants.filter((e) => e !== enfant);
        enfant.parentNode = null;
        return enfant;
    }

    setAttribute(nom, valeur) {
        this.attributs[nom] = valeur;
    }

    addEventListener(type, fonction) {
        (this.ecouteurs[type] = this.ecouteurs[type] || []).push(fonction);
    }

    /** Sélecteur de classe seulement (".classe"), en profondeur d'abord. */
    querySelector(selecteur) {
        const classe = selecteur.slice(1);
        for (const enfant of this.enfants) {
            if (enfant.className.split(/\s+/).includes(classe)) return enfant;
            const trouve = enfant.querySelector(selecteur);
            if (trouve) return trouve;
        }
        return null;
    }
}

function creerFauxDocument() {
    const elements = [];
    const body = new FauxElement('body', elements);
    return {
        elements,
        body,
        createElement: (balise) => new FauxElement(balise, elements),
        getElementById: (id) => body.enfants.find((e) => e.id === id) || null,
    };
}

describe('afficherMessage', () => {
    let afficherMessage;
    let faux;

    beforeAll(async () => {
        globalThis.window = { fetch: jest.fn() };
        ({ afficherMessage } = await import('../../public/js/utils.js'));
    });

    beforeEach(() => {
        jest.useFakeTimers();
        faux = creerFauxDocument();
        globalThis.document = faux;
        globalThis.requestAnimationFrame = (fonction) => fonction();
    });

    afterEach(() => {
        jest.useRealTimers();
        delete globalThis.document;
        delete globalThis.requestAnimationFrame;
    });

    afterAll(() => {
        delete globalThis.window;
    });

    const dernierToast = () => faux.getElementById('toast-container').enfants.at(-1);

    describe('protection contre le XSS', () => {
        test('devrait afficher un message contenant du HTML comme texte brut', () => {
            afficherMessage(null, CHARGE_XSS, 'erreur');

            const texte = dernierToast().querySelector('.toast-text');
            expect(texte.textContent).toBe(CHARGE_XSS);
        });

        test('ne devrait jamais affecter innerHTML sur un élément du toast', () => {
            expect(() => afficherMessage(null, CHARGE_XSS, 'erreur')).not.toThrow();
        });

        test('devrait traiter comme du texte un message qui tente de fermer la balise et de créer un script', () => {
            const message = '</span><script>alert(document.cookie)</script>';

            afficherMessage(null, message, 'erreur');

            expect(dernierToast().querySelector('.toast-text').textContent).toBe(message);
            expect(faux.elements.some((e) => e.balise === 'script')).toBe(false);
        });

        test('devrait afficher tel quel un message contenant des entités HTML (pas de double interprétation)', () => {
            afficherMessage(null, 'Tom &amp; Jerry &lt;3', 'succes');

            expect(dernierToast().querySelector('.toast-text').textContent).toBe('Tom &amp; Jerry &lt;3');
        });
    });

    describe('structure du toast (affichage inchangé)', () => {
        test.each([
            ['succes', '✓'],
            ['erreur', '✕'],
        ])("devrait afficher l'icône adaptée au type %s", (type, icone) => {
            afficherMessage(null, 'Message', type);

            const toast = dernierToast();
            expect(toast.className.split(' ')).toEqual(expect.arrayContaining(['toast', 'toast--' + type]));
            expect(toast.querySelector('.toast-icon').textContent).toBe(icone);
        });

        test('devrait contenir le texte, un bouton Fermer accessible et une barre de progression', () => {
            afficherMessage(null, 'Cours ajouté avec succès !', 'succes');

            const toast = dernierToast();
            expect(toast.querySelector('.toast-text').textContent).toBe('Cours ajouté avec succès !');

            const fermer = toast.querySelector('.toast-close');
            expect(fermer.balise).toBe('button');
            expect(fermer.attributs['aria-label']).toBe('Fermer');
            expect(fermer.textContent).toBe('✕');

            expect(toast.querySelector('.toast-progress')).not.toBeNull();
        });

        test('devrait rendre le toast visible à l\'entrée', () => {
            afficherMessage(null, 'Message', 'succes');

            expect(dernierToast().className).toContain('toast--visible');
        });

        test('devrait réutiliser le même conteneur pour plusieurs messages', () => {
            afficherMessage(null, 'Premier', 'succes');
            afficherMessage(null, 'Second', 'erreur');

            const conteneurs = faux.body.enfants.filter((e) => e.id === 'toast-container');
            expect(conteneurs).toHaveLength(1);
            expect(conteneurs[0].enfants).toHaveLength(2);
        });
    });

    describe('fermeture', () => {
        test('devrait lancer la sortie du toast au clic sur le bouton Fermer', () => {
            afficherMessage(null, 'Message', 'succes');
            const toast = dernierToast();

            toast.querySelector('.toast-close').ecouteurs.click[0]();

            expect(toast.className).toContain('toast--out');
        });

        test('devrait lancer la sortie du toast automatiquement après 4 secondes', () => {
            afficherMessage(null, 'Message', 'succes');
            const toast = dernierToast();

            jest.advanceTimersByTime(3999);
            expect(toast.className).not.toContain('toast--out');

            jest.advanceTimersByTime(1);
            expect(toast.className).toContain('toast--out');
        });
    });
});
