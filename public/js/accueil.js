// === STATISTIQUES DE LA PAGE D'ACCUEIL ===

async function chargerStatistiques() {
    try {
        var response = await fetch("/api/statistiques");
        var stats = await response.json();

        document.getElementById("stat-cours").textContent = stats.nbCours;
        document.getElementById("stat-profs").textContent = stats.nbProfesseurs;
        document.getElementById("stat-salles").textContent = stats.nbSalles;
        document.getElementById("stat-affectations").textContent = stats.nbAffectations;
        document.getElementById("stat-occupation").textContent = stats.tauxOccupation + "%";
    } catch (e) {
        console.error("Erreur chargement statistiques:", e);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    chargerStatistiques();
});
