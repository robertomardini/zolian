/* script.js */

/**
 * Inicializa los listeners del sidebar (toggle, búsqueda, dark mode, logout,
 * compartir y escanear QR), controla el overlay para oscurecer la página,
 * y ajusta la posición/ancho de la sección .home.
 */
function initSidebar() {
  const body    = document.querySelector('body');
  const sidebar = body.querySelector('nav.sidebar');
  const home    = body.querySelector('.home');
  const overlay = document.querySelector('.overlay'); // Capa para oscurecer
  if (!sidebar) return;

  // --- Botón Compartir ---
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

  // --- Elementos principales ---
  const toggle     = sidebar.querySelector('.toggle');
  const searchBtn  = sidebar.querySelector('.search-box');
  const modeSwitch = sidebar.querySelector('.toggle-switch');
  const modeText   = sidebar.querySelector('.mode-text');
  const logoutBtn  = sidebar.querySelector('#logout');
  const scanBtn    = sidebar.querySelector('#scan-qr-btn');

  // Ajusta el tamaño/posición de la sección .home según estado del sidebar
  function adjustHome() {
    if (!home) return;
    if (sidebar.classList.contains('close')) {
      home.style.left  = '78px';
      home.style.width = 'calc(100% - 78px)';
    } else {
      home.style.left  = '250px';
      home.style.width = 'calc(100% - 250px)';
    }
  }

  // --- Toggle sidebar + overlay ---
  toggle.addEventListener('click', () => {
    const isClosed = sidebar.classList.toggle('close');
    adjustHome();
    if (isClosed) {
      overlay.classList.remove('active');
    } else {
      overlay.classList.add('active');
    }
  });

  // Al hacer click fuera (overlay), cierra sidebar
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.add('close');
      overlay.classList.remove('active');
      adjustHome();
    });
  }

  // --- Click en caja de búsqueda despliega sidebar + overlay ---
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      sidebar.classList.remove('close');
      adjustHome();
      overlay.classList.add('active');
    });
  }

  // --- Dark mode ---
  if (modeSwitch) {
    modeSwitch.addEventListener('click', () => {
      body.classList.toggle('dark');
      modeText.innerText = body.classList.contains('dark')
        ? 'Light mode'
        : 'Dark mode';
    });
  }

  // --- Logout ---
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });
  }

  // --- Escanear QR ---
  if (scanBtn) {
    scanBtn.addEventListener('click', (e) => {
      e.preventDefault();
      startQrScanner();
    });
  }

  // Ajuste inicial
  adjustHome();
}

// Inyecta el sidebar, overlay y lanza initSidebar
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sidebar-container');
  if (container) {
    fetch('/sidebar.html')
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        // Creamos el overlay justo después del sidebar
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        document.body.appendChild(overlay);

        initSidebar();
        window.dispatchEvent(new Event('sidebarReady'));
      })
      .catch(err => console.error('Error cargando sidebar:', err));
  } else {
    // Si el sidebar ya está en el DOM
    // Aseguramos que exista el overlay
    if (!document.querySelector('.overlay')) {
      const overlay = document.createElement('div');
      overlay.classList.add('overlay');
      document.body.appendChild(overlay);
    }
    initSidebar();
    window.dispatchEvent(new Event('sidebarReady'));
  }
});
