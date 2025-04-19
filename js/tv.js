// js/tv.js
;(async function() {
  const params = new URLSearchParams(window.location.search);
  const tvCode = params.get('code');
  const qrDiv   = document.getElementById('qrcode');
  const codeDiv = document.getElementById('code');
  const statusP = document.getElementById('status');

  if (!tvCode) {
    // … tu lógica de MODO GENERACIÓN (igual que antes)
    return;
  }

  // —————— MODO SLIDESHOW ——————
  codeDiv.innerText  = tvCode;
  statusP.innerText  = 'Cargando imágenes…';
  qrDiv.style.display   = 'none';
  codeDiv.style.display = 'none';
  statusP.style.display = 'none';

  // 1) Recuperar user_id
  const { data: tvRec, error: tvErr } = await supabase
    .from('tv')
    .select('user_id, linked')
    .eq('code', tvCode)
    .single();
  if (tvErr || !tvRec?.linked) {
    statusP.innerText = 'TV no vinculada aún';
    return;
  }
  const userId = tvRec.user_id;
  const prefix = `${userId}/${tvCode}`;

  // 2) Variables del slideshow
  let urls = [];
  let idx  = 0;
  const img = document.createElement('img');
  img.style.maxWidth  = '100%';
  img.style.maxHeight = '100%';
  document.body.appendChild(img);

  // 3) Función para recargar la lista de URLs
  async function refreshUrls() {
    const { data: files, error } = await supabase
      .storage
      .from('tv-content')
      .list(prefix);
    if (error) {
      console.error('Error listando imágenes:', error);
      return;
    }
    // Construye nuevas URLs
    const nuevas = files.map(f =>
      supabase
        .storage
        .from('tv-content')
        .getPublicUrl(`${prefix}/${f.name}`)
        .data.publicUrl
    );
    // Si cambia el número o hay diferencias, actualiza el array
    if (
      nuevas.length !== urls.length ||
      nuevas.some((u,i) => u !== urls[i])
    ) {
      urls = nuevas;
      // Si era la primera vez, arranca inmediatamente
      if (urls.length && img.src !== urls[0]) {
        idx = 0;
        img.src = urls[0];
      }
    }
  }

  // 4) Arranca primero el refresco y slideshow
  await refreshUrls();
  setInterval(() => {
    if (urls.length === 0) return;
    idx = (idx + 1) % urls.length;
    img.src = urls[idx];
  }, 3000);

  // 5) Cada 10s vuelve a recargar la lista de imágenes
  setInterval(refreshUrls, 10000);

})();
