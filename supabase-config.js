import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const SUPABASE_URL = "https://wydxsnzojxfjrykuceqz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZHhzbnpvanhmanJ5a3VjZXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjU2NzksImV4cCI6MjA5MjQwMTY3OX0.88rN1M3IWlRLxl0ei-hwXQWOOxDNwRvzrLwdb-1G1kI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

function getUserDisplayName(user) {
  return user?.user_metadata?.display_name || user?.email?.split("@")[0] || "GrowZone User";
}

export { supabase, getUserDisplayName };
