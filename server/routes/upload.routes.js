// ============================================================
// Upload Routes — Image & File upload via Multer + Cloudinary
// All routes are protected (require JWT)
// ============================================================

const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// Multer config — store files in memory buffer for Cloudinary upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/zip",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"), false);
    }
  },
});

// ─── UPLOAD FILE ──────────────────────────────────────────────
// POST /api/upload
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    // Determine resource type — MUCH SMARTER DETECTION
    const mimetype = req.file.mimetype;
    const extension = req.file.originalname.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif', 'heic'];
    
    const isImage = mimetype.startsWith("image/") || imageExtensions.includes(extension);
    const resourceType = isImage ? "image" : "auto";

    console.log(`[UPLOAD] File: ${req.file.originalname} | Mime: ${mimetype} | Ext: ${extension} | isImage: ${isImage}`);

    // Upload to Cloudinary using a stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "convohub",
          resource_type: resourceType,
          // For images, apply some transformations
          ...(isImage && {
            transformation: [
              { quality: "auto", fetch_format: "auto" },
            ],
          }),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Pipe the buffer into the upload stream
      const bufferStream = require("stream").Readable.from(req.file.buffer);
      bufferStream.pipe(uploadStream);
    });

    res.json({
      success: true,
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        type: isImage ? "image" : "file",
        name: req.file.originalname,
        size: req.file.size,
        format: result.format,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    if (error.message === "File type not supported") {
      return res.status(400).json({
        success: false,
        message: "File type not supported.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error uploading file.",
    });
  }
});

// ─── UPLOAD AVATAR ────────────────────────────────────────────
// POST /api/upload/avatar
router.post(
  "/avatar",
  verifyToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded.",
        });
      }

      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({
          success: false,
          message: "Only image files are allowed for avatars.",
        });
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "convohub/avatars",
            resource_type: "image",
            transformation: [
              {
                width: 200,
                height: 200,
                crop: "fill",
                gravity: "face",
                quality: "auto",
              },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        const bufferStream = require("stream").Readable.from(req.file.buffer);
        bufferStream.pipe(uploadStream);
      });

      res.json({
        success: true,
        avatar: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({
        success: false,
        message: "Server error uploading avatar.",
      });
    }
  }
);

module.exports = router;
