// === GESTION DES COURS ===

import { afficherMessage, activerTriTableau } from './utils.js';

let formCours;
let msgCours;
let tbody;
let btnToggle;
let formCard;
let searchInput;
let modale;

function initDOMElements() {
    formCours = document.getElementById("form-cours");
    msgCours = document.getElementById("msg-cours");
    tbody = document.querySelector("#table-cours tbody");
    btnToggle = document.getElementById("btn-toggle-form");
    formCard = document.getElementById("form-card");
    searchInput = document.getElementById("search-cours");
    modale = document.getElementById("modale-modifier");
    if (modale) {
        document.getElementById("mod-annuler").onclick = fermerModale;
        modale.addEventListener("click", function (e) { if (e.target === modale) fermerModale(); });
    }

    // Ajouter les event listeners
    if (btnToggle) {
        btnToggle.addEventListener("click", function () {
            formCard.classList.toggle("hidden");
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            var terme = searchInput.value.toLowerCase();
            var lignes = tbody.querySelectorAll("tr");
            lignes.forEach(function (tr) {
                tr.style.display = tr.textContent.toLowerCase().includes(terme) ? "" : "none";
            });
        });
    }
    
    if (formCours) {
        formCours.addEventListener("submit", onFormCoursSubmit);
    }


    if (modale) {
        document.getElementById("mod-annuler").onclick = fermerModale;
        modale.addEventListener("click", function (e) { if (e.target === modale) fermerModale(); });
    }
}

async function chargerCours() {
    var response = await fetch("/api/cours");
    var cours = await response.json();

    tbody.innerHTML = "";

    if (cours.length === 0) {
        var emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="7"><div class="empty-state"><div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div><h3>Aucun cours</h3><p>Commencez par ajouter un cours avec le bouton ci-dessus.</p></div></td>';
        tbody.appendChild(emptyRow);
        return;
    }

    cours.forEach(function (c) {
        var tr = document.createElement("tr");
        tr.setAttribute("data-id", c.id);
        tr.setAttribute("data-code", c.code);
        tr.setAttribute("data-nom", c.nom);
        tr.setAttribute("data-duree", c.duree);
        tr.setAttribute("data-programme", c.programme);
        tr.setAttribute("data-etape", c.etapeEtude);
        tr.setAttribute("data-typesalle", c.typeSalle);
        tr.innerHTML =
            "<td>" + c.code + "</td>" +
            "<td>" + c.nom + "</td>" +
            "<td>" + c.duree + "h</td>" +
            "<td>" + c.programme + "</td>" +
            "<td>Étape " + c.etapeEtude + "</td>" +
            "<td>" + c.typeSalle + "</td>" +
            '<td><div class="actions-cell">' +
                '<button class="btn btn-modifier" onclick="modifierCours(' + c.id + ')">Modifier</button>' +
                '<button class="btn btn-supprimer" onclick="supprimerCours(' + c.id + ')">Supprimer</button>' +
            '</div></td>';
        tbody.appendChild(tr);
    });
}

async function onFormCoursSubmit(event) {
    event.preventDefault();

    var data = {
        code: document.getElementById("code").value,
        nom: document.getElementById("nom").value,
        duree: parseInt(document.getElementById("duree").value),
        programme: document.getElementById("programme").value,
        etapeEtude: document.getElementById("etapeEtude").value,
        typeSalle: document.getElementById("typeSalle").value,
    };

    var response = await fetch("/api/cours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        afficherMessage(msgCours, "Cours ajouté avec succès !", "succes");
        formCours.reset();
        formCard.classList.add("hidden");
        chargerCours();
    } else if (response.status === 409) {
        afficherMessage(msgCours, "Un cours avec ce code existe déjà.", "erreur");
    } else {
        var err = await response.json();
        afficherMessage(msgCours, err.error || "Erreur.", "erreur");
    }
}

// Fermer la modale
function fermerModale() {
    modale.style.display = "none";
}

window.modifierCours = function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    document.getElementById("mod-code").value = tr.getAttribute("data-code") || "";
    document.getElementById("mod-nom").value = tr.getAttribute("data-nom") || "";
    document.getElementById("mod-duree").value = tr.getAttribute("data-duree") || "";
    document.getElementById("mod-programme").value = tr.getAttribute("data-programme") || "";
    document.getElementById("mod-etape").value = tr.getAttribute("data-etape") || "";
    document.getElementById("mod-typesalle").value = tr.getAttribute("data-typesalle") || "";

    modale.style.display = "flex";

    document.getElementById("mod-valider").onclick = async function () {
        var data = {
            code: document.getElementById("mod-code").value,
            nom: document.getElementById("mod-nom").value,
            duree: parseInt(document.getElementById("mod-duree").value),
            programme: document.getElementById("mod-programme").value,
            etapeEtude: document.getElementById("mod-etape").value,
            typeSalle: document.getElementById("mod-typesalle").value,
        };
        var response = await fetch("/api/cours/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        fermerModale();
        if (response.ok) {
            afficherMessage(msgCours, "Cours modifié avec succès !", "succes");
            chargerCours();
        } else {
            var err = await response.json();
            afficherMessage(msgCours, err.error || "Erreur.", "erreur");
        }
    };
};

window.supprimerCours = async function (id) {
    if (!confirm("Voulez-vous vraiment supprimer ce cours ?")) return;

    var response = await fetch("/api/cours/" + id, { method: "DELETE" });

    if (response.ok) {
        afficherMessage(msgCours, "Cours supprimé avec succès !", "succes");
        chargerCours();
    } else {
        var err = await response.json();
        afficherMessage(msgCours, err.error || "Erreur.", "erreur");
    }
};

async function chargerProgrammes() {
    var select = document.getElementById("programme");
    if (!select) return;
    try {
        var response = await fetch("/api/programmes");
        var programmes = await response.json();
        var current = select.value;
        select.innerHTML = '<option value="">-- Sélectionner un programme --</option>';
        programmes.forEach(function (p) {
            var opt = document.createElement("option");
            opt.value = p;
            opt.textContent = p;
            select.appendChild(opt);
        });
        if (current) select.value = current;
    } catch (e) { }
}

document.addEventListener('DOMContentLoaded', function() {
    initDOMElements();
    chargerCours();
    chargerProgrammes();
    activerTriTableau("table-cours");
});
