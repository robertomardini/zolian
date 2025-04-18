// js/galeria.js

const params = new URLSearchParams(window.location.search);
const tvCode = params.get('code');
document.getElementById('tv-code').innerText = "TV: " + tvCode;

async function init() {
  // Validar sesión
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return window.location.href = `login.html?redirect=${encodeURIComponent(location.pathname + location.search)}`;
  }

  // Verificar que el TV pertenece al usuario
  const { data: tvs, error: tvErr } = await supabase
    .from('tv')
    .select('user_id')
    .eq('code', tvCode)
    .single();

  if (tvErr || tvs.user_id !== session.user.id) {
    return alert("No tienes permiso para ver esta galería");
  }

  // Cargar lista inicial
  loadFiles();
}
init();

// Subir archivo al bucket `tv-content` en carpeta userId/tvCode/
async function uploadFile() {
  const input = document.getElementById('file-input');
  if (!input.files.length) return alert("Selecciona un archivo");

  const file = input.files[0];
  const { data: { session } } = await supabase.auth.getSession();
  const folder = `${session.user.id}/${tvCode}`;
  const path   = `${folder}/${file.name}`;

  const { error } = await supabase.storage
    .from('tv-content')
    .upload(path, file, { upsert: true });

  if (error) return alert("Error subiendo: " + error.message);
  loadFiles();
}

// Listar archivos
async function loadFiles() {
  const { data: { session } } = await supabase.auth.getSession();
  const prefix = `${session.user.id}/${tvCode}/`;
  const { data: files, error } = await supabase.storage
    .from('tv-content')
    .list(prefix);

  if (error) {
    return document.getElementById('file-list').innerHTML = `<li>Error: ${error.message}</li>`;
  }

  if (!files.length) {
    return document.getElementById('file-list').innerHTML = `<li>No hay archivos.</li>`;
  }

  // Mostrar lista con enlaces y botón de borrar
  document.getElementById('file-list').innerHTML = files
    .map(f => {
      const filePath = `${prefix}${f.name}`;
      const urlVar   = encodeURIComponent(filePath);
      return `
        <li class="mb-2">
          <a href="${supabase.storage.from('tv-content').getPublicUrl(filePath).data.publicUrl}"
             target="_blank" class="text-blue-600 hover:underline">
            ${f.name}
          </a>
          <button onclick="deleteFile('${f.name}')" 
                  class="ml-4 text-red-500">Borrar</button>
        </li>`;
    })
    .join('');
}

// Eliminar archivo
async function deleteFile(name) {
  const { data: { session } } = await supabase.auth.getSession();
  const filePath = `${session.user.id}/${tvCode}/${name}`;
  const { error } = await supabase.storage
    .from('tv-content')
    .remove([filePath]);

  if (error) return alert("Error borrando: " + error.message);
  loadFiles();
}
