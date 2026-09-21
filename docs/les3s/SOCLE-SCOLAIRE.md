# Socle scolaire Les 3S

Reprise du 20 septembre 2026. Ce lot ajoute une API au projet Planify pour les
années, niveaux, groupes, élèves, tuteurs, liens familiaux et inscriptions.
Seule la page Élèves existe comme interface scolaire (voir « Interface »).

## Accès

Les routes sont montées sur `/api/scolaire`, après Passport et la garde des
routes héritées. Le rôle vient de `req.user`, rechargé à chaque requête, et le
compte doit être validé. Le rôle historique `user` n'a aucun accès à cette API.
Ses droits sur le planning hérité restent ceux de la phase A déjà engagée.

| Opération | admin / responsable | enseignant | parent | eleve |
| --- | --- | --- | --- | --- |
| Lire les élèves | Tous | Élèves inscrits (active) dans un groupe de l'année en cours qui lui est affecté | Enfants liés avec lien actif et `peutLire` | Sa propre fiche |
| Lire les inscriptions d'un élève | Historique complet | Seulement les inscriptions actives de ses groupes de l'année en cours (voir ci-dessous) | Historique complet des enfants liés | Historique complet de sa fiche |
| Créer élèves, tuteurs et liens | Oui | Non | Non | Non |
| Modifier ou révoquer un lien | Oui | Non | Non | Non |
| Créer une inscription ou promouvoir | Oui | Non | Non | Non |
| Lire années, niveaux et groupes | Oui | Oui | Non | Non |
| Créer années, niveaux et groupes | Oui | Non | Non | Non |

`responsable` désigne le rôle de gestion hérité ; la personne responsable
d'un enfant est un `Tuteur`, éventuellement rattaché à un compte `parent`.
Un lien porte trois indicateurs : `actif`, `peutLire` et `peutAgir`. Agir
suppose de pouvoir lire : `peutAgir: true` avec `peutLire: false` est refusé
(`400`) à la création comme à la modification, et `peutAgirPourEleve` exige un
lien actif avec `peutLire` ET `peutAgir`. Cette règle est appliquée par le code,
pas par une contrainte SQL : des lignes écrites hors de l'API ne la respectent
pas forcément, d'où la condition supplémentaire dans `peutAgirPourEleve`. Ce lot
n'offre pas encore de route d'action parent : `peutAgirPourEleve` prépare les
futurs parcours.

Révoquer un lien consiste à le passer à `actif: false` (`PATCH`), sans le
supprimer : le parent perd immédiatement la lecture de l'enfant, la ligne reste
dans l'historique, et un doublon `POST` pour le même couple élève-tuteur donne
toujours `409` (on réactive le lien existant avec `actif: true`).

Un enseignant lit l'élève dès qu'il a une inscription active dans un groupe de
l'année en cours qui lui est affecté. Sur `GET /eleves/:id/inscriptions`, il ne
reçoit que ces inscriptions-là : ni les autres années, ni les autres groupes,
ni les inscriptions terminées ou annulées de l'élève. Le filtre dérive du même
générateur que la liste et le détail (`filtreInscriptionsVisibles`,
`model/acces.js`). Auparavant, l'enseignant recevait tout l'historique de l'élève
dès qu'il pouvait lire sa fiche.

## API

Les créations répondent `201`. Les listes et détails répondent `200` en JSON.
Les identifiants du corps JSON sont des nombres entiers positifs ; ceux des URL
sont des chiffres décimaux. Les dates sont des chaînes `AAAA-MM-JJ`.
Les champs acceptés sont strictement limités, sans opérations Prisma imbriquées.

| Méthode et chemin relatif | Champs du corps / résultat |
| --- | --- |
| `GET /eleves` | Liste filtrée : id, matricule, nom, prenom, dateNaissance |
| `GET /eleves/:id` | Même sélection pour un élève accessible |
| `GET /eleves/:id/inscriptions` | Historique de cet élève, groupe et année |
| `POST /eleves` | matricule, nom, prenom ; dateNaissance et id_user facultatifs |
| `POST /tuteurs` | nom, prenom ; courriel, telephone et id_user facultatifs |
| `POST /eleves/:id/liens` | id_tuteur, parente ; peutLire (défaut true), peutAgir (défaut false) et actif (défaut true) facultatifs |
| `PATCH /eleves/:id/liens/:idLien` | actif, peutLire, peutAgir, au moins un, booléens stricts ; répond `200` avec le lien |
| `POST /inscriptions` | id_eleve, id_annee, id_groupe ; statut facultatif |
| `POST /eleves/:id/promotion` | id_annee, id_groupe |
| `GET /annees`, `POST /annees` | Création : libelle, dateDebut, dateFin |
| `GET /niveaux`, `POST /niveaux` | Création : code, libelle, ordre |
| `GET /groupes`, `POST /groupes` | Création : code, id_annee, id_niveau ; capacite facultative |

Exemple de création d'élève :

```json
{"matricule":"E-2026-001","nom":"Exemple","prenom":"Lina","dateNaissance":"2014-04-12"}
```

`id_user` (élève ou tuteur) doit désigner un compte existant : de rôle `eleve`
pour une fiche élève, de rôle `parent` pour un tuteur, sinon `400`. Un compte
déjà rattaché à une autre fiche de la même table donne `409` (l'index filtré SQL
reste le dernier garde-fou contre deux créations simultanées). L'état du compte
(`valide` ou `en_attente`) n'est pas contrôlé.

`PATCH` n'accepte que `actif`, `peutLire` et `peutAgir` ; tout autre champ, un
booléen non strict ou un corps sans champ donne `400`. Il refuse aussi un
résultat où `peutAgir` serait vrai sans `peutLire` (retirer `peutAgir` avant
`peutLire`). Un lien inexistant, d'un autre élève, ou dont un identifiant du
chemin est invalide donne `404` (`{"error":"Lien introuvable."}` pour le lien).
Les droits lus servent de condition à l'écriture : un lien modifié entre-temps
donne `409` plutôt que d'être écrasé.

Les erreurs répondent sous la forme `{"error":"…"}` : `401` sans session,
`403` pour un rôle ou état refusé, `400` pour les données invalides, `409` pour
une unicité, une référence ou un conflit refusés, `413` pour un corps trop
volumineux, `415` pour un encodage ou un jeu de caractères de corps non pris
en charge (le message est générique et ne recopie rien de la requête), et `500`
générique pour un incident interne. Un JSON malformé donne `400`. Un élève
absent, inaccessible ou dont l'identifiant est invalide donne le même `404` :
`{"error":"Élève introuvable."}`. Le modèle réapplique le filtre lors de la
lecture, même après la garde, pour couvrir une révocation du lien entre les
deux requêtes.

## Interface

La page `/eleves` (menu « Gestion des Élèves ») liste les élèves et permet d'en
créer un (matricule, nom, prénom, date de naissance facultative) à partir de
`GET` et `POST /api/scolaire/eleves`. Elle est réservée aux rôles `admin` et
`responsable` dont le compte est validé : les autres rôles reçoivent `403`, un
visiteur non connecté est redirigé vers `/connexion`. Le lien du menu n'est
qu'un confort d'affichage (`exposerDroitsVues`) : la route de la page et l'API
vérifient chacune les droits. Les données de l'API sont échappées avant d'entrer
dans le HTML (`public/js/rendu.js`).

La page `/structure` (menu « Années et Groupes »), mêmes rôles et mêmes règles,
liste et crée les années scolaires, les niveaux et les groupes (un groupe choisit
une année et un niveau existants) via `GET` et `POST` sur `/api/scolaire/annees`,
`/niveaux` et `/groupes`.

Ce que ces pages ne font pas encore : modifier ou supprimer (l'API n'offre que la
lecture et la création), gérer les inscriptions et les liens familiaux, et les
vues enseignant, parent et élève.

Base réelle : ces pages lisent les tables du socle. Tant que les migrations M0 à M3
ne sont pas appliquées à la base réelle, les pages s'ouvrent mais les appels de
l'API répondent `500` (code Prisma `P2021`, table absente). Ce constat a été fait
le 21 septembre 2026 sur la base réelle, en lecture seule. L'application des
migrations suit `procedure-prisma.md`.

## Historique et intégrité

La promotion crée une nouvelle inscription dans une transaction sérialisable.
L'année cible doit commencer après la dernière année inscrite ; le groupe doit
appartenir à cette année. L'ancienne inscription et le planning restent intacts.
Un conflit de sérialisation (code Prisma `P2034`) rejoue la transaction en
entier, historique relu, trois exécutions au plus ; si le conflit persiste, la
réponse est un `409` invitant à réessayer. Les autres erreurs ne sont pas rejouées.

La migration M0 (`20260920100000_user_etat`) ajoute `User.etat`. Les comptes
déjà présents sont antérieurs à la validation des comptes : ils reçoivent
`valide`, sinon les administrateurs eux-mêmes seraient bloqués. Le défaut
définitif de la colonne est ensuite `en_attente` (nom de contrainte
`User_etat_df`, celui que Prisma attend) : les comptes créés après M0 restent
en attente de validation.

Les migrations déjà préparées ajoutent les sept tables et trois rattachements
nullables aux tables existantes. Une clé étrangère composite garantit que le
groupe et l'inscription portent la même année. Les index SQL Server filtrés
imposent une seule inscription active par élève et année, et un seul profil par
compte dans chacune des tables Eleve, Tuteur et Professeur, tout en acceptant
plusieurs profils sans compte. Les nouvelles relations utilisent `NO ACTION`.

Les anciens formulaires n'écrivent pas encore les rattachements
`Professeur.id_user`, `AffectationCours.id_groupe` et `Semestre.id_annee`.
La visibilité enseignant nécessite que ces données de rattachement existent ;
aucun rapprochement automatique des anciennes données n'est réalisé.

## Protections de l'entrée

`middleware/entree.js`, appelé par `server.js` avant les routes, active trois
protections :

- **CSRF** (`gardeCsrf`) sur `POST`, `PUT`, `PATCH` et `DELETE` : un en-tête
  `Origin` doit désigner l'hôte de la requête ; sans `Origin`, la requête doit
  être en JSON ou porter `X-Requested-With` ou `X-Nom-Fichier`. Le cookie de
  session est `httpOnly` et `SameSite=Lax`.
- **Limitation des connexions** sur `POST /connexion` : par adresse IP et par
  courriel normalisé (casse et espaces ignorés).
- **Limitation des inscriptions** sur `POST /inscription` : par adresse IP.

La garde CSRF passe avant les limiteurs, pour qu'une requête venue d'un autre
site ne consomme pas les tentatives d'un courriel. Les compteurs sont en
mémoire : ils repartent à zéro au redémarrage et ne sont pas partagés entre
plusieurs instances du serveur.

| Variable | Rôle | Défaut |
| --- | --- | --- |
| `TRUST_PROXY` | Nombre de mandataires crus pour lire l'adresse IP (0 à 10, un nombre seulement) | 1 si `WEBSITE_SITE_NAME` existe (Azure App Service), sinon 0 |
| `ORIGINES_AUTORISEES` | Hôtes supplémentaires acceptés dans `Origin`, séparés par des virgules | vide |
| `LIMITE_FENETRE_SECONDES` | Durée de la fenêtre glissante | 900 |
| `LIMITE_CONNEXION_IP_MAX` | Tentatives de connexion par IP dans la fenêtre | 30 |
| `LIMITE_CONNEXION_COURRIEL_MAX` | Tentatives de connexion par courriel | 10 |
| `LIMITE_INSCRIPTION_IP_MAX` | Inscriptions par IP | 10 |

Point d'attention au déploiement : sans `TRUST_PROXY` correct derrière un
mandataire, `req.ip` est l'adresse du mandataire et tous les visiteurs
partagent le même plafond par IP. Ce défaut est couvert sur Azure App Service
par `WEBSITE_SITE_NAME` ; ailleurs, régler `TRUST_PROXY` au nombre de mandataires
placés devant l'application. Une valeur non numérique (par exemple `true`) est
ignorée, car elle ferait croire n'importe quel `X-Forwarded-For`.

Ces protections sont vérifiées par `__tests__/integration/entree.integration.test.js`
(application Express réelle, sans base de données). Elles ne remplacent pas un
contrôle sur l'environnement déployé : le comportement derrière Azure n'a pas
été observé.

## Vérification sans base

```powershell
node node_modules/jest/bin/jest.js --runInBand --coverage=false
```

Les tests simulent Prisma. Ils vérifient les filtres, les contrôles HTTP,
la validation, les appels transactionnels et la conservation de l'historique.
Ils ne prouvent pas, à eux seuls, l'exécution des requêtes sur un vrai SQL Server :
c'est le rôle de la recette décrite plus bas.
Les migrations SQL (M0 à M3), le retour arrière `prisma/rollbacks/socle_down.sql`
et ses garde-fous ont été rejoués sur des bases scratch SQL Server LocalDB 15,
supprimées ensuite, avec des scripts de banc qui ne sont pas versionnés dans le
dépôt.

Le retour arrière n'annule pas M0 (`User.etat` est utilisé par l'application).
Il refuse de s'exécuter s'il reste des données du socle, sauf si `@forcer` est
mis à 1 ; avec `@forcer = 1`, il refuse en outre toute base dont le nom
(`DB_NAME()`) n'a pas de segment exactement égal à `jetable`, `scratch` ou
`test` (segments séparés par `_`, `-` ou `.`), avant de toucher aux tables ou à
`_prisma_migrations`.

## Jeu fictif sur base jetable

`scripts/seed-scolaire.js` prépare deux familles, dont une avec deux enfants,
un second tuteur lié à un seul enfant, les comptes de recette et leurs
inscriptions. Les adresses utilisent le domaine réservé `example.invalid`.
Une nouvelle exécution réutilise les données fictives compatibles sans
réinitialiser les mots de passe. Une collision incompatible entraîne un refus.

Le script exige une URL SQL Server locale et un mot de passe de recette dans
`SEED_SCOLAIRE_PASSWORD` (12 caractères minimum, avec majuscule, minuscule,
chiffre et symbole). Il lit les variables du processus, sans charger `.env`.
Le contrôle de la cible (`scripts/garde-jetable.js`, aussi utilisé par
`npm run db:garde`) est le suivant :

- hôte comparé tel quel, casse ignorée, à `localhost`, `127.0.0.1` ou
  `(localdb)` ; un espace ou une tabulation dans l'hôte, un port non numérique
  ou une instance mal formée sont refusés ;
- le nom de base est découpé sur `_`, `-` et `.` : un segment doit être
  exactement `jetable`, `scratch` ou `test` (`planify_test` passe ; `latest`,
  `contest` et `attestation_prod` sont refusés) ;
- une URL contenant plusieurs propriétés `database` (ou `initial catalog`) est
  refusée, car la base visée serait ambiguë.

Une version antérieure de ce contrôle cherchait ces trois mots comme simples
sous-chaînes du nom de base, ce qui acceptait par exemple `latest`. Le script
crée ensuite le client Prisma en lui passant explicitement l'URL contrôlée ; il
n'ouvre pas `.env` lui-même, mais son en-tête signale que Prisma peut lire ce
fichier à l'import (comportement non vérifié dans ce lot). Pour l'exécuter,
après migrations sur la base jetable :

```powershell
# Définir DATABASE_URL pour la base jetable et SEED_SCOLAIRE_PASSWORD
# dans l'environnement de cette session, sans les inscrire dans le dépôt.
node scripts/seed-scolaire.js
```

Ce seed n'est pas exécuté pendant les tests et ne sert jamais à alimenter la
base réelle. La procédure des migrations et du baseline est décrite dans
[procedure-prisma.md](../../procedure-prisma.md).

## Recette sur SQL Server TCP (exécutée le 21 septembre 2026)

Exécutée sur une base jetable `planify_test` d'un SQL Server 2022 local
(authentification Windows, TCP 1433), avec Prisma 6.19 et le serveur réel de
l'application. La base réelle n'a pas été touchée. Résultat : 42 vérifications,
0 échec, aucune erreur côté serveur.

1. Les cinq migrations s'appliquent avec `npm run db:deploy:jetable` ; le garde-fou
   passe, puis `npm run db:status` indique que le schéma est à jour. La variable
   `DATABASE_URL` posée dans le processus l'emporte sur celle du `.env` (vérifié
   en visant une base inexistante, qui provoque l'erreur `P1003`).
2. Parent de la famille A : voit ses deux enfants, reçoit le même `404` pour un
   enfant de B et pour un identifiant inexistant, `403` sur les années, la
   création d'élève, les pages de gestion et l'ancienne API des salles.
3. Second tuteur : ne voit que l'enfant rattaché.
4. Élève : ne voit que sa propre fiche, `404` sur celle d'un autre.
5. Année suivante et promotion : les deux inscriptions sont retrouvées, l'ancienne
   n'est pas modifiée ; une seconde promotion dans la même année est refusée.
6. Refus SQL : matricule, code de niveau et groupe en double (`409`), deuxième
   inscription active d'un élève dans l'année (`409`), groupe d'une autre année
   que l'inscription (`400`).
7. Administrateur : pages `/eleves` et `/structure`, lectures, créations et
   validations (champ non autorisé, matricule vide, dates inversées).

Le script de recette n'est pas versionné : il crée des données de test et ne doit
jamais viser un serveur branché sur la base réelle. La base réelle, elle, n'a
toujours pas les tables du socle (voir « Interface »).

Les interfaces famille, les devoirs, remises et corrections appartiennent au
lot suivant. Les corrections générales encore signalées dans le diagnostic
(concurrence des réservations du planning, déploiement et réconciliation de la
base réelle) restent des travaux distincts.
