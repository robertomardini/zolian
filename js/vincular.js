// js/vincular.js
const params = new URLSearchParams(window.location.search);
const tvCode = params.get('code');
document.getElementById('tv-code').innerText = `Código: ${tvCode}`;

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const redirect = encodeURIComponent(`vincular.html?code=${tvCode}`);
    window.location.href = `login.html?redirect=${redirect}`;
    return;
  }
  // Mostrar formulario de nombrar TV
  document.getElementById('form').style.display = 'block';

  // ——— Carga de sesiones existentes ———
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
        <!-- Enlace a la galería -->
        <a href="galeria.html?code=${s.code}" 
           class="text-blue-600 hover:underline ml-2">
          Galería
        </a>
       
      listEl.appendChild(li);
    });
  }
  // ————————————————————————————————
}

init();

async function vincularTV() {
  const { data: { user } } = await supabase.auth.getUser();
  const nombre = document.getElementById('tvname').value.trim();
  if (!nombre) {
    document.getElementById('message').innerText = 'Ingresa un nombre.';
    return;
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

// ——— Definimos la función y la exponemos globalmente ———
function mostrarSlideshow(code) {
  // Redirige la TV al modo slideshow con ?code=… 
  window.location.href = `tv.html?code=${code}`;
}
window.mostrarSlideshow = mostrarSlideshow;
