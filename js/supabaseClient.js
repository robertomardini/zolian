// js/supabaseClient.js
// 1) Incluye primero en tu HTML:
//    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/supabase.min.js"></script>

// 2) Ahora creas tu cliente así:
const SUPABASE_URL       = 'https://evwdjscgstgbzvbunhpd.supabase.co';
const SUPABASE_ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d2Rqc2Nnc3RnYnp2YnVuaHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NjEyOTMsImV4cCI6MjA2MDMzNzI5M30.sG08lWD-kSvWc_lwq43N_BPoswZq0yRpz_-uC7HDfnI';

// Aquí NO usamos `const { createClient } = supabase;`, sino:
window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
