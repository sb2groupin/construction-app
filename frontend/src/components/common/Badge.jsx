const Badge = ({ children, type = "gray" }) => (
  <span className={`badge badge-${type}`}>{children}</span>
);

export default Badge;
