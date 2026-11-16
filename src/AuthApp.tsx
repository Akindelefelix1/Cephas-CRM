import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { authClient } from "./auth";
import { CRMApp } from "./App";

const authEmailOtp = authClient as typeof authClient & {
  emailOtp: {
    verifyEmail(input: { email: string; otp: string }): Promise<{ data: unknown; error: { message?: string } | null }>;
    sendVerificationOtp(input: { email: string; type: "email-verification" }): Promise<{ data: unknown; error: { message?: string } | null }>;
    resetPassword(input: { email: string; otp: string; password: string }): Promise<{ data: unknown; error: { message?: string } | null }>;
  };
  forgetPassword: {
    emailOtp(input: { email: string }): Promise<{ data: unknown; error: { message?: string } | null }>;
  };
};

type AuthUser = { name: string; email: string };
type AuthMode = "sign-up" | "sign-in";
const normalizeAuthPath = (pathname: string) => `/${pathname.split("/").filter(Boolean).join("/")}`;

export default function AuthApp() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<AuthMode>(() => normalizeAuthPath(window.location.pathname) === "/login" ? "sign-in" : "sign-up");
  const [recoveryMode, setRecoveryMode] = useState(() => normalizeAuthPath(window.location.pathname).toLowerCase() === "/forgot-password");
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
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

  useEffect(() => {
    const onPopState = () => {
      const path = normalizeAuthPath(window.location.pathname).toLowerCase();
      if (path === "/forgot-password") setRecoveryMode(true);
      else if (path === "/login") { setRecoveryMode(false); setMode("sign-in"); }
      else if (path === "/signup" || path === "/") { setRecoveryMode(false); setMode("sign-up"); }
      else if (!user && !verificationPending) setMode("sign-in");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [user, verificationPending]);

  useEffect(() => {
    if (loading) return;
    const current = normalizeAuthPath(window.location.pathname).toLowerCase();
    let next = current;
    if (user) {
      if (["/", "/login", "/signup", "/verify-email", "/forgot-password"].includes(current)) next = "/dashboard";
    } else if (recoveryMode) {
      next = "/forgot-password";
    } else if (verificationPending) {
      next = "/verify-email";
    } else if (["/", "/login", "/signup"].includes(current)) {
      next = mode === "sign-in" ? "/login" : "/signup";
    } else {
      next = "/login";
      setMode("sign-in");
    }
    if (next !== current) window.history.replaceState({}, "", next);
  }, [loading, mode, user, verificationPending, recoveryMode]);

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

  const requestPasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const result = await authEmailOtp.forgetPassword.emailOtp({ email: email.trim() });
      if (result.error) {
        setError(result.error.message || "Could not send a recovery code. Try again shortly.");
      } else {
        setResetCodeSent(true);
        setMessage(`If an account exists for ${email.trim()}, a 6-digit recovery code has been sent.`);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send a recovery code.");
    } finally {
      setSubmitting(false);
    }
  };

  const finishPasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("The passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await authEmailOtp.emailOtp.resetPassword({
        email: email.trim(),
        otp: resetCode,
        password: newPassword,
      });
      if (result.error) {
        setError(result.error.message || "That code could not be verified. Request a new code and try again.");
        return;
      }
      setRecoveryMode(false);
      setResetCodeSent(false);
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPassword("");
      setMode("sign-in");
      setMessage("Your password has been updated. Sign in with your new password.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not reset your password.");
    } finally {
      setSubmitting(false);
    }
  };

  const resendPasswordResetCode = async () => {
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const result = await authEmailOtp.forgetPassword.emailOtp({ email: email.trim() });
      if (result.error) setError(result.error.message || "Could not send another code.");
      else setMessage(`If an account exists for ${email.trim()}, a new code has been sent.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send another code.");
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async (): Promise<string | null> => {
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) return result.error.message || "Could not sign out. Please try again.";
      setUser(null);
      setPassword("");
      setMode("sign-in");
      return null;
    } catch {
      return "Could not sign out. Please try again.";
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

  if (recoveryMode) {
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-brand-mark">C</div>
          <p className="auth-eyebrow">CEPHAS PEOPLE</p>
          <h1 id="auth-title">Reset your password</h1>
          <p className="auth-intro">
            {resetCodeSent
              ? `Enter the 6-digit code sent to ${email}, then choose a new password.`
              : "Enter your account email and we’ll send you a recovery code."}
          </p>
          <form className="auth-form" onSubmit={resetCodeSent ? finishPasswordReset : requestPasswordReset}>
            <label>
              Email address
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} readOnly={resetCodeSent} required />
            </label>
            {resetCodeSent && (
              <>
                <label>
                  6-digit recovery code
                  <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="000000" value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
                </label>
                <label>
                  New password
                  <input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                </label>
                <label>
                  Confirm new password
                  <input type="password" autoComplete="new-password" minLength={8} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
                </label>
              </>
            )}
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-success" role="status">{message}</p>}
            <button className="auth-submit" type="submit" disabled={submitting || (resetCodeSent && resetCode.length !== 6)}>
              {submitting ? <LoaderCircle size={17} className="auth-spinner" /> : null}
              {submitting ? "Please wait…" : resetCodeSent ? "Update password" : "Send recovery code"}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>
          {resetCodeSent && <p className="auth-switch">Didn’t get the code? <button type="button" onClick={resendPasswordResetCode} disabled={submitting}>Resend code</button></p>}
          <p className="auth-switch"><button type="button" onClick={() => { setRecoveryMode(false); setResetCodeSent(false); setError(""); setMessage(""); setMode("sign-in"); }}>Back to sign in</button></p>
        </section>
      </main>
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
          {mode === "sign-in" && <div className="auth-forgot-row"><button className="auth-forgot" type="button" onClick={() => { setRecoveryMode(true); setResetCodeSent(false); setError(""); setMessage(""); }}>Forgot password?</button></div>}
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
