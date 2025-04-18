// js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
  // 1) Obtén el usuario
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return window.location.href = 'login.html';
  }

  // 2) Muestra el email
  document.getElementById('user-email').innerText = "Conectado como: " + user.email;

  // 3) Consulta los TVs vinculados a este user_id
  const { data: tvs, error: tvErr } = await supabase
    .from('tv')
    .select('code, nombre')
    .eq('user_id', user.id)
    .eq('linked', true)
    .order('created_at', { ascending: false });

  const $list = document.getElementById('tv-list');
  if (tvErr) {
    $list.innerHTML = `<li class="text-red-500">Error cargando TVs: ${tvErr.message}</li>`;
    return;
  }

  if (!tvs || tvs.length === 0) {
    $list.innerHTML = `<li>No tienes ningún TV vinculado aún.</li>`;
    return;
  }

  // 4) Renderiza cada TV
  $list.innerHTML = ''; // limpia el "Cargando…"
  tvs.forEach(tv => {
    const name = tv.nombre || '(sin nombre)';
    const code = tv.code;
    const item = document.createElement('li');
    item.innerHTML = `<strong>${name}</strong> — <a href="tv.html?code=${code}" class="text-blue-600 hover:underline">${code}</a>`;
    $list.appendChild(item);
  });
});

// Función de logout queda igual
async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}
