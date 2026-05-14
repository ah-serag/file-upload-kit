const multer = require("multer");

// Use memory storage to process files as buffers
const storage_memory = multer.memoryStorage();
const storage_disk = multer.diskStorage();



function selectstorage (type_storage){
    if(type_storage == "memory"){
        return storage_memory 
    }else if (type_storage == "disk"){
        return storage_disk
    }else{
        return storage_disk
    }
}
// --- File Filters ---


const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid type. Only JPG, PNG, WEBP, and SVG are allowed."), false);
  }
};

const videoFilter = (req, file, cb) => {
  const allowed = ["video/mp4", "video/mpeg", "video/quicktime", "video/webm"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid type. Only MP4, MPEG, QuickTime, and WEBM are allowed."), false);
  }
};

const excelFilter = (req, file, cb) => {
  const allowed = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid type. Only .xlsx and .xls are allowed."), false);
  }
};

// --- Dynamic Error Handler ---

// Updated to accept limitInMB so error messages are always accurate

 const handleUploadError = (err, res, next, maxCount, type, limitInMB) => {
  if (err) {
    let errorMessage = "An error occurred while uploading the file.";

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        errorMessage = `Exceeded allowed count. Maximum limit is ${maxCount} ${type}.`;
      } else if (err.code === "LIMIT_FILE_SIZE") {
        errorMessage = `File too large. Maximum size allowed for ${type} is ${limitInMB}MB.`;
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    return res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
  next();
};

// --- Exported Package Methods ---

/**
 * Upload an array of images.
 * @param {string} fieldName - The form field name.
 * @param {number} maxCount - Maximum number of files.
 * @param {number} limitInMB - Max file size in Megabytes (default: 5).
 */
const uploadImages = (fieldName, maxCount, limitInMB = 5 ,type_storage) => {
  const upload = multer({
    storage : selectstorage(type_storage),
    fileFilter: imageFilter,
    limits: { fileSize: limitInMB * 1024 * 1024 }
  }).array(fieldName, maxCount);

  return (req, res, next) => {
    upload(req, res, (err) => handleUploadError(err, res, next, maxCount, "images", limitInMB));
  };
};

/**
 * Upload images from multiple specified fields.
 * @param {Array} fieldsConfig - Array of objects, e.g., [{ name: 'avatar', maxCount: 1 }].
 * @param {number} limitInMB - Max file size in Megabytes (default: 5).
 */
const uploadImageFields = (fieldsConfig, limitInMB = 5 , type_storage) => {
  const upload = multer({
    storage :selectstorage(type_storage),
    fileFilter: imageFilter,
    limits: { fileSize: limitInMB * 1024 * 1024 }
  }).fields(fieldsConfig);

  return (req, res, next) => {
    upload(req, res, (err) => handleUploadError(err, res, next, "specified", "images", limitInMB));
  };
};



/**
 * Upload videos from multiple specified fields.
 * @param {Array} fieldsConfig - Array of field objects, e.g., [{ name: 'introVideo', maxCount: 1 }].
 * @param {number} limitInMB - Max file size in Megabytes (default: 50).
 */
const uploadVideoFields = (fieldsConfig, limitInMB = 50 ,type_storage) => {
  const upload = multer({
    storage :selectstorage(type_storage),
    fileFilter: videoFilter,
    limits: { fileSize: limitInMB * 1024 * 1024 }
  }).fields(fieldsConfig);

  return (req, res, next) => {
    // Pass "specified" as the maxCount since the limits are defined in the fieldsConfig
    upload(req, res, (err) => handleUploadError(err, res, next, "specified", "videos", limitInMB));
  };
};


/**
 * Upload an array of videos.
 * @param {string} fieldName - The form field name.
 * @param {number} maxCount - Maximum number of files.
 * @param {number} limitInMB - Max file size in Megabytes (default: 50).
 */
const uploadVideos = (fieldName, maxCount, limitInMB = 50 , type_storage) => {
  const upload = multer({
    storage :selectstorage(type_storage),
    fileFilter: videoFilter,
    limits: { fileSize: limitInMB * 1024 * 1024 }
  }).array(fieldName, maxCount);

  return (req, res, next) => {
    upload(req, res, (err) => handleUploadError(err, res, next, maxCount, "videos", limitInMB));
  };
};

/**
 * Upload a mix of images and videos.
 * @param {Array} fieldsConfig - Array of objects for different fields.
 * @param {number} limitInMB - Max file size in Megabytes (default: 50).
 */
const uploadMixedMedia = (fieldsConfig, limitInMB = 50 , type_storage) => {
  const upload = multer({
    storage :selectstorage(type_storage),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        imageFilter(req, file, cb);
      } else if (file.mimetype.startsWith("video/")) {
        videoFilter(req, file, cb);
      } else {
        cb(new Error("Invalid file type. Only images and videos are allowed."), false);
      }
    },
    limits: { fileSize: limitInMB * 1024 * 1024 }
  }).fields(fieldsConfig);

  return (req, res, next) => {
    upload(req, res, (err) => handleUploadError(err, res, next, "specified", "media files", limitInMB));
  };
};

/**
 * Upload a single Excel file.
 * @param {string} fieldName - The form field name.
 * @param {number} limitInMB - Max file size in Megabytes (default: 10).
 */
const uploadExcelFile = (fieldName, limitInMB = 10 , type_storage) => {
  const upload = multer({ 
    storage :selectstorage(type_storage),
    fileFilter: excelFilter,
    limits: { fileSize: limitInMB * 1024 * 1024 }
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (err) => handleUploadError(err, res, next, 1, "excel document", limitInMB));
  };
};

module.exports = {
  uploadImages,
  uploadImageFields,
  uploadVideos,
  uploadVideoFields,
  uploadMixedMedia,
  uploadExcelFile
};