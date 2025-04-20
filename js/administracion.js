(async function(){
  const params = new URLSearchParams(window.location.search);
  const tvCode = params.get('code');
  document.getElementById('tv-code').innerText = tvCode;

  // Verifica sesión y userId
  const { data: { session } } = await supabase.auth.getSession();
  if(!session) return location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
  const userId = session.user.id;

  // Crea nueva galería: genera un folder name aleatorio
  document.getElementById('create-card').onclick = () => {
    const newName = prompt('Nombre de la nueva galería:');
    if(!newName) return;
    // redirige a edición con ?code=tvCode&gallery=newName
    location.href = `ediciongaleria.html?code=${tvCode}&gallery=${encodeURIComponent(newName)}`;
  };

  // Lista galerías existentes (folders) en bucket
  const prefix = `${userId}/${tvCode}`;
  const { data: items, error } = await supabase
    .storage.from('tv-content')
    .list(prefix, { sortBy: { column: 'name', order: 'asc' } });
  const listEl = document.getElementById('existing-list');
  if(error) return listEl.innerText = 'Error cargando galerías';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerText = item.name;
    div.onclick = () => location.href = `ediciongaleria.html?code=${tvCode}&gallery=${encodeURIComponent(item.name)}`;
    listEl.appendChild(div);
  });

  // Botón pantalla completa en TV: redirige TV al slideshow de esta galería seleccionada (última)
  document.getElementById('full-btn').onclick = () => {
    // si quieres enviar la última, podrías usar items[0] o preguntar al usuario
    const gallery = prompt('Ingrese nombre de galería a mostrar:');
    if(!gallery) return;
    supabase
      .channel(`tv-${tvCode}`)
      .send({ type:'broadcast', event:'refresh', payload:{ gallery } });
    alert('Se envió la orden de mostrar ' + gallery);
  };

  // Desvincular TV
  document.getElementById('unbind').onclick = async () => {
    if(!confirm('¿Desvincular esta TV?')) return;
    await supabase.from('tv').delete().eq('code', tvCode);
    location.href = 'dashboard.html';
  };
})();
