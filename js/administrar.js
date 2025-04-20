// js/administrar.js
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // ——— 0) Obtengo el código de la TV de la URL y lo valido ———
  const params = new URLSearchParams(location.search);
  const tvCode = params.get('code');
  if (!tvCode) {
    // Si no viene código, vuelvo a la lista de pantallas
    return window.location.href = 'pantallas.html';
  }

  // ——— 1) Referencias a elementos del DOM ———
  const btnMenu     = document.getElementById('btn-menu');
  const btnClose    = document.getElementById('btn-close');
  const sidebar     = document.getElementById('sidebar');
  const userEmailEl = document.getElementById('user-email');
  const tvCodeEl    = document.getElementById('tv-code');
  const tvNombreEl  = document.getElementById('tv-nombre');
  const galleryArea = document.getElementById('gallery-options');
  const btnNew      = document.getElementById('btn-new');
  const btnFull     = document.getElementById('btn-fullscreen');
  const inputDur    = document.getElementById('duration');
  const btnUnlink   = document.getElementById('btn-unlink');

  let userId, assignedGallery;

  // ——— 2) Menú hamburguesa ———
  if (btnMenu && btnClose && sidebar) {
    btnMenu.onclick  = () => sidebar.classList.remove('hidden');
    btnClose.onclick = () => sidebar.classList.add('hidden');
  }

  // ——— 3) Sesión y usuario ———
  const { data: { session }, error: sesErr } = await supabase.auth.getSession();
  if (sesErr || !session) {
    const redirect = encodeURIComponent(`administrar.html?code=${tvCode}`);
    return window.location.href = `login.html?redirect=${redirect}`;
  }
  userId = session.user.id;
  userEmailEl.innerText = session.user.email;

  // ——— 4) Cargo datos de la TV ———
  const { data: tvRec, error: tvErr } = await supabase
    .from('tv')
    .select('nombre, user_id, gallery_code, duration')
    .eq('code', tvCode)
    .single();

  if (tvErr || !tvRec || tvRec.user_id !== userId) {
    alert('No tienes permiso para administrar esta TV.');
    return;
  }

  // Muestro datos básicos
  tvCodeEl.innerText   = tvCode;
  tvNombreEl.innerText = tvRec.nombre || '—';
  if (tvRec.duration != null) inputDur.value = tvRec.duration;
  assignedGallery = tvRec.gallery_code;

  // ——— 5) Cargo las galerías disponibles ———
  await loadGalerias();

  // ——— 6) Botón "Nueva galería" ———
  if (btnNew) {
    btnNew.onclick = () => {
      window.location.href = `galeria.html?code=${tvCode}`;
    };
  }

  // ——— 7) Botón "Pantalla completa" ———
  if (btnFull) {
    btnFull.onclick = async () => {
      // guardar duración también
      await supabase
        .from('tv')
        .update({ duration: Number(inputDur.value) })
        .eq('code', tvCode);
      window.location.href = `index.html?code=${tvCode}`;
    };
  }

  // ——— 8) Botón "Desvincular TV" ———
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

  // ——— Función para listar y mostrar botones de cada galería ———
  async function loadGalerias() {
    const { data: sesiones, error } = await supabase
      .from('tv')
      .select('code, nombre')
      .eq('user_id', userId)
      .eq('linked', true);

    if (error) {
      console.error('Error cargando galerías:', error);
      galleryArea.innerHTML = '<p class="text-red-500">Error al cargar galerías.</p>';
      return;
    }

    galleryArea.innerHTML = ''; // limpio antes

    // botón para nueva galería
    const newBtn = document.createElement('button');
    newBtn.id = 'btn-new';
    newBtn.className = 'flex flex-col items-center p-4 border rounded hover:bg-gray-50';
    newBtn.innerHTML = `
      <svg class="w-8 h-8 mb-2" fill="none" stroke="#202020" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4v16m8-8H4"/>
      </svg>
      <span>+ Nueva galería</span>
    `;
    newBtn.onclick = () => window.location.href = `galeria.html?code=${tvCode}`;
    galleryArea.appendChild(newBtn);

    // resto de sesiones/galerías
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
          assignedGallery = s.code;
          // persistir selección
          await supabase
            .from('tv')
            .update({ gallery_code: assignedGallery })
            .eq('code', tvCode);

          // resalto visualmente
          document.querySelectorAll('#gallery-options button')
            .forEach(b => b.classList.remove('ring','ring-2','ring-[#05F2C7]'));
          btn.classList.add('ring','ring-2','ring-[#05F2C7]');
        };
        galleryArea.appendChild(btn);

        // si era la seleccionada, simulo clic
        if (s.code === assignedGallery) {
          btn.click();
        }
      });

    // Si no hay otras galerías
    if (sesiones.filter(s => s.code !== tvCode).length === 0) {
      const p = document.createElement('p');
      p.className = 'italic text-gray-500';
      p.innerText = 'No hay otras galerías vinculadas.';
      galleryArea.appendChild(p);
    }
  }
}
