import { claimTaskAction, submitTaskAction } from "@/app/actions";
import { SectionCard } from "@/components/section-card";
import { getTodayTasks } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ChildTasksPage() {
  const tasks = getTodayTasks();

  return (
    <SectionCard
      eyebrow="Tasks"
      title="今日任務"
      description="這裡已經接到資料庫。孩子每次按下完成，家長端就能看到待審核；不用審核的任務則可直接領獎。"
    >
      <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {tasks.map((task) => (
          <article key={task.logId} className="task-card">
            <div className="task-topline">
              <div>
                <div className="mini-label">{task.category}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                  {task.icon} {task.title}
                </div>
              </div>
              <span className="pill">{statusLabel(task.status)}</span>
            </div>

            <div style={{ color: "var(--muted)" }}>
              {task.measurementType} · 目標 {task.targetValue} {task.unit} · {task.repeatLabel}
            </div>
            <div>
              獎勵 {task.rewardExp} EXP + {task.rewardEnergyValue} 星星幣
            </div>
            <div>{task.requiresApproval ? "完成後需要家長確認" : "完成後可直接領獎"}</div>
            {task.rejectionReason ? <div style={{ color: "#c46857" }}>退回原因：{task.rejectionReason}</div> : null}

            {task.status === "NOT_STARTED" || task.status === "REJECTED" ? (
              <form action={submitTaskAction}>
                <input type="hidden" name="logId" value={task.logId} />
                <button className="button-primary" type="submit">
                  完成並提交
                </button>
              </form>
            ) : null}

            {task.status === "SUBMITTED" ? <div className="button-soft">等家長確認</div> : null}

            {task.status === "READY_TO_CLAIM" ? (
              <form action={claimTaskAction}>
                <input type="hidden" name="logId" value={task.logId} />
                <button className="button-primary" type="submit">
                  領取獎勵
                </button>
              </form>
            ) : null}

            {task.status === "CLAIMED" ? <div className="button-soft">今天已完成</div> : null}
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "待家長確認";
    case "READY_TO_CLAIM":
      return "可領獎";
    case "CLAIMED":
      return "已領獎";
    case "REJECTED":
      return "請再試一次";
    default:
      return "未開始";
  }
}
