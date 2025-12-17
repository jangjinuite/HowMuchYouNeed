const supabase = require('./db');

/**
 * Calculate statistics for a question
 */
async function calculateStats(questionId) {
    try {
        // Get all responses for this question
        const { data: responses, error } = await supabase
            .from('responses')
            .select('amount')
            .eq('question_id', questionId);

        if (error) throw error;
        if (!responses || responses.length === 0) {
            return null;
        }

        const amounts = responses.map(r => r.amount).sort((a, b) => a - b);
        const count = amounts.length;

        // Calculate basic stats
        const sum = amounts.reduce((a, b) => a + b, 0);
        const mean = sum / count;
        const min = amounts[0];
        const max = amounts[count - 1];

        // Calculate quartiles
        const q1 = amounts[Math.floor(count * 0.25)];
        const q2 = amounts[Math.floor(count * 0.5)]; // median
        const q3 = amounts[Math.floor(count * 0.75)];

        // Calculate histogram (7 buckets)
        const bucketCount = 7;
        const bucketSize = (max - min) / bucketCount;
        const histogram = new Array(bucketCount).fill(0);

        amounts.forEach(amount => {
            let bucketIndex = Math.floor((amount - min) / bucketSize);
            if (bucketIndex >= bucketCount) bucketIndex = bucketCount - 1;
            histogram[bucketIndex]++;
        });

        // Convert to percentages
        const histogramPercent = histogram.map(count => Math.round((count / amounts.length) * 100));

        return {
            response_count: count,
            mean: Math.round(mean),
            median: Math.round(q2),
            q1: Math.round(q1),
            q2: Math.round(q2),
            q3: Math.round(q3),
            min_amount: min,
            max_amount: max,
            histogram: histogramPercent
        };
    } catch (error) {
        console.error('Error calculating stats:', error);
        return null;
    }
}

/**
 * Update cached stats for a question
 */
async function updateStatsCache(questionId) {
    const stats = await calculateStats(questionId);

    if (!stats) return;

    const { error } = await supabase
        .from('question_stats')
        .upsert({
            question_id: questionId,
            ...stats,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error updating stats cache:', error);
    }
}

module.exports = {
    calculateStats,
    updateStatsCache
};
