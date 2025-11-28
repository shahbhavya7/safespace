// Services layer - All API calls using Supabase
import { supabase, getCurrentUser, getSession } from "./supabase";

// ============ AUTH SERVICE ============
export const authService = {
  // Register with email/password
  register: async (
    email: string,
    password: string,
    firstName: string,
    lastName?: string,
    phone?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName || "",
          phone: phone || "",
          full_name: `${firstName} ${lastName || ""}`.trim(),
        },
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    // Create profile in profiles table
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName || "",
        phone: phone || "",
        created_at: new Date().toISOString(),
      });
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  },

  // Login with email/password
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  },

  // Logout
  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },

  // Check if authenticated
  isAuthenticated: async () => {
    const { session } = await getSession();
    return session !== null;
  },

  // Get current user
  getCurrentUser: async () => {
    return getCurrentUser();
  },
};

// ============ USER SERVICE ============
export const userService = {
  // Get user profile
  getProfile: async () => {
    const { user } = await getCurrentUser();
    if (!user) return { success: false, message: "Not authenticated" };

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return { success: false, message: error.message };
    }

    // If no profile exists, create one from user metadata
    if (!data) {
      const metadata = user.user_metadata || {};
      const newProfile = {
        id: user.id,
        email: user.email,
        first_name:
          metadata.first_name || metadata.full_name?.split(" ")[0] || "",
        last_name:
          metadata.last_name ||
          metadata.full_name?.split(" ").slice(1).join(" ") ||
          "",
        phone: metadata.phone || "",
        avatar_url: metadata.avatar_url || metadata.picture || "",
        created_at: new Date().toISOString(),
      };

      await supabase.from("profiles").upsert(newProfile);
      return { success: true, profile: newProfile };
    }

    return { success: true, profile: data };
  },

  // Update user profile
  updateProfile: async (profileData: Record<string, any>) => {
    const { user } = await getCurrentUser();
    if (!user) return { success: false, message: "Not authenticated" };

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, profile: data };
  },

  // Add trusted contact
  addTrustedContact: async (
    name: string,
    email: string,
    phone?: string,
    relationship?: string
  ) => {
    const { user } = await getCurrentUser();
    if (!user) return { success: false, message: "Not authenticated" };

    const { data, error } = await supabase
      .from("trusted_contacts")
      .insert({
        user_id: user.id,
        name,
        email: email || null,
        phone: phone || null,
        relationship: relationship || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, contact: data };
  },

  // Get trusted contacts
  getTrustedContacts: async () => {
    const { user } = await getCurrentUser();
    if (!user) return { success: false, contacts: [] };

    const { data, error } = await supabase
      .from("trusted_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message, contacts: [] };
    }

    return { success: true, contacts: data || [] };
  },

  // Delete trusted contact
  deleteTrustedContact: async (contactId: string) => {
    const { error } = await supabase
      .from("trusted_contacts")
      .delete()
      .eq("id", contactId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  },

  // Update last active (heartbeat)
  updateLastActive: async () => {
    const { user } = await getCurrentUser();
    if (!user) return { success: false };

    const { error } = await supabase
      .from("profiles")
      .update({ last_active: new Date().toISOString() })
      .eq("id", user.id);

    return { success: !error };
  },
};

// ============ MOOD SERVICE ============
export const moodService = {
  // Save mood log
  saveMoodLog: async (
    moodLevel: number,
    moodEmoji: string,
    moodLabel: string,
    notes?: string
  ) => {
    const { user } = await getCurrentUser();
    if (!user) return { success: false, message: "Not authenticated" };

    const { data, error } = await supabase
      .from("mood_entries")
      .insert({
        user_id: user.id,
        mood_level: moodLevel,
        mood_emoji: moodEmoji,
        mood_label: moodLabel,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, entry: data };
  },

  // Get mood logs
  getMoodLogs: async (days: number = 7) => {
    const { user } = await getCurrentUser();
    if (!user) return { success: false, logs: [] };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message, logs: [] };
    }

    return { success: true, logs: data || [] };
  },

  // Get mood stats
  getMoodStats: async () => {
    const { user } = await getCurrentUser();
    if (!user) return { success: false };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("mood_entries")
      .select("mood_level")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo.toISOString());

    if (error || !data || data.length === 0) {
      return { success: true, stats: { average: 0, total: 0 } };
    }

    const total = data.length;
    const sum = data.reduce((acc, entry) => acc + entry.mood_level, 0);
    const average = sum / total;

    return {
      success: true,
      stats: {
        average: Math.round(average * 100) / 100,
        total,
      },
    };
  },
};

// ============ SOS SERVICE ============
export const sosService = {
  // Trigger SOS alert
  triggerSOS: async (latitude?: number, longitude?: number) => {
    const { user } = await getCurrentUser();
    if (!user) return { success: false, message: "Not authenticated" };

    const { data, error } = await supabase
      .from("sos_alerts")
      .insert({
        user_id: user.id,
        latitude: latitude || null,
        longitude: longitude || null,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, alert: data };
  },

  // Resolve SOS alert
  resolveSOS: async (sosId: string) => {
    const { data, error } = await supabase
      .from("sos_alerts")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", sosId)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, alert: data };
  },

  // Get SOS history
  getSOSHistory: async () => {
    const { user } = await getCurrentUser();
    if (!user) return { success: false, alerts: [] };

    const { data, error } = await supabase
      .from("sos_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message, alerts: [] };
    }

    return { success: true, alerts: data || [] };
  },
};

// ============ ADMIN SERVICE ============
export const adminService = {
  setAdminToken: (token: string) => {
    localStorage.setItem("adminToken", token);
  },

  getAdminToken: () => {
    return localStorage.getItem("adminToken");
  },

  isValidAdmin: () => {
    const token = localStorage.getItem("adminToken");
    return token === "admin_secret_token_12345";
  },

  getAllUsers: async () => {
    if (!adminService.isValidAdmin()) {
      return { success: false, message: "Unauthorized" };
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    const usersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { count: moodCount } = await supabase
          .from("mood_entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id);

        const { count: sosCount } = await supabase
          .from("sos_alerts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id);

        return {
          ...profile,
          mood_logs_count: moodCount || 0,
          sos_alerts_count: sosCount || 0,
          total_interactions: (moodCount || 0) + (sosCount || 0),
        };
      })
    );

    return { success: true, data: usersWithStats };
  },

  getUserDetails: async (userId: string) => {
    if (!adminService.isValidAdmin()) {
      return { success: false, message: "Unauthorized" };
    }

    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    const { data: moodLogs } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: sosAlerts } = await supabase
      .from("sos_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { data: trustedContacts } = await supabase
      .from("trusted_contacts")
      .select("*")
      .eq("user_id", userId);

    const avgMood =
      moodLogs && moodLogs.length > 0
        ? (
            moodLogs.reduce((sum, log) => sum + log.mood_level, 0) /
            moodLogs.length
          ).toFixed(2)
        : "0";

    return {
      success: true,
      user,
      mood_logs: moodLogs || [],
      mood_logs_count: moodLogs?.length || 0,
      sos_alerts: sosAlerts || [],
      sos_alerts_count: sosAlerts?.length || 0,
      trusted_contacts: trustedContacts || [],
      stats: {
        total_moods: moodLogs?.length || 0,
        total_sos: sosAlerts?.length || 0,
        avg_mood: avgMood,
      },
    };
  },

  getDashboardSummary: async () => {
    if (!adminService.isValidAdmin()) {
      return { success: false, message: "Unauthorized" };
    }

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalMoodLogs } = await supabase
      .from("mood_entries")
      .select("*", { count: "exact", head: true });

    const { count: totalSOSAlerts } = await supabase
      .from("sos_alerts")
      .select("*", { count: "exact", head: true });

    const { count: activeSOSAlerts } = await supabase
      .from("sos_alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: totalContacts } = await supabase
      .from("trusted_contacts")
      .select("*", { count: "exact", head: true });

    const { data: usersWithContacts } = await supabase
      .from("trusted_contacts")
      .select("user_id")
      .limit(1000);

    const uniqueUsersWithContacts = new Set(
      usersWithContacts?.map((c) => c.user_id)
    ).size;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayMoodLogs } = await supabase
      .from("mood_entries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    const { data: activeToday } = await supabase
      .from("mood_entries")
      .select("user_id")
      .gte("created_at", today.toISOString());

    const activeUsersToday = new Set(activeToday?.map((m) => m.user_id)).size;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentMoods } = await supabase
      .from("mood_entries")
      .select("mood_level")
      .gte("created_at", sevenDaysAgo.toISOString());

    const avgMood7Days =
      recentMoods && recentMoods.length > 0
        ? (
            recentMoods.reduce((sum, m) => sum + m.mood_level, 0) /
            recentMoods.length
          ).toFixed(2)
        : "0";

    return {
      success: true,
      summary: {
        total_users: totalUsers || 0,
        active_users_today: activeUsersToday,
        total_mood_logs: totalMoodLogs || 0,
        today_mood_logs: todayMoodLogs || 0,
        total_sos_alerts: totalSOSAlerts || 0,
        active_sos_alerts: activeSOSAlerts || 0,
        total_contacts: totalContacts || 0,
        users_with_contacts: uniqueUsersWithContacts,
        avg_mood_7days: avgMood7Days,
      },
    };
  },

  getMoodAnalytics: async () => {
    if (!adminService.isValidAdmin()) {
      return { success: false, message: "Unauthorized" };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: moodData, error } = await supabase
      .from("mood_entries")
      .select("*")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    const dailyStats: Record<
      string,
      { total: number; sum: number; min: number; max: number }
    > = {};

    (moodData || []).forEach((entry) => {
      const date = new Date(entry.created_at).toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, sum: 0, min: 5, max: 1 };
      }
      dailyStats[date].total++;
      dailyStats[date].sum += entry.mood_level;
      dailyStats[date].min = Math.min(dailyStats[date].min, entry.mood_level);
      dailyStats[date].max = Math.max(dailyStats[date].max, entry.mood_level);
    });

    const analytics = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        avg_mood: (stats.sum / stats.total).toFixed(2),
        total_logs: stats.total,
        min_mood: stats.min,
        max_mood: stats.max,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const uniqueUsers = new Set(moodData?.map((m) => m.user_id)).size;

    return {
      success: true,
      analytics,
      stats: {
        total_users_with_logs: uniqueUsers,
        total_mood_logs: moodData?.length || 0,
        overall_avg_mood:
          moodData && moodData.length > 0
            ? (
                moodData.reduce((sum, m) => sum + m.mood_level, 0) /
                moodData.length
              ).toFixed(2)
            : "0",
      },
    };
  },

  getSOSAnalytics: async () => {
    if (!adminService.isValidAdmin()) {
      return { success: false, message: "Unauthorized" };
    }

    const { data: sosData, error } = await supabase
      .from("sos_alerts")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return { success: false, message: error.message };
    }

    const { count: totalAlerts } = await supabase
      .from("sos_alerts")
      .select("*", { count: "exact", head: true });

    const { count: activeAlerts } = await supabase
      .from("sos_alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: resolvedAlerts } = await supabase
      .from("sos_alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved");

    const uniqueUsers = new Set(sosData?.map((s) => s.user_id)).size;

    const alerts = (sosData || []).map((alert) => ({
      ...alert,
      user_email: alert.profiles?.email || "Unknown",
    }));

    return {
      success: true,
      alerts,
      stats: {
        total_alerts: totalAlerts || 0,
        active_alerts: activeAlerts || 0,
        resolved_alerts: resolvedAlerts || 0,
        users_triggered_sos: uniqueUsers,
      },
    };
  },
};

// Export legacy token functions for backward compatibility
export const setAuthToken = (token: string) => {
  localStorage.setItem("authToken", token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

export const clearAuthToken = () => {
  localStorage.removeItem("authToken");
};
