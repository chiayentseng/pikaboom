import { createTaskAction, toggleTaskAction } from "@/app/actions";
import { SectionCard } from "@/components/section-card";
import { getTaskTemplates } from "@/lib/server/game-facade";

export const dynamic = "force-dynamic";

export default async function ParentTasksPage() {
  const tasks = await getTaskTemplates();

  return (
    <div className="soft-grid" style={{ gap: 20 }}>
      <SectionCard
        eyebrow="Task Templates"
        title="任務管理"
        description="這裡已經是可寫入的後台。新增任務後，孩子端今天的任務列表會立即出現。"
      >
        <form action={createTaskAction} className="soft-grid form-grid">
          <div className="field-grid two-col">
            <label>
              <span>任務名稱</span>
              <input name="title" placeholder="例如：英文單字" required />
            </label>
            <label>
              <span>分類</span>
              <input name="category" defaultValue="學習" required />
            </label>
          </div>

          <div className="field-grid four-col">
            <label>
              <span>圖示</span>
              <input name="icon" defaultValue="⭐" maxLength={2} />
            </label>
            <label>
              <span>完成方式</span>
              <select name="measurementType" defaultValue="一次">
                <option value="一次">一次</option>
                <option value="次數">次數</option>
                <option value="時間">時間</option>
              </select>
            </label>
            <label>
              <span>目標值</span>
              <input name="targetValue" type="number" min="1" defaultValue="1" />
            </label>
            <label>
              <span>單位</span>
              <input name="unit" defaultValue="次" />
            </label>
          </div>

          <div className="field-grid four-col">
            <label>
              <span>週期</span>
              <input name="repeatLabel" defaultValue="每日" />
            </label>
            <label>
              <span>EXP</span>
              <input name="rewardExp" type="number" min="1" defaultValue="8" />
            </label>
            <label>
              <span>星星幣</span>
              <input name="rewardEnergyValue" type="number" min="1" defaultValue="6" />
            </label>
            <label>
              <span>能量類型</span>
              <select name="rewardEnergyType" defaultValue="智慧能量">
                <option value="智慧能量">智慧能量</option>
                <option value="音樂能量">音樂能量</option>
                <option value="活力能量">活力能量</option>
                <option value="愛心能量">愛心能量</option>
                <option value="星星碎片">星星碎片</option>
              </select>
            </label>
          </div>

          <label className="checkbox-row">
            <input name="requiresApproval" type="checkbox" />
            <span>需要家長審核後才可領獎</span>
          </label>

          <div>
            <button className="button-primary" type="submit">
              新增任務
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard eyebrow="Current Tasks" title="目前任務清單" description="啟用中的任務會自動出現在孩子今天的頁面；停用後保留歷史資料。">
        <div className="soft-grid table-grid">
          <div className="table-row" style={{ fontWeight: 800 }}>
            <div>任務</div>
            <div>分類</div>
            <div>週期</div>
            <div>獎勵</div>
            <div>狀態</div>
          </div>
          {tasks.map((task) => (
            <div key={task.id} className="table-row">
              <div>
                <div style={{ fontWeight: 800 }}>
                  {task.icon} {task.title}
                </div>
                <div style={{ color: "var(--muted)" }}>
                  {task.measurementType} · {task.targetValue} {task.unit}
                </div>
              </div>
              <div>{task.category}</div>
              <div>{task.repeatLabel}</div>
              <div>{task.rewardExp} EXP + {task.rewardEnergyValue} 幣</div>
              <div>
                <form action={toggleTaskAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <button className="button-soft" type="submit">
                    {task.isActive ? "停用" : "重新啟用"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
