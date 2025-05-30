import path from "path";

// Configure uploads directory based on environment
export const uploadsDir =
  process.env.NODE_ENV === "production"
    ? "/tmp/uploads" // Use /tmp in production (serverless)
    : path.join(process.cwd(), "uploads"); // Use local directory in development

// Ensure uploads directory exists
export const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};
