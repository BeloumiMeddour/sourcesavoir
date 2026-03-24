function getCouleurProgramme(index) {
    const couleurs = [
        "#006838",
        "#0b8f4d",
        "#49a96e",
        "#8bc34a",
        "#d6e681",
    ];
    return couleurs[index % couleurs.length];
}

function renderBarChart(data) {
    const container = document.getElementById("chart-jours");
    container.innerHTML = "";

    const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const valeurs = jours.map(j => data[j] || 0);
    const max = Math.max(...valeurs, 1);

    jours.forEach((jour) => {
        const value = data[jour] || 0;
        const hauteur = Math.max((value / max) * 180, value > 0 ? 24 : 10);

        const item = document.createElement("div");
        item.className = "bar-item";
        item.innerHTML = `
            <span class="bar-value">${value}</span>
            <div class="bar-track">
                <div class="bar-fill" style="height:${hauteur}px"></div>
            </div>
            <span class="bar-label">${jour}</span>
        `;
        container.appendChild(item);
    });
}

function renderDonut(programmes) {
    const donut = document.getElementById("donut-programmes");
    const legend = document.getElementById("legend-programmes");
    const totalEl = document.getElementById("donut-total");

    legend.innerHTML = "";

    const total = programmes.reduce((sum, p) => sum + p.value, 0);
    totalEl.textContent = total;

    if (!programmes.length || total === 0) {
        donut.style.background = "#e9efe9";
        legend.innerHTML = "<p class='empty-text'>Aucune donnée disponible</p>";
        return;
    }

    let current = 0;
    const segments = programmes.map((p, index) => {
        const color = getCouleurProgramme(index);
        const start = current;
        const percentage = (p.value / total) * 100;
        current += percentage;
        return `${color} ${start}% ${current}%`;
    });

    donut.style.background = `conic-gradient(${segments.join(", ")})`;

    programmes.forEach((p, index) => {
        const color = getCouleurProgramme(index);
        const item = document.createElement("div");
        item.className = "legend-item";
        item.innerHTML = `
            <span class="legend-color" style="background:${color}"></span>
            <span class="legend-text">${p.label}</span>
            <strong>${p.value}</strong>
        `;
        legend.appendChild(item);
    });
}

function renderProfList(profs) {
    const container = document.getElementById("prof-list");
    container.innerHTML = "";

    if (!profs.length) {
        container.innerHTML = "<p class='empty-text'>Aucune donnée disponible</p>";
        return;
    }

    const max = Math.max(...profs.map(p => p.count), 1);

    profs.forEach((prof) => {
        const percent = Math.round((prof.count / max) * 100);

        const item = document.createElement("div");
        item.className = "prof-item";
        item.innerHTML = `
            <div class="prof-avatar">${prof.initials}</div>
            <div class="prof-content">
                <div class="prof-top">
                    <span class="prof-name">${prof.nom}</span>
                    <span class="prof-count">${prof.count} affectation(s)</span>
                </div>
                <div class="prof-progress">
                    <div class="prof-progress-fill" style="width:${percent}%"></div>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

async function chargerDashboard() {
    try {
        const response = await fetch("/api/dashboard");
        const data = await response.json();

        document.getElementById("kpi-cours").textContent = data.stats.nbCours;
        document.getElementById("kpi-affectations").textContent = data.stats.nbAffectations;
        document.getElementById("kpi-prof-occupation").textContent = data.stats.tauxOccupationProfesseurs + "%";
        document.getElementById("kpi-salles").textContent = data.stats.tauxUtilisationSalles + "%";

        renderBarChart(data.affectationsParJour);
        renderDonut(data.repartitionProgrammes);
        renderProfList(data.topProfesseurs);
    } catch (error) {
        console.error("Erreur dashboard :", error);
    }
}

chargerDashboard();