const REQUIRED_ENV_VALUES = [
  "MONGO_URL",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const validateEnv = () => {
  const missing = REQUIRED_ENV_VALUES.filter(
    (name) => !process.env[name]?.trim()
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

export default validateEnv;
