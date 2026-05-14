import { useState } from "react";
import { adminSignIn, adminSignUp } from "@/lib/supabase";
import { Droplets, Loader2 } from "lucide-react";

export function Login() {
  const [isSignUp, setIsSignUp]   = useState(false);
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isSignUp && password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    if (isSignUp) {
      const err = await adminSignUp(email, password);
      if (err) {
        setError(err);
      } else {
        setSuccess("Account created! You can now sign in.");
        setIsSignUp(false);
        setPassword("");
        setConfirm("");
      }
    } else {
      const err = await adminSignIn(email, password);
      if (err) setError(err);
    }
    setLoading(false);
  };

  const toggle = () => {
    setIsSignUp((v) => !v);
    setError(null);
    setSuccess(null);
    setPassword("");
    setConfirm("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-3">
            <Droplets className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">AquaPure Admin</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? "Create your admin account" : "Sign in to manage your store"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignUp ? "Create Account" : "Sign In"}
          </button>

          <p className="text-center text-xs text-slate-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            {" "}
            <button type="button" onClick={toggle} className="font-bold text-blue-600 hover:underline">
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
