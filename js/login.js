// js/login.js

// Obtener redirect o usar dashboard.html
const urlParams  = new URLSearchParams(window.location.search);
const redirectTo = urlParams.get('redirect') || 'dashboard.html';

async function login() {
  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    document.getElementById('message').innerText = error.message;
  } else {
    window.location.href = redirectTo;
  }
}

async function signup() {
  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signUp(
    { email, password },
    { redirectTo: window.location.origin + '/' + redirectTo }
  );

  if (error) {
    document.getElementById('message').innerText = error.message;
  } else {
    // Si confirmación de email está off, la sesión queda activa
    window.location.href = redirectTo;
  }
}
