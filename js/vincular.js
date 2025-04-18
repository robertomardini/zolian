// js/vincular.js

// Leer código de TV de la URL
const params = new URLSearchParams(window.location.search);
const tvCode = params.get('code');
document.getElementById('tv-code').innerText = "Código del TV: " + tvCode;

// Chequear sesión y mostrar formulario
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Redirigir al login, devolviendo a esta misma página
    const redirect = encodeURIComponent(`vincular.html?code=${tvCode}`);
    return window.location.href = `login.html?redirect=${redirect}`;
  }
  // Ya logueado, mostrar form
  document.getElementById('form').style.display = 'block';
}
init();

// Función de vinculación
async function vincularTV() {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return;

  const tvName = document.getElementById('tvname').value.trim();
  if (!tvName) {
    document.getElementById('mensaje').innerText = "Por favor ingresa un nombre.";
    return;
  }

  const { data, error } = await supabase
    .from('tv')
    .update({ linked: true, user_id: user.data.user.id, nombre: tvName })
    .eq('code', tvCode);

  if (error) {
    document.getElementById('mensaje').innerText = "Error al vincular: " + error.message;
  } else {
    // Redirigir al dashboard, o mostrar mensaje
    window.location.href = 'dashboard.html';
  }
}
