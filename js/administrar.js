// js/administrar.js
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // ——— Referencias a elementos (ya existen en el DOM) ———
  const params      = new URLSearchParams(location.search);
  const tvCode      = params.get('code');
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

  // ——— Menú hamburguesa ———
  if (btnMenu && btnClose && sidebar) {
    btnMenu.onclick  = () => sidebar.classList.remove('hidden');
    btnClose.onclick = () => sidebar.classList.add('hidden');
  }

  // 1) Sesión y usuario
  const { data: { session }, error: sesErr } = await supabase.auth.getSession();
  if (sesErr || !session) {
    // reenviar a login si no hay sesión
    const redirect = encodeURIComponent(`administrar.html?code=${tvCode}`);
    return window.location.href = `login.html?redirect=${redirect}`;
  }
  userId = session.user.id;
  userEmailEl.innerText = session.user.email;

  // 2) Cargar datos de la TV
  const { data: tvRec, error: tvErr } = await supabase
    .from('tv')
    .select('nombre,user_id,gallery_code,duration')
    .eq('code', tvCode)
    .single();

  if (tvErr || tvRec.user_id !== userId) {
    alert('No tienes permiso para administrar esta TV.');
    return;
  }
  tvCodeEl.innerText   = tvCode;
  tvNombreEl.innerText = tvRec.nombre;
  if (tvRec.duration) inputDur.value = tvRec.duration;
  assignedGallery = tvRec.gallery_code;

  // 3) Cargar galerías existentes
  await loadGalerias();

  // 4) Crear nueva galería
  btnNew.onclick = () => window.location.href = `galeria.html?code=${tvCode}`;

  // 5) Fullscreen → guardar config y redirigir a index.html
  btnFull.onclick = async () => {
    await guardarConfig();
    window.location.href = `index.html?code=${tvCode}`;
  };

  // 6) Desvincular TV
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

  // Función para listar y mostrar botones de cada sesión/galería
  async function loadGalerias() {
    const { data: sesiones } = await supabase
      .from('tv')
      .select('code,nombre')
      .eq('user_id', userId)
      .eq('linked', true);

    galleryArea.innerHTML = ''; // limpia antes

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
        btn.onclick = () => {
          assignedGallery = s.code;
          // resalta selección
          document.querySelectorAll('#gallery-options button')
            .forEach(b => b.classList.remove('ring','ring-2','ring-[#05F2C7]'));
          btn.classList.add('ring','ring-2','ring-[#05F2C7]');
        };
        galleryArea.appendChild(btn);

        // si ya está asignada, la marcamos
        if (s.code === assignedGallery) {
          btn.click();
        }
      });
  }

  // Función para guardar duración y galería asignada
  async function guardarConfig() {
    await supabase
      .from('tv')
      .update({
        gallery_code: assignedGallery,
        duration: Number(inputDur.value)
      })
      .eq('code', tvCode);
  }
}
