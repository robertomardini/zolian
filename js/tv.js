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
    // 1) Obtenemos user_id...
    const { data: tvRow } = await supabase
      .from('tv')
      .select('user_id')
      .eq('code', tvCode)
      .single();
    const userId = tvRow.user_id;

    // 2) Listamos archivos
    //    Cambia aquí según funcione con o sin slash:
    const prefix = `${userId}/${tvCode}/`;
    const { data: files, error: listErr } = await supabase
      .storage
      .from('tv-content')
      .list(prefix);

    console.log('Archivos listados con prefijo', prefix, ':', files, listErr);
    if (listErr) {
      document.getElementById('status').innerText = 'Error cargando imágenes.';
      return;
    }
    if (files.length === 0) {
      document.getElementById('status').innerText = 'No hay imágenes.';
      return;
    }

    // 3) Construimos las URLs y montamos el slideshow...
    const urls = files.map(f => {
      const path = `${prefix}${f.name}`;
      return supabase
        .storage
        .from('tv-content')
        .getPublicUrl(path)
        .data
        .publicUrl;
    });

    let idx = 0;
    const img = document.createElement('img');
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    document.body.appendChild(img);

    setInterval(() => {
      img.src = urls[idx];
      idx = (idx + 1) % urls.length;
    }, 3000);
  }
