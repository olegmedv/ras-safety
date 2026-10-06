import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import FramerPage from "./pages/FramerPage";
import AdminPage from "./pages/AdminPage";
import logo from "./assets/ras-logo.png";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = not checked yet, null = logged out
  const [profile, setProfile] = useState(null);

  // Fires right away with the current session, then on every login / logout.
  // Don't await other supabase calls inside this callback (known deadlock).
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) setProfile(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // When someone logs in, load their name and role
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error);
        setProfile(data);
      });
  }, [userId]);

  if (session === undefined) return null;
  if (!session) return <LoginPage />;
  if (!profile) return <p className="p-6">Loading…</p>;

  return (
    <div className="min-h-screen bg-ras-light">
      <header className="bg-ras-dark text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <img src={logo} alt="RAS" className="h-8" />
          <div className="flex items-center gap-3 text-sm">
            <span>{profile.full_name}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        {profile.role === "admin" ? (
          <AdminPage />
        ) : (
          <FramerPage profile={profile} />
        )}
      </main>
    </div>
  );
}
