// js/galeria.js

const params = new URLSearchParams(window.location.search);
const tvCode = params.get('code');
document.getElementById('tv-code').innerText = `TV: ${tvCode}`;

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return window.location.href =
      `login.html?redirect=${encodeURIComponent(location.pathname + location.search)}`;
  }
  const { data, error } = await supabase
    .from('tv')
    .select('user_id')
    .eq('code', tvCode)
    .single();
  if (error || data.user_id !== session.user.id) {
    return alert("No tienes permiso para ver esta galería");
  }
  loadFiles();
}
init();

async function uploadFile() {
  const input = document.getElementById('file-input');
  if (!input.files.length) return alert("Selecciona un archivo");

  const file = input.files[0];
  const { data: { session } } = await supabase.auth.getSession();
  const path = `${session.user.id}/${tvCode}/${file.name}`;

  const { error } = await supabase.storage
    .from('tv-content')
    .upload(path, file, { upsert: true });
  if (error) return alert("Error subiendo: " + error.message);

  // —————— NUEVO: emitir evento de "refresh" al canal de la TV ——————
  await supabase
    .channel(`tv-${tvCode}`)
    .send({
      type: 'broadcast',
      event: 'refresh',
      payload: {}
    });
  // ——————————————————————————————————————————————————————————————

  loadFiles();
}

async function loadFiles() {
  const { data: { session } } = await supabase.auth.getSession();
  const prefix = `${session.user.id}/${tvCode}`;
  const { data: files, error } = await supabase.storage
    .from('tv-content')
    .list(prefix);
  const listEl = document.getElementById('file-list');

  if (error) {
    listEl.innerHTML = `<li>Error: ${error.message}</li>`;
    return;
  }
  if (!files.length) {
    listEl.innerHTML = `<li>No hay archivos.</li>`;
    return;
  }

  listEl.innerHTML = '';
  files.forEach(f => {
    const filePath  = `${prefix}/${f.name}`;
    const publicUrl = supabase.storage
      .from('tv-content')
      .getPublicUrl(filePath)
      .data.publicUrl;
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="${publicUrl}" target="_blank">${f.name}</a>
      <button onclick="deleteFile('${f.name}')"
              class="ml-4 text-red-500">Borrar</button>`;
    listEl.appendChild(li);
  });
}

async function deleteFile(name) {
  const { data: { session } } = await supabase.auth.getSession();
  const filePath = `${session.user.id}/${tvCode}/${name}`;
  const { error } = await supabase.storage
    .from('tv-content')
    .remove([filePath]);
  if (error) return alert("Error borrando: " + error.message);

  // —————— OPCIONAL: también notificar al TV tras borrar ——————
  await supabase
    .channel(`tv-${tvCode}`)
    .send({
      type: 'broadcast',
      event: 'refresh',
      payload: {}
    });
  // ————————————————————————————————————————————————————————————

  loadFiles();
document.getElementById('btn-refresh-tv').addEventListener('click', async () => {
  try {
    await supabase
      .channel(`tv-${tvCode}`)
      .send({
        type: 'broadcast',
        event: 'refresh',
        payload: {}
      });
    alert('Se ha enviado la orden de refrescar el slideshow en la TV.');
  } catch (err) {
    console.error('Error enviando refresh al TV:', err);
    alert('No se pudo enviar la orden de refresco.');
  }
});
  
}
