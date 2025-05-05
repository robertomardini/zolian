/* script.js */

/**
 * Inyecta header y footer, maneja sesión para usuario,
 * estilo del icono en header y navegación del footer.
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
  let session;
  try {
    ({ data: { session } } = await supabase.auth.getSession());
  } catch (e) {
    console.error('No se pudo obtener sesión:', e);
  }

  // Mostrar email y avatar si hay sesión
  if (session) {
    const emailEl  = document.getElementById('header-user-email');
    const avatarEl = document.getElementById('header-user-avatar');
    if (emailEl)  emailEl.innerText = session.user.email;
    if (avatarEl && session.user.user_metadata?.avatar_url) {
      avatarEl.src = session.user.user_metadata.avatar_url;
    }
  }

  // Ajustar color del icono de usuario
  const userIcon = document.getElementById('header-user-icon');
  if (userIcon) {
    if (session) {
      userIcon.style.color = 'inherit';
    } else {
      userIcon.style.color = '#e74c3c';
    }
  }

  // Click en el botón/avatar de usuario
  const userBtn = document.getElementById('header-user-btn') ||
                  document.getElementById('header-user-avatar');
  if (userBtn) {
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
