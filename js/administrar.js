// js/administrar.js
const params       = new URLSearchParams(location.search);
const tvCode       = params.get('code');
const btnMenu      = document.getElementById('btn-menu');
const btnClose     = document.getElementById('btn-close');
const sidebar      = document.getElementById('sidebar');
const userEmailEl  = document.getElementById('user-email');
const tvCodeEl     = document.getElementById('tv-code');
const tvNombreEl   = document.getElementById('tv-nombre');
const galleryArea  = document.getElementById('gallery-options');
const btnNew       = document.getElementById('btn-new');
const btnFull      = document.getElementById('btn-fullscreen');
const inputDur     = document.getElementById('duration');
const btnUnlink    = document.getElementById('btn-unlink');

let userId, assignedGallery;

// Menú hamburguesa
btnMenu.onclick  = () => sidebar.classList.remove('hidden');
btnClose.onclick = () => sidebar.classList.add('hidden');

async function init() {
  // 1) Usuario
  const { data: { session }, error: sesErr } = await supabase.auth.getSession();
  if (sesErr || !session) {
    return window.location.href = `login.html?redirect=administrar.html?code=${tvCode}`;
  }
  const user = session.user;
  userEmailEl.innerText = user.email;
  userId = user.id;

  // 2) Info TV
  const { data: tvRec, error: tvErr } = await supabase
    .from('tv').select('nombre,user_id,assigned_gallery,duration')
    .eq('code', tvCode)
    .single();
  if (tvErr || tvRec.user_id !== userId) {
    alert('No tienes permiso para administrar esta TV.');
    return;
  }
  tvCodeEl.innerText   = tvCode;
  tvNombreEl.innerText = tvRec.nombre;
  if (tvRec.duration) inputDur.value = tvRec.duration;
  assignedGallery = tvRec.assigned_gallery;

  // 3) Cargar galerías existentes
  loadGalerias();

  // 4) Crear nueva
  btnNew.onclick = () => window.location.href = `galerias.html`;

  // 5) Fullscreen
  btnFull.onclick = () => {
    // guardar configuración antes de cambiar
    guardarConfig().then(() => {
      window.location.href = `index.html?code=${tvCode}`;
    });
  };

  // 6) Desvincular
  btnUnlink.onclick = async () => {
    if (!confirm('¿Desvincular esta TV de tu cuenta?')) return;
    await supabase
      .from('tv')
      .update({ linked: false, user_id: null, assigned_gallery: null, duration: null })
      .eq('code', tvCode);
    window.location.href = 'pantallas.html';
  };
}

async function loadGalerias() {
  // traigo las "galerías" que son registros tv con linked=true
  const { data: sesiones } = await supabase
    .from('tv')
    .select('code,nombre')
    .eq('user_id', userId)
    .eq('linked', true);

  // inyectar botones
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
        document.querySelectorAll('#gallery-options button').forEach(b => b.classList.remove('ring'));
        btn.classList.add('ring','ring-2','ring-[#05F2C7]');
      };
      galleryArea.appendChild(btn);
      // si ya está asignada, marcarla
      if (s.code === assignedGallery) {
        btn.click();
      }
    });
}

// guarda assigned_gallery y duration en la tabla tv
async function guardarConfig() {
  await supabase
    .from('tv')
    .update({
      assigned_gallery: assignedGallery,
      duration: Number(inputDur.value)
    })
    .eq('code', tvCode);
}

document.addEventListener('DOMContentLoaded', init);
