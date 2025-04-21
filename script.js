/* script.js */

/**
 * Inicializa los listeners del sidebar (toggle, búsqueda, dark mode).
 */
function initSidebar() {
  const body = document.querySelector('body');
  const sidebar = body.querySelector('nav.sidebar');
  if (!sidebar) return;

  const toggle = sidebar.querySelector('.toggle');
  const modeSwitch = sidebar.querySelector('.toggle-switch');
  const modeText = sidebar.querySelector('.mode-text');
  const searchBtn = sidebar.querySelector('.search-box');

  // Toggle de apertura/cierre
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('close');
  });

  // Al hacer click en búsqueda, aseguramos sidebar abierta
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      sidebar.classList.remove('close');
    });
  }

  // Switch Dark / Light mode
  if (modeSwitch) {
    modeSwitch.addEventListener('click', () => {
      body.classList.toggle('dark');
      modeText.innerText = body.classList.contains('dark') ? 'Light mode' : 'Dark mode';
    });
  }
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
