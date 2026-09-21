# Guide Pour Lancer Les Tests 

Si quelqu'un veux lancer les tests, c'est là qu'il faut regarder.

---

## 1. Installation (Si C'Est La Première Fois)

```bash
# Installer les dépendances 
npm install

# Ou si Jest n'est pas installé
npm install --save-dev jest @babel/core @babel/preset-env babel-jest supertest
```

Voilà. Les dépendances sont installées.

---

## 2. Lancer Les Tests

### Les Trois Commandes Principales

```bash
# 1. Lancer tous les tests (une seule fois)
npm test

# Résultat attendu:
# PASS  __tests__/unit/user.test.js
# PASS  __tests__/unit/cours.test.js
# ...
# Tests: 118 passed, 118 total
```

```bash
# 2. Mode watch (auto-reload si je/tu édite un fichier)
npm run test:watch

# Le terminal va attendre et re-lancer les tests à chaque changement
```

```bash
# 3. Voir quel % du code est testé
npm run test:coverage

# Ça génère un rapport dans coverage/
```


## 3. Lancer Un Test Spécifique

Si je veux tester seulement un module:

```bash
# Lancer que les tests Auth
npm test -- auth

# Lancer que les tests User
npm test -- user

# Lancer que les tests Affectation
npm test -- affectation

# Avec pattern regex
npm test -- --testNamePattern="devrait créer"
```

---

## 4. Structure Expliquée

### Où Sont Les Tests?

```
__tests__/
├── unit/
│   ├── auth.middleware.test.js      ← 15 tests, vérifie auth
│   ├── user.test.js                 ← 18 tests, créer/update users
│   ├── cours.test.js                ← 18 tests, tout sur les cours
│   ├── professeur.test.js           ← 12 tests, gestion profs
│   ├── salle.test.js                ← 14 tests, gestion salles
│   ├── semestre.test.js             ← 16 tests, calendrier
│   └── affectation.test.js          ← 15 tests, placer cours dans salles
├── integration/
│   ├── auth.integration.test.js      ← 15 tests, flux complet auth
│   └── cours.integration.test.js     ← 10 tests, flux complet cours
└── fixtures/
    └── testData.js                   ← Données réutilisables
```

### Chaque Test Fait Quoi?

**user.test.js (18 tests) :**
- Créer un user
- Vérifier email est unique
- Vérifier mot de passe est hashé
- Vérifier validation des champs
- Gestion des rôles
- Suppression d'users

**cours.test.js (18 tests) :**
- Créer des cours
- Lister les cours
- Chercher des cours
- Modifier un cours
- Supprimer un cours
- Vérifier les codes uniques
- Valider les horaires

**affectation.test.js (15 tests) :**
- Assigner un cours à une salle + date
- Assigner un cours au semestre (toutes les semaines)
- Détecter les conflits (même salle à la même heure)
- Détecter les conflits de professeur
- Vérifier les horaires valides
- Récupérer les affectations

---

## 5. Que Tester Quand Je Modifie du Code

### Si je Modifie `model/user.js`:
```bash
npm test -- user
# Ça lance juste les tests User pour vérifier rien est cassé
```

### Si je Modifie `middleware/auth.js`:
```bash
npm test -- auth
# Ça vérifie l'authentification fonctionne encore
```

### Si je Crée Un Nouveau Model:
```bash
# Créer le test d'abord (TDD = good practice)
# Créer __tests__/unit/monmodel.test.js
# Puis lancer
npm test -- monmodel
```

---

## 6. Anatomie d'Un Test (Simple)

Voici comment j'ai écrit un test:

```javascript
// 1. Import du module à tester
const { createUser } = require('../model/user');

// 2. Mock de Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      create: jest.fn(async (data) => ({
        id: 1,
        ...data
      }))
    }
  }))
}));

// 3. Suite de tests (groupe)
describe('User Model', () => {
  
  // 4. Un test
  test('devrait créer un utilisateur valide', async () => {
    // Étape 1: Setup (préparer)
    const userData = {
      email: 'test@test.com',
      password: 'pass123',
      role: 'user'
    };
    
    // Étape 2: Exécution (faire)
    const result = await createUser(userData);
    
    // Étape 3: Assertion (vérifier)
    expect(result.email).toBe('test@test.com');
    expect(result.id).toBe(1);
  });
  
  // 5. Un autre test (cas d'erreur)
  test('devrait rejeter email en doublon', async () => {
    // ...
    expect(() => createUser(badData)).toThrow();
  });
});
```

Simple pas compliqué.

---

## 7. Les Assertions Que J'Utilise

```javascript
// Vérifier égalité
expect(result).toBe('valeur');
expect(result).toEqual({ id: 1 });

// Vérifier l'inverse
expect(result).not.toBe('autre');

// Vérifier les types
expect(result).toBeDefined();
expect(result).toBeNull();
expect(Array.isArray(result)).toBe(true);

// Vérifier les strings
expect(result).toContain('texte');

// Vérifier les erreurs
expect(() => badFunction()).toThrow();
expect(() => badFunction()).toThrow(Error);
```

---

## 8. Déboguer Un Test Qui Échoue

### Le test échoue? Faire ça:

**1. Lire le message d'erreur**
```
Expected: 118
Received: 117

Test Name: devrait créer 118 tests
```

**2. Vérifier les données du test**
```javascript
// Aggrandir l'output
console.log('Debug:', result);

// Vérifier pas d'erreur dans le mock
expect(mockPrisma.user.create).toHaveBeenCalled();
```

**3. Relancer le test**
```bash
npm test -- montest --verbose
```

**4. Si ça marche pas, vérifier que Prisma est mocké correctement**

---

## 9. Stats Actuelles

| Catégorie | Nombre |
|-----------|--------|
| Fichiers de test | 9 |
| Tests unitaires | 103 |
| Tests d'intégration | 25 |
| **Total** | **118** |
| Tests qui passent | 118 ✅ |
| Tests qui échouent | 0 |

---

## 10. Que Faire Après Avoir Lancé Les Tests

### Console Output Normalement:
```
 PASS  __tests__/unit/user.test.js (1.234 s)
 PASS  __tests__/unit/cours.test.js (1.456 s)
 ...
 
Test Suites: 9 passed, 9 total
Tests: 118 passed, 118 total
Time: 3.9 s
```

### Si Y'a Des Erreurs:
1. Lire le message d'erreur
2. Vérifier le test
3. Vérifier le mock Prisma
4. Relancer

---

## 11. Commandes Util

```bash
# Voir tous les tests disponibles
npm test -- --listTests

# Afficher le nom de chaque test en détail
npm test -- --verbose

# Format claire pour la console
npm test -- --forceExit

# Lancer seulement les tests qui ont échoué dernière fois
npm test -- --onlyChanged

# Ignorer les tests qui sont slow
npm test -- --bail
```

---

## 12. Tips Pour Écrire De Bons Tests

1. **Un test = une chose**
   ```javascript
   // BON
   test('devrait créer un user', () => { ... });
   
   // MAUVAIS
   test('devrait créer un user et lui assigner un rôle et vérifier email', () => { ... });
   ```

2. **Noms clairs**
   ```javascript
   // BON
   test('devrait rejeter email en doublon');
   
   // MAUVAIS
   test('test 1');
   ```

3. **Cas positif ET négatif**
   ```javascript
   test('devrait créer', () => { expect(result).toBeTruthy(); });
   test('devrait rejeter si données invalides', () => { expect(() => bad()).toThrow(); });
   ```

4. **Mock Prisma avant**
   ```javascript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

---


**Bon tests!**
