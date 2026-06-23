// js/staffing.js

function getMonday(weekValue) {
  // weekValue format "2024-W05"
  if (!weekValue) return new Date().toISOString().slice(0,10);
  const [year, week] = weekValue.split('-W');
  const d = new Date(year, 0, 1 + (week - 1) * 7);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0,10);
}

async function importCSV() {
  const file = document.getElementById('csvFile').files[0];
  if (!file) return alert('Sélectionnez un fichier CSV');
  const semaine = getMonday(document.getElementById('weekPicker').value);

  const text = await file.text();
  const rows = text.split('\n').filter(r => r.trim());
  const headers = rows[0].split(',').map(h => h.trim());

  for (let i = 1; i < rows.length; i++) {
    const vals = rows[i].split(',');
    const r = {};
    headers.forEach((h, idx) => r[h] = vals[idx]?.trim());

    // upsert consultant
    const { data: cons } = await supabaseClient
      .from('consultants')
      .upsert({
        matricule: r.matricule, nom: r.nom, prenom: r.prenom,
        grade: r.grade, practice: r.practice
      }, { onConflict: 'matricule' })
      .select().single();

    // snapshot
    await supabaseClient.from('staffing_snapshots').insert({
      semaine,
      consultant_id: cons?.id,
      mission: r.mission,
      taux_allocation: parseFloat(r.taux_allocation) || 0,
      date_debut: r.date_debut || null,
      date_fin: r.date_fin || null,
      utilization: parseFloat(r.utilization) || 0
    });
  }
  alert('Import terminé !');
  loadStaffing();
}

async function loadStaffing() {
  const { data } = await supabaseClient
    .from('staffing_snapshots')
    .select('*, consultants(nom, prenom, grade, practice)')
    .order('semaine', { ascending: false })
    .limit(100);

  const thead = document.querySelector('#staffingTable thead');
  const tbody = document.querySelector('#staffingTable tbody');
  thead.innerHTML = '<tr><th>Semaine</th><th>Consultant</th><th>Grade</th><th>Mission</th><th>Allocation</th><th>Utilization</th></tr>';
  tbody.innerHTML = (data || []).map(s => `
    <tr>
      <td>${s.semaine}</td>
      <td>${s.consultants?.prenom||''} ${s.consultants?.nom||''}</td>
      <td>${s.consultants?.grade||''}</td>
      <td>${s.mission||'—'}</td>
      <td>${s.taux_allocation}%</td>
      <td>${s.utilization}%</td>
    </tr>`).join('');
}

function openDemandeForm() {
  const f = document.getElementById('demandeForm');
  f.classList.remove('hidden');
  f.innerHTML = `
    <h3>Nouvelle demande de staffing</h3>
    <input id="d_titre" placeholder="Titre / mission">
    <input id="d_grade" placeholder="Grade recherché">
    <input id="d_practice" placeholder="Practice">
    <input id="d_comp" placeholder="Compétences (séparées par ,)">
    <input id="d_taux" type="number" placeholder="Taux d'allocation %">
    <label>Début</label><input id="d_debut" type="date">
    <label>Fin</label><input id="d_fin" type="date">
    <input id="d_loc" placeholder="Localisation">
    <select id="d_prio"><option>Haute</option><option selected>Moyenne</option><option>Basse</option></select>
    <input id="d_demandeur" placeholder="Demandeur">
    <textarea id="d_comment" placeholder="Commentaire"></textarea>
    <button onclick="saveDemande()">Enregistrer</button>
    <button onclick="document.getElementById('demandeForm').classList.add('hidden')" class="secondary">Annuler</button>
  `;
}

async function saveDemande() {
  const { error } = await supabaseClient.from('demandes_staffing').insert({
    titre: val('d_titre'), grade_recherche: val('d_grade'),
    practice: val('d_practice'),
    competences: val('d_comp').split(',').map(c=>c.trim()).filter(Boolean),
    taux_allocation: parseFloat(val('d_taux'))||0,
    date_debut: val('d_debut')||null, date_fin: val('d_fin')||null,
    localisation: val('d_loc'), priorite: val('d_prio'),
    demandeur: val('d_demandeur'), commentaire: val('d_comment')
  });
  if (error) return alert(error.message);
  document.getElementById('demandeForm').classList.add('hidden');
  loadDemandes();
}

const val = id => document.getElementById(id).value;

async function loadDemandes() {
  const { data } = await supabaseClient
    .from('demandes_staffing').select('*')
    .order('created_at', { ascending: false });

  const thead = document.querySelector('#demandesTable thead');
  const tbody = document.querySelector('#demandesTable tbody');
  thead.innerHTML = '<tr><th>Titre</th><th>Grade</th><th>Practice</th><th>Allocation</th><th>Priorité</th><th>Statut</th><th></th></tr>';
  tbody.innerHTML = (data||[]).map(d => `
    <tr>
      <td>${d.titre}</td><td>${d.grade_recherche||''}</td>
      <td>${d.practice||''}</td><td>${d.taux_allocation}%</td>
      <td><span class="badge ${d.priorite}">${d.priorite}</span></td>
      <td>
        <select onchange="updateStatut('${d.id}', this.value)">
          ${['Ouverte','En cours','Pourvue','Annulee'].map(s=>`<option ${s===d.statut?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button onclick="deleteDemande('${d.id}')" class="danger">🗑</button></td>
    </tr>`).join('');
}

async function updateStatut(id, statut) {
  await supabaseClient.from('demandes_staffing').update({ statut, updated_at: new Date() }).eq('id', id);
}
async function deleteDemande(id) {
  if (!confirm('Supprimer ?')) return;
  await supabaseClient.from('demandes_staffing').delete().eq('id', id);
  loadDemandes();
}