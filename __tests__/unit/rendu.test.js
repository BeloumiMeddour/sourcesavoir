/**
 * Tests unitaires des constructeurs de HTML (public/js/rendu.js)
 *
 * Ces fonctions pures construisent du HTML par concaténation à partir de données venant de l'API
 * (donc saisies par des utilisateurs) : chaque champ doit être échappé. La CSP autorise 'unsafe-inline',
 * une balise <img onerror> injectée s'exécuterait. Deux familles de tests :
 *  - caractérisation : pour des données ordinaires, le HTML produit est celui d'avant (affichage inchangé) ;
 *  - XSS : une donnée hostile ressort échappée, sans balise ni attribut supplémentaire.
 */
import {
    htmlChargeSalle,
    htmlPlanningProfesseur,
    htmlErreurChargement,
    htmlLigneAffectation,
    htmlJourFerie,
    htmlEvenementReservation,
    htmlLigneSemestre,
    htmlLigneJourFerie,
} from '../../public/js/rendu.js';

const CHARGE = '<img src=x onerror=alert(1)>';
const CHARGE_ECHAPPEE = '&lt;img src=x onerror=alert(1)&gt;';
const CHARGE_ATTRIBUT = '" onmouseover="alert(1)" x="';

/** Noms (sans doublon, triés) de toutes les balises ouvrantes ou fermantes d'un fragment HTML. */
const nomsDeBalises = (html) =>
    [...new Set([...html.matchAll(/<\/?([a-z][a-z0-9]*)/gi)].map((m) => m[1].toLowerCase()))].sort();

/** Nombre d'occurrences d'un motif dans une chaîne. */
const compter = (texte, motif) => texte.split(motif).length - 1;

describe('htmlErreurChargement', () => {
    test('devrait produire le paragraphe attendu pour un message ordinaire', () => {
        expect(htmlErreurChargement('Erreur API: 500')).toBe(
            '<p class="info-text">Erreur de chargement (détail: Erreur API: 500)</p>'
        );
    });

    test('devrait échapper un message contenant du HTML', () => {
        const html = htmlErreurChargement(CHARGE);

        expect(html).toBe('<p class="info-text">Erreur de chargement (détail: ' + CHARGE_ECHAPPEE + ')</p>');
        expect(nomsDeBalises(html)).toEqual(['p']);
    });

    test('devrait accepter un message absent sans écrire "undefined"', () => {
        expect(htmlErreurChargement(undefined)).toBe('<p class="info-text">Erreur de chargement (détail: )</p>');
    });
});

describe('htmlChargeSalle', () => {
    const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    /** Carte heures 8 à 21 x jours 0 à 6, toutes libres, comme celle bâtie par affectations.js */
    const carteVide = () => {
        const carte = {};
        for (let h = 8; h < 22; h++) {
            carte[h] = {};
            for (let d = 0; d < 7; d++) carte[h][d] = null;
        }
        return carte;
    };

    test('devrait produire une grille complète : titre, 7 jours, 14 lignes de 7 cases', () => {
        const html = htmlChargeSalle(carteVide(), JOURS);

        expect(html.startsWith(
            '<div class="mini-planner-detail"><div class="mini-planner-header">Charge de la salle</div>' +
            '<div class="mini-planner-grid-detail">' +
            '<div class="mini-planner-cell mini-planner-hour">h</div>' +
            '<div class="mini-planner-cell mini-planner-day-header">Lun</div>'
        )).toBe(true);
        expect(html.endsWith('</div></div>')).toBe(true);
        expect(compter(html, 'mini-planner-day-header')).toBe(7);
        expect(compter(html, 'mini-planner-slot available')).toBe(14 * 7);
        expect(html).toContain('<div class="mini-planner-cell mini-planner-hour">8h</div>');
        expect(html).toContain('<div class="mini-planner-cell mini-planner-hour">21h</div>');
    });

    test('devrait afficher le code du cours sur la première heure et une case vide sur les suivantes', () => {
        const carte = carteVide();
        carte[9][2] = { code: 'INF101', debut: 9, fin: 11, isStart: true };
        carte[10][2] = { code: 'INF101', debut: 9, fin: 11, isStart: false };

        const html = htmlChargeSalle(carte, JOURS);

        expect(compter(html, '<div class="mini-planner-cell mini-planner-slot occupied">INF101</div>')).toBe(1);
        expect(compter(html, '<div class="mini-planner-cell mini-planner-slot occupied"></div>')).toBe(1);
        expect(compter(html, 'mini-planner-slot available')).toBe(14 * 7 - 2);
    });

    test('devrait échapper le code d\'un cours hostile', () => {
        const carte = carteVide();
        carte[8][0] = { code: CHARGE, debut: 8, fin: 9, isStart: true };

        const html = htmlChargeSalle(carte, JOURS);

        expect(html).toContain('occupied">' + CHARGE_ECHAPPEE + '</div>');
        expect(nomsDeBalises(html)).toEqual(['div']);
    });

    test('devrait échapper aussi les libellés de jours reçus en paramètre', () => {
        const html = htmlChargeSalle(carteVide(), [CHARGE, 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);

        expect(html).toContain('day-header">' + CHARGE_ECHAPPEE + '</div>');
        expect(nomsDeBalises(html)).toEqual(['div']);
    });
});

describe('htmlPlanningProfesseur', () => {
    const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const INDICES = [1, 2, 3, 4, 5, 6, 0]; // colonne d'affichage -> jour du backend (0 = dimanche)

    test('devrait produire un titre, un coin vide, 7 jours et 14 lignes de 7 cases', () => {
        const html = htmlPlanningProfesseur({}, {}, JOURS, INDICES);

        expect(html.startsWith(
            '<div class="mini-planner-detail"><div class="mini-planner-header">Planning semaine</div>' +
            '<div class="mini-planner-grid-detail">' +
            '<div class="mini-planner-cell mini-planner-hour"></div>' +
            '<div class="mini-planner-cell mini-planner-day-header">Lun</div>'
        )).toBe(true);
        expect(html.endsWith('</div></div>')).toBe(true);
        expect(compter(html, 'mini-planner-slot unavailable')).toBe(14 * 7);
    });

    test('devrait distinguer occupé, disponible et indisponible', () => {
        // Lundi (backend 1) : cours à 9h, disponibilité à 10h
        const coursMap = { '1-9': { data: { cours: { code: 'INF101' } }, isStart: true, duration: 1 } };
        const disposMap = { '1-10': ['10:00-11:00'] };

        const html = htmlPlanningProfesseur(coursMap, disposMap, JOURS, INDICES);

        expect(compter(html, 'mini-planner-slot occupied">INF101</div>')).toBe(1);
        expect(compter(html, 'mini-planner-slot available"></div>')).toBe(1);
        expect(compter(html, 'mini-planner-slot unavailable')).toBe(14 * 7 - 2);
    });

    test('ne devrait afficher le code que sur la première heure du cours', () => {
        const coursMap = {
            '1-9': { data: { cours: { code: 'INF101' } }, isStart: true, duration: 2 },
            '1-10': { data: { cours: { code: 'INF101' } }, isStart: false, duration: 2 },
        };

        const html = htmlPlanningProfesseur(coursMap, {}, JOURS, INDICES);

        expect(compter(html, 'INF101')).toBe(1);
        expect(compter(html, 'mini-planner-slot occupied')).toBe(2);
    });

    test('devrait afficher ? quand l\'affectation n\'a pas de cours', () => {
        const coursMap = { '2-8': { data: { cours: null }, isStart: true, duration: 1 } };

        const html = htmlPlanningProfesseur(coursMap, {}, JOURS, INDICES);

        expect(html).toContain('mini-planner-slot occupied">?</div>');
    });

    test('devrait échapper le code d\'un cours hostile', () => {
        const coursMap = { '1-8': { data: { cours: { code: CHARGE } }, isStart: true, duration: 1 } };

        const html = htmlPlanningProfesseur(coursMap, {}, JOURS, INDICES);

        expect(html).toContain('occupied">' + CHARGE_ECHAPPEE + '</div>');
        expect(nomsDeBalises(html)).toEqual(['div']);
    });
});

describe('htmlLigneAffectation', () => {
    const affectation = (surcharges) => ({
        id: 12,
        id_semestre: 3,
        plageHoraire: '08:00-10:00',
        cours: { code: 'INF101', nom: 'Introduction', programme: 'Informatique' },
        salle: { code: 'A101' },
        professeur: { prenom: 'Jean', nom: 'Dupont' },
        ...surcharges,
    });
    const SEMESTRES = { 3: 'Automne 2026' };

    test('devrait produire les 8 cellules attendues pour une affectation ordinaire', () => {
        const html = htmlLigneAffectation(affectation(), SEMESTRES, 'Lundi (hebdo)');

        expect(html).toBe(
            '<td>Informatique</td>' +
            '<td>INF101 - Introduction</td>' +
            '<td><div>A101</div></td>' +
            '<td><div>Jean Dupont</div></td>' +
            '<td>Automne 2026</td>' +
            '<td>Lundi (hebdo)</td>' +
            '<td>08:00-10:00</td>' +
            '<td><div class="actions-cell">' +
                '<button class="btn btn-modifier" onclick="modifierAffectation(12)">Modifier</button>' +
                '<button class="btn btn-supprimer" onclick="supprimerAffectation(12)">Supprimer</button>' +
            '</div></td>'
        );
    });

    test('devrait afficher des cellules vides sans cours, un tiret sans salle ni professeur', () => {
        const html = htmlLigneAffectation(
            affectation({ cours: null, salle: null, professeur: null }), SEMESTRES, '—'
        );

        expect(html.startsWith('<td></td><td></td><td><div>—</div></td><td><div>—</div></td>')).toBe(true);
    });

    test('devrait afficher un programme vide quand le cours n\'en a pas', () => {
        const html = htmlLigneAffectation(
            affectation({ cours: { code: 'INF101', nom: 'Introduction', programme: null } }), SEMESTRES, '—'
        );

        expect(html.startsWith('<td></td><td>INF101 - Introduction</td>')).toBe(true);
    });

    test.each([
        ['sans semestre', { id_semestre: null }],
        ['avec un semestre inconnu', { id_semestre: 99 }],
    ])('devrait afficher N/A %s', (_libelle, surcharges) => {
        const html = htmlLigneAffectation(affectation(surcharges), SEMESTRES, '—');

        expect(html).toContain('<td>N/A</td>');
    });

    test('devrait échapper chaque champ venant de l\'API', () => {
        const html = htmlLigneAffectation(
            affectation({
                plageHoraire: CHARGE,
                cours: { code: CHARGE, nom: CHARGE, programme: CHARGE },
                salle: { code: CHARGE },
                professeur: { prenom: CHARGE, nom: CHARGE },
            }),
            { 3: CHARGE },
            CHARGE
        );

        expect(nomsDeBalises(html)).toEqual(['button', 'div', 'td']);
        expect(html).not.toContain('<img');
        // 1 programme + 2 (code, nom) + 1 salle + 2 (prénom, nom) + 1 semestre + 1 date + 1 plage
        expect(compter(html, CHARGE_ECHAPPEE)).toBe(9);
    });

    test('devrait échapper le libellé de date reçu en paramètre', () => {
        const html = htmlLigneAffectation(affectation(), SEMESTRES, CHARGE_ATTRIBUT + ' <b>');

        expect(html).toContain('<td>&quot; onmouseover=&quot;alert(1)&quot; x=&quot; &lt;b&gt;</td>');
    });

    test('devrait transmettre l\'identifiant aux gestionnaires onclick comme un littéral sûr', () => {
        const html = htmlLigneAffectation(affectation({ id: '1);alert(1);//' }), SEMESTRES, '—');

        expect(html).toContain('onclick="modifierAffectation(&quot;1);alert(1);//&quot;)"');
        expect(html).toContain('onclick="supprimerAffectation(&quot;1);alert(1);//&quot;)"');
    });
});

describe('htmlJourFerie', () => {
    test('devrait produire le libellé attendu', () => {
        expect(htmlJourFerie('Fête nationale')).toBe('<span class="ferie-label">Fête nationale</span>');
    });

    test('devrait échapper une description hostile', () => {
        const html = htmlJourFerie(CHARGE);

        expect(html).toBe('<span class="ferie-label">' + CHARGE_ECHAPPEE + '</span>');
        expect(nomsDeBalises(html)).toEqual(['span']);
    });
});

describe('htmlEvenementReservation', () => {
    const champs = (surcharges) => ({
        codeCours: 'INF101',
        horaire: '08:00-10:30',
        codeSalle: 'A101',
        nomCours: 'Introduction',
        nomProf: 'J. Dupont',
        ...surcharges,
    });

    test.each([
        [1, '<div class="ev-code">INF101</div>'],
        [1.5,
            '<div class="ev-code">INF101</div>' +
            '<div class="ev-horaire">08:00-10:30</div>' +
            '<div class="ev-salle">A101</div>'],
        [2,
            '<div class="ev-code">INF101</div>' +
            '<div class="ev-horaire">08:00-10:30</div>' +
            '<div class="ev-salle">A101</div>' +
            '<div class="ev-nom">Introduction</div>'],
        [2.5,
            '<div class="ev-code">INF101</div>' +
            '<div class="ev-horaire">08:00-10:30</div>' +
            '<div class="ev-salle">A101</div>' +
            '<div class="ev-nom">Introduction</div>' +
            '<div class="ev-prof">J. Dupont</div>'],
    ])('devrait adapter le contenu à une durée de %s h', (duree, attendu) => {
        expect(htmlEvenementReservation(champs(), duree)).toBe(attendu);
    });

    test('ne devrait pas afficher le nom du cours ni le professeur quand ils sont absents', () => {
        const html = htmlEvenementReservation(champs({ nomCours: '', nomProf: '' }), 3);

        expect(html).not.toContain('ev-nom');
        expect(html).not.toContain('ev-prof');
    });

    test('devrait échapper chaque champ venant de l\'API', () => {
        const html = htmlEvenementReservation(
            champs({ codeCours: CHARGE, horaire: CHARGE, codeSalle: CHARGE, nomCours: CHARGE, nomProf: CHARGE }),
            3
        );

        expect(nomsDeBalises(html)).toEqual(['div']);
        expect(compter(html, CHARGE_ECHAPPEE)).toBe(5);
    });
});

describe('htmlLigneSemestre', () => {
    const semestre = (surcharges) => ({ id: 4, nom: 'Automne 2026', joursFeeries: [{}, {}], ...surcharges });

    test('devrait produire la ligne attendue pour un semestre ordinaire', () => {
        const html = htmlLigneSemestre(semestre(), '2026-09-01', '2026-12-20');

        expect(html.replace(/\s+/g, ' ').trim()).toBe(
            '<td>Automne 2026</td> <td>2026-09-01</td> <td>2026-12-20</td> ' +
            '<td> <button class="btn btn-petit btn-bleu" data-action="manage-feries" data-id="4"> ' +
            '2 jours - Gérer </button> </td> ' +
            '<td> <button class="btn btn-modifier" data-action="edit" data-id="4">Modifier</button> ' +
            '<button class="btn btn-supprimer" data-action="delete" data-id="4">Supprimer</button> </td>'
        );
    });

    test.each([
        [0, '0 jours - Gérer'],
        [1, '1 jour - Gérer'],
        [2, '2 jours - Gérer'],
    ])('devrait accorder le libellé du nombre de jours fériés (%s)', (nombre, attendu) => {
        const html = htmlLigneSemestre(semestre({ joursFeeries: Array(nombre).fill({}) }), 'a', 'b');

        expect(html).toContain(attendu);
    });

    test('devrait compter zéro jour férié quand la liste est absente', () => {
        const html = htmlLigneSemestre(semestre({ joursFeeries: undefined }), 'a', 'b');

        expect(html).toContain('0 jours - Gérer');
    });

    test('devrait échapper le nom du semestre', () => {
        const html = htmlLigneSemestre(semestre({ nom: CHARGE }), '2026-09-01', '2026-12-20');

        expect(html).toContain('<td>' + CHARGE_ECHAPPEE + '</td>');
        expect(nomsDeBalises(html)).toEqual(['button', 'td']);
    });

    test('ne devrait pas laisser un identifiant hostile sortir de l\'attribut data-id', () => {
        const html = htmlLigneSemestre(semestre({ id: CHARGE_ATTRIBUT }), 'a', 'b');

        expect(html).not.toContain('" onmouseover=');
        expect(nomsDeBalises(html)).toEqual(['button', 'td']);
    });

    test('devrait échapper les dates reçues en paramètre', () => {
        const html = htmlLigneSemestre(semestre(), CHARGE, CHARGE);

        expect(compter(html, CHARGE_ECHAPPEE)).toBe(2);
        expect(nomsDeBalises(html)).toEqual(['button', 'td']);
    });
});

describe('htmlLigneJourFerie', () => {
    test('devrait produire la ligne attendue pour un jour férié ordinaire', () => {
        const html = htmlLigneJourFerie({ id: 9, description: 'Fête nationale' }, '2026-12-25');

        expect(html.replace(/\s+/g, ' ').trim()).toBe(
            '<td>2026-12-25</td> <td>Fête nationale</td> ' +
            '<td> <button class="btn btn-supprimer" data-action="delete-ferie" data-id="9">Supprimer</button> </td>'
        );
    });

    test('devrait échapper la description', () => {
        const html = htmlLigneJourFerie({ id: 9, description: CHARGE }, '2026-12-25');

        expect(html).toContain('<td>' + CHARGE_ECHAPPEE + '</td>');
        expect(nomsDeBalises(html)).toEqual(['button', 'td']);
    });

    test('devrait échapper la date reçue en paramètre et l\'identifiant', () => {
        const html = htmlLigneJourFerie({ id: CHARGE_ATTRIBUT, description: 'x' }, CHARGE);

        expect(html).toContain('<td>' + CHARGE_ECHAPPEE + '</td>');
        expect(html).not.toContain('" onmouseover=');
        expect(nomsDeBalises(html)).toEqual(['button', 'td']);
    });
});
