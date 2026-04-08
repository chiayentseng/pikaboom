import Link from "next/link";
import { signInParentAction } from "@/app/auth-actions";
import { getAppSession } from "@/lib/auth/session";
import { getAppMode } from "@/lib/config/runtime";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAppSession();
  const params = await searchParams;
  const mode = getAppMode();

  return (
    <main className="page-shell soft-grid" style={{ gap: 20, maxWidth: 680 }}>
      <section className="glass-panel hero-panel soft-grid" style={{ gap: 18 }}>
        <div className="pill">Parent Login</div>
        <div className="soft-grid" style={{ gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3.4rem)" }}>Sign In To Parent Mode</h1>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            Production mode will use Supabase Auth. Until the cloud environment is configured, the app can still run in local development mode.
          </p>
        </div>

        <div className="task-card">
          <div className="mini-label">Current Mode</div>
          <strong>{mode === "supabase" ? "Supabase Cloud Mode" : "Local Development Mode"}</strong>
          <div style={{ color: "var(--muted)" }}>
            {mode === "supabase"
              ? "This will authenticate against a real Supabase project."
              : "This will use a local development session cookie for parent access."}
          </div>
        </div>

        {params.error ? <div className="task-card" style={{ color: "#c46857" }}>{params.error}</div> : null}

        {session.isAuthenticated ? (
          <div className="task-card">
            <div className="mini-label">Already Signed In</div>
            <div>{session.displayName ?? session.email}</div>
            <Link className="button-primary" href="/parent">
              Go To Parent Console
            </Link>
          </div>
        ) : (
          <form action={signInParentAction} className="soft-grid form-grid">
            <label>
              <span>Email</span>
              <input name="email" type="email" placeholder="parent@example.com" />
            </label>
            <label>
              <span>Password</span>
              <input name="password" type="password" placeholder="********" />
            </label>
            <button className="button-primary" type="submit">
              {mode === "supabase" ? "Sign In With Supabase" : "Enter Local Parent Mode"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
