// Element References
const screens = document.querySelectorAll('.screen');
const startBtn = document.getElementById('start-btn');
const levelBtns = document.querySelectorAll('.level-btn:not(.locked)');
const goHomeBtns = document.querySelectorAll('.go-home-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const replayBtn = document.getElementById('replay-btn');
const shareBtn = document.getElementById('share-btn');

// Quiz Components
const qCounter = document.getElementById('q-counter');
const scoreDisplay = document.getElementById('current-score');
const qTypeTag = document.getElementById('q-type-tag');
const progressBarFill = document.getElementById('progress-bar-fill');
const progLabel = document.getElementById('prog-label');
const emojiSteps = document.querySelectorAll('#quiz-evo .evo-dot');
const qNumber = document.getElementById('q-number');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackBox = document.getElementById('feedback-box');
const visualFeedback = document.getElementById('visual-feedback');
const tipText = document.getElementById('tip-text');
const transQuote = document.getElementById('transition-quote');

// Result Components
const scoreFillArc = document.getElementById('score-fill-arc');
const finalScoreNum = document.getElementById('final-score');
const finalTotalNum = document.getElementById('total-questions');
const finalPct = document.getElementById('final-pct');
const finalMsg = document.getElementById('final-msg');
const finalEvo = document.getElementById('final-evo');
const wrongAnswersSection = document.getElementById('wrong-answers-section');
const reviewCount = document.getElementById('review-count');
const wrongAnswersList = document.getElementById('wrong-answers-list');

// State
let currentSectionData = [];
let currentQuestionIndex = 0;
let score = 0;
let totalQuestions = 0;
let userAnswers = [];

const quotes = [
    "Great ideas mean nothing without execution!",
    "Every problem is a startup opportunity waiting to be solved.",
    "Data beats opinions. Let's see what you know!",
    "Scale your knowledge before you scale your business."
];

// Screen Control
function showScreen(id) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

startBtn.addEventListener('click', () => showScreen('menu-screen'));
goHomeBtns.forEach(btn => btn.addEventListener('click', () => {
    resetGame();
    showScreen('start-screen');
}));

levelBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const sectionId = e.currentTarget.dataset.section;
        startLevel(sectionId);
    });
});

nextBtn.addEventListener('click', nextQuestion);
prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateQuizUI();
    }
});
replayBtn.addEventListener('click', () => showScreen('menu-screen'));
shareBtn.addEventListener('click', () => {
    const pct = Math.round((score/totalQuestions)*100);
    const txt = `I scored ${score}/${totalQuestions} (${pct}%) on the IMB Quiz! 🚀💼\n#StartupGame #IMBQuiz`;
    if(navigator.share){ navigator.share({title:'IMB Quiz',text:txt}); }
    else { alert('Result ready to share (copying not supported in alert):\n\n' + txt); }
});

function startLevel(sectionId) {
    if(!quizData[sectionId]) return alert("Data not found!");
    currentSectionData = quizData[sectionId];
    totalQuestions = currentSectionData.length;
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    
    transQuote.innerText = quotes[Math.floor(Math.random() * quotes.length)];
    showScreen('transition-screen');
    
    setTimeout(() => {
        updateQuizUI();
        showScreen('quiz-screen');
    }, 2000);
}

function updateQuizUI() {
    feedbackBox.className = 'feedback';
    nextBtn.style.display = 'none';
    
    if (currentQuestionIndex > 0) {
        prevBtn.style.display = 'inline-flex';
    } else {
        prevBtn.style.display = 'none';
    }

    const currentQ = currentSectionData[currentQuestionIndex];
    if(!currentQ) return showResult();

    qCounter.innerText = `Q ${currentQuestionIndex + 1} / ${totalQuestions}`;
    scoreDisplay.innerText = score;
    qNumber.innerText = `Question ${currentQuestionIndex + 1}`;
    questionText.innerText = currentQ.question;
    
    qTypeTag.innerText = currentQ.type === 'mcq' ? 'MCQ' : 'True/False';
    qTypeTag.className = currentQ.type === 'mcq' ? 'q-chip chip-mcq' : 'q-chip chip-tf';

    // Progress
    const pct = Math.round(((currentQuestionIndex) / totalQuestions) * 100);
    progressBarFill.style.width = `${pct}%`;
    progLabel.innerText = `${pct}% complete`;

    const thr = [0,25,50,75,100];
    emojiSteps.forEach((s,i)=>{
        s.classList.remove('active');
        if(pct >= thr[i]) s.classList.add('active');
    });

    // Options mapping depending on state
    optionsContainer.innerHTML = '';
    
    if(currentQ.type === 'mcq') {
        currentQ.options.forEach((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.innerHTML = `<span class="opt-letter">${letter}</span><span>${opt}</span>`;
            btn.onclick = () => handleAnswer(idx, btn, currentQ);
            optionsContainer.appendChild(btn);
        });
    } else {
        [{label:'True', icon:'✓'}, {label:'False', icon:'✗'}].forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.innerHTML = `<span class="opt-letter">${opt.icon}</span><span>${opt.label}</span>`;
            btn.onclick = () => handleAnswer(idx===0, btn, currentQ);
            optionsContainer.appendChild(btn);
        });
    }

    if (userAnswers[currentQuestionIndex]) {
        restoreAnswerState(currentQ, userAnswers[currentQuestionIndex]);
    }
}

function handleAnswer(ansValue, btn, currentQ) {
    const allBtns = optionsContainer.querySelectorAll('.opt-btn');
    allBtns.forEach(b => b.disabled = true);
    
    const isCorrect = ansValue === currentQ.answer;
    let userAnsLabel = currentQ.type === 'mcq' ? currentQ.options[ansValue] : (ansValue ? 'True' : 'False');
    let correctLabel = currentQ.type === 'mcq' ? currentQ.options[currentQ.answer] : (currentQ.answer ? 'True' : 'False');

    if(isCorrect) score++;

    // Track array replacement logic (trim ahead if they revisit)
    userAnswers[currentQuestionIndex] = {
        questionObj: currentQ,
        isCorrect,
        userAnswerRaw: ansValue,
        userAnswer: userAnsLabel,
        correctAnswer: correctLabel
    };

    scoreDisplay.innerText = score;
    applyVisualFeedback(btn, allBtns, isCorrect, currentQ, ansValue);
}

function restoreAnswerState(currentQ, savedObj) {
    const allBtns = optionsContainer.querySelectorAll('.opt-btn');
    allBtns.forEach(b => b.disabled = true);
    
    let btnIndex = currentQ.type === 'mcq' ? savedObj.userAnswerRaw : (savedObj.userAnswerRaw ? 0 : 1);
    applyVisualFeedback(allBtns[btnIndex], allBtns, savedObj.isCorrect, currentQ, savedObj.userAnswerRaw);
}

function applyVisualFeedback(selectedBtn, allBtns, isCorrect, currentQ, ansValue) {
    selectedBtn.classList.add(isCorrect ? 'correct' : 'wrong');
    
    if (!isCorrect) {
        let corrIdx = currentQ.type === 'mcq' ? currentQ.answer : (currentQ.answer ? 0 : 1);
        allBtns[corrIdx].classList.add('correct');
    }
    
    allBtns.forEach(b => {
        if (!b.classList.contains('correct') && !b.classList.contains('wrong')) {
            b.classList.add('dimmed');
        }
    });

    feedbackBox.className = 'feedback show ' + (isCorrect ? 'correct' : 'wrong');
    visualFeedback.innerText = isCorrect ? '✅' : '❌';
    tipText.innerHTML = isCorrect ? 'Spot on! Absolute strategic mastery.' : `Pivot needed. Correct strategy: <strong>${userAnswers[currentQuestionIndex]?.correctAnswer || (currentQ.type==='mcq'?currentQ.options[currentQ.answer]:(currentQ.answer?'True':'False'))}</strong>`;
    
    nextBtn.innerText = currentQuestionIndex >= totalQuestions - 1 ? 'Finish ✓' : 'Next Strategy →';
    nextBtn.style.display = 'inline-flex';
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= totalQuestions) {
        showResult();
    } else {
        updateQuizUI();
    }
}

function showResult() {
    showScreen('result-screen');
    const pct = Math.round((score / totalQuestions) * 100);
    
    finalScoreNum.innerText = score;
    finalTotalNum.innerText = totalQuestions;
    finalPct.innerText = pct + '%';

    // Animate Arc
    const circumference = 251.2;
    setTimeout(() => {
        scoreFillArc.style.strokeDashoffset = circumference - (circumference * pct / 100);
    }, 300);

    const msgs = [
        '⚙️ Every entrepreneur starts somewhere. Review and try again.',
        '🔧 Good start! Review the material and aim higher next time.',
        '🚀 Great effort! You\'re almost there — keep studying to reach the top!',
        '🌍 Outstanding! You\'re ready to conquer global markets!'
    ];
    finalMsg.innerText = msgs[pct>=80?3:pct>=60?2:pct>=40?1:0];

    // Wrong Answers
    const wrong = userAnswers.filter(a => !a.isCorrect);
    wrongAnswersList.innerHTML = '';
    
    if (wrong.length > 0) {
        wrongAnswersSection.style.display = 'block';
        reviewCount.innerText = `${wrong.length} wrong`;
        
        wrong.forEach(w => {
            const div = document.createElement('div');
            div.className = 'review-item';
            div.innerHTML = `
                <div class="review-q">${w.questionObj.question}</div>
                <div class="review-answers">
                  <div class="review-answer your">
                    <span class="review-answer-label">Your answer</span>
                    <span>✗ ${w.userAnswer}</span>
                  </div>
                  <div class="review-answer correct">
                    <span class="review-answer-label">Correct</span>
                    <span>✓ ${w.correctAnswer}</span>
                  </div>
                </div>`;
            wrongAnswersList.appendChild(div);
        });
    } else {
        wrongAnswersSection.style.display = 'none';
    }

    spawnConfetti();
}

function spawnConfetti() {
    const wrap = document.getElementById('confetti-container');
    wrap.innerHTML = '';
    const colors = ['#3b82f6','#f97316','#22c55e','#a78bfa','#facc15','#06b6d4','#f43f5e'];
    for(let i=0; i<60; i++){
        const el = document.createElement('div');
        el.className = 'cf';
        const size = 6 + Math.random() * 8;
        el.style.cssText = `left:${Math.random()*100}%;top:-12px;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${1.4+Math.random()*2.4}s;animation-delay:${Math.random()*1.5}s;border-radius:${Math.random()>0.5?'50%':'2px'}`;
        wrap.appendChild(el);
    }
}

function resetGame() {
    score = 0;
    currentQuestionIndex = 0;
    userAnswers = [];
    scoreFillArc.style.strokeDashoffset = 251.2;
}
