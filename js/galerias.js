// js/galerias.js

// Toggle sidebar
const btnMenuG   = document.getElementById('btn-menu')
const btnCloseG  = document.getElementById('btn-close')
const sidebarG   = document.getElementById('sidebar')
btnMenuG.onclick  = () => sidebarG.classList.remove('hidden')
btnCloseG.onclick = () => sidebarG.classList.add('hidden')

// Elementos
const userEmailG = document.getElementById('user-email')
const listG      = document.getElementById('gallery-list')

// Carga las galerías (TVs) del usuario
async function loadGalerias() {
  // 1) Usuario
  const { data: { user }, error: ue } = await supabase.auth.getUser()
  if (ue || !user) {
    return window.location.href = 'login.html?redirect=galerias.html'
  }
  userEmailG.innerText = user.email

  // 2) Traer "galerías" = registros de tv vinculados
  const { data: tvs, error } = await supabase
    .from('tv')
    .select('code, nombre, created_at')
    .eq('user_id', user.id)

  if (error) {
    listG.innerHTML = '<li class="text-red-500">Error cargando galerías.</li>'
    return
  }
  if (!tvs || tvs.length === 0) {
    listG.innerHTML = '<li>No hay galerías creadas.</li>'
    return
  }

  // 3) Renderizar
  listG.innerHTML = ''
  tvs.forEach(tv => {
    const li = document.createElement('li')
    li.className = 'bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between'

    li.innerHTML = `
      <div>
        <span class="font-semibold text-lg">${tv.nombre || tv.code}</span>
        <div class="text-sm text-gray-600 mt-1">Creada: ${new Date(tv.created_at).toLocaleDateString()}</div>
      </div>
      <div class="mt-3 sm:mt-0 space-x-2">
        <a href="galeria.html?code=${tv.code}"
           class="bg-[#4E0FA6] text-[#f4f4f4] px-3 py-1 rounded">
          Editar
        </a>
        <button onclick="eliminarGaleria('${tv.code}','${user.id}')"
                class="bg-red-500 text-white px-3 py-1 rounded">
          Eliminar
        </button>
      </div>
    `
    listG.appendChild(li)
  })
}

// Elimina una galería (reg. TV + imágenes)
async function eliminarGaleria(code, userId) {
  if (!confirm(`¿Eliminar la galería "${code}" y todas sus imágenes?`)) return
  // 1) Listar archivos
  const prefix = `${userId}/${code}`
  const { data: files } = await supabase
    .storage.from('tv-content').list(prefix)

  if (files && files.length) {
    const paths = files.map(f => `${prefix}/${f.name}`)
    await supabase.storage.from('tv-content').remove(paths)
  }
  // 2) Borrar registro
  await supabase.from('tv').delete().eq('code', code)
  // 3) Recargar
  loadGalerias()
}
window.eliminarGaleria = eliminarGaleria

// Al cargar DOM
document.addEventListener('DOMContentLoaded', loadGalerias)
