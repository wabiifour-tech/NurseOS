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
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

// Helper: set auth cookie for middleware (server-side auth check)
function setAuthCookie(token: string) {
  if (typeof document !== "undefined") {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `nurseos-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
  }
}

// Helper: clear auth cookie
function clearAuthCookie() {
  if (typeof document !== "undefined") {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `nurseos-token=; path=/; max-age=0; SameSite=Lax${secure}`;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isSuperAdmin: false,
      login: (user: User, token?: string) => {
        if (!token) {
          console.error('Auth login called without a token — this should not happen');
          return;
        }
        set({ user, token: token, isAuthenticated: true, isSuperAdmin: user.role === 'SUPER_ADMIN' });
        setAuthCookie(token);
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isSuperAdmin: false });
        clearAuthCookie();
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
