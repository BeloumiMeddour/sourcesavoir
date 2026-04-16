// === ADMINISTRATION - GESTION DES COMPTES ===

import { afficherMessage, activerTriTableau } from './utils.js';

let formUtilisateur;
let msgAdmin;
let tbody;
let btnToggle;
let formCard;
let searchInput;
let modale;

function initDOMElements() {
    formUtilisateur = document.getElementById("form-utilisateur");
    msgAdmin = document.getElementById("msg-admin");
    tbody = document.querySelector("#table-utilisateurs tbody");
    btnToggle = document.getElementById("btn-toggle-form");
    formCard = document.getElementById("form-card");
    searchInput = document.getElementById("search-users");
    modale = document.getElementById("modale-modifier");
    if (modale) {
        document.getElementById("mod-annuler").onclick = fermerModale;
        modale.addEventListener("click", function (e) { if (e.target === modale) fermerModale(); });
    }
    if (formUtilisateur) {
        formUtilisateur.addEventListener("submit", onFormUtilisateurSubmit);
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
            const lignes = tbody.querySelectorAll("tr");
            lignes.forEach(function (tr) {
                tr.style.display = tr.textContent.toLowerCase().includes(terme) ? "" : "none";
            });
        });
    }
}

// Charger la liste des utilisateurs
async function chargerUtilisateurs() {
    const response = await fetch("/api/utilisateurs");
    const utilisateurs = await response.json();

    tbody.innerHTML = "";

    utilisateurs.forEach(function (u) {
        const tr = document.createElement("tr");
        const dateCreation = new Date(u.createdAt).toLocaleDateString("fr-CA");
        const nomComplet = (u.prenom || "") + " " + (u.nom || "");
        const etat = u.etat || "valide";
        const etatBadge = etat === "valide"
            ? '<span class="badge badge-valide">Validé</span>'
            : '<span class="badge badge-attente">En attente</span>';
        const btnValider = (etat === "en_attente")
            ? '<button class="btn btn-vert btn-petit" onclick="validerCompte(' + u.id + ')">Valider</button>'
            : '';
        tr.setAttribute("data-id", u.id);
        tr.setAttribute("data-email", u.email);
        tr.setAttribute("data-role", u.role);
        tr.setAttribute("data-nom", u.nom || "");
        tr.setAttribute("data-prenom", u.prenom || "");
        tr.innerHTML =
            "<td>" + nomComplet.trim() + "</td>" +
            "<td>" + u.email + "</td>" +
            "<td>" + u.role + "</td>" +
            "<td>" + etatBadge + "</td>" +
            "<td>" + dateCreation + "</td>" +
            '<td><div class="actions-cell">' +
                btnValider +
                '<button class="btn btn-modifier" onclick="modifierRole(' + u.id + ')">Modifier</button>' +
                '<button class="btn btn-supprimer" onclick="supprimerUtilisateur(' + u.id + ')">Supprimer</button>' +
            '</div></td>';
        tbody.appendChild(tr);
    });
}

// Créer un utilisateur
async function onFormUtilisateurSubmit(event) {
    event.preventDefault();

    const data = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value,
    };

    const response = await fetch("/api/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        afficherMessage(msgAdmin, "Utilisateur créé avec succès !", "succes");
        formUtilisateur.reset();
        formCard.classList.add("hidden");
        chargerUtilisateurs();
    } else if (response.status === 409) {
        afficherMessage(msgAdmin, "Un utilisateur avec cet email existe déjà.", "erreur");
    } else {
        var err = await response.json();
        afficherMessage(msgAdmin, err.error || "Erreur lors de la création.", "erreur");
    }
}

// Fermer la modale
function fermerModale() {
    modale.style.display = "none";
}

// Modifier un utilisateur
window.modifierRole = function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    document.getElementById("mod-email").value = tr.getAttribute("data-email") || "";
    document.getElementById("mod-nom").value = tr.getAttribute("data-nom") || "";
    document.getElementById("mod-prenom").value = tr.getAttribute("data-prenom") || "";
    document.getElementById("mod-role").value = tr.getAttribute("data-role") || "user";

    modale.style.display = "flex";

    document.getElementById("mod-valider").onclick = async function () {
        var data = {
            email: document.getElementById("mod-email").value,
            nom: document.getElementById("mod-nom").value,
            prenom: document.getElementById("mod-prenom").value,
            role: document.getElementById("mod-role").value,
        };
        var response = await fetch("/api/utilisateurs/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        fermerModale();
        if (response.ok) {
            afficherMessage(msgAdmin, "Utilisateur modifié avec succès !", "succes");
            chargerUtilisateurs();
        } else {
            var err = await response.json();
            afficherMessage(msgAdmin, err.error || "Erreur.", "erreur");
        }
    };
};

// Supprimer un utilisateur
window.supprimerUtilisateur = async function (id) {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;

    var response = await fetch("/api/utilisateurs/" + id, { method: "DELETE" });

    if (response.ok) {
        afficherMessage(msgAdmin, "Utilisateur supprimé avec succès !", "succes");
        chargerUtilisateurs();
    } else {
        var err = await response.json();
        afficherMessage(msgAdmin, err.error || "Erreur.", "erreur");
    }
};

// Valider un compte utilisateur
window.validerCompte = async function (id) {
    if (!confirm("Voulez-vous valider ce compte utilisateur ?")) return;

    var response = await fetch("/api/utilisateurs/" + id + "/valider", {
        method: "PUT",
    });

    if (response.ok) {
        afficherMessage(msgAdmin, "Compte validé avec succès !", "succes");
        chargerUtilisateurs();
    } else {
        var err = await response.json();
        afficherMessage(msgAdmin, err.error || "Erreur lors de la validation.", "erreur");
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initDOMElements();
    chargerUtilisateurs();
});
activerTriTableau("table-utilisateurs");
