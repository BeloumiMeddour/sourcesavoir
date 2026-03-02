// === ADMINISTRATION - GESTION DES COMPTES ===

const formUtilisateur = document.getElementById("form-utilisateur");
const msgAdmin = document.getElementById("msg-admin");
const tbody = document.querySelector("#table-utilisateurs tbody");
const btnToggle = document.getElementById("btn-toggle-form");
const formCard = document.getElementById("form-card");
const searchInput = document.getElementById("search-users");

// Toggle formulaire
btnToggle.addEventListener("click", function () {
    formCard.classList.toggle("hidden");
});

// Recherche
searchInput.addEventListener("input", function () {
    const terme = searchInput.value.toLowerCase();
    const lignes = tbody.querySelectorAll("tr");
    lignes.forEach(function (tr) {
        tr.style.display = tr.textContent.toLowerCase().includes(terme) ? "" : "none";
    });
});

// Afficher un message
function afficherMessage(element, texte, type) {
    element.innerText = texte;
    element.className = "message " + type;
    setTimeout(function () { element.innerText = ""; element.className = "message"; }, 5000);
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
        tr.setAttribute("data-id", u.id);
        tr.setAttribute("data-email", u.email);
        tr.setAttribute("data-role", u.role);
        tr.setAttribute("data-nom", u.nom || "");
        tr.setAttribute("data-prenom", u.prenom || "");
        tr.innerHTML =
            "<td>" + nomComplet.trim() + "</td>" +
            "<td>" + u.email + "</td>" +
            "<td>" + u.role + "</td>" +
            "<td>" + dateCreation + "</td>" +
            '<td><div class="actions-cell">' +
                '<button class="btn btn-modifier" onclick="modifierRole(' + u.id + ')">Modifier</button>' +
                '<button class="btn btn-supprimer" onclick="supprimerUtilisateur(' + u.id + ')">Supprimer</button>' +
            '</div></td>';
        tbody.appendChild(tr);
    });
}

// Créer un utilisateur
formUtilisateur.addEventListener("submit", async function (event) {
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
});

// Modifier le rôle
window.modifierRole = function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    var ancien = document.getElementById("modale-modifier");
    if (ancien) ancien.remove();

    var modale = document.createElement("div");
    modale.id = "modale-modifier";
    modale.className = "modale-overlay";
    modale.innerHTML =
        '<div class="modale-contenu">' +
            '<h3>Modifier l\'utilisateur</h3>' +
            '<div class="modale-champ"><label>Email</label><input type="email" id="mod-email" value="' + (tr.getAttribute("data-email") || '') + '"></div>' +
            '<div class="modale-champ"><label>Nom</label><input type="text" id="mod-nom" value="' + (tr.getAttribute("data-nom") || '') + '"></div>' +
            '<div class="modale-champ"><label>Prénom</label><input type="text" id="mod-prenom" value="' + (tr.getAttribute("data-prenom") || '') + '"></div>' +
            '<div class="modale-champ"><label>Rôle</label>' +
                '<select id="mod-role">' +
                    '<option value="user"' + (tr.getAttribute("data-role") === 'user' ? ' selected' : '') + '>user</option>' +
                    '<option value="responsable"' + (tr.getAttribute("data-role") === 'responsable' ? ' selected' : '') + '>responsable</option>' +
                    '<option value="admin"' + (tr.getAttribute("data-role") === 'admin' ? ' selected' : '') + '>admin</option>' +
                '</select>' +
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
        modale.remove();
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

chargerUtilisateurs();
