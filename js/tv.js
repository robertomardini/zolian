// js/tv.js
(async function() {
  // 1) Generar un código aleatorio
  const tvCode = Array.from({ length: 6 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      .charAt(Math.floor(Math.random() * 36))
  ).join('');
  document.getElementById('code').innerText = tvCode;

  // 2) Insertar registro en Supabase
  const { error: insertErr } = await supabase
    .from('tv')
    .insert([{ code: tvCode, linked: false }]);
  if (insertErr) {
    document.getElementById('status').innerText = '❌ Error al registrar TV.';
    console.error(insertErr);
    return;
  }

  // 3) Dibujar QR
  const url = `${window.location.origin}/vincular.html?code=${tvCode}`;
  QRCode.toCanvas(document.getElementById('qrcode'), url, { width: 200 }, err => {
    if (err) console.error('Error generando QR', err);
  });

  // 4) Polling para detectar vinculación
  const intervalId = setInterval(async () => {
    const { data, error } = await supabase
      .from('tv')
      .select('linked')
      .eq('code', tvCode)
      .single();
    if (!error && data.linked) {
      clearInterval(intervalId);
      document.getElementById('status').innerText = '✅ TV vinculada. Iniciando slideshow…';
      startSlideshow();
    }
  }, 3000);

  // 5) Slideshow de imágenes (cada 5 s)
  async function startSlideshow() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      document.getElementById('status').innerText = 'Usuario no autenticado.';
      return;
    }
    const userId = session.user.id;
    const prefix = `${userId}/${tvCode}/`;
    const { data: files, error } = await supabase.storage
      .from('tv-content')
      .list(prefix);
    if (error) return console.error(error);
    if (!files.length) {
      document.getElementById('status').innerText = 'No hay imágenes/videos aún.';
      return;
    }

    // Prepara array de URLs
    const urls = files.map(f =>
      supabase.storage.from('tv-content').getPublicUrl(prefix + f.name).data.publicUrl
    );

    // Mostrar en un <img> y cambiar fuente
    const img = document.createElement('img');
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    document.body.appendChild(img);

    let idx = 0;
    setInterval(() => {
      img.src = urls[idx];
      idx = (idx + 1) % urls.length;
    }, 5000);
  }
})();