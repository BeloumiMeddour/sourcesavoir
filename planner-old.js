// === EMPLOI DU TEMPS (PLANNER) ===

const grid = document.getElementById("planning-grid");
const selectSemaine = document.getElementById("select-semaine");
const labelSemaine = document.getElementById("label-semaine");
const filtreSalle = document.getElementById("filtre-salle");
const filtreProf = document.getElementById("filtre-prof");

const btnVueSemaine = document.getElementById("btn-vue-semaine");
const btnVueMois = document.getElementById("btn-vue-mois");
const ctrlSemaine = document.getElementById("ctrl-semaine");
const ctrlMois = document.getElementById("ctrl-mois");
const labelMois = document.getElementById("label-mois");
const btnMoisPrec = document.getElementById("btn-mois-prec");
const btnMoisSuiv = document.getElementById("btn-mois-suiv");

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS_NOMS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const HEURE_DEBUT = 8;
const HEURE_FIN = 20;

let affectations = [];
let semaineCourante = getDebutSemaine(new Date());
let vueCourante = "semaine";
let moisCourant = new Date().getMonth();
let anneeCourante = new Date().getFullYear();

// --- Utilitaires de date ---

function getDebutSemaine(date) {
    const d = new Date(date);
    const jour = d.getDay();
    const diff = d.getDate() - jour + (jour === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDate(date) {
    return date.toISOString().split("T")[0];
}

function formatDateFR(date) {
    return date.toLocaleDateString("fr-CA", { day: "numeric", month: "long" });
}

function ajouterJours(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

// --- Remplir le select des semaines ---

function remplirSelectSemaines() {
    selectSemaine.innerHTML = "";
    for (let i = -8; i <= 8; i++) {
        const debut = ajouterJours(getDebutSemaine(new Date()), i * 7);
        const fin = ajouterJours(debut, 6);
        const opt = document.createElement("option");
        opt.value = formatDate(debut);
        const label = "Semaine " + getNumeroSemaine(debut);
        opt.textContent = label + "  |  " + formatDate(debut) + " - " + formatDate(fin);
        if (i === 0) opt.selected = true;
        selectSemaine.appendChild(opt);
    }
}

function getNumeroSemaine(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const premierJanvier = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - premierJanvier) / 86400000 + 1) / 7);
}

// --- Charger les filtres ---

async function chargerFiltres() {
    const resSalles = await fetch("/api/salles");
    const salles = await resSalles.json();
    salles.forEach(function (s) {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.code;
        filtreSalle.appendChild(opt);
    });

    const resProfs = await fetch("/api/professeurs");
    const profs = await resProfs.json();
    profs.forEach(function (p) {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.prenom + " " + p.nom;
        filtreProf.appendChild(opt);
    });
}

// --- Charger les affectations ---

async function chargerAffectations() {
    const res = await fetch("/api/affectations");
    affectations = await res.json();
    dessiner();
}

// --- Fonction de rendu principale ---

function dessiner() {
    if (vueCourante === "semaine") {
        dessinerGrilleSemaine();
    } else {
        dessinerGrilleMois();
    }
}

// --- Filtrer les affectations ---

function filtrerAffectations() {
    var filtreSalleVal = filtreSalle.value;
    var filtreProfVal = filtreProf.value;
    var result = affectations;
    if (filtreSalleVal) {
        result = result.filter(function (a) { return a.id_salle == filtreSalleVal; });
    }
    if (filtreProfVal) {
        result = result.filter(function (a) { return a.id_professeur == filtreProfVal; });
    }
    return result;
}

// =============================================
//   VUE SEMAINE
// =============================================

function dessinerGrilleSemaine() {
    grid.innerHTML = "";
    grid.className = "planning-grid";

    const debut = new Date(selectSemaine.value || formatDate(semaineCourante));
    const fin = ajouterJours(debut, 6);

    labelSemaine.textContent =
        formatDateFR(debut) + " - " + formatDateFR(fin) + " " + debut.getFullYear();

    grid.style.gridTemplateColumns = "50px repeat(7, 1fr)";

    var coinVide = document.createElement("div");
    coinVide.className = "planning-header";
    coinVide.textContent = "H";
    grid.appendChild(coinVide);

    for (var j = 0; j < 7; j++) {
        var dateJour = ajouterJours(debut, j);
        var header = document.createElement("div");
        header.className = "planning-header";
        header.textContent = JOURS[j] + " " + dateJour.getDate();
        grid.appendChild(header);
    }

    var affFiltrees = filtrerAffectations();

    for (var h = HEURE_DEBUT; h < HEURE_FIN; h++) {
        var cellH = document.createElement("div");
        cellH.className = "planning-hour";
        cellH.textContent = h + "h";
        grid.appendChild(cellH);

        for (var j = 0; j < 7; j++) {
            var dateJour = formatDate(ajouterJours(debut, j));
            var cell = document.createElement("div");
            cell.className = "planning-cell";

            affFiltrees.forEach(function (a) {
                var dateAff = a.date.split("T")[0];
                if (dateAff !== dateJour) return;

                var plage = a.plageHoraire.split("-");
                var hDebut = parseInt(plage[0].split(":")[0]);
                var hFin = parseInt(plage[1].split(":")[0]);
                var mFin = parseInt(plage[1].split(":")[1]) || 0;
                var dernierH = mFin > 0 ? hFin : hFin - 1;

                if (h >= hDebut && h <= dernierH) {
                    var ev = document.createElement("div");
                    ev.className = "planning-event reservation";
                    ev.title = (a.cours ? a.cours.code : "") + " - " +
                               (a.salle ? a.salle.code : "") +
                               (a.professeur ? "\n" + a.professeur.prenom + " " + a.professeur.nom : "");

                    var estPremier = (h === hDebut);
                    var estDernier = (h === dernierH);

                    if (estPremier && estDernier) {
                        ev.style.borderRadius = "4px";
                    } else if (estPremier) {
                        ev.style.borderRadius = "4px 4px 0 0";
                        ev.style.bottom = "-1px";
                    } else if (estDernier) {
                        ev.style.borderRadius = "0 0 4px 4px";
                    } else {
                        ev.style.borderRadius = "0";
                        ev.style.bottom = "-1px";
                    }

                    if (estPremier) {
                        ev.innerHTML =
                            "<strong>" + (a.cours ? a.cours.code : "") + "</strong> - " +
                            (a.salle ? a.salle.code : "") +
                            (a.professeur ? "<br>" + a.professeur.prenom[0] + ". " + a.professeur.nom : "");
                    }

                    cell.appendChild(ev);
                }
            });

            grid.appendChild(cell);
        }
    }
}

// =============================================
//   VUE MOIS
// =============================================

function dessinerGrilleMois() {
    grid.innerHTML = "";
    grid.className = "planning-grid planning-grid-mois";

    labelMois.textContent = MOIS_NOMS[moisCourant] + " " + anneeCourante;
    labelSemaine.textContent = MOIS_NOMS[moisCourant] + " " + anneeCourante;

    grid.style.gridTemplateColumns = "repeat(7, 1fr)";

    // En-têtes jours
    for (var j = 0; j < 7; j++) {
        var header = document.createElement("div");
        header.className = "planning-header";
        header.textContent = JOURS[j];
        grid.appendChild(header);
    }

    // Premier jour du mois
    var premierJour = new Date(anneeCourante, moisCourant, 1);
    var jourDebut = premierJour.getDay();
    jourDebut = jourDebut === 0 ? 6 : jourDebut - 1;

    var nbJours = new Date(anneeCourante, moisCourant + 1, 0).getDate();

    var affFiltrees = filtrerAffectations();

    // Regrouper par date
    var parDate = {};
    affFiltrees.forEach(function (a) {
        var dateStr = a.date.split("T")[0];
        if (!parDate[dateStr]) parDate[dateStr] = [];
        parDate[dateStr].push(a);
    });

    // Cellules vides avant le 1er
    for (var i = 0; i < jourDebut; i++) {
        var cellVide = document.createElement("div");
        cellVide.className = "mois-cell mois-cell-vide";
        grid.appendChild(cellVide);
    }

    var aujourdhui = formatDate(new Date());

    // Jours du mois
    for (var d = 1; d <= nbJours; d++) {
        var cell = document.createElement("div");
        cell.className = "mois-cell";

        var dateStr = anneeCourante + "-" +
            String(moisCourant + 1).padStart(2, "0") + "-" +
            String(d).padStart(2, "0");

        if (dateStr === aujourdhui) {
            cell.classList.add("mois-cell-aujourdhui");
        }

        var numJour = document.createElement("div");
        numJour.className = "mois-num-jour";
        numJour.textContent = d;
        cell.appendChild(numJour);

        var affsJour = parDate[dateStr] || [];
        var max = 3;

        for (var k = 0; k < Math.min(affsJour.length, max); k++) {
            var a = affsJour[k];
            var ev = document.createElement("div");
            ev.className = "mois-event";
            ev.title = (a.cours ? a.cours.code : "") + " - " +
                       (a.salle ? a.salle.code : "") +
                       " (" + a.plageHoraire + ")" +
                       (a.professeur ? "\n" + a.professeur.prenom + " " + a.professeur.nom : "");
            ev.textContent = (a.cours ? a.cours.code : "?") + " " + a.plageHoraire.split("-")[0];
            cell.appendChild(ev);
        }

        if (affsJour.length > max) {
            var plus = document.createElement("div");
            plus.className = "mois-event-plus";
            plus.textContent = "+" + (affsJour.length - max) + " autre(s)";
            cell.appendChild(plus);
        }

        grid.appendChild(cell);
    }

    // Remplir le reste de la dernière semaine
    var totalCells = jourDebut + nbJours;
    var reste = totalCells % 7;
    if (reste > 0) {
        for (var i = 0; i < 7 - reste; i++) {
            var cellVide = document.createElement("div");
            cellVide.className = "mois-cell mois-cell-vide";
            grid.appendChild(cellVide);
        }
    }
}

// --- Basculer entre les vues ---

function changerVue(vue) {
    vueCourante = vue;
    if (vue === "semaine") {
        btnVueSemaine.classList.add("active");
        btnVueMois.classList.remove("active");
        ctrlSemaine.style.display = "";
        ctrlMois.style.display = "none";
    } else {
        btnVueMois.classList.add("active");
        btnVueSemaine.classList.remove("active");
        ctrlSemaine.style.display = "none";
        ctrlMois.style.display = "";
    }
    dessiner();
}

// --- Événements ---

btnVueSemaine.addEventListener("click", function () { changerVue("semaine"); });
btnVueMois.addEventListener("click", function () { changerVue("mois"); });

btnMoisPrec.addEventListener("click", function () {
    moisCourant--;
    if (moisCourant < 0) { moisCourant = 11; anneeCourante--; }
    dessiner();
});

btnMoisSuiv.addEventListener("click", function () {
    moisCourant++;
    if (moisCourant > 11) { moisCourant = 0; anneeCourante++; }
    dessiner();
});

selectSemaine.addEventListener("change", function () { dessiner(); });
filtreSalle.addEventListener("change", function () { dessiner(); });
filtreProf.addEventListener("change", function () { dessiner(); });

document.getElementById("btn-exporter").addEventListener("click", function () {
    window.print();
});

// --- Démarrage ---

remplirSelectSemaines();
chargerFiltres();
chargerAffectations();
