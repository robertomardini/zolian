// js/dashboard.js

// Función para cargar y mostrar tus TVs
async function loadTVs() {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
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
  if (!tvs || tvs.length === 0) {
    listEl.innerHTML = '<li>No tienes TVs vinculadas.</li>';
    return;
  }

  // Construimos la lista
  listEl.innerHTML = '';
  tvs.forEach(tv => {
    const li = document.createElement('li');
    li.className = 'mb-2';

    li.innerHTML = `
      <span class="font-semibold">${tv.nombre || tv.code}</span>
      <a href="upload.html?code=${tv.code}"
         class="text-blue-600 hover:underline ml-2">
        Editar Galería
      </a>
      <button onclick="mostrarSlideshow('${tv.code}')"
              class="ml-2 bg-green-500 text-white px-2 py-1 rounded">
        Mostrar en TV
      </button>
      <button onclick="eliminarTV('${tv.code}', '${user.id}')"
              class="ml-2 bg-red-500 text-white px-2 py-1 rounded">
        Eliminar
      </button>
    `;
    listEl.appendChild(li);
  });
}

// Eliminar un TV (registro + bucket)
async function eliminarTV(code, userId) {
  if (!confirm(`¿Seguro que quieres eliminar la sesión "${code}" y todas sus imágenes?`)) {
    return;
  }

  // 1) Listar todos los archivos del bucket
  const prefix = `${userId}/${code}`;
  const { data: files, error: listErr } = await supabase
    .storage
    .from('tv-content')
    .list(prefix);

  if (listErr) {
    console.error('Error al listar archivos para eliminar:', listErr);
  } else if (files && files.length > 0) {
    // 2) Eliminarlos
    const paths = files.map(f => `${prefix}/${f.name}`);
    const { error: removeErr } = await supabase
      .storage
      .from('tv-content')
      .remove(paths);
    if (removeErr) {
      console.error('Error al eliminar archivos del bucket:', removeErr);
    }
  }

  // 3) Eliminar el registro de la tabla `tv`
  const { error: delErr } = await supabase
    .from('tv')
    .delete()
    .eq('code', code);
  if (delErr) {
    console.error('Error al eliminar registro de TV:', delErr);
    alert('Ocurrió un error al eliminar la sesión.');
    return;
  }

  // 4) Refrescar la lista
  await loadTVs();
}

// Función para redirigir a tv.html?code=… desde el Dashboard
function mostrarSlideshow(code) {
  window.location.href = `tv.html?code=${code}`;
}
window.mostrarSlideshow = mostrarSlideshow;
window.eliminarTV = eliminarTV;

document.addEventListener('DOMContentLoaded', loadTVs);

// Cerrar sesión
async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}
window.logout = logout;
