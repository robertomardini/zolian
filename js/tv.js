// js/tv.js
;(async function() {
  // 1) Generar un código aleatorio
  function generarCodigo(len = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: len }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }
  const tvCode = generarCodigo();
  document.getElementById('code').innerText = tvCode;

  // 2) Insertar registro en la tabla `tv`
  const { error: insertErr } = await supabase
    .from('tv')
    .insert([{ code: tvCode, linked: false }]);
  if (insertErr) {
    document.getElementById('status').innerText = 'Error al registrar TV.';
    console.error(insertErr);
    return;
  }

  // 3) Generar el QR apuntando a vincular.html
  const url   = `${window.location.origin}/vincular.html?code=${tvCode}`;
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = ''; // limpiamos cualquier QR antiguo
  new QRCode(qrDiv, {
    text: url,
    width: 200,
    height: 200,
    colorDark:  '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });

  // 4) Hacer polling cada 5s hasta que linked === true
  const intervalo = setInterval(async () => {
    const { data, error } = await supabase
      .from('tv')
      .select('linked, user_id')
      .eq('code', tvCode)
      .single();
    if (error) {
      console.error(error);
      return;
    }
    if (data.linked) {
      clearInterval(intervalo);
      iniciarSlideshow(data.user_id);
    }
  }, 5000);

  // 5) Arrancar el slideshow
  async function iniciarSlideshow(userId) {
    // Ocultar QR, código y estado
    document.getElementById('qrcode').style.display = 'none';
    document.getElementById('code').style.display   = 'none';
    document.getElementById('status').style.display = 'none';

    // 5.1) Montar prefix **sin** barra final
    const prefix = `${userId}/${tvCode}`;  // <<-- ¡NO slash "/ " al final!

    // 5.2) Listar archivos en Storage
    const { data: files, error } = await supabase
      .storage
      .from('tv-content')
      .list(prefix);
    if (error) {
      console.error('Error listando archivos:', error.message);
      return;
    }
    if (files.length === 0) {
      console.warn('No hay ficheros en el bucket para', prefix);
      return;
    }

    // 5.3) Construir URLs públicas
    const urls = files.map(f =>
      supabase
        .storage
        .from('tv-content')
        .getPublicUrl(`${prefix}/${f.name}`)
        .data
        .publicUrl
    );

    // 5.4) Mostrar slideshow
    let idx = 0;
    const img = document.createElement('img');
    img.style.maxWidth  = '100%';
    img.style.maxHeight = '100%';
    document.body.appendChild(img);

    setInterval(() => {
      img.src = urls[idx];
      idx = (idx + 1) % urls.length;
    }, 3000);
  }
})();
