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
const qrContainer = document.getElementById('qrcode');
// limpia cualquier contenido previo
qrContainer.innerHTML = '';
// crea un nuevo QRCode en el div
new QRCode(qrContainer, {
  text: url,
  width: 200,
  height: 200,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H,
});


  // 4) Polling cada 5s para detectar que el TV ya no está linked=false
  const intervalo = setInterval(async () => {
    const { data, error } = await supabase
      .from('tv')
      .select('linked, user_id')      // <–– pedimos user_id
      .eq('code', tvCode)
      .single();
    if (error) {
      console.error(error);
      return;
    }
    if (data.linked) {
      clearInterval(intervalo);
      iniciarSlideshow(data.user_id);  // <–– pasamos el user_id
    }
  }, 5000);

  // 5) Arrancar el slideshow sin volver a pedir sesión
 async function iniciarSlideshow() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Usuario no autenticado');
  const userId = session.user.id;
  const prefix = `${userId}/${tvCode}`;
  /* … */
}

    // 5.2) Listar archivos en Storage
    const { data: files, error } = await supabase
      .storage
      .from('tv-content')
      .list(prefix);
    if (error) {
      console.error('Error listando:', error);
      return;
    }
    if (files.length === 0) {
      console.warn('No hay ficheros en el bucket');
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
