// === GESTION DES PROFESSEURS ===

const formProfesseur = document.getElementById("form-professeur");
const msgProfesseur = document.getElementById("msg-professeur");
const tbody = document.querySelector("#table-professeurs tbody");
const btnToggle = document.getElementById("btn-toggle-form");
const formCard = document.getElementById("form-card");
const searchInput = document.getElementById("search-profs");

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

function afficherMessage(element, texte, type) {
    element.innerText = texte;
    element.className = "message " + type;
    setTimeout(function () { element.innerText = ""; element.className = "message"; }, 5000);
}

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

window.modifierProfesseur = function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    // Supprimer une modale existante
    var ancien = document.getElementById("modale-modifier");
    if (ancien) ancien.remove();

    var modale = document.createElement("div");
    modale.id = "modale-modifier";
    modale.className = "modale-overlay";
    modale.innerHTML =
        '<div class="modale-contenu">' +
            '<h3>Modifier le professeur</h3>' +
            '<div class="modale-champ"><label>Matricule</label><input type="text" id="mod-matricule" value="' + (tr.getAttribute("data-matricule") || '') + '"></div>' +
            '<div class="modale-champ"><label>Nom</label><input type="text" id="mod-nom" value="' + (tr.getAttribute("data-nom") || '') + '"></div>' +
            '<div class="modale-champ"><label>Prénom</label><input type="text" id="mod-prenom" value="' + (tr.getAttribute("data-prenom") || '') + '"></div>' +
            '<div class="modale-champ"><label>Spécialité</label><input type="text" id="mod-specialite" value="' + (tr.getAttribute("data-specialite") || '') + '"></div>' +
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
        modale.remove();
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

chargerProfesseurs();
