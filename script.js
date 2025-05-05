/* script.js */

/**
 * Inyecta el header y el footer en cada página y despacha eventos cuando estén listos.
 * Además, tras cargar el header, inserta el email del usuario conectado.
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

// Cuando el header ya está en el DOM, rellenamos el email del usuario
window.addEventListener('headerReady', async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const emailEl = document.getElementById('header-user-email');
      if (emailEl) emailEl.innerText = session.user.email;
      const avatarEl = document.getElementById('header-user-avatar');
      if (avatarEl && session.user.user_metadata?.avatar_url) {
        avatarEl.src = session.user.user_metadata.avatar_url;
      }
    }
  } catch (e) {
    console.error('No se pudo obtener sesión:', e);
  }
});
window.addEventListener('headerReady', async () => {
  const icon = document.getElementById('header-user-icon');
  if (!icon) return;

  try {
    const { data:{ session } } = await supabase.auth.getSession();
    if (session) {
      // Usuario activo: color por defecto (hereda de --text-color)
      icon.style.color = 'inherit';
    } else {
      // Sin sesión: color rojo
      icon.style.color = '#e74c3c';
    }
  } catch (e) {
    // En caso de error, también lo ponemos en rojo
    icon.style.color = '#e74c3c';
    console.error('Error comprobando sesión:', e);
  }

  // Opcional: clic abre perfil
  document.getElementById('header-user-btn').onclick = () => {
    if (supabase.auth.getSession()) {
      window.location.href = '/usuario.html';
    } else {
      alert('No hay usuario activo.');
    }
  };
});

// Opcional: escuchar clicks en el avatar para ir a la página de perfil
window.addEventListener('headerReady', () => {
  const avatarWrapper = document.getElementById('header-user-wrapper');
  if (avatarWrapper) {
    avatarWrapper.addEventListener('click', () => {
      window.location.href = '/usuario.html';
    });
  }
});

// Opcional: controlar navegación del footer (bottom tab bar)
window.addEventListener('footerReady', () => {
  document.querySelectorAll('.tab-bar button').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target) window.location.href = target;
    });
  });
});
