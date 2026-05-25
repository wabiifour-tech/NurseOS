import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  facilityId?: string | null;
  facilityName?: string | null;
  nurseProfileId?: string | null;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  status?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isLoggingOut: boolean;
  login: (user: User, token?: string) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isSuperAdmin: false,
      isLoggingOut: false,
      login: (user: User, token?: string) => {
        if (!token) {
          console.error('Auth login called without a token — this should not happen');
          return;
        }
        set({ user, token: token, isAuthenticated: true, isSuperAdmin: user.role === 'SUPER_ADMIN', isLoggingOut: false });
        // NOTE: We do NOT set the cookie here. The server sets the HttpOnly cookie
        // via the Set-Cookie response header on /api/auth/login and /api/auth/register.
        // This avoids a race condition between client-side and server-side cookie setting.
      },
      logout: async () => {
        const { token } = get();
        set({ isLoggingOut: true });

        try {
          // Call the server-side logout endpoint to:
          // 1. Delete the session from the database
          // 2. Clear the HttpOnly cookie (client JS cannot clear HttpOnly cookies!)
          if (token) {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });
          }
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with client-side cleanup even if API call fails
        } finally {
          // Clear client-side state
          set({ user: null, token: null, isAuthenticated: false, isSuperAdmin: false, isLoggingOut: false });

          // Also try to clear the cookie client-side as a fallback
          // (won't work for HttpOnly cookies, but handles any non-HttpOnly cookies)
          if (typeof document !== 'undefined') {
            const secure = window.location.protocol === 'https:' ? '; Secure' : '';
            document.cookie = `nurseos-token=; path=/; max-age=0; SameSite=Lax${secure}`;
          }
        }
      },
      updateUser: (data: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
          isSuperAdmin: data.role ? data.role === 'SUPER_ADMIN' : state.isSuperAdmin,
        })),
    }),
    {
      name: "nurseos-auth",
    }
  )
);
