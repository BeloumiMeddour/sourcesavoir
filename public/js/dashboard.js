// Dashboard Planify
let chartTaux;

const BRAND   = '#006838';
const BRAND2  = '#00894a';
const GREY    = '#d0d8e4';

// jour DB : 1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven  → index 0-4
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];

document.addEventListener('DOMContentLoaded', loadDashboard);

// ─────────────────────────────────────────────────────────────
async function loadDashboard() {
    const [courses, profs, rooms, affectations] = await Promise.all([
        fetch('/api/cours').then(r => r.json()),
        fetch('/api/professeurs').then(r => r.json()),
        fetch('/api/salles').then(r => r.json()),
        fetch('/api/affectations').then(r => r.json())
    ]).catch(err => {
        console.error('Erreur dashboard:', err);
        return [[], [], [], []];
    });

    const run = (fn, ...args) => { try { fn(...args); } catch(e) { console.warn(fn.name, e); } };

    run(renderKPI,      courses, profs, rooms, affectations);
    run(renderHeatmap,  affectations);
    run(renderAlerts,   rooms,   affectations);
    run(renderTopProfs, profs,   affectations);
    run(renderTopSalles,rooms,   affectations);
    run(renderTaux,     courses, affectations);
}

// ── Helpers ──────────────────────────────────────────────────

// jour DB : 1=Lun … 5=Ven → index 0-4 (-1 si hors plage)
function jourIdx(jour) {
    const j = parseInt(jour, 10);
    return (j >= 1 && j <= 5) ? j - 1 : -1;
}

// plageHoraire "08:00-10:00" → heure de début (8)
function startHour(plage) {
    if (!plage) return null;
    const h = parseInt(plage.split('-')[0].split(':')[0], 10);
    return isNaN(h) ? null : h;
}

// ── KPI ──────────────────────────────────────────────────────
function renderKPI(courses, profs, rooms, affectations) {
    counter('stat-cours',        courses.length);
    counter('stat-profs',        profs.length);
    counter('stat-salles',       rooms.length);
    counter('stat-affectations', affectations.length);
}

function counter(id, target, ms = 700) {
    const el = document.getElementById(id);
    if (!el) return;
    const t0 = performance.now();
    const step = now => {
        const p = Math.min((now - t0) / ms, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// ── HEATMAP ───────────────────────────────────────────────────
function renderHeatmap(affectations) {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;

    // Heures de début présentes dans les données (ou 8h-17h par défaut)
    const heures = [...new Set(
        affectations.map(a => startHour(a.plageHoraire)).filter(h => h != null)
    )].sort((a, b) => a - b);
    const slots = heures.length ? heures : [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

    // Comptage par (jourIdx, heure début)
    const counts = {};
    affectations.forEach(a => {
        const j = jourIdx(a.jour);
        const h = startHour(a.plageHoraire);
        if (j < 0 || h == null) return;
        const key = `${j},${h}`;
        counts[key] = (counts[key] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    grid.style.gridTemplateColumns = `42px repeat(5, 1fr)`;
    grid.innerHTML = '';

    // En-têtes
    appendEl(grid, 'div', 'sg-corner');
    DAYS.forEach(d => appendEl(grid, 'div', 'sg-day-header', d));

    // Lignes
    slots.forEach(h => {
        const label = h + 'h';
        appendEl(grid, 'div', 'sg-hour-label', label);

        for (let j = 0; j < 5; j++) {
            const n   = counts[`${j},${h}`] || 0;
            const cls = cellClass(n, maxCount);
            const cell = appendEl(grid, 'div', `sg-cell ${cls}`, n > 0 ? n : '');
            if (n > 0) {
                cell.title = `${DAYS[j]} ${label} : ${n} affectation${n > 1 ? 's' : ''}`;
            }
        }
    });
}

function cellClass(n, max) {
    if (n === 0)             return 'sg-cell-0';
    const ratio = n / max;
    if (ratio < 0.25)        return 'sg-cell-1';
    if (ratio < 0.50)        return 'sg-cell-2';
    if (ratio < 0.75)        return 'sg-cell-3';
    if (ratio < 1.00)        return 'sg-cell-4';
    return 'sg-cell-high';
}

function appendEl(parent, tag, cls, text = '') {
    const el = document.createElement(tag);
    el.className = cls;
    if (text !== '') el.textContent = text;
    parent.appendChild(el);
    return el;
}

// ── TAUX ─────────────────────────────────────────────────────
function renderTaux(courses, affectations) {
    const total       = affectations.length;
    const maxPossible = Math.max(courses.length * 5, 1);
    const libre       = Math.max(maxPossible - total, 0);
    const pct         = Math.min(Math.round((total / maxPossible) * 100), 100);

    counter('taux-pct', pct, 900);
    counter('taux-aff', total, 700);
    counter('taux-lib', libre, 700);

    const ctx = document.getElementById('chartTaux');
    if (!ctx) return;
    if (chartTaux) chartTaux.destroy();
    chartTaux = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [total, libre],
                backgroundColor: [BRAND, GREY],
                borderWidth: 0,
                borderRadius: 3,
                spacing: 2
            }]
        },
        options: {
            cutout: '74%',
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            animation: { animateRotate: true, duration: 1200 }
        }
    });
}

// ── ALERTES ───────────────────────────────────────────────────
function renderAlerts(rooms, affectations) {
    const list = document.getElementById('alerts-list');
    if (!list) return;
    list.innerHTML = '';

    const roomMap = {};
    rooms.forEach(r => { roomMap[r.id] = { code: r.code, count: 0 }; });
    affectations.forEach(a => {
        if (roomMap[a.id_salle]) roomMap[a.id_salle].count++;
    });

    const warnSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    const okSvg   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

    let hasAlert = false;

    Object.values(roomMap).forEach(r => {
        if (r.count > 8) {
            hasAlert = true;
            const isCrit = r.count > 10;
            addAlert(list, isCrit ? 'alert-crit' : 'alert-warn', warnSvg,
                `<strong>${r.code}</strong> — ${r.count} créneaux${isCrit ? ' (critique)' : ''}`);
        }
    });

    if (affectations.length === 0) {
        hasAlert = true;
        addAlert(list, 'alert-warn', warnSvg, 'Aucun cours affecté pour le moment');
    }

    if (!hasAlert) {
        addAlert(list, 'alert-ok', okSvg, 'Aucun problème détecté');
    }
}

function addAlert(list, cls, iconHtml, msg) {
    const div = document.createElement('div');
    div.className = `alert-row ${cls}`;
    div.innerHTML = `${iconHtml}<div>${msg}</div>`;
    list.appendChild(div);
}

// ── TOP PROFS ─────────────────────────────────────────────────
function renderTopProfs(profs, affectations) {
    const map = {};
    profs.forEach(p => { map[p.id] = { nom: (p.prenom ? p.prenom + ' ' + p.nom : p.nom), count: 0 }; });
    affectations.forEach(a => {
        if (a.id_professeur && map[a.id_professeur]) map[a.id_professeur].count++;
    });

    const sorted = Object.values(map)
        .filter(p => p.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    renderTopList('top-profs', sorted, 'nom');
}

// ── TOP SALLES ────────────────────────────────────────────────
function renderTopSalles(rooms, affectations) {
    const map = {};
    rooms.forEach(r => { map[r.id] = { nom: r.code, count: 0 }; });
    affectations.forEach(a => {
        if (a.id_salle && map[a.id_salle]) map[a.id_salle].count++;
    });

    const sorted = Object.values(map)
        .filter(r => r.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    renderTopList('top-salles', sorted, 'nom');
}

function renderTopList(containerId, items, labelField) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (items.length === 0) {
        el.innerHTML = '<p class="tl-empty">Aucune donnée</p>';
        return;
    }

    el.innerHTML = '';
    const max = items[0].count;

    items.forEach((item, i) => {
        const pct = Math.round((item.count / max) * 100);
        
        const row = document.createElement('div');
        row.className = 'tl-item';
        
        row.innerHTML = `
            <div class="tl-rank">${i + 1}</div>
            <div class="tl-name">${item[labelField]}</div>
            <div class="tl-bar-wrap"><div class="tl-bar" style="width: ${pct}%"></div></div>
            <div class="tl-count">${item.count}</div>
        `;
        
        el.appendChild(row);
    });
}

