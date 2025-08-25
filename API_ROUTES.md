# API Routes Documentation

## Base URL

- Development: `http://localhost:5000`
- Production: `{PRODUCTION_URL}`

## Authentication

All endpoints are currently public (no authentication required).

## Endpoints

### 1. Health Check

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

### 2. Upload and Evaluate Resume

- **URL**: `POST /api/resume`
- **Description**: Upload a PDF resume and get AI-powered evaluation
- **Auth**: Public
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `name` (string, required): User's full name (2-40 characters, alphabetic only)
  - `email` (string, required): Valid email address
  - `course` (string, required): Course type ("MERN", "UXUI", or "Devops")
  - `portfolioUrl` (string, optional): Deployed portfolio URL for enhanced evaluation
  - `resume` (file, required): PDF file (max 10MB)
- **Success Response** (201):
  ```json
  {
    "message": "Resume evaluated successfully",
    "learner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "course": "MERN",
      "portfolioUrl": "https://john-portfolio.com",
      "feedback": "Detailed AI feedback...",
      "score": 8.5,
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

### 3. Get All Evaluations

- **URL**: `GET /api/learners`
- **Description**: Retrieve all resume evaluations
- **Auth**: Public
- **Success Response** (200):
  ```json
  [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "course": "MERN",
      "portfolioUrl": "https://john-portfolio.com",
      "feedback": "Detailed feedback...",
      "score": 8.5,
      "resumeUrl": "https://res.cloudinary.com/...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "emailSent": false,
      "emailSentAt": null
    }
  ]
  ```

### 4. Send Feedback Email

- **URL**: `POST /api/send-feedback`
- **Description**: Send evaluation feedback via email
- **Auth**: Public
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
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
