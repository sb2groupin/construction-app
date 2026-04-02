const DPR = require("../models/DPR");
const { sendSuccess, sendError } = require("../utils/response.utils");

const submitDPR = async (req, res, next) => {
  try {
    const { projectId, date, workCategory, description, skilledLabour, unskilledLabour, weather } = req.body;
    if (!projectId || !date || !workCategory || !description)
      return sendError(res, "projectId, date, workCategory, description zaroori hain", 400);

    const today = new Date().toISOString().split("T")[0];
    if (req.user.role === "employee" && date !== today)
      return sendError(res, "Sirf aaj ki DPR submit ho sakti hai", 400);

    const existing = await DPR.findOne({ projectId, date });
    if (existing) return sendError(res, "Is site ki aaj ki DPR already submit ho gayi hai", 409);

    const photos = req.files ? req.files.map(f => `/uploads/dpr/${f.filename}`) : [];
    const sl = parseInt(skilledLabour) || 0;
    const ul = parseInt(unskilledLabour) || 0;

    const dpr = new DPR({
      projectId, date, workCategory, description,
      skilledLabour: sl, unskilledLabour: ul, totalLabour: sl + ul,
      weather: weather || "Sunny",
      submittedBy: req.user.employeeId || "admin",
      photos,
    });
    await dpr.save();
    return sendSuccess(res, { dpr }, "DPR submitted ✅", 201);
  } catch (err) { next(err); }
};

const getDPRs = async (req, res, next) => {
  try {
    const { projectId, startDate, endDate, month, year } = req.query;
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (month && year) {
      const m = String(month).padStart(2, "0");
      const last = new Date(year, month, 0).getDate();
      filter.date = { $gte: `${year}-${m}-01`, $lte: `${year}-${m}-${last}` };
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }
    const dprs = await DPR.find(filter).populate("projectId", "name").sort({ date: -1 });
    return sendSuccess(res, { dprs, total: dprs.length });
  } catch (err) { next(err); }
};

const addComment = async (req, res, next) => {
  try {
    const { comment } = req.body;
    if (!comment) return sendError(res, "Comment daalo", 400);
    const dpr = await DPR.findByIdAndUpdate(req.params.id,
      { adminComment: comment, commentedBy: "admin" }, { new: true });
    if (!dpr) return sendError(res, "DPR not found", 404);
    return sendSuccess(res, { dpr }, "Comment added");
  } catch (err) { next(err); }
};

module.exports = { submitDPR, getDPRs, addComment };
