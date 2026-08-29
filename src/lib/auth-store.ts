import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  academicRole?: string | null;   // 'LECTURER' | 'STUDENT' | null
  studentLevel?: number | null;   // 100 | 200 | 300 | 400 | 500
  matricNumber?: string | null;   // Student matriculation number
  avatarUrl?: string;
  facilityId?: string | null;
  facilityName?: string | null;
  facilityType?: string | null;   // HOSPITAL | UNIVERSITY | SCHOOL_OF_NURSING | etc.
  nurseProfileId?: string | null;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  status?: string;
}

interface AuthState {
  user: User | null;
  // NOTE: token is NOT persisted to localStorage.
  // Browser auth uses the HttpOnly cookie (nurseos-token) set by the server.
  // This token field exists only for in-memory use (e.g., logout Bearer header fallback).
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
        // Store token in memory only (NOT persisted to localStorage).
        // Browser auth relies on the HttpOnly cookie set by the server.
        set({ user, token: token || null, isAuthenticated: true, isSuperAdmin: user.role === 'SUPER_ADMIN', isLoggingOut: false });
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
                Authorization: `Bearer ${token}`,
              },
            });
          } else {
            // No in-memory token (page was refreshed) — cookie-only logout
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with client-side cleanup even if API call fails
        } finally {
          // Clear client-side state (token was already in-memory only)
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
      // Only persist user profile data, NOT the session token.
      // The token is stored in the HttpOnly cookie and kept in memory only.
      // This prevents XSS from extracting the session token from localStorage.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isSuperAdmin: state.isSuperAdmin,
      }),
    }
  )
);