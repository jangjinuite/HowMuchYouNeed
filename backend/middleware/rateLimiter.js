const rateLimit = require('express-rate-limit');

// Rate limiter for question submissions
const questionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 questions per 15 minutes
    message: { error: '너무 많은 질문을 제출했습니다. 잠시 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for response submissions
const responseLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 responses per minute
    message: { error: '너무 많은 답변을 제출했습니다. 잠시 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    questionLimiter,
    responseLimiter,
    apiLimiter
};
