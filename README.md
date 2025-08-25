# AI Resume Evaluator

A comprehensive web-based platform that empowers job seekers to enhance their resumes through AI-powered feedback and scoring. The application provides an intuitive interface for resume submission, automated evaluation using advanced AI models, secure cloud storage, and seamless email delivery of results.

## 🚀 Features

- **AI-Powered Resume Evaluation**: Automated analysis with actionable improvement suggestions
- **Portfolio Evaluation**: Web scraping and analysis of deployed portfolio websites
- **MERN Stack Detection**: Automatic identification of MongoDB, Express, React, Node.js technologies
- **Comprehensive Scoring System**: Objective scoring out of 10 with detailed explanations
- **Secure Cloud Storage**: Professional PDF management through Cloudinary integration
- **Email Delivery System**: Direct feedback delivery to users' email addresses
- **Modern UI/UX**: Intuitive frontend with responsive design
- **Form Validation**: Comprehensive client and server-side validation

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **File Storage**: Cloudinary
- **AI Service**: Google Generative AI (Gemini)
- **Web Scraping**: Puppeteer for portfolio analysis
- **Email**: Nodemailer with Gmail
- **Validation**: express-validator

### Frontend

- **Framework**: React 18
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router v6
- **HTTP Client**: Axios

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Google Generative AI API key
- Cloudinary account
- Gmail account with app password

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-resume-evaluator
```

### 2. Install Dependencies

**Backend:**

```bash
cd server
npm install
```

**Frontend:**

```bash
cd client
npm install
```

### 3. Environment Setup

**Backend Environment:**
Create a `.env` file in the `server` directory:

```env
MONGO_URI=mongodb://localhost:27017/resume-evaluator
GEMINI_API_KEY=your_google_ai_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
MAIL_USER=your_gmail_address@gmail.com
MAIL_PASS=your_gmail_app_password
NODE_ENV=development
PORT=5000
```

See `server/README_ENV.md` for detailed environment variable documentation.

### 4. Start the Application

**Backend:**

```bash
cd server
npm run dev
```

**Frontend:**

```bash
cd client
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## 📁 Project Structure

```
ai-resume-evaluator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── features/       # Redux slices
│   │   ├── store/          # Redux store
│   │   └── App.jsx         # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Business logic
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── services/           # External services
│   └── server.js           # Main server file
├── API_ROUTES.md           # API documentation
└── README.md               # This file
```

## 🔧 API Endpoints

### Health Check

- `GET /health` - Check server status

### Resume Management

- `POST /api/resume` - Upload and evaluate resume (with optional portfolio URL)
- `GET /api/learners` - Get all evaluations
- `POST /api/send-feedback` - Send feedback email

### Portfolio Evaluation

The application now supports portfolio evaluation for enhanced resume analysis:

- **Web Scraping**: Automatically analyzes deployed portfolio websites
- **MERN Stack Detection**: Identifies MongoDB, Express, React, Node.js technologies
- **Comprehensive Scoring**: Evaluates navigation, skills, projects, social links, and technical features
- **Enhanced AI Feedback**: Combines resume and portfolio analysis for better insights

See `API_ROUTES.md` for detailed API documentation.

## 🎨 Frontend Features

### Resume Submission Form

- Real-time form validation
- File upload with drag-and-drop
- Progress indicators
- Success/error feedback
- Responsive design

### Evaluation Dashboard

- List all evaluations
- Score visualization
- Email status tracking
- Resume download links
- Search and filter capabilities

## 🔒 Security Features

- File type validation (PDF only)
- File size limits (10MB max)
- Input sanitization
- CORS configuration
- Environment variable protection
- Secure file storage

## 📊 Performance Features

- Optimized database queries
- File upload streaming
- AI service retry logic
- Response compression

## 🧪 Testing

### Backend Testing

```bash
cd server
npm test
```

### Frontend Testing

```bash
cd client
npm test
```

## 🚀 Deployment

### Backend Deployment

1. Set up MongoDB Atlas
2. Set environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, etc.)

## 📈 Monitoring

- Application logs with timestamps
- Error tracking and reporting
- Performance metrics
- API usage monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the API documentation in `API_ROUTES.md`
- Review environment setup in `server/README_ENV.md`
- Open an issue on GitHub

## 🔄 Version History

- **v1.1.0** - Portfolio Evaluation Integration

  - Web scraping and portfolio analysis
  - MERN stack technology detection
  - Enhanced AI feedback with portfolio insights
  - Updated UI to support portfolio URLs

- **v1.0.0** - Initial release with core functionality
  - Resume upload and AI evaluation
  - Email delivery system
  - Modern React frontend
  - Comprehensive validation
