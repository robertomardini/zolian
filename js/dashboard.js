document.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return window.location.href = 'login.html';
  }
  document.getElementById('user-email').innerText = "Conectado como: " + user.email;
});

async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}
