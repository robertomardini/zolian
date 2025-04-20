// js/menu.js
export function initMenu() {
  document.getElementById('btn-menu').onclick  = () =>
    document.getElementById('sidebar').classList.remove('hidden');
  document.getElementById('btn-close').onclick = () =>
    document.getElementById('sidebar').classList.add('hidden');
  // Mostrar correo del usuario
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) document.getElementById('user-email').innerText = user.email;
  });
}
