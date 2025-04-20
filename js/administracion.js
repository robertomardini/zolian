// js/administracion.js
;(async () => {
  const params = new URLSearchParams(window.location.search);
  const tvCode = params.get('code');
  const tvSpan = document.getElementById('tv-code');
  const listEl = document.getElementById('gallery-list');
  const btnNew = document.getElementById('btn-new');
  const btnFull = document.getElementById('btn-full');
  const btnUn  = document.getElementById('btn-unlink');

  if (!tvCode) {
    alert('Falta el parámetro code en la URL');
    return;
  }
  tvSpan.innerText = tvCode;

  // 1) Validar sesión y userId
  const { data: { session }, error: sessErr } = await supabase.auth.getSession();
  if (sessErr || !session) {
    window.location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
    return;
  }
  const userId = session.user.id;

  // 2) Listar carpetas (galerías) en Storage
  async function loadGalleries() {
    listEl.innerHTML = '<li>Cargando galerías…</li>';
    const prefix = `${userId}/${tvCode}`;
    const { data: items, error } = await supabase
      .storage
      .from('tv-content')
      .list(prefix);
    if (error) {
      listEl.innerHTML = `<li class="text-red-500">Error cargando: ${error.message}</li>`;
      return;
    }
    // items es array de objetos con .name (ya sean ficheros o subfolders)
    // asumimos que cada .name es nombre de subcarpeta de galería
    if (!items.length) {
      listEl.innerHTML = '<li>No tienes galerías aún.</li>';
      return;
    }
    listEl.innerHTML = '';
    items.forEach(item => {
      const gal = item.name;
      const li = document.createElement('li');
      li.className = 'mb-2';
      li.innerHTML = `
        <span class="font-semibold">${gal}</span>
        <button data-gal="${gal}" class="ml-4 bg-blue-500 text-white px-2 py-1 rounded administrar">
          Administrar
        </button>
        <button data-gal="${gal}" class="ml-2 bg-green-500 text-white px-2 py-1 rounded mostrar">
          Mostrar en TV
        </button>`;
      listEl.appendChild(li);
    });

    // asignar handlers
    document.querySelectorAll('.administrar').forEach(btn => {
      btn.onclick = () => {
        const gal = btn.dataset.gal;
        location.href = `ediciongaleria.html?code=${tvCode}&gallery=${encodeURIComponent(gal)}`;
      };
    });
    document.querySelectorAll('.mostrar').forEach(btn => {
      btn.onclick = () => {
        const gal = btn.dataset.gal;
        // emite evento realtime para la TV
        supabase
          .channel(`tv-${tvCode}`)
          .send({
            type:   'broadcast',
            event:  'setGallery',
            payload:{ gallery: gal }
          });
        alert(`Se ha enviado la orden para mostrar "${gal}" en la TV.`);
      };
    });
  }

  await loadGalleries();

  // 3) Crear nueva galería
  btnNew.onclick = () => {
    const nombre = prompt('Nombre de la nueva galería:');
    if (nombre) {
      location.href = `ediciongaleria.html?code=${tvCode}&gallery=${encodeURIComponent(nombre)}`;
    }
  };

  // 4) Pantalla completa en TV (se reenvía último gallery o vacío)
  btnFull.onclick = () => {
    supabase
      .channel(`tv-${tvCode}`)
      .send({
        type:   'broadcast',
        event:  'fullscreen',
        payload:{}
      });
    alert('Se ha enviado la orden de pantalla completa.');
  };

  // 5) Desvincular TV
  btnUn.onclick = async () => {
    if (!confirm('¿Seguro que quieres desvincular esta TV? Se eliminará tu sesión.')) return;
    const { error } = await supabase
      .from('tv')
      .delete()
      .eq('code', tvCode);
    if (error) {
      return alert('Error al desvincular: ' + error.message);
    }
    alert('TV desvinculada.');
    window.location.href = 'dashboard.html';
  };
})();
