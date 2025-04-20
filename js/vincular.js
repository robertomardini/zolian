// js/vincular.js
const params = new URLSearchParams(window.location.search);
const tvCode = params.get('code');
const tvCodeEl = document.getElementById('tv-code');
const tvnameEl = document.getElementById('tvname');
const msgEl    = document.getElementById('message');
const menuEl   = document.getElementById('mobile-menu');
const btnMenu  = document.getElementById('btn-menu');
const btnLogout = document.getElementById('btn-logout');
const btnOk    = document.getElementById('btn-ok');
const emailEl  = document.getElementById('user-email');

async function init() {
  if (!tvCode) {
    alert('Falta el parámetro code en la URL');
    return;
  }
  tvCodeEl.innerText = tvCode;

  // 1) Sesión
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Si no hay, redirigimos a login con retorno aquí
    const redirect = encodeURIComponent(`vincular.html?code=${tvCode}`);
    return window.location.href = `login.html?redirect=${redirect}`;
  }

  // 2) Mostramos email
  emailEl.innerText = session.user.email;

  // 3) Control menú lateral
  btnMenu.addEventListener('click', () => {
    menuEl.classList.toggle('hidden');
  });
  btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });

  // 4) Cuando le den OK, actualizamos la tabla
  btnOk.addEventListener('click', async () => {
    const nombre = tvnameEl.value.trim();
    if (!nombre) {
      msgEl.innerText = 'Ingresa un nombre.';
      return;
    }
    const { error } = await supabase
      .from('tv')
      .update({ linked: true, user_id: session.user.id, nombre })
      .eq('code', tvCode);
    if (error) {
      msgEl.innerText = error.message;
    } else {
      // Una vez vinculado, podrías redirigir a "administrar.html?code=…"
      window.location.href = `pantallas.html`;
    }
  });
}

init();
