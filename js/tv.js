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
  iniciarSlideshow(); // ya dentro lee la sesión
}

  }, 5000);

  // 5) Arrancar el slideshow sin volver a pedir sesión
  async function iniciarSlideshow() {
  // 1) ocultar QR…
  // 2) recuperar sesión y userId aquí mismo
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('Usuario no autenticado');
    return;
  }
  const userId = session.user.id;

  // 3) montar prefijo correcto
  const prefix = `${userId}/${tvCode}`;

  // 4) listar
  const { data: files, error } = await supabase
    .storage
    .from('tv-content')
    .list(prefix);

  if (error) {
    console.error('Error listando archivos:', error);
    return;
  }
  if (files.length === 0) {
    console.warn('No hay ficheros en el bucket');
    return;
  }

  // 5) construir URLs y arrancar slideshow…
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
  img.style.maxWidth = '100%';
  img.style.maxHeight = '100%';
  document.body.appendChild(img);

  setInterval(() => {
    img.src = urls[idx];
    idx = (idx + 1) % urls.length;
  }, 3000);
}

})();
