const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// Upload folder exist na kare to banao
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Selfie storage
const selfieStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/selfies");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname) || ".jpg";
    const name = `selfie_${req.body.employeeId || "emp"}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

// DPR photo storage (Phase 5 ke liye already ready)
const dprStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/dpr");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname) || ".jpg";
    const name = `dpr_${Date.now()}_${file.originalname.replace(/\s/g, "_")}${ext}`;
    cb(null, name);
  },
});

// Expense bill storage (Phase 7 ke liye ready)
const expenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/expenses");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname) || ".jpg";
    cb(null, `expense_${Date.now()}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Sirf image files allowed hain (jpg, png, webp)"), false);
  }
};

const uploadSelfie  = multer({ storage: selfieStorage,  fileFilter: imageFilter, limits: { fileSize: 3 * 1024 * 1024 } });
const uploadDPR     = multer({ storage: dprStorage,     fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadExpense = multer({ storage: expenseStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { uploadSelfie, uploadDPR, uploadExpense };
