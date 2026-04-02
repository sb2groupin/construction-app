const StatCard = ({ icon, label, value, color = "blue" }) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div className="stat-info">
      <p>{value}</p>
      <span>{label}</span>
    </div>
  </div>
);

export default StatCard;
