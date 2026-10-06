import { useState } from "react";
import { supabase } from "../lib/supabase";
import logo from "../assets/ras-logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError("Invalid email or password");
    // On success onAuthStateChange in App fires and shows the right page
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ras-dark p-4">
      <img src={logo} alt="RAS" className="h-16" />
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-3">
        <h1 className="text-xl font-bold">Site Safety Forms</h1>
        {error && <p className="text-red-600">{error}</p>}
        <input
          className="input"
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn w-full">Sign in</button>
      </form>
    </div>
  );
}
