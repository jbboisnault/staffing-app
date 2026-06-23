// js/supabase.js
const SUPABASE_URL = 'https://TON-PROJET.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxeXNwdGluaWJrbnFpenRucG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTk5NTMsImV4cCI6MjA5Nzc5NTk1M30.ooMQXLq_QUFEw71pNjW3lbVvaZEn-1Q1w92PRbsKuIs';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);