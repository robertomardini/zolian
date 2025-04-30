/* script.js */

/**
 * Inicializa los listeners del sidebar (toggle, búsqueda, dark mode, logout,
 * compartir y escanear QR), controla el overlay para oscurecer la página,
 * y fuerza que .home permanezca a pantalla completa (sin desplazarse).
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

  // -- Elementos --
  const toggle     = sidebar.querySelector('.toggle');
  const searchBtn  = sidebar.querySelector('.search-box');
  const modeSwitch = sidebar.querySelector('.toggle-switch');
  const modeText   = sidebar.querySelector('.mode-text');
  const logoutBtn  = sidebar.querySelector('#logout');
  const scanBtn    = sidebar.querySelector('#scan-qr-btn');

  // -- Toggle sidebar + overlay --
  toggle.addEventListener('click', () => {
    const isClosed = sidebar.classList.toggle('close');
    if (isClosed) {
      overlay.classList.remove('active');
    } else {
      overlay.classList.add('active');
    }
    // Forzar .home siempre a pantalla completa
    if (home) {
      home.style.left = '0';
      home.style.width = '100%';
    }
  });

  // -- Clic en overlay cierra sidebar --
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.add('close');
      overlay.classList.remove('active');
      if (home) {
        home.style.left = '0';
        home.style.width = '100%';
      }
    });
  }

  // -- Abrir sidebar desde búsqueda --
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      sidebar.classList.remove('close');
      overlay.classList.add('active');
      if (home) {
        home.style.left = '0';
        home.style.width = '100%';
      }
    });
  }

  // -- Dark mode --
  if (modeSwitch) {
    modeSwitch.addEventListener('click', () => {
      body.classList.toggle('dark');
      modeText.innerText = body.classList.contains('dark')
        ? 'Light mode'
        : 'Dark mode';
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

  // -- Escanear QR --
  if (scanBtn) {
    scanBtn.addEventListener('click', (e) => {
      e.preventDefault();
      startQrScanner();
    });
  }

  // Asegurar .home al cargar la página
  if (home) {
    home.style.left = '0';
    home.style.width = '100%';
  }
}

// Inyecta el sidebar, el overlay y lanza initSidebar
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sidebar-container');
  if (container) {
    fetch('/sidebar.html')
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        // Inyectar overlay si no existe
        if (!document.querySelector('.overlay')) {
          const ov = document.createElement('div');
          ov.classList.add('overlay');
          document.body.appendChild(ov);
        }
        initSidebar();
        window.dispatchEvent(new Event('sidebarReady'));
      })
      .catch(err => console.error('Error cargando sidebar:', err));
  } else {
    // Si ya está en el DOM, aseguramos overlay
    if (!document.querySelector('.overlay')) {
      const ov = document.createElement('div');
      ov.classList.add('overlay');
      document.body.appendChild(ov);
    }
    initSidebar();
    window.dispatchEvent(new Event('sidebarReady'));
  }
});
