// js/matching.js

const GRADE_MAP = { 'Associate':1,'Senior Associate':2,'Manager':3,'Senior Manager':4,'Director':5,'Partner':5 };

// Calcule un score de match entre une demande et un consultant
function calculerMatch(demande, consultant, snapshot) {
  const raisons = [];
  let score = 100;
  let niveau = 'OK'; // OK / Incertain / Mauvais

  // 1. Disponibilité
  const dispo = snapshot ? (100 - (snapshot.taux_allocation || 0)) : 100;
  const besoin = demande.taux_allocation || 100;
  if (dispo < besoin) {
    score -= 40;
    raisons.push(`⚠️ Dispo ${dispo}% < besoin ${besoin}%`);
    niveau = 'Incertain';
  }
  if (dispo <= 0) {
    score -= 30;
    raisons.push(`❌ Non disponible`);
    niveau = 'Mauvais';
  }

  // 2. Grade
  const gDem = demande.grade_niveau || GRADE_MAP[demande.grade_recherche] || 1;
  const gCons = consultant.grade_niveau || GRADE_MAP[consultant.grade] || 1;
  if (gCons < gDem) {
    score -= 35;
    raisons.push(`❌ Grade insuffisant (${consultant.grade} < ${demande.grade_recherche})`);
    niveau = niveau === 'Mauvais' ? 'Mauvais' : 'Mauvais';
  } else if (gCons > gDem + 1) {
    score -= 15;
    raisons.push(`⚠️ Surqualifié (${consultant.grade})`);
    if (niveau === 'OK') niveau = 'Incertain';
  }

  // 3. Domaine
  if (demande.domaine && consultant.domaine && demande.domaine !== consultant.domaine) {
    score -= 20;
    raisons.push(`⚠️ Domaine différent (${consultant.domaine} ≠ ${demande.domaine})`);
    if (niveau === 'OK') niveau = 'Incertain';
  }

  // 4. Skills
  const skillsDemande = demande.competences || [];
  const skillsConsultant = consultant.competences || [];
  const skillsManquants = skillsDemande.filter(s => !skillsConsultant.includes(s));
  if (skillsManquants.length > 0) {
    const ratio = skillsManquants.length / skillsDemande.length;
    score -= Math.round(ratio * 30);
    raisons.push(`⚠️ Skills manquants : ${skillsManquants.join(', ')}`);
    if (niveau === 'OK') niveau = ratio > 0.5 ? 'Mauvais' : 'Incertain';
  }

  if (raisons.length === 0) raisons.push('✅ Match parfait');
  score = Math.max(0, score);

  return { score, niveau, raisons, dispo };
}

async function lancerMatching(demandeId) {
  const semaine = getMonday(document.getElementById('weekPickerMatch')?.value);

  const { data: demande } = await supabaseClient
    .from('demandes_staffing').select('*').eq('id', demandeId).single();

  const { data: consultants } = await supabaseClient.from('consultants').select('*');

  // dernier snapshot par consultant
  const { data: snapshots } = await supabaseClient
    .from('staffing_snapshots').select('*')
    .order('semaine', { ascending: false });

  const lastSnap = {};
  (snapshots||[]).forEach(s => { if (!lastSnap[s.consultant_id]) lastSnap[s.consultant_id] = s; });

  const resultats = (consultants||[]).map(c => ({
    consultant: c,
    ...calculerMatch(demande, c, lastSnap[c.id])
  })).sort((a,b) => b.score - a.score);

  afficherMatching(demande, resultats);
}

function afficherMatching(demande, resultats) {
  const couleur = { 'OK':'match-ok', 'Incertain':'match-warn', 'Mauvais':'match-bad' };
  const html = `
    <div class="match-header">
      <h3>🎯 Matching : ${demande.titre}</h3>
      <p>${demande.grade_recherche||''} · ${demande.domaine||''} · ${(demande.competences||[]).join(', ')}</p>
    </div>
    <div class="match-grid">
      ${resultats.map(r => `
        <div class="match-card ${couleur[r.niveau]}">
          <div class="match-top">
            <strong>${r.consultant.prenom||''} ${r.consultant.nom}</strong>
            <span class="match-score">${r.score}%</span>
          </div>
          <div class="match-meta">${r.consultant.grade||''} · ${r.consultant.domaine||''} · dispo ${r.dispo}%</div>
          <ul class="match-reasons">${r.raisons.map(x=>`<li>${x}</li>`).join('')}</ul>
        </div>`).join('')}
    </div>`;
  document.getElementById('matchResults').innerHTML = html;
}
