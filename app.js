// API Configuration
const API_URL = 'https://howmuchyouneed-api.onrender.com'; // Production backend

// App State
let currentTaskIndex = 0;
let userAnswers = [];
let currentMode = 'input'; // 'input' or 'stats'
let useLogScale = false; // for histogram
let questions = []; // Will be loaded from API

// Touch handling
let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let touchCurrentY = 0;
let isDragging = false;

// DOM Elements
const cardStack = document.getElementById('cardStack');
const currentTaskEl = document.getElementById('currentTask');
const totalTasksEl = document.getElementById('totalTasks');

// API Functions
async function fetchQuestions() {
    try {
        const response = await fetch(`${API_URL}/api/questions`);
        const data = await response.json();
        return data.questions || [];
    } catch (error) {
        console.error('Error fetching questions:', error);
        alert('질문을 불러오는데 실패했습니다. 서버 연결을 확인해주세요.');
        return [];
    }
}

async function fetchStats(questionId) {
    try {
        const response = await fetch(`${API_URL}/api/questions/stats/${questionId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
}

async function submitResponse(questionId, amount) {
    try {
        const response = await fetch(`${API_URL}/api/questions/responses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ questionId, amount })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error submitting response:', error);
        return false;
    }
}

async function submitQuestion(text) {
    try {
        const response = await fetch(`${API_URL}/api/submit-question`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error submitting question:', error);
        return { error: '질문 제출에 실패했습니다.' };
    }
}

// Initialize App
async function init() {
    // Load questions from API
    questions = await fetchQuestions();

    if (questions.length === 0) {
        alert('질문을 불러올 수 없습니다. 서버가 실행 중인지 확인해주세요.');
        return;
    }

    // Shuffle questions for random order
    questions = shuffleArray(questions);

    totalTasksEl.textContent = questions.length;
    renderCard(currentTaskIndex, 'input');
    prepareNextCard();
}

// Shuffle array helper
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Render Card
function renderCard(taskIndex, mode, animateSlideUp = false) {
    if (taskIndex >= questions.length) {
        showCompletionScreen();
        return;
    }

    const task = questions[taskIndex];
    const card = document.createElement('div');
    card.className = 'card current';
    card.dataset.taskIndex = taskIndex;
    card.dataset.mode = mode;

    if (mode === 'input') {
        card.innerHTML = createInputView(task);
        // Add event listeners for input mode immediately
        addCardEventListeners(card);
    } else {
        // Show loading state first
        card.innerHTML = '<div class="loading" style="text-align: center; padding: 2rem; color: var(--text-secondary);">📊 최신 통계를 불러오는 중...</div>';

        // Load FRESH stats from API (will include just-submitted answer)
        const userAnswer = userAnswers.find(a => a.taskId === task.id);

        // Wait a bit for backend to process the new response
        setTimeout(() => {
            fetchStats(task.id).then(stats => {
                if (stats) {
                    // Store stats in card dataset for log scale toggle
                    card.dataset.stats = JSON.stringify(stats);
                    card.innerHTML = createStatsView(task, stats, userAnswer ? userAnswer.amount : 0);
                    // Add event listeners AFTER stats are loaded and rendered
                    addCardEventListeners(card);
                }
            }).catch(error => {
                console.error('Failed to load stats:', error);
                card.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">통계를 불러오는데 실패했습니다.</div>';
            });
        }, 500); // 500ms delay to ensure backend processed the submission
    }

    // Apply slide-up animation if requested
    if (animateSlideUp) {
        card.style.transform = 'translateY(100%)';
        card.style.opacity = '0';
    }

    cardStack.innerHTML = '';
    cardStack.appendChild(card);

    // Trigger slide-up animation
    if (animateSlideUp) {
        setTimeout(() => {
            card.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out';
            card.style.transform = 'translateY(0)';
            card.style.opacity = '1';
        }, 10);
    }

    // Update progress
    currentTaskEl.textContent = taskIndex + 1;
}

// Prepare next card (visual effect)
function prepareNextCard() {
    if (currentTaskIndex + 1 >= questions.length) return;

    const nextTask = questions[currentTaskIndex + 1];
    const nextCard = document.createElement('div');
    nextCard.className = 'card next';
    nextCard.innerHTML = createInputView(nextTask);

    if (cardStack.children.length > 1) {
        cardStack.removeChild(cardStack.lastChild);
    }
    cardStack.appendChild(nextCard);
}

// Create Input View HTML
function createInputView(task) {
    return `
        <div class="card-content">
            <div class="task-label">질문 #${task.id}</div>
            <div class="task-description">${task.text}</div>
        </div>
        <div class="input-section">
            <label class="input-label">최소 얼마를 받으면 하시겠어요?</label>
            <div class="amount-input-wrapper">
                <input 
                    type="number" 
                    class="amount-input" 
                    placeholder="0" 
                    id="amountInput${task.id}"
                    min="0"
                    step="10000"
                >
                <span class="currency-label">원</span>
            </div>
            <div class="quick-buttons">
                <button class="quick-btn" data-multiplier="10000">×만</button>
                <button class="quick-btn" data-multiplier="100000">×10만</button>
                <button class="quick-btn" data-multiplier="1000000">×100만</button>
            </div>
            <div class="submit-hint">금액 입력 후 왼쪽으로 스와이프</div>
        </div>
    `;
}

// Create Stats View HTML
function createStatsView(task, stats, userAnswer) {
    const percentile = calculatePercentile(userAnswer, stats);

    return `
        <div class="stats-content">
            <div class="stats-header">
                <div class="stats-title">${task.text}</div>
                <div class="your-answer">
                    <span class="your-answer-label">내 답변</span>
                    <span class="your-answer-value">${formatCurrency(userAnswer)}</span>
                </div>
            </div>

            <div class="stats-summary">
                <div class="stat-box">
                    <div class="stat-label">평균</div>
                    <div class="stat-value">${formatCurrency(stats.mean)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">중앙값</div>
                    <div class="stat-value">${formatCurrency(stats.median)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Q1 (25%)</div>
                    <div class="stat-value">${formatCurrency(stats.q1)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Q3 (75%)</div>
                    <div class="stat-value">${formatCurrency(stats.q3)}</div>
                </div>
            </div>

            ${createHistogram(stats, userAnswer, useLogScale)}

            <div class="comparison-message">
                <div class="percentile">${percentile}번째 백분위</div>
                <div class="message-text">${getComparisonMessage(percentile)}</div>
            </div>
        </div>
    `;
}

// Create Histogram
function createHistogram(stats, userAnswer, isLogScale = false) {
    const histogram = stats.histogram || [0, 0, 0, 0, 0, 0, 0];
    const maxHeight = Math.max(...histogram, 1);
    const min = stats.min || stats.min_amount || 0;
    const max = stats.max || stats.max_amount || 1000000;
    const rangeSize = (max - min) / histogram.length;
    const userBarIndex = Math.min(
        Math.floor((userAnswer - min) / rangeSize),
        histogram.length - 1
    );

    const bars = histogram.map((value, index) => {
        const height = isLogScale
            ? Math.log10(value + 1) / Math.log10(maxHeight + 1) * 100
            : value / maxHeight * 100;

        const isUserBar = index === userBarIndex;
        const barClass = isUserBar ? 'user-bar' : '';

        return `
            <div class="histogram-bar ${barClass}">
                <div class="bar-fill" style="height: ${height}%">
                    ${isUserBar ? '<div class="user-marker">👤</div>' : ''}
                </div>
                <div class="bar-label">${formatHistogramLabel(min + index * rangeSize, min + (index + 1) * rangeSize)}</div>
            </div>
        `;
    }).join('');

    const toggleText = isLogScale ? '선형 스케일' : '로그 스케일';

    return `
        <div class="histogram">
            <div class="histogram-header">
                <div class="histogram-title">답변 분포</div>
                <button class="log-scale-toggle" id="logScaleToggle">${toggleText}</button>
            </div>
            <div class="histogram-bars">
                ${bars}
            </div>
            </div>
        </div>
    `;
}

// Add Event Listeners to Card
function addCardEventListeners(card) {
    // Touch events
    card.addEventListener('touchstart', handleTouchStart, { passive: false });
    card.addEventListener('touchmove', handleTouchMove, { passive: false });
    card.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Mouse events (for PC)
    card.addEventListener('mousedown', handleMouseDown);
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseup', handleMouseEnd);
    card.addEventListener('mouseleave', handleMouseEnd);

    // Enter key on input
    const input = card.querySelector('.amount-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLeftSwipe(card);
            }
        });

        // Quick amount buttons
        const quickBtns = card.querySelectorAll('.quick-btn');
        quickBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const multiplier = parseInt(btn.dataset.multiplier);
                const currentValue = parseInt(input.value) || 1;
                input.value = currentValue * multiplier;
                input.focus();
            });
        });
    }

    // Log scale toggle button
    const logScaleBtn = card.querySelector('#logScaleToggle');
    if (logScaleBtn) {
        logScaleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            useLogScale = !useLogScale;

            // Update only the histogram without re-fetching stats
            const histogramContainer = card.querySelector('.histogram');
            if (histogramContainer && card.dataset.stats) {
                const task = questions[currentTaskIndex];
                const stats = JSON.parse(card.dataset.stats);
                const userAnswer = userAnswers.find(a => a.taskId === task.id);
                const userAmount = userAnswer ? userAnswer.amount : 0;

                histogramContainer.outerHTML = createHistogram(stats, userAmount, useLogScale);
                // Re-attach event listener to the new toggle button
                const newLogScaleBtn = card.querySelector('#logScaleToggle');
                if (newLogScaleBtn) {
                    newLogScaleBtn.addEventListener('click', arguments.callee);
                }
            }
        });
    }
}

// Touch Handlers
function handleTouchStart(e) {
    // Ignore if touching input elements or their containers
    const target = e.target;
    if (target.matches('input, .amount-input, .amount-input-wrapper, .input-section, .currency-label, .quick-btn, .quick-buttons, .log-scale-toggle, .add-question-btn, .add-icon')) {
        return;
    }

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = true;
    this.classList.add('grabbing');
}

function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();

    touchCurrentX = e.touches[0].clientX;
    touchCurrentY = e.touches[0].clientY;

    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;

    // Apply transform
    this.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${deltaX * 0.05}deg)`;

    // Visual feedback
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -30) {
        this.classList.add('swiping-up');
        this.classList.remove('swiping-left');
    } else if (deltaX < -30) {
        this.classList.add('swiping-left');
        this.classList.remove('swiping-up');
    } else {
        this.classList.remove('swiping-up', 'swiping-left');
    }
}

function handleTouchEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    this.classList.remove('grabbing');

    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;

    const swipeThreshold = 100;

    // Determine swipe direction
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -swipeThreshold) {
        // Up swipe - skip
        handleUpSwipe(this);
    } else if (deltaX < -swipeThreshold) {
        // Left swipe - show stats or next
        handleLeftSwipe(this);
    } else {
        // Reset position
        this.style.transform = '';
        this.classList.remove('swiping-up', 'swiping-left');
    }
}

// Mouse Handlers (for PC)
function handleMouseDown(e) {
    // Ignore if clicking input elements or their containers
    const target = e.target;
    if (target.matches('input, .amount-input, .amount-input-wrapper, .input-section, .currency-label, .quick-btn, .quick-buttons, .log-scale-toggle, .add-question-btn, .add-icon')) {
        return;
    }

    touchStartX = e.clientX;
    touchStartY = e.clientY;
    isDragging = true;
    this.classList.add('grabbing');
}

function handleMouseMove(e) {
    if (!isDragging) return;

    touchCurrentX = e.clientX;
    touchCurrentY = e.clientY;

    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;

    this.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${deltaX * 0.05}deg)`;

    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -30) {
        this.classList.add('swiping-up');
        this.classList.remove('swiping-left');
    } else if (deltaX < -30) {
        this.classList.add('swiping-left');
        this.classList.remove('swiping-up');
    } else {
        this.classList.remove('swiping-up', 'swiping-left');
    }
}

function handleMouseEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    this.classList.remove('grabbing');

    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;

    const swipeThreshold = 100;

    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -swipeThreshold) {
        handleUpSwipe(this);
    } else if (deltaX < -swipeThreshold) {
        handleLeftSwipe(this);
    } else {
        this.style.transform = '';
        this.classList.remove('swiping-up', 'swiping-left');
    }
}

// Swipe Actions
function handleUpSwipe(card) {
    // Skip to next task
    animateCardOut(card, 'up', () => {
        currentTaskIndex++;
        currentMode = 'input';
        renderCard(currentTaskIndex, 'input');
        prepareNextCard();
    });
}

async function handleLeftSwipe(card) {
    const mode = card.dataset.mode;

    if (mode === 'input') {
        // Save answer and show stats
        const input = card.querySelector('.amount-input');
        const amount = parseInt(input?.value || 0);

        if (amount <= 0) {
            // Show error feedback
            input?.classList.add('error');
            card.style.transform = '';
            card.classList.remove('swiping-left');
            setTimeout(() => input?.classList.remove('error'), 300);
            return;
        }

        const taskIndex = parseInt(card.dataset.taskIndex);
        const task = questions[taskIndex];

        // Show loading state
        card.innerHTML = '<div style="text-align: center; padding: 3rem;"><div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div><div style="color: var(--text-secondary); font-size: 1.1rem;">답변 제출 중...</div></div>';

        // Submit to backend API
        const success = await submitResponse(task.id, amount);

        if (!success) {
            alert('답변 제출에 실패했습니다. 다시 시도해주세요.');
            renderCard(currentTaskIndex, 'input'); // Restore input view
            return;
        }

        userAnswers.push({
            taskId: task.id,
            amount: amount
        });

        // Update loading message
        card.innerHTML = '<div style="text-align: center; padding: 3rem;"><div style="font-size: 2rem; margin-bottom: 1rem;">📊</div><div style="color: var(--text-secondary); font-size: 1.1rem;">결과를 불러오는 중...</div></div>';

        // Wait a moment then show stats
        setTimeout(() => {
            currentMode = 'stats';
            renderCard(currentTaskIndex, 'stats', true);
        }, 300);
    } else {
        // Move to next task
        animateCardOut(card, 'left', () => {
            currentTaskIndex++;
            currentMode = 'input';
            renderCard(currentTaskIndex, 'input');
            prepareNextCard();
        });
    }
}

// Animate Card Out
function animateCardOut(card, direction, callback) {
    const distance = window.innerWidth;
    let transform;

    if (direction === 'up') {
        transform = `translateY(-${window.innerHeight}px) rotate(-10deg)`;
    } else {
        transform = `translateX(-${distance}px) rotate(-30deg)`;
    }

    card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    card.style.transform = transform;
    card.style.opacity = '0';

    setTimeout(() => {
        callback();
    }, 300);
}

// Completion Screen
function showCompletionScreen() {
    cardStack.innerHTML = `
        <div class="card current">
            <div class="card-content" style="text-align: center; justify-content: center;">
                <h2 style="font-size: 2rem; margin-bottom: 1rem;">🎉</h2>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">모든 질문 완료!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                    총 ${questions.length}개의 질문에 답변하셨습니다.
                </p>
                <button onclick="location.reload()" style="
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: var(--transition);
                ">다시 시작</button>
            </div>
        </div>
    `;
}

// Utility Functions
function formatCurrency(amount) {
    if (!amount || amount === null || amount === undefined) return '0원';

    const numAmount = Number(amount);
    if (isNaN(numAmount)) return '0원';

    if (numAmount >= 1000000) {
        return `${(numAmount / 10000).toFixed(0)}만원`;
    } else if (numAmount >= 10000) {
        return `${(numAmount / 10000).toFixed(0)}만원`;
    } else {
        return `${numAmount.toLocaleString()}원`;
    }
}

function formatHistogramLabel(min, max) {
    const formatShort = (amount) => {
        if (amount >= 100000000) return `${(amount / 100000000).toFixed(0)}억`;
        if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(0)}천`;
        return `${amount}`;
    };

    return `${formatShort(min)}~${formatShort(max)}`;
}

function calculatePercentile(userAnswer, stats) {
    if (userAnswer <= stats.q1) return Math.round((userAnswer / stats.q1) * 25);
    if (userAnswer <= stats.q2) return 25 + Math.round(((userAnswer - stats.q1) / (stats.q2 - stats.q1)) * 25);
    if (userAnswer <= stats.q3) return 50 + Math.round(((userAnswer - stats.q2) / (stats.q3 - stats.q2)) * 25);
    return Math.min(75 + Math.round(((userAnswer - stats.q3) / (stats.max - stats.q3)) * 25), 99);
}

function getComparisonMessage(percentile) {
    if (percentile < 25) return "대부분의 사람들보다 저렴하게 해줄 수 있군요! 💪";
    if (percentile < 50) return "평균보다 조금 낮은 금액이네요 😊";
    if (percentile < 75) return "평균보다 조금 높은 금액이에요 🤔";
    return "대부분의 사람들보다 비싸게 받고 싶으시군요! 💰";
}

// Add error style for input
const style = document.createElement('style');
style.textContent = `
    .amount-input.error {
        border-color: #ef4444 !important;
        animation: shake 0.3s;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Add Question Button Handler
document.addEventListener('DOMContentLoaded', () => {
    // Question suggestion modal
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const modal = document.getElementById('questionModal');
    const modalContent = document.getElementById('modalContent');
    const questionInput = document.getElementById('questionInput');
    const modalCancel = document.getElementById('modalCancel');
    const modalSubmit = document.getElementById('modalSubmit');

    function openModal() {
        modal.classList.add('active');
        questionInput.value = '';
        setTimeout(() => questionInput.focus(), 300);
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    function showSuccess(questionText) {
        modalContent.innerHTML = `
            <div class="modal-success">
                <div class="modal-success-icon">✨</div>
                <div class="modal-success-message">질문이 제출되었습니다!</div>
                <div class="modal-success-sub">"${questionText}"</div>
                <div class="modal-success-sub" style="margin-top: 1rem;">관리자 승인 후 게임에 추가됩니다.</div>
            </div>
        `;
        setTimeout(() => closeModal(), 2500);
    }

    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', openModal);
    }

    if (modalCancel) {
        modalCancel.addEventListener('click', closeModal);
    }

    if (modalSubmit) {
        modalSubmit.addEventListener('click', async () => {
            const text = questionInput.value.trim();
            if (!text) {
                questionInput.focus();
                return;
            }

            modalSubmit.disabled = true;
            modalSubmit.textContent = '제출 중...';

            const result = await submitQuestion(text);

            if (result.error) {
                alert(result.error);
                modalSubmit.disabled = false;
                modalSubmit.textContent = '제출';
            } else {
                showSuccess(text);
                modalSubmit.disabled = false;
                modalSubmit.textContent = '제출';
            }
        });
    }

    // Close modal on overlay click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
});

// Start the app
init();
