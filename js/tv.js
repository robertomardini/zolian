// js/tv.js
;(async function() {
  // 1) Generar un código aleatorio
  function generarCodigo(len = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({length: len}, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }
  const tvCode = generarCodigo();
  document.getElementById('code').innerText = tvCode;

  // 2) Insertar registro en la tabla `tv`
  let { error: insertErr } = await supabase
    .from('tv')
    .insert([{ code: tvCode, linked: false }]);
  if (insertErr) {
    document.getElementById('status').innerText = 'Error al registrar TV.';
    console.error(insertErr);
    return;
  }

  // 3) Generar el QR apuntando a vincular.html
  const url = `${window.location.origin}/vincular.html?code=${tvCode}`;
  QRCode.toCanvas(
    document.getElementById('qrcode'),
    url,
    { width: 200 },
    err => { if (err) console.error('QRErr', err); }
  );

  // 4) Polling cada 5s para detectar que el TV ya no está linked=false
  const intervalo = setInterval(async () => {
    const { data, error } = await supabase
      .from('tv')
      .select('linked')
      .eq('code', tvCode)
      .single();

    if (error) {
      console.error(error);
      return;
    }
    if (data.linked) {
      clearInterval(intervalo);
      iniciarSlideshow();
    }
  }, 5000);

  // 5) Función para arrancar el slideshow de imágenes
  async function iniciarSlideshow() {
    document.getElementById('qrcode').style.display = 'none';
    document.getElementById('code').style.display   = 'none';
    document.getElementById('status').style.display = 'none';

    // 5.1) Recuperar sesión y userId
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('Usuario no autenticado');
      return;
    }
    const userId = session.user.id;
    const prefix = `${userId}/${tvCode}`;      // ¡sin slash al inicio!

    // 5.2) Listar archivos en Storage
    const { data: files, error } = await supabase
      .storage
      .from('tv-content')
      .list(prefix);

    if (error) {
      console.error('Error listando:', error);
      return;
    }
    if (!files.length) {
      const s = document.createElement('p');
      s.innerText = 'No hay imágenes para mostrar.';
      s.style.color = '#fff';
      document.getElementById('slideshow').appendChild(s);
      document.getElementById('slideshow').style.display = 'block';
      return;
    }

    // 5.3) Generar URLs públicas
    const urls = files.map(f =>
      supabase
        .storage
        .from('tv-content')
        .getPublicUrl(`${prefix}/${f.name}`)
        .data
        .publicUrl
    );

    // 5.4) Montar el <img> y ciclos
    const slideDiv = document.getElementById('slideshow');
    slideDiv.style.display = 'block';
    const img = document.createElement('img');
    slideDiv.appendChild(img);

    let idx = 0;
    img.src = urls[0];
    setInterval(() => {
      idx = (idx + 1) % urls.length;
      img.src = urls[idx];
    }, 3000);
  }
})();
