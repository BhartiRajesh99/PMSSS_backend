import Finance from "../models/Finance.js";
import Student from "../models/Student.js";
import Payment from "../models/Payment.js";
import { ErrorResponse } from "../utils/errorResponse.js";

// @desc    Get finance profile
// @route   GET /api/finance/profile
// @access  Private (Finance only)
export const getFinanceProfile = async (req, res, next) => {
  try {
    const finance = await Finance.findById(req.user.id);
    if (!finance) {
      return next(new ErrorResponse("Finance profile not found", 404));
    }
    res.status(200).json({
      success: true,
      data: finance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update finance profile
// @route   PUT /api/finance/profile
// @access  Private (Finance only)
export const updateFinanceProfile = async (req, res, next) => {
  try {
    const finance = await Finance.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!finance) {
      return next(new ErrorResponse("Finance profile not found", 404));
    }
    res.status(200).json({
      success: true,
      data: finance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get approved applications for payment
// @route   GET /api/finance/applications
// @access  Private (Finance only)
export const getApprovedApplications = async (req, res, next) => {
  try {
    const applications = await Student.find({
      "application.status": "approved",
      "payment.status": { $ne: "completed" },
    }).select("application personalDetails bankDetails");

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process scholarship payment
// @route   POST /api/finance/payments/:studentId
// @access  Private (Finance only)
export const processScholarshipPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, transactionId } = req.body;
    const student = await Student.findById(req.params.studentId);

    if (!student) {
      return next(new ErrorResponse("Student not found", 404));
    }

    if (student.application.status !== "approved") {
      return next(
        new ErrorResponse(
          "Cannot process payment for unapproved application",
          400
        )
      );
    }

    // Create payment record
    const payment = await Payment.create({
      student: student._id,
      amount,
      paymentMethod,
      transactionId,
      processedBy: req.user.id,
    });

    // Update student payment status
    student.payment = {
      status: "completed",
      lastPayment: payment._id,
      paymentHistory: [...(student.payment?.paymentHistory || []), payment._id],
    };

    await student.save();

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history
// @route   GET /api/finance/payments
// @access  Private (Finance only)
export const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate(
        "student",
        "personalDetails.name application.registrationNumber"
      )
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate payment report
// @route   GET /api/finance/payments/report
// @access  Private (Finance only)
export const generatePaymentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const payments = await Payment.find(query)
      .populate(
        "student",
        "personalDetails.name application.registrationNumber"
      )
      .sort("createdAt");

    const totalAmount = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        payments,
        totalAmount,
        count: payments.length,
        period: {
          startDate: startDate || "all time",
          endDate: endDate || "all time",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload payment documents
// @route   POST /api/finance/documents
// @access  Private (Finance only)
export const uploadPaymentDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(
        new ErrorResponse("Please upload at least one document", 400)
      );
    }

    const documentUrls = req.files.map((file) => file.path);
    const finance = await Finance.findByIdAndUpdate(
      req.user.id,
      { $push: { paymentDocuments: { $each: documentUrls } } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: finance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment documents
// @route   GET /api/finance/documents
// @access  Private (Finance only)
export const getPaymentDocuments = async (req, res, next) => {
  try {
    const finance = await Finance.findById(req.user.id).select(
      "paymentDocuments"
    );
    if (!finance) {
      return next(new ErrorResponse("Finance profile not found", 404));
    }
    res.status(200).json({
      success: true,
      data: finance.paymentDocuments,
    });
  } catch (error) {
    next(error);
  }
};
