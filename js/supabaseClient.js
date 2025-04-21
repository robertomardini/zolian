// js/supabaseClient.js
// Debe cargarse **después** de la UMD de supabase-js

const SUPABASE_URL      = 'https://evwdjscgstgbzvbunhpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d2Rqc2Nnc3RnYnp2YnVuaHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NjEyOTMsImV4cCI6MjA2MDMzNzI5M30.sG08lWD-kSvWc_lwq43N_BPoswZq0yRpz_-uC7HDfnI';

window.supabase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
