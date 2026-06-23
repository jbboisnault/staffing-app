// js/dashboard.js
let charts = {};

async function loadDashboard() {
  const { data: snaps } = await supabaseClient
    .from('staffing_snapshots')
    .select('*, consultants(grade, domaine)')
    .order('semaine');

  const { data: demandes } = await supabaseClient.from('demandes_staffing').select('*');

  renderKPIs(snaps, demandes);
  renderUtilizationParSemaine(snaps);
  renderDispoParGrade(snaps);
  renderDemandesParStatut(demandes);
  renderEvolutionDemandes(demandes);
}

function renderKPIs(snaps, demandes) {
  const lastWeek = snaps?.length ? snaps[snaps.length-1].semaine : null;
  const weekSnaps = (snaps||[]).filter(s => s.semaine === lastWeek);
  const avgUtil = weekSnaps.length ? Math.round(weekSnaps.reduce((a,s)=>a+(s.utilization||0),0)/weekSnaps.length) : 0;
  const benchCount = weekSnaps.filter(s => (s.taux_allocation||0) < 50).length;
  const demandesOuvertes = (demandes||[]).filter(d => d.statut === 'Ouverte').length;

  document.getElementById('kpis').innerHTML = `
    <div class="kpi-card"><span class="kpi-val">${avgUtil}%</span><span class="kpi-lbl">Utilization moy.</span></div>
    <div class="kpi-card"><span class="kpi-val">${benchCount}</span><span class="kpi-lbl">Sur le bench</span></div>
    <div class="kpi-card"><span class="kpi-val">${demandesOuvertes}</span><span class="kpi-lbl">Demandes ouvertes</span></div>
    <div class="kpi-card"><span class="kpi-val">${weekSnaps.length}</span><span class="kpi-lbl">Ressources suivies</span></div>
  `;
}

function makeChart(id, config) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), config);
}

function renderUtilizationParSemaine(snaps) {
  const parSemaine = {};
  (snaps||[]).forEach(s => {
    if (!parSemaine[s.semaine]) parSemaine[s.semaine] = [];
    parSemaine[s.semaine].push(s.utilization||0);
  });
  const labels = Object.keys(parSemaine).sort();
  const data = labels.map(w => Math.round(parSemaine[w].reduce((a,b)=>a+b,0)/parSemaine[w].length));

  makeChart('chartUtil', {
    type: 'line',
    data: { labels, datasets: [{ label: 'Utilization %', data, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.1)', fill: true, tension: .3 }] },
    options: chartOpts('Évolution Utilization par semaine')
  });
}

function renderDispoParGrade(snaps) {
  const lastWeek = snaps?.length ? snaps[snaps.length-1].semaine : null;
  const week = (snaps||[]).filter(s => s.semaine === lastWeek);
  const parGrade = {};
  week.forEach(s => {
    const g = s.consultants?.grade || 'N/A';
    if (!parGrade[g]) parGrade[g] = { dispo: 0, total: 0 };
    parGrade[g].dispo += (100 - (s.taux_allocation||0));
    parGrade[g].total += 1;
  });
  const labels = Object.keys(parGrade);
  const data = labels.map(g => Math.round(parGrade[g].dispo / parGrade[g].total));

  makeChart('chartGrade', {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Dispo moy. %', data, backgroundColor: '#818cf8', borderRadius: 6 }] },
    options: chartOpts('Disponibilité moyenne par grade')
  });
}

function renderDemandesParStatut(demandes) {
  const statuts = ['Ouverte','En cours','Pourvue','Annulee'];
  const data = statuts.map(s => (demandes||[]).filter(d => d.statut === s).length);
  makeChart('chartStatut', {
    type: 'doughnut',
    data: { labels: statuts, datasets: [{ data, backgroundColor: ['#fbbf24','#60a5fa','#34d399','#f87171'] }] },
    options: chartOpts('Demandes par statut')
  });
}

function renderEvolutionDemandes(demandes) {
  const parSemaine = {};
  (demandes||[]).forEach(d => {
    const w = (d.created_at||'').slice(0,10);
    parSemaine[w] = (parSemaine[w]||0) + 1;
  });
  const labels = Object.keys(parSemaine).sort();
  const data = labels.map(w => parSemaine[w]);
  makeChart('chartDemandes', {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Nb demandes', data, backgroundColor: '#34d399', borderRadius: 6 }] },
    options: chartOpts('Nouvelles demandes dans le temps')
  });
}

function chartOpts(title) {
  return {
    responsive: true,
    plugins: { title: { display: true, text: title, font: { size: 14, weight: '600' }, color: '#374151' }, legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: '#f0f0f3' } }, x: { grid: { display: false } } }
  };
}
