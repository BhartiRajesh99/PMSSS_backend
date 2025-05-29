import { v2 as cloudinary } from "cloudinary";
import { ErrorResponse } from "./errorResponse.js";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const requiredEnvVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.error("Missing Cloudinary environment variables:", missingVars);
    console.error("\nPlease add the following to your .env file:");
    console.error("CLOUDINARY_CLOUD_NAME=your_cloud_name");
    console.error("CLOUDINARY_API_KEY=your_api_key");
    console.error("CLOUDINARY_API_SECRET=your_api_secret");
    console.error("\nYou can get these values from your Cloudinary dashboard.");
    return false;
  }
  return true;
};

// Configure Cloudinary
try {
  if (validateCloudinaryConfig()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("Cloudinary configured successfully");
  } else {
    console.warn("Cloudinary not configured. File uploads will not work.");
  }
} catch (error) {
  console.error("Cloudinary configuration error:", error);
}

// Upload file to Cloudinary
export const uploadOnCloudinary = async (filePath, folder) => {
  try {
    if (!filePath) {
      throw new Error("File path is required");
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error(
        "Cloudinary is not configured. Please add Cloudinary credentials to your .env file."
      );
    }

    console.log("Starting Cloudinary upload...");
    console.log("File path:", filePath);
    console.log("Folder:", folder);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    // Determine resource type based on file extension
    const fileExtension = path.extname(filePath).toLowerCase();
    let resourceType = "raw";

    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(fileExtension)) {
      resourceType = "image";
    } else if ([".mp4", ".mov", ".avi", ".wmv"].includes(fileExtension)) {
      resourceType = "video";
    } else if ([".pdf", ".doc", ".docx", ".txt"].includes(fileExtension)) {
      resourceType = "raw";
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: resourceType,
    });

    console.log("Cloudinary upload successful");
    console.log("Upload result:", {
      public_id: result.public_id,
      secure_url: result.secure_url,
    });

    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new ErrorResponse(
      `Error uploading file to cloud storage: ${error.message}`,
      500
    );
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error("Public ID is required");
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error(
        "Cloudinary is not configured. Please add Cloudinary credentials to your .env file."
      );
    }

    console.log("Attempting to delete from Cloudinary:", publicId);

    // Try different resource types
    const resourceTypes = ["image", "video", "raw"];
    let lastError = null;

    for (const resourceType of resourceTypes) {
      try {
        console.log(`Trying to delete with resource_type: ${resourceType}`);
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        });

        console.log(`Cloudinary deletion result for ${resourceType}:`, result);

        if (result.result === "ok") {
          console.log(
            `Successfully deleted with resource_type: ${resourceType}`
          );
          return result;
        }
      } catch (error) {
        console.log(
          `Failed to delete with resource_type: ${resourceType}`,
          error.message
        );
        lastError = error;
      }
    }

    // If we get here, all resource types failed
    throw new Error(
      `Failed to delete file after trying all resource types: ${
        lastError?.message || "Unknown error"
      }`
    );
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new ErrorResponse(
      `Error deleting file from cloud storage: ${error.message}`,
      500
    );
  }
};
