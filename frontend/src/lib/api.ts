import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { BASE_URL } from "./constants";

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

export const setAuthToken = (token: string | null) => {
  accessToken = token;
};

// Helper to process pending requests once the token refreshes
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Extended config type to include our custom retry flag
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    // Never retry token refresh on auth endpoints — these 401s mean bad credentials, not expired tokens
    const noRetryEndpoints = ["/auth/refresh", "/auth/sign-in", "/auth/sign-up"];
    if (noRetryEndpoints.some((ep) => originalRequest.url?.includes(ep))) {
      return Promise.reject(error);
    }
    // If error is 401 and we haven't already retried this specific request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      if (isRefreshing) {
        // If a refresh is already happening, queue this request
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Lock the refresh process and mark this request as retried
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // IMPORTANT: Use standard axios here, NOT your custom 'api' instance.
        // Otherwise, if the refresh fails with 401, you'll enter an infinite loop.
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true } 
        );

        const newAccessToken = response.data.data.access_token;
        
        setAuthToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Release the queue and replay any pending requests
        processQueue(null, newAccessToken);
        
        // Replay the original request that triggered the 401
        return api(originalRequest);
        
      } catch (refreshError) {
        // The refresh token itself is expired or invalid
        processQueue(refreshError as Error, null);
        
        if (typeof window !== "undefined") {
          console.error("Session expired. Logging out.");
          localStorage.removeItem("user");
          setAuthToken(null);
          
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      } finally {
        // Always unlock the refresh process
        isRefreshing = false;
      }
    }

    // For all other errors, just reject as normal
    return Promise.reject(error);
  }
);
export const verifyAlumniCode = async (code: string) => {
  return api.post("/alumni/verify-code", { code });
};

export const checkAlumniManual = async (data: {
  name: string;
  roll_no?: string;
  batch: string;
  branch: string;
  contact_info?: {
    phone?: string;
    alternate_email?: string;
    linkedin?: string;
  };
}) => {
  return api.post("/alumni/check-manual", data);
};

export const confirmAlumniMatch = async (payload: { roll_no: string }) => {
  return api.post("/alumni/confirm-match", payload);
};

export const getUserProfile = async () => {
  return api.get("/profile");
};

export const searchUsers = async (query: string, filters: any = {}) => {
  const params = new URLSearchParams();
  params.append("name", query);
  params.append("limit", "15");

  if (filters.batch) params.append("batch", filters.batch);
  if (filters.branch) params.append("branch", filters.branch);
  if (filters.campus) params.append("campus", filters.campus);
  if (filters.company) params.append("company", filters.company);
  if (filters.skills && filters.skills.length > 0) {
    filters.skills.forEach((skill: string) => params.append("skills[]", skill));
  }

  return api.get(`/profile/search?${params.toString()}`);
};

export const searchPosts = async (query: string) => {
  const params = new URLSearchParams();
  params.append("query", query);
  return api.get(`/posts/search?${params.toString()}`);
};

// There's no dedicated events search endpoint, so this pulls a batch of
// upcoming approved events and matches client-side — fine for a quick-lookup
// panel, not meant to replace the paginated listing on the Events page.
export const searchEvents = async (query: string) => {
  const response = await api.get("/events/approved?limit=50");
  const events = response.data.data || [];
  const needle = query.trim().toLowerCase();
  return events.filter((event: any) =>
    event.title?.toLowerCase().includes(needle) ||
    event.location?.toLowerCase().includes(needle)
  );
};

export const globalSearch = async (query: string, filters: any = {}) => {
  const [usersResponse, postsResponse, events] = await Promise.all([
    searchUsers(query, filters).catch(() => ({ data: { profiles: [] } })),
    searchPosts(query).catch(() => ({ data: { data: [] } })),
    searchEvents(query).catch(() => [])
  ]);

  return {
    users: usersResponse.data.profiles || [],
    posts: postsResponse.data.data || [],
    events
  };
};

export default api;
