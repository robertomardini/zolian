// js/mobile.js
;(async () => {
  // 1) Instancia Supabase
  const SUPABASE_URL      = 'https://evwdjscgstgbzvbunhpd.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
  window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 2) Control del menú hamburguesa
  const btnMenu = document.getElementById('btn-menu');
  const sidebar = document.getElementById('sidebar');
  const overlay= document.getElementById('overlay');
  function toggleMenu() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  }
  btnMenu.onclick = toggleMenu;
  overlay.onclick = toggleMenu;

  // 3) Pestañas
  const app          = document.getElementById('app');
  const linkPantallas= document.getElementById('link-pantallas');
  const linkGalerias = document.getElementById('link-galerias');
  const linkCuenta   = document.getElementById('link-cuenta');

  async function showPantallas() {
    toggleMenu();
    app.innerHTML = '<p>Cargando pantallas…</p>';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = 'login.html?redirect=mobile.html';
    const { data: tvs } = await supabase.from('tv').select('*').eq('user_id', session.user.id);
    app.innerHTML = `<h2 class="text-xl mb-4">Tus Pantallas</h2>
      <ul class="list-disc pl-5">
        ${tvs.map(t => `<li>
          ${t.nombre || t.code}
          <button onclick="window.location.href='administrar.html?code=${t.code}'"
                  class="ml-2 text-blue-600">Abrir</button>
        </li>`).join('')}
      </ul>`;
  }

  async function showGalerias() {
    toggleMenu();
    app.innerHTML = '<p>Funcionalidad Galerías en desarrollo...</p>';
  }

  function showCuenta() {
    toggleMenu();
    app.innerHTML = '<p>Funcionalidad Cuenta en desarrollo...</p>';
  }

  // 4) Asociar enlaces
  linkPantallas.onclick = showPantallas;
  linkGalerias.onclick  = showGalerias;
  linkCuenta.onclick    = showCuenta;

  // 5) Mostrar por defecto Pantallas
  showPantallas();
})();
