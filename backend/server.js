require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());  // Allow all origins for now
app.use(express.json());
app.use(apiLimiter);

// Routes
const questionsRouter = require('./routes/questions');
const submitRouter = require('./routes/submit');
const adminRouter = require('./routes/admin');

app.use('/api/questions', questionsRouter);
app.use('/api/responses', questionsRouter); // For POST /api/responses
app.use('/api/submit-question', submitRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'How Much You Need API',
        version: '1.0.0',
        endpoints: {
            questions: '/api/questions',
            stats: '/api/questions/stats/:questionId',
            submit_response: '/api/responses',
            submit_question: '/api/submit-question',
            admin: '/api/admin'
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API available at http://localhost:${PORT}`);
});

module.exports = app;
