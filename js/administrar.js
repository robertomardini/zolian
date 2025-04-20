// js/administrar.js
const params = new URLSearchParams(location.search);
const screenCode = params.get('code');

// Elementos
const screenNameEl    = document.getElementById('screen-name');
const galleryListEl   = document.getElementById('gallery-list');
const btnFull         = document.getElementById('btn-full');
const durationInput   = document.getElementById('duration');
const btnSaveDuration = document.getElementById('btn-save-duration');
const btnDesv         = document.getElementById('btn-desv');
const menuEl          = document.getElementById('mobile-menu');
const btnMenu         = document.getElementById('btn-menu');
const btnLogout       = document.getElementById('btn-logout');
const emailEl         = document.getElementById('user-email');

async function init() {
  if (!screenCode) {
    alert('Falta parámetro code');
    return;
  }

  // 1) Sesión
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const redir = encodeURIComponent(`administrar.html?code=${screenCode}`);
    return window.location.href = `login.html?redirect=${redir}`;
  }
  emailEl.innerText = session.user.email;

  // 2) Control menú
  btnMenu.addEventListener('click', () => menuEl.classList.toggle('hidden'));
  btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });

  // 3) Cargo datos de la TV
  const { data: tvRec, error: tvErr } = await supabase
    .from('tv')
    .select('user_id, linked, nombre, gallery_code, duration')
    .eq('code', screenCode)
    .single();
  if (tvErr || !tvRec || !tvRec.linked) {
    screenNameEl.innerText = 'TV no vinculada';
    return;
  }
  screenNameEl.innerText = `${tvRec.nombre} 📺`;
  durationInput.value = tvRec.duration || 5;

  // 4) Cargo “sesiones” del usuario como galerías
  const { data: sessions, error: sessErr } = await supabase
    .from('tv')
    .select('code, nombre')
    .eq('user_id', tvRec.user_id)
    .eq('linked', true)
    .order('created_at', { ascending: false });
  if (sessErr) return console.error(sessErr);

  //  -- Primero: botón “Crear galería” --
  galleryListEl.innerHTML = '';
  const createCard = document.createElement('div');
  createCard.className = 'gallery-item';
  createCard.innerHTML = `
    <div style="font-size:2rem;">➕</div>
    <div>Crear galería</div>
  `;
  createCard.onclick = () => {
    // rediriges a tu flujo de creación
    window.location.href = `galeria.html?code=${screenCode}&newGallery=true`;
  };
  galleryListEl.appendChild(createCard);

  //  -- Luego cada sesión existente --
  sessions.forEach(s => {
    const card = document.createElement('div');
    card.className = 'gallery-item';
    card.innerHTML = `
      <div style="font-size:2rem;">🖼️</div>
      <div>${s.nombre || s.code}</div>
    `;
    card.onclick = () => asignarGaleria(s.code);
    if (tvRec.gallery_code === s.code) {
      card.style.borderColor = '#05F2C7';  // marca la seleccionada
    }
    galleryListEl.appendChild(card);
  });

  // 5) Botón pantalla completa
  btnFull.addEventListener('click', () => {
    window.open(`index.html?code=${screenCode}`, '_blank');
  });

  // 6) Guardar duración
  btnSaveDuration.addEventListener('click', async () => {
    const dur = parseInt(durationInput.value, 10);
    if (isNaN(dur) || dur < 1) return alert('Duración inválida');
    const { error } = await supabase
      .from('tv')
      .update({ duration: dur })
      .eq('code', screenCode);
    if (error) console.error(error);
    else alert('Duración actualizada');
  });

  // 7) Desvincular
  btnDesv.addEventListener('click', async () => {
    if (!confirm('¿Desvincular esta pantalla?')) return;
    const { error } = await supabase
      .from('tv')
      .update({ linked: false, gallery_code: null, duration: null })
      .eq('code', screenCode);
    if (error) return console.error(error);
    window.location.href = 'pantallas.html';
  });
}

// Función para asignar galería a la TV
async function asignarGaleria(galleryCode) {
  const { error } = await supabase
    .from('tv')
    .update({ gallery_code: galleryCode })
    .eq('code', screenCode);
  if (error) {
    console.error(error);
  } else {
    // refresco la página para indicar selección
    location.reload();
  }
}

init();
