import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: string | null; // Added role here
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null); // Moved inside
  const [loading, setLoading] = useState(true);

  // Helper to fetch the role from the user_roles table
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle(); // maybeSingle handles cases where the role doesn't exist yet

      if (error) throw error;
      setRole(data?.role ?? "viewer");
    } catch (err) {
      console.error("Error fetching role:", err);
      setRole("viewer");
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Initial check
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        await fetchUserRole(initialSession.user.id);
      }
      setLoading(false); // First load is done

      // 2. Listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        // ONLY set loading to true if we are switching users or logging in/out for the first time
        // Do NOT set it to true for session refreshes or tab switches
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(true);
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchUserRole(currentSession.user.id);
        } else {
          setRole(null);
        }

        setLoading(false);
      });

      return subscription;
    };

    const authSubscription = initializeAuth();

    return () => {
      authSubscription.then(sub => sub.unsubscribe());
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}