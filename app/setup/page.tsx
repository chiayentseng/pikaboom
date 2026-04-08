import Link from "next/link";
import { redirect } from "next/navigation";
import { completeSupabaseSetupAction } from "@/app/setup-actions";
import { requireAuthenticatedSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAuthenticatedSession();
  const params = await searchParams;

  if (session.mode !== "supabase") {
    redirect("/parent");
  }

  if (session.hasHousehold && session.hasChildProfile) {
    redirect("/parent");
  }

  return (
    <main className="page-shell soft-grid" style={{ gap: 20, maxWidth: 760 }}>
      <section className="glass-panel hero-panel soft-grid" style={{ gap: 18 }}>
        <div className="pill">Cloud Setup</div>
        <div className="soft-grid" style={{ gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3.4rem)" }}>完成第一個家庭設定</h1>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            你已經登入 Supabase，但這個帳號還沒有完整的家庭資料。完成這一步後，家長後台、孩子模式與任務資料就會正式切到雲端。
          </p>
        </div>

        <div className="task-card">
          <div className="mini-label">登入帳號</div>
          <strong>{session.displayName ?? session.email}</strong>
          <div style={{ color: "var(--muted)" }}>{session.email}</div>
        </div>

        {params.error ? (
          <div className="task-card" style={{ color: "#c46857" }}>
            {decodeURIComponent(params.error)}
          </div>
        ) : null}

        <form action={completeSupabaseSetupAction} className="soft-grid form-grid">
          <div className="field-grid two-col">
            <label>
              <span>家長顯示名稱</span>
              <input name="parentDisplayName" defaultValue={session.displayName ?? "Parent"} required />
            </label>
            <label>
              <span>家庭名稱</span>
              <input name="householdName" defaultValue={(session.displayName ?? "PikaBoom") + " 家"} required />
            </label>
          </div>

          <label>
            <span>孩子名稱</span>
            <input name="childDisplayName" defaultValue="小冒險家" required />
          </label>

          <label className="checkbox-row">
            <input name="seedTasks" type="checkbox" defaultChecked />
            <span>一起建立預設任務模板，完成後可以立刻開始測試孩子流程</span>
          </label>

          <div className="task-card">
            <div className="mini-label">這一步會建立</div>
            <div style={{ color: "var(--muted)", lineHeight: 1.7 }}>
              parent profile、household、child profile，以及孩子模式所需的 managed child identity。
            </div>
          </div>

          <div className="nav-row">
            <button className="button-primary" type="submit">
              完成雲端初始化
            </button>
            <Link className="button-soft" href="/login">
              回登入頁
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
