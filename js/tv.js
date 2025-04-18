// js/tv.js
;(async function() {
  // Cliente Supabase ya expuesto en window.supabase
  const params = new URLSearchParams(window.location.search)
  const tvCodeParam = params.get('code')

  // Si llegamos con ?code=XYZ, entramos directo en modo slideshow
  if (tvCodeParam) {
    await iniciarSlideshow(tvCodeParam)
    return
  }

  // --- MODO GENERAR QR ---
  function generarCodigo(len = 6) {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length: len }, () =>
      CHARS[Math.floor(Math.random()*CHARS.length)]
    ).join('')
  }
  const tvCode = generarCodigo()
  document.getElementById('code').innerText = tvCode

  // 1) Insertar TV en BD
  let { error: insertErr } = await supabase
    .from('tv')
    .insert([{ code: tvCode, linked: false }])
  if (insertErr) {
    document.getElementById('status').innerText = 'Error al registrar TV'
    console.error(insertErr)
    return
  }

  // 3) Generar el QR apuntando a vincular.html
const url    = `${window.location.origin}/vincular.html?code=${tvCode}`;
const canvas = document.getElementById('qrcode');
QRCode.toCanvas(
  canvas,
  url,
  { width: 200 },
  err => {
    if (err) {
      console.error('QRErr', err);
      document.getElementById('status').innerText = 'Error QR';
    } else {
      document.getElementById('status').innerText = 'Escanea el QR';
    }



  // 3) Polling: en cuanto linked=true, redirijo a tv.html?code=XYZ
  const intervalo = setInterval(async () => {
    const { data, error } = await supabase
      .from('tv')
      .select('linked')
      .eq('code', tvCode)
      .single()
    if (error) {
      console.error(error)
      return
    }
    if (data.linked) {
      clearInterval(intervalo)
      // recargo en modo slideshow:
      window.location.href = `tv.html?code=${tvCode}`
    }
  }, 3000)
})()


// Función compartida para el SLIDESHOW:
async function iniciarSlideshow(tvCode) {
  // oculto todo lo de emparejar
  document.getElementById('qrcode').style.display = 'none'
  document.getElementById('code').style.display   = 'none'
  document.getElementById('status').style.display = 'none'

  // Recupero sesión para saber el user_id
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    console.error('Usuario no autenticado')
    return
  }
  const userId = session.user.id

  // Prefijo en Storage: 'userId/tvCode'
  const prefix = `${userId}/${tvCode}`

  // Listo archivos en Storage
  const { data: files, error: listErr } = await supabase
    .storage
    .from('tv-content')
    .list(prefix)
  if (listErr) {
    console.error('Error listando:', listErr)
    return
  }
  if (!files.length) {
    console.warn('No hay imágenes en:', prefix)
    return
  }

  // Construyo URLs
  const urls = files.map(f =>
    supabase
      .storage
      .from('tv-content')
      .getPublicUrl(`${prefix}/${f.name}`)
      .data.publicUrl
  )

  // Creo IMG y arranco slideshow
  let idx = 0
  const img = document.createElement('img')
  img.style.maxWidth  = '100%'
  img.style.maxHeight = '100%'
  document.body.appendChild(img)

  setInterval(() => {
    img.src = urls[idx]
    idx = (idx + 1) % urls.length
  }, 3000)
}
