// js/app.js
let currentTab = 'staffing';

function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
  currentTab = tab;
  if (tab === 'staffing') loadStaffing();
  if (tab === 'demandes') loadDemandes();
  if (tab === 'comites') loadComites();
}

(async () => {
  await requireAuth();
  loadStaffing();
})();
