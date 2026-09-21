# Documentation

https://pris.ly/d/prisma-schema

# Définitions

-   Prisma un un ORM
-   ORM (Object-Relational Mapping) : Technique permettant de simplifier l'interaction avec la base de données en permettant aux développeurs de manipuler les données comme des objets au lieu d'écrire directement des requêtes SQL.

# Avantages des ORM

-   Abstraction SQL : Pas besoin d’écrire des requêtes SQL complexes, l’ORM génère automatiquement le SQL nécessaire.
-   Sécurité : Protège contre les injections SQL en gérant correctement les entrées utilisateur.
-   Productivité : Permet d’écrire moins de code et de se concentrer sur la logique métier.
-   Portabilité : Rend le code plus indépendant du type de base de données (ex : passer de SQLite à PostgreSQL est plus simple).
-   Gestion automatique : Facilite les migrations de base de données et les relations entre les tables.

# Procedure d'usage de prisma

## Installations et configurations

### Installation de prisma

-   npm install prisma --save-dev

### Installation du fournisseur ou provider

-   npx prisma init --datasource-provider sqlite
-   NB : le fournisseur insatllé dépend du SGBD qui sera utilisé. Ainsi, le provider peut être sqlite, mysql, sqlserver, postgresql ...
-   Après avoir exécuté cette commande, un nouveau dossier portant le nom prisma sera créé.

### chemin de la base de données

-   Dans le fichier env, se rassurer que la variable DATABASE_URL = "file:./nom_de_la_base_de_donnees.db" a été créée.
-   Pour notre demo, le nom de la db doit être todo.db

## Définition du modèle prisma

-   il s'agit de représenter les tables de notre BD sous forme d'objet avec les relations entre elles

## Générer et appliquer la base de données

### Création de la migration et appliquer la structure à la base de données.

-   npx prisma migrate dev --name init

### Générer le client Prisma à utiliser dans votre code.

-   Dans le fichier schema.prisma, remplacer la ligne du output par ceci : output = "../node_modules/.prisma/client"

-   npx prisma generate

# Modification du model

## créer un nouveau todo.js

## importer prismaClient

-   import { PrismaClient } from "@prisma/client";

## instancier prismaClient

-   const prisma = new PrismaClient();

## et modifier les methodes

## Viualiser la BD

-   npx prisma studio

# Base réelle : règles de sécurité

Ces règles s'appliquent à toute base qui contient des données à conserver (Azure, démo partagée, copie de la production). La procédure ci-dessus (`migrate dev`) ne vaut que pour une base locale jetable.

## Commandes interdites sur une base contenant des données

-   Jamais `npx prisma migrate dev` : en cas de dérive entre l'historique et la base, Prisma propose un reset complet (perte de toutes les données) et exige une base « shadow ».
-   Jamais `npx prisma migrate reset` : il supprime la base puis la recrée.
-   Jamais `npx prisma db push` : il modifie la base sans historique et peut supprimer des colonnes ou des tables.
-   Le README (étape 4 de l'installation) prescrit `npx prisma migrate dev --name init` : cette commande est à réserver à une base jetable ou vierge. Sur une base réelle, seul `npx prisma migrate deploy` est permis (il applique les migrations existantes, sans reset ni base shadow).

## Garde-fou base jetable

-   `npm run db:status` et `npm run db:deploy:jetable` passent d'abord par `scripts/garde-jetable.js`, qui refuse toute base non locale (hôte autre que `localhost`, `127.0.0.1` ou `(localdb)`) ou dont le nom ne contient pas `jetable`, `scratch` ou `test`.
-   Le garde-fou lit `DATABASE_URL` dans l'environnement du processus, pas dans `.env` : exporter la variable vers la base jetable avant de lancer ces scripts. Il n'affiche jamais l'URL ni le mot de passe.
-   Exemple d'URL pour un SQL Server local en authentification Windows (testé le 21 septembre 2026) : `sqlserver://localhost:1433;database=planify_test;integratedSecurity=true;trustServerCertificate=true`. Créer d'abord la base vide (`sqlcmd -S localhost -E -C -Q "CREATE DATABASE planify_test"`). La variable posée dans le processus l'emporte sur celle du `.env` : pour s'en assurer, viser une base inexistante (erreur `P1003` attendue).
-   Ces deux scripts ne servent donc jamais pour la base réelle. Pour elle, la commande `migrate deploy` se lance à la main, après sauvegarde et validation sur une base jetable.

## Migrations : immuables

-   Ne jamais modifier ni supprimer un dossier de `prisma/migrations` déjà appliqué quelque part : Prisma compare une somme de contrôle du fichier. Une correction est une nouvelle migration.
-   Retour arrière = nouvelle migration « avant », jamais un `DROP` manuel sur la base réelle. `prisma/rollbacks/socle_down.sql` est un outil manuel pour base jetable : Prisma ne l'exécute pas et il n'est pas déployé (voir `.deployignore`).
-   `.gitattributes` force les fins de ligne LF sur `prisma/migrations/**/*.sql`. Sans cela, avec `core.autocrlf=true`, un fichier extrait sous Windows (CRLF) a une somme de contrôle différente de celle de Linux.
-   La migration `socle_index_filtres` est écrite à la main : Prisma ne sait pas modéliser un index filtré ni un CHECK. Après tout `migrate diff` ou `migrate dev` sur une base jetable, relire le SQL produit : il ne doit contenir aucun `DROP INDEX` visant `Professeur_id_user_uq`, `Eleve_id_user_uq`, `Tuteur_id_user_uq` ou `Inscription_eleve_annee_active_uq`.

## Baseline d'une base réelle qui existe déjà

Si la base réelle existe déjà sans historique de migrations complet (créée par `db push` ou à la main : le schéma est en avance, l'application utilise déjà `User.etat`, que `init` ne crée pas), il faut un baseline. Sans lui, `migrate deploy` tenterait de rejouer `init`, puis `user_etat`, et échouerait sur des tables ou une colonne déjà présentes.

1.  Sauvegarder la base (BACKUP DATABASE) et vérifier que la restauration fonctionne.
2.  Rejouer toute la chaîne sur une base jetable : `npm run db:deploy:jetable`, puis `npm run db:status`.
3.  Sur la base réelle, comparer en lecture seule son état à `init` (8 tables) et vérifier la présence de `User.etat`.
4.  Marquer comme déjà appliquées les migrations dont l'effet existe déjà (commande manuelle, une seule fois ; elle ne touche qu'à la table `_prisma_migrations`) :
    -   `npx prisma migrate resolve --applied 20260331151525_init`
    -   `npx prisma migrate resolve --applied 20260920100000_user_etat` (uniquement si la colonne `User.etat` existe déjà)
5.  Lancer `npx prisma migrate deploy` : seules `socle_tables`, `socle_liens_nullables` et `socle_index_filtres` sont alors appliquées (uniquement additives : nouvelles tables, colonnes nullables, index).
6.  Vérifier avec `npx prisma migrate status`, puis tester l'application.

Les migrations ne sont pas déployées avec l'application (`prisma/migrations` figure dans `.deployignore`) et `startup.js` ne lance que `prisma generate` : elles s'appliquent depuis un poste ou un pipeline de confiance, jamais au démarrage du serveur.
