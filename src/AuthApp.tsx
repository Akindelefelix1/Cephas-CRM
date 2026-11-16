import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { authClient } from "./auth";
import { CRMApp } from "./App";

const authEmailOtp = authClient as typeof authClient & {
  emailOtp: {
    verifyEmail(input: { email: string; otp: string }): Promise<{ data: unknown; error: { message?: string } | null }>;
    sendVerificationOtp(input: { email: string; type: "email-verification" }): Promise<{ data: unknown; error: { message?: string } | null }>;
  };
};

type AuthUser = { name: string; email: string };
type AuthMode = "sign-up" | "sign-in";

export default function AuthApp() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<AuthMode>("sign-up");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
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
        if (data?.user && !data.user.emailVerified) {
          setEmail(data.user.email);
          setVerificationPending(true);
        } else {
          setUser(data?.user ? { name: data.user.name, email: data.user.email } : null);
        }
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
          ? await authClient.signUp.email({ name: organizationName.trim(), email: email.trim(), password })
          : await authClient.signIn.email({ email: email.trim(), password });

      if (result.error) {
        setError(result.error.message || "We could not complete that request.");
        return;
      }

      if (mode === "sign-up" && result.data?.user && !result.data.user.emailVerified) {
        setVerificationPending(true);
        setVerificationCode("");
        setMessage(`We sent a 6-digit verification code to ${email.trim()}.`);
        return;
      }

      const session = await authClient.getSession();
      if (session.data?.user?.emailVerified) {
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

  const verifyEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const result = await authEmailOtp.emailOtp.verifyEmail({
        email: email.trim(),
        otp: verificationCode,
      });
      if (result.error) {
        setError(result.error.message || "That code could not be verified.");
        return;
      }
      const session = await authClient.getSession();
      if (session.data?.user?.emailVerified) {
        setUser({ name: session.data.user.name, email: session.data.user.email });
        setVerificationPending(false);
      } else {
        setVerificationPending(false);
        setMode("sign-in");
        setPassword("");
        setMessage("Email verified. Sign in to continue.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not verify this code.");
    } finally {
      setSubmitting(false);
    }
  };

  const resendVerificationCode = async () => {
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const result = await authEmailOtp.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "email-verification",
      });
      if (result.error) {
        setError(result.error.message || "Could not send another code.");
      } else {
        setMessage(`A new 6-digit code was sent to ${email.trim()}.`);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send another code.");
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

  if (verificationPending) {
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-brand-mark">C</div>
          <p className="auth-eyebrow">CEPHAS PEOPLE</p>
          <h1 id="auth-title">Verify your email</h1>
          <p className="auth-intro">Enter the 6-digit code we sent to {email}.</p>
          <form className="auth-form" onSubmit={verifyEmail}>
            <label>
              Verification code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
              />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-success" role="status">{message}</p>}
            <button className="auth-submit" type="submit" disabled={submitting || verificationCode.length !== 6}>
              {submitting ? <LoaderCircle size={17} className="auth-spinner" /> : null}
              {submitting ? "Please wait…" : "Verify email"}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>
          <p className="auth-switch">
            Didn’t receive a code?{" "}
            <button type="button" onClick={resendVerificationCode} disabled={submitting}>Resend code</button>
          </p>
          <p className="auth-switch">
            <button type="button" onClick={() => { setVerificationPending(false); setMode("sign-in"); setError(""); setMessage(""); }}>Back to sign in</button>
          </p>
        </section>
      </main>
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
              Organization name
              <input autoComplete="organization" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required />
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
