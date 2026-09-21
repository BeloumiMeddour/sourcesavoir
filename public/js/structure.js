// === ANNÉES, NIVEAUX ET GROUPES ===
// Listes et créations via /api/scolaire/annees, /niveaux et /groupes (rôles admin et responsable).
// Les droits sont vérifiés par le serveur : cette page n'en décide aucun.

import { afficherMessage, activerTriTableau } from './utils.js';
import {
    htmlLigneAnnee, htmlLigneNiveau, htmlLigneGroupe, htmlLigneVide, htmlOptionsSelect,
} from './rendu.js';

const CHOISIR = '<option value="">-- Choisir --</option>';

let annees = [];
let niveaux = [];

/** Message d'erreur renvoyé par l'API ({ error }), ou le message de repli si le corps n'est pas du JSON. */
async function lireErreur(response, repli) {
    try {
        const corps = await response.json();
        return corps.error || repli;
    } catch {
        return repli;
    }
}

/** Lit une liste de l'API ; en cas d'échec, affiche l'erreur et renvoie une liste vide. */
async function lireListe(url, elementMessage, repli) {
    const response = await fetch(url);
    if (!response.ok) {
        afficherMessage(elementMessage, await lireErreur(response, repli), "erreur");
        return [];
    }
    return response.json();
}

/** Remplit un tableau : une ligne par élément, ou la ligne « vide » avec sa consigne. */
function remplirTableau(idTableau, elements, htmlLigne, nombreColonnes, titreVide) {
    const tbody = document.querySelector("#" + idTableau + " tbody");
    tbody.innerHTML = "";

    if (elements.length === 0) {
        const ligneVide = document.createElement("tr");
        ligneVide.innerHTML = htmlLigneVide(nombreColonnes, titreVide, "Ajoutez-en un avec le formulaire ci-dessus.");
        tbody.appendChild(ligneVide);
        return;
    }

    elements.forEach(function (element) {
        const tr = document.createElement("tr");
        tr.setAttribute("data-id", element.id);
        tr.innerHTML = htmlLigne(element);
        tbody.appendChild(tr);
    });
}

/** Remplit une liste déroulante en gardant le choix courant s'il existe encore. */
function remplirSelect(idSelect, elements, libelle) {
    const select = document.getElementById(idSelect);
    const courant = select.value;
    select.innerHTML = CHOISIR + htmlOptionsSelect(elements, libelle);
    select.value = courant;
    if (select.value !== courant) {
        select.value = "";
    }
}

function rafraichirListesDeChoix() {
    remplirSelect("groupe-annee", annees, function (a) { return a.libelle; });
    remplirSelect("groupe-niveau", niveaux, function (n) { return n.code + " — " + n.libelle; });
}

async function chargerAnnees() {
    annees = await lireListe("/api/scolaire/annees", document.getElementById("msg-annee"), "Impossible de charger les années.");
    remplirTableau("table-annees", annees, htmlLigneAnnee, 3, "Aucune année");
    rafraichirListesDeChoix();
}

async function chargerNiveaux() {
    niveaux = await lireListe("/api/scolaire/niveaux", document.getElementById("msg-niveau"), "Impossible de charger les niveaux.");
    remplirTableau("table-niveaux", niveaux, htmlLigneNiveau, 3, "Aucun niveau");
    rafraichirListesDeChoix();
}

async function chargerGroupes() {
    const groupes = await lireListe("/api/scolaire/groupes", document.getElementById("msg-groupe"), "Impossible de charger les groupes.");
    remplirTableau("table-groupes", groupes, htmlLigneGroupe, 4, "Aucun groupe");
}

/** Envoie un formulaire en JSON ; en cas de succès, le vide et recharge la liste. */
async function envoyer(url, corps, formulaire, elementMessage, messageSucces, recharger) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
    });

    if (response.ok) {
        afficherMessage(elementMessage, messageSucces, "succes");
        formulaire.reset();
        recharger();
    } else {
        afficherMessage(elementMessage, await lireErreur(response, "Erreur."), "erreur");
    }
}

/** Valeur numérique d'un champ, ou undefined s'il est vide (le serveur signalera le champ manquant). */
function nombreOuVide(id) {
    const valeur = document.getElementById(id).value;
    return valeur === "" ? undefined : Number(valeur);
}

function onFormAnneeSubmit(event) {
    event.preventDefault();
    envoyer("/api/scolaire/annees", {
        libelle: document.getElementById("annee-libelle").value.trim(),
        dateDebut: document.getElementById("annee-debut").value,
        dateFin: document.getElementById("annee-fin").value,
    }, event.target, document.getElementById("msg-annee"), "Année ajoutée avec succès !", chargerAnnees);
}

function onFormNiveauSubmit(event) {
    event.preventDefault();
    envoyer("/api/scolaire/niveaux", {
        code: document.getElementById("niveau-code").value.trim(),
        libelle: document.getElementById("niveau-libelle").value.trim(),
        ordre: nombreOuVide("niveau-ordre"),
    }, event.target, document.getElementById("msg-niveau"), "Niveau ajouté avec succès !", chargerNiveaux);
}

function onFormGroupeSubmit(event) {
    event.preventDefault();
    const corps = {
        code: document.getElementById("groupe-code").value.trim(),
        id_annee: nombreOuVide("groupe-annee"),
        id_niveau: nombreOuVide("groupe-niveau"),
    };
    // Facultative : omise du corps quand le champ est vide
    const capacite = nombreOuVide("groupe-capacite");
    if (capacite !== undefined) {
        corps.capacite = capacite;
    }
    envoyer("/api/scolaire/groupes", corps, event.target, document.getElementById("msg-groupe"),
        "Groupe ajouté avec succès !", chargerGroupes);
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("form-annee").addEventListener("submit", onFormAnneeSubmit);
    document.getElementById("form-niveau").addEventListener("submit", onFormNiveauSubmit);
    document.getElementById("form-groupe").addEventListener("submit", onFormGroupeSubmit);

    chargerAnnees();
    chargerNiveaux();
    chargerGroupes();

    activerTriTableau("table-annees");
    activerTriTableau("table-niveaux");
    activerTriTableau("table-groupes");
});
