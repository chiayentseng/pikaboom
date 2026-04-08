type ProgressBarProps = {
  value: number;
  total: number;
  label?: string;
};

export function ProgressBar({ value, total, label }: ProgressBarProps) {
  const safeTotal = total === 0 ? 1 : total;
  const percent = Math.max(0, Math.min(100, (value / safeTotal) * 100));

  return (
    <div className="soft-grid" style={{ gap: 8 }}>
      {label ? <div className="mini-label">{label}</div> : null}
      <div className="progress-rail">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
