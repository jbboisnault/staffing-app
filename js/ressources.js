// js/ressources.js
let skillsRef = [];

async function loadSkillsRef() {
  const { data } = await supabaseClient.from('skills_referentiel').select('*').order('nom');
  skillsRef = data || [];
}

function openRessourceForm(consultant = {}) {
  loadSkillsRef().then(() => {
    const f = document.getElementById('ressourceForm');
    f.classList.remove('hidden');
    const skillsActuels = consultant.competences || [];
    f.innerHTML = `
      <h3>${consultant.id ? 'Modifier' : 'Nouvelle'} ressource</h3>
      <input id="r_matricule" placeholder="Matricule" value="${consultant.matricule||''}">
      <input id="r_nom" placeholder="Nom" value="${consultant.nom||''}">
      <input id="r_prenom" placeholder="Prénom" value="${consultant.prenom||''}">
      <select id="r_grade">
        ${['Associate','Senior','Manager','Senior Manager','Director','Partner'].map(g=>`<option ${g===consultant.grade?'selected':''}>${g}</option>`).join('')}
      </select>
      <input id="r_domaine" placeholder="Domaine (Audit, Conseil...)" value="${consultant.domaine||''}">
      <input id="r_loc" placeholder="Localisation" value="${consultant.localisation||''}">
      <label>Compétences (clique pour sélectionner)</label>
      <div class="skills-picker">
        ${skillsRef.map(s => `
          <label class="skill-chip">
            <input type="checkbox" value="${s.nom}" ${skillsActuels.includes(s.nom)?'checked':''}> ${s.nom}
          </label>`).join('')}
      </div>
      <button onclick="saveRessource('${consultant.id||''}')">Enregistrer</button>
      <button onclick="document.getElementById('ressourceForm').classList.add('hidden')" class="secondary">Annuler</button>
    `;
  });
}

async function saveRessource(id) {
  const competences = [...document.querySelectorAll('.skills-picker input:checked')].map(c => c.value);
  const GRADE_MAP = { 'Associate':1,'Senior':2,'Manager':3,'Senior Manager':4,'Director':5,'Partner':5 };
  const grade = val('r_grade');
  const payload = {
    matricule: val('r_matricule'), nom: val('r_nom'), prenom: val('r_prenom'),
    grade, grade_niveau: GRADE_MAP[grade] || 1,
    domaine: val('r_domaine'), localisation: val('r_loc'), competences
  };
  const q = id ? supabaseClient.from('consultants').update(payload).eq('id', id)
               : supabaseClient.from('consultants').upsert(payload, { onConflict: 'matricule' });
  const { error } = await q;
  if (error) return alert(error.message);
  document.getElementById('ressourceForm').classList.add('hidden');
  loadRessources();
}

async function loadRessources() {
  const { data } = await supabaseClient.from('consultants').select('*').order('nom');
  const thead = document.querySelector('#ressourcesTable thead');
  const tbody = document.querySelector('#ressourcesTable tbody');
  thead.innerHTML = '<tr><th>Nom</th><th>Grade</th><th>Domaine</th><th>Compétences</th><th>Localisation</th><th></th></tr>';
  tbody.innerHTML = (data||[]).map(c => `
    <tr>
      <td>${c.prenom||''} ${c.nom}</td><td>${c.grade||''}</td>
      <td>${c.domaine||'—'}</td>
      <td>${(c.competences||[]).map(s=>`<span class="badge">${s}</span>`).join(' ')||'—'}</td>
      <td>${c.localisation||'—'}</td>
      <td><button onclick='openRessourceForm(${JSON.stringify(c)})' class="secondary">✏️</button></td>
    </tr>`).join('');
}

async function fillMatchSelect() {
  const { data } = await supabaseClient.from('demandes_staffing').select('*').in('statut',['Ouverte','En cours']);
  document.getElementById('matchDemandeSelect').innerHTML =
    (data||[]).map(d => `<option value="${d.id}">${d.titre} (${d.grade_recherche||''})</option>`).join('');
}
