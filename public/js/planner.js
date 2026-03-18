// === EMPLOI DU TEMPS (PLANNER) - Vue semestre avec sélection ===

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
var semestres = [];
var joursFeeries = [];
var semestreActif = null;
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

// Formater une date en "AAAA-MM-JJ" (sans conversion UTC - utilise heure locale)
function formatDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
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

// Vérifier si une date est un jour férié
function isJourFerie(date) {
    var dateStr = formatDate(date);
    return joursFeeries.some(function(jf) {
        return formatDate(new Date(jf.date)) === dateStr;
    });
}

// --- Charger les semestres ---

async function chargerSemestres() {
    try {
        var res = await fetch("/api/semestres");
        if (!res.ok) {
            console.error("Erreur API semestres:", res.status);
            return;
        }
        semestres = await res.json();
        console.log("Semestres chargés:", semestres);
        
        // Remplir le select existant
        var selectSemestre = document.getElementById("select-semestre");
        if (!selectSemestre) {
            console.error("Element select-semestre non trouvé dans le DOM");
            return;
        }
        
        semestres.forEach(function(s) {
            var opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.nom + " (" + formatDateFR(new Date(s.dateDebut)) + " - " + formatDateFR(new Date(s.dateFin)) + ")";
            selectSemestre.appendChild(opt);
        });
        
        // Event listener pour le changement de semestre
        selectSemestre.addEventListener("change", function() {
            semestreActif = parseInt(this.value) || null;
            if (semestreActif) {
                chargerJoursFeeries(semestreActif);
            } else {
                joursFeeries = [];
            }
            dessinerGrille();
        });
    } catch (error) {
        console.error("Erreur lors du chargement des semestres:", error);
    }
}

// --- Charger les jours fériés pour un semestre ---

async function chargerJoursFeeries(id_semestre) {
    try {
        var res = await fetch("/api/semestres/" + id_semestre + "/jours-feries");
        joursFeeries = await res.json();
    } catch (error) {
        console.error("Erreur lors du chargement des jours fériés:", error);
        joursFeeries = [];
    }
}

// --- Charger les filtres (salles et professeurs) ---

async function chargerFiltres() {
    try {
        var resSalles = await fetch("/api/salles");
        if (!resSalles.ok) return;
        var salles = await resSalles.json();
        salles.forEach(function (s) {
            var opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.code;
            filtreSalle.appendChild(opt);
        });

        var resProfs = await fetch("/api/professeurs");
        if (!resProfs.ok) return;
        var profs = await resProfs.json();
        profs.forEach(function (p) {
            var opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.prenom + " " + p.nom;
            filtreProf.appendChild(opt);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des filtres:", error);
    }
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

    // Filtrer par semestre si sélectionné
    if (semestreActif) {
        result = result.filter(function (a) {
            return a.id_semestre == semestreActif;
        });
    }

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

// --- Générer les occurrences d'affectations pour les affectations par jour ---

function genererOccurrencesAffectations(affectations) {
    if (!semestreActif) return affectations;

    var semestre = semestres.find(function(s) { return s.id === semestreActif; });
    if (!semestre) return affectations;

    var occurrences = [];

    affectations.forEach(function(aff) {
        if (aff.date) {
            // Affectation avec date spécifique - garder telle quelle
            occurrences.push(aff);
        } else if (aff.jour !== null && aff.jour !== undefined) {
            // Affectation par jour de la semaine - générer les occurrences
            var dateDebut = new Date(semestre.dateDebut);
            var dateFin = new Date(semestre.dateFin);
            var jourTemplate = aff.jour;

            var dateActuelle = new Date(dateDebut);
            while (dateActuelle <= dateFin) {
                var jourActuel = dateActuelle.getDay();
                var joursAAvancer = (jourTemplate - jourActuel + 7) % 7;

                if (joursAAvancer === 0) {
                    // C'est le bon jour
                    var dateOccurrence = new Date(dateActuelle);
                    var affCopy = {};
                    for (var key in aff) {
                        affCopy[key] = aff[key];
                    }
                    affCopy.date = dateOccurrence.toISOString();
                    occurrences.push(affCopy);
                }

                dateActuelle.setDate(dateActuelle.getDate() + 1);
            }
        }
    });

    return occurrences;
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
        
        // Colorer en gris les jours fériés
        if (isJourFerie(dateJour)) {
            header.style.backgroundColor = "#f0f0f0";
            header.style.color = "#999";
        }
        grid.appendChild(header);
    }

    // Récupérer les affectations filtrées
    var affFiltrees = filtrerAffectations();
    
    // Générer les occurrences pour les affectations par jour
    var affAvecOccurrences = genererOccurrencesAffectations(affFiltrees);

    // Parcourir chaque heure (8h, 9h, 10h... 19h)
    for (var h = HEURE_DEBUT; h < HEURE_FIN; h++) {

        // Colonne de l'heure
        var cellHeure = document.createElement("div");
        cellHeure.className = "planning-hour";
        cellHeure.textContent = h + "h";
        grid.appendChild(cellHeure);

        // 7 cellules pour les 7 jours
        for (var j = 0; j < 7; j++) {
            var dateJour = ajouterJours(debut, j);
            var dateJourStr = formatDate(dateJour);
            var cell = document.createElement("div");
            cell.className = "planning-cell";

            // Afficher les jours fériés sur la première heure seulement (s'étend sur toute la journée)
            if (isJourFerie(dateJour)) {
                // Colorer la cellule en gris pour les jours fériés
                cell.style.backgroundColor = "#f0f0f0";
                
                if (h === HEURE_DEBUT) {
                    // Afficher le texte du jour férié uniquement à la première heure
                    var jourFerie = joursFeeries.find(function(jf) {
                        return formatDate(new Date(jf.date)) === dateJourStr;
                    });
                    
                    var ferieEvent = document.createElement("div");
                    ferieEvent.className = "planning-event ferie";
                    ferieEvent.style.backgroundColor = "#e8e8e8";
                    ferieEvent.style.gridRow = "span " + (HEURE_FIN - HEURE_DEBUT);
                    ferieEvent.style.color = "#666";
                    ferieEvent.style.fontWeight = "bold";
                    ferieEvent.style.display = "flex";
                    ferieEvent.style.alignItems = "center";
                    ferieEvent.style.justifyContent = "center";
                    ferieEvent.style.textAlign = "center";
                    ferieEvent.style.padding = "10px";
                    ferieEvent.style.fontSize = "0.9rem";
                    ferieEvent.style.opacity = "0.8";
                    ferieEvent.title = jourFerie ? jourFerie.description : "Jour férié";
                    ferieEvent.innerHTML = "<div>" + (jourFerie ? jourFerie.description : "Jour férié") + "</div>";
                    
                    cell.appendChild(ferieEvent);
                }
            } else {
                // Jours normaux
                cell.style.backgroundColor = "white";

                // Chercher les affectations qui correspondent à ce jour et cette heure
                affAvecOccurrences.forEach(function (a) {
                    var dateAff = a.date.split("T")[0];
                    if (dateAff !== dateJourStr) return; // Pas ce jour

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
            }

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
chargerSemestres();
chargerAffectations();
