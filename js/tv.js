// js/tv.js
;(async function() {
  const params = new URLSearchParams(window.location.search);
  const tvCode = params.get('code');
  const qrDiv   = document.getElementById('qrcode');
  const codeDiv = document.getElementById('code');
  const statusP = document.getElementById('status');

  if (!tvCode) {
    // —————— MODO GENERACIÓN ——————
    function generarCodigo(len = 6) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return Array.from({ length: len }, () =>
        chars[Math.floor(Math.random()*chars.length)]
      ).join('');
    }
    const nuevoCode = generarCodigo();
    codeDiv.innerText  = nuevoCode;
    statusP.innerText  = 'Escanea el QR para vincular';

    // 1) Insertamos en la tabla `tv`
    let { error: insertErr } = await supabase
      .from('tv')
      .insert([{ code: nuevoCode, linked: false }]);
    if (insertErr) {
      statusP.innerText = 'Error registrando TV.';
      console.error(insertErr);
      return;
    }

    // 2) Generamos el QR (apunta a vincular.html?code=nuevoCode)
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
      text: `${window.location.origin}/vincular.html?code=${nuevoCode}`,
      width: 200, height: 200,
      colorDark: '#000', colorLight: '#fff',
      correctLevel: QRCode.CorrectLevel.H,
    });

    // 3) Polling cada 5 s para ver si el user ya vinculó
    const intervalo = setInterval(async () => {
      const { data, error } = await supabase
        .from('tv')
        .select('linked')
        .eq('code', nuevoCode)
        .single();
      if (error) return console.error(error);
      if (data?.linked) {
        clearInterval(intervalo);
        // REDIRIGIMOS el TV a tv.html?code=…
        window.location.href = `${window.location.pathname}?code=${nuevoCode}`;
      }
    }, 5000);

  } else {
    // —————— MODO SLIDESHOW ——————
    codeDiv.innerText = tvCode;
    statusP.innerText = 'Cargando imágenes…';

    // --- Función que lista imágenes y, si no hay, se reintenta ---
    async function cargarYMostrar() {
      // 1) Recuperamos user_id
      const { data: tvRec, error: tvErr } = await supabase
        .from('tv')
        .select('user_id, linked')
        .eq('code', tvCode)
        .single();
      if (tvErr || !tvRec?.linked) {
        statusP.innerText = 'TV no vinculada aún';
        return;
      }

      // 2) Listamos del bucket
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

      // 3) Si no hay ficheros, volvemos a reintentar en 5s
      if (!files || files.length === 0) {
        statusP.innerText = 'No hay imágenes aún. Esperando…';
        setTimeout(cargarYMostrar, 5000);
        return;
      }

      // 4) Construimos URLs públicas
      const urls = files.map(f =>
        supabase
          .storage
          .from('tv-content')
          .getPublicUrl(`${prefix}/${f.name}`)
          .data.publicUrl
      );

      // 5) Ocultamos QR/código/estado
      qrDiv.style.display   = 'none';
      codeDiv.style.display = 'none';
      statusP.style.display = 'none';

      // 6) Insertamos <img> y arrancamos o actualizamos slideshow
      if (!window._tvInterval) {
        // Primera vez: creamos img y el interval
        let idx = 0;
        const img = document.createElement('img');
        img.style.maxWidth  = '100%';
        img.style.maxHeight = '100%';
        document.body.appendChild(img);

        window._tvInterval = setInterval(() => {
          img.src = urls[idx];
          idx = (idx + 1) % urls.length;
        }, 3000);

        // Guardamos la referencia al img para actualizaciones
        window._tvImgEl = img;
        window._tvIdx   = 0;
        window._tvUrls  = urls;
      } else {
        // Ya teníamos el slideshow corriendo: actualizamos las URLs
        window._tvUrls = urls;
      }
    }

    // --- Suscripción Realtime: escucha el evento 'refresh' ---
    const channel = supabase
      .channel(`tv-${tvCode}`)
      .on('broadcast', { event: 'refresh' }, () => {
        console.log('🔄 Refresh recibido en TV, recargando imágenes');
        cargarYMostrar();
      });
    await channel.subscribe();

    // 7) Primera carga de imágenes
    cargarYMostrar();
  }

})();
