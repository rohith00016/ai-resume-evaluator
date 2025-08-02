PRD for AI Resume Evaluation Application
1. Executive Summary
1.1 Product Vision
The Resume Evaluation Application is a comprehensive web-based platform that empowers job seekers to enhance their resumes through AI-powered feedback and scoring. The application provides an intuitive interface for resume submission, automated evaluation using advanced AI models, secure cloud storage, and seamless email delivery of results.
1.2 Key Value Propositions
Instant AI-Powered Feedback: Automated resume analysis with actionable improvement suggestions
Comprehensive Scoring System: Objective scoring out of 10 with detailed explanations
Secure Cloud Storage: Professional PDF management through Cloudinary integration
Seamless Email Delivery: Direct feedback delivery to users’ email addresses
User-Friendly Interface: Intuitive frontend for easy resume submission and evaluation management
2. Product Features
2.1 Resume Upload and AI Evaluation
Overview: Users submit PDF resumes with custom evaluation criteria and receive comprehensive AI-generated feedback and scoring.
Key Requirements:
Accept PDF files up to 5MB via secure upload endpoint
Support custom evaluation prompts (e.g., “Evaluate for software engineer role”)
Generate detailed feedback using Google Generative AI (gemini-1.5-flash)
Provide numerical scoring (0-10 scale) with explanation
Store all data securely in MongoDB with Cloudinary integration
Technical Specifications:
Endpoint: POST /api/resume
File Validation: PDF format, maximum 5MB
Text Extraction: pdf-parse library for content analysis
AI Model: gemini-1.5-flash (15 RPM, ~1M tokens/min)
Storage: Cloudinary for PDFs, MongoDB for metadata
User Journey:
User accesses submission form
Completes required fields (name, email, prompt)
Uploads PDF resume (≤5MB)
System validates and processes file
AI generates feedback and score
Results displayed immediately
Data saved for future reference
Success Metrics:
95% successful evaluation rate for valid submissions
100% PDF storage success in Cloudinary
Average response time <5 seconds
2.2 Evaluation Management Dashboard
Overview: Comprehensive list view of all evaluations with direct email functionality.
Key Features:
Complete evaluation history display
Individual “Send Mail” buttons for each evaluation
Responsive design for all device types
Real-time status updates for email delivery
Data Display:
Evaluation ID (MongoDB _id)
User name and email
Feedback summary
Score with visual indicators
Resume download link
Email delivery status
Technical Implementation:
Endpoint: GET /api/learners
Response Format: JSON array with complete evaluation data
Frontend: React components with Tailwind CSS styling
Functionality: Direct database queries for real-time data
2.3 Smart Email Delivery System
Overview: Database-driven email system that delivers personalized feedback reports.
Core Functionality:
Fetch evaluation data using unique evaluation ID
Compose professional email with feedback, score, and resume link
Handle delivery status and error reporting
Maintain delivery logs for tracking
Email Content Structure:
Professional subject line with user name
Personalized greeting
Resume score with context
Detailed feedback sections
Secure Cloudinary PDF link
Technical Details:
Endpoint: POST /api/send-feedback
Email Service: Nodemailer with Gmail integration
Data Source: MongoDB query by evaluation ID
Error Handling: 404 for missing evaluations, 500 for delivery issues
3. Technical Architecture
3.1 Backend Infrastructure
Framework: Node.js with Express.js
Port: 5000
Core Dependencies:
{
  "multer": "^1.4.5",           // File upload handling
  "cloudinary": "^1.40.0",     // Cloud storage management
  "pdf-parse": "^1.1.1",       // PDF text extraction
  "@google/generative-ai": "^0.2.1", // AI integration
  "mongoose": "^7.5.0",        // MongoDB ODM
  "nodemailer": "^6.9.4",      // Email delivery
  "cors": "^2.8.5",            // Cross-origin support
  "dotenv": "^16.3.1"          // Environment management
}


API Endpoints:
POST /api/resume - Resume upload and evaluation
GET /api/learners - Retrieve all evaluations
POST /api/send-feedback - Email delivery trigger
3.2 Database Schema
MongoDB Collection: learners
{
  _id: ObjectId,              // Unique evaluation identifier
  name: String,               // User's full name
  email: String,              // User's email address
  resumePublicId: String,     // Cloudinary public ID
  resumeUrl: String,          // Cloudinary secure URL
  feedback: String,           // AI-generated feedback
  score: Number,              // Score (0-10, default: 5.0)
  createdAt: Date,            // Evaluation timestamp
  updatedAt: Date             // Last modification
}

3.3 Frontend Architecture
Framework: React 18 with modern hooks
Styling: Tailwind CSS for responsive design
HTTP Client: Axios for API communication
Key Components:
ResumeSubmissionForm - File upload and evaluation request
EvaluationList - Dashboard with email functionality
LoadingSpinner - User feedback during processing
ErrorBoundary - Graceful error handling
Routing Structure:
/ - Home page with submission form
/evaluations - Evaluation management dashboard
/submit - Dedicated submission page (optional)
3.4 Cloud Services Integration
Cloudinary Configuration:
Storage: PDF files with optimization
Transformations: Size optimization during upload
Security: Signed URLs for protected access
Backup: Automatic redundancy and version control
Google Generative AI:
Model: gemini-1.5-flash for optimal free-tier performance
Rate Limits: 15 requests per minute
Token Limits: ~1M tokens per minute
Retry Logic: Exponential backoff for quota management
4. Environment Configuration
4.1 Required Environment Variables
# AI Service
GEMINI_API_KEY=your_google_ai_api_key

# Database
MONGO_URI=mongodb://username:password@host:port/database

# Email Service
MAIL_USER=your_gmail_address@gmail.com
MAIL_PASS=your_gmail_app_password

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Application
NODE_ENV=production
PORT=5000

4.2 Security Considerations
File Upload Security:
Strict MIME type validation (application/pdf only)
File size limit enforcement (5MB maximum)
Malware scanning integration (future enhancement)
Secure temporary file handling
Data Protection:
Encrypted database connections
Secure Cloudinary URLs with expiration
Environment variable protection
Input sanitization and validation
5. Error Handling and Reliability
5.1 Comprehensive Error Management
File Upload Errors:
400 Bad Request: “Only PDF files are allowed”
413 Payload Too Large: “File size must be under 5MB”
422 Unprocessable Entity: “Could not extract text from PDF”
AI Service Errors:
429 Too Many Requests: Implement retry with exponential backoff
503 Service Unavailable: “AI service temporarily unavailable”
Retry attempts: 3 times with delays (30s, 60s, 90s)
Database Errors:
404 Not Found: “Evaluation not found”
500 Internal Server Error: Database connection issues
Connection pooling for improved reliability
Email Delivery Errors:
SMTP authentication failures
Network connectivity issues
Invalid email address handling
Delivery status tracking
5.2 Monitoring and Logging
Application Logs:
AI API requests and responses
Cloudinary upload results
Database query performance
Email delivery attempts
Error stack traces with context
Performance Metrics:
Response time monitoring
Success/failure rates
Resource utilization tracking
User engagement analytics

6. Performance Requirements
6.1 Response Time Targets
Resume Evaluation: <5 seconds (excluding AI processing time)
Email Delivery: <2 seconds (excluding SMTP delays)
Evaluation List: <1 second for up to 1000 evaluations
File Upload: <3 seconds for 5MB files
6.2 Scalability Specifications
Concurrent Users: Support 50 simultaneous evaluations
Daily Throughput: Handle 1000+ evaluations per day
Storage Growth: Plan for 10GB monthly PDF storage increase
Database Performance: Sub-100ms query response times
7. User Experience Requirements
7.1 Frontend Validation Rules
Form Validation:
Name: Required, 2-40 characters, alphabetic characters only
Email: Required, valid email format with domain verification
Prompt: Required, 10-500 characters, meaningful evaluation context
Resume: Required, PDF only, maximum 5MB
User Feedback:
Real-time validation with inline error messages
Progress indicators during file upload and processing
Success confirmation with evaluation summary
Clear error messages with resolution guidance

8. Testing Strategy
8.1 Backend Testing
Unit Tests: Individual function validation
Integration Tests: API endpoint functionality
Load Tests: Concurrent user simulation
Security Tests: Input validation and injection prevention
8.2 Frontend Testing
Component Tests: React component functionality
E2E Tests: Complete user journey validation
Cross-browser Tests: Chrome, Firefox, Safari, Edge
Mobile Tests: iOS and Android device compatibility
9. Deployment and DevOps
9.1 Production Environment
Backend: Node.js on cloud hosting (AWS/GCP/Azure)
Frontend: Static hosting with CDN (Netlify/Vercel)
Database: MongoDB Atlas with automated backups
Monitoring: Application performance monitoring tools
9.2 CI/CD Pipeline
Automated testing on code commits
Security vulnerability scanning
Performance regression testing
Blue-green deployment strategy


10. Success Metrics and KPIs
10.1 Technical Metrics
Uptime: 99.5% availability target
Error Rate: <1% for all API endpoints
Performance: 95th percentile response times within targets
Storage Efficiency: Optimal Cloudinary usage within quotas
11. Risk Management
11.1 Technical Risks
Risk
Impact
Probability
Mitigation Strategy
AI Quota Limits
High
Medium
Implement retry logic, upgrade to paid tier
Cloudinary Storage
Medium
Low
Monitor usage, implement cleanup policies
Database Downtime
High
Low
Use MongoDB Atlas with automatic failover
Email Delivery Failures
Medium
Medium
Implement queue system with retry logic


12. Future Roadmap
12.1 Phase 2 Enhancements
User Authentication: Personal dashboards and evaluation history
Premium Features: Advanced AI models and detailed analytics
Template Library: Industry-specific resume templates
Collaboration Tools: Share evaluations with career coaches
12.2 Phase 3 Innovations
Mobile Application: Native iOS and Android apps
Real-time Collaboration: Live editing and feedback sessions
AI Interview Prep: Mock interview questions based on resume
Integration APIs: Connect with job boards and ATS systems
13. Acceptance Criteria
Users can submit a PDF resume (<5MB) via a frontend form, receiving feedback and a score (or default 5.0) in <5s
Evaluations are saved in MongoDB with Cloudinary metadata
/api/learners returns all evaluations with _id for use in email triggers
Frontend displays a responsive list of evaluations with functional “Send Mail” buttons
/api/send-feedback fetches feedback, score, and resume URL from MongoDB using evaluationId and sends them via email in <2s
Form validates inputs and displays API errors clearly
Errors return appropriate status codes (400, 404, 503, 500)
No temporary local files remain after Cloudinary uploads
Logs capture AI feedback, Cloudinary uploads, database queries, and retries
Application handles 15 concurrent evaluations per minute without quota errors

14. Assumptions and Constraints
14.1 Assumptions
Users have valid PDF resumes with extractable text
Google Generative AI and Cloudinary APIs remain available with consistent quotas
Gmail credentials are configured correctly for Nodemailer
MongoDB instance is accessible and properly set up
Frontend is developed using React and Tailwind CSS
Users have access to evaluation IDs via the frontend list
14.2 Constraints
Free-tier quotas limit AI throughput to 15 RPM and Cloudinary storage to 25GB/month
PDF parsing may fail for scanned or image-based resumes
Limited to Gmail for email delivery
Frontend development is required to enable form and list functionality
15. Conclusion
This Resume Evaluation Application represents a comprehensive solution for automated resume evaluation. The updated 5MB file size limit ensures faster uploads while maintaining quality, and the robust architecture supports scalable growth and reliable performance. The detailed technical specifications, security measures, and monitoring strategies outlined in this document provide a solid foundation for successful development and deployment. Regular reviews and updates will ensure the application continues to meet evolving user needs and technological advances.



Document Version: 1.0
Last Updated: August 1, 2025
Author: Rohith M
Next Review: Aug 2, 2025
