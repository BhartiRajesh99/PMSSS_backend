import Document from "../models/Document.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import fs from "fs";
import path from "path";
import { uploadsDir, ensureUploadsDir } from "../config/uploadConfig.js";

// Ensure uploads directory exists
ensureUploadsDir();

// @desc    Get all documents for a student
// @route   GET /api/documents/student
// @access  Private (Student)
export const getStudentDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ student: req.user.id });
    res.status(200).json(documents);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private (Student)
export const uploadDocument = async (req, res, next) => {
  try {
    console.log("Upload request received");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    if (!req.file) {
      console.log("No file provided in request");
      return next(new ErrorResponse("Please upload a file", 400));
    }

    // Validate document type
    const validTypes = [
      "fee_receipt",
      "attendance_certificate",
      "marksheet",
      "other",
    ];
    if (!req.body.type || !validTypes.includes(req.body.type)) {
      console.log("Invalid document type:", req.body.type);
      // Delete the uploaded file
      if (req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log("Temporary file deleted after type validation error");
        } catch (unlinkError) {
          console.error("Error deleting temporary file:", unlinkError);
        }
      }
      return next(
        new ErrorResponse("Please provide a valid document type", 400)
      );
    }

    try {
      let fileUrl;
      let cloudinaryId = null;

      // Try to upload to Cloudinary if configured
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        console.log("Uploading to Cloudinary...");
        const cloudinaryResponse = await uploadOnCloudinary(
          req.file.path,
          "PMSSS/documents"
        );
        console.log("Cloudinary upload response:", cloudinaryResponse);
        fileUrl = cloudinaryResponse.secure_url;
        cloudinaryId = cloudinaryResponse.public_id;
      } else {
        // Store file locally if Cloudinary is not configured
        console.log("Cloudinary not configured, storing file locally...");
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.copyFileSync(req.file.path, filePath);
        fileUrl = `/uploads/${fileName}`;
      }

      console.log("Creating document in database...");
      // Create document in database
      const document = await Document.create({
        student: req.user.id,
        type: req.body.type,
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        cloudinaryId: cloudinaryId,
      });
      console.log("Document created successfully:", document._id);

      // Delete the temporary file
      try {
        fs.unlinkSync(req.file.path);
        console.log("Temporary file deleted after successful upload");
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }

      res.status(201).json(document);
    } catch (uploadError) {
      console.error("Error during upload process:", uploadError);
      // Clean up the temporary file if it exists
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log("Temporary file deleted after upload error");
        } catch (unlinkError) {
          console.error("Error deleting temporary file:", unlinkError);
        }
      }
      return next(
        new ErrorResponse(
          `Error uploading document: ${uploadError.message}`,
          500
        )
      );
    }
  } catch (error) {
    console.error("Document upload error:", error);
    // Clean up the temporary file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("Temporary file deleted after general error");
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
    }
    return next(
      new ErrorResponse(
        `Server error during document upload: ${error.message}`,
        500
      )
    );
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private (Student)
export const deleteDocument = async (req, res, next) => {
  try {
    console.log("Delete request received for document:", req.params.id);
    console.log("User ID:", req.user.id);

    // Validate document ID
    if (!req.params.id) {
      console.log("No document ID provided");
      return next(new ErrorResponse("Document ID is required", 400));
    }

    // Find the document
    const document = await Document.findById(req.params.id);
    console.log("Found document:", document ? "Yes" : "No");

    if (!document) {
      console.log("Document not found");
      return next(new ErrorResponse("Document not found", 404));
    }

    // Check if the document belongs to the student
    console.log("Document student ID:", document.student.toString());
    console.log("Request user ID:", req.user.id);

    if (document.student.toString() !== req.user.id) {
      console.log("Authorization failed - document does not belong to user");
      return next(
        new ErrorResponse("You are not authorized to delete this document", 403)
      );
    }

    try {
      // Delete from Cloudinary if cloudinaryId exists
      if (document.cloudinaryId && process.env.CLOUDINARY_CLOUD_NAME) {
        console.log("Deleting from Cloudinary:", document.cloudinaryId);
        try {
          await deleteFromCloudinary(document.cloudinaryId);
          console.log("Successfully deleted from Cloudinary");
        } catch (cloudinaryError) {
          console.warn("Cloudinary deletion warning:", cloudinaryError.message);
          // Continue with database deletion even if Cloudinary fails
        }
      } else if (!document.cloudinaryId) {
        // Delete local file if it exists
        const fileName = path.basename(document.fileUrl);
        const filePath = path.join(uploadsDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Successfully deleted local file");
        }
      }

      // Delete from database
      console.log("Deleting from database");
      await document.deleteOne();
      console.log("Successfully deleted from database");

      res.status(200).json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (deleteError) {
      console.error("Error during deletion process:", deleteError);
      return next(
        new ErrorResponse(
          `Error deleting document: ${deleteError.message}`,
          500
        )
      );
    }
  } catch (error) {
    console.error("Document deletion error:", error);
    return next(
      new ErrorResponse(
        `Server error while deleting document: ${error.message}`,
        500
      )
    );
  }
};

// @desc    Get all documents (for admin/bureau)
// @route   GET /api/documents
// @access  Private (Admin/Bureau)
export const getAllDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find()
      .populate("student", "name email")
      .populate("verifiedBy", "name");
    res.status(200).json(documents);
  } catch (error) {
    next(error);
  }
};

// @desc    Update document status
// @route   PUT /api/documents/:id/status
// @access  Private (Admin/Bureau)
export const updateDocumentStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    // Validate status
    const validStatuses = ["pending", "verified", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return next(new ErrorResponse("Please provide a valid status", 400));
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return next(new ErrorResponse("Document not found", 404));
    }

    document.status = status;
    document.remarks = remarks || "";
    document.verifiedBy = req.user.id;
    document.verifiedAt = Date.now();

    await document.save();

    res.status(200).json(document);
  } catch (error) {
    next(error);
  }
};
