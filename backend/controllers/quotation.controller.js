const { Quotation, Agreement } = require("../models/Quotation");
const { sendSuccess, sendError } = require("../utils/response.utils");

// ── Quotations ────────────────────────────────────────
const getAllQuotations = async (req, res, next) => {
  try {
    const { status, clientName } = req.query;
    const filter = {};
    if (status)     filter.status = status;
    if (clientName) filter.clientName = { $regex: clientName, $options: "i" };
    const quotations = await Quotation.find(filter).populate("projectId", "name").sort({ createdAt: -1 });
    return sendSuccess(res, { quotations, total: quotations.length });
  } catch (err) { next(err); }
};

const createQuotation = async (req, res, next) => {
  try {
    const { clientName, clientPhone, clientEmail, clientAddress, siteName, projectId, validityDate, lineItems, gstPercent, termsConditions, notes } = req.body;
    if (!clientName || !lineItems?.length) return sendError(res, "clientName aur lineItems zaroori hain", 400);

    const q = new Quotation({
      clientName, clientPhone, clientEmail, clientAddress, siteName,
      projectId: projectId || null,
      validityDate: validityDate || null,
      lineItems,
      gstPercent: gstPercent ?? 18,
      termsConditions, notes,
      createdBy: "admin",
    });
    await q.save();
    return sendSuccess(res, { quotation: q }, "Quotation created ✅", 201);
  } catch (err) { next(err); }
};

const updateQuotation = async (req, res, next) => {
  try {
    const q = await Quotation.findById(req.params.id);
    if (!q) return sendError(res, "Quotation not found", 404);
    Object.assign(q, req.body);
    await q.save(); // pre-save hook recalculates totals
    return sendSuccess(res, { quotation: q }, "Quotation updated");
  } catch (err) { next(err); }
};

const deleteQuotation = async (req, res, next) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    return sendSuccess(res, {}, "Quotation deleted");
  } catch (err) { next(err); }
};

// Quotation → Agreement convert
const convertToAgreement = async (req, res, next) => {
  try {
    const q = await Quotation.findById(req.params.id);
    if (!q) return sendError(res, "Quotation not found", 404);

    const { projectScope, startDate, endDate, paymentTerms, penaltyClause, termsConditions, contractorName } = req.body;

    const agr = new Agreement({
      quotationId:    q._id,
      projectId:      q.projectId,
      clientName:     q.clientName,
      clientPhone:    q.clientPhone,
      clientAddress:  q.clientAddress,
      contractorName: contractorName || null,
      projectScope:   projectScope || q.siteName || "",
      startDate, endDate,
      totalAmount:    q.totalAmount,
      paymentTerms, penaltyClause, termsConditions,
      createdBy:      "admin",
    });
    await agr.save();

    // Mark quotation as Accepted
    q.status = "Accepted";
    await q.save();

    return sendSuccess(res, { agreement: agr }, "Agreement created from quotation ✅", 201);
  } catch (err) { next(err); }
};

// ── Agreements ────────────────────────────────────────
const getAllAgreements = async (req, res, next) => {
  try {
    const agreements = await Agreement.find().populate("projectId", "name").sort({ createdAt: -1 });
    return sendSuccess(res, { agreements, total: agreements.length });
  } catch (err) { next(err); }
};

const updateAgreement = async (req, res, next) => {
  try {
    const agr = await Agreement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!agr) return sendError(res, "Agreement not found", 404);
    return sendSuccess(res, { agreement: agr }, "Agreement updated");
  } catch (err) { next(err); }
};

const signAgreement = async (req, res, next) => {
  try {
    const { clientSignName } = req.body;
    if (!clientSignName) return sendError(res, "Client signature name zaroori hai", 400);
    const agr = await Agreement.findByIdAndUpdate(req.params.id,
      { clientSignName, clientSignDate: new Date(), status: "Active" }, { new: true });
    if (!agr) return sendError(res, "Agreement not found", 404);
    return sendSuccess(res, { agreement: agr }, "Agreement signed ✅");
  } catch (err) { next(err); }
};

module.exports = { getAllQuotations, createQuotation, updateQuotation, deleteQuotation, convertToAgreement, getAllAgreements, updateAgreement, signAgreement };
