// === UTILITAIRES PARTAGÉS ===

// Patch global : réécrit fetch() pour toujours inclure les credentials (cookies de session)
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    if (!options.credentials) {
        options.credentials = 'include';  // Ajoute automatiquement les cookies de session
    }
    return originalFetch.call(window, url, options);
};

// Wrapper pour fetch qui inclut automatiquement les credentials (cookies de session)
export function customFetch(url, options = {}) {
    // Merge les options avec credentials
    const fetchOptions = {
        credentials: 'include',  // Important pour envoyer les cookies de session
        ...options
    };
    return fetch(url, fetchOptions);
}

// --- Tri de tableau par colonne ---
// Usage : activerTriTableau("table-cours") après avoir rempli le tableau
export function activerTriTableau(tableId) {
    var table = document.getElementById(tableId);
    if (!table) return;

    var headers = table.querySelectorAll("thead th");
    var tbody = table.querySelector("tbody");
    var etatTri = { col: -1, asc: true };

    headers.forEach(function (th, colIndex) {
        // Ne pas trier la colonne Actions (dernière)
        if (th.textContent.trim().toLowerCase() === "actions") return;

        th.classList.add("th-sortable");
        th.setAttribute("data-col", colIndex);

        th.addEventListener("click", function () {
            var memeColonne = etatTri.col === colIndex;
            etatTri.asc = memeColonne ? !etatTri.asc : true;
            etatTri.col = colIndex;

            // Réinitialiser tous les headers
            headers.forEach(function (h) {
                h.classList.remove("th-sort-asc", "th-sort-desc");
            });
            th.classList.add(etatTri.asc ? "th-sort-asc" : "th-sort-desc");

            var lignes = Array.from(tbody.querySelectorAll("tr"));

            lignes.sort(function (a, b) {
                var cellA = (a.cells[colIndex] ? a.cells[colIndex].textContent : "").trim().toLowerCase();
                var cellB = (b.cells[colIndex] ? b.cells[colIndex].textContent : "").trim().toLowerCase();

                // Tri numérique si les deux valeurs sont des nombres
                var numA = parseFloat(cellA.replace(/[^0-9.,]/g, "").replace(",", "."));
                var numB = parseFloat(cellB.replace(/[^0-9.,]/g, "").replace(",", "."));
                var cmp = (!isNaN(numA) && !isNaN(numB))
                    ? numA - numB
                    : cellA.localeCompare(cellB, "fr");

                return etatTri.asc ? cmp : -cmp;
            });

            lignes.forEach(function (tr) { tbody.appendChild(tr); });
        });
    });
}

// Crée le conteneur de toasts si absent
function getToastContainer() {
    var container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }
    return container;
}

// Affiche un toast flottant (ne bouge pas la page)
// L'argument `element` est conservé pour compatibilité mais ignoré
export function afficherMessage(element, texte, type) {
    var container = getToastContainer();

    var toast = document.createElement("div");
    toast.className = "toast toast--" + type;

    var icon = type === "succes" ? "✓" : "✕";
    toast.innerHTML =
        '<span class="toast-icon">' + icon + '</span>' +
        '<span class="toast-text">' + texte + '</span>' +
        '<button class="toast-close" aria-label="Fermer">&#x2715;</button>' +
        '<div class="toast-progress"></div>';

    container.appendChild(toast);

    // Fermeture manuelle
    toast.querySelector(".toast-close").addEventListener("click", function () {
        dismissToast(toast);
    });

    // Entrée
    requestAnimationFrame(function () {
        toast.classList.add("toast--visible");
    });

    // Auto-dismiss après 4s
    var timer = setTimeout(function () {
        dismissToast(toast);
    }, 4000);

    // Pause au survol
    toast.addEventListener("mouseenter", function () { clearTimeout(timer); });
    toast.addEventListener("mouseleave", function () {
        timer = setTimeout(function () { dismissToast(toast); }, 1500);
    });
}

function dismissToast(toast) {
    toast.classList.add("toast--out");
    toast.addEventListener("transitionend", function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, { once: true });
}
