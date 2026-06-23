// js/auth.js
const loginForm = document.getElementById('loginForm');

// Redirige si déjà connecté
supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session && window.location.pathname.endsWith('index.html')) {
    window.location.href = 'app.html';
  }
});

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('error');
    btn.disabled = true; btn.textContent = 'Connexion...';

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    });

    if (error) {
      errorEl.textContent = 'Identifiants incorrects';
      btn.disabled = false; btn.textContent = 'Se connecter';
    } else {
      window.location.href = 'app.html';
    }
  });
}

// Protection des pages internes
async function requireAuth() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) window.location.href = 'index.html';
  return data.session;
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}