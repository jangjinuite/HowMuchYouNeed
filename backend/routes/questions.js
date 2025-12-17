const express = require('express');
const router = express.Router();
const supabase = require('../utils/db');
const { responseLimiter } = require('../middleware/rateLimiter');
const { updateStatsCache } = require('../utils/stats');

/**
 * GET /api/questions
 * Get all approved questions
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('id, text')
            .eq('status', 'approved')
            .order('id', { ascending: true });

        if (error) throw error;

        res.json({ questions: data || [] });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: '질문을 불러오는데 실패했습니다.' });
    }
});

/**
 * GET /api/stats/:questionId
 * Get statistics for a specific question
 */
router.get('/stats/:questionId', async (req, res) => {
    try {
        const { questionId } = req.params;

        // Get cached stats
        const { data, error } = await supabase
            .from('question_stats')
            .select('*')
            .eq('question_id', questionId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!data) {
            // No stats yet, return empty
            return res.json({
                questionId: parseInt(questionId),
                responseCount: 0,
                mean: 0,
                median: 0,
                q1: 0,
                q2: 0,
                q3: 0,
                min: 0,
                max: 0,
                histogram: [0, 0, 0, 0, 0, 0, 0]
            });
        }

        res.json({
            questionId: parseInt(questionId),
            responseCount: data.response_count,
            mean: data.mean,
            median: data.median,
            q1: data.q1,
            q2: data.q2,
            q3: data.q3,
            min: data.min_amount,
            max: data.max_amount,
            histogram: data.histogram
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: '통계를 불러오는데 실패했습니다.' });
    }
});

/**
 * POST /api/responses
 * Submit a response to a question
 */
router.post('/responses', responseLimiter, async (req, res) => {
    try {
        const { questionId, amount } = req.body;
        const userIp = req.ip || req.connection.remoteAddress;

        // Validate input
        if (!questionId || amount === undefined) {
            return res.status(400).json({ error: '질문 ID와 금액이 필요합니다.' });
        }

        if (amount < 0 || amount > 100000000) {
            return res.status(400).json({ error: '유효하지 않은 금액입니다.' });
        }

        // Check if user already responded to this question (optional)
        // You can remove this if you want to allow multiple responses
        const { data: existing } = await supabase
            .from('responses')
            .select('id')
            .eq('question_id', questionId)
            .eq('user_ip', userIp)
            .single();

        if (existing) {
            return res.status(400).json({ error: '이미 이 질문에 답변하셨습니다.' });
        }

        // Insert response
        const { error } = await supabase
            .from('responses')
            .insert({
                question_id: questionId,
                amount: amount,
                user_ip: userIp
            });

        if (error) throw error;

        // Update stats in background
        updateStatsCache(questionId).catch(console.error);

        res.json({
            success: true,
            message: '답변이 제출되었습니다.'
        });
    } catch (error) {
        console.error('Error submitting response:', error);
        res.status(500).json({ error: '답변 제출에 실패했습니다.' });
    }
});

module.exports = router;
