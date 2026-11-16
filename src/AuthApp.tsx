import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { authClient } from "./auth";
import { CRMApp } from "./App";

type AuthUser = { name: string; email: string };
type AuthMode = "sign-up" | "sign-in";

export default function AuthApp() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<AuthMode>("sign-up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    authClient
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) setError(sessionError.message ?? "Session lookup failed.");
        setUser(data?.user ? { name: data.user.name, email: data.user.email } : null);
      })
      .catch(() => {
        if (active) setError("Could not connect to the authentication service.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
          : await authClient.signIn.email({ email: email.trim(), password });

      if (result.error) {
        setError(result.error.message || "We could not complete that request.");
        return;
      }

      const session = await authClient.getSession();
      if (session.data?.user) {
        setUser({ name: session.data.user.name, email: session.data.user.email });
      } else if (mode === "sign-up") {
        setMode("sign-in");
        setMessage("Your account was created. Sign in to continue.");
      } else {
        setError("Signed in, but no active session was returned. Please try again.");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We could not reach the authentication service.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    setError("");
    try {
      await authClient.signOut();
      setUser(null);
      setPassword("");
      setMode("sign-in");
    } catch {
      setError("Could not sign out. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="auth-loading" aria-live="polite">
        <LoaderCircle size={24} className="auth-spinner" />
        <span>Checking your session…</span>
      </main>
    );
  }

  if (user) {
    return (
      <CRMApp account={user} onSignOut={signOut} />
    );
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand-mark">C</div>
        <p className="auth-eyebrow">CEPHAS PEOPLE</p>
        <h1 id="auth-title">{mode === "sign-up" ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-intro">
          {mode === "sign-up"
            ? "Sign up to access your Cephas CRM workspace."
            : "Sign in to continue to your workspace."}
        </p>
        <form className="auth-form" onSubmit={submit}>
          {mode === "sign-up" && (
            <label>
              Full name
              <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
          )}
          <label>
            Email address
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? <LoaderCircle size={17} className="auth-spinner" /> : null}
            {submitting ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>
        <p className="auth-switch">
          {mode === "sign-up" ? "Already have an account?" : "New to Cephas People?"}{" "}
          <button type="button" onClick={() => { setMode(mode === "sign-up" ? "sign-in" : "sign-up"); setError(""); setMessage(""); }}>
            {mode === "sign-up" ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}
