// js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return window.location.href = 'login.html?redirect=dashboard.html';
  }
  document.getElementById('user-email').innerText = `Conectado como: ${user.email}`;

  const { data: tvs, error } = await supabase
    .from('tv')
    .select('*')
    .eq('user_id', user.id);

  const listEl = document.getElementById('tv-list');
  if (error) {
    listEl.innerHTML = '<li>Error al cargar TVs.</li>';
    return;
  }
  if (!tvs.length) {
    listEl.innerHTML = '<li>No tienes TVs vinculadas.</li>';
    return;
  }

  listEl.innerHTML = '';
  tvs.forEach(tv => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="galeria.html?code=${tv.code}"
                   class="text-blue-600 hover:underline">
                     ${tv.nombre || tv.code}
                   </a>`;
    listEl.appendChild(li);
  });
});

async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}
