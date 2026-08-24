import { useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { GoogleIcon, LogoMark, SparkIcon } from "@/components/icons";
import { usePageTitle } from "@/hooks/useApi";
import { useAuth } from "@/context/auth-context";

const HIGHLIGHTS = [
  "Every appointment, availability slot and client record in one console.",
  "Clients book straight into the slots you open — no back-and-forth.",
  "Run consults online and keep documents attached to the session.",
];

export default function LoginPage() {
  usePageTitle("Sign in");

  const { user, loading, error, mode, signInWithGoogle, signInAsDemo } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const [pending, setPending] = useState(false);

  // The server bounces failed callbacks back here with ?error=...
  const callbackError = params.get("error");
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
      </div>
    );
  }

  if (user) return <Navigate to={from} replace />;

  const googleReady = mode === "google";

  const handleDemo = async () => {
    setPending(true);
    try {
      await signInAsDemo();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-16 top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative flex items-center gap-2">
          <LogoMark className="text-brand-500" width={30} height={30} />
          <span className="text-[15px] font-semibold tracking-tight">
            AI CV MAKER
          </span>
        </div>

        <div className="relative mt-auto max-w-md">
          <h2 className="text-[28px] font-semibold leading-tight tracking-tight">
            The consultant console for career sessions that actually convert.
          </h2>
          <ul className="mt-7 space-y-3.5">
            {HIGHLIGHTS.map((line) => (
              <li key={line} className="flex gap-3 text-[13px] text-white/70">
                <SparkIcon
                  width={16}
                  height={16}
                  className="mt-0.5 shrink-0 text-brand-400"
                />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sign-in panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-8 shadow-card">
          <div className="flex items-center gap-2 lg:hidden">
            <LogoMark className="text-brand-500" width={26} height={26} />
            <span className="text-[14px] font-semibold tracking-tight text-ink-900">
              AI CV MAKER
            </span>
          </div>

          <h1 className="mt-6 text-[22px] font-semibold tracking-tight text-ink-900 lg:mt-0">
            Welcome back
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-500">
            Sign in with your Google account to open your consultant console.
          </p>

          <button
            type="button"
            onClick={() => signInWithGoogle(from)}
            disabled={!googleReady}
            className="mt-7 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-ink-200 bg-white text-[13.5px] font-medium text-ink-900 transition-colors hover:border-brand-300 hover:bg-ink-100/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {mode === "unknown" ? (
            <div className="mt-4 rounded-xl bg-rose-50 px-3.5 py-3 text-[12px] leading-relaxed text-rose-700">
              Cannot reach the API. Start the server with{" "}
              <code className="font-mono">npm run dev</code> from the project root,
              then reload.
            </div>
          ) : !googleReady ? (
            <div className="mt-4 rounded-xl bg-amber-50 px-3.5 py-3 text-[12px] leading-relaxed text-amber-700">
              Google sign-in is waiting on credentials. Add{" "}
              <code className="font-mono">GOOGLE_CLIENT_ID</code>,{" "}
              <code className="font-mono">GOOGLE_CLIENT_SECRET</code> and{" "}
              <code className="font-mono">GOOGLE_REDIRECT_URI</code> to{" "}
              <code className="font-mono">server/.env</code>, then restart the API.
            </div>
          ) : null}

          {callbackError ? (
            <p className="mt-4 text-[12px] text-rose-600">{callbackError}</p>
          ) : null}
          {error && mode !== "unknown" ? (
            <p className="mt-4 text-[12px] text-rose-600">{error}</p>
          ) : null}

          {mode === "demo" ? (
            <>
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-ink-100" />
                <span className="text-[11px] uppercase tracking-wide text-ink-400">
                  or
                </span>
                <span className="h-px flex-1 bg-ink-100" />
              </div>

              <button
                type="button"
                onClick={handleDemo}
                disabled={pending}
                className="h-11 w-full rounded-xl bg-brand-500 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
              >
                {pending ? "Signing in..." : "Continue in demo mode"}
              </button>
              <p className="mt-2 text-center text-[11px] text-ink-400">
                Browses the seeded data without an account.
              </p>
            </>
          ) : null}

          <p className="mt-8 text-center text-[11px] leading-relaxed text-ink-400">
            By continuing you agree to the AI CV Maker terms of service and
            privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
