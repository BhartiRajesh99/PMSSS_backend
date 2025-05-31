import Student from "../models/Student.js";
import Document from "../models/Document.js";
import { ErrorResponse } from "../utils/errorResponse.js";

// @desc    Register a new student
// @route   POST /api/students/register
// @access  Public
export const registerStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private
export const getStudentProfile = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return next(new ErrorResponse("Student not found", 404));
    }
    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Private
export const updateStudentProfile = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) {
      return next(new ErrorResponse("Student not found", 404));
    }
    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload student documents
// @route   POST /api/students/documents
// @access  Private
export const uploadDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(
        new ErrorResponse("Please upload at least one document", 400)
      );
    }

    const documentUrls = req.files.map((file) => file.fileUrl);
    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { $push: { documents: { $each: documentUrls } } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student documents
// @route   GET /api/student/documents
// @access  Private
export const getStudentDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ student: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("Error in getStudentDocuments:", error);
    next(error);
  }
};

// @desc    Get student scholarship status
// @route   GET /api/students/scholarship-status
// @access  Private
export const getStudentScholarshipStatus = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id).select(
      "scholarshipStatus"
    );
    if (!student) {
      return next(new ErrorResponse("Student not found", 404));
    }
    res.status(200).json({
      success: true,
      data: student.scholarshipStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student application
// @route   PUT /api/students/application
// @access  Private
export const updateStudentApplication = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { $set: { application: req.body } },
      { new: true, runValidators: true }
    );
    if (!student) {
      return next(new ErrorResponse("Student not found", 404));
    }
    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};
