import { apiCall, setAuthToken, clearAuthToken, getAuthToken } from './api';

// Auth Service
export const authService = {
  register: async (email: string, password: string, firstName: string, lastName?: string, phone?: string) => {
    const response = await apiCall('auth.php?action=register', {
      method: 'POST',
      body: { email, password, first_name: firstName, last_name: lastName, phone },
      requiresAuth: false,
    });

    if (response.success && response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiCall('auth.php?action=login', {
      method: 'POST',
      body: { email, password },
      requiresAuth: false,
    });

    if (response.success && response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  logout: async () => {
    try {
      await apiCall('auth.php?action=logout', {
        method: 'POST',
      });
    } finally {
      clearAuthToken();
    }
  },

  isAuthenticated: () => {
    return getAuthToken() !== null;
  },
};

// User Service
export const userService = {
  getProfile: async () => {
    return apiCall('user.php?action=profile', { method: 'GET' });
  },

  updateProfile: async (data: Record<string, any>) => {
    return apiCall('user.php?action=update', {
      method: 'POST',
      body: data,
    });
  },

  addTrustedContact: async (contactName: string, contactEmail: string, contactPhone?: string) => {
    return apiCall('user.php?action=add-contact', {
      method: 'POST',
      body: { contact_name: contactName, contact_email: contactEmail, contact_phone: contactPhone },
    });
  },

  getTrustedContacts: async () => {
    return apiCall('user.php?action=trusted-contacts', { method: 'GET' });
  },

  // Track user activity (heartbeat)
  updateLastActive: async () => {
    return apiCall('user.php?action=heartbeat', {
      method: 'POST',
      body: {},
    });
  },
};

// Mood Service
export const moodService = {
  saveMoodLog: async (moodLevel: number, moodEmoji: string, moodLabel: string, notes?: string) => {
    return apiCall('mood.php?action=save', {
      method: 'POST',
      body: { mood_level: moodLevel, mood_emoji: moodEmoji, mood_label: moodLabel, notes },
    });
  },

  getMoodLogs: async (days: number = 7) => {
    return apiCall(`mood.php?action=logs&days=${days}`, { method: 'GET' });
  },

  getMoodStats: async () => {
    return apiCall('mood.php?action=stats', { method: 'GET' });
  },
};

// SOS Service
export const sosService = {
  triggerSOS: async (latitude?: number, longitude?: number) => {
    return apiCall('sos.php?action=trigger', {
      method: 'POST',
      body: { latitude, longitude },
    });
  },

  resolveSOS: async (sosId: number) => {
    return apiCall('sos.php?action=resolve', {
      method: 'POST',
      body: { sos_id: sosId },
    });
  },

  getSOSHistory: async () => {
    return apiCall('sos.php?action=history', { method: 'GET' });
  },
};

// Admin Service
export const adminService = {
  // Get authorization token for admin operations
  setAdminToken: (token: string) => {
    localStorage.setItem('adminToken', token);
  },

  getAdminToken: () => {
    return localStorage.getItem('adminToken');
  },

  // Get all users with their stats
  getAllUsers: async () => {
    const token = adminService.getAdminToken();
    if (!token) throw new Error('Admin token not set');

    return apiCall('admin.php?action=all-users', {
      method: 'GET',
      customHeaders: { 'Authorization': `Bearer ${token}` },
      requiresAuth: false,
    });
  },

  // Get specific user's details and all interactions
  getUserDetails: async (userId: number) => {
    const token = adminService.getAdminToken();
    if (!token) throw new Error('Admin token not set');

    return apiCall(`admin.php?action=user-details&user_id=${userId}`, {
      method: 'GET',
      customHeaders: { 'Authorization': `Bearer ${token}` },
      requiresAuth: false,
    });
  },

  // Get user's activity timeline
  getUserActivity: async (userId: number, limit: number = 50) => {
    const token = adminService.getAdminToken();
    if (!token) throw new Error('Admin token not set');

    return apiCall(`admin.php?action=user-activity&user_id=${userId}&limit=${limit}`, {
      method: 'GET',
      customHeaders: { 'Authorization': `Bearer ${token}` },
      requiresAuth: false,
    });
  },

  // Get mood analytics (last 30 days)
  getMoodAnalytics: async () => {
    const token = adminService.getAdminToken();
    if (!token) throw new Error('Admin token not set');

    return apiCall('admin.php?action=mood-analytics', {
      method: 'GET',
      customHeaders: { 'Authorization': `Bearer ${token}` },
      requiresAuth: false,
    });
  },

  // Get SOS analytics
  getSOSAnalytics: async () => {
    const token = adminService.getAdminToken();
    if (!token) throw new Error('Admin token not set');

    return apiCall('admin.php?action=sos-analytics', {
      method: 'GET',
      customHeaders: { 'Authorization': `Bearer ${token}` },
      requiresAuth: false,
    });
  },

  // Get dashboard summary
  getDashboardSummary: async () => {
    const token = adminService.getAdminToken();
    if (!token) throw new Error('Admin token not set');

    return apiCall('admin.php?action=dashboard-summary', {
      method: 'GET',
      customHeaders: { 'Authorization': `Bearer ${token}` },
      requiresAuth: false,
    });
  },
};
