// === CONSTRUCTEURS DE HTML ===
// Fonctions pures (aucun accès à window ni à document) : importables dans le navigateur et sous Jest.
// Toute donnée venant de l'API, donc saisie par un utilisateur, est échappée à l'insertion :
// la CSP autorise 'unsafe-inline', une balise injectée dans un innerHTML s'exécuterait.

import { echapperHtml } from "./echapper.js";

/**
 * Paragraphe affiché quand le chargement d'un panneau échoue.
 * @param {string} message - message d'erreur (error.message)
 * @returns {string} HTML
 */
export function htmlErreurChargement(message) {
    return '<p class="info-text">Erreur de chargement (détail: ' + echapperHtml(message) + ')</p>';
}

/**
 * Grille « Charge de la salle » : 14 lignes (8 h à 21 h) x 7 jours.
 * @param {Object} courseMap - courseMap[heure][indiceJour] = { code, debut, fin, isStart } ou null
 * @param {string[]} jours - libellés des 7 colonnes (Lun ... Dim)
 * @returns {string} HTML
 */
export function htmlChargeSalle(courseMap, jours) {
    let html = '<div class="mini-planner-detail">' +
        '<div class="mini-planner-header">Charge de la salle</div>' +
        '<div class="mini-planner-grid-detail">';

    // Header avec les jours
    html += '<div class="mini-planner-cell mini-planner-hour">h</div>';
    jours.forEach(function (j) {
        html += '<div class="mini-planner-cell mini-planner-day-header">' + echapperHtml(j) + '</div>';
    });

    // Lignes horaires
    for (let h = 8; h < 22; h++) {
        html += '<div class="mini-planner-cell mini-planner-hour">' + h + 'h</div>';

        for (let d = 0; d < 7; d++) {
            const cell = courseMap[h][d];

            if (cell && cell.code) {
                if (cell.isStart) {
                    html += '<div class="mini-planner-cell mini-planner-slot occupied">' + echapperHtml(cell.code) + '</div>';
                } else {
                    html += '<div class="mini-planner-cell mini-planner-slot occupied"></div>';
                }
            } else {
                html += '<div class="mini-planner-cell mini-planner-slot available"></div>';
            }
        }
    }

    html += '</div></div>';
    return html;
}

/**
 * Grille « Planning semaine » d'un professeur : 14 lignes (8 h à 21 h) x 7 jours.
 * @param {Object} coursMap - coursMap["jourBackend-heure"] = { data: affectation, isStart, duration }
 * @param {Object} disposMap - disposMap["jourBackend-heure"] = plages de disponibilité (présent = disponible)
 * @param {string[]} jours - libellés des 7 colonnes (Lun ... Dim)
 * @param {number[]} indicesBackend - jour du backend (0 = dimanche) de chaque colonne d'affichage
 * @returns {string} HTML
 */
export function htmlPlanningProfesseur(coursMap, disposMap, jours, indicesBackend) {
    let html = '<div class="mini-planner-detail"><div class="mini-planner-header">Planning semaine</div>';
    html += '<div class="mini-planner-grid-detail">';

    // En-tête coin vide
    html += '<div class="mini-planner-cell mini-planner-hour"></div>';

    // En-têtes jours
    jours.forEach(function (j) {
        html += '<div class="mini-planner-cell mini-planner-day-header">' + echapperHtml(j) + '</div>';
    });

    // Lignes horaires
    for (let h = 8; h < 22; h++) {
        html += '<div class="mini-planner-cell mini-planner-hour">' + h + 'h</div>';

        for (let d = 0; d < 7; d++) {
            const key = indicesBackend[d] + "-" + h;
            const coursDuCreno = coursMap[key];
            const hasDispo = disposMap[key];

            // Orange = occupé, Vert = disponible, Gris = indisponible
            const slotClass = coursDuCreno ? "occupied" : (hasDispo ? "available" : "unavailable");

            html += '<div class="mini-planner-cell mini-planner-slot ' + slotClass + '">';
            if (coursDuCreno && coursDuCreno.isStart) {
                const entryData = coursDuCreno.data;
                html += entryData.cours ? echapperHtml(entryData.cours.code) : "?";
            }
            html += "</div>";
        }
    }

    html += '</div></div>';
    return html;
}

/**
 * Cellules d'une ligne du tableau des affectations.
 * L'identifiant passe par JSON.stringify puis l'échappement : le navigateur décode les entités
 * d'un attribut onclick avant d'exécuter le JavaScript qu'il contient.
 * @param {Object} a - affectation (avec cours, salle et professeur inclus)
 * @param {Object} mapSemestres - nom du semestre par identifiant
 * @param {string} libelleDate - jour (hebdo) ou date déjà mis en forme
 * @returns {string} HTML des cellules <td>
 */
export function htmlLigneAffectation(a, mapSemestres, libelleDate) {
    const profNom = a.professeur ? a.professeur.prenom + " " + a.professeur.nom : "—";
    const salleHtml = a.salle ? "<div>" + echapperHtml(a.salle.code) + "</div>" : "<div>—</div>";
    const profHtml = profNom !== "—" ? "<div>" + echapperHtml(profNom) + "</div>" : "<div>—</div>";
    const libelleCours = a.cours ? a.cours.code + " - " + a.cours.nom : "";
    const nomSemestre = a.id_semestre ? mapSemestres[a.id_semestre] || "N/A" : "N/A";
    const idJs = echapperHtml(JSON.stringify(a.id));

    return "<td>" + echapperHtml(a.cours ? (a.cours.programme || "") : "") + "</td>" +
        "<td>" + echapperHtml(libelleCours) + "</td>" +
        "<td>" + salleHtml + "</td>" +
        "<td>" + profHtml + "</td>" +
        "<td>" + echapperHtml(nomSemestre) + "</td>" +
        "<td>" + echapperHtml(libelleDate) + "</td>" +
        "<td>" + echapperHtml(a.plageHoraire) + "</td>" +
        '<td><div class="actions-cell">' +
            '<button class="btn btn-modifier" onclick="modifierAffectation(' + idJs + ')">Modifier</button>' +
            '<button class="btn btn-supprimer" onclick="supprimerAffectation(' + idJs + ')">Supprimer</button>' +
        "</div></td>";
}

/**
 * Libellé d'un jour férié dans la grille du planner.
 * @param {string} description
 * @returns {string} HTML
 */
export function htmlJourFerie(description) {
    return '<span class="ferie-label">' + echapperHtml(description) + "</span>";
}

/**
 * Contenu d'une séance dans la grille du planner, adapté à sa durée.
 * @param {Object} champs - { codeCours, horaire, codeSalle, nomCours, nomProf }
 * @param {number} dureeHeures
 * @returns {string} HTML
 */
export function htmlEvenementReservation(champs, dureeHeures) {
    let html = '<div class="ev-code">' + echapperHtml(champs.codeCours) + "</div>";
    if (dureeHeures >= 1.5) {
        html += '<div class="ev-horaire">' + echapperHtml(champs.horaire) + "</div>";
        html += '<div class="ev-salle">' + echapperHtml(champs.codeSalle) + "</div>";
    }
    if (dureeHeures >= 2) {
        if (champs.nomCours) html += '<div class="ev-nom">' + echapperHtml(champs.nomCours) + "</div>";
    }
    if (dureeHeures >= 2.5 && champs.nomProf) {
        html += '<div class="ev-prof">' + echapperHtml(champs.nomProf) + "</div>";
    }
    return html;
}

/**
 * Cellules d'une ligne du tableau des semestres.
 * @param {Object} sem - semestre { id, nom, joursFeeries? }
 * @param {string} dateDebut - date déjà mise en forme
 * @param {string} dateFin - date déjà mise en forme
 * @returns {string} HTML des cellules <td>
 */
export function htmlLigneSemestre(sem, dateDebut, dateFin) {
    const joursCount = (sem.joursFeeries ? sem.joursFeeries.length : 0);
    const id = echapperHtml(sem.id);

    return `
            <td>${echapperHtml(sem.nom)}</td>
            <td>${echapperHtml(dateDebut)}</td>
            <td>${echapperHtml(dateFin)}</td>
            <td>
                <button class="btn btn-petit btn-bleu" data-action="manage-feries" data-id="${id}">
                    ${joursCount} jour${joursCount !== 1 ? "s" : ""} - Gérer
                </button>
            </td>
            <td>
                <button class="btn btn-modifier" data-action="edit" data-id="${id}">Modifier</button>
                <button class="btn btn-supprimer" data-action="delete" data-id="${id}">Supprimer</button>
            </td>
        `;
}

/**
 * Cellules d'une ligne du tableau des jours fériés.
 * @param {Object} jf - jour férié { id, description }
 * @param {string} dateTexte - date déjà mise en forme
 * @returns {string} HTML des cellules <td>
 */
export function htmlLigneJourFerie(jf, dateTexte) {
    return `
            <td>${echapperHtml(dateTexte)}</td>
            <td>${echapperHtml(jf.description)}</td>
            <td>
                <button class="btn btn-supprimer" data-action="delete-ferie" data-id="${echapperHtml(jf.id)}">Supprimer</button>
            </td>
        `;
}

/**
 * Date affichée (AAAA-MM-JJ) : les dix premiers caractères d'une date ISO
 * renvoyée par l'API (« 2014-04-12T00:00:00.000Z »). Toute autre valeur donne "".
 * @param {*} valeur - chaîne ISO, null ou undefined
 * @returns {string}
 */
export function dateAffichee(valeur) {
    if (typeof valeur !== "string") return "";
    const debut = valeur.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(debut) ? debut : "";
}

/** Date de naissance affichée : voir dateAffichee. */
export const dateNaissanceAffichee = dateAffichee;

/**
 * Cellules d'une ligne du tableau des élèves.
 * @param {Object} eleve - élève { id, matricule, nom, prenom, dateNaissance }
 * @returns {string} HTML des cellules <td>
 */
export function htmlLigneEleve(eleve) {
    return `
            <td>${echapperHtml(eleve.matricule)}</td>
            <td>${echapperHtml(eleve.nom)}</td>
            <td>${echapperHtml(eleve.prenom)}</td>
            <td>${echapperHtml(dateNaissanceAffichee(eleve.dateNaissance))}</td>
        `;
}

/**
 * Cellule affichée quand un tableau est vide.
 * @param {number} nombreColonnes - nombre de colonnes du tableau
 * @param {string} titre - ex. « Aucune année »
 * @param {string} message - consigne affichée sous le titre
 * @returns {string} HTML d'une cellule <td>
 */
export function htmlLigneVide(nombreColonnes, titre, message) {
    return '<td colspan="' + echapperHtml(nombreColonnes) + '"><div class="empty-state">' +
        '<div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>' +
        '<circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg></div>' +
        "<h3>" + echapperHtml(titre) + "</h3><p>" + echapperHtml(message) + "</p></div></td>";
}

/**
 * Cellule affichée quand le tableau des élèves est vide.
 * @param {number} nombreColonnes - nombre de colonnes du tableau
 * @returns {string} HTML d'une cellule <td>
 */
export function htmlLigneVideEleves(nombreColonnes) {
    return htmlLigneVide(nombreColonnes, "Aucun élève", "Ajoutez un élève avec le bouton ci-dessus.");
}

/**
 * Cellules d'une ligne du tableau des années scolaires.
 * @param {Object} annee - { id, libelle, dateDebut, dateFin }
 * @returns {string} HTML des cellules <td>
 */
export function htmlLigneAnnee(annee) {
    return `
            <td>${echapperHtml(annee.libelle)}</td>
            <td>${echapperHtml(dateAffichee(annee.dateDebut))}</td>
            <td>${echapperHtml(dateAffichee(annee.dateFin))}</td>
        `;
}

/**
 * Cellules d'une ligne du tableau des niveaux.
 * @param {Object} niveau - { id, code, libelle, ordre }
 * @returns {string} HTML des cellules <td>
 */
export function htmlLigneNiveau(niveau) {
    return `
            <td>${echapperHtml(niveau.ordre)}</td>
            <td>${echapperHtml(niveau.code)}</td>
            <td>${echapperHtml(niveau.libelle)}</td>
        `;
}

/**
 * Cellules d'une ligne du tableau des groupes. L'année et le niveau viennent
 * de la sélection de l'API ({ annee: { libelle }, niveau: { code } }).
 * @param {Object} groupe - { id, code, capacite, annee, niveau }
 * @returns {string} HTML des cellules <td>
 */
export function htmlLigneGroupe(groupe) {
    const capacite = groupe.capacite === null || groupe.capacite === undefined ? "—" : groupe.capacite;
    return `
            <td>${echapperHtml(groupe.code)}</td>
            <td>${echapperHtml(groupe.annee?.libelle)}</td>
            <td>${echapperHtml(groupe.niveau?.code)}</td>
            <td>${echapperHtml(capacite)}</td>
        `;
}

/**
 * Options d'une liste déroulante : la valeur est l'identifiant, le texte est
 * choisi par l'appelant. Le choix « -- Choisir -- » est ajouté par la page.
 * @param {Array<Object>} elements - éléments de l'API, chacun avec un id
 * @param {(element: Object) => string} libelle - texte affiché pour un élément
 * @returns {string} HTML des balises <option>
 */
export function htmlOptionsSelect(elements, libelle) {
    return elements
        .map((element) => '<option value="' + echapperHtml(element.id) + '">' + echapperHtml(libelle(element)) + "</option>")
        .join("");
}
