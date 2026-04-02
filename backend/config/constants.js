module.exports = {
  ROLES: {
    ADMIN: "admin",
    EMPLOYEE: "employee",
  },
  LEAVE_TYPES: ["Sick", "Casual", "Earned", "Other"],
  WORK_CATEGORIES: [
    "Excavation", "Brickwork", "Plaster", "RCC",
    "Finishing", "Electrical", "Plumbing", "Other"
  ],
  ATTENDANCE_STATUS: {
    PRESENT: true,
    ABSENT: false,
  },
  GEO_FENCE_DEFAULT_RADIUS: 500, // meters
};
