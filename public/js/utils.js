// === UTILITAIRES PARTAGÉS ===

export function afficherMessage(element, texte, type) {
    element.textContent = texte;
    element.className = "message " + type;
    setTimeout(function () {
        element.textContent = "";
        element.className = "message";
    }, 5000);
}
