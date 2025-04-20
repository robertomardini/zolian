// js/administrar.js
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // 0) Leer parámetro code de la TV
  const params = new URLSearchParams(location.search);
  const tvCode = params.get('code');
  if (!tvCode) {
    // Si falta el código, volvemos al listado de pantallas
    return window.location.href = 'pantallas.html';
  }

  // 1) Referencias al DOM
  const userEmailEl = document.getElementById('user-email');
  const tvCodeEl    = document.getElementById('tv-code');
  const tvNombreEl  = document.getElementById('tv-nombre');
  const galleryArea = document.getElementById('gallery-options');
  const btnFull     = document.getElementById('btn-fullscreen');
  const inputDur    = document.getElementById('duration');
  const btnUnlink   = document.getElementById('btn-unlink');

  // 2) Comprobamos la sesión
  const { data: { session }, error: sesErr } = await supabase.auth.getSession();
  if (sesErr || !session) {
    const redirect = encodeURIComponent(`administrar.html?code=${tvCode}`);
    return window.location.href = `login.html?redirect=${redirect}`;
  }
  const userId = session.user.id;
  userEmailEl.innerText = session.user.email;

  // 3) Cargamos datos de la TV
  const { data: tvRec, error: tvErr } = await supabase
    .from('tv')
    .select('nombre, user_id, gallery_code, duration')
    .eq('code', tvCode)
    .single();

  if (tvErr || !tvRec || tvRec.user_id !== userId) {
    alert('No tienes permiso para administrar esta TV.');
    return;
  }

  // Mostramos datos
  tvCodeEl.innerText   = tvCode;
  tvNombreEl.innerText = tvRec.nombre || '—';
  if (tvRec.duration != null) inputDur.value = tvRec.duration;
  let assignedGallery = tvRec.gallery_code;

  // 4) Creamos un canal Realtime para emitir 'refresh'
  const channel = supabase
    .channel(`tv-${tvCode}`)
    .subscribe();

  // 5) Renderizamos el listado de galerías
  await loadGalerias();

  // 6) Botón "Pantalla completa": guardamos duración y volvemos a la TV
  if (btnFull) {
    btnFull.onclick = async () => {
      await supabase
        .from('tv')
        .update({ duration: Number(inputDur.value) })
        .eq('code', tvCode);
      window.location.href = `index.html?code=${tvCode}`;
    };
  }

  // 7) Botón "Desvincular TV"
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

  // ——— Función para listar y mostrar galerías ———
  async function loadGalerias() {
    const { data: sesiones, error } = await supabase
      .from('tv')
      .select('code, nombre')
      .eq('user_id', userId)
      .eq('linked', true);

    if (error) {
      galleryArea.innerHTML = '<p class="text-red-500">Error al cargar galerías.</p>';
      console.error(error);
      return;
    }
    galleryArea.innerHTML = '';

    // 5.1) Botón para crear nueva galería
    const btnNew = document.createElement('button');
    btnNew.className = 'flex flex-col items-center p-4 border rounded hover:bg-gray-50';
    btnNew.innerHTML = `
      <svg class="w-8 h-8 mb-2" fill="none" stroke="#202020" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4v16m8-8H4"/>
      </svg>
      <span>+ Nueva galería</span>
    `;
    btnNew.onclick = () => window.location.href = `galerias.html?code=${tvCode}`;
    galleryArea.appendChild(btnNew);

    // 5.2) Botones para cada galería existente
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
          // 1) Guardamos en la tabla tv
          const { error: updErr } = await supabase
            .from('tv')
            .update({ gallery_code: s.code })
            .eq('code', tvCode);
          if (updErr) {
            return alert('Error al asignar galería: ' + updErr.message);
          }
          assignedGallery = s.code;

          // 2) Resaltamos la selección
          document
            .querySelectorAll('#gallery-options button')
            .forEach(b => b.classList.remove('ring','ring-2','ring-[#05F2C7]'));
          btn.classList.add('ring','ring-2','ring-[#05F2C7]');

          // 3) Enviamos broadcast para refrescar la TV
          channel.send({ type: 'broadcast', event: 'refresh' });
        };
        galleryArea.appendChild(btn);

        // Si ya estaba asignada, la marcamos
        if (s.code === assignedGallery) {
          btn.click();
        }
      });

    // Si no hay otras galerías
    if (sesiones.filter(s => s.code !== tvCode).length === 0) {
      galleryArea.innerHTML +=
        '<p class="italic text-gray-500 mt-4">No hay otras galerías vinculadas.</p>';
    }
  }
}
