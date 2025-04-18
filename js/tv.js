(async function() {
  // 1) Generar un código aleatorio
  function generarCodigo(len = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({length: len}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  }
  const tvCode = generarCodigo();
  document.getElementById('code').innerText = tvCode;

  // 2) Crear registro en la tabla `tv`
  const { error: insertErr } = await supabase.from('tv').insert([{ code: tvCode, linked: false }]);
  if (insertErr) {
    document.getElementById('status').innerText = 'Error al registrar TV.';
    console.error(insertErr);
    return;
  }

  // 3) Generar el QR apuntando a vincular.html
  const url = `${window.location.origin}/vincular.html?code=${tvCode}`;
  QRCode.toCanvas(document.getElementById('qrcode'), url, { width: 200 }, err => {
    if (err) console.error('Error generando QR', err);
  });

  // 4) Opcional: hacer polling cada 5s para ver si ya está vinculado
  setInterval(async () => {
    const { data, error } = await supabase
      .from('tv')
      .select('linked')
      .eq('code', tvCode)
      .single();
    if (!error && data.linked) {
      document.getElementById('status').innerText = 'TV vinculada. Iniciando slideshow…';
      clearInterval(this);
      // Aquí arrancas tu slideshow, por ejemplo:
      startSlideshow();
    }
  }, 5000);

  // 5) Ejemplo mínimo de slideshow (puedes personalizar)
  async function startSlideshow() {
    const userRes = await supabase.auth.getSession();
    if (!userRes.data.session) {
      document.getElementById('status').innerText = 'Usuario no autenticado.';
      return;
    }
    const userId = userRes.data.session.user.id;
    const bucket = supabase.storage.from('tv-content');
    const prefix = `${userId}/${tvCode}/`;

    const filesRes = await bucket.list(prefix);
    if (filesRes.error) return console.error(filesRes.error);

    const files = filesRes.data.map(f =>
      bucket.getPublicUrl(prefix + f.name).data.publicUrl
    );

    let idx = 0;
    const img = document.createElement('img');
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    document.body.appendChild(img);

    setInterval(() => {
      if (files.length === 0) return;
      img.src = files[idx];
      idx = (idx + 1) % files.length;
    }, 3000);
  }
})();
