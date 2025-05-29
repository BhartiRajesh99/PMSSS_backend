import SAG from "../models/SAG.js";
import Student from "../models/Student.js";
import { ErrorResponse } from "../utils/errorResponse.js";

// @desc    Get SAG profile
// @route   GET /api/sag/profile
// @access  Private (SAG only)
export const getSAGProfile = async (req, res, next) => {
  try {
    const sag = await SAG.findById(req.user.id);
    if (!sag) {
      return next(new ErrorResponse("SAG profile not found", 404));
    }
    res.status(200).json({
      success: true,
      data: sag,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update SAG profile
// @route   PUT /api/sag/profile
// @access  Private (SAG only)
export const updateSAGProfile = async (req, res, next) => {
  try {
    const sag = await SAG.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!sag) {
      return next(new ErrorResponse("SAG profile not found", 404));
    }
    res.status(200).json({
      success: true,
      data: sag,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student applications for review
// @route   GET /api/sag/applications
// @access  Private (SAG only)
export const getStudentApplications = async (req, res, next) => {
  try {
    const applications = await Student.find({
      state: req.user.state,
      "application.status": "pending",
    }).select("application personalDetails academicDetails");

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review student application
// @route   PUT /api/sag/applications/:id/review
// @access  Private (SAG only)
export const reviewStudentApplication = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return next(new ErrorResponse("Student not found", 404));
    }

    if (student.state !== req.user.state) {
      return next(
        new ErrorResponse("Not authorized to review this application", 403)
      );
    }

    student.application.status = status;
    student.application.sagRemarks = remarks;
    student.application.reviewedBy = req.user.id;
    student.application.reviewedAt = Date.now();

    await student.save();

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload verification documents
// @route   POST /api/sag/verification
// @access  Private (SAG only)
export const uploadVerificationDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(
        new ErrorResponse("Please upload at least one document", 400)
      );
    }

    const documentUrls = req.files.map((file) => file.path);
    const sag = await SAG.findByIdAndUpdate(
      req.user.id,
      { $push: { verificationDocuments: { $each: documentUrls } } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: sag,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get verification documents
// @route   GET /api/sag/verification
// @access  Private (SAG only)
export const getVerificationDocuments = async (req, res, next) => {
  try {
    const sag = await SAG.findById(req.user.id).select("verificationDocuments");
    if (!sag) {
      return next(new ErrorResponse("SAG profile not found", 404));
    }
    res.status(200).json({
      success: true,
      data: sag.verificationDocuments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get scholarship statistics
// @route   GET /api/sag/statistics
// @access  Private (SAG only)
export const getScholarshipStatistics = async (req, res, next) => {
  try {
    const stats = await Student.aggregate([
      {
        $match: {
          state: req.user.state,
        },
      },
      {
        $group: {
          _id: "$application.status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalApplications = await Student.countDocuments({
      state: req.user.state,
    });

    res.status(200).json({
      success: true,
      data: {
        statistics: stats,
        totalApplications,
      },
    });
  } catch (error) {
    next(error);
  }
};
