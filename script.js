/* script.js */

/**
 * Inicializa los listeners del sidebar (toggle, búsqueda, logout y compartir),
 * controla el overlay para oscurecer la página,
 * y fuerza que .home ocupe siempre todo el ancho.
 */
function initSidebar() {
  const body    = document.querySelector('body');
  const sidebar = body.querySelector('nav.sidebar');
  const home    = body.querySelector('.home');
  const overlay = document.querySelector('.overlay');
  if (!sidebar) return;

  // -- Compartir --
  const shareBtn = sidebar.querySelector('#share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const shareData = {
        title: 'Zolian App',
        text: 'Échale un vistazo a Zolian App para compartir galerías',
        url: window.location.origin
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareData.url);
          alert('Enlace copiado al portapapeles: ' + shareData.url);
        }
      } catch (err) {
        console.error('Error compartiendo:', err);
      }
    });
  }

  // -- Elementos del sidebar --
  const toggle    = sidebar.querySelector('.toggle');
  const searchBtn = sidebar.querySelector('.search-box');
  const logoutBtn = sidebar.querySelector('#logout');

  // -- Función para forzar que .home ocupe todo el ancho --
  function ajustarHomeFull() {
    if (!home) return;
    home.style.left  = '0';
    home.style.width = '100%';
  }

  // -- Toggle sidebar + overlay --
  toggle.addEventListener('click', () => {
    const cerrado = sidebar.classList.toggle('close');
    if (cerrado) overlay.classList.remove('active');
    else         overlay.classList.add('active');
    ajustarHomeFull();
  });

  // -- Clic en overlay cierra sidebar --
  overlay.addEventListener('click', () => {
    sidebar.classList.add('close');
    overlay.classList.remove('active');
    ajustarHomeFull();
  });

  // -- Abrir sidebar desde búsqueda --
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      sidebar.classList.remove('close');
      overlay.classList.add('active');
      ajustarHomeFull();
    });
  }

  // -- Logout --
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });
  }

  // Ajuste inicial
  ajustarHomeFull();
}

// Inyecta el sidebar y el overlay, luego lanza initSidebar
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sidebar-container');

  function crearOverlay() {
    if (!document.querySelector('.overlay')) {
      const ov = document.createElement('div');
      ov.classList.add('overlay');
      document.body.appendChild(ov);
    }
  }

  if (container) {
    fetch('/sidebar.html')
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        crearOverlay();
        initSidebar();
        window.dispatchEvent(new Event('sidebarReady'));
      })
      .catch(err => console.error('Error cargando sidebar:', err));
  } else {
    crearOverlay();
    initSidebar();
    window.dispatchEvent(new Event('sidebarReady'));
  }
});
