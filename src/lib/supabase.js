import { createClient } from '@supabase/supabase-js';

// ─── Supabase Configuration ───────────────────────────────────────────
// Globally shared Supabase credentials for all distributed PCs
const SUPABASE_URL = 'https://lyaqzoipmybiznyxznml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXF6b2lwbXliaXpueXh6bm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDc5OTksImV4cCI6MjA5NDc4Mzk5OX0.rNfFZgzCSa313RfDhYXVz-umVFZ2dl_cprE5v15fIa0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
