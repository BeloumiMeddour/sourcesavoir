// === EMPLOI DU TEMPS (PLANNER) - Vue semestre avec sélection ===

// Éléments du DOM - Will be initialized when page loads
var grid;
var labelSemaine;
var filtreSalle;
var filtreProf;
var filtreProgramme;

function initDOMElements() {
    grid = document.getElementById("planning-grid");
    labelSemaine = document.getElementById("label-semaine");
    filtreSalle = document.getElementById("filtre-salle");
    filtreProf = document.getElementById("filtre-prof");
    filtreProgramme = document.getElementById("filtre-programme");

    var btnPrec = document.getElementById("btn-prec");
    if (btnPrec) btnPrec.addEventListener("click", function () {
        var nouvelleSemaine = ajouterJours(semaineCourante, -7);
        if (semestreActif && dateDebutSemestre) {
            if (nouvelleSemaine < dateDebutSemestre) return;
        }
        semaineCourante = nouvelleSemaine;
        dessinerGrille();
    });

    var btnSuiv = document.getElementById("btn-suiv");
    if (btnSuiv) btnSuiv.addEventListener("click", function () {
        var nouvelleSemaine = ajouterJours(semaineCourante, 7);
        if (semestreActif && dateFinSemestre) {
            if (nouvelleSemaine > dateFinSemestre) return;
        }
        semaineCourante = nouvelleSemaine;
        dessinerGrille();
    });

    var btnAujourdhui = document.getElementById("btn-aujourdhui");
    if (btnAujourdhui) btnAujourdhui.addEventListener("click", function () {
        if (semestreActif && dateDebutSemestre) {
            semaineCourante = getDebutSemaine(dateDebutSemestre);
        } else {
            semaineCourante = getDebutSemaine(new Date());
        }
        dessinerGrille();
    });

    if (filtreSalle) filtreSalle.addEventListener("change", function () { dessinerGrille(); });
    if (filtreProgramme) filtreProgramme.addEventListener("change", function () { dessinerGrille(); });

    var btnReset = document.getElementById("btn-reset-filtres");
    if (btnReset) btnReset.addEventListener("click", function() {
        document.getElementById("select-semestre").value = "";
        if (filtreProgramme) filtreProgramme.innerHTML = '<option value="">Tous les programmes</option>';
        filtreProf.innerHTML = '<option value="">Tous les professeurs</option>';
        tousLesProfesseurs.forEach(function (p) {
            var opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.prenom + " " + p.nom;
            filtreProf.appendChild(opt);
        });
        filtreSalle.value = "";
        filtreProf.value = "";
        profActifId = null;
        disponibilitesProfActuel = [];
        semestreActif = null;
        dateDebutSemestre = null;
        dateFinSemestre = null;
        joursFeeries = [];
        semaineCourante = getDebutSemaine(new Date());
        dessinerGrille();
    });
}

// Jours de la semaine (lundi à dimanche)
var JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Jours en français complets pour les disponibilités
var JOURS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

// Conversion du jour en français vers l'indice du planner (0-6)
var JOUR_NOM_VERS_INDICE = {
    "Lundi": 0, "Mardi": 1, "Mercredi": 2, "Jeudi": 3,
    "Vendredi": 4, "Samedi": 5, "Dimanche": 6,
};

// Heures affichées (8h à 20h)
var HEURE_DEBUT = 8;
var HEURE_FIN = 20;

// Données
var affectations = [];
var semestres = [];
var joursFeeries = [];
var disponibilitesProfActuel = [];
var profActifId = null;
var semestreActif = null;
var semaineCourante = getDebutSemaine(new Date());
var dateDebutSemestre = null;
var dateFinSemestre = null;
var tousLesProfesseurs = [];  // Liste de tous les professeurs

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
        // Trier du plus récent au plus ancien (dateDebut décroissante)
        semestres.sort(function(a, b) {
            return new Date(b.dateDebut) - new Date(a.dateDebut);
        });
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
                var semestre = semestres.find(function(s) { return s.id === semestreActif; });
                if (semestre) {
                    dateDebutSemestre = new Date(semestre.dateDebut);
                    dateFinSemestre = new Date(semestre.dateFin);
                    semaineCourante = getDebutSemaine(dateDebutSemestre);
                }
                chargerJoursFeeries(semestreActif);
                mettreAJourFiltresProgramme();
                mettreAJourFiltresProfesseurs();
            } else {
                joursFeeries = [];
                dateDebutSemestre = null;
                dateFinSemestre = null;
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

// --- Charger les disponibilités d'un professeur ---

async function chargerDisponibilitesProfesseur(id_prof) {
    if (!id_prof) {
        disponibilitesProfActuel = [];
        return;
    }
    
    try {
        var res = await fetch("/api/disponibilites/professeur/" + id_prof);
        if (res.ok) {
            disponibilitesProfActuel = await res.json();
        } else {
            disponibilitesProfActuel = [];
        }
    } catch (error) {
        console.error("Erreur lors du chargement des disponibilités:", error);
        disponibilitesProfActuel = [];
    }
}

// Vérifier si une heure est dans la disponibilité d'un professeur pour un jour et heure donnés
function isDisponibleAuJour(jour, heure) {
    if (!profActifId || disponibilitesProfActuel.length === 0) return false;
    
    var indiceJourPlanner = JOUR_NOM_VERS_INDICE[jour]; // Convert jour name to planner index
    
    // Chercher les disponibilités du jour
    for (var i = 0; i < disponibilitesProfActuel.length; i++) {
        var dispo = disponibilitesProfActuel[i];
        
        // Chercher si le jour correspond
        var jourDispo = dispo.jour; // ex: "Lundi"
        var indiceDispoBrut = JOUR_NOM_VERS_INDICE[jourDispo];
        
        // Note: must convert from French day name (Lundi=1 in backend conventions) to planner index
        // We use the conversion map directly
        var indiceDispo = indiceDispoBrut;
        
        if (indiceDispo !== indiceJourPlanner) continue;
        
        // Vérifier si l'heure est dans la plage
        var plage = dispo.plageHoraire.split("-");
        var hDebut = parseInt(plage[0].split(":")[0]);
        var hFin = parseInt(plage[1].split(":")[0]);
        
        if (heure >= hDebut && heure < hFin) {
            return true;
        }
    }
    return false;
}

// Obtenir les plages de disponibilité fusionnées pour un jour donné
function getAvailabilityRangesForDay(jour) {
    if (!profActifId || disponibilitesProfActuel.length === 0) return [];
    
    var indiceJourPlanner = JOUR_NOM_VERS_INDICE[jour];
    var ranges = [];
    
    // Trouver toutes les disponibilités pour ce jour
    for (var i = 0; i < disponibilitesProfActuel.length; i++) {
        var dispo = disponibilitesProfActuel[i];
        var jourDispo = dispo.jour;
        var indiceDispoBrut = JOUR_NOM_VERS_INDICE[jourDispo];
        
        if (indiceDispoBrut !== indiceJourPlanner) continue;
        
        // Extraire les heures
        var plage = dispo.plageHoraire.split("-");
        var hDebut = parseInt(plage[0].split(":")[0]);
        var hFin = parseInt(plage[1].split(":")[0]);
        
        ranges.push({hStart: hDebut, hEnd: hFin});
    }
    
    // Fusionner les plages qui se chevauchent ou sont contigües
    if (ranges.length === 0) return [];
    
    ranges.sort(function(a, b) { return a.hStart - b.hStart; });
    
    var merged = [ranges[0]];
    for (var j = 1; j < ranges.length; j++) {
        var last = merged[merged.length - 1];
        var current = ranges[j];
        
        if (current.hStart <= last.hEnd) {
            // Chevauchement ou contigüité : fusionner
            last.hEnd = Math.max(last.hEnd, current.hEnd);
        } else {
            // Pas de chevauchement : ajouter comme nouveau bloc
            merged.push(current);
        }
    }
    
    return merged;
}

// --- Charger les filtres (salles et professeurs) ---

// --- Mettre à jour le filtre programme selon les affectations du semestre ---
function mettreAJourFiltresProgramme() {
    var programmesSet = {};
    var affFiltreesParSemestre = semestreActif
        ? affectations.filter(function(a) { return a.id_semestre == semestreActif; })
        : affectations;

    affFiltreesParSemestre.forEach(function(a) {
        if (a.cours && a.cours.programme) {
            programmesSet[a.cours.programme] = true;
        }
    });

    var valeurActuelle = filtreProgramme.value;
    filtreProgramme.innerHTML = '<option value="">Tous les programmes</option>';
    Object.keys(programmesSet).sort().forEach(function(prog) {
        var opt = document.createElement("option");
        opt.value = prog;
        opt.textContent = prog;
        if (prog === valeurActuelle) opt.selected = true;
        filtreProgramme.appendChild(opt);
    });
}

// --- Mettre à jour le filtre professeurs selon le semestre ---
function mettreAJourFiltresProfesseurs() {
    var profsSet = {};
    var affFiltreesParSemestre = semestreActif
        ? affectations.filter(function(a) { return a.id_semestre == semestreActif; })
        : affectations;

    affFiltreesParSemestre.forEach(function(a) {
        if (a.professeur) {
            profsSet[a.professeur.id] = a.professeur;
        }
    });

    var valeurActuelle = filtreProf.value;
    filtreProf.innerHTML = '<option value="">Tous les professeurs</option>';
    Object.keys(profsSet).forEach(function(id) {
        var prof = profsSet[id];
        var opt = document.createElement("option");
        opt.value = prof.id;
        opt.textContent = prof.prenom + " " + prof.nom;
        if (prof.id.toString() === valeurActuelle) opt.selected = true;
        filtreProf.appendChild(opt);
    });
}

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
        tousLesProfesseurs = await resProfs.json();
        
        // Charger les profs dans le select
        tousLesProfesseurs.forEach(function (p) {
            var opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.prenom + " " + p.nom;
            filtreProf.appendChild(opt);
        });
        
        // Ajouter listener pour le filtre prof
        filtreProf.addEventListener("change", async function () {
            profActifId = parseInt(filtreProf.value) || null;
            await chargerDisponibilitesProfesseur(profActifId);
            dessinerGrille();
        });
    } catch (error) {
        console.error("Erreur lors du chargement des filtres:", error);
    }
}

// --- Charger les affectations depuis l'API ---

async function chargerAffectations() {
    var res = await fetch("/api/affectations");
    affectations = await res.json();
    mettreAJourFiltresProgramme();
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

    // Filtrer par programme si sélectionné
    if (filtreProgramme && filtreProgramme.value) {
        result = result.filter(function (a) {
            return a.cours && a.cours.programme === filtreProgramme.value;
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

// --- Couleur unique par cours (basée sur le code) ---
function getCouleurCours(cours) {
    if (!cours) return "#94a3b8";
    var palette = [
        "#93c5fd", "#c4b5fd", "#fbcfe8", "#fed7aa",
        "#a7f3d0", "#fca5a5", "#a5f3fc", "#fdba74",
        "#c7d2fe", "#99f6e4", "#e9d5ff", "#d4fc79"
    ];
    var code = (cours.code || "") + (cours.programme || "");
    var hash = 0;
    for (var i = 0; i < code.length; i++) {
        hash = ((hash << 5) - hash) + code.charCodeAt(i);
        hash = hash & hash;
    }
    return palette[Math.abs(hash) % palette.length];
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

    // Date d'aujourd'hui pour le surlignage
    var aujourd_hui = formatDate(new Date());

    // En-têtes des jours (Lun 5, Mar 6, etc.)
    for (var j = 0; j < 7; j++) {
        var dateJour = ajouterJours(debut, j);
        var header = document.createElement("div");
        header.className = "planning-header";
        if (formatDate(dateJour) === aujourd_hui) {
            header.className += " planning-header-today";
        }
        header.textContent = JOURS[j] + " " + dateJour.getDate();

        // Colorer en gris les jours fériés
        if (isJourFerie(dateJour)) {
            header.style.backgroundColor = "#b0b0b0";
            header.style.color = "#eee";
        }
        grid.appendChild(header);
    }

    // Récupérer les affectations filtrées
    var affFiltrees = filtrerAffectations();

    // Générer les occurrences pour les affectations par jour
    var affAvecOccurrences = genererOccurrencesAffectations(affFiltrees);

    // Pré-calculer les blocs de disponibilité fusionnés par jour
    var availabilityBlocksByDay = {}; // {dayIndex: [{hStart, hEnd}, ...]}
    if (profActifId && disponibilitesProfActuel.length > 0) {
        for (var dayIdx = 0; dayIdx < 7; dayIdx++) {
            var jourFRName = JOURS_FR[dayIdx];
            var blocks = getAvailabilityRangesForDay(jourFRName);
            if (blocks.length > 0) {
                availabilityBlocksByDay[dayIdx] = blocks;
            }
        }
    }

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

            if (formatDate(dateJour) === aujourd_hui) {
                cell.classList.add("planning-cell-today");
            }

            // Afficher les jours fériés sur la première heure seulement (s'étend sur toute la journée)
            if (isJourFerie(dateJour)) {
                // Colorer la cellule en gris pour les jours fériés
                cell.style.backgroundColor = "#f0f0f0";

                if (h === HEURE_DEBUT) {
                    // Afficher le texte du jour férié uniquement à la première heure
                    var jourFerie = joursFeeries.find(function(jf) {
                        return formatDate(new Date(jf.date)) === dateJourStr;
                    });

                    var nbHeures = HEURE_FIN - HEURE_DEBUT;
                    var ferieEvent = document.createElement("div");
                    ferieEvent.className = "planning-event ferie";
                    ferieEvent.style.height = "calc(" + nbHeures + " * var(--cell-height) - 4px)";
                    ferieEvent.title = jourFerie ? jourFerie.description : "Jour férié";
                    ferieEvent.innerHTML =
                        '<span class="ferie-label">' +
                        (jourFerie ? jourFerie.description : "Jour férié") +
                        '</span>';

                    cell.appendChild(ferieEvent);
                }
            } else {
                // Jours normaux
                
                // Afficher la disponibilité du professeur en arrière-plan (blocs fusionnés)
                if (j in availabilityBlocksByDay) {
                    var dayBlocks = availabilityBlocksByDay[j];
                    dayBlocks.forEach(function(block) {
                        // Ajouter le bloc uniquement au début de la plage
                        if (h === block.hStart) {
                            var dureeHeures = block.hEnd - block.hStart;
                            var availBlock = document.createElement("div");
                            availBlock.className = "availability-block";
                            availBlock.style.height = "calc(" + dureeHeures + " * var(--cell-height) - 4px)";
                            cell.style.position = "relative";
                            cell.appendChild(availBlock);
                        }
                    });
                }

                // Chercher les affectations qui correspondent à ce jour et cette heure
                affAvecOccurrences.forEach(function (a) {
                    if (!a.date) return;
                    var dateAff = a.date.split("T")[0];
                    if (dateAff !== dateJourStr) return; // Pas ce jour

                    // Extraire les heures de début et fin de la plage
                    var plage = a.plageHoraire.split("-");
                    var hDebut = parseInt(plage[0].split(":")[0]);
                    var mDebut = parseInt(plage[0].split(":")[1]) || 0;
                    var hFin = parseInt(plage[1].split(":")[0]);
                    var mFin = parseInt(plage[1].split(":")[1]) || 0;

                    // Seulement dans la première cellule de l'événement
                    if (h !== hDebut) return;

                    // Calculer la durée en heures (inclus les minutes)
                    var dureeHeures = (hFin - hDebut) + (mFin - mDebut) / 60;
                    if (mFin === 0) {
                        // Si fin à heure pile (ex: 11:00), la durée est hFin - hDebut
                        dureeHeures = hFin - hDebut;
                    }
                    if (dureeHeures <= 0) return;

                    var couleur = getCouleurCours(a.cours);
                    var ev = document.createElement("div");
                    ev.className = "planning-event reservation";
                    ev.style.backgroundColor = couleur;
                    ev.style.height = "calc(" + dureeHeures + " * var(--cell-height) - 4px)";
                    ev.style.zIndex = "10";
                    ev.style.overflow = "hidden";

                    var nomProf = a.professeur ? (a.professeur.prenom[0] + ". " + a.professeur.nom) : "";
                    var codeSalle = a.salle ? a.salle.code : "";
                    var codeCours = a.cours ? a.cours.code : "";
                    var nomCours = a.cours ? a.cours.nom : "";
                    var jourSemaine = JOURS[j];
                    var horaire = a.plageHoraire;

                    // Tooltip au survol
                    ev.title = codeCours + " — " + nomCours + "\n" +
                        "Salle: " + codeSalle + "\n" +
                        (a.professeur ? "Prof: " + a.professeur.prenom + " " + a.professeur.nom : "") + "\n" +
                        "Horaire: " + a.plageHoraire;

                    ev.innerHTML =
                        '<div class="ev-code">' + codeCours + '</div>' +
                        (nomCours ? '<div class="ev-nom">' + nomCours + '</div>' : '') +
                        '<div class="ev-salle">' + codeSalle + '</div>' +
                        '<div class="ev-jour">' + jourSemaine + '</div>' +
                        '<div class="ev-horaire">' + horaire + '</div>' +
                        (nomProf ? '<div class="ev-prof">' + nomProf + '</div>' : '');

                    cell.style.overflow = "visible";
                    cell.style.zIndex = "5";
                    cell.style.position = "relative";

                    cell.appendChild(ev);
                });
            }

            grid.appendChild(cell);
        }
    }

    // Afficher le message vide si aucune affectation
    var emptyMsg = document.getElementById("planner-empty-msg");
    if (emptyMsg) {
        var affFiltrees = filtrerAffectations();
        emptyMsg.style.display = (affFiltrees.length === 0 && semestreActif) ? "" : "none";
    }
}

// --- Préparer l'en-tête avant impression/PDF ---
function preparerEnTete() {
    var semaine = document.getElementById("label-semaine").textContent;
    document.getElementById("print-semaine-label").textContent = semaine;

    var filtres = [];
    var prog = document.getElementById("filtre-programme");
    var prof = document.getElementById("filtre-prof");
    var salle = document.getElementById("filtre-salle");
    var sem = document.getElementById("select-semestre");

    if (sem && sem.options[sem.selectedIndex] && sem.value)
        filtres.push(sem.options[sem.selectedIndex].text.split("(")[0].trim());
    if (prog && prog.value) filtres.push("Programme : " + prog.value);
    if (prof && prof.value) filtres.push("Prof : " + prof.options[prof.selectedIndex].text);
    if (salle && salle.value) filtres.push("Salle : " + salle.options[salle.selectedIndex].text);

    document.getElementById("print-filtres-label").textContent = filtres.length ? filtres.join(" · ") : "";
    document.getElementById("print-date").textContent =
        "Imprimé le " + new Date().toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
}

// --- Impression (uniquement la grille) ---
function initImpression() {
    var btnImprimer = document.getElementById("btn-imprimer");
    if (!btnImprimer) return;
    btnImprimer.addEventListener("click", function () {
        preparerEnTete();
        document.body.classList.add("print-planner-only");
        window.addEventListener("afterprint", function handleAfterPrint() {
            document.body.classList.remove("print-planner-only");
            window.removeEventListener("afterprint", handleAfterPrint);
        }, { once: true });
        setTimeout(function() {
            if (document.body.classList.contains("print-planner-only")) {
                document.body.classList.remove("print-planner-only");
            }
        }, 2000);
        window.print();
    });
}

// --- Listener pour le filtre professeur (charger disponibilités) ---
// --- Démarrage ---
document.addEventListener('DOMContentLoaded', function() {
    initDOMElements();
    initImpression();
    chargerFiltres();
    chargerSemestres();
    chargerAffectations();
});
