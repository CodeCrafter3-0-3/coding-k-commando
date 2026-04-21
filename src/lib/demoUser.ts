import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the current user's ID. For Step 2 we don't have auth yet,
 * so we sign in (or create) an anonymous demo user so RLS policies pass
 * and the dashboard can show real data immediately.
 *
 * Step 3 will replace this with real Supabase Auth.
 */
const DEMO_EMAIL = "demo@creatoros.app";
const DEMO_PASSWORD = "demo-creator-os-2026";

let cachedUserId: string | null = null;

export async function getDemoUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const { data: existing } = await supabase.auth.getUser();
  if (existing.user) {
    cachedUserId = existing.user.id;
    return cachedUserId;
  }

  // Try sign in, fall back to sign up
  const signIn = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (signIn.data.user) {
    cachedUserId = signIn.data.user.id;
    return cachedUserId;
  }

  const signUp = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    options: { emailRedirectTo: window.location.origin },
  });
  if (signUp.error) throw signUp.error;
  cachedUserId = signUp.data.user!.id;
  return cachedUserId;
}
