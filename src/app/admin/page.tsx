export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Today's Revenue", value: "$0.00", change: "+0%", color: "bg-brand-mint/20" },
          { label: "Orders Today", value: "0", change: "+0%", color: "bg-brand-pink/20" },
          { label: "Pending Orders", value: "0", change: "", color: "bg-brand-peach/20" },
          { label: "Low Stock Items", value: "0", change: "", color: "bg-brand-lavender/20" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} rounded-xl p-6`}
          >
            <p className="text-sm text-brand-text-secondary">{stat.label}</p>
            <p className="text-3xl font-bold text-brand-text mt-1">{stat.value}</p>
            {stat.change && (
              <p className="text-sm text-brand-success mt-1">{stat.change} vs yesterday</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
