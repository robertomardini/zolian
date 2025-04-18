// js/tv.js
;(async function() {
  // 1) Leer código de la URL
  const params = new URLSearchParams(window.location.search);
  const tvCode = params.get('code');
  if (!tvCode) {
    document.getElementById('status').innerText = 'Falta el parámetro code en la URL';
    return;
  }
  document.getElementById('code').innerText = tvCode;

  // 2) Comprobar que exista un registro en la tabla `tv`
  const { data: tvRec, error: fetchErr } = await supabase
    .from('tv')
    .select('linked, user_id')
    .eq('code', tvCode)
    .single();
  if (fetchErr || !tvRec) {
    document.getElementById('status').innerText = 'Código de TV inválido';
    console.error(fetchErr);
    return;
  }

  // 3) Si ya está vinculado, arrancar slideshow ya mismo
  if (tvRec.linked) {
    iniciarSlideshow(tvRec.user_id);
    return;
  }

  // 4) Si NO está vinculado, mostrar QR para vincular
  const urlVincular = `${window.location.origin}/vincular.html?code=${tvCode}`;
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';
  new QRCode(qrDiv, {
    text: urlVincular,
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });
  document.getElementById('status').innerText = 'Escanea el QR para vincular';

  // 5) Polling: cada 5s chequeamos si ya quedó `linked = true`
  const intervalo = setInterval(async () => {
    const { data, error } = await supabase
      .from('tv')
      .select('linked, user_id')
      .eq('code', tvCode)
      .single();
    if (error) return console.error(error);
    if (data.linked) {
      clearInterval(intervalo);
      iniciarSlideshow(data.user_id);
    }
  }, 5000);

  // 6) Función para arrancar el slideshow (recibe userId)
  async function iniciarSlideshow(userId) {
    // ocultar QR/código/estado
    document.getElementById('qrcode').style.display = 'none';
    document.getElementById('code').style.display   = 'none';
    document.getElementById('status').style.display = 'none';

    // montar carpeta: userId/tvCode
    const prefix = `${userId}/${tvCode}`;

    // listar archivos en Storage
    const { data: files, error } = await supabase
      .storage
      .from('tv-content')
      .list(prefix);
    if (error) {
      console.error('Error listando archivos:', error);
      return;
    }
    if (!files.length) {
      console.warn('No hay ficheros en el bucket para', prefix);
      return;
    }

    // construir URLs públicas
    const urls = files.map(f =>
      supabase
        .storage
        .from('tv-content')
        .getPublicUrl(`${prefix}/${f.name}`)
        .data
        .publicUrl
    );

    // arrancar slideshow
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
