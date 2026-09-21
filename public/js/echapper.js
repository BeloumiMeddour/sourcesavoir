// === ÉCHAPPEMENT HTML ===
// Module pur (aucun accès à window ni à document) : importable dans le navigateur
// et sous Jest. utils.js ne l'est pas car il modifie window.fetch au chargement.

const ENTITES_HTML = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

/**
 * Échappe une valeur avant de l'insérer dans du HTML construit par concaténation
 * (contenu d'un élément ou attribut entre guillemets).
 * Ne convient pas seul à une chaîne JavaScript dans un attribut onclick : le navigateur
 * décode les entités avant d'exécuter le code. Utiliser echapperHtml(JSON.stringify(valeur)).
 * @param {*} valeur - null et undefined donnent "", les autres valeurs sont converties en chaîne
 * @returns {string} la valeur échappée
 */
export function echapperHtml(valeur) {
    if (valeur === null || valeur === undefined) return "";
    return String(valeur).replace(/[&<>"']/g, function (caractere) {
        return ENTITES_HTML[caractere];
    });
}
