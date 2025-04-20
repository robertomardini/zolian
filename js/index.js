// js/index.js
(async () => {
  // 1) Instancia Supabase
  const SUPABASE_URL      = 'https://evwdjscgstgbzvbunhpd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d2Rqc2Nnc3RnYnp2YnVuaHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NjEyOTMsImV4cCI6MjA2MDMzNzI5M30.sG08lWD-kSvWc_lwq43N_BPoswZq0yRpz_-uC7HDfnI';
  window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 2) Obtener elementos
  const app = document.getElementById('app');
  const tabs = {
    pantallas: document.getElementById('tab-pantallas'),
    galerias:  document.getElementById('tab-galerias'),
    cuenta:    document.getElementById('tab-cuenta'),
  };

  // 3) Funciones para renderizar cada sección
  async function showPantallas() {
    app.innerHTML = '<h2 class="text-xl p-4">Cargando pantallas…</h2>';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = 'login.html?redirect=index.html';
    const { data: tvs } = await supabase.from('tv').select('*').eq('user_id', session.user.id);
    app.innerHTML = `
      <h2 class="text-xl p-4">Tus Pantallas</h2>
      <ul class="list-disc pl-8">${tvs.map(t =>
        `<li>${t.nombre || t.code} <button onclick="window.location.href='administrar.html?code=${t.code}'" class="ml-2 text-blue-600">Abrir</button></li>`
      ).join('')}</ul>
    `;
  }

  async function showGalerias() {
    app.innerHTML = '<h2 class="text-xl p-4">Tus Galerías</h2>';
    // Aquí listamos todas las galerías del usuario…
  }

  function showCuenta() {
    app.innerHTML = '<h2 class="text-xl p-4">Mi Cuenta</h2>';
    // Mostrar email, cerrar sesión…
  }

  // 4) Asociar pestañas
  tabs.pantallas.onclick = showPantallas;
  tabs.galerias.onclick  = showGalerias;
  tabs.cuenta.onclick    = showCuenta;

  // 5) Mostrar por defecto
  showPantallas();
})();
