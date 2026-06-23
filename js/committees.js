// js/committees.js

function openComiteForm() {
  const f = document.getElementById('comiteForm');
  f.classList.remove('hidden');
  f.innerHTML = `
    <h3>Nouveau comité</h3>
    <select id="c_type">
      <option>Staffing</option><option>Business Review</option>
      <option>People Committee</option><option>Pipeline Review</option>
      <option>Acceptation mission</option>
    </select>
    <input id="c_date" type="date">
    <input id="c_part" placeholder="Participants (séparés par ,)">
    <button onclick="saveComite()">Créer</button>
  `;
}

async function saveComite() {
  await supabaseClient.from('comites').insert({
    type: val('c_type'), date_comite: val('c_date'),
    participants: val('c_part').split(',').map(p=>p.trim()).filter(Boolean)
  });
  document.getElementById('comiteForm').classList.add('hidden');
  loadComites();
}

async function loadComites() {
  const { data: comites } = await supabaseClient
    .from('comites').select('*').order('date_comite', { ascending: false });

  // demandes ouvertes pour préparer le comité staffing
  const { data: demandesOuvertes } = await supabaseClient
    .from('demandes_staffing').select('*')
    .in('statut', ['Ouverte','En cours']);

  const list = document.getElementById('comitesList');
  list.innerHTML = (comites||[]).map(c => `
    <div class="comite-card">
      <div class="comite-header">
        <h3>${c.type} — ${c.date_comite}</h3>
        <span class="badge">${c.statut}</span>
      </div>
      <p><strong>Participants :</strong> ${(c.participants||[]).join(', ')||'—'}</p>
      ${c.type === 'Staffing' ? `
        <h4>📋 Ordre du jour (demandes à arbitrer)</h4>
        <ul>${(demandesOuvertes||[]).map(d=>`<li>${d.titre} — ${d.grade_recherche||''} (${d.priorite})</li>`).join('')||'<li>Aucune demande ouverte</li>'}</ul>
      ` : ''}
      <textarea placeholder="Notes / décisions du comité" onchange="saveNotes('${c.id}', this.value)">${c.notes||''}</textarea>
    </div>
  `).join('');
}

async function saveNotes(id, notes) {
  await supabaseClient.from('comites').update({ notes }).eq('id', id);
}