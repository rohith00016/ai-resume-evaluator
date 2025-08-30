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

### Email Service (Gmail)

- `MAIL_USER`: Gmail address for sending emails
  - Example: `your-email@gmail.com`
  - Required: Yes
- `MAIL_PASS`: Gmail app password (not regular password)
  - Generate from: https://myaccount.google.com/apppasswords
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

## Example .env file:

```
MONGO_URI=mongodb://localhost:27017/resume-evaluator
GEMINI_API_KEY=your_google_ai_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
MAIL_USER=your_gmail_address@gmail.com
MAIL_PASS=your_gmail_app_password
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
