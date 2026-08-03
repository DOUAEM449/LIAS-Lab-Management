export default function StatCard({ label, value, trend, trendPositive = true, icon: Icon, loading }) {
  return (
    <div className="bg-white border border-lias-border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-lias-muted font-medium">{label}</span>
        <div className="w-[34px] h-[34px] rounded-[9px] bg-lias-blue-tint flex items-center justify-center">
          <Icon size={16} className="text-lias-blue-dark" strokeWidth={2} />
        </div>
      </div>
      <div className="text-[30px] font-bold text-lias-navy mt-3.5">
        {loading ? (
          <span className="inline-block w-12 h-7 bg-lias-bg rounded animate-pulse align-middle" />
        ) : (
          value
        )}
      </div>
      {trend && !loading && (
        <div
          className={`text-xs mt-1.5 font-medium ${
            trendPositive ? 'text-lias-success' : 'text-lias-warning-text'
          }`}
        >
          {trend}
        </div>
      )}
    </div>
  );
}
