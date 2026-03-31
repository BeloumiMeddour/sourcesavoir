// === GESTION DES SALLES ===

import { afficherMessage, activerTriTableau } from './utils.js';

let formSalle;
let msgSalle;
let tbody;
let btnToggle;
let formCard;
let searchInput;
let modale;

function initDOMElements() {
    formSalle = document.getElementById("form-salle");
    msgSalle = document.getElementById("msg-salle");
    tbody = document.querySelector("#table-salles tbody");
    btnToggle = document.getElementById("btn-toggle-form");
    formCard = document.getElementById("form-card");
    searchInput = document.getElementById("search-salles");
    modale = document.getElementById("modale-modifier");
    if (modale) {
        document.getElementById("mod-annuler").onclick = fermerModale;
        modale.addEventListener("click", function (e) { if (e.target === modale) fermerModale(); });
    }
    if (formSalle) {
        formSalle.addEventListener("submit", onFormSalleSubmit);
    }

    // Toggle formulaire
    if (btnToggle) {
        btnToggle.addEventListener("click", function () {
            formCard.classList.toggle("hidden");
        });
    }
    
    // Recherche
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            var terme = searchInput.value.toLowerCase();
            var lignes = tbody.querySelectorAll("tr");
            lignes.forEach(function (tr) {
                tr.style.display = tr.textContent.toLowerCase().includes(terme) ? "" : "none";
            });
        });
    }
}

async function chargerSalles() {
    var response = await fetch("/api/salles");
    var salles = await response.json();

    tbody.innerHTML = "";

    salles.forEach(function (s) {
        var tr = document.createElement("tr");
        tr.setAttribute("data-id", s.id);
        tr.setAttribute("data-code", s.code);
        tr.setAttribute("data-type", s.type || "");
        tr.setAttribute("data-capacite", s.capacite);
        tr.innerHTML =
            "<td>" + s.code + "</td>" +
            "<td>" + (s.type || "") + "</td>" +
            "<td>" + s.capacite + "</td>" +
            '<td><div class="actions-cell">' +
                '<button class="btn btn-modifier" onclick="modifierSalle(' + s.id + ')">Modifier</button>' +
                '<button class="btn btn-supprimer" onclick="supprimerSalle(' + s.id + ')">Supprimer</button>' +
            '</div></td>';
        tbody.appendChild(tr);
    });
}

async function onFormSalleSubmit(event) {
    event.preventDefault();

    var data = {
        code: document.getElementById("code").value,
        type: document.getElementById("type").value,
        capacite: parseInt(document.getElementById("capacite").value),
    };

    var response = await fetch("/api/salles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        afficherMessage(msgSalle, "Salle ajoutée avec succès !", "succes");
        formSalle.reset();
        formCard.classList.add("hidden");
        chargerSalles();
    } else if (response.status === 409) {
        afficherMessage(msgSalle, "Une salle avec ce code existe déjà.", "erreur");
    } else {
        var err = await response.json();
        afficherMessage(msgSalle, err.error || "Erreur.", "erreur");
    }
}

// Fermer la modale
function fermerModale() {
    modale.style.display = "none";
}

window.modifierSalle = function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    document.getElementById("mod-code").value = tr.getAttribute("data-code") || "";
    document.getElementById("mod-type").value = tr.getAttribute("data-type") || "";
    document.getElementById("mod-capacite").value = tr.getAttribute("data-capacite") || "";

    modale.style.display = "flex";

    document.getElementById("mod-valider").onclick = async function () {
        var data = {
            code: document.getElementById("mod-code").value,
            type: document.getElementById("mod-type").value,
            capacite: parseInt(document.getElementById("mod-capacite").value),
        };
        var response = await fetch("/api/salles/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        fermerModale();
        if (response.ok) {
            afficherMessage(msgSalle, "Salle modifiée avec succès !", "succes");
            chargerSalles();
        } else {
            var err = await response.json();
            afficherMessage(msgSalle, err.error || "Erreur.", "erreur");
        }
    };
};

window.supprimerSalle = async function (id) {
    if (!confirm("Voulez-vous vraiment supprimer cette salle ?")) return;

    var response = await fetch("/api/salles/" + id, { method: "DELETE" });

    if (response.ok) {
        afficherMessage(msgSalle, "Salle supprimée avec succès !", "succes");
        chargerSalles();
    } else {
        var err = await response.json();
        afficherMessage(msgSalle, err.error || "Erreur.", "erreur");
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initDOMElements();
    chargerSalles();
    activerTriTableau("table-salles");
});
