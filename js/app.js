// js/app.js
let currentTab = 'staffing';

function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
  if (tab === 'staffing') loadStaffing();
  if (tab === 'demandes') loadDemandes();
  if (tab === 'comites') loadComites();
  if (tab === 'dashboard') loadDashboard();
  if (tab === 'ressources') loadRessources();
  if (tab === 'matching') fillMatchSelect();
}

(async () => {
  await requireAuth();
  loadStaffing();
})();
