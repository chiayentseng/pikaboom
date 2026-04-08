import { approveTaskAction, rejectTaskAction } from "@/app/actions";
import { SectionCard } from "@/components/section-card";
import { getPendingReviews } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ParentReviewPage() {
  const items = getPendingReviews();

  return (
    <SectionCard
      eyebrow="Approval"
      title="任務審核"
      description="孩子送出的任務會集中到這裡。通過後孩子端會看到可領獎狀態；退回後孩子可以重新提交。"
    >
      <div className="soft-grid" style={{ gap: 14 }}>
        {items.length === 0 ? <div className="task-card">目前沒有待審核任務。</div> : null}
        {items.map((item) => (
          <article key={item.id} className="task-card">
            <div className="task-topline">
              <div>
                <div className="mini-label">{item.category}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                  {item.icon} {item.taskTitle}
                </div>
              </div>
              <span className="pill">{new Date(item.submittedAt).toLocaleString("zh-TW")}</span>
            </div>
            <div style={{ color: "var(--muted)" }}>
              已提交 {item.progressValue} / {item.targetValue} {item.unit}
            </div>
            <div className="nav-row">
              <form action={approveTaskAction}>
                <input type="hidden" name="logId" value={item.id} />
                <button className="button-primary" type="submit">
                  通過
                </button>
              </form>
              <form action={rejectTaskAction} className="inline-form">
                <input type="hidden" name="logId" value={item.id} />
                <input name="reason" placeholder="退回原因（可選）" />
                <button className="button-soft" type="submit">
                  退回
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
