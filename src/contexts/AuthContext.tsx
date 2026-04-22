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
      // 1. Initial check (only runs once on mount)
      const { data: { session: initialSession } } = await supabase.auth.getSession();

      if (initialSession?.user) {
        setUser(initialSession.user);
        setSession(initialSession);
        await fetchUserRole(initialSession.user.id);
      }

      setLoading(false); // End initial global load

      // 2. Listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {

        // LOGIC CHANGE: 
        // Only show the global loading screen if we don't have a user yet and one is signing in,
        // or if someone is signing out.
        // If we ALREADY have a user and it's just a refresh, do NOT set loading to true.

        if (event === 'SIGNED_OUT') {
          setLoading(true);
          setUser(null);
          setSession(null);
          setRole(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // If we already have a user in state, don't trigger the global loading pulse
          // Just update the data silently in the background
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            await fetchUserRole(currentSession.user.id);
          }
        }
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