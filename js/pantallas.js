// js/pantallas.js

// Toggle sidebar
const btnMenu = document.getElementById('btn-menu')
const btnClose = document.getElementById('btn-close')
const sidebar = document.getElementById('sidebar')
btnMenu.onclick   = () => sidebar.classList.remove('hidden')
btnClose.onclick  = () => sidebar.classList.add('hidden')

// Elementos del DOM
const userEmailEl = document.getElementById('user-email')
const listEl      = document.getElementById('tv-list')

// Carga y muestra las pantallas del usuario
async function loadPantallas() {
  // 1) Recuperar usuario
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    return window.location.href = 'login.html?redirect=pantallas.html'
  }
  userEmailEl.innerText = user.email

  // 2) Traer TVs vinculadas
  const { data: tvs, error } = await supabase
    .from('tv')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    listEl.innerHTML = '<li class="text-red-500">Error al cargar pantallas.</li>'
    return
  }
  if (!tvs || tvs.length === 0) {
    listEl.innerHTML = '<li>No tienes pantallas vinculadas.</li>'
    return
  }

  // 3) Renderizar lista
  listEl.innerHTML = ''
  tvs.forEach(tv => {
    const li = document.createElement('li')
    li.className = 'bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between'

    li.innerHTML = `
      <div>
        <span class="font-semibold text-lg">${tv.nombre || tv.code}</span>
        <div class="text-sm text-gray-600 mt-1">Código: ${tv.code}</div>
      </div>
      <div class="mt-3 sm:mt-0 space-x-2 flex flex-wrap">
        <a href="galeria.html?code=${tv.code}"
           class="bg-[#4E0FA6] text-[#f4f4f4] px-3 py-1 rounded">
          Galería
        </a>
        <a href="dashboard.html?code=${tv.code}"
           class="bg-[#4E0FA6] text-[#f4f4f4] px-3 py-1 rounded">
          Administrar
        </a>
        <button onclick="mostrarSlideshow('${tv.code}')"
                class="bg-[#4E0FA6] text-[#f4f4f4] px-3 py-1 rounded">
          Pantalla
        </button>
        <button onclick="eliminarTV('${tv.code}', '${user.id}')"
                class="bg-red-500 text-white px-3 py-1 rounded">
          Eliminar
        </button>
      </div>
    `
    listEl.appendChild(li)
  })
}

// Redirige a index.html?code=… para ver el slideshow en la TV
function mostrarSlideshow(code) {
  window.location.href = `index.html?code=${code}`
}
window.mostrarSlideshow = mostrarSlideshow

// Elimina sesión + sus imágenes
async function eliminarTV(code, userId) {
  if (!confirm(`¿Eliminar la pantalla "${code}" y todas sus imágenes?`)) return

  // borrar archivos
  const prefix = `${userId}/${code}`
  const { data: files, error: listErr } = await supabase
    .storage.from('tv-content').list(prefix)
  if (files && files.length) {
    const paths = files.map(f => `${prefix}/${f.name}`)
    await supabase.storage.from('tv-content').remove(paths)
  }

  // borrar registro
  await supabase.from('tv').delete().eq('code', code)

  // recargar lista
  loadPantallas()
}
window.eliminarTV = eliminarTV

// Al cargar el DOM
document.addEventListener('DOMContentLoaded', loadPantallas)
