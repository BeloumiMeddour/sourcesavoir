# Socle scolaire Les 3S

Reprise du 20 septembre 2026. Ce lot ajoute une API au projet Planify pour les
années, niveaux, groupes, élèves, tuteurs, liens familiaux et inscriptions.
Il ne comporte pas encore d'interface scolaire dans les pages Handlebars.

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

## Vérification sans base

```powershell
node node_modules/jest/bin/jest.js --runInBand --coverage=false
```

Les tests simulent Prisma. Ils vérifient les filtres, les contrôles HTTP,
la validation, les appels transactionnels et la conservation de l'historique.
Ils ne prouvent pas l'exécution des requêtes sur un vrai SQL Server.
Les migrations SQL (M0 à M3), le retour arrière `prisma/rollbacks/socle_down.sql`
et ses garde-fous ont été rejoués sur des bases scratch SQL Server LocalDB 15,
supprimées ensuite, avec des scripts de banc qui ne sont pas versionnés dans le
dépôt. Cette validation ne porte que sur le SQL : elle ne prouve pas le
comportement du client Prisma sur une vraie base.

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

## Recette restant à exécuter sur SQL Server TCP

1. Appliquer les migrations et le seed sur une base jetable accessible à Prisma.
2. Se connecter comme parent de la famille A : voir ses deux enfants et recevoir
   le même `404` pour un enfant de B et un identifiant inexistant.
3. Se connecter comme second tuteur : ne voir que l'enfant rattaché.
4. Se connecter comme élève : ne voir que sa propre fiche.
5. Créer l'année suivante et promouvoir un élève : retrouver les deux
   inscriptions, sans modification de l'ancienne.
6. Vérifier les refus SQL des doublons actifs et des groupes d'une autre année.

Les interfaces famille, les devoirs, remises et corrections appartiennent au
lot suivant. Les corrections générales encore signalées dans le diagnostic
(concurrence des réservations du planning, CSRF, limitation de connexion,
déploiement et réconciliation de la base réelle) restent des travaux distincts.
