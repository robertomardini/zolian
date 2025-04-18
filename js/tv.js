// js/tv.js
 ;(async function() {
   const params = new URLSearchParams(window.location.search);
   const tvCode = params.get('code');
   const qrDiv   = document.getElementById('qrcode');
   const codeDiv = document.getElementById('code');
   const statusP = document.getElementById('status');
   // Cliente Supabase ya expuesto en window.supabase
   const params = new URLSearchParams(window.location.search)
   const tvCodeParam = params.get('code')
 
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
   // Si llegamos con ?code=XYZ, entramos directo en modo slideshow
   if (tvCodeParam) {
     await iniciarSlideshow(tvCodeParam)
     return
   }
 
     // Insertamos en la tabla `tv`
     let { error } = await supabase
       .from('tv')
       .insert([{ code: nuevoCode, linked: false }]);
     if (error) {
       statusP.innerText = 'Error registrando TV.';
       console.error(error);
       return;
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
 
     // Generamos el QR (apunta a tv.html?code=nuevoCode)
     qrDiv.innerHTML = '';
     new QRCode(qrDiv, {
       text: `${window.location.origin}/vincular.html?code=${nuevoCode}`,
       width: 200, height: 200,
       colorDark: '#000', colorLight: '#fff',
       correctLevel: QRCode.CorrectLevel.H,
     });
   // 1) Insertar TV en BD
   let { error: insertErr } = await supabase
     .from('tv')
     .insert([{ code: tvCode, linked: false }])
   if (insertErr) {
     document.getElementById('status').innerText = 'Error al registrar TV'
     console.error(insertErr)
     return
   }
 
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
   // 2) Generar QR → vincular.html?code=XYZ
   const vincularUrl = `${location.origin}/vincular.html?code=${tvCode}`
   document.getElementById('qrcode').innerHTML = ''
   QRCode.toCanvas(
     document.getElementById('qrcode'),
     vincularUrl,
     { width: 200 },
     err => { if (err) console.error(err) }
   )
 
   } else {
     // —————— MODO SLIDESHOW ——————
     codeDiv.innerText = tvCode;
     statusP.innerText = 'Cargando imágenes…';
   document.getElementById('status').innerText =
     'Escanea el QR con tu móvil para vincular'
 
     // Recuperamos user_id para montar prefijo
     const { data: tvRec, error: tvErr } = await supabase
   // 3) Polling: en cuanto linked=true, redirijo a tv.html?code=XYZ
   const intervalo = setInterval(async () => {
     const { data, error } = await supabase
       .from('tv')
       .select('user_id, linked')
       .select('linked')
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
       .single()
     if (error) {
       console.error(error)
       return
     }
     if (!files.length) {
       statusP.innerText = 'No hay imágenes';
       return;
     if (data.linked) {
       clearInterval(intervalo)
       // recargo en modo slideshow:
       window.location.href = `tv.html?code=${tvCode}`
     }
   }, 3000)
 })()
 
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
 
     // Insertamos <img> y arrancamos slideshow
     let idx = 0;
     const img = document.createElement('img');
     img.style.maxWidth  = '100%';
     img.style.maxHeight = '100%';
     document.body.appendChild(img);
   // Prefijo en Storage: 'userId/tvCode'
   const prefix = `${userId}/${tvCode}`
 
     setInterval(() => {
       img.src = urls[idx];
       idx = (idx + 1) % urls.length;
     }, 3000);
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
 
 })();
   setInterval(() => {
     img.src = urls[idx]
     idx = (idx + 1) % urls.length
   }, 3000)
 }
