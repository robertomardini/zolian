// js/tv.js

(async function() {
  // 1) Generar un código aleatorio
  function generarCodigo(len = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: len }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  const tvCode = generarCodigo();
  document.getElementById('code').innerText = tvCode;

  // 2) Crear registro en la tabla `tv`
  const { error: insertErr } = await supabase
    .from('tv')
    .insert([{ code: tvCode, linked: false }]);
  if (insertErr) {
    document.getElementById('status').innerText = 'Error al registrar TV.';
    console.error(insertErr);
    return;
  }

  // 3) Generar el QR apuntando a vincular.html
  const url = `${window.location.origin}/vincular.html?code=${tvCode}`;
  new QRCode(document.getElementById('qrcode'), {
    text: url,
    width: 200,
    colorDark: "#000000",
    colorLight: "#ffffff"
  });

  // 4) Polling cada 5s para detectar vinculación
  const intervalId = setInterval(async () => {
    const { data, error } = await supabase
      .from('tv')
      .select('linked')
      .eq('code', tvCode)
      .single();

    if (!error && data.linked) {
      clearInterval(intervalId);
      document.getElementById('status').innerText = 'TV vinculada. Iniciando slideshow…';
      startSlideshow();
    }
  }, 5000);

  // 5) Slideshow
  async function startSlideshow() {
    // 5.1) Obtener el user_id de la tabla tv
    const { data: tvRow, error: tvErr } = await supabase
      .from('tv')
      .select('user_id')
      .eq('code', tvCode)
      .single();

    if (tvErr || !tvRow?.user_id) {
      console.error(tvErr);
      document.getElementById('status').innerText = 'No se pudo obtener el propietario.';
      return;
    }

    const userId = tvRow.user_id;
    const bucket = supabase.storage.from('tv-content');
    const folder = `${userId}/${tvCode}/`;  // SIN barra al final

    // 5.2) Listar archivos
    const { data: files, error: listErr } = await bucket.list(folder);
    if (listErr) {
      console.error(listErr);
      document.getElementById('status').innerText = 'Error cargando imágenes.';
      return;
    }
    console.log('Archivos listados:', files);

    // 5.3) Construir URLs públicas
    const urls = files.map(f => {
      const path = `${folder}/${f.name}`;
      return bucket.getPublicUrl(path).data.publicUrl;
    });

    if (urls.length === 0) {
      document.getElementById('status').innerText = 'No hay imágenes.';
      return;
    }

    // 5.4) Mostrar slideshow
    let idx = 0;
    const img = document.createElement('img');
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.className = 'mt-4';
    document.body.appendChild(img);

    setInterval(() => {
      img.src = urls[idx];
      idx = (idx + 1) % urls.length;
    }, 3000);
  }

})();  // <-- Cierre de la IIFE
