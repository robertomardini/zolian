/* script.js */

/**
 * Inicializa los listeners del sidebar (toggle, búsqueda, dark mode, logout)
 * y ajusta dinámicamente el ancho y posición de la sección .home.
 */
function initSidebar() {
  const body = document.querySelector('body');
  const sidebar = body.querySelector('nav.sidebar');
  const home = body.querySelector('.home');
  if (!sidebar) return;
  
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
          // Fallback: copiar la URL al portapapeles
          await navigator.clipboard.writeText(shareData.url);
          alert('Enlace copiado al portapapeles: ' + shareData.url);
        }
      } catch (err) {
        console.error('Error compartiendo:', err);
      }
    });
  }

  const toggle = sidebar.querySelector('.toggle');
  const searchBtn = sidebar.querySelector('.search-box');
  const modeSwitch = sidebar.querySelector('.toggle-switch');
  const modeText = sidebar.querySelector('.mode-text');
  const logoutBtn = sidebar.querySelector('#logout');

  // Ajustar .home en función del estado del sidebar
  function adjustHome() {
    if (!home) return;
    if (sidebar.classList.contains('close')) {
      home.style.left = '78px';
      home.style.width = 'calc(100% - 78px)';
    } else {
      home.style.left = '250px';
      home.style.width = 'calc(100% - 250px)';
    }
  }

  // Toggle apertura/cierre sidebar
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('close');
    adjustHome();
  });

  // Mantener abierto al interactuar con buscador
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      sidebar.classList.remove('close');
      adjustHome();
    });
  }

  // Alternar Dark / Light mode
  if (modeSwitch) {
    modeSwitch.addEventListener('click', () => {
      body.classList.toggle('dark');
      modeText.innerText = body.classList.contains('dark') ? 'Light mode' : 'Dark mode';
    });
  }

  // Cerrar sesión
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });
  }

  // Ajuste inicial
  adjustHome();
}

// Inyecta sidebar y notifica cuando esté listo
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
  // Al final de tu initSidebar(), añade esto:

const scanBtn = sidebar.querySelector('#scan-qr-btn');
if (scanBtn) {
  scanBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    startQrScanner();
  });
}

async function startQrScanner() {
  // 1) Crea un overlay
  const overlay = document.createElement('div');
  overlay.style = `
    position: fixed; top:0; left:0;
    width:100vw; height:100vh;
    background: rgba(0,0,0,0.8);
    display:flex; align-items:center; justify-content:center;
    z-index:1000;
  `;
  const video = document.createElement('video');
  overlay.appendChild(video);
  document.body.appendChild(overlay);

  // 2) Pide permiso y arranca cámara
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

  // 3) Canvas para leer frames
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // 4) Función de escaneo usando jsQR
  async function scanFrame() {
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Suponiendo que hayas cargado jsQR previamente
    const code = jsQR(imageData.data, canvas.width, canvas.height);
    if (code) {
      // Encontró el QR, lo procesas:
      alert(`QR detectado: ${code.data}`);
      stopScanner();
      return;
    }
    requestAnimationFrame(scanFrame);
  }

  // 5) Detener todo
  function stopScanner() {
    stream.getTracks().forEach(t => t.stop());
    document.body.removeChild(overlay);
  }

  scanFrame();
}

});
