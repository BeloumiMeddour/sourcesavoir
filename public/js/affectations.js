// === GESTION DES AFFECTATIONS ===

import { afficherMessage, activerTriTableau } from './utils.js';

// Convertit un jour (nombre "1", ou nom "Lundi") en indice backend (0=Dim, 1=Lun, ...)
function normaliserJour(jour) {
    if (jour === null || jour === undefined) return null;
    var n = parseInt(jour);
    if (!isNaN(n)) return n;
    var noms = { "Dimanche": 0, "Lundi": 1, "Mardi": 2, "Mercredi": 3, "Jeudi": 4, "Vendredi": 5, "Samedi": 6 };
    return (jour in noms) ? noms[jour] : null;
}

var formAffectation;
var msgAffectation;
var tbody;
var selectSemestre;
var selectCours;
var selectSalle;
var selectProfesseur;
var selectJour;
var selectHeureDebut;
var selectHeureFin;
var selectProgramme;
var tousLesCours = [];        // Cache de tous les cours
var tousLesProfesseurs = [];  // Cache de tous les professeurs

// Cache des affectations
var toutesAffectations = [];
var filtresTable = { semestre: "", programme: "", prof: "", jour: "" };
var filtresAppliques = false; // La liste ne s'affiche qu'après un premier filtre

function initDOMElements() {
    formAffectation = document.getElementById("form-affectation");
    msgAffectation = document.getElementById("msg-affectation");
    tbody = document.querySelector("#table-affectations tbody");
    selectSemestre = document.getElementById("id_semestre");
    selectCours = document.getElementById("id_cours");
    selectSalle = document.getElementById("id_salle");
    selectProfesseur = document.getElementById("id_professeur");
    selectJour = document.getElementById("jour");
    selectHeureDebut = document.getElementById("heureDebut");
    selectHeureFin = document.getElementById("heureFin");
    selectProgramme = document.getElementById("id_programme");
    if (formAffectation) {
        formAffectation.addEventListener("submit", onFormAffectationSubmit);
    }
    var modAnnuler = document.getElementById("mod-annuler");
    if (modAnnuler) modAnnuler.onclick = fermerModaleAffectation;
    var modaleModifier = document.getElementById("modale-modifier");
    if (modaleModifier) modaleModifier.addEventListener("click", function (e) {
        if (e.target === this) fermerModaleAffectation();
    });

    if (selectProfesseur) {
        selectProfesseur.addEventListener("change", function() {
            afficherDisponibleProf(selectProfesseur.value);
        });
    }
    if (selectSalle) {
        selectSalle.addEventListener("change", afficherDisponibiliteSalle);
    }

    var filtreSemestre = document.getElementById("filtre-semestre");
    var filtreProgramme = document.getElementById("filtre-programme");
    var filtreProf = document.getElementById("filtre-prof");
    var filtreJour = document.getElementById("filtre-jour");
    var btnReset = document.getElementById("btn-reset-filtres");

    if (filtreSemestre) filtreSemestre.addEventListener("change", function() { filtresTable.semestre = this.value; filtresAppliques = true; afficherAffectationsFiltrées(); });
    if (filtreProgramme) filtreProgramme.addEventListener("change", function() { filtresTable.programme = this.value; filtresAppliques = true; afficherAffectationsFiltrées(); });
    if (filtreProf) filtreProf.addEventListener("change", function() { filtresTable.prof = this.value; filtresAppliques = true; afficherAffectationsFiltrées(); });
    if (filtreJour) filtreJour.addEventListener("change", function() { filtresTable.jour = this.value; filtresAppliques = true; afficherAffectationsFiltrées(); });
    if (btnReset) btnReset.addEventListener("click", function() {
        filtresTable = { semestre: "", programme: "", prof: "", jour: "" };
        filtresAppliques = false;
        if (filtreSemestre) filtreSemestre.value = "";
        if (filtreProgramme) filtreProgramme.value = "";
        if (filtreProf) filtreProf.value = "";
        if (filtreJour) filtreJour.value = "";
        afficherAffectationsFiltrées();
    });

    activerTriTableau("table-affectations");
}

// --- Charger les cours dans le menu déroulant ---
async function chargerSelectCours() {
    var response = await fetch("/api/cours");
    tousLesCours = await response.json();
    filtrerCoursProgramme();
}

function filtrerCoursProgramme() {
    var programme = selectProgramme ? selectProgramme.value : "";
    var coursFiltres = programme
        ? tousLesCours.filter(function(c) { return c.programme === programme; })
        : tousLesCours;

    selectCours.innerHTML = '<option value="">-- Choisir un cours --</option>';
    coursFiltres.forEach(function (c) {
        var option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.code + " - " + c.nom;
        selectCours.appendChild(option);
    });
}

async function chargerSelectProgrammes() {
    var response = await fetch("/api/cours");
    var cours = await response.json();
    var programmes = [...new Set(cours.map(c => c.programme).filter(Boolean))].sort();

    // Ajouter aussi les programmes des professeurs
    var responseProfesseurs = await fetch("/api/professeurs");
    var professeurs = await responseProfesseurs.json();
    var programmesProfesseurs = professeurs.map(p => p.programme).filter(Boolean);
    programmes = [...new Set([...programmes, ...programmesProfesseurs])].sort();

    if (selectProgramme) {
        selectProgramme.innerHTML = '<option value="">-- Tous les programmes --</option>';
        programmes.forEach(function(p) {
            var opt = document.createElement("option");
            opt.value = p;
            opt.textContent = p;
            selectProgramme.appendChild(opt);
        });
    }
}

// --- Charger les semestres dans le menu déroulant ---
async function chargerSelectSemestres() {
    var response = await fetch("/api/semestres");
    var semestres = await response.json();

    selectSemestre.innerHTML = '<option value="">-- Choisir un semestre --</option>';
    semestres.forEach(function (s) {
        var option = document.createElement("option");
        option.value = s.id;
        var dateDebut = new Date(s.dateDebut).toLocaleDateString("fr-CA");
        var dateFin = new Date(s.dateFin).toLocaleDateString("fr-CA");
        option.textContent = s.nom + " (" + dateDebut + " - " + dateFin + ")";
        selectSemestre.appendChild(option);
    });
}

// --- Charger les professeurs dans le menu déroulant (initial) ---
async function chargerSelectProfesseurs() {
    try {
        var response = await fetch("/api/professeurs");
        tousLesProfesseurs = await response.json();
        filtrerProfsProgramme();
    } catch (error) {
        console.error("Erreur lors du chargement des professeurs:", error);
    }
}

// --- Charger les salles dans le menu déroulant ---
async function chargerSelectSalles() {
    var response = await fetch("/api/salles");
    var salles = await response.json();

    selectSalle.innerHTML = '<option value="">-- Choisir une salle --</option>';
    salles.forEach(function (s) {
        var option = document.createElement("option");
        option.value = s.id;
        option.textContent = s.code + " (" + s.type + ")";
        selectSalle.appendChild(option);
    });
}



// --- Filtrer la liste des profs par programme du cours sélectionné ---
function filtrerProfsProgramme() {
    var coursId = selectCours.value;
    var cours = tousLesCours.find(function(c) { return c.id == coursId; });
    var programme = cours ? cours.programme : (selectProgramme ? selectProgramme.value : "");

    var profsFiltres = programme
        ? tousLesProfesseurs.filter(function(p) { return p.programme === programme; })
        : tousLesProfesseurs;

    var valeurActuelle = selectProfesseur.value;
    selectProfesseur.innerHTML = '<option value="">-- Choisir un professeur --</option>';
    profsFiltres.forEach(function(p) {
        var opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.prenom + " " + p.nom;
        if (p.id.toString() === valeurActuelle) opt.selected = true;
        selectProfesseur.appendChild(opt);
    });
}

// --- Afficher la disponibilité de la salle sélectionnée ---
async function afficherDisponibiliteSalle() {
    var panel = document.getElementById("availability-panel-salle");
    var idSalle = selectSalle.value;
    
    if (!idSalle) {
        panel.innerHTML = '<p class="info-text">Sélectionnez une salle pour voir sa disponibilité</p>';
        return;
    }

    var idSemestre = selectSemestre.value;
    if (!idSemestre) {
        panel.innerHTML = '<p class="info-text">Sélectionnez un semestre d\'abord</p>';
        return;
    }

    try {
        // Récupérer les affectations de la salle
        var res = await fetch("/api/affectations/salle/" + idSalle);
        if (!res.ok) throw new Error("Erreur API: " + res.status);
        var affectations = await res.json();
        
        console.log("Affectations salle reçues:", affectations);
        
        // Filtrer pour ce semestre uniquement
        affectations = affectations.filter(function(a) { return a.id_semestre == idSemestre; });
        
        console.log("Affectations filtrées:", affectations);

        // Créer une grille horaire 8h-17h avec les 7 jours
        var jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
        var backendJourIndices = [1, 2, 3, 4, 5, 6, 0]; // backend 0=Dim, 1=Lun
        var course_map = {};

        // Initialiser la map des cours
        for (var h = 8; h < 22; h++) {
            course_map[h] = {};
            for (var d = 0; d < 7; d++) {
                course_map[h][d] = null;
            }
        }

        // Remplir avec les affectations
        affectations.forEach(function(a) {
            if (a.jour !== null && a.jour !== undefined) {
                var jour = normaliserJour(a.jour);
                if (jour === null) return;
                var displayIdx = backendJourIndices.indexOf(jour);
                
                if (a.plageHoraire) {
                    var plage = a.plageHoraire.split("-");
                    var debut = parseInt(plage[0].split(":")[0]);
                    var fin = parseInt(plage[1].split(":")[0]);
                    
                    for (var h = debut; h < fin; h++) {
                        if (h >= 8 && h < 22) {
                            if (!course_map[h][displayIdx]) {
                                course_map[h][displayIdx] = {
                                    code: (a.cours && a.cours.code) ? a.cours.code : "???",
                                    debut: debut,
                                    fin: fin,
                                    isStart: (h === debut)
                                };
                            }
                        }
                    }
                }
            }
        });

        // Construire le HTML
        var html = '<div class="mini-planner-detail">' +
            '<div class="mini-planner-header">Charge de la salle</div>' +
            '<div class="mini-planner-grid-detail">';

        // Header avec les jours
        html += '<div class="mini-planner-cell mini-planner-hour">h</div>';
        jours.forEach(function(j) {
            html += '<div class="mini-planner-cell mini-planner-day-header">' + j + '</div>';
        });

        // Lignes horaires
        for (var h = 8; h < 22; h++) {
            html += '<div class="mini-planner-cell mini-planner-hour">' + h + 'h</div>';
            
            for (var d = 0; d < 7; d++) {
                var cell = course_map[h][d];
                
                if (cell && cell.code) {
                    if (cell.isStart) {
                        html += '<div class="mini-planner-cell mini-planner-slot occupied">' + cell.code + '</div>';
                    } else {
                        html += '<div class="mini-planner-cell mini-planner-slot occupied"></div>';
                    }
                } else {
                    html += '<div class="mini-planner-cell mini-planner-slot available"></div>';
                }
            }
        }

        html += '</div></div>';
        panel.innerHTML = html;
    } catch (error) {
        console.error("Erreur affichage disponibilité salle:", error);
        panel.innerHTML = '<p class="info-text">Erreur de chargement (détail: ' + error.message + ')</p>';
    }
}

// --- Afficher le mini planner du professeur sélectionné ---
async function afficherDisponibleProf(idProf) {
    var panel = document.getElementById("availability-panel");
    
    if (!idProf) {
        panel.innerHTML = '<p class="info-text">Sélectionnez un professeur pour voir son planning</p>';
        return;
    }

    var idSemestre = selectSemestre.value;
    if (!idSemestre) {
        panel.innerHTML = '<p class="info-text">Sélectionnez un semestre d\'abord</p>';
        return;
    }

    try {
        // Récupérer les disponibilités du prof
        var resDispo = await fetch("/api/disponibilites/professeur/" + idProf);
        var dispos = resDispo.ok ? await resDispo.json() : [];

        // Récupérer TOUTES les affectations du prof
        var resAff = await fetch("/api/affectations/professeur/" + idProf);
        var toutesAff = resAff.ok ? await resAff.json() : [];
        
        // Filtrer pour ce semestre uniquement
        var affectations = toutesAff.filter(function(a) { return a.id_semestre == idSemestre; });

        // Mapping jours: affichage Lun-Dim vers backend jour (0=Dim, 1=Lun, etc.)
        var jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
        var backendJourIndices = [1, 2, 3, 4, 5, 6, 0];
        var JOUR_MAPPING = {"Dimanche": 0, "Lundi": 1, "Mardi": 2, "Mercredi": 3, "Jeudi": 4, "Vendredi": 5, "Samedi": 6};

        // Créer une map des disponibilités par jour-heure
        var dispos_map = {};
        dispos.forEach(function(d) {
            if (d.jour in JOUR_MAPPING) {
                var jour = JOUR_MAPPING[d.jour];
                var plage = d.plageHoraire.split("-");
                var debut = parseInt(plage[0].split(":")[0]);
                var fin = parseInt(plage[1].split(":")[0]);
                
                for (var h = debut; h < fin; h++) {
                    var key = jour + "-" + h;
                    if (!dispos_map[key]) dispos_map[key] = [];
                    dispos_map[key].push(d.plageHoraire);
                }
            }
        });

        // Créer une map des cours par jour-heure (toutes les heures du cours)
        var cours_map = {};  // {jour-heure: {data: affectation, isStart: boolean}}
        affectations.forEach(function(a) {
            if (a.jour !== null && a.jour !== undefined) {
                var jour = normaliserJour(a.jour);
                if (jour === null) return;
                var plage = a.plageHoraire.split("-");
                var heures = plage[0].split(":");
                var debut = parseInt(heures[0]);
                var fin = parseInt(plage[1].split(":")[0]);
                
                // Stocker le cours pour CHAQUE heure qu'il occupe
                for (var h = debut; h < fin; h++) {
                    var key = jour + "-" + h;
                    if (!cours_map[key]) {
                        cours_map[key] = {
                            data: a,
                            isStart: (h === debut),  // Marquer si c'est la première heure
                            duration: (fin - debut)  // Durée totale du cours
                        };
                    }
                }
            }
        });

        // Même structure CSS que le calendrier salle
        var html = '<div class="mini-planner-detail"><div class="mini-planner-header">Planning semaine</div>';
        html += '<div class="mini-planner-grid-detail">';

        // En-tête coin vide
        html += '<div class="mini-planner-cell mini-planner-hour"></div>';

        // En-têtes jours
        jours.forEach(function(j) {
            html += '<div class="mini-planner-cell mini-planner-day-header">' + j + '</div>';
        });

        // Lignes horaires
        for (var h = 8; h < 22; h++) {
            html += '<div class="mini-planner-cell mini-planner-hour">' + h + 'h</div>';

            for (var d = 0; d < 7; d++) {
                var backendJour = backendJourIndices[d];
                var key = backendJour + "-" + h;
                var coursDuCreno = cours_map[key];
                var hasDispo = dispos_map[key];

                // Orange = occupé, Vert = disponible, Gris = indisponible
                var slotClass = coursDuCreno ? 'occupied' : (hasDispo ? 'available' : 'unavailable');

                html += '<div class="mini-planner-cell mini-planner-slot ' + slotClass + '">';
                if (coursDuCreno && coursDuCreno.isStart) {
                    var entryData = coursDuCreno.data;
                    html += entryData.cours ? entryData.cours.code : '?';
                }
                html += '</div>';
            }
        }

        html += '</div></div>';
        panel.innerHTML = html;
        
    } catch (error) {
        console.error("Erreur affichage planner prof:", error);
        panel.innerHTML = '<p class="info-text">Erreur de chargement</p>';
    }
}

// --- Convertir numéro jour (0-6) en nom ---
function getNomJour(numJour) {
    var jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    return jours[parseInt(numJour)];
}

var mapSemestresGlobal = {};

// --- Charger et afficher la liste des affectations ---
async function chargerAffectations() {
    var response = await fetch("/api/affectations");
    toutesAffectations = await response.json();

    var resSemestres = await fetch("/api/semestres");
    var semestres = await resSemestres.json();
    mapSemestresGlobal = {};
    semestres.forEach(s => { mapSemestresGlobal[s.id] = s.nom; });

    peuplerFiltres(semestres);
    afficherAffectationsFiltrées();
}

// --- Peupler les selects de filtres avec les valeurs réelles ---
function peuplerFiltres(semestres) {
    var filtreSemestre = document.getElementById("filtre-semestre");
    var filtreProgramme = document.getElementById("filtre-programme");
    var filtreProf = document.getElementById("filtre-prof");

    if (filtreSemestre) {
        var valSem = filtreSemestre.value;
        filtreSemestre.innerHTML = '<option value="">-- Tous --</option>';
        semestres.forEach(function(s) {
            var opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.nom;
            filtreSemestre.appendChild(opt);
        });
        filtreSemestre.value = valSem;
    }

    if (filtreProgramme) {
        var valProg = filtreProgramme.value;
        var programmes = [...new Set(toutesAffectations.map(a => a.cours ? a.cours.programme : null).filter(Boolean))].sort();
        filtreProgramme.innerHTML = '<option value="">-- Tous --</option>';
        programmes.forEach(function(p) {
            var opt = document.createElement("option");
            opt.value = p;
            opt.textContent = p;
            filtreProgramme.appendChild(opt);
        });
        filtreProgramme.value = valProg;
    }

    if (filtreProf) {
        var valProf = filtreProf.value;
        var profsMap = {};
        toutesAffectations.forEach(function(a) {
            if (a.professeur) profsMap[a.id_professeur] = a.professeur.prenom + " " + a.professeur.nom;
        });
        filtreProf.innerHTML = '<option value="">-- Tous --</option>';
        Object.entries(profsMap).sort((a,b) => a[1].localeCompare(b[1])).forEach(function([id, nom]) {
            var opt = document.createElement("option");
            opt.value = id;
            opt.textContent = nom;
            filtreProf.appendChild(opt);
        });
        filtreProf.value = valProf;
    }
}

// --- Afficher les affectations filtrées ---
function afficherAffectationsFiltrées() {
    tbody.innerHTML = "";

    var aucunFiltre = !filtresTable.semestre && !filtresTable.programme && !filtresTable.prof && !filtresTable.jour;
    if (!filtresAppliques || aucunFiltre) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:1.5rem;">Sélectionnez au moins un filtre pour afficher les affectations.</td></tr>';
        return;
    }

    var affichees = toutesAffectations.filter(function(a) {
        if (filtresTable.semestre && String(a.id_semestre) !== String(filtresTable.semestre)) return false;
        if (filtresTable.programme && (!a.cours || a.cours.programme !== filtresTable.programme)) return false;
        if (filtresTable.prof && String(a.id_professeur) !== String(filtresTable.prof)) return false;
        if (filtresTable.jour && String(a.jour) !== String(filtresTable.jour)) return false;
        return true;
    });

    if (affichees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:1.5rem;">Aucune affectation trouvée.</td></tr>';
        return;
    }

    affichees.forEach(function (a) { afficherLigneAffectation(a); });
}

async function afficherLigneAffectation(a) {
    var tr = document.createElement("tr");

    var dateJourStr = "";
    if (a.jour !== null && a.jour !== undefined && !a.date) {
        var jourNum = normaliserJour(a.jour);
        dateJourStr = (jourNum !== null ? getNomJour(jourNum) : a.jour) + " (hebdo)";
    } else if (a.date) {
        dateJourStr = new Date(a.date).toLocaleDateString("fr-CA");
    } else {
        dateJourStr = "—";
    }

    var profNom = a.professeur ? a.professeur.prenom + " " + a.professeur.nom : "—";

    tr.setAttribute("data-id", a.id);
    tr.setAttribute("data-id_cours", a.id_cours);
    tr.setAttribute("data-id_salle", a.id_salle);
    tr.setAttribute("data-id_professeur", a.id_professeur || "");
    tr.setAttribute("data-jour", a.jour || "");
    tr.setAttribute("data-date", a.date ? a.date.split("T")[0] : "");
    tr.setAttribute("data-plage", a.plageHoraire);


    var salleHtml = a.salle ? '<div>' + a.salle.code + '</div>' : '<div>—</div>';

    var profHtml = '<div>—</div>';
    if (profNom !== "—") {
        profHtml = '<div>' + profNom + '</div>';
    }

    tr.innerHTML =
        '<td>' + (a.cours ? (a.cours.programme || '') : '') + '</td>' +
        '<td>' + (a.cours ? a.cours.code + ' - ' + a.cours.nom : '') + '</td>' +
        '<td>' + salleHtml + '</td>' +
        '<td>' + profHtml + '</td>' +
        '<td>' + (a.id_semestre ? mapSemestresGlobal[a.id_semestre] || 'N/A' : 'N/A') + '</td>' +
        '<td>' + dateJourStr + '</td>' +
        '<td>' + a.plageHoraire + '</td>' +
        '<td><div class="actions-cell">' +
            '<button class="btn btn-modifier" onclick="modifierAffectation(' + a.id + ')">Modifier</button>' +
            '<button class="btn btn-supprimer" onclick="supprimerAffectation(' + a.id + ')">Supprimer</button>' +
        '</div></td>';

    tbody.appendChild(tr);
}

// --- Créer une nouvelle affectation ---
async function onFormAffectationSubmit(event) {
    event.preventDefault();

    var debut = selectHeureDebut.value;
    var fin = selectHeureFin.value;

    if (!debut || !fin) {
        afficherMessage(msgAffectation, "Veuillez sélectionner une plage horaire complète.", "erreur");
        return;
    }
    if (debut >= fin) {
        afficherMessage(msgAffectation, "L'heure de fin doit être après l'heure de début.", "erreur");
        return;
    }

    if (selectProfesseur.value) {
        var jour = selectJour.value;
        var nomJourSelect = getNomJour(jour);

        try {
            var resDispos = await fetch("/api/disponibilites/professeur/" + parseInt(selectProfesseur.value));
            var disponibilites = await resDispos.json();

            var dispo_jour = disponibilites.find(d => d.jour === nomJourSelect);

            if (!dispo_jour) {
                afficherMessage(msgAffectation, "Ce professeur n'est pas disponible le " + nomJourSelect + ".", "erreur");
                return;
            }

            var plage = dispo_jour.plageHoraire.split("-");
            var dispo_debut = plage[0];
            var dispo_fin = plage[1];

            if (debut < dispo_debut || fin > dispo_fin) {
                afficherMessage(msgAffectation, "Ce professeur n'est disponible le " + nomJourSelect + " que de " + dispo_debut + " à " + dispo_fin + ".", "erreur");
                return;
            }
        } catch (e) {
            console.log("Erreur lors de la vérification de disponibilité");
        }
    }

    var data = {
        id_semestre: selectSemestre.value !== "" ? parseInt(selectSemestre.value) : null,
        id_cours: parseInt(selectCours.value),
        id_salle: parseInt(selectSalle.value),
        id_professeur: selectProfesseur.value ? parseInt(selectProfesseur.value) : null,
        jour: selectJour.value ? selectJour.value.toString() : null,
        plageHoraire: debut + "-" + fin,
    };

    var response = await fetch("/api/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        afficherMessage(msgAffectation, "Cours affecté avec succès !", "succes");
        var idSalleAvant = selectSalle.value;
        var idProfAvant = selectProfesseur.value;
        var idSemestreAvant = selectSemestre.value;
        formAffectation.reset();
        selectSemestre.value = idSemestreAvant;
        selectSalle.value = idSalleAvant;
        chargerAffectations();
        if (idSalleAvant) afficherDisponibiliteSalle();
        if (idProfAvant) afficherDisponibleProf(idProfAvant);
    } else {
        var err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de l'affectation.", "erreur");
    }
}

// --- Assigner un professeur à une affectation ---
window.assignerProf = async function (idAffectation) {
    var select = document.querySelector('.select-prof[data-id="' + idAffectation + '"]');
    var idProf = select ? select.value : null;

    if (!idProf) {
        afficherMessage(msgAffectation, "Veuillez choisir un professeur.", "erreur");
        return;
    }

    var response = await fetch("/api/affectations/" + idAffectation + "/professeur", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_professeur: parseInt(idProf) }),
    });

    if (response.ok) {
        afficherMessage(msgAffectation, "Professeur assigné avec succès !", "succes");
        chargerAffectations();
    } else {
        var err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de l'assignation.", "erreur");
    }
};

// --- Supprimer une affectation ---
window.supprimerAffectation = async function (id) {
    if (!confirm("Voulez-vous vraiment supprimer cette affectation ?")) return;

    var response = await fetch("/api/affectations/" + id, { method: "DELETE" });

    if (response.ok) {
        afficherMessage(msgAffectation, "Affectation supprimée avec succès !", "succes");
        chargerAffectations();
    } else {
        var err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de la suppression.", "erreur");
    }
};

// --- Remplir un <select> avec des options ---
function remplirSelect(select, items, valeurActuelle, getText) {
    select.innerHTML = "";
    items.forEach(function (item) {
        var opt = document.createElement("option");
        opt.value = item.id;
        opt.textContent = getText(item);
        if (item.id == valeurActuelle) opt.selected = true;
        select.appendChild(opt);
    });
}

// --- Remplir un <select> d'heures ---
function remplirSelectHeures(select, label, valeurActuelle) {
    var heures = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"];
    select.innerHTML = '<option value="">' + label + '</option>';
    heures.forEach(function (h) {
        var opt = document.createElement("option");
        opt.value = h;
        opt.textContent = h;
        if (h === valeurActuelle) opt.selected = true;
        select.appendChild(opt);
    });
}

// --- Modifier une affectation ---
window.modifierAffectation = async function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    var resCours = await fetch("/api/cours");
    var coursList = await resCours.json();
    var resSalles = await fetch("/api/salles");
    var sallesList = await resSalles.json();
    var resProfs = await fetch("/api/professeurs");
    var profsList = await resProfs.json();

    var currentPlage = (tr.getAttribute("data-plage") || "").split("-");

    remplirSelect(document.getElementById("mod-cours"), coursList, tr.getAttribute("data-id_cours"),
        function (c) { return c.code + " - " + c.nom; });
    remplirSelect(document.getElementById("mod-salle"), sallesList, tr.getAttribute("data-id_salle"),
        function (s) { return s.code + " (" + s.type + ")"; });

    var modProf = document.getElementById("mod-prof");
    modProf.innerHTML = '<option value="">-- Aucun --</option>';
    profsList.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.prenom + " " + p.nom;
        if (p.id == tr.getAttribute("data-id_professeur")) opt.selected = true;
        modProf.appendChild(opt);
    });

    document.getElementById("mod-id").value = id;

    var jour = tr.getAttribute("data-jour");
    var date = tr.getAttribute("data-date");

    if (jour && jour !== "") {
        document.getElementById("mod-jour").value = jour;
        document.getElementById("mod-date").value = "";
        document.getElementById("mod-jour").disabled = false;
        document.getElementById("mod-date").disabled = true;
    } else if (date && date !== "") {
        document.getElementById("mod-jour").value = "";
        document.getElementById("mod-date").value = date;
        document.getElementById("mod-jour").disabled = true;
        document.getElementById("mod-date").disabled = false;
    } else {
        document.getElementById("mod-jour").value = "";
        document.getElementById("mod-date").value = "";
        document.getElementById("mod-jour").disabled = false;
        document.getElementById("mod-date").disabled = false;
    }

    remplirSelectHeures(document.getElementById("mod-debut"), "Début", currentPlage[0] || "");
    remplirSelectHeures(document.getElementById("mod-fin"), "Fin", currentPlage[1] || "");

    document.getElementById("modale-modifier").style.display = "";
};

// --- Fermer la modale ---
function fermerModaleAffectation() {
    var m = document.getElementById("modale-modifier");
    if (m) m.style.display = "none";
}

// --- Valider la modification ---
document.getElementById("mod-valider").onclick = async function () {
    var debut = document.getElementById("mod-debut").value;
    var fin = document.getElementById("mod-fin").value;
    var id = document.getElementById("mod-id").value;
    var jour = document.getElementById("mod-jour").value;
    var date = document.getElementById("mod-date").value;

    if (!debut || !fin) { alert("Plage horaire incomplète."); return; }
    if (debut >= fin) { alert("L'heure de fin doit être après l'heure de début."); return; }
    if (!jour && !date) { alert("Vous devez sélectionner un jour ou une date."); return; }

    var profVal = document.getElementById("mod-prof").value;
    var data = {
        id_cours: parseInt(document.getElementById("mod-cours").value),
        id_salle: parseInt(document.getElementById("mod-salle").value),
        id_professeur: profVal ? parseInt(profVal) : null,
        plageHoraire: debut + "-" + fin,
    };

    if (jour && jour !== "") {
        data.jour = jour.toString();
    } else if (date && date !== "") {
        data.date = date;
    }

    var response = await fetch("/api/affectations/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    document.getElementById("modale-modifier").style.display = "none";

    if (response.ok) {
        afficherMessage(msgAffectation, "Affectation modifiée avec succès !", "succes");
        chargerAffectations();
    } else {
        var err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de la modification.", "erreur");
    }
};

// --- Démarrage ---
document.addEventListener('DOMContentLoaded', function() {
    initDOMElements();
    chargerSelectSemestres();
    chargerSelectProgrammes();
    chargerSelectCours();
    chargerSelectSalles();
    chargerSelectProfesseurs();
    chargerAffectations();

    if (selectProgramme) {
        selectProgramme.addEventListener("change", function() {
            filtrerCoursProgramme();
            filtrerProfsProgramme();
        });
    }

    if (selectCours) {
        selectCours.addEventListener("change", filtrerProfsProgramme);
    }

    selectSemestre.addEventListener("change", function() {
        afficherDisponibiliteSalle();
        afficherDisponibleProf(selectProfesseur.value);
    });
});

