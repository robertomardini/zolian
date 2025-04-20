(async () => {
  // 1) Referencias
  const app           = document.getElementById('app');
  const userEmailBar  = document.getElementById('user-email-bar');
  const tabs = {
    pantallas: document.getElementById('tab-pantallas'),
    galerias:  document.getElementById('tab-galerias'),
    cuenta:    document.getElementById('tab-cuenta'),
  };

  // 2) Mostrar lista de pantallas
  async function showPantallas() {
    app.innerHTML = '<h2 class="text-xl p-4">Cargando pantallas…</h2>';

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return window.location.href = 'login.html?redirect=index.html';
    }

    userEmailBar.innerText = session.user.email;

    const { data: tvs, error } = await supabase
      .from('tv')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) {
      app.innerHTML = `<p class="text-red-500 p-4">Error al cargar pantallas: ${error.message}</p>`;
      return;
    }

    app.innerHTML = `
      <h2 class="text-xl p-4">Tus Pantallas</h2>
      <ul class="list-disc pl-8 space-y-2">
        ${tvs.map(t => `
          <li class="flex items-center">
            <strong>${t.nombre || t.code}</strong>
            <button
              onclick="window.location.href='administrar.html?code=${t.code}'"
              class="ml-4 bg-[#4E0FA6] text-[#f4f4f4] px-3 py-1 rounded"
            >Abrir</button>
          </li>
        `).join('')}
      </ul>
    `;
  }

  // 3) Placeholder para galerías
  async function showGalerias() {
    app.innerHTML = '<h2 class="text-xl p-4">Tus Galerías</h2>';
    // Aquí iría tu lógica de listado de galerías…
    app.innerHTML += '<p class="p-4 text-gray-600">En construcción…</p>';
  }

  // 4) Cuenta / cerrar sesión
  async function showCuenta() {
    app.innerHTML = '<h2 class="text-xl p-4">Mi Cuenta</h2>';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return window.location.href = 'login.html?redirect=index.html';
    }
    app.innerHTML += `
      <p class="p-4">Correo: <strong>${session.user.email}</strong></p>
      <button
        onclick="supabase.auth.signOut().then(() => window.location.href='login.html')"
        class="m-4 bg-[#4E0FA6] text-[#f4f4f4] px-4 py-2 rounded"
      >Cerrar Sesión</button>
    `;
  }

  // 5) Asociar tabs
  tabs.pantallas.onclick = showPantallas;
  tabs.galerias.onclick  = showGalerias;
  tabs.cuenta.onclick    = showCuenta;

  // 6) Arrancar con Pantallas
  await showPantallas();
})();
