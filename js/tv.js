// js/tv.js
;(async function() {
  const params = new URLSearchParams(window.location.search);
  const tvCode = params.get('code');
  const qrDiv   = document.getElementById('qrcode');
  const codeDiv = document.getElementById('code');
  const statusP = document.getElementById('status');

  // Instancia supabase ya cargada por supabaseClient.js

  if (!tvCode) {
    // —————— MODO GENERACIÓN ——————
    function generarCodigo(len = 6) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return Array.from({length: len}, () =>
        chars[Math.floor(Math.random()*chars.length)]
      ).join('');
    }
    const nuevoCode = generarCodigo();
    codeDiv.innerText = nuevoCode;
    statusP.innerText = 'Escanea el QR para vincular';

    // Insertamos en la tabla `tv`
    let { error } = await supabase
      .from('tv')
      .insert([{ code: nuevoCode, linked: false }]);
    if (error) {
      statusP.innerText = 'Error registrando TV.';
      console.error(error);
      return;
    }

    // Generamos el QR (apunta a tv.html?code=nuevoCode)
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
      text: `${window.location.origin}/vincular.html?code=${nuevoCode}`,
      width: 200, height: 200,
      colorDark: '#000', colorLight: '#fff',
      correctLevel: QRCode.CorrectLevel.H,
    });

    // Polling cada 5 s para ver si el user ya vinculó
    const intervalo = setInterval(async () => {
      const { data, error } = await supabase
        .from('tv')
        .select('linked')
        .eq('code', nuevoCode)
        .single();
      if (error) return console.error(error);
      if (data.linked) {
        clearInterval(intervalo);
        // REDIRIGIMOS el TV para que pase a modo slideshow:
        window.location.href = `${window.location.pathname}?code=${nuevoCode}`;
      }
    }, 5000);

  } else {
    // —————— MODO SLIDESHOW ——————
    codeDiv.innerText = tvCode;
    statusP.innerText = 'Cargando imágenes…';

    // Recuperamos user_id para montar prefijo
    const { data: tvRec, error: tvErr } = await supabase
      .from('tv')
      .select('user_id, linked')
      .eq('code', tvCode)
      .single();
    if (tvErr || !tvRec.linked) {
      statusP.innerText = 'TV no vinculada aún';
      return;
    }

    // Listamos del bucket
    const prefix = `${tvRec.user_id}/${tvCode}`;
    const { data: files, error: listErr } = await supabase
      .storage
      .from('tv-content')
      .list(prefix);
    if (listErr) {
      console.error('Error listando:', listErr);
      statusP.innerText = 'Error cargando slideshow';
      return;
    }
    if (!files.length) {
      statusP.innerText = 'No hay imágenes';
      return;
    }

    // Construimos URLs y arrancamos
    const urls = files.map(f =>
      supabase
        .storage
        .from('tv-content')
        .getPublicUrl(`${prefix}/${f.name}`)
        .data.publicUrl
    );

    // Ocultamos QR y status
    qrDiv.style.display     = 'none';
    codeDiv.style.display   = 'none';
    statusP.style.display   = 'none';

    // Insertamos <img> y arrancamos slideshow
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
