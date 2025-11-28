// API Configuration for Node.js/Twilio backend
// PHP backend has been replaced with Supabase - see services.ts

// Node.js backend URL for Twilio/SMS functionality
export const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || "/api";

// Legacy exports for backward compatibility
export const setAuthToken = (token: string) => {
  localStorage.setItem("authToken", token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

export const clearAuthToken = () => {
  localStorage.removeItem("authToken");
};

// Legacy apiCall function - kept for any remaining references
// All new code should use Supabase directly via services.ts
interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  requiresAuth?: boolean;
  customHeaders?: Record<string, string>;
}

export const apiCall = async (
  endpoint: string,
  options: RequestOptions = {}
) => {
  console.warn(
    "apiCall is deprecated. Use Supabase services from services.ts instead."
  );

  const { method = "GET", body = null, customHeaders = {} } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${NODE_API_URL}/${endpoint}`, config);
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default NODE_API_URL;
