// === GESTION DES PROFESSEURS ===

import { afficherMessage } from './utils.js';

const formProfesseur = document.getElementById("form-professeur");
const msgProfesseur = document.getElementById("msg-professeur");
const tbody = document.querySelector("#table-professeurs tbody");
const btnToggle = document.getElementById("btn-toggle-form");
const formCard = document.getElementById("form-card");
const searchInput = document.getElementById("search-profs");
const modale = document.getElementById("modale-modifier");

btnToggle.addEventListener("click", function () {
    formCard.classList.toggle("hidden");
});

searchInput.addEventListener("input", function () {
    var terme = searchInput.value.toLowerCase();
    var lignes = tbody.querySelectorAll("tr");
    lignes.forEach(function (tr) {
        tr.style.display = tr.textContent.toLowerCase().includes(terme) ? "" : "none";
    });
});

async function chargerProfesseurs() {
    var response = await fetch("/api/professeurs");
    var professeurs = await response.json();

    tbody.innerHTML = "";

    professeurs.forEach(function (p) {
        var tr = document.createElement("tr");
        tr.setAttribute("data-id", p.id);
        tr.setAttribute("data-matricule", p.matricule);
        tr.setAttribute("data-nom", p.nom);
        tr.setAttribute("data-prenom", p.prenom);
        tr.setAttribute("data-specialite", p.specialite);
        tr.innerHTML =
            "<td>" + p.matricule + "</td>" +
            "<td>" + p.nom + "</td>" +
            "<td>" + p.prenom + "</td>" +
            "<td>" + p.specialite + "</td>" +
            '<td><div class="actions-cell">' +
                '<button class="btn btn-vert" onclick="ouvrirModalDisponibilites(' + p.id + ', \'' + p.prenom + ' ' + p.nom + '\')">Disponibilités</button>' +
                '<button class="btn btn-modifier" onclick="modifierProfesseur(' + p.id + ')">Modifier</button>' +
                '<button class="btn btn-supprimer" onclick="supprimerProfesseur(' + p.id + ')">Supprimer</button>' +
            '</div></td>';
        tbody.appendChild(tr);
    });
}

formProfesseur.addEventListener("submit", async function (event) {
    event.preventDefault();

    var data = {
        matricule: document.getElementById("matricule").value,
        nom: document.getElementById("nom").value,
        prenom: document.getElementById("prenom").value,
        specialite: document.getElementById("specialite").value,
    };

    var response = await fetch("/api/professeurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        afficherMessage(msgProfesseur, "Professeur ajouté avec succès !", "succes");
        formProfesseur.reset();
        formCard.classList.add("hidden");
        chargerProfesseurs();
    } else if (response.status === 409) {
        afficherMessage(msgProfesseur, "Un professeur avec ce matricule existe déjà.", "erreur");
    } else {
        var err = await response.json();
        afficherMessage(msgProfesseur, err.error || "Erreur.", "erreur");
    }
});

// Fermer la modale modifier
function fermerModale() {
    modale.style.display = "none";
}

document.getElementById("mod-annuler").onclick = fermerModale;
modale.addEventListener("click", function (e) { if (e.target === modale) fermerModale(); });

window.modifierProfesseur = function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    document.getElementById("mod-matricule").value = tr.getAttribute("data-matricule") || "";
    document.getElementById("mod-nom").value = tr.getAttribute("data-nom") || "";
    document.getElementById("mod-prenom").value = tr.getAttribute("data-prenom") || "";
    document.getElementById("mod-specialite").value = tr.getAttribute("data-specialite") || "";

    modale.style.display = "flex";

    document.getElementById("mod-valider").onclick = async function () {
        var data = {
            matricule: document.getElementById("mod-matricule").value,
            nom: document.getElementById("mod-nom").value,
            prenom: document.getElementById("mod-prenom").value,
            specialite: document.getElementById("mod-specialite").value,
        };
        var response = await fetch("/api/professeurs/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        fermerModale();
        if (response.ok) {
            afficherMessage(msgProfesseur, "Professeur modifié avec succès !", "succes");
            chargerProfesseurs();
        } else {
            var err = await response.json();
            afficherMessage(msgProfesseur, err.error || "Erreur.", "erreur");
        }
    };
};

window.supprimerProfesseur = async function (id) {
    if (!confirm("Voulez-vous vraiment supprimer ce professeur ?")) return;

    var response = await fetch("/api/professeurs/" + id, { method: "DELETE" });

    if (response.ok) {
        afficherMessage(msgProfesseur, "Professeur supprimé avec succès !", "succes");
        chargerProfesseurs();
    } else {
        var err = await response.json();
        afficherMessage(msgProfesseur, err.error || "Erreur.", "erreur");
    }
};

// === GESTION DES DISPONIBILITÉS ===

var idProfActuel = null;
var jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
var heures = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

window.ouvrirModalDisponibilites = async function (id, nomProf) {
    idProfActuel = id;
    document.getElementById("dispo-prof-nom").textContent = nomProf;
    document.getElementById("modale-disponibilites").style.display = "flex";
    await afficherTableauDisponibilites(id);
};

window.fermerModalDisponibilites = function () {
    document.getElementById("modale-disponibilites").style.display = "none";
};

async function afficherTableauDisponibilites(id) {
    var response = await fetch("/api/disponibilites/professeur/" + id);
    var disponibilites = await response.json();

    var dispoParJour = {};
    jours.forEach(j => { dispoParJour[j] = null; });

    disponibilites.forEach(d => {
        if (dispoParJour[d.jour] === null) {
            var parts = d.plageHoraire.split("-");
            dispoParJour[d.jour] = { debut: parts[0], fin: parts[1] };
        }
    });

    var tableBody = document.getElementById("tableau-disponibilites");
    tableBody.innerHTML = "";

    jours.forEach(function (jour) {
        var tr = document.createElement("tr");
        var dispo = dispoParJour[jour];
        var debut = dispo ? dispo.debut : "08:00";
        var fin = dispo ? dispo.fin : "22:00";

        tr.innerHTML =
            '<td class="dispo-jour">' + jour + '</td>' +
            '<td class="dispo-td"><select class="dispo-select" data-jour="' + jour + '" data-type="debut">' +
                heures.map(h => '<option value="' + h + '" ' + (debut === h ? 'selected' : '') + '>' + h + '</option>').join('') +
            '</select></td>' +
            '<td class="dispo-td"><select class="dispo-select" data-jour="' + jour + '" data-type="fin">' +
                heures.map(h => '<option value="' + h + '" ' + (fin === h ? 'selected' : '') + '>' + h + '</option>').join('') +
            '</select></td>' +
            '<td class="dispo-td-center"><label><input type="checkbox" class="jour-actif" data-jour="' + jour + '" ' + (dispo ? 'checked' : '') + ' /> Actif</label></td>';

        tableBody.appendChild(tr);
    });
}

window.sauvegarderDisponibilites = async function () {
    try {
        var responseGet = await fetch("/api/disponibilites/professeur/" + idProfActuel);
        var disponibilites = await responseGet.json();

        var dispoActuelleParJour = {};
        disponibilites.forEach(function (d) {
            var parts = d.plageHoraire.split("-");
            dispoActuelleParJour[d.jour] = { debut: parts[0], fin: parts[1] };
        });

        var checkboxes = document.querySelectorAll(".jour-actif:checked");
        var msgDispo = document.getElementById("msg-dispo");

        // Validation avant toute modification
        for (var cb of checkboxes) {
            var jour = cb.getAttribute("data-jour");
            var debutSelect = document.querySelector("select[data-jour='" + jour + "'][data-type='debut']");
            var finSelect = document.querySelector("select[data-jour='" + jour + "'][data-type='fin']");
            if (!debutSelect || !finSelect) continue;

            var debut = debutSelect.value;
            var fin = finSelect.value;

            if (debut >= fin) {
                afficherMessage(msgDispo, "L'heure de fin doit être après le début pour " + jour + ".", "erreur");
                return;
            }

            var ancienne = dispoActuelleParJour[jour];
            if (ancienne) {
                if (debut < ancienne.debut || fin > ancienne.fin) {
                    afficherMessage(
                        msgDispo,
                        "Impossible d'élargir la disponibilité de " + jour + " au-delà de " + ancienne.debut + "-" + ancienne.fin + ".",
                        "erreur"
                    );
                    return;
                }
            }
        }

        // Supprimer toutes les disponibilités existantes
        for (var dispo of disponibilites) {
            var delResponse = await fetch("/api/disponibilites/" + dispo.id, { method: "DELETE" });
            if (!delResponse.ok) {
                afficherMessage(msgDispo, "Erreur lors de la suppression.", "erreur");
                return;
            }
        }

        // Recréer les disponibilités cochées
        for (var cb of checkboxes) {
            var jour = cb.getAttribute("data-jour");
            var debutSelect = document.querySelector("select[data-jour='" + jour + "'][data-type='debut']");
            var finSelect = document.querySelector("select[data-jour='" + jour + "'][data-type='fin']");

            if (!debutSelect || !finSelect) {
                afficherMessage(msgDispo, "Erreur: sélecteurs non trouvés pour " + jour, "erreur");
                return;
            }

            var debut = debutSelect.value;
            var fin = finSelect.value;

            var postResponse = await fetch("/api/disponibilites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jour: jour,
                    plageHoraire: debut + "-" + fin,
                    id_professeur: idProfActuel
                })
            });

            if (!postResponse.ok) {
                var errJson = await postResponse.json().catch(() => ({}));
                afficherMessage(msgDispo, errJson.error || "Erreur lors de l'ajout de " + jour, "erreur");
                return;
            }
        }

        afficherMessage(msgDispo, "Disponibilités enregistrées!", "succes");
        setTimeout(() => {
            fermerModalDisponibilites();
            chargerProfesseurs();
        }, 1000);
    } catch (e) {
        afficherMessage(document.getElementById("msg-dispo"), "Erreur: " + e.message, "erreur");
    }
};

window.cocherTous = function () {
    document.querySelectorAll(".jour-actif").forEach(cb => { cb.checked = true; });
};

window.decocherTous = function () {
    document.querySelectorAll(".jour-actif").forEach(cb => { cb.checked = false; });
};

chargerProfesseurs();
