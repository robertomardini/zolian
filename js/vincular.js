// js/vincular.js
const params = new URLSearchParams(window.location.search);
const tvCode = params.get('code');

window.addEventListener('DOMContentLoaded', () => {
  // Mostrar el código QR inicialmente
  document.getElementById('tv-code').innerText = `Código: ${tvCode}`;
});

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Si no logueado, enviamos a login y luego volverá aquí
    const redirect = encodeURIComponent(`vincular.html?code=${tvCode}`);
    return window.location.href = `login.html?redirect=${redirect}`;
  }

  // Ya logueado: mostrar opciones
  document.getElementById('options').classList.remove('hidden');
  document.getElementById('form').style.display = 'block';

  // Cargar sesiones existentes
  const { data: sesiones, error: sesionesErr } = await supabase
    .from('tv')
    .select('code, nombre')
    .eq('user_id', session.user.id)
    .eq('linked', true)
    .order('created_at', { ascending: false });

  const listEl = document.getElementById('session-list');
  if (sesionesErr) {
    listEl.innerHTML = `<li class="text-red-500">Error cargando sesiones</li>`;
  } else if (!sesiones || sesiones.length === 0) {
    listEl.innerHTML = `<li>No tienes sesiones vinculadas aún.</li>`;
  } else {
    listEl.innerHTML = '';
    sesiones.forEach(s => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="font-semibold">${s.nombre || s.code}</span>
        <a href="galeria.html?code=${s.code}" class="text-blue-600 hover:underline ml-2">Galería</a>
        <button onclick="enviarATV('${s.code}')" class="ml-2 bg-green-500 text-white px-2 py-1 rounded">
          Mostrar en TV
        </button>`;
      listEl.appendChild(li);
    });
  }
}

init();

// Vincular nueva galería
async function vincularTV() {
  const { data: { user } } = await supabase.auth.getUser();
  const nombre = document.getElementById('tvname').value.trim();
  if (!nombre) {
    return document.getElementById('message').innerText = 'Ingresa un nombre.';
  }
  const { error } = await supabase
    .from('tv')
    .update({ linked: true, user_id: user.id, nombre })
    .eq('code', tvCode);
  if (error) {
    document.getElementById('message').innerText = error.message;
  } else {
    window.location.href = 'dashboard.html';
  }
}

// Enviar orden al TV
async function enviarATV(code) {
  await supabase
    .channel(`tv-${code}`)
    .send({ type: 'broadcast', event: 'show', payload: {} });
  alert(`Se ha enviado la orden de mostrar la sesión ${code} en la TV.`);
}
window.enviarATV = enviarATV;
