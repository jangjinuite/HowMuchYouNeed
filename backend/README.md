# How Much You Need - Backend API

Node.js + Express backend for the "How Much You Need" game.

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/public key
- `ADMIN_PASSWORD`: Password for admin access
- `PORT`: Server port (default: 3000)

### 3. Database Setup
1. Go to [Supabase](https://supabase.com) and create a project
2. Go to SQL Editor
3. Run the SQL in `schema.sql`

### 4. Run Development Server
```bash
npm run dev
```

Server will start at `http://localhost:3000`

## API Endpoints

### Public Endpoints

#### Get All Questions
```
GET /api/questions
```

#### Get Question Statistics
```
GET /api/questions/stats/:questionId
```

#### Submit Response
```
POST /api/responses
Body: { "questionId": 1, "amount": 300000 }
```

#### Submit New Question
```
POST /api/submit-question
Body: { "text": "Your question here" }
```

### Admin Endpoints

#### Admin Login
```
POST /api/admin/login
Body: { "password": "your-admin-password" }
```

#### Get Pending Questions
```
GET /api/admin/pending-questions
Headers: { "password": "your-admin-password" }
```

#### Approve Question
```
POST /api/admin/approve/:questionId
Body: { "password": "your-admin-password" }
```

#### Reject Question
```
POST /api/admin/reject/:questionId
Body: { "password": "your-admin-password" }
```

## Rate Limiting

- Questions: 3 per 15 minutes
- Responses: 60 per minute
- General API: 100 requests per minute

## Project Structure

```
backend/
├── server.js              # Main Express server
├── routes/
│   ├── questions.js       # Question & response routes
│   ├── submit.js          # Submit question route
│   └── admin.js           # Admin routes
├── middleware/
│   ├── rateLimiter.js     # Rate limiting
│   └── auth.js            # Admin authentication
├── utils/
│   ├── db.js              # Supabase connection
│   └── stats.js           # Statistics calculation
├── package.json
├── schema.sql             # Database schema
└── .env.example           # Environment template
```

## Deployment

See main README for deployment instructions to Render.
