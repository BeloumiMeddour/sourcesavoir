// === GESTION DES AFFECTATIONS ===

var formAffectation = document.getElementById("form-affectation");
var msgAffectation = document.getElementById("msg-affectation");
var tbody = document.querySelector("#table-affectations tbody");
var selectCours = document.getElementById("id_cours");
var selectSalle = document.getElementById("id_salle");
var selectHeureDebut = document.getElementById("heureDebut");
var selectHeureFin = document.getElementById("heureFin");

// --- Afficher un message (succès ou erreur) ---
function afficherMessage(element, texte, type) {
    element.innerText = texte;
    element.className = "message " + type;
    setTimeout(function () { element.innerText = ""; element.className = "message"; }, 5000);
}

// --- Charger les cours dans le menu déroulant ---
async function chargerSelectCours() {
    var response = await fetch("/api/cours");
    var cours = await response.json();

    cours.forEach(function (c) {
        var option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.code + " - " + c.nom;
        selectCours.appendChild(option);
    });
}

// --- Charger les salles dans le menu déroulant ---
async function chargerSelectSalles() {
    var response = await fetch("/api/salles");
    var salles = await response.json();

    salles.forEach(function (s) {
        var option = document.createElement("option");
        option.value = s.id;
        option.textContent = s.code + " (" + s.type + ")";
        selectSalle.appendChild(option);
    });
}

// --- Charger la liste des professeurs ---
async function chargerProfesseurs() {
    var response = await fetch("/api/professeurs");
    var professeurs = await response.json();
    return professeurs;
}

// --- Charger et afficher la liste des affectations ---
async function chargerAffectations() {
    var response = await fetch("/api/affectations");
    var affectations = await response.json();
    var professeurs = await chargerProfesseurs();

    tbody.innerHTML = "";

    affectations.forEach(function (a) {
        var tr = document.createElement("tr");
        var dateStr = new Date(a.date).toLocaleDateString("fr-CA");
        var profNom = a.professeur ? a.professeur.prenom + " " + a.professeur.nom : "—";

        // Si pas de professeur assigné, afficher un select pour en choisir un
        var profCell = "";
        if (!a.id_professeur) {
            profCell = '<select class="select-prof" data-id="' + a.id + '">';
            profCell += '<option value="">-- Choisir --</option>';
            professeurs.forEach(function (p) {
                profCell += '<option value="' + p.id + '">' + p.prenom + ' ' + p.nom + '</option>';
            });
            profCell += '</select> ';
            profCell += '<button class="btn btn-assigner" onclick="assignerProf(' + a.id + ')">Assigner</button>';
        } else {
            profCell = profNom;
        }

        // Stocker les données dans les attributs pour la modification
        tr.setAttribute("data-id", a.id);
        tr.setAttribute("data-id_cours", a.id_cours);
        tr.setAttribute("data-id_salle", a.id_salle);
        tr.setAttribute("data-id_professeur", a.id_professeur || "");
        tr.setAttribute("data-date", a.date.split("T")[0]);
        tr.setAttribute("data-plage", a.plageHoraire);

        tr.innerHTML =
            '<td>' + (a.cours ? a.cours.code + ' - ' + a.cours.nom : '') + '</td>' +
            '<td>' + (a.salle ? a.salle.code : '') + '</td>' +
            '<td>' + profCell + '</td>' +
            '<td>' + dateStr + '</td>' +
            '<td>' + a.plageHoraire + '</td>' +
            '<td><div class="actions-cell">' +
                '<button class="btn btn-modifier" onclick="modifierAffectation(' + a.id + ')">Modifier</button>' +
                '<button class="btn btn-supprimer" onclick="supprimerAffectation(' + a.id + ')">Supprimer</button>' +
            '</div></td>';

        tbody.appendChild(tr);
    });
}

// --- Créer une nouvelle affectation (soumettre le formulaire) ---
formAffectation.addEventListener("submit", async function (event) {
    event.preventDefault();

    var debut = selectHeureDebut.value;
    var fin = selectHeureFin.value;

    // Vérifier que les heures sont valides
    if (!debut || !fin) {
        afficherMessage(msgAffectation, "Veuillez sélectionner une plage horaire complète.", "erreur");
        return;
    }
    if (debut >= fin) {
        afficherMessage(msgAffectation, "L'heure de fin doit être après l'heure de début.", "erreur");
        return;
    }

    var data = {
        id_cours: parseInt(selectCours.value),
        id_salle: parseInt(selectSalle.value),
        date: document.getElementById("date").value,
        plageHoraire: debut + "-" + fin,
    };

    var response = await fetch("/api/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        afficherMessage(msgAffectation, "Cours affecté avec succès !", "succes");
        formAffectation.reset();
        chargerAffectations();
    } else {
        var err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de l'affectation.", "erreur");
    }
});

// --- Assigner un professeur à une affectation ---
window.assignerProf = async function (idAffectation) {
    var select = document.querySelector('.select-prof[data-id="' + idAffectation + '"]');
    var idProf = select ? select.value : null;

    if (!idProf) {
        afficherMessage(msgAffectation, "Veuillez choisir un professeur.", "erreur");
        return;
    }

    var response = await fetch("/api/affectations/" + idAffectation + "/professeur", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_professeur: parseInt(idProf) }),
    });

    if (response.ok) {
        afficherMessage(msgAffectation, "Professeur assigné avec succès !", "succes");
        chargerAffectations();
    } else {
        var err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de l'assignation.", "erreur");
    }
};

// --- Supprimer une affectation ---
window.supprimerAffectation = async function (id) {
    if (!confirm("Voulez-vous vraiment supprimer cette affectation ?")) return;

    var response = await fetch("/api/affectations/" + id, { method: "DELETE" });

    if (response.ok) {
        afficherMessage(msgAffectation, "Affectation supprimée avec succès !", "succes");
        chargerAffectations();
    } else {
        var err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de la suppression.", "erreur");
    }
};

// --- Remplir un <select> avec des options ---
function remplirSelect(select, items, valeurActuelle, getText) {
    select.innerHTML = "";
    items.forEach(function (item) {
        var opt = document.createElement("option");
        opt.value = item.id;
        opt.textContent = getText(item);
        if (item.id == valeurActuelle) opt.selected = true;
        select.appendChild(opt);
    });
}

// --- Remplir un <select> d'heures ---
function remplirSelectHeures(select, label, valeurActuelle) {
    var heures = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
        "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
        "16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
    select.innerHTML = '<option value="">' + label + '</option>';
    heures.forEach(function (h) {
        var opt = document.createElement("option");
        opt.value = h;
        opt.textContent = h;
        if (h === valeurActuelle) opt.selected = true;
        select.appendChild(opt);
    });
}

// --- Modifier une affectation (ouvre la modale) ---
window.modifierAffectation = async function (id) {
    var tr = document.querySelector('tr[data-id="' + id + '"]');
    if (!tr) return;

    // Charger les listes
    var resCours = await fetch("/api/cours");
    var coursList = await resCours.json();
    var resSalles = await fetch("/api/salles");
    var sallesList = await resSalles.json();
    var resProfs = await fetch("/api/professeurs");
    var profsList = await resProfs.json();

    // Lire les valeurs actuelles
    var currentPlage = (tr.getAttribute("data-plage") || "").split("-");

    // Remplir les selects de la modale
    remplirSelect(document.getElementById("mod-cours"), coursList, tr.getAttribute("data-id_cours"),
        function (c) { return c.code + " - " + c.nom; });
    remplirSelect(document.getElementById("mod-salle"), sallesList, tr.getAttribute("data-id_salle"),
        function (s) { return s.code + " (" + s.type + ")"; });

    // Professeur (avec option vide)
    var modProf = document.getElementById("mod-prof");
    modProf.innerHTML = '<option value="">-- Aucun --</option>';
    profsList.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.prenom + " " + p.nom;
        if (p.id == tr.getAttribute("data-id_professeur")) opt.selected = true;
        modProf.appendChild(opt);
    });

    // Date et heures
    document.getElementById("mod-id").value = id;
    document.getElementById("mod-date").value = tr.getAttribute("data-date");
    remplirSelectHeures(document.getElementById("mod-debut"), "Début", currentPlage[0] || "");
    remplirSelectHeures(document.getElementById("mod-fin"), "Fin", currentPlage[1] || "");

    // Afficher la modale
    document.getElementById("modale-modifier").style.display = "";
};

// --- Fermer la modale ---
document.getElementById("mod-annuler").onclick = function () {
    document.getElementById("modale-modifier").style.display = "none";
};
document.getElementById("modale-modifier").addEventListener("click", function (e) {
    if (e.target === this) this.style.display = "none";
});

// --- Valider la modification ---
document.getElementById("mod-valider").onclick = async function () {
    var debut = document.getElementById("mod-debut").value;
    var fin = document.getElementById("mod-fin").value;
    var id = document.getElementById("mod-id").value;

    if (!debut || !fin) { alert("Plage horaire incomplète."); return; }
    if (debut >= fin) { alert("L'heure de fin doit être après l'heure de début."); return; }

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
    document.getElementById("modale-modifier").style.display = "none";

    if (response.ok) {
        afficherMessage(msgAffectation, "Affectation modifiée avec succès !", "succes");
        chargerAffectations();
    } else {
        var err = await response.json();
        afficherMessage(msgAffectation, err.error || "Erreur lors de la modification.", "erreur");
    }
};

// --- Démarrage : charger les données ---
chargerSelectCours();
chargerSelectSalles();
chargerAffectations();
