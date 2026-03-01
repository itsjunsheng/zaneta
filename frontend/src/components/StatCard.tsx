type StatCardProps = {
  label: string;
  value: string;
  subtext?: string;
};

export const StatCard = ({ label, value, subtext }: StatCardProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {subtext ? <p className="mt-1 text-sm text-slate-500">{subtext}</p> : null}
    </div>
  );
};
