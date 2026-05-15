const multer = require("multer");

// ─────────────────────────────────────────────
//  MIME-TYPE REGISTRY
//  كل نوع ملف وبياناته في مكان واحد
// ─────────────────────────────────────────────
const MIME_REGISTRY = {
  // ── Images ──────────────────────────────────
  image: {
    mimes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
      "image/x-icon",
      "image/avif",
    ],
    label: "images",
    defaultLimitMB: 5,
  },

  // ── Videos ──────────────────────────────────
  video: {
    mimes: [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/webm",
      "video/ogg",
      "video/x-msvideo",   // .avi
      "video/x-matroska",  // .mkv
      "video/3gpp",
      "video/x-flv",
    ],
    label: "videos",
    defaultLimitMB: 100,
  },

  // ── Audio ────────────────────────────────────
  audio: {
    mimes: [
      "audio/mpeg",        // .mp3
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      "audio/aac",
      "audio/flac",
      "audio/x-m4a",
      "audio/mp4",
      "audio/opus",
    ],
    label: "audio files",
    defaultLimitMB: 20,
  },

  // ── Documents ────────────────────────────────
  pdf: {
    mimes: ["application/pdf"],
    label: "PDF files",
    defaultLimitMB: 10,
  },

  word: {
    mimes: [
      "application/msword",                                                      // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.oasis.opendocument.text",                                 // .odt
    ],
    label: "Word documents",
    defaultLimitMB: 10,
  },

  excel: {
    mimes: [
      "application/vnd.ms-excel",                                                // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",       // .xlsx
      "application/vnd.oasis.opendocument.spreadsheet",                          // .ods
      "text/csv",
      "application/csv",
    ],
    label: "Excel/spreadsheet files",
    defaultLimitMB: 10,
  },

  powerpoint: {
    mimes: [
      "application/vnd.ms-powerpoint",                                                  // .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",      // .pptx
      "application/vnd.oasis.opendocument.presentation",                                // .odp
    ],
    label: "PowerPoint files",
    defaultLimitMB: 20,
  },

  text: {
    mimes: [
      "text/plain",        // .txt
      "text/html",
      "text/css",
      "text/javascript",
      "application/json",
      "application/xml",
      "text/xml",
      "text/markdown",
      "text/rtf",
    ],
    label: "text files",
    defaultLimitMB: 5,
  },

  // ── Archives ─────────────────────────────────
  archive: {
    mimes: [
      "application/zip",
      "application/x-zip-compressed",
      "application/x-rar-compressed",
      "application/vnd.rar",
      "application/x-7z-compressed",
      "application/x-tar",
      "application/gzip",
      "application/x-bzip2",
    ],
    label: "archive files",
    defaultLimitMB: 50,
  },

  // ── Code / Data ───────────────────────────────
  code: {
    mimes: [
      "application/javascript",
      "application/typescript",
      "application/x-python",
      "text/x-python",
      "text/x-java-source",
      "application/x-sh",
      "text/x-csrc",
      "text/x-c++src",
      "application/json",
      "application/xml",
      "text/yaml",
      "application/x-yaml",
    ],
    label: "code files",
    defaultLimitMB: 5,
  },

  // ── Fonts ─────────────────────────────────────
  font: {
    mimes: [
      "font/ttf",
      "font/otf",
      "font/woff",
      "font/woff2",
      "application/x-font-ttf",
      "application/x-font-otf",
      "application/font-woff",
      "application/font-woff2",
    ],
    label: "font files",
    defaultLimitMB: 5,
  },

  // ── 3D / CAD ──────────────────────────────────
  model3d: {
    mimes: [
      "model/gltf+json",
      "model/gltf-binary",
      "application/octet-stream", // .fbx, .obj fallback
      "model/obj",
      "model/stl",
    ],
    label: "3D model files",
    defaultLimitMB: 50,
  },
};

// ─────────────────────────────────────────────
//  STORAGE HELPERS
// ─────────────────────────────────────────────
function selectStorage(type) {
  if (type === "memory") return multer.memoryStorage();
  if (type === "disk") return multer.diskStorage({});
  return multer.diskStorage({});
}

// ─────────────────────────────────────────────
//  FILTER FACTORY
//  allow = null  ➜  accept all mimes for the group
//  allow = [...] ➜  accept only listed extensions/mimes
// ─────────────────────────────────────────────
function buildFilter(allowedMimes, allow = null) {
  // إذا الـ allow محدد، فلتر منه بس
  const effective = allow
    ? allowedMimes.filter((m) => allow.includes(m))
    : allowedMimes;

  return (req, file, cb) => {
    if (effective.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const list = effective.join(", ");
      cb(new Error(`Invalid file type (${file.mimetype}). Allowed: ${list}`), false);
    }
  };
}

// ─────────────────────────────────────────────
//  ERROR HANDLER
// ─────────────────────────────────────────────
function handleUploadError(err, res, next, maxCount, label, limitInMB) {
  if (!err) return next();

  let message = "An error occurred while uploading the file.";

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Exceeded allowed count. Maximum is ${maxCount} ${label}.`;
    } else if (err.code === "LIMIT_FILE_SIZE") {
      message = `File too large. Maximum size for ${label} is ${limitInMB}MB.`;
    } else {
      message = err.message;
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  return res.status(400).json({ success: false, message });
}

// ─────────────────────────────────────────────
//  GENERIC BUILDER (داخلي)
// ─────────────────────────────────────────────
function createUploader({ mimes, label, defaultLimitMB }, allow, limitInMB, storageType) {
  const limit = limitInMB ?? defaultLimitMB;
  const storage = selectStorage(storageType);
  const fileFilter = buildFilter(mimes, allow);
  return { upload: multer({ storage, fileFilter, limits: { fileSize: limit * 1024 * 1024 } }), limit, label };
}

// ═════════════════════════════════════════════
//  PUBLIC API
// ═════════════════════════════════════════════

// ─── Images ───────────────────────────────────

/**
 * Upload an array of images.
 * @param {string}   fieldName
 * @param {number}   maxCount
 * @param {number}   [limitInMB=5]
 * @param {string[]|null} [allow=null]  - restrict to specific mimes, e.g. ["image/png"]
 * @param {string}   [storageType="disk"]
 */
const uploadImages = (fieldName, maxCount, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.image, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) =>
      handleUploadError(err, res, next, maxCount, label, limit)
    );
  };
};

/**
 * Upload images from multiple fields.
 * @param {Array}         fieldsConfig  - [{ name, maxCount }]
 * @param {number}        [limitInMB=5]
 * @param {string[]|null} [allow=null]
 * @param {string}        [storageType="disk"]
 */
const uploadImageFields = (fieldsConfig, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.image, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.fields(fieldsConfig)(req, res, (err) =>
      handleUploadError(err, res, next, "specified", label, limit)
    );
  };
};

// ─── Videos ───────────────────────────────────

const uploadVideos = (fieldName, maxCount, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.video, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) =>
      handleUploadError(err, res, next, maxCount, label, limit)
    );
  };
};

const uploadVideoFields = (fieldsConfig, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.video, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.fields(fieldsConfig)(req, res, (err) =>
      handleUploadError(err, res, next, "specified", label, limit)
    );
  };
};

// ─── Audio ────────────────────────────────────

const uploadAudio = (fieldName, maxCount, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.audio, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) =>
      handleUploadError(err, res, next, maxCount, label, limit)
    );
  };
};

const uploadAudioFields = (fieldsConfig, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.audio, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.fields(fieldsConfig)(req, res, (err) =>
      handleUploadError(err, res, next, "specified", label, limit)
    );
  };
};

// ─── PDF ─────────────────────────────────────

const uploadPDF = (fieldName, limitInMB, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.pdf, null, limitInMB, storageType);
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) =>
      handleUploadError(err, res, next, 1, label, limit)
    );
  };
};

const uploadPDFs = (fieldName, maxCount, limitInMB, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.pdf, null, limitInMB, storageType);
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) =>
      handleUploadError(err, res, next, maxCount, label, limit)
    );
  };
};

// ─── Word ─────────────────────────────────────

const uploadWordFile = (fieldName, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.word, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) =>
      handleUploadError(err, res, next, 1, label, limit)
    );
  };
};

// ─── Excel ────────────────────────────────────

const uploadExcelFile = (fieldName, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.excel, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) =>
      handleUploadError(err, res, next, 1, label, limit)
    );
  };
};

// ─── PowerPoint ───────────────────────────────

const uploadPowerPoint = (fieldName, limitInMB, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.powerpoint, null, limitInMB, storageType);
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) =>
      handleUploadError(err, res, next, 1, label, limit)
    );
  };
};

// ─── Text / Code ──────────────────────────────

const uploadTextFile = (fieldName, maxCount = 1, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.text, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) =>
      handleUploadError(err, res, next, maxCount, label, limit)
    );
  };
};

const uploadCodeFile = (fieldName, maxCount = 1, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.code, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) =>
      handleUploadError(err, res, next, maxCount, label, limit)
    );
  };
};

// ─── Archives ─────────────────────────────────

const uploadArchive = (fieldName, limitInMB, allow = null, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.archive, allow, limitInMB, storageType);
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) =>
      handleUploadError(err, res, next, 1, label, limit)
    );
  };
};

// ─── Fonts ────────────────────────────────────

const uploadFont = (fieldName, maxCount = 5, limitInMB, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.font, null, limitInMB, storageType);
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) =>
      handleUploadError(err, res, next, maxCount, label, limit)
    );
  };
};

// ─── 3D Models ────────────────────────────────

const uploadModel3D = (fieldName, limitInMB, storageType) => {
  const { upload, limit, label } = createUploader(MIME_REGISTRY.model3d, null, limitInMB, storageType);
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) =>
      handleUploadError(err, res, next, 1, label, limit)
    );
  };
};

// ─── Mixed Media ──────────────────────────────

/**
 * Upload a mix of images and videos.
 * @param {Array}  fieldsConfig
 * @param {number} [limitInMB=100]
 * @param {string} [storageType="disk"]
 */
const uploadMixedMedia = (fieldsConfig, limitInMB = 100, storageType) => {
  const imageMimes = MIME_REGISTRY.image.mimes;
  const videoMimes = MIME_REGISTRY.video.mimes;
  const allMimes   = [...imageMimes, ...videoMimes];

  const storage = selectStorage(storageType);
  const upload  = multer({
    storage,
    fileFilter: buildFilter(allMimes),
    limits: { fileSize: limitInMB * 1024 * 1024 },
  });

  return (req, res, next) => {
    upload.fields(fieldsConfig)(req, res, (err) =>
      handleUploadError(err, res, next, "specified", "media files", limitInMB)
    );
  };
};

/**
 * Upload any combination of document types.
 * @param {Array}         fieldsConfig
 * @param {string[]}      types  - keys from MIME_REGISTRY, e.g. ["pdf","word","excel"]
 * @param {number}        [limitInMB=20]
 * @param {string[]|null} [allow=null]
 * @param {string}        [storageType="disk"]
 */
const uploadDocuments = (fieldsConfig, types = ["pdf", "word", "excel", "powerpoint"], limitInMB = 20, allow = null, storageType) => {
  const allMimes = types.flatMap((t) => MIME_REGISTRY[t]?.mimes ?? []);
  const effective = allow ? allMimes.filter((m) => allow.includes(m)) : allMimes;

  const storage = selectStorage(storageType);
  const upload  = multer({
    storage,
    fileFilter: buildFilter(effective),
    limits: { fileSize: limitInMB * 1024 * 1024 },
  });

  return (req, res, next) => {
    upload.fields(fieldsConfig)(req, res, (err) =>
      handleUploadError(err, res, next, "specified", "documents", limitInMB)
    );
  };
};

/**
 * Fully custom uploader — pass your own mime list.
 * @param {string}   fieldName
 * @param {number}   maxCount
 * @param {string[]} mimes      - array of allowed mime types
 * @param {number}   [limitInMB=10]
 * @param {string}   [storageType="disk"]
 */
const uploadCustom = (fieldName, maxCount, mimes, limitInMB = 10, storageType) => {
  const storage = selectStorage(storageType);
  const upload  = multer({
    storage,
    fileFilter: buildFilter(mimes),
    limits: { fileSize: limitInMB * 1024 * 1024 },
  });

  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) =>
      handleUploadError(err, res, next, maxCount, "files", limitInMB)
    );
  };
};

// ═════════════════════════════════════════════
//  EXPORTS
// ═════════════════════════════════════════════
module.exports = {
  // ── Images
  uploadImages,
  uploadImageFields,

  // ── Videos
  uploadVideos,
  uploadVideoFields,

  // ── Audio
  uploadAudio,
  uploadAudioFields,

  // ── Documents
  uploadPDF,
  uploadPDFs,
  uploadWordFile,
  uploadExcelFile,
  uploadPowerPoint,
  uploadDocuments,      // multi-type documents

  // ── Text / Code
  uploadTextFile,
  uploadCodeFile,

  // ── Archives
  uploadArchive,

  // ── Fonts
  uploadFont,

  // ── 3D Models
  uploadModel3D,

  // ── Mixed
  uploadMixedMedia,
  uploadCustom,         // fully custom mime list

  // ── Registry (للـ introspection)
  MIME_REGISTRY,
};
