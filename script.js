/* script.js */

/**
 * Inicializa los listeners del sidebar (toggle, búsqueda, dark mode, logout,
 * compartir y escanear QR) y ajusta la posición/ancho de la sección .home.
 */
function initSidebar() {
  const body    = document.querySelector('body');
  const sidebar = body.querySelector('nav.sidebar');
  const home    = body.querySelector('.home');
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

  // --- Toggle, búsqueda, dark mode y logout ---
  const toggle     = sidebar.querySelector('.toggle');
  const searchBtn  = sidebar.querySelector('.search-box');
  const modeSwitch = sidebar.querySelector('.toggle-switch');
  const modeText   = sidebar.querySelector('.mode-text');
  const logoutBtn  = sidebar.querySelector('#logout');

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

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('close');
    adjustHome();
  });

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      sidebar.classList.remove('close');
      adjustHome();
    });
  }

  if (modeSwitch) {
    modeSwitch.addEventListener('click', () => {
      body.classList.toggle('dark');
      modeText.innerText = body.classList.contains('dark') ? 'Light mode' : 'Dark mode';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });
  }

  // --- Botón Escanear QR ---
  const scanBtn = sidebar.querySelector('#scan-qr-btn');
  if (scanBtn) {
    scanBtn.addEventListener('click', (e) => {
      e.preventDefault();
      startQrScanner();
    });
  }

  // Ajuste inicial de .home
  adjustHome();
}

// Inyecta el sidebar y lanza initSidebar
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sidebar-container');
  if (container) {
    fetch('/sidebar.html')
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        initSidebar();
        window.dispatchEvent(new Event('sidebarReady'));
      })
      .catch(err => console.error('Error cargando sidebar:', err));
  } else {
    initSidebar();
    window.dispatchEvent(new Event('sidebarReady'));
  }
});

/**
 * startQrScanner: abre la cámara, detecta un QR y devuelve su contenido.
 * Requiere haber cargado antes: <script src="https://unpkg.com/jsqr/dist/jsQR.js"></script>
 */
async function startQrScanner() {
  // 1) Crear overlay y vídeo
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', top: 0, left: 0,
    width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  });
  const video = document.createElement('video');
  overlay.appendChild(video);
  document.body.appendChild(overlay);

  // 2) Pedir permiso y arrancar cámara
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error('No se pudo acceder a la cámara', err);
    document.body.removeChild(overlay);
    return;
  }

  // 3) Preparar canvas para procesar frames
  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d');

  // 4) Función recursiva de escaneo
  function scanFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        alert(`QR detectado: ${code.data}`);
        stopScanner();
        return;
      }
    }
    requestAnimationFrame(scanFrame);
  }

  // 5) Detener escaneo y cámara
  function stopScanner() {
    stream.getTracks().forEach(t => t.stop());
    document.body.removeChild(overlay);
  }

  scanFrame();
}
