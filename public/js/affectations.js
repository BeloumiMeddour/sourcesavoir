// === GESTION DES AFFECTATIONS ===

const formAffectation = document.getElementById("form-affectation");
const msgAffectation = document.getElementById("msg-affectation");
const tbody = document.querySelector("#table-affectations tbody");
const selectCours = document.getElementById("id_cours");
const selectSalle = document.getElementById("id_salle");
const selectHeureDebut = document.getElementById("heureDebut");
const selectHeureFin = document.getElementById("heureFin");

// Afficher un message de succès ou d'erreur
function afficherMessage(element, texte, type) {
    element.innerText = texte;
    element.className = "message " + type;
    // Effacer après 5 secondes
    setTimeout(() => { element.innerText = ""; element.className = "message"; }, 5000);
}

// Charger les cours dans le select
async function chargerSelectCours() {
    const response = await fetch("/api/cours");
    const cours = await response.json();

    cours.forEach((c) => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.code + " - " + c.nom;
        selectCours.appendChild(option);
    });
}

// Charger les salles dans le select
async function chargerSelectSalles() {
    const response = await fetch("/api/salles");
    const salles = await response.json();

    salles.forEach((s) => {
        const option = document.createElement("option");
        option.value = s.id;
        option.textContent = s.code + " (" + s.type + ")";
        selectSalle.appendChild(option);
    });
}

// Charger les professeurs pour l'assignation
async function chargerSelectProfesseurs() {
    const response = await fetch("/api/professeurs");
    const professeurs = await response.json();
    return professeurs;
}

// Charger la liste des affectations
async function chargerAffectations() {
    const response = await fetch("/api/affectations");
    const affectations = await response.json();
    const professeurs = await chargerSelectProfesseurs();

    tbody.innerHTML = "";

    affectations.forEach((a) => {
        const tr = document.createElement("tr");
        const dateStr = new Date(a.date).toLocaleDateString("fr-CA");
        const profNom = a.professeur ? a.professeur.prenom + " " + a.professeur.nom : "—";

        // Créer le select des professeurs si non assigné
        let profSelect = "";
        if (!a.id_professeur) {
            profSelect = `<select class="select-prof" data-id="${a.id}">
                <option value="">-- Choisir --</option>`;
            professeurs.forEach((p) => {
                profSelect += `<option value="${p.id}">${p.prenom} ${p.nom}</option>`;
            });
            profSelect += `</select>
                <button class="btn btn-assigner" onclick="assignerProf(${a.id})">Assigner</button>`;
        }

        tr.setAttribute("data-id", a.id);
        tr.setAttribute("data-id_cours", a.id_cours);
        tr.setAttribute("data-id_salle", a.id_salle);
        tr.setAttribute("data-id_professeur", a.id_professeur || "");
        tr.setAttribute("data-date", a.date.split("T")[0]);
        tr.setAttribute("data-plage", a.plageHoraire);
        tr.innerHTML = `
            <td>${a.cours ? a.cours.code + " - " + a.cours.nom : ""}</td>
            <td>${a.salle ? a.salle.code : ""}</td>
            <td>${a.id_professeur ? profNom : profSelect}</td>
            <td>${dateStr}</td>
            <td>${a.plageHoraire}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-modifier" onclick="modifierAffectation(${a.id})">Modifier</button>
                    <button class="btn btn-supprimer" onclick="supprimerAffectation(${a.id})">Supprimer</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Affecter un cours à une salle
formAffectation.addEventListener("submit", async (event) => {
    event.preventDefault();

    const debut = selectHeureDebut.value;
    const fin = selectHeureFin.value;

    if (!debut || !fin) {
        afficherMessage(msgAffectation, "Veuillez sélectionner une plage horaire complète.", "erreur");
        return;
    }

    if (debut >= fin) {
        afficherMessage(msgAffectation, "L'heure de fin doit être après l'heure de début.", "erreur");
        return;
    }

    const data = {
        id_cours: parseInt(selectCours.value),
        id_salle: parseInt(selectSalle.value),
        date: document.getElementById("date").value,
        plageHoraire: debut + "-" + fin,
    };

    const response = await fetch("/api/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        afficherMessage(msgAffectation, "Cours affecté avec succès !", "succes");
        formAffectation.reset();
        chargerAffectations();
    } else if (response.status === 409) {
        const err = await response.json();
        afficherMessage(msgAffectation, err.error, "erreur");
    } else {
        const err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de l'affectation.", "erreur");
    }
});

// Assigner un professeur à une affectation (via select)
window.assignerProf = async function (idAffectation) {
    const select = document.querySelector(`.select-prof[data-id="${idAffectation}"]`);
    const idProf = select ? select.value : null;

    if (!idProf) {
        afficherMessage(msgAffectation, "Veuillez choisir un professeur.", "erreur");
        return;
    }

    const response = await fetch("/api/affectations/" + idAffectation + "/professeur", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_professeur: parseInt(idProf) }),
    });

    if (response.ok) {
        afficherMessage(msgAffectation, "Professeur assigné avec succès !", "succes");
        chargerAffectations();
    } else {
        const err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de l'assignation.", "erreur");
    }
};

// Supprimer une affectation
window.supprimerAffectation = async function (id) {
    if (!confirm("Voulez-vous vraiment supprimer cette affectation ?")) return;

    const response = await fetch("/api/affectations/" + id, {
        method: "DELETE",
    });

    if (response.ok) {
        afficherMessage(msgAffectation, "Affectation supprimée avec succès !", "succes");
        chargerAffectations();
    } else {
        const err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de la suppression.", "erreur");
    }
};

// Modifier une affectation (modale)
window.modifierAffectation = async function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"');
    if (!tr) return;

    // Charger les listes pour les selects
    var resCours = await fetch("/api/cours");
    var coursList = await resCours.json();
    var resSalles = await fetch("/api/salles");
    var sallesList = await resSalles.json();
    var resProfs = await fetch("/api/professeurs");
    var profsList = await resProfs.json();

    var currentCours = tr.getAttribute("data-id_cours");
    var currentSalle = tr.getAttribute("data-id_salle");
    var currentProf = tr.getAttribute("data-id_professeur");
    var currentDate = tr.getAttribute("data-date");
    var currentPlage = tr.getAttribute("data-plage") || "";
    var plageParts = currentPlage.split("-");
    var currentDebut = plageParts[0] || "";
    var currentFin = plageParts[1] || "";

    // Options cours
    var optionsCours = coursList.map(function (c) {
        return '<option value="' + c.id + '"' + (c.id == currentCours ? ' selected' : '') + '>' + c.code + ' - ' + c.nom + '</option>';
    }).join("");

    // Options salles
    var optionsSalles = sallesList.map(function (s) {
        return '<option value="' + s.id + '"' + (s.id == currentSalle ? ' selected' : '') + '>' + s.code + ' (' + s.type + ')</option>';
    }).join("");

    // Options professeurs
    var optionsProfs = '<option value="">-- Aucun --</option>' + profsList.map(function (p) {
        return '<option value="' + p.id + '"' + (p.id == currentProf ? ' selected' : '') + '>' + p.prenom + ' ' + p.nom + '</option>';
    }).join("");

    // Générer les options d'heures
    var heuresDebut = [
        "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
        "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
        "16:00","16:30","17:00","17:30","18:00"
    ];
    var heuresFin = [
        "08:30","09:00","09:30","10:00","10:30","11:00","11:30",
        "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
        "16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"
    ];

    var optHeureDebut = '<option value="">Début</option>' + heuresDebut.map(function (h) {
        return '<option value="' + h + '"' + (h === currentDebut ? ' selected' : '') + '>' + h + '</option>';
    }).join("");

    var optHeureFin = '<option value="">Fin</option>' + heuresFin.map(function (h) {
        return '<option value="' + h + '"' + (h === currentFin ? ' selected' : '') + '>' + h + '</option>';
    }).join("");

    var ancien = document.getElementById("modale-modifier");
    if (ancien) ancien.remove();

    var modale = document.createElement("div");
    modale.id = "modale-modifier";
    modale.className = "modale-overlay";
    modale.innerHTML =
        '<div class="modale-contenu">' +
            '<h3>Modifier l\'affectation</h3>' +
            '<div class="modale-champ"><label>Cours</label><select id="mod-cours">' + optionsCours + '</select></div>' +
            '<div class="modale-champ"><label>Salle</label><select id="mod-salle">' + optionsSalles + '</select></div>' +
            '<div class="modale-champ"><label>Professeur</label><select id="mod-prof">' + optionsProfs + '</select></div>' +
            '<div class="modale-champ"><label>Date</label><input type="date" id="mod-date" value="' + currentDate + '"></div>' +
            '<div class="modale-champ"><label>Plage horaire</label>' +
                '<div style="display:flex;gap:8px;align-items:center;">' +
                    '<select id="mod-debut" style="flex:1;">' + optHeureDebut + '</select>' +
                    '<span>à</span>' +
                    '<select id="mod-fin" style="flex:1;">' + optHeureFin + '</select>' +
                '</div>' +
            '</div>' +
            '<div class="modale-actions">' +
                '<button class="btn btn-modifier" id="mod-valider">Valider</button>' +
                '<button class="btn btn-supprimer" id="mod-annuler">Annuler</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(modale);

    document.getElementById("mod-annuler").onclick = function () { modale.remove(); };
    modale.addEventListener("click", function (e) { if (e.target === modale) modale.remove(); });

    document.getElementById("mod-valider").onclick = async function () {
        var debut = document.getElementById("mod-debut").value;
        var fin = document.getElementById("mod-fin").value;

        if (!debut || !fin) {
            alert("Veuillez sélectionner une plage horaire complète.");
            return;
        }
        if (debut >= fin) {
            alert("L'heure de fin doit être après l'heure de début.");
            return;
        }

        var profVal = document.getElementById("mod-prof").value;
        var data = {
            id_cours: parseInt(document.getElementById("mod-cours").value),
            id_salle: parseInt(document.getElementById("mod-salle").value),
            id_professeur: profVal ? parseInt(profVal) : null,
            date: document.getElementById("mod-date").value,
            plageHoraire: debut + "-" + fin,
        };

        var response = await fetch("/api/affectations/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        modale.remove();
        if (response.ok) {
            afficherMessage(msgAffectation, "Affectation modifiée avec succès !", "succes");
            chargerAffectations();
        } else {
            var err = await response.json();
            afficherMessage(msgAffectation, err.error || "Erreur lors de la modification.", "erreur");
        }
    };
};

// Charger tout au démarrage
chargerSelectCours();
chargerSelectSalles();
chargerAffectations();
