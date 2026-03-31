/**
 * Script de génération du rapport de tests Jest - EPlanify
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, Header, Footer, PageNumber,
  NumberFormat, convertInchesToTwip, UnderlineType
} from 'docx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────
//  DONNÉES DU RAPPORT
// ─────────────────────────────────────────────
const reportDate = '27 Mars 2026';
const projectName = 'EPlanify';

const testSuites = [
  {
    file: '__tests__/unit/user.test.js',
    type: 'Unitaire',
    module: 'Modèle User',
    describe: 'User Model',
    groups: [
      { name: 'createUser', tests: [
        'Devrait créer un nouvel utilisateur avec email et mot de passe hashé',
        'Devrait créer un utilisateur avec rôle par défaut "user"',
        'Devrait rejeter les emails en doublon',
      ]},
      { name: 'getUserByEmail', tests: [
        'Devrait retourner un utilisateur par son email',
        "Devrait retourner null si l'utilisateur n'existe pas",
      ]},
      { name: 'getUsers', tests: [
        'Devrait retourner la liste de tous les utilisateurs sans les mots de passe',
        "Devrait retourner un tableau vide si aucun utilisateur",
      ]},
      { name: 'getUserById', tests: [
        'Devrait retourner un utilisateur par son ID',
        "Devrait retourner null si l'utilisateur n'existe pas",
      ]},
      { name: 'updateUser', tests: [
        "Devrait mettre à jour les données d'un utilisateur",
        "Devrait lancer une erreur si l'utilisateur n'existe pas",
      ]},
    ],
  },
  {
    file: '__tests__/unit/auth.middleware.test.js',
    type: 'Unitaire',
    module: 'Middleware d\'authentification',
    describe: 'Authentication Middleware',
    groups: [
      { name: 'estAuthentifie', tests: [
        "Devrait appeler next() si l'utilisateur est authentifié",
        'Devrait retourner 401 JSON pour les routes API si non authentifié',
        'Devrait rediriger vers /connexion pour les pages si non authentifié',
      ]},
      { name: 'estAdmin', tests: [
        "Devrait appeler next() si l'utilisateur est authentifié et admin",
        'Devrait retourner 403 JSON pour les routes API si rôle insuffisant',
        "Devrait retourner 401 si non authentifié et c'est une API",
        'Devrait rediriger vers /connexion si non authentifié',
        'Devrait retourner 403 pour les pages si rôle insuffisant',
      ]},
      { name: 'estResponsableOuAdmin', tests: [
        "Devrait appeler next() si utilisateur est admin",
        "Devrait appeler next() si utilisateur est responsable",
        "Devrait retourner 403 si utilisateur est simple user",
        "Devrait retourner 401 si non authentifié pour API",
        "Devrait rediriger vers /connexion si non authentifié pour page",
      ]},
    ],
  },
  {
    file: '__tests__/unit/cours.test.js',
    type: 'Unitaire',
    module: 'Modèle Cours',
    describe: 'Cours Model',
    groups: [
      { name: 'addCours', tests: [
        'Devrait ajouter un nouveau cours avec toutes les données',
        'Devrait rejeter les codes de cours en doublon',
        'Devrait créer un cours avec tous les champs requis',
      ]},
      { name: 'getCours', tests: [
        'Devrait retourner la liste de tous les cours',
        "Devrait retourner un tableau vide s'il n'y a aucun cours",
      ]},
      { name: 'getCoursById', tests: [
        'Devrait retourner un cours par son ID',
        "Devrait retourner null si le cours n'existe pas",
      ]},
      { name: 'updateCours', tests: [
        'Devrait mettre à jour un cours existant',
        "Devrait lancer une erreur si le cours n'existe pas",
      ]},
      { name: 'deleteCours', tests: [
        'Devrait supprimer un cours sans affectations',
        "Devrait rejeter la suppression d'un cours avec affectations",
        "Devrait lancer une erreur si le cours n'existe pas",
      ]},
    ],
  },
  {
    file: '__tests__/unit/professeur.test.js',
    type: 'Unitaire',
    module: 'Modèle Professeur',
    describe: 'Professeur Model',
    groups: [
      { name: 'addProfesseur', tests: [
        'Devrait ajouter un nouveau professeur avec tous les champs',
        'Devrait rejeter les matricules en doublon',
      ]},
      { name: 'getProfesseurs', tests: [
        'Devrait retourner la liste de tous les professeurs',
        'Devrait filtrer les professeurs par spécialité',
      ]},
      { name: 'getProfesseurById', tests: [
        'Devrait retourner un professeur avec ses relations',
        "Devrait retourner null si le professeur n'existe pas",
      ]},
      { name: 'updateProfesseur', tests: [
        'Devrait mettre à jour un professeur existant',
        "Devrait lancer une erreur si le professeur n'existe pas",
      ]},
      { name: 'deleteProfesseur', tests: [
        'Devrait valider la charge horaire avant suppression',
        "Devrait retourner erreur si le professeur n'existe pas",
      ]},
      { name: 'Validation des données', tests: [
        'Devrait avoir une charge horaire par défaut de 30',
      ]},
    ],
  },
  {
    file: '__tests__/unit/salle.test.js',
    type: 'Unitaire',
    module: 'Modèle Salle',
    describe: 'Salle Model',
    groups: [
      { name: 'addSalle', tests: [
        'Devrait ajouter une nouvelle salle',
        'Devrait rejeter les codes en doublon',
        'Devrait valider la capacité positive',
      ]},
      { name: 'getSalles', tests: [
        'Devrait retourner la liste de toutes les salles triées',
        "Devrait retourner un tableau vide s'il n'y a pas de salle",
      ]},
      { name: 'getSalleById', tests: [
        'Devrait retourner une salle par son ID',
        "Devrait retourner null si la salle n'existe pas",
      ]},
      { name: 'getSallesByType', tests: [
        'Devrait filtrer les salles par type',
        'Devrait retourner un tableau vide si aucune salle du type',
      ]},
      { name: 'updateSalle', tests: [
        'Devrait mettre à jour une salle existante',
        "Devrait lancer une erreur si la salle n'existe pas",
      ]},
      { name: 'deleteSalle', tests: [
        'Devrait supprimer une salle sans affectations',
        "Devrait rejeter la suppression d'une salle avec affectations",
        "Devrait lancer une erreur si la salle n'existe pas",
      ]},
      { name: 'Validation capacité', tests: [
        'Devrait valider les types de salle',
        'Devrait assurer que capacité est un nombre positif',
      ]},
    ],
  },
  {
    file: '__tests__/unit/semestre.test.js',
    type: 'Unitaire',
    module: 'Modèles Semestre & JourFerie',
    describe: 'Semestre and JourFerie Models',
    groups: [
      { name: 'Semestre Model', tests: [
        'Devrait créer un semestre avec dates valides',
        'Devrait avoir une date de début avant la date de fin',
        'Devrait pouvoir créer plusieurs semestres différents',
        "Devrait valider l'ordre chronologique des semestres",
        'Devrait rejeter les noms en doublon',
      ]},
      { name: 'JourFerie Model', tests: [
        'Devrait créer un jour férié avec description',
        'Devrait valider que la date du jour férié est une date valide',
        'Devrait pouvoir avoir plusieurs jours fériés',
        'Devrait rejeter les doublons date + semestre',
        "Devrait calculer correctement les jours fériés d'une année",
      ]},
      { name: 'Validations Temporelles', tests: [
        'Devrait valider que le semestre couvre une période',
        "Devrait assurer que les jours fériés sont dans le semestre",
        "Devrait autoriser les jours fériés en dehors de la période scolaire",
      ]},
      { name: 'Relations et Intégrité', tests: [
        "Devrait permettre l'association de jours fériés à un semestre",
        'Devrait permettre la suppression en cascade',
      ]},
    ],
  },
  {
    file: '__tests__/unit/affectation.test.js',
    type: 'Unitaire',
    module: 'Modèle Affectation',
    describe: 'Affectation Model',
    groups: [
      { name: 'affecterCoursASalle', tests: [
        'Devrait créer une affectation valide (cours + salle + date)',
        'Devrait rejeter si la salle est déjà occupée à la même plage horaire',
        'Devrait rejeter si le professeur est déjà assigné à la même plage horaire',
        'Devrait accepter des plages horaires qui ne se chevauchent pas',
        'Devrait inclure cours, salle et professeur dans la réponse',
      ]},
      { name: 'affecterCoursAuSemestre', tests: [
        'Devrait créer une affectation récurrente (cours par semaine)',
        "Devrait rejeter si le semestre n'existe pas",
        'Devrait valider que jour et semestre sont obligatoires',
        'Devrait vérifier les conflits sur la première occurrence',
      ]},
      { name: 'getAffectations', tests: [
        'Devrait retourner toutes les affectations',
      ]},
      { name: 'deleteAffectation', tests: [
        'Devrait supprimer une affectation existante',
        "Devrait retourner erreur si affectation n'existe pas",
      ]},
      { name: 'Validation des plages horaires', tests: [
        'Devrait accepter 08:00-10:00 et 10:00-12:00 (consécutif)',
        'Devrait rejeter 08:00-10:00 et 09:00-11:00 (chevauchement)',
        'Devrait gérer les plages sur plusieurs jours différents',
      ]},
    ],
  },
  {
    file: '__tests__/integration/auth.integration.test.js',
    type: 'Intégration',
    module: 'Authentification',
    describe: 'Authentication Integration Tests',
    groups: [
      { name: 'User Registration Flow', tests: [
        'Devrait créer un nouvel utilisateur avec succès',
        "Devrait valider l'email lors de l'inscription",
        'Devrait valider la force du mot de passe',
        'Devrait assigner le rôle par défaut "user" lors de l\'inscription',
        "Devrait rejeter l'inscription avec email en doublon",
      ]},
      { name: 'User Login Flow', tests: [
        'Devrait récupérer un utilisateur par email pour la connexion',
        'Devrait rejeter la connexion avec email inexistant',
        'Devrait sécuriser le mot de passe avec bcrypt',
      ]},
      { name: 'Session Management', tests: [
        'Devrait créer une session utilisateur après connexion',
        'Devrait nettoyer la session à la déconnexion',
      ]},
      { name: 'Role-based Access Control', tests: [
        "Devrait assigner le rôle admin",
        "Devrait assigner le rôle responsable",
      ]},
      { name: 'Security Tests', tests: [
        'Devrait hasher le mot de passe avant stockage',
        'Devrait vérifier le mot de passe correctement',
        'Devrait gérer les injections SQL',
      ]},
    ],
  },
  {
    file: '__tests__/integration/cours.integration.test.js',
    type: 'Intégration',
    module: 'API Cours',
    describe: 'Cours API Integration Tests',
    groups: [
      { name: 'CRUD Operations', tests: [
        'Devrait créer et retourner un nouveau cours',
        'Devrait récupérer tous les cours avec succès',
        'Devrait récupérer un cours par ID',
        'Devrait mettre à jour un cours existant',
        'Devrait supprimer un cours sans affectations',
      ]},
      { name: 'Validation et Erreurs', tests: [
        'Devrait valider les champs requis lors de la création',
        'Devrait retourner 404 pour un cours inexistant',
        "Devrait empêcher la suppression d'un cours avec affectations",
      ]},
      { name: 'Contraintes de données', tests: [
        'Devrait rejeter le code en doublon',
        'Devrait assurer la cohérence des données de cours',
      ]},
    ],
  },
];

// Stats
const totalTests = testSuites.reduce((sum, s) => sum + s.groups.reduce((gs, g) => gs + g.tests.length, 0), 0);
const unitSuites = testSuites.filter(s => s.type === 'Unitaire');
const integSuites = testSuites.filter(s => s.type === 'Intégration');
const unitTests = unitSuites.reduce((sum, s) => sum + s.groups.reduce((gs, g) => gs + g.tests.length, 0), 0);
const integTests = integSuites.reduce((sum, s) => sum + s.groups.reduce((gs, g) => gs + g.tests.length, 0), 0);

// ─────────────────────────────────────────────
//  GÉNÉRATION WORD (.docx)
// ─────────────────────────────────────────────
function generateWord() {
  const BLUE = '1F4E79';
  const LIGHT_BLUE = 'BDD7EE';
  const GRAY = 'F2F2F2';
  const WHITE = 'FFFFFF';
  const GREEN = '70AD47';
  const DARK = '2F3640';

  const cellBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  };

  const headerCell = (text, widthPct) =>
    new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: BLUE },
      borders: cellBorder,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: WHITE, size: 20, font: 'Calibri' })],
      })],
    });

  const dataCell = (text, bg = WHITE, align = AlignmentType.LEFT) =>
    new TableCell({
      shading: { type: ShadingType.CLEAR, fill: bg },
      borders: cellBorder,
      children: [new Paragraph({
        alignment: align,
        children: [new TextRun({ text: String(text), size: 18, font: 'Calibri', color: DARK })],
      })],
    });

  // Page de garde
  const coverSection = [
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '📋 RAPPORT DE TESTS', bold: true, size: 52, color: BLUE, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: projectName, bold: true, size: 72, color: BLUE, font: 'Calibri' })],
    }),
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '─────────────────────────────', color: BLUE, size: 28, font: 'Calibri' })],
    }),
    new Paragraph({ spacing: { before: 200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Date : ${reportDate}`, size: 26, font: 'Calibri', color: '555555' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Framework de test : Jest', size: 26, font: 'Calibri', color: '555555' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Environnement : Node.js', size: 26, font: 'Calibri', color: '555555' })],
    }),
    new Paragraph({ spacing: { before: 600 } }),
    // Résumé stats
    new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          headerCell('Total tests', 33),
          headerCell('Tests unitaires', 33),
          headerCell('Tests intégration', 34),
        ]}),
        new TableRow({ children: [
          dataCell(`${totalTests}`, LIGHT_BLUE, AlignmentType.CENTER),
          dataCell(`${unitTests}`, GRAY, AlignmentType.CENTER),
          dataCell(`${integTests}`, GRAY, AlignmentType.CENTER),
        ]}),
      ],
    }),
  ];

  // Résumé exécutif
  const summarySection = [
    new Paragraph({ pageBreakBefore: true }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: '1. Résumé Exécutif', bold: true, color: BLUE, font: 'Calibri', size: 32 })],
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Le projet ${projectName} dispose d'une suite de tests complète réalisée avec le framework Jest. ` +
          `Au total, ${totalTests} cas de test ont été définis répartis en ${testSuites.length} fichiers de tests.`,
        size: 22, font: 'Calibri', color: DARK,
      })],
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Configuration Jest :',
        bold: true, size: 22, font: 'Calibri', color: BLUE,
      })],
      spacing: { before: 200 },
    }),
    ...[
      '• Environnement : Node.js',
      '• Transpilation : Babel (babel-jest)',
      '• Couverture : model/**/*.js, middleware/**/*.js, routes.js',
      '• Pattern : **/__tests__/**/*.test.js',
    ].map(t => new Paragraph({
      children: [new TextRun({ text: t, size: 20, font: 'Calibri', color: DARK })],
      indent: { left: convertInchesToTwip(0.3) },
    })),
    new Paragraph({ spacing: { before: 300 } }),
    new Paragraph({
      children: [new TextRun({ text: 'Statistiques globales :', bold: true, size: 22, font: 'Calibri', color: BLUE })],
      spacing: { before: 100 },
    }),
    new Table({
      width: { size: 70, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          headerCell('Métrique', 50),
          headerCell('Valeur', 50),
        ]}),
        ...([
          ['Nombre de fichiers de tests', testSuites.length],
          ['Tests unitaires (fichiers)', `${unitSuites.length} fichiers`],
          ["Tests d'intégration (fichiers)", `${integSuites.length} fichiers`],
          ['Total cas de test', totalTests],
          ['Tests unitaires (cas)', unitTests],
          ["Tests d'intégration (cas)", integTests],
          ['Modules couverts', '7 modules'],
          ['Framework', 'Jest 30.x'],
        ].map(([k, v], i) => new TableRow({ children: [
          dataCell(k, i % 2 === 0 ? WHITE : GRAY),
          dataCell(String(v), i % 2 === 0 ? WHITE : GRAY, AlignmentType.CENTER),
        ]})))
      ],
    }),
  ];

  // Vue d'ensemble des suites
  const overviewSection = [
    new Paragraph({ pageBreakBefore: true }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "2. Vue d'Ensemble des Suites de Tests", bold: true, color: BLUE, font: 'Calibri', size: 32 })],
    }),
    new Paragraph({ spacing: { before: 200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          headerCell('#', 5),
          headerCell('Fichier', 35),
          headerCell('Type', 12),
          headerCell('Module testé', 28),
          headerCell('Nb tests', 10),
          headerCell('Groupes', 10),
        ]}),
        ...testSuites.map((s, i) => {
          const nb = s.groups.reduce((sum, g) => sum + g.tests.length, 0);
          const bg = i % 2 === 0 ? WHITE : GRAY;
          return new TableRow({ children: [
            dataCell(String(i + 1), bg, AlignmentType.CENTER),
            dataCell(s.file.replace('__tests__/', ''), bg),
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: s.type === 'Unitaire' ? 'E2EFDA' : 'FFF2CC' },
              borders: cellBorder,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: s.type, size: 18, font: 'Calibri', color: s.type === 'Unitaire' ? '375623' : '7F6000', bold: true })],
              })],
            }),
            dataCell(s.module, bg),
            dataCell(String(nb), bg, AlignmentType.CENTER),
            dataCell(String(s.groups.length), bg, AlignmentType.CENTER),
          ]});
        }),
        new TableRow({ children: [
          new TableCell({
            columnSpan: 4,
            shading: { type: ShadingType.CLEAR, fill: BLUE },
            borders: cellBorder,
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'TOTAL', bold: true, color: WHITE, font: 'Calibri', size: 20 })],
            })],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: BLUE },
            borders: cellBorder,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(totalTests), bold: true, color: WHITE, font: 'Calibri', size: 20 })],
            })],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: BLUE },
            borders: cellBorder,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(testSuites.reduce((s, ts) => s + ts.groups.length, 0)), bold: true, color: WHITE, font: 'Calibri', size: 20 })],
            })],
          }),
        ]}),
      ],
    }),
  ];

  // Détail des tests
  const detailSection = [
    new Paragraph({ pageBreakBefore: true }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: '3. Détail des Tests par Fichier', bold: true, color: BLUE, font: 'Calibri', size: 32 })],
    }),
  ];

  testSuites.forEach((suite, sIdx) => {
    const totalSuite = suite.groups.reduce((sum, g) => sum + g.tests.length, 0);

    detailSection.push(
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({
          text: `3.${sIdx + 1} ${suite.describe}`,
          bold: true, color: BLUE, font: 'Calibri', size: 26,
        })],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Fichier : ', bold: true, size: 20, font: 'Calibri', color: DARK }),
          new TextRun({ text: suite.file, size: 20, font: 'Consolas', color: '595959' }),
          new TextRun({ text: '   |   Type : ', bold: true, size: 20, font: 'Calibri', color: DARK }),
          new TextRun({ text: suite.type, size: 20, font: 'Calibri', color: suite.type === 'Unitaire' ? '375623' : '7F6000', bold: true }),
          new TextRun({ text: `   |   Total : ${totalSuite} tests`, bold: true, size: 20, font: 'Calibri', color: DARK }),
        ],
        spacing: { before: 100, after: 200 },
      }),
    );

    suite.groups.forEach((group) => {
      detailSection.push(
        new Paragraph({
          children: [new TextRun({
            text: `▸ describe('${group.name}') — ${group.tests.length} test(s)`,
            bold: true, size: 20, font: 'Calibri', color: '2F5496',
          })],
          indent: { left: convertInchesToTwip(0.2) },
          spacing: { before: 150 },
        }),
        new Table({
          width: { size: 95, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell('#', 6),
              headerCell('Cas de test (description)', 94),
            ]}),
            ...group.tests.map((t, ti) => new TableRow({ children: [
              dataCell(String(ti + 1), ti % 2 === 0 ? WHITE : GRAY, AlignmentType.CENTER),
              dataCell(t, ti % 2 === 0 ? WHITE : GRAY),
            ]})),
          ],
        }),
      );
    });
  });

  // Analyse par module
  const analysisSection = [
    new Paragraph({ pageBreakBefore: true }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: '4. Analyse par Module', bold: true, color: BLUE, font: 'Calibri', size: 32 })],
    }),
    new Paragraph({ spacing: { before: 200 } }),
    ...([
      { module: 'User Model', tests: 11, coverage: 'createUser, getUserByEmail, getUsers, getUserById, updateUser', note: 'Gestion complète du cycle de vie utilisateur avec validation des contraintes uniques et gestion des mots de passe via bcrypt.' },
      { module: 'Middleware Auth', tests: 13, coverage: 'estAuthentifie, estAdmin, estResponsableOuAdmin', note: 'Contrôle d\'accès basé sur les rôles (user, responsable, admin). Distinction routes API (JSON) vs pages (redirect).' },
      { module: 'Cours Model', tests: 12, coverage: 'addCours, getCours, getCoursById, updateCours, deleteCours', note: 'CRUD complet avec protection contre la suppression de cours ayant des affectations actives.' },
      { module: 'Professeur Model', tests: 11, coverage: 'addProfesseur, getProfesseurs, getProfesseurById, updateProfesseur, deleteProfesseur', note: 'Gestion des professeurs avec filtrage par spécialité et validation des matricules uniques.' },
      { module: 'Salle Model', tests: 16, coverage: 'addSalle, getSalles, getSalleById, getSallesByType, updateSalle, deleteSalle', note: 'Le module le plus testé. Validation des types (Salle, Labo, Classe, Amphithéâtre) et capacités positives.' },
      { module: 'Semestre & JourFerie', tests: 15, coverage: 'Semestre, JourFerie, Validations Temporelles, Relations', note: 'Tests de cohérence chronologique, suppression en cascade et gestion des contraintes d\'unicité.' },
      { module: 'Affectation Model', tests: 15, coverage: 'affecterCoursASalle, affecterCoursAuSemestre, getAffectations, deleteAffectation', note: 'Tests de conflits de plages horaires (salle et professeur), affectations récurrentes sur semestre.' },
      { module: 'Auth Integration', tests: 15, coverage: 'Registration, Login, Session, RBAC, Security', note: 'Tests de bout-en-bout du flux d\'authentification, sécurité bcrypt et prévention injection SQL.' },
      { module: 'Cours API Integration', tests: 10, coverage: 'CRUD, Validation, Contraintes', note: 'Tests d\'intégration complets de l\'API Cours avec vérification de la cohérence des données.' },
    ].map((item, i) => [
      new Paragraph({
        spacing: { before: 200 },
        children: [
          new TextRun({ text: `${i + 1}. ${item.module}`, bold: true, size: 22, font: 'Calibri', color: BLUE }),
          new TextRun({ text: `  (${item.tests} tests)`, size: 20, font: 'Calibri', color: '555555' }),
        ],
      }),
      new Paragraph({
        indent: { left: convertInchesToTwip(0.3) },
        children: [new TextRun({ text: `Fonctions : ${item.coverage}`, size: 18, font: 'Calibri', color: DARK, italics: true })],
      }),
      new Paragraph({
        indent: { left: convertInchesToTwip(0.3) },
        children: [new TextRun({ text: item.note, size: 18, font: 'Calibri', color: DARK })],
        spacing: { after: 100 },
      }),
    ]).flat()),
  ];

  // Conclusion
  const conclusionSection = [
    new Paragraph({ pageBreakBefore: true }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: '5. Conclusion', bold: true, color: BLUE, font: 'Calibri', size: 32 })],
    }),
    new Paragraph({
      children: [new TextRun({
        text: `La suite de tests du projet ${projectName} couvre l'ensemble des modules critiques de l'application avec ` +
          `${totalTests} cas de test au total. La stratégie de test combine :`,
        size: 22, font: 'Calibri', color: DARK,
      })],
      spacing: { before: 200, after: 100 },
    }),
    ...([
      `Tests unitaires (${unitTests} tests) : isolation par mocks Prisma, validation des règles métier individuellement.`,
      `Tests d'intégration (${integTests} tests) : flux complets d'authentification, sécurité, gestion de sessions.`,
      'Couverture des cas d\'erreur : contraintes d\'unicité, ressources inexistantes, conflits métier.',
      'Validation de sécurité : hachage bcrypt, résistance aux injections SQL, contrôle d\'accès RBAC.',
    ].map(t => new Paragraph({
      children: [new TextRun({ text: `• ${t}`, size: 20, font: 'Calibri', color: DARK })],
      indent: { left: convertInchesToTwip(0.3) },
      spacing: { before: 80 },
    }))),
    new Paragraph({ spacing: { before: 200 } }),
    new Paragraph({
      children: [new TextRun({
        text: 'Points forts : ',
        bold: true, size: 22, font: 'Calibri', color: GREEN,
      })],
    }),
    ...([
      'Utilisation cohérente des mocks Jest pour isoler la base de données.',
      'Tests de cas limites (null, tableaux vides, ressources inexistantes).',
      'Validation métier stricte (plages horaires, contraintes d\'affectation).',
      'Tests de sécurité explicites (bcrypt, injection SQL).',
    ].map(t => new Paragraph({
      children: [new TextRun({ text: `✓ ${t}`, size: 20, font: 'Calibri', color: '375623' })],
      indent: { left: convertInchesToTwip(0.3) },
      spacing: { before: 60 },
    }))),
  ];

  const doc = new Document({
    creator: 'EPlanify',
    title: `Rapport de Tests - ${projectName}`,
    description: 'Rapport complet des tests Jest',
    sections: [{
      properties: {},
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `${projectName} — Rapport de Tests Jest`, size: 18, font: 'Calibri', color: '888888' }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `${projectName} | ${reportDate} | Page `, size: 16, font: 'Calibri', color: '888888' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Calibri', color: '888888' }),
              new TextRun({ text: ' / ', size: 16, font: 'Calibri', color: '888888' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: 'Calibri', color: '888888' }),
            ],
          })],
        }),
      },
      children: [
        ...coverSection,
        ...summarySection,
        ...overviewSection,
        ...detailSection,
        ...analysisSection,
        ...conclusionSection,
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

// ─────────────────────────────────────────────
//  GÉNÉRATION PDF
// ─────────────────────────────────────────────
function generatePDF(outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 }, autoFirstPage: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = 475; // A4 width (595) - left margin (60) - right margin (60)
    const BLUE = '#1F4E79';
    const LIGHT_BLUE = '#BDD7EE';
    const GRAY = '#F2F2F2';
    const GREEN = '#375623';
    const DARK = '#2F3640';
    const WHITE = '#FFFFFF';
    const UNIT_BG = '#E2EFDA';
    const INTEG_BG = '#FFF2CC';

    let pageNum = 0;

    function addPage(bg = null) {
      doc.addPage();
      pageNum++;
      if (bg) { doc.rect(0, 0, doc.page.width, doc.page.height).fill(bg); }
    }

    function header() {
      doc.rect(0, 0, doc.page.width, 40).fill(BLUE);
      doc.fillColor(WHITE).fontSize(10).font('Helvetica').text(`${projectName} — Rapport de Tests Jest`, 60, 14, { align: 'right' });
    }

    function footer() {
      doc.rect(0, doc.page.height - 35, doc.page.width, 35).fill('#F5F5F5');
      doc.fillColor('#888888').fontSize(9).font('Helvetica')
        .text(`${projectName}  |  ${reportDate}  |  Page ${pageNum}`, 60, doc.page.height - 22, { align: 'center' });
    }

    // ── PAGE DE GARDE ──
    addPage(BLUE);
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(BLUE);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(48).text(projectName, 60, 200, { align: 'center', width: doc.page.width - 120 });
    doc.fillColor('#BDD7EE').font('Helvetica-Bold').fontSize(28).text('RAPPORT DE TESTS', 60, 270, { align: 'center', width: doc.page.width - 120 });
    doc.fillColor(WHITE).font('Helvetica').fontSize(14).text(`Framework : Jest  |  Environnement : Node.js`, 60, 340, { align: 'center', width: doc.page.width - 120 });
    doc.fillColor(WHITE).fontSize(13).text(`Date : ${reportDate}`, 60, 365, { align: 'center', width: doc.page.width - 120 });

    // Stats box
    const bx = 100, by = 430, bw = doc.page.width - 200, bh = 110;
    doc.rect(bx, by, bw, bh).fillAndStroke('#163456', '#AAAAAA');
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13);
    const col = bw / 3;
    doc.text('Total tests', bx, by + 15, { width: col, align: 'center' });
    doc.text('Tests unitaires', bx + col, by + 15, { width: col, align: 'center' });
    doc.text("Tests d'intégration", bx + 2 * col, by + 15, { width: col, align: 'center' });
    doc.fillColor(LIGHT_BLUE).font('Helvetica-Bold').fontSize(36);
    doc.text(String(totalTests), bx, by + 42, { width: col, align: 'center' });
    doc.text(String(unitTests), bx + col, by + 42, { width: col, align: 'center' });
    doc.text(String(integTests), bx + 2 * col, by + 42, { width: col, align: 'center' });

    doc.fillColor('#888888').fontSize(9).text(`${projectName}  |  ${reportDate}  |  Page 1`, 60, doc.page.height - 22, { align: 'center' });

    // ── RÉSUMÉ EXÉCUTIF ──
    addPage();
    header();

    let y = 55;
    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(18).text('1. Résumé Exécutif', 60, y);
    y += 30;
    doc.rect(60, y, W, 2).fill(LIGHT_BLUE);
    y += 10;

    doc.fillColor(DARK).font('Helvetica').fontSize(11).text(
      `Le projet ${projectName} dispose d'une suite de tests complète réalisée avec le framework Jest. ` +
      `Au total, ${totalTests} cas de test ont été définis répartis en ${testSuites.length} fichiers de tests couvrant ` +
      `l'ensemble des modules critiques de l'application.`,
      60, y, { width: W }
    );
    y += 70;

    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(13).text('Configuration Jest', 60, y);
    y += 18;
    const configItems = [
      ['Environnement', 'Node.js'],
      ['Transpilation', 'Babel (babel-jest)'],
      ['Couverture', 'model/**/*.js, middleware/**/*.js, routes.js'],
      ['Pattern de test', '**/__tests__/**/*.test.js'],
      ['Version Jest', '30.x'],
    ];
    configItems.forEach(([k, v]) => {
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10).text(`${k} :`, 70, y, { continued: true });
      doc.font('Helvetica').text(` ${v}`, { fillColor: '#555555' });
      y += 16;
    });
    y += 15;

    // Tableau stats
    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(13).text('Statistiques globales', 60, y);
    y += 18;

    const stats = [
      ['Fichiers de tests', String(testSuites.length)],
      ['Fichiers unitaires', String(unitSuites.length)],
      ["Fichiers d'intégration", String(integSuites.length)],
      ['Total cas de test', String(totalTests)],
      ['Cas unitaires', String(unitTests)],
      ["Cas d'intégration", String(integTests)],
      ['Modules couverts', '7 modules'],
    ];
    const tW = W * 0.6, c1 = tW * 0.65, c2 = tW * 0.35;
    doc.rect(60, y, tW, 18).fill(BLUE);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
      .text('Métrique', 65, y + 4, { width: c1 - 5 })
      .text('Valeur', 65 + c1, y + 4, { width: c2, align: 'center' });
    y += 18;
    stats.forEach(([k, v], i) => {
      doc.rect(60, y, tW, 16).fill(i % 2 === 0 ? WHITE : GRAY);
      doc.rect(60, y, tW, 16).stroke('#CCCCCC');
      doc.fillColor(DARK).font('Helvetica').fontSize(10)
        .text(k, 65, y + 3, { width: c1 - 5 })
        .text(v, 65 + c1, y + 3, { width: c2, align: 'center' });
      y += 16;
    });

    footer();

    // ── VUE D'ENSEMBLE ──
    addPage();
    header();
    y = 55;
    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(18).text("2. Vue d'Ensemble des Suites de Tests", 60, y);
    y += 30;
    doc.rect(60, y, W, 2).fill(LIGHT_BLUE);
    y += 10;

    const cols = [25, W * 0.38, W * 0.13, W * 0.28, W * 0.1, W * 0.09];
    const headers = ['#', 'Fichier', 'Type', 'Module testé', 'Tests', 'Grp.'];
    doc.rect(60, y, W, 18).fill(BLUE);
    let cx = 60;
    headers.forEach((h, i) => {
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9).text(h, cx + 2, y + 5, { width: cols[i] - 4, align: 'center' });
      cx += cols[i];
    });
    y += 18;

    testSuites.forEach((s, i) => {
      const nb = s.groups.reduce((sum, g) => sum + g.tests.length, 0);
      if (y > doc.page.height - 100) { footer(); addPage(); header(); y = 55; }
      const rowBg = i % 2 === 0 ? WHITE : GRAY;
      doc.rect(60, y, W, 16).fill(rowBg).stroke('#CCCCCC');
      cx = 60;
      const cells = [String(i + 1), s.file.replace('__tests__/', ''), s.type, s.module, String(nb), String(s.groups.length)];
      cells.forEach((cell, ci) => {
        if (ci === 2) {
          doc.rect(cx, y, cols[ci], 16).fill(s.type === 'Unitaire' ? UNIT_BG : INTEG_BG);
          doc.fillColor(s.type === 'Unitaire' ? GREEN : '#7F6000').font('Helvetica-Bold').fontSize(8);
        } else {
          doc.fillColor(DARK).font(ci === 0 || ci >= 4 ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
        }
        doc.text(cell, cx + 2, y + 4, { width: cols[ci] - 4, align: ci === 0 || ci >= 4 ? 'center' : 'left' });
        cx += cols[ci];
      });
      y += 16;
    });
    // Total row
    doc.rect(60, y, W, 18).fill(BLUE);
    cx = 60;
    [' ', ' ', ' ', 'TOTAL', String(totalTests), String(testSuites.reduce((s, ts) => s + ts.groups.length, 0))].forEach((cell, ci) => {
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
        .text(cell, cx + 2, y + 4, { width: cols[ci] - 4, align: ci >= 3 ? 'center' : 'left' });
      cx += cols[ci];
    });
    y += 18;

    footer();

    // ── DÉTAIL DES TESTS ──
    testSuites.forEach((suite, sIdx) => {
      addPage();
      header();
      y = 55;

      const totalSuite = suite.groups.reduce((sum, g) => sum + g.tests.length, 0);
      const typeBg = suite.type === 'Unitaire' ? UNIT_BG : INTEG_BG;
      const typeColor = suite.type === 'Unitaire' ? GREEN : '#7F6000';

      // En-tête de suite
      doc.rect(60, y, W, 40).fill(BLUE);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(16)
        .text(`3.${sIdx + 1} ${suite.describe}`, 70, y + 5, { width: W - 20 });
      doc.fillColor(LIGHT_BLUE).font('Helvetica').fontSize(10)
        .text(`${suite.file}  |  ${totalSuite} tests`, 70, y + 26, { width: W - 20 });
      y += 48;

      // Badge type
      doc.rect(60, y, 90, 18).fill(typeBg).stroke(typeColor);
      doc.fillColor(typeColor).font('Helvetica-Bold').fontSize(9).text(`Type : ${suite.type}`, 65, y + 5, { width: 80, align: 'center' });
      doc.fillColor(DARK).font('Helvetica').fontSize(9).text(`Module : ${suite.module}`, 160, y + 5);
      y += 28;

      suite.groups.forEach((group) => {
        if (y > doc.page.height - 120) { footer(); addPage(); header(); y = 55; }

        doc.rect(60, y, W, 20).fill('#2F5496');
        doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
          .text(`▸ describe('${group.name}')  —  ${group.tests.length} test(s)`, 68, y + 5, { width: W - 16 });
        y += 20;

        // En-tête colonnes
        const c1w = 30, c2w = W - c1w;
        doc.rect(60, y, W, 15).fill(LIGHT_BLUE);
        doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(9)
          .text('#', 62, y + 3, { width: c1w, align: 'center' })
          .text('Description du cas de test', 60 + c1w + 4, y + 3, { width: c2w - 8 });
        y += 15;

        group.tests.forEach((t, ti) => {
          if (y > doc.page.height - 60) { footer(); addPage(); header(); y = 55; }
          const rowH = 15;
          doc.rect(60, y, W, rowH).fill(ti % 2 === 0 ? WHITE : GRAY).stroke('#DDDDDD');
          doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8)
            .text(String(ti + 1), 62, y + 3, { width: c1w, align: 'center' });
          doc.font('Helvetica').text(t, 60 + c1w + 4, y + 3, { width: c2w - 8, lineBreak: false });
          y += rowH;
        });
        y += 8;
      });

      footer();
    });

    // ── ANALYSE PAR MODULE ──
    addPage();
    header();
    y = 55;
    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(18).text('4. Analyse par Module', 60, y);
    y += 30;
    doc.rect(60, y, W, 2).fill(LIGHT_BLUE);
    y += 12;

    const analyses = [
      { module: 'User Model', tests: 11, note: 'Gestion complète du cycle de vie utilisateur avec validation bcrypt et contraintes uniques sur email.' },
      { module: 'Middleware Auth', tests: 13, note: 'RBAC (user/responsable/admin). Distinction routes API (JSON 401/403) vs pages (redirect).' },
      { module: 'Cours Model', tests: 12, note: 'CRUD complet avec protection contre suppression de cours ayant des affectations actives.' },
      { module: 'Professeur Model', tests: 11, note: 'Filtrage par spécialité, unicité des matricules, chargement des relations (disponibilités, affectations).' },
      { module: 'Salle Model', tests: 16, note: 'Module le plus testé. Validation types (Salle/Labo/Classe/Amphithéâtre) et capacités positives.' },
      { module: 'Semestre & JourFerie', tests: 15, note: 'Cohérence chronologique, suppression en cascade, unicité des noms de semestres.' },
      { module: 'Affectation Model', tests: 15, note: 'Détection de conflits plages horaires (salle et professeur), affectations récurrentes sur semestre.' },
      { module: 'Auth Integration', tests: 15, note: 'Flux complet : inscription, connexion, sessions, RBAC, sécurité bcrypt, résistance injection SQL.' },
      { module: "Cours API Integration", tests: 10, note: 'Tests d\'intégration API : CRUD, validation champs requis, contraintes données.' },
    ];

    analyses.forEach((a, i) => {
      if (y > doc.page.height - 80) { footer(); addPage(); header(); y = 55; }
      doc.rect(60, y, W, 16).fill(BLUE);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11)
        .text(`${i + 1}.  ${a.module}`, 70, y + 3, { width: W * 0.7, continued: true })
        .font('Helvetica').fontSize(10).text(`  (${a.tests} tests)`, { fillColor: LIGHT_BLUE });
      y += 16;
      doc.rect(60, y, W, 30).fill(i % 2 === 0 ? WHITE : GRAY).stroke('#CCCCCC');
      doc.fillColor(DARK).font('Helvetica').fontSize(9).text(a.note, 68, y + 7, { width: W - 16 });
      y += 38;
    });

    footer();

    // ── CONCLUSION ──
    addPage();
    header();
    y = 55;
    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(18).text('5. Conclusion', 60, y);
    y += 30;
    doc.rect(60, y, W, 2).fill(LIGHT_BLUE);
    y += 12;

    doc.fillColor(DARK).font('Helvetica').fontSize(11).text(
      `La suite de tests du projet ${projectName} couvre l'ensemble des modules critiques de l'application avec ` +
      `${totalTests} cas de test au total. La stratégie de test combine tests unitaires et d'intégration pour ` +
      `garantir la fiabilité du système.`,
      60, y, { width: W }
    );
    y += 55;

    const points = [
      { label: 'Tests unitaires', value: `${unitTests} tests — Isolation par mocks Prisma, validation des règles métier.` },
      { label: "Tests d'intégration", value: `${integTests} tests — Flux complets d'authentification, sécurité, sessions.` },
      { label: 'Couverture des erreurs', value: 'Contraintes d\'unicité, ressources inexistantes, conflits métier.' },
      { label: 'Sécurité', value: 'Hachage bcrypt, résistance injections SQL, contrôle d\'accès RBAC.' },
    ];
    points.forEach(p => {
      doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(10).text(`• ${p.label} : `, 68, y, { continued: true });
      doc.fillColor(DARK).font('Helvetica').text(p.value);
      y += 22;
    });

    y += 15;
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(13).text('Points forts', 60, y);
    y += 20;
    const strengths = [
      'Utilisation cohérente des mocks Jest pour isoler la base de données.',
      'Tests de cas limites (null, tableaux vides, ressources inexistantes).',
      'Validation métier stricte (plages horaires, contraintes d\'affectation).',
      'Tests de sécurité explicites (bcrypt, injection SQL).',
    ];
    strengths.forEach(s => {
      doc.rect(60, y - 1, 6, 14).fill(GREEN);
      doc.fillColor('#375623').font('Helvetica').fontSize(10).text(s, 72, y, { width: W - 12 });
      y += 20;
    });

    // Boîte finale
    y += 20;
    doc.rect(60, y, W, 60).fill(BLUE);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(14)
      .text(`${totalTests} tests`, 60, y + 8, { width: W, align: 'center' });
    doc.fillColor(LIGHT_BLUE).font('Helvetica').fontSize(11)
      .text(`${unitTests} unitaires  +  ${integTests} intégration  |  ${testSuites.length} fichiers  |  Jest 30.x`, 60, y + 30, { width: W, align: 'center' });

    footer();

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// ─────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────
async function main() {
  const outDir = path.join(__dirname, 'rapports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  console.log('📄 Génération du rapport Word...');
  const wordBuffer = await generateWord();
  const wordPath = path.join(outDir, `rapport-tests-${projectName}.docx`);
  fs.writeFileSync(wordPath, wordBuffer);
  console.log(`✅ Word généré : ${wordPath}`);

  console.log('📕 Génération du rapport PDF...');
  const pdfPath = path.join(outDir, `rapport-tests-${projectName}.pdf`);
  await generatePDF(pdfPath);
  console.log(`✅ PDF généré : ${pdfPath}`);

  console.log('\n🎉 Rapports disponibles dans le dossier : rapports/');
}

main().catch(err => { console.error('❌ Erreur :', err); process.exit(1); });
