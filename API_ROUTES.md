# API Routes Documentation

## Base URL

- Development: `http://localhost:5000`
- Production: `{PRODUCTION_URL}`

## Authentication

Most endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles

- **user**: Can submit evaluations and view their own submissions
- **admin**: Can view all submissions and send feedback emails

## Endpoints

### 1. User Registration

- **URL**: `POST /api/auth/register`
- **Description**: Register a new user account
- **Auth**: Public
- **Content-Type**: `application/json`
- **Request Body**:
  - `username` (string, required): Username (3-30 characters, alphanumeric + underscore only)
  - `email` (string, required): Valid email address
  - `password` (string, required): Password (minimum 6 characters)
  - `adminCode` (string, optional): Admin registration code to create admin account
- **Success Response** (201):
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses**:
  - `400`: User already exists, validation errors
  - `500`: Server error

### 2. User Login

- **URL**: `POST /api/auth/login`
- **Description**: Authenticate user and get JWT token
- **Auth**: Public
- **Content-Type**: `application/json`
- **Request Body**:
  - `email` (string, required): Valid email address
  - `password` (string, required): User password
- **Success Response** (200):
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses**:
  - `401`: Invalid email or password
  - `500`: Server error

### 3. Get Current User Profile

- **URL**: `GET /api/auth/me`
- **Description**: Get current user profile information
- **Auth**: Required (JWT token)
- **Success Response** (200):
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```
- **Error Responses**:
  - `401`: Not authorized
  - `500`: Server error

### 4. Get All Users

- **URL**: `GET /api/auth/users`
- **Description**: Get all users (admin only)
- **Auth**: Required (JWT token, admin role)
- **Request Body**: None
- **Success Response** (200):
  ```json
  [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
  ```
- **Error Responses**:
  - `401`: Not authorized
  - `403`: Admin access required
  - `500`: Server error

### 5. Promote User to Admin

- **URL**: `PUT /api/auth/promote/:userId`
- **Description**: Promote a user to admin role (admin only)
- **Auth**: Required (JWT token, admin role)
- **Request Body**: None
- **Success Response** (200):
  ```json
  {
    "message": "User promoted to admin successfully",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "admin"
    }
  }
  ```
- **Error Responses**:
  - `401`: Not authorized
  - `403`: Admin access required
  - `404`: User not found
  - `500`: Server error

### 6. Health Check

- **URL**: `GET /health`
- **Description**: Check if the server is running
- **Auth**: Public
- **Response**:
  ```json
  {
    "status": "OK",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```

### 7. Upload and Evaluate Resume Only

- **URL**: `POST /api/resumes`
- **Description**: Upload a PDF resume and get AI-powered evaluation (resume only)
- **Auth**: Required (JWT token)
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `name` (string, required): User's full name (2-40 characters, alphabetic only)
  - `email` (string, required): Valid email address
  - `course` (string, required): Course type ("MERN", "UXUI", or "Devops")
  - `resume` (file, required): PDF file (max 10MB)
- **Success Response** (201):
  ```json
  {
    "message": "Resume evaluation completed",
    "learner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "course": "MERN",
      "resumeFeedback": "Detailed AI feedback...",
      "resumeScore": 8.5,
      "resumeUrl": "https://res.cloudinary.com/...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400`: Validation errors
  - `413`: File too large (>10MB)
  - `422`: Could not extract text from PDF
  - `503`: AI service unavailable

### 8. Submit and Evaluate Portfolio Only

- **URL**: `POST /api/portfolios`
- **Description**: Submit a portfolio URL and get AI-powered evaluation (portfolio only)
- **Auth**: Required (JWT token)
- **Content-Type**: `application/json`
- **Request Body**:
  - `name` (string, required): User's full name (2-40 characters, alphabetic only)
  - `email` (string, required): Valid email address
  - `course` (string, required): Course type ("MERN", "UXUI", or "Devops")
  - `portfolioUrl` (string, required): Valid HTTP/HTTPS URL of deployed portfolio
- **Success Response** (201):
  ```json
  {
    "message": "Portfolio evaluation completed",
    "learner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "course": "MERN",
      "portfolioUrl": "https://john-portfolio.com",
      "portfolioFeedback": "Detailed AI feedback...",
      "portfolioScore": 8.5,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400`: Validation errors (invalid URL, missing fields)
  - `503`: AI service unavailable

### 9. Legacy: Upload and Evaluate Resume (with optional portfolio)

- **URL**: `POST /api/resume`
- **Description**: Legacy endpoint for uploading resume with optional portfolio evaluation
- **Auth**: Required (JWT token)
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `name` (string, required): User's full name (2-40 characters, alphabetic only)
  - `email` (string, required): Valid email address
  - `course` (string, required): Course type ("MERN", "UXUI", or "Devops")
  - `portfolioUrl` (string, optional): Deployed portfolio URL for enhanced evaluation
  - `resume` (file, required): PDF file (max 10MB)
- **Success Response** (201): Same as above with combined feedback
- **Error Responses**: Same as above

### 10. Get All Evaluations

- **URL**: `GET /api/learners`
- **Description**: Retrieve resume evaluations (role-based access)
- **Auth**: Required (JWT token)
- **Access Control**:
  - **Admin**: Can view all evaluations
  - **User**: Can only view their own evaluations
- **Success Response** (200):
  ```json
  [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "course": "MERN",
      "portfolioUrl": "https://john-portfolio.com",
      "portfolioFeedback": "Detailed portfolio feedback...",
      "portfolioScore": 8.5,
      "resumeFeedback": "Detailed resume feedback...",
      "resumeScore": 8.5,
      "resumeUrl": "https://res.cloudinary.com/...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "emailSent": false,
      "emailSentAt": null,
      "submittedBy": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "admin",
        "email": "admin@example.com"
      }
    }
  ]
  ```

### 11. Get Single Evaluation

- **URL**: `GET /api/learners/:id`
- **Description**: Retrieve a single evaluation by ID (role-based access)
- **Auth**: Required (JWT token)
- **Access Control**:
  - **Admin**: Can view any evaluation
  - **User**: Can only view their own evaluations
- **Success Response** (200):
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "course": "MERN",
    "portfolioUrl": "https://john-portfolio.com",
    "portfolioFeedback": "Detailed portfolio feedback...",
    "portfolioScore": 8.5,
    "resumeFeedback": "Detailed resume feedback...",
    "resumeScore": 8.5,
    "resumeUrl": "https://res.cloudinary.com/...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "emailSent": false,
    "emailSentAt": null,
    "submittedBy": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "admin",
      "email": "admin@example.com"
    }
  }
  ```
- **Error Responses**:
  - `401`: Not authorized
  - `404`: Evaluation not found
  - `500`: Server error

### 12. Send Feedback Email

- **URL**: `POST /api/send-feedback`
- **Description**: Send evaluation feedback via email
- **Auth**: Required (JWT token)
- **Access Control**: Admin only
- **Request Body**:
  - `evaluationId` (string, required): MongoDB ObjectId of the evaluation
- **Success Response** (200):
  ```json
  {
    "message": "Email sent successfully",
    "evaluationId": "507f1f77bcf86cd799439011"
  }
  ```
- **Error Responses**:
  - `400`: Email already sent or validation errors
  - `404`: Evaluation not found
  - `500`: Email delivery failed

## Error Response Format

```json
{
  "error": "Error message",
  "details": ["Detailed error information"]
}
```

## File Upload Requirements

- **Format**: PDF only
- **Size**: Maximum 10MB
- **Content**: Must contain extractable text (not scanned images)

## Portfolio Evaluation Features

- **Web Scraping**: Uses Puppeteer to analyze deployed portfolio websites
- **MERN Stack Detection**: Automatically identifies MongoDB, Express, React, Node.js technologies
- **Portfolio Scoring**: Evaluates navigation, skills, projects, social links, and technical features
- **Enhanced AI Feedback**: Combines resume and portfolio analysis for comprehensive evaluation

## Rate Limits

- AI API: 15 requests per minute (Gemini free tier)
- File upload: No specific limit (handled by server resources)

## Environment Variables Required

- `MONGO_URI`: MongoDB connection string
- `GEMINI_API_KEY`: Google Generative AI API key
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `MAIL_USER`: Gmail address for sending emails
- `MAIL_PASS`: Gmail app password
- `JWT_SECRET`: Secret key for JWT token signing
- `ADMIN_REGISTRATION_CODE`: Secret code for admin registration
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
