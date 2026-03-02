// === GESTION DES SALLES ===

const formSalle = document.getElementById("form-salle");
const msgSalle = document.getElementById("msg-salle");
const tbody = document.querySelector("#table-salles tbody");
const btnToggle = document.getElementById("btn-toggle-form");
const formCard = document.getElementById("form-card");
const searchInput = document.getElementById("search-salles");

// Toggle formulaire
btnToggle.addEventListener("click", function () {
    formCard.classList.toggle("hidden");
});

// Recherche
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

formSalle.addEventListener("submit", async function (event) {
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
});

window.modifierSalle = function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    var ancien = document.getElementById("modale-modifier");
    if (ancien) ancien.remove();

    var modale = document.createElement("div");
    modale.id = "modale-modifier";
    modale.className = "modale-overlay";
    modale.innerHTML =
        '<div class="modale-contenu">' +
            '<h3>Modifier la salle</h3>' +
            '<div class="modale-champ"><label>Nom de la salle</label><input type="text" id="mod-code" value="' + (tr.getAttribute("data-code") || '') + '"></div>' +
            '<div class="modale-champ"><label>Type</label><input type="text" id="mod-type" value="' + (tr.getAttribute("data-type") || '') + '"></div>' +
            '<div class="modale-champ"><label>Capacité</label><input type="number" id="mod-capacite" value="' + (tr.getAttribute("data-capacite") || '') + '"></div>' +
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
            code: document.getElementById("mod-code").value,
            type: document.getElementById("mod-type").value,
            capacite: parseInt(document.getElementById("mod-capacite").value),
        };
        var response = await fetch("/api/salles/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        modale.remove();
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

chargerSalles();
