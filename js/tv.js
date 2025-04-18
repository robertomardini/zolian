// js/tv.js
;(async function() {
  const params = new URLSearchParams(window.location.search);
  let tvCode = params.get('code');

  if (!tvCode) {
    // —————— Estoy en modo GENERAR ——————
    function generarCodigo(len = 6) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return Array.from({length: len}, () =>
        chars[Math.floor(Math.random()*chars.length)]
      ).join('');
    }
    tvCode = generarCodigo();
    document.getElementById('code').innerText = tvCode;

    // Inserto en la tabla
    const { error } = await supabase
      .from('tv')
      .insert([{ code: tvCode, linked: false }]);
    if (error) {
      document.getElementById('status').innerText = 'Error al registrar TV.';
      console.error(error);
      return;
    }

    // Pinto QR para vincular
    const urlVincular = `${window.location.origin}/tv.html?code=${tvCode}`;
    const qrDiv = document.getElementById('qrcode');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
      text: urlVincular,
      width: 200,
      height: 200,
      colorDark: '#000',
      colorLight: '#fff',
      correctLevel: QRCode.CorrectLevel.H,
    });
    document.getElementById('status').innerText = 'Escanea el QR para vincular';

    // Luego polling para enlace…
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

  } else {
    // —————— Estoy en modo SLIDESHOW DIRECTO ——————
    document.getElementById('code').innerText = tvCode;
    document.getElementById('status').innerText = 'Cargando slideshow…';

    // Compruebo el registro y si está vinculado arranco.
    const { data: tvRec, error: fetchErr } = await supabase
      .from('tv')
      .select('linked, user_id')
      .eq('code', tvCode)
      .single();
    if (fetchErr || !tvRec.linked) {
      document.getElementById('status').innerText = 'TV no vinculada aún';
      return;
    }
    iniciarSlideshow(tvRec.user_id);
  }

  // —————— Función común ——————
  async function iniciarSlideshow(userId) {
    document.getElementById('qrcode').style.display = 'none';
    document.getElementById('code').style.display   = 'none';
    document.getElementById('status').style.display = 'none';

    const prefix = `${userId}/${tvCode}`;
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

    const urls = files.map(f =>
      supabase
        .storage
        .from('tv-content')
        .getPublicUrl(`${prefix}/${f.name}`)
        .data
        .publicUrl
    );

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
