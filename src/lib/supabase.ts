import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

// ============ AUTH FUNCTIONS ============

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
  return { data, error };
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: { first_name?: string; last_name?: string }
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return { session, error };
};

// ============ USER PROFILE FUNCTIONS ============

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();
  return { data, error };
};

// ============ TRUSTED CONTACTS FUNCTIONS ============

export const getTrustedContacts = async (userId: string) => {
  const { data, error } = await supabase
    .from("trusted_contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: data || [], error };
};

export const addTrustedContact = async (
  userId: string,
  contact: {
    name: string;
    phone: string;
    email?: string;
    relationship?: string;
  }
) => {
  const { data, error } = await supabase
    .from("trusted_contacts")
    .insert({
      user_id: userId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email || null,
      relationship: contact.relationship || null,
    })
    .select()
    .single();
  return { data, error };
};

export const deleteTrustedContact = async (contactId: string) => {
  const { error } = await supabase
    .from("trusted_contacts")
    .delete()
    .eq("id", contactId);
  return { error };
};

// ============ MOOD FUNCTIONS ============

export const saveMoodEntry = async (
  userId: string,
  mood: { level: number; emoji: string; label: string; notes?: string }
) => {
  const { data, error } = await supabase
    .from("mood_entries")
    .insert({
      user_id: userId,
      mood_level: mood.level,
      mood_emoji: mood.emoji,
      mood_label: mood.label,
      notes: mood.notes || null,
    })
    .select()
    .single();
  return { data, error };
};

export const getMoodEntries = async (userId: string, days: number = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("mood_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });
  return { data: data || [], error };
};

// ============ SOS FUNCTIONS ============

export const triggerSOS = async (
  userId: string,
  latitude?: number,
  longitude?: number
) => {
  const { data, error } = await supabase
    .from("sos_alerts")
    .insert({
      user_id: userId,
      latitude,
      longitude,
      status: "active",
    })
    .select()
    .single();
  return { data, error };
};

export const resolveSOS = async (sosId: string) => {
  const { data, error } = await supabase
    .from("sos_alerts")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", sosId)
    .select()
    .single();
  return { data, error };
};

export const getSOSHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from("sos_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: data || [], error };
};
