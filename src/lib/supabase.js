import { createClient } from '@supabase/supabase-js';

// ─── Supabase Configuration ───────────────────────────────────────────
// Replace these with your actual Supabase project credentials.
// Get them from: https://supabase.com → Your Project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
