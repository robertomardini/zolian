// js/vincular.js

const params = new URLSearchParams(window.location.search);
const tvCode = params.get('code');
document.getElementById('tv-code').innerText = `Código del TV: ${tvCode}`;

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const redirect = encodeURIComponent(`vincular.html?code=${tvCode}`);
    window.location.href = `login.html?redirect=${redirect}`;
    return;
  }
  document.getElementById('form').style.display = 'block';
}
init();

async function vincularTV() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const tvName = document.getElementById('tvname').value.trim();
  if (!tvName) {
    document.getElementById('message').innerText = "Por favor ingresa un nombre.";
    return;
  }

  const { error } = await supabase
    .from('tv')
    .update({ linked: true, user_id: user.id, nombre: tvName })
    .eq('code', tvCode);

  if (error) {
    document.getElementById('message').innerText = "Error al vincular: " + error.message;
  } else {
    window.location.href = 'dashboard.html';
  }
}
