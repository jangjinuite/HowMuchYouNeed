const express = require('express');
const router = express.Router();
const supabase = require('../utils/db');
const { questionLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/submit-question
 * Submit a new question for admin approval
 */
router.post('/', questionLimiter, async (req, res) => {
    try {
        const { text } = req.body;
        const userIp = req.ip || req.connection.remoteAddress;

        // Validate input
        if (!text || text.trim().length < 5) {
            return res.status(400).json({ error: '질문은 최소 5자 이상이어야 합니다.' });
        }

        if (text.length > 200) {
            return res.status(400).json({ error: '질문은 200자를 초과할 수 없습니다.' });
        }

        // Insert question with pending status
        const { error } = await supabase
            .from('questions')
            .insert({
                text: text.trim(),
                status: 'pending',
                created_by_ip: userIp
            });

        if (error) throw error;

        res.json({
            success: true,
            message: '질문이 제출되었습니다. 검수 후 추가됩니다.'
        });
    } catch (error) {
        console.error('Error submitting question:', error);
        res.status(500).json({ error: '질문 제출에 실패했습니다.' });
    }
});

module.exports = router;
