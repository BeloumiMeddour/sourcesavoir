// === GESTION DES COURS ===

const formCours = document.getElementById("form-cours");
const msgCours = document.getElementById("msg-cours");
const tbody = document.querySelector("#table-cours tbody");
const btnToggle = document.getElementById("btn-toggle-form");
const formCard = document.getElementById("form-card");
const searchInput = document.getElementById("search-cours");

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

async function chargerCours() {
    var response = await fetch("/api/cours");
    var cours = await response.json();

    tbody.innerHTML = "";

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

formCours.addEventListener("submit", async function (event) {
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
});

window.modifierCours = function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    var ancien = document.getElementById("modale-modifier");
    if (ancien) ancien.remove();

    var modale = document.createElement("div");
    modale.id = "modale-modifier";
    modale.className = "modale-overlay";
    modale.innerHTML =
        '<div class="modale-contenu">' +
            '<h3>Modifier le cours</h3>' +
            '<div class="modale-champ"><label>Code</label><input type="text" id="mod-code" value="' + (tr.getAttribute("data-code") || '') + '"></div>' +
            '<div class="modale-champ"><label>Nom</label><input type="text" id="mod-nom" value="' + (tr.getAttribute("data-nom") || '') + '"></div>' +
            '<div class="modale-champ"><label>Durée (heures)</label><input type="number" id="mod-duree" value="' + (tr.getAttribute("data-duree") || '') + '"></div>' +
            '<div class="modale-champ"><label>Programme</label><input type="text" id="mod-programme" value="' + (tr.getAttribute("data-programme") || '') + '"></div>' +
            '<div class="modale-champ"><label>Étape (1-6)</label><input type="text" id="mod-etape" value="' + (tr.getAttribute("data-etape") || '') + '"></div>' +
            '<div class="modale-champ"><label>Type de salle</label><input type="text" id="mod-typesalle" value="' + (tr.getAttribute("data-typesalle") || '') + '"></div>' +
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
        modale.remove();
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

chargerCours();
