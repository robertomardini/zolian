// js/tv.js
;(async function() {
  // 1) Leer código de la URL
  const params = new URLSearchParams(window.location.search);
  const tvCode = params.get('code');
  if (!tvCode) {
    document.body.innerHTML = "<p style='color:red'>Falta ?code en la URL</p>";
    return;
  }
  document.getElementById('code').innerText = tvCode;

  // 2) Comprobar que existe ese registro en la tabla `tv`
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

  // 3) Si ya está linked==true, arrancamos slideshow de inmediato
  if (tvRec.linked) {
    iniciarSlideshow(tvRec.user_id);
    return;
  }

  // 4) Si no está linked, mostramos el QR para vincularlo
  const urlVincular = `${window.location.origin}/vincular.html?code=${tvCode}`;
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';
  new QRCode(qrDiv, {
    text: urlVincular,
    width: 200,
    height: 200,
    correctLevel: QRCode.CorrectLevel.H,
  });

  // 5) Polling cada 5s para detectar cuando un usuario haga sign‑up en vincular.html
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

  // 6) Función para arrancar el slideshow (recibe userId ya vinculado)
  async function iniciarSlideshow(userId) {
    // ocultar QR, código y estado
    document.getElementById('qrcode').style.display = 'none';
    document.getElementById('code').style.display   = 'none';
    document.getElementById('status').style.display = 'none';

    // montar prefijo con userId y tvCode
    const prefix = `${userId}/${tvCode}`;

    // listar archivos
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

    // mostrar slideshow
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
