Ultimo tv.js

// js/tv.js
;(async function() {
  const params = new URLSearchParams(window.location.search);
  const tvCode = params.get('code');
  const qrDiv   = document.getElementById('qrcode');
  const codeDiv = document.getElementById('code');
  const statusP = document.getElementById('status');

  if (!tvCode) {
    // —————— MODO GENERACIÓN ——————
    // ... sin cambios ...
  } else {
    // —————— MODO SLIDESHOW ——————
    codeDiv.innerText = tvCode;
    statusP.innerText = 'Cargando imágenes…';

    // Variables globales para el slideshow
    window._tvUrls     = [];
    window._tvIdx      = 0;
    window._tvImgEl    = null;
    window._tvInterval = null;

    // Función que lista imágenes y actualiza el slideshow
    async function cargarYMostrar() {
      // 1) Recuperamos user_id y linked
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
      if (!files || files.length === 0) {
        statusP.innerText = 'No hay imágenes aún. Esperando…';
        return;
      }

      // 3) Construimos URLs públicas
      const nuevasUrls = files.map(f =>
        supabase
          .storage
          .from('tv-content')
          .getPublicUrl(`${prefix}/${f.name}`)
          .data.publicUrl
      );

      // 4) Primera vez: inicializamos el <img> y el intervalo
      if (!window._tvInterval) {
        // Ocultamos UI de vinculación
        qrDiv.style.display   = 'none';
        codeDiv.style.display = 'none';
        statusP.style.display = 'none';

        // Creamos la imagen
        const img = document.createElement('img');
        img.style.maxWidth  = '100%';
        img.style.maxHeight = '100%';
        document.body.appendChild(img);
        window._tvImgEl = img;

        // Asignamos las URLs
        window._tvUrls = nuevasUrls;
        window._tvIdx  = 0;
        img.src        = window._tvUrls[0];

        // Arrancamos el slideshow
        window._tvInterval = setInterval(() => {
          window._tvIdx = (window._tvIdx + 1) % window._tvUrls.length;
          window._tvImgEl.src = window._tvUrls[window._tvIdx];
        }, 3000);

      } else {
        // Si ya existía, solo actualizamos las URLs
        window._tvUrls = nuevasUrls;
        // Aseguramos que el índice esté dentro de rango
        window._tvIdx = window._tvIdx % window._tvUrls.length;
      }
    }

    // Llamada inicial
    cargarYMostrar();

    // AUTO‑POLL cada 10s para recargar las URLs en segundo plano
    setInterval(cargarYMostrar, 10000);
  }
})();
