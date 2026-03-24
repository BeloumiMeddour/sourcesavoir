// === GESTION DES AFFECTATIONS ===

import { afficherMessage } from './utils.js';

function heureEnMinutes(h) {
    var parts = h.split(":");
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

var formAffectation = document.getElementById("form-affectation");
var msgAffectation = document.getElementById("msg-affectation");
var tbody = document.querySelector("#table-affectations tbody");
var selectSemestre = document.getElementById("id_semestre");
var selectCours = document.getElementById("id_cours");
var selectSalle = document.getElementById("id_salle");
var selectJour = document.getElementById("jour");
var selectProfesseur = document.getElementById("id_professeur");
var selectHeureDebut = document.getElementById("heureDebut");
var selectHeureFin = document.getElementById("heureFin");

// Cache des affectations
var toutesAffectations = [];

// --- Charger les cours dans le menu déroulant ---
async function chargerSelectCours() {
    var response = await fetch("/api/cours");
    var cours = await response.json();

    cours.forEach(function (c) {
        var option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.code + " - " + c.nom;
        selectCours.appendChild(option);
    });
}

// --- Charger les semestres dans le menu déroulant ---
async function chargerSelectSemestres() {
    var response = await fetch("/api/semestres");
    var semestres = await response.json();

    semestres.forEach(function (s) {
        var option = document.createElement("option");
        option.value = s.id;
        var dateDebut = new Date(s.dateDebut).toLocaleDateString("fr-CA");
        var dateFin = new Date(s.dateFin).toLocaleDateString("fr-CA");
        option.textContent = s.nom + " (" + dateDebut + " - " + dateFin + ")";
        selectSemestre.appendChild(option);
    });
}

// --- Charger les salles dans le menu déroulant ---
async function chargerSelectSalles() {
    var response = await fetch("/api/salles");
    var salles = await response.json();

    salles.forEach(function (s) {
        var option = document.createElement("option");
        option.value = s.id;
        option.textContent = s.code + " (" + s.type + ")";
        selectSalle.appendChild(option);
    });
}

// --- Charger les professeurs (liste simple, sans filtre) ---
async function chargerSelectProfesseurs() {
    var response = await fetch("/api/professeurs");
    var professeurs = await response.json();

    selectProfesseur.innerHTML = '<option value="">-- Sans prof (à assigner plus tard) --</option>';
    professeurs.forEach(function (p) {
        var option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.prenom + " " + p.nom;
        selectProfesseur.appendChild(option);
    });
}

// --- Actualiser la liste des profs selon le créneau sélectionné ---
async function actualiserListeProfs() {
    var idSemestre = selectSemestre.value;
    var jour = selectJour.value;
    var debut = selectHeureDebut.value;
    var fin = selectHeureFin.value;

    // Si tout n'est pas encore sélectionné, liste simple
    if (!idSemestre || !jour || !debut || !fin) {
        await chargerSelectProfesseurs();
        document.getElementById("info-prof-dispo").innerHTML = "";
        return;
    }

    var response = await fetch(
        "/api/professeurs/disponibilite-semestre?id_semestre=" + idSemestre +
        "&jour=" + jour + "&debut=" + debut + "&fin=" + fin
    );
    if (!response.ok) return;
    var profs = await response.json();

    var dureeSlot = (heureEnMinutes(fin) - heureEnMinutes(debut)) / 60;
    var disponibles   = profs.filter(p => p.statut === "disponible" && p.heuresLibres > dureeSlot);
    var presque       = profs.filter(p => p.statut === "disponible" && p.heuresLibres <= dureeSlot);
    var indisponibles = profs.filter(p => p.statut !== "disponible");

    var valeurActuelle = selectProfesseur.value;
    selectProfesseur.innerHTML = '<option value="">-- Sans prof --</option>';

    function ajouterGroupe(label, liste, disabled) {
        if (liste.length === 0) return;
        var grp = document.createElement("optgroup");
        grp.label = label;
        liste.forEach(function (p) {
            var opt = document.createElement("option");
            opt.value = p.id;
            opt.disabled = disabled;
            var detail = "";
            if (p.statut === "disponible") {
                detail = p.heuresLibres + "h libres (" + p.plageDeclaree + ")";
            } else if (p.statut === "hors_plage") {
                detail = "Hors plage — dispo " + p.plageDeclaree + " seulement";
            } else if (p.statut === "conflit") {
                detail = "Créneau déjà occupé";
            } else if (p.statut === "complet") {
                detail = "Plus assez de temps ce jour (" + p.plageDeclaree + ")";
            } else {
                detail = "Non disponible ce jour";
            }
            opt.textContent = p.prenom + " " + p.nom + " — " + detail;
            if (String(p.id) === valeurActuelle) opt.selected = true;
            grp.appendChild(opt);
        });
        selectProfesseur.appendChild(grp);
    }

    ajouterGroupe("✅ Disponibles", disponibles, false);
    ajouterGroupe("⚠️ Presque pleins", presque, false);
    ajouterGroupe("❌ Non disponibles", indisponibles, true);

    afficherInfoProf();
}

// --- Panneau d'info sous le select prof ---
function afficherInfoProf() {
    var panel = document.getElementById("info-prof-dispo");
    var idProf = selectProfesseur.value;
    if (!idProf) { panel.innerHTML = ""; return; }

    // Retrouver les données du prof dans les options
    var opt = selectProfesseur.querySelector('option[value="' + idProf + '"]');
    if (!opt) { panel.innerHTML = ""; return; }

    // Récupérer les données depuis l'attribut data (si disponible)
    // On affiche simplement le texte de l'option sélectionnée dans un badge
    var texte = opt.textContent;
    var disabled = opt.disabled;
    panel.innerHTML = '<div class="info-prof-badge ' + (disabled ? "info-prof-indispo" : "info-prof-ok") + '">' + texte + '</div>';
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

    tbody.innerHTML = "";
    toutesAffectations.forEach(function (a) { afficherLigneAffectation(a); });
}

async function afficherLigneAffectation(a) {
    var tr = document.createElement("tr");

    var dateJourStr = "";
    if (a.jour !== null && a.jour !== undefined && !a.date) {
        dateJourStr = getNomJour(a.jour) + " (hebdo)";
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

    var chargeProf = 0;
    var chargeMaxProf = null;
    var chargeSalle = 0;
    var chargeMaxSalle = 70;

    if (a.id_professeur && a.id_semestre) {
        try {
            var resChargeProf = await fetch("/api/professeurs/" + a.id_professeur + "/charge-horaire?id_semestre=" + a.id_semestre);
            if (resChargeProf.ok) {
                var dataChargeProf = await resChargeProf.json();
                chargeProf = dataChargeProf.charge_horaire;
                chargeMaxProf = dataChargeProf.charge_max || null;
            }
        } catch (e) {}
    }

    if (a.id_salle && a.id_semestre) {
        try {
            var resChargeSalle = await fetch("/api/salles/" + a.id_salle + "/charge-horaire?id_semestre=" + a.id_semestre);
            if (resChargeSalle.ok) {
                var dataChargeSalle = await resChargeSalle.json();
                chargeSalle = dataChargeSalle.charge_horaire;
                chargeMaxSalle = dataChargeSalle.charge_max || 70;
            }
        } catch (e) {}
    }

    var salleHtml = a.salle ? creerBarreChargeHtml(a.salle.code, chargeSalle, chargeMaxSalle) : '<div>—</div>';

    var profHtml = '<div>—</div>';
    if (profNom !== "—") {
        if (chargeMaxProf) {
            profHtml = creerBarreChargeHtml(profNom, chargeProf, chargeMaxProf);
        } else {
            profHtml = '<div class="charge-label">' + profNom + '</div><div class="charge-hours-text">' + chargeProf + 'h/sem (aucune dispo déclarée)</div>';
        }
    }

    tr.innerHTML =
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


// --- Créer une barre de charge visuelle HTML ---
function creerBarreChargeHtml(label, heures, max) {
    var pourcent = max > 0 ? (heures / max) * 100 : 0;
    var barWidth = Math.min(100, pourcent);
    var couleur;
    if (pourcent < 70) { couleur = "#27ae60"; }
    else if (pourcent < 100) { couleur = "#f39c12"; }
    else { couleur = "#e74c3c"; }
    var html = '<div class="charge-label">' + label + '</div>';
    html += '<div class="charge-bar-wrapper" title="' + heures + 'h / ' + max + 'h">';
    html += '<div class="charge-bar" style="width:' + barWidth + '%;background:' + couleur + ';">' + Math.round(pourcent) + '%</div>';
    html += '</div>';
    html += '<div class="charge-hours-text">' + heures + 'h/' + max + 'h</div>';
    return html;
}

// --- Créer une nouvelle affectation ---
formAffectation.addEventListener("submit", async function (event) {
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
        id_semestre: parseInt(selectSemestre.value) || null,
        id_cours: parseInt(selectCours.value),
        id_salle: parseInt(selectSalle.value),
        jour: selectJour.value ? selectJour.value.toString() : null,
        id_professeur: selectProfesseur.value ? parseInt(selectProfesseur.value) : null,
        plageHoraire: debut + "-" + fin,
    };

    var response = await fetch("/api/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        afficherMessage(msgAffectation, "Cours affecté avec succès !", "succes");
        formAffectation.reset();
        chargerAffectations();
    } else {
        var err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de l'affectation.", "erreur");
    }
});

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
document.getElementById("mod-annuler").onclick = function () {
    document.getElementById("modale-modifier").style.display = "none";
};
document.getElementById("modale-modifier").addEventListener("click", function (e) {
    if (e.target === this) this.style.display = "none";
});

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
chargerSelectSemestres();
chargerSelectCours();
chargerSelectSalles();
chargerSelectProfesseurs();
chargerAffectations();

// Réactualiser la liste des profs quand le créneau change
selectSemestre.addEventListener("change", actualiserListeProfs);
selectJour.addEventListener("change", actualiserListeProfs);
selectHeureDebut.addEventListener("change", actualiserListeProfs);
selectHeureFin.addEventListener("change", actualiserListeProfs);

// Afficher l'info du prof sélectionné
selectProfesseur.addEventListener("change", afficherInfoProf);

