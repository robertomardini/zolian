// js/administrar.js
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // ——— 0) Parámetro TV code ———
  const params = new URLSearchParams(location.search);
  const tvCode = params.get('code');
  if (!tvCode) {
    return window.location.href = 'pantallas.html';
  }

  // ——— 1) Elementos del DOM ———
  const userEmailEl = document.getElementById('user-email');
  const tvCodeEl    = document.getElementById('tv-code');
  const tvNombreEl  = document.getElementById('tv-nombre');
  const galleryArea = document.getElementById('gallery-options');
  const btnFull     = document.getElementById('btn-fullscreen');
  const inputDur    = document.getElementById('duration');
  const btnUnlink   = document.getElementById('btn-unlink');

  // ——— 2) Sesión ———
  const { data: { session }, error: sesErr } = await supabase.auth.getSession();
  if (sesErr || !session) {
    const redirect = encodeURIComponent(`administrar.html?code=${tvCode}`);
    return window.location.href = `login.html?redirect=${redirect}`;
  }
  const userId = session.user.id;
  userEmailEl.innerText = session.user.email;

  // ——— 3) Datos de la TV ———
  const { data: tvRec, error: tvErr } = await supabase
    .from('tv')                           // <<– tabla correcta
    .select('nombre, user_id, gallery_code, duration')
    .eq('code', tvCode)
    .single();

  if (tvErr || !tvRec || tvRec.user_id !== userId) {
    alert('No tienes permiso para administrar esta TV.');
    return;
  }

  // Pongo en pantalla los datos
  tvCodeEl.innerText   = tvCode;
  tvNombreEl.innerText = tvRec.nombre || '—';
  if (tvRec.duration != null) inputDur.value = tvRec.duration;

  // ——— 4) Cargo galerías y renderizo ———
  await loadGalerias(tvRec.gallery_code);

  // ——— 5) Fullscreen guarda sólo duración y redirige ———
  if (btnFull) {
    btnFull.onclick = async () => {
      await supabase
        .from('tv')
        .update({ duration: Number(inputDur.value) })
        .eq('code', tvCode);
      window.location.href = `index.html?code=${tvCode}`;
    };
  }

  // ——— 6) Desvincular TV ———
  if (btnUnlink) {
    btnUnlink.onclick = async () => {
      if (!confirm('¿Desvincular esta TV de tu cuenta?')) return;
      await supabase
        .from('tv')
        .update({
          linked: false,
          user_id: null,
          gallery_code: null,
          duration: null
        })
        .eq('code', tvCode);
      window.location.href = 'pantallas.html';
    };
  }

  // ——— Función para listar y “activar” cada galería ———
  async function loadGalerias(currentGallery) {
    const { data: sesiones, error } = await supabase
      .from('tv')                       // <<– tabla correcta
      .select('code, nombre')
      .eq('user_id', userId)
      .eq('linked', true);

    if (error) {
      galleryArea.innerHTML = '<p class="text-red-500">Error al cargar galerías.</p>';
      console.error(error);
      return;
    }

    galleryArea.innerHTML = '';

    // Botón “+ Nueva galería”
    const btnNew = document.createElement('button');
    btnNew.className = 'flex flex-col items-center p-4 border rounded hover:bg-gray-50';
    btnNew.innerHTML = `
      <svg class="w-8 h-8 mb-2" fill="none" stroke="#202020" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4v16m8-8H4"/>
      </svg>
      <span>+ Nueva galería</span>
    `;
    btnNew.onclick = () => window.location.href = `galeria.html?code=${tvCode}`;
    galleryArea.appendChild(btnNew);

    // Botones de cada sesión (galería)
    sesiones
      .filter(s => s.code !== tvCode)
      .forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'flex flex-col items-center p-4 border rounded hover:bg-gray-50';
        btn.innerHTML = `
          <svg class="w-8 h-8 mb-2" fill="none" stroke="#202020" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 7h18M3 12h18M3 17h18"/>
          </svg>
          <span>${s.nombre || s.code}</span>
        `;
        btn.onclick = async () => {
          // 1) guardo asignación en la BD
          await supabase
            .from('tv')
            .update({ gallery_code: s.code })
            .eq('code', tvCode);
          // 2) redirect inmediato al slideshow
          window.location.href = `index.html?code=${tvCode}`;
        };
        galleryArea.appendChild(btn);
      });

    // Si no hay otras galerías
    if (sesiones.filter(s => s.code !== tvCode).length === 0) {
      galleryArea.innerHTML +=
        '<p class="italic text-gray-500 mt-4">No hay otras galerías vinculadas.</p>';
    }
  }
}
