const express = require('express');
const router = express.Router();
const supabase = require('../utils/db');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * POST /api/admin/login
 * Admin login (password check)
 */
router.post('/login', async (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (password === adminPassword) {
        res.json({ success: true, message: '로그인 성공' });
    } else {
        res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }
});

/**
 * GET /api/admin/pending-questions
 * Get all pending questions
 */
router.get('/pending-questions', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('id, text, submitted_at, created_by_ip')
            .eq('status', 'pending')
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        res.json({ questions: data || [] });
    } catch (error) {
        console.error('Error fetching pending questions:', error);
        res.status(500).json({ error: '질문을 불러오는데 실패했습니다.' });
    }
});

/**
 * POST /api/admin/approve/:questionId
 * Approve a question
 */
router.post('/approve/:questionId', authenticateAdmin, async (req, res) => {
    try {
        const { questionId } = req.params;

        const { error } = await supabase
            .from('questions')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', questionId);

        if (error) throw error;

        res.json({ success: true, message: '질문이 승인되었습니다.' });
    } catch (error) {
        console.error('Error approving question:', error);
        res.status(500).json({ error: '질문 승인에 실패했습니다.' });
    }
});

/**
 * POST /api/admin/reject/:questionId
 * Reject a question
 */
router.post('/reject/:questionId', authenticateAdmin, async (req, res) => {
    try {
        const { questionId } = req.params;

        const { error } = await supabase
            .from('questions')
            .update({ status: 'rejected' })
            .eq('id', questionId);

        if (error) throw error;

        res.json({ success: true, message: '질문이 거부되었습니다.' });
    } catch (error) {
        console.error('Error rejecting question:', error);
        res.status(500).json({ error: '질문 거부에 실패했습니다.' });
    }
});

module.exports = router;
