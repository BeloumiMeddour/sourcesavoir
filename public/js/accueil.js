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

// === COMPTEUR ANIMÉ (stats section guest) ===

function animateCounter(el, target, suffix) {
    var start = 0;
    var duration = 1800;
    var startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        var current = Math.floor(eased * target);
        el.textContent = current.toLocaleString('fr-CA') + (suffix || '');
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function initStatsCounter() {
    var items = document.querySelectorAll('.stat-item');
    if (!items.length) return;

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var el = entry.target.querySelector('.stat-number');
                var target = parseInt(entry.target.dataset.target, 10);
                var suffix = entry.target.dataset.suffix || '';
                animateCounter(el, target, suffix);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    items.forEach(function(item) { observer.observe(item); });
}

// === APPARITION DES FEATURE CARDS AU SCROLL ===

function initCardReveal() {
    var cards = document.querySelectorAll('.feature-card[data-aos]');
    if (!cards.length) return;

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    cards.forEach(function(card, i) {
        card.style.transitionDelay = (i * 0.12) + 's';
        observer.observe(card);
    });
}

// === INIT ===

document.addEventListener('DOMContentLoaded', function() {
    // Dashboard (logged in)
    if (document.getElementById('stat-cours')) {
        chargerStatistiques();
    }
    // Guest page animations
    initStatsCounter();
    initCardReveal();
});
