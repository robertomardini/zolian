/* script.js */

/**
 * Inyecta header y footer, gestiona sesión para usuario,
 * aplica estilo al icono de usuario y navega con el footer.
 */
window.addEventListener('DOMContentLoaded', () => {
  // Inyectar header
  fetch('/header.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('header-container').innerHTML = html;
      window.dispatchEvent(new Event('headerReady'));
    })
    .catch(err => console.error('Error cargando header:', err));

  // Inyectar footer
  fetch('/footer.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('footer-container').innerHTML = html;
      window.dispatchEvent(new Event('footerReady'));
    })
    .catch(err => console.error('Error cargando footer:', err));
});

// Cuando el header ya está en el DOM
window.addEventListener('headerReady', async () => {
  let session = null;
  try {
    // Obtener sesión
    const { data: { session: ses } } = await supabase.auth.getSession();
    session = ses;
  } catch (e) {
    console.error('No se pudo obtener sesión:', e);
  }

  // Si hay elemento para el email, lo rellenamos
  const emailEl = document.getElementById('header-user-email');
  if (session && emailEl) {
    emailEl.innerText = session.user.email;
  }

  // Gestionar color de icono y clase en el botón
  const userBtn  = document.getElementById('header-user-btn');
  const userIcon = document.getElementById('header-user-icon');
  if (userBtn && userIcon) {
    if (session) {
      // Sesión activa: gris (por defecto)
      userBtn.classList.remove('no-session');
    } else {
      // Sin sesión: rojo
      userBtn.classList.add('no-session');
    }

    // Click abre perfil o avisa si no hay sesión
    userBtn.addEventListener('click', () => {
      if (session) {
        window.location.href = '/usuario.html';
      } else {
        alert('No hay usuario activo.');
      }
    });
  }
});

// Navegación de la bottom tab bar
window.addEventListener('footerReady', () => {
  document.querySelectorAll('.tab-bar button[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target) window.location.href = target;
    });
  });
});
