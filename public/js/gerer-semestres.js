// === GESTION DES SEMESTRES ET JOURS FÉRIÉS ===

import { afficherMessage } from './utils.js';

var semestres = [];
var joursFeeries = [];
var semestreActif = null;

// --- Éléments du DOM ---

var formSemestreCard;
var formSemestre;
var semestreId;
var nomSemestre;
var dateDebut;
var dateFin;
var msgSemestre;
var tableSemestres;
var btnToggleSemestreForm;
var btnCancelSemestre;

var jourfterieFormContainer;
var formJourFerie;
var semestreIdFerie;
var dateFerie;
var descriptionFerie;
var tableJoursFeeries;
var btnCancelFerie;
var ferieSemestreName;

function initDOMElements() {
    formSemestreCard = document.getElementById("form-semestre-card");
    formSemestre = document.getElementById("form-semestre");
    semestreId = document.getElementById("semestre-id");
    nomSemestre = document.getElementById("nom-semestre");
    dateDebut = document.getElementById("date-debut");
    dateFin = document.getElementById("date-fin");
    msgSemestre = document.getElementById("msg-semestre");
    tableSemestres = document.getElementById("table-semestres").querySelector("tbody");
    btnToggleSemestreForm = document.getElementById("btn-toggle-semestre-form");
    btnCancelSemestre = document.getElementById("btn-cancel-semestre");

    jourfterieFormContainer = document.getElementById("jourferie-form-container");
    formJourFerie = document.getElementById("form-jour-ferie");
    semestreIdFerie = document.getElementById("semestre-id-ferie");
    dateFerie = document.getElementById("date-ferie");
    descriptionFerie = document.getElementById("description-ferie");
    tableJoursFeeries = document.getElementById("table-jours-feries").querySelector("tbody");
    btnCancelFerie = document.getElementById("btn-cancel-ferie");
    ferieSemestreName = document.getElementById("ferie-semestre-name");
    
    // Attach listeners
    btnToggleSemestreForm.addEventListener("click", function() {
        resetSemestreForm();
        formSemestreCard.classList.remove("hidden");
    });
    
    btnCancelSemestre.addEventListener("click", resetSemestreForm);
    btnCancelFerie.addEventListener("click", function() {
        jourfterieFormContainer.style.display = "none";
        semestreActif = null;
    });
    
    formSemestre.addEventListener("submit", sauvegarderSemestre);
    formJourFerie.addEventListener("submit", sauvegarderJourFerie);
}

// --- Utilitaires ---

// Parser une date API (UTC) en date locale sans décalage
function parseAPIDate(dateStr) {
    if (!dateStr) return null;
    var parts = String(dateStr).split('T')[0].split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function formatDate(dateStr) {
    var date = parseAPIDate(dateStr);
    return date.toLocaleDateString("fr-CA");
}

function formatDateInput(dateStr) {
    return String(dateStr).split("T")[0];
}

// --- Gestion des Semestres ---

async function chargerSemestres() {
    try {
        var res = await fetch("/api/semestres");
        semestres = await res.json();
        afficherSemestres();
    } catch (error) {
        afficherMessage(msgSemestre, "Erreur: " + error.message, "error");
    }
}

function afficherSemestres() {
    tableSemestres.innerHTML = "";
    
    semestres.forEach(function(sem) {
        var tr = document.createElement("tr");
        
        var dateDebut = formatDate(sem.dateDebut);
        var dateFin = formatDate(sem.dateFin);
        var joursCount = (sem.joursFeeries ? sem.joursFeeries.length : 0);
        
        tr.innerHTML = `
            <td>${sem.nom}</td>
            <td>${dateDebut}</td>
            <td>${dateFin}</td>
            <td>
                <button class="btn btn-petit btn-bleu" data-action="manage-feries" data-id="${sem.id}">
                    ${joursCount} jour${joursCount !== 1 ? 's' : ''} - Gérer
                </button>
            </td>
            <td>
                <button class="btn btn-modifier" data-action="edit" data-id="${sem.id}">Modifier</button>
                <button class="btn btn-supprimer" data-action="delete" data-id="${sem.id}">Supprimer</button>
            </td>
        `;
        tableSemestres.appendChild(tr);
    });

    // Ajouter les event listeners
    tableSemestres.querySelectorAll("button").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            var action = this.dataset.action;
            var id = parseInt(this.dataset.id);
            
            if (action === "edit") editSemestre(id);
            else if (action === "delete") deleteSemestre(id);
            else if (action === "manage-feries") afficherFormulaireJoursFeries(id);
        });
    });
}

function editSemestre(id) {
    var sem = semestres.find(s => s.id === id);
    if (!sem) return;
    
    semestreId.value = sem.id;
    nomSemestre.value = sem.nom;
    dateDebut.value = formatDateInput(sem.dateDebut);
    dateFin.value = formatDateInput(sem.dateFin);
    document.getElementById("form-semestre-title").textContent = "Modifier Semestre";
    formSemestreCard.classList.remove("hidden");
}

function resetSemestreForm() {
    semestreId.value = "";
    nomSemestre.value = "";
    dateDebut.value = "";
    dateFin.value = "";
    document.getElementById("form-semestre-title").textContent = "Créer un Semestre";
    formSemestreCard.classList.add("hidden");
}

async function sauvegarderSemestre(e) {
    e.preventDefault();
    
    var idValue = semestreId.value ? parseInt(semestreId.value) : null;
    var data = {
        nom: nomSemestre.value,
        dateDebut: dateDebut.value,
        dateFin: dateFin.value
    };
    
    try {
        var method = idValue ? "PUT" : "POST";
        var url = idValue ? `/api/semestres/${idValue}` : "/api/semestres";
        
        var res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) {
            var errorData = await res.json();
            throw new Error(errorData.error || "Erreur lors de la sauvegarde");
        }
        
        afficherMessage(msgSemestre, 
            idValue ? "Semestre modifié avec succès" : "Semestre créé avec succès", 
            "success"
        );
        resetSemestreForm();
        chargerSemestres();
        
    } catch (error) {
        afficherMessage(msgSemestre, "Erreur: " + error.message, "error");
    }
}

async function deleteSemestre(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce semestre et tous ses jours fériés?")) {
        return;
    }
    
    try {
        var res = await fetch(`/api/semestres/${id}`, { method: "DELETE" });
        
        if (!res.ok) {
            var errorData = await res.json();
            throw new Error(errorData.error || "Erreur lors de la suppression");
        }
        
        afficherMessage(msgSemestre, "Semestre supprimé avec succès", "success");
        chargerSemestres();
        
    } catch (error) {
        afficherMessage(msgSemestre, "Erreur: " + error.message, "error");
    }
}

// --- Gestion des Jours Fériés ---

async function afficherFormulaireJoursFeries(id_semestre) {
    semestreActif = id_semestre;
    var semestre = semestres.find(s => s.id === id_semestre);
    
    if (!semestre) return;
    
    semestreIdFerie.value = id_semestre;
    ferieSemestreName.textContent = `Jours fériés - ${semestre.nom}`;
    jourfterieFormContainer.style.display = "block";
    
    // Limiter les dates possibles au semestre
    dateFerie.min = formatDateInput(semestre.dateDebut);
    dateFerie.max = formatDateInput(semestre.dateFin);
    
    chargerJoursFeeries(id_semestre);
    
    // Scroll vers le formulaire
    jourfterieFormContainer.scrollIntoView({ behavior: "smooth" });
}

async function chargerJoursFeeries(id_semestre) {
    try {
        var res = await fetch(`/api/semestres/${id_semestre}/jours-feries`);
        joursFeeries = await res.json();
        afficherJoursFeeries();
    } catch (error) {
        console.error("Erreur:", error);
    }
}

function afficherJoursFeeries() {
    tableJoursFeeries.innerHTML = "";
    
    joursFeeries.forEach(function(jf) {
        var tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formatDate(jf.date)}</td>
            <td>${jf.description}</td>
            <td>
                <button class="btn btn-supprimer" data-action="delete-ferie" data-id="${jf.id}">Supprimer</button>
            </td>
        `;
        tableJoursFeeries.appendChild(tr);
    });

    // Ajouter les event listeners
    tableJoursFeeries.querySelectorAll("button").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            var id = parseInt(this.dataset.id);
            deleteJourFerie(id);
        });
    });
}

async function sauvegarderJourFerie(e) {
    e.preventDefault();
    
    var id_semestre = semestreIdFerie.value ? parseInt(semestreIdFerie.value) : null;
    
    if (!id_semestre) {
        afficherMessage(msgSemestre, "Erreur: Semestre non valide", "error");
        return;
    }
    
    var data = {
        date: dateFerie.value,
        description: descriptionFerie.value
    };
    
    try {
        var res = await fetch(`/api/semestres/${id_semestre}/jours-feries`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) {
            var errorData = await res.json();
            throw new Error(errorData.error || "Erreur lors de l'ajout");
        }
        
        afficherMessage(msgSemestre, "Jour férié ajouté avec succès", "success");
        // Réinitialiser et recharger
        dateFerie.value = "";
        descriptionFerie.value = "";
        chargerJoursFeeries(id_semestre);
        
    } catch (error) {
        afficherMessage(msgSemestre, "Erreur: " + error.message, "error");
    }
}

async function deleteJourFerie(id) {
    if (!confirm("Supprimer ce jour férié?")) {
        return;
    }
    
    try {
        var res = await fetch(`/api/jours-feries/${id}`, { method: "DELETE" });
        
        if (!res.ok) {
            var errorData = await res.json();
            throw new Error(errorData.error || "Erreur lors de la suppression");
        }
        
        chargerJoursFeeries(semestreActif);
        
    } catch (error) {
        alert("Erreur: " + error.message);
    }
}

// --- Event listeners are now attached in initDOMElements() ---

// --- Démarrage ---
document.addEventListener('DOMContentLoaded', function() {
    initDOMElements();
    chargerSemestres();
});
