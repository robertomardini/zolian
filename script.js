/* script.js */

/**
 * Inicializa los listeners del sidebar (toggle, búsqueda, dark mode)
 * y ajusta dinámicamente el ancho y posición de la sección .home.
 */
function initSidebar() {
  const body = document.querySelector('body');
  const sidebar = body.querySelector('nav.sidebar');
  if (!sidebar) return;

  const toggle = sidebar.querySelector('.toggle');
  const modeSwitch = sidebar.querySelector('.toggle-switch');/* script.js */

/**
 * Inicializa los listeners del sidebar (toggle, búsqueda, dark mode)
 * y ajusta la posición/ancho de .home.
 */
function initSidebar() {
  const body = document.querySelector('body');
  const sidebar = body.querySelector('nav.sidebar');
  const home = body.querySelector('.home');
  if (!sidebar) return;

  const toggle = sidebar.querySelector('.toggle');
  const searchBtn = sidebar.querySelector('.search-box');
  const modeSwitch = sidebar.querySelector('.toggle-switch');
  const modeText = sidebar.querySelector('.mode-text');

  // Ajustar .home en función del ancho de la sidebar
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

  // Toggle de sidebar
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('close');
    adjustHome();
  });

  // Asegurar sidebar abierto al buscar
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      sidebar.classList.remove('close');
      adjustHome();
    });
  }

  // Dark mode
  if (modeSwitch) {
    modeSwitch.addEventListener('click', () => {
      body.classList.toggle('dark');
      modeText.innerText = body.classList.contains('dark') ? 'Light mode' : 'Dark mode';
    });
  }

  // Ajuste inicial
  adjustHome();
}

// Inyecta sidebar y notifica cuando está listo
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sidebar-container');
  // Si existe contenedor, usamos fetch
  if (container) {
    fetch('/sidebar.html')
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        initSidebar();
        // Notificar a las páginas que sidebar está listo
        window.dispatchEvent(new Event('sidebarReady'));
      })
      .catch(err => console.error('Error cargando sidebar:', err));
  } else {
    // Si no existe, inicializamos el menú inline
    initSidebar();
    window.dispatchEvent(new Event('sidebarReady'));
  }
});

  const modeText = sidebar.querySelector('.mode-text');
  const searchBtn = sidebar.querySelector('.search-box');
  const home = body.querySelector('.home');

  // Handler para ajustar .home según el estado del sidebar
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

  // Toggle de apertura/cierre
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('close');
    adjustHome();
  });

  // Abrir sidebar al enfocar búsqueda
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      sidebar.classList.remove('close');
      adjustHome();
    });
  }

  // Switch Dark / Light mode
  if (modeSwitch) {
    modeSwitch.addEventListener('click', () => {
      body.classList.toggle('dark');
      modeText.innerText = body.classList.contains('dark') ? 'Light mode' : 'Dark mode';
    });
  }

  // Ajuste inicial al cargar
  adjustHome();
}

// Al cargar el DOM, inyectamos sidebar y/o inicializamos
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sidebar-container');
  if (container) {
    // Inyectar el HTML del sidebar desde un archivo externo
    fetch('sidebar.html')
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        initSidebar();
      })
      .catch(err => console.error('Error cargando sidebar:', err));
  } else {
    // Si no existe container, inicializamos el menú inline
    initSidebar();
  }
});
