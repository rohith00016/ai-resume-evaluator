# Environment Variables Documentation

## Required Environment Variables

Create a `.env` file in the server directory with the following variables:

### Database Configuration

- `MONGO_URI`: MongoDB connection string
  - Example: `mongodb://localhost:27017/resume-evaluator`
  - Required: Yes

### AI Service

- `GEMINI_API_KEY`: Google Generative AI API key
  - Get from: https://makersuite.google.com/app/apikey
  - Required: Yes

### Cloud Storage (Cloudinary)

- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
  - Get from: https://cloudinary.com/console
  - Required: Yes
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
  - Get from: https://cloudinary.com/console
  - Required: Yes
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
  - Get from: https://cloudinary.com/console
  - Required: Yes

### Email Service (AWS SES)

- `AWS_ACCESS_KEY_ID`: AWS access key ID for SES
  - Get from: AWS IAM Console
  - Required: Yes
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key for SES
  - Get from: AWS IAM Console
  - Required: Yes
- `AWS_REGION`: AWS region where SES is configured
  - Example: `us-east-1`, `us-west-2`, `eu-west-1`
  - Required: Yes
- `AWS_SES_FROM_EMAIL`: Verified sender email address in AWS SES
  - Must be verified in AWS SES console
  - Example: `noreply@yourdomain.com`
  - Required: Yes

### Authentication

- `JWT_SECRET`: Secret key for JWT token signing
  - Generate a strong random string (at least 32 characters)
  - Example: `your-super-secret-jwt-key-here-32-chars-min`
  - Required: Yes
- `ADMIN_REGISTRATION_CODE`: Secret code for admin registration
  - Generate a secure random string (at least 8 characters)
  - Example: `admin-secret-2024`
  - Required: Yes (for admin functionality)

### Application Configuration

- `NODE_ENV`: Environment mode
  - Values: `development` or `production`
  - Default: `development`
  - Required: No
- `PORT`: Server port
  - Default: `5000`
  - Required: No
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
  - Example: `http://localhost:5173,https://yourdomain.com`
  - Default: `http://localhost:5173,http://localhost:3000` (development)
  - Required: No
- `LOG_LEVEL`: Logging level (error, warn, info, debug)
  - Default: `info`
  - Required: No

## Example .env file:

```
MONGO_URI=mongodb://localhost:27017/resume-evaluator
GEMINI_API_KEY=your_google_ai_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
JWT_SECRET=your-super-secret-jwt-key-here-32-chars-min
ADMIN_REGISTRATION_CODE=admin-secret-2024
NODE_ENV=development
PORT=5000
```

## ⚠️ Important Security Notes:

- **NEVER commit the `.env` file to version control**
- Keep your API keys and secrets secure
- Use different keys for development and production
- Regularly rotate your API keys
