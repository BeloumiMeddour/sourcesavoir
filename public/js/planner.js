// === EMPLOI DU TEMPS (PLANNER) - Vue semaine simple ===

// Éléments du DOM
var grid = document.getElementById("planning-grid");
var labelSemaine = document.getElementById("label-semaine");
var filtreSalle = document.getElementById("filtre-salle");
var filtreProf = document.getElementById("filtre-prof");

// Jours de la semaine (lundi à dimanche)
var JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Heures affichées (8h à 20h)
var HEURE_DEBUT = 8;
var HEURE_FIN = 20;

// Données
var affectations = [];
var semaineCourante = getDebutSemaine(new Date());

// --- Fonctions utilitaires pour les dates ---

// Retourne le lundi de la semaine d'une date donnée
function getDebutSemaine(date) {
    var d = new Date(date);
    var jour = d.getDay(); // 0=dimanche, 1=lundi...
    var diff = d.getDate() - jour + (jour === 0 ? -6 : 1); // Reculer au lundi
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Formater une date en "AAAA-MM-JJ"
function formatDate(date) {
    return date.toISOString().split("T")[0];
}

// Formater une date en français (ex: "5 mars")
function formatDateFR(date) {
    return date.toLocaleDateString("fr-CA", { day: "numeric", month: "long" });
}

// Ajouter N jours à une date
function ajouterJours(date, n) {
    var d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

// --- Charger les filtres (salles et professeurs) ---

async function chargerFiltres() {
    // Charger les salles
    var resSalles = await fetch("/api/salles");
    var salles = await resSalles.json();
    salles.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.code;
        filtreSalle.appendChild(opt);
    });

    // Charger les professeurs
    var resProfs = await fetch("/api/professeurs");
    var profs = await resProfs.json();
    profs.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.prenom + " " + p.nom;
        filtreProf.appendChild(opt);
    });
}

// --- Charger les affectations depuis l'API ---

async function chargerAffectations() {
    var res = await fetch("/api/affectations");
    affectations = await res.json();
    dessinerGrille();
}

// --- Appliquer les filtres sur les affectations ---

function filtrerAffectations() {
    var result = affectations;

    // Filtrer par salle si sélectionnée
    if (filtreSalle.value) {
        result = result.filter(function (a) {
            return a.id_salle == filtreSalle.value;
        });
    }

    // Filtrer par professeur si sélectionné
    if (filtreProf.value) {
        result = result.filter(function (a) {
            return a.id_professeur == filtreProf.value;
        });
    }

    return result;
}

// --- Dessiner la grille de la semaine ---

function dessinerGrille() {
    grid.innerHTML = "";

    // Calculer les dates de début et fin de semaine
    var debut = new Date(semaineCourante);
    var fin = ajouterJours(debut, 6);

    // Mettre à jour le label de la semaine
    labelSemaine.textContent = formatDateFR(debut) + " – " + formatDateFR(fin) + " " + debut.getFullYear();

    // Configurer la grille : 1 colonne heures + 7 colonnes jours
    grid.style.gridTemplateColumns = "50px repeat(7, 1fr)";

    // Case vide en haut à gauche (coin)
    var coin = document.createElement("div");
    coin.className = "planning-header";
    coin.textContent = "";
    grid.appendChild(coin);

    // En-têtes des jours (Lun 5, Mar 6, etc.)
    for (var j = 0; j < 7; j++) {
        var dateJour = ajouterJours(debut, j);
        var header = document.createElement("div");
        header.className = "planning-header";
        header.textContent = JOURS[j] + " " + dateJour.getDate();
        grid.appendChild(header);
    }

    // Récupérer les affectations filtrées
    var affFiltrees = filtrerAffectations();

    // Parcourir chaque heure (8h, 9h, 10h... 19h)
    for (var h = HEURE_DEBUT; h < HEURE_FIN; h++) {

        // Colonne de l'heure
        var cellHeure = document.createElement("div");
        cellHeure.className = "planning-hour";
        cellHeure.textContent = h + "h";
        grid.appendChild(cellHeure);

        // 7 cellules pour les 7 jours
        for (var j = 0; j < 7; j++) {
            var dateJour = formatDate(ajouterJours(debut, j));
            var cell = document.createElement("div");
            cell.className = "planning-cell";

            // Chercher les affectations qui correspondent à ce jour et cette heure
            affFiltrees.forEach(function (a) {
                var dateAff = a.date.split("T")[0];
                if (dateAff !== dateJour) return; // Pas ce jour

                // Extraire les heures de début et fin de la plage
                var plage = a.plageHoraire.split("-");
                var hDebut = parseInt(plage[0].split(":")[0]);
                var hFin = parseInt(plage[1].split(":")[0]);
                var mFin = parseInt(plage[1].split(":")[1]) || 0;

                // La dernière heure affichée : si fin à 10:00 pile, on montre 9h, pas 10h
                var dernierH = mFin > 0 ? hFin : hFin - 1;

                // Si l'heure courante est dans la plage de l'affectation
                if (h >= hDebut && h <= dernierH) {
                    var ev = document.createElement("div");
                    ev.className = "planning-event reservation";

                    // Tooltip au survol
                    ev.title = (a.cours ? a.cours.code : "") + " – " +
                        (a.salle ? a.salle.code : "") +
                        (a.professeur ? "\n" + a.professeur.prenom + " " + a.professeur.nom : "");

                    // Afficher le texte seulement dans la première heure
                    if (h === hDebut) {
                        ev.innerHTML =
                            "<strong>" + (a.cours ? a.cours.code : "") + "</strong> – " +
                            (a.salle ? a.salle.code : "") +
                            (a.professeur ? "<br>" + a.professeur.prenom[0] + ". " + a.professeur.nom : "");
                    }

                    cell.appendChild(ev);
                }
            });

            grid.appendChild(cell);
        }
    }
}

// --- Navigation : semaine précédente / suivante ---

document.getElementById("btn-prec").addEventListener("click", function () {
    semaineCourante = ajouterJours(semaineCourante, -7);
    dessinerGrille();
});

document.getElementById("btn-suiv").addEventListener("click", function () {
    semaineCourante = ajouterJours(semaineCourante, 7);
    dessinerGrille();
});

document.getElementById("btn-aujourdhui").addEventListener("click", function () {
    semaineCourante = getDebutSemaine(new Date());
    dessinerGrille();
});

// --- Filtres ---
filtreSalle.addEventListener("change", function () { dessinerGrille(); });
filtreProf.addEventListener("change", function () { dessinerGrille(); });

// --- Export / Impression ---
document.getElementById("btn-exporter").addEventListener("click", function () {
    window.print();
});

// --- Démarrage ---
chargerFiltres();
chargerAffectations();
