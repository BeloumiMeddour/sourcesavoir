# ecoles3S

ecoles3S (anciennement Planify) est une application web de planification et de gestion des cours pour les établissements d'enseignement. Elle permet de gérer les cours, les professeurs, les salles, les semestres et les affectations de manière efficace et automatisée.

## Fonctionnalités

- **Gestion des utilisateurs** : Authentification et gestion des rôles (admin, utilisateur)
- **Catalogue des cours** : Création et gestion des cours avec leurs caractéristiques
- **Gestion des professeurs** : Profils des enseignants avec spécialités et charges horaires
- **Gestion des salles** : Inventaire des salles avec types et capacités
- **Planification des semestres** : Définition des périodes d'enseignement
- **Affectation automatique** : Assignation optimisée des cours aux professeurs et salles
- **Gestion des disponibilités** : Calendriers de disponibilité pour professeurs et salles
- **Jours fériés** : Gestion des congés et jours sans cours
- **Rapports** : Génération de rapports sur les affectations et l'utilisation des ressources

## Technologies utilisées

- **Backend** : Node.js avec Express.js
- **Base de données** : SQL Server avec Prisma ORM
- **Frontend** : Handlebars pour les templates, CSS personnalisé
- **Authentification** : Passport.js avec stratégie locale
- **Sécurité** : Helmet, CORS, sessions sécurisées
- **Tests** : Jest pour les tests unitaires et d'intégration
- **Outils de développement** : Nodemon, Babel

## Installation

### Prérequis

- Node.js (version 16 ou supérieure)
- SQL Server
- npm ou yarn

### Étapes d'installation

1. **Cloner le repository**
   ```bash
   git clone <url-du-repository>
   cd planify
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de la base de données**

   Créer un fichier `.env` à la racine du projet :
   ```env
   DATABASE_URL="sqlserver://username:password@localhost:1433;database=ecoles3S;trustServerCertificate=true"
   SESSION_SECRET="votre-cle-secrete-pour-les-sessions"
   ```

4. **Initialiser la base de données**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Créer un administrateur**
   ```bash
   node create-admin.js
   ```

## Utilisation

### Démarrage du serveur

```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

L'application sera accessible sur `http://localhost:3000`

### Scripts disponibles

- `npm start` : Démarre le serveur en mode production
- `npm run dev` : Démarre le serveur en mode développement avec nodemon
- `npm test` : Lance tous les tests
- `npm run test:coverage` : Lance les tests avec rapport de couverture
- `npm run test:watch` : Lance les tests en mode surveillance
- `npm run test:integration` : Lance uniquement les tests d'intégration

## Structure du projet

```
planify/
├── middleware/          # Middlewares Express (authentification, etc.)
├── model/              # Modèles de données Prisma
├── prisma/             # Schéma et migrations de base de données
├── public/             # Assets statiques (CSS, JS, images)
├── routes.js           # Définition des routes Express
├── server.js           # Point d'entrée de l'application
├── views/              # Templates Handlebars
├── __tests__/          # Tests unitaires et d'intégration
├── coverage/           # Rapports de couverture des tests
└── rapports/           # Génération de rapports
```

## Modèle de données

Le système gère plusieurs entités principales :

- **User** : Utilisateurs du système avec rôles
- **Cours** : Catalogue des cours avec durée, programme, etc.
- **Professeur** : Enseignants avec spécialités et charges horaires
- **Salle** : Salles de cours avec types et capacités
- **Semestre** : Périodes d'enseignement
- **AffectationCours** : Assignations des cours aux professeurs et salles
- **Disponibilite** : Calendriers de disponibilité
- **JourFerie** : Jours fériés et congés

## Tests

Le projet inclut une suite complète de tests :

- **Tests unitaires** : Validation des modèles et logique métier
- **Tests d'intégration** : Validation des routes et interactions API
- **Tests d'authentification** : Vérification de la sécurité

Pour lancer les tests :
```bash
npm test
```

Consultez le [guide des tests](TESTS_GUIDE.md) pour plus de détails.

## API

L'application expose une API REST pour l'intégration avec d'autres systèmes. Les endpoints principaux incluent :

- `/api/auth` : Authentification
- `/api/cours` : Gestion des cours
- `/api/professeurs` : Gestion des professeurs
- `/api/salles` : Gestion des salles
- `/api/affectations` : Gestion des affectations
- `/api/semestres` : Gestion des semestres

## Sécurité

- Authentification basée sur Passport.js
- Sessions sécurisées avec express-session
- Protection CSRF
- Headers de sécurité avec Helmet
- Validation des entrées utilisateur
- Hachage des mots de passe avec bcrypt

## Contribution

1. Forker le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commiter vos changements (`git commit -am 'Ajout de nouvelle fonctionnalité'`)
4. Pousser vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## Licence

Ce projet est sous licence UNLICENSED - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Auteur

**Alicia Terbouche**
**Imen Bali**
**Meddour Beloumi**

## Support

Pour toute question ou problème, veuillez créer une issue dans le repository GitHub.
