# Client Environment Variables

## Required Environment Variables

Create a `.env` file in the client directory with the following variables:

### API Configuration

- `VITE_API_URL`: The base URL for the API server
  - Example: `http://localhost:5000/api`
  - Required: Yes
  - Default: None (must be set in .env file)

## Example .env file:

```
VITE_API_URL=http://localhost:5000/api
```

## ⚠️ Important Notes:

- **NEVER commit the `.env` file to version control**
- The `VITE_` prefix is required for Vite to expose the variable to the client
- All API calls now use this environment variable exclusively
- For production, set this to your production API URL
- The environment variable must be set in the .env file

## Usage in Code:

```javascript
// The API URL is automatically used in all components
const API_BASE_URL = import.meta.env.VITE_API_URL;
```

## Components Updated:

- `ResumeForm.jsx`
- `PortfolioForm.jsx`
- `FeedbackDetail.jsx`
- `Manage.jsx`
- `Submissions.jsx`
- `resumeSlice.js`
- `authSlice.js`
