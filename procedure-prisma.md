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
