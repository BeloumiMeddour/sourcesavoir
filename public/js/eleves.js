// === GESTION DES ÉLÈVES ===
// Liste et création via /api/scolaire/eleves (rôles admin et responsable).
// Les droits sont vérifiés par le serveur : cette page n'en décide aucun.

import { afficherMessage, activerTriTableau } from './utils.js';
import { htmlLigneEleve, htmlLigneVideEleves } from './rendu.js';

const NOMBRE_COLONNES = 4;

let formEleve;
let msgEleve;
let tbody;
let btnToggle;
let formCard;
let searchInput;

function initDOMElements() {
    formEleve = document.getElementById("form-eleve");
    msgEleve = document.getElementById("msg-eleve");
    tbody = document.querySelector("#table-eleves tbody");
    btnToggle = document.getElementById("btn-toggle-form");
    formCard = document.getElementById("form-card");
    searchInput = document.getElementById("search-eleves");

    if (formEleve) {
        formEleve.addEventListener("submit", onFormEleveSubmit);
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
            const terme = searchInput.value.toLowerCase();
            tbody.querySelectorAll("tr").forEach(function (tr) {
                tr.style.display = tr.textContent.toLowerCase().includes(terme) ? "" : "none";
            });
        });
    }
}

/** Message d'erreur renvoyé par l'API ({ error }), ou le message de repli si le corps n'est pas du JSON. */
async function lireErreur(response, repli) {
    try {
        const corps = await response.json();
        return corps.error || repli;
    } catch {
        return repli;
    }
}

async function chargerEleves() {
    const response = await fetch("/api/scolaire/eleves");
    if (!response.ok) {
        afficherMessage(msgEleve, await lireErreur(response, "Impossible de charger les élèves."), "erreur");
        return;
    }
    const eleves = await response.json();

    tbody.innerHTML = "";

    if (eleves.length === 0) {
        const ligneVide = document.createElement("tr");
        ligneVide.innerHTML = htmlLigneVideEleves(NOMBRE_COLONNES);
        tbody.appendChild(ligneVide);
        return;
    }

    eleves.forEach(function (eleve) {
        const tr = document.createElement("tr");
        tr.setAttribute("data-id", eleve.id);
        tr.innerHTML = htmlLigneEleve(eleve);
        tbody.appendChild(tr);
    });
}

async function onFormEleveSubmit(event) {
    event.preventDefault();

    const data = {
        matricule: document.getElementById("matricule").value.trim(),
        nom: document.getElementById("nom").value.trim(),
        prenom: document.getElementById("prenom").value.trim(),
    };
    // Facultative : omise du corps quand le champ est vide
    const dateNaissance = document.getElementById("date-naissance").value;
    if (dateNaissance) {
        data.dateNaissance = dateNaissance;
    }

    const response = await fetch("/api/scolaire/eleves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        afficherMessage(msgEleve, "Élève ajouté avec succès !", "succes");
        formEleve.reset();
        formCard.classList.add("hidden");
        chargerEleves();
    } else {
        afficherMessage(msgEleve, await lireErreur(response, "Erreur."), "erreur");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initDOMElements();
    chargerEleves();
    activerTriTableau("table-eleves");
});
