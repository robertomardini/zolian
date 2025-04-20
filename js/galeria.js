// js/galeria.js
;(async function() {
  // 0) Leer parámetro code de la TV
  const params = new URLSearchParams(location.search);
  const tvCode = params.get('code');
  if (!tvCode) {
    return window.location.href = 'pantallas.html';
  }

  // 1) Referencias a elementos
  const tvCodeEl  = document.getElementById('tv-code');
  const uploadBtn = document.getElementById('upload-btn');
  const inputEl   = document.getElementById('file-input');
  const listEl    = document.getElementById('file-list');

  // 2) Validar sesión
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const redirect = encodeURIComponent(`galeria.html?code=${tvCode}`);
    return window.location.href = `login.html?redirect=${redirect}`;
  }

  // 3) Verificar que esta TV pertenece al usuario
  const { data: tvRec, error: tvErr } = await supabase
    .from('tv')
    .select('user_id')
    .eq('code', tvCode)
    .single();
  if (tvErr || tvRec.user_id !== session.user.id) {
    alert('No tienes permiso para ver esta galería.');
    return window.location.href = 'pantallas.html';
  }

  // 4) Mostrar código en la UI
  tvCodeEl.innerText = `TV: ${tvCode}`;

  // 5) Funciones para subir y listar
  uploadBtn.onclick = uploadFile;
  await loadFiles();

  async function uploadFile() {
    if (!inputEl.files.length) {
      return alert('Selecciona un archivo primero.');
    }
    const file = inputEl.files[0];
    const path = `${session.user.id}/${tvCode}/${file.name}`;

    const { error } = await supabase.storage
      .from('tv-content')
      .upload(path, file, { upsert: true });

    if (error) {
      return alert('Error al subir: ' + error.message);
    }
    inputEl.value = '';
    await loadFiles();
  }

  async function loadFiles() {
    listEl.innerHTML = '<li>Cargando archivos…</li>';

    const prefix = `${session.user.id}/${tvCode}`;
    const { data: files, error } = await supabase.storage
      .from('tv-content')
      .list(prefix);

    if (error) {
      listEl.innerHTML = `<li class="text-red-500">Error: ${error.message}</li>`;
      return;
    }
    if (!files.length) {
      listEl.innerHTML = '<li>No hay archivos.</li>';
      return;
    }

    listEl.innerHTML = '';
    for (const f of files) {
      const filePath = `${prefix}/${f.name}`;
      const url = supabase.storage
        .from('tv-content')
        .getPublicUrl(filePath).data.publicUrl;

      const li = document.createElement('li');
      li.className = 'mb-2 flex items-center';
      li.innerHTML = `
        <a href="${url}" target="_blank" class="text-blue-600 hover:underline">
          ${f.name}
        </a>
        <button data-name="${f.name}"
                class="ml-4 text-red-500 hover:underline">
          Borrar
        </button>
      `;
      listEl.appendChild(li);
    }

    // 6) Borrar archivos
    listEl.querySelectorAll('button[data-name]').forEach(btn => {
      btn.onclick = async () => {
        const name = btn.getAttribute('data-name');
        if (!confirm(`Eliminar "${name}"?`)) return;
        const filePath = `${prefix}/${name}`;
        const { error } = await supabase.storage
          .from('tv-content')
          .remove([filePath]);
        if (error) {
          return alert('Error borrando: ' + error.message);
        }
        await loadFiles();
      };
    });
  }
})();
