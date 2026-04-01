// Elements
const startScreen = document.getElementById('start-screen');
const menuScreen = document.getElementById('menu-screen');
const transitionScreen = document.getElementById('transition-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

// Buttons
const startBtn = document.getElementById('start-btn');
const levelBtns = document.querySelectorAll('.level-btn:not(.locked)');
const goHomeBtns = document.querySelectorAll('.go-home-btn');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const replayBtn = document.getElementById('replay-btn');
const shareBtn = document.getElementById('share-btn');

// Quiz UI Elements
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const visualFeedback = document.getElementById('visual-feedback');
const tipContainer = document.getElementById('tip-container');
const tipText = document.getElementById('tip-text');
const scoreDisplay = document.getElementById('current-score');
const progressBarFill = document.getElementById('progress-bar-fill');
const emojiSteps = document.querySelectorAll('.emoji-step');
const transitionQuote = document.getElementById('transition-quote');
const finalScore = document.getElementById('final-score');
const totalQuestionsSpan = document.getElementById('total-questions');
const confettiContainer = document.getElementById('confetti-container');
const wrongAnswersSection = document.getElementById('wrong-answers-section');
const wrongAnswersList = document.getElementById('wrong-answers-list');

// Game State
let currentSectionData = [];
let currentQuestionIndex = 0;
let score = 0;
let totalQuestions = 0;
let userAnswers = [];

// Quotes
const quotes = [
    "Great ideas mean nothing without execution!",
    "Every problem is a startup opportunity waiting to be solved.",
    "Data beats opinions. Let's see what you know!",
    "Scale your knowledge before you scale your business."
];

// Screen Navigation
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// Event Listeners
startBtn.addEventListener('click', () => showScreen(menuScreen));
goHomeBtns.forEach(btn => btn.addEventListener('click', () => {
    resetGame();
    showScreen(startScreen);
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
replayBtn.addEventListener('click', () => showScreen(menuScreen));
shareBtn.addEventListener('click', () => {
    alert(`I scored ${score}/${totalQuestions} as a Future Entrepreneur! 🏅🚀📊 \n#StartupGame #IMBQuiz`);
});

// Logic Functions
function startLevel(sectionId) {
    // Load Data
    currentSectionData = quizData[sectionId];
    totalQuestions = currentSectionData.length;
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    
    // Transition
    transitionQuote.innerText = quotes[Math.floor(Math.random() * quotes.length)];
    showScreen(transitionScreen);
    
    setTimeout(() => {
        updateQuizUI();
        showScreen(quizScreen);
    }, 2500);
}

function updateQuizUI() {
    tipContainer.classList.add('hidden');
    visualFeedback.classList.add('hidden');
    optionsContainer.innerHTML = '';
    
    if (currentQuestionIndex > 0) {
        prevBtn.classList.remove('hidden');
    } else {
        prevBtn.classList.add('hidden');
    }
    
    // Progress Bar (Percentage)
    const progressPercent = ((currentQuestionIndex) / totalQuestions) * 100;
    progressBarFill.style.width = `${progressPercent}%`;
    
    // Emoji Progress (5 stages)
    const activeStage = Math.floor((currentQuestionIndex / totalQuestions) * 4);
    emojiSteps.forEach((emoji, idx) => {
        if (idx <= activeStage) {
            emoji.classList.add('active');
        } else {
            emoji.classList.remove('active');
        }
    });

    scoreDisplay.innerText = score;
    
    if (currentQuestionIndex >= totalQuestions) {
        showResult();
        return;
    }

    const currentQ = currentSectionData[currentQuestionIndex];
    questionText.innerText = currentQ.question;

    if (currentQ.type === 'mcq') {
        currentQ.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.addEventListener('click', () => checkAnswer(btn, idx, currentQ));
            optionsContainer.appendChild(btn);
        });
    } else if (currentQ.type === 'tf') {
        const trueBtn = document.createElement('button');
        trueBtn.className = 'option-btn';
        trueBtn.innerText = 'True';
        trueBtn.addEventListener('click', () => checkAnswer(trueBtn, true, currentQ));
        
        const falseBtn = document.createElement('button');
        falseBtn.className = 'option-btn';
        falseBtn.innerText = 'False';
        falseBtn.addEventListener('click', () => checkAnswer(falseBtn, false, currentQ));

        optionsContainer.appendChild(trueBtn);
        optionsContainer.appendChild(falseBtn);
    }
    
    // If we are reviewing an already answered question
    if (currentQuestionIndex < userAnswers.length) {
        const pastAnsObj = userAnswers[currentQuestionIndex];
        const buttons = optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);
        
        visualFeedback.classList.remove('hidden');
        tipContainer.classList.remove('hidden');

        if (pastAnsObj.isCorrect) {
            visualFeedback.innerText = '✅';
            tipText.innerHTML = `<strong>Spot on!</strong> Good strategy.`;
            buttons.forEach(btn => {
                if (btn.innerText === pastAnsObj.userAnswer) btn.classList.add('correct');
            });
        } else {
            visualFeedback.innerText = '❌';
            let correctStr = pastAnsObj.questionObj.type === 'mcq' 
                ? pastAnsObj.questionObj.options[pastAnsObj.questionObj.answer] 
                : (pastAnsObj.questionObj.answer ? 'True' : 'False');
            tipText.innerHTML = `<strong>Pivot!</strong> The correct answer is: <em>${correctStr}</em>`;
            
            buttons.forEach(btn => {
                if (btn.innerText === pastAnsObj.userAnswer) btn.classList.add('wrong');
                if (btn.innerText === correctStr) btn.classList.add('correct');
            });
        }
    }
}

function checkAnswer(selectedBtn, selectedValue, questionObj) {
    // Disable all buttons
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);

    const isCorrect = selectedValue === questionObj.answer;
    let userAnsStr = "";
    if (questionObj.type === 'mcq') {
        userAnsStr = questionObj.options[selectedValue];
    } else {
        userAnsStr = selectedValue ? 'True' : 'False';
    }

    userAnswers.push({
        questionObj: questionObj,
        userAnswer: userAnsStr,
        isCorrect: isCorrect
    });
    
    // Visual Feedback
    visualFeedback.classList.remove('hidden');
    visualFeedback.style.animation = 'none';
    visualFeedback.offsetHeight; // trigger reflow
    visualFeedback.style.animation = 'popCenter 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';

    if (isCorrect) {
        selectedBtn.classList.add('correct');
        score++;
        scoreDisplay.innerText = score;
        visualFeedback.innerText = '✅';
        tipText.innerHTML = `<strong>Spot on!</strong> Good strategy.`;
    } else {
        selectedBtn.classList.add('wrong');
        visualFeedback.innerText = '❌';
        
        let correctStr = questionObj.type === 'mcq' ? questionObj.options[questionObj.answer] : (questionObj.answer ? 'True' : 'False');
        tipText.innerHTML = `<strong>Pivot!</strong> The correct answer is: <em>${correctStr}</em>`;
        
        // Highlight correct
        buttons.forEach(btn => {
            if (questionObj.type === 'mcq') {
                if (btn.innerText === correctStr) btn.classList.add('correct');
            } else {
                if ((btn.innerText === 'True' && questionObj.answer === true) || 
                    (btn.innerText === 'False' && questionObj.answer === false)) {
                    btn.classList.add('correct');
                }
            }
        });
    }

    tipContainer.classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    updateQuizUI();
}

function showResult() {
    showScreen(resultScreen);
    finalScore.innerText = score;
    totalQuestionsSpan.innerText = totalQuestions;
    
    wrongAnswersList.innerHTML = '';
    const wrongAns = userAnswers.filter(ans => !ans.isCorrect);
    
    if (wrongAns.length > 0) {
        wrongAnswersSection.classList.remove('hidden');
        wrongAns.forEach(item => {
            const corrAnsStr = item.questionObj.type === 'mcq' 
                ? item.questionObj.options[item.questionObj.answer] 
                : (item.questionObj.answer ? 'True' : 'False');
            
            const div = document.createElement('div');
            div.className = 'wrong-item';
            div.innerHTML = `
                <strong>${item.questionObj.question}</strong>
                <div class="ans-comparison">
                    <span class="user-ans">❌ You chose: ${item.userAnswer}</span>
                    <span class="corr-ans">✅ Correct: ${corrAnsStr}</span>
                </div>
            `;
            wrongAnswersList.appendChild(div);
        });
    } else {
        wrongAnswersSection.classList.add('hidden');
    }

    // Emoji Progress 100%
    emojiSteps.forEach(emoji => emoji.classList.add('active'));
    progressBarFill.style.width = `100%`;

    generateConfetti();
}

function resetGame() {
    score = 0;
    currentQuestionIndex = 0;
    scoreDisplay.innerText = '0';
    emojiSteps.forEach((emoji, idx) => {
        if(idx === 0) emoji.classList.add('active');
        else emoji.classList.remove('active');
    });
    progressBarFill.style.width = `0%`;
    userAnswers = [];
    wrongAnswersSection.classList.add('hidden');
    wrongAnswersList.innerHTML = '';
}

function generateConfetti() {
    confettiContainer.innerHTML = '';
    const colors = ['#28a745', '#ff7f50', '#415a77', '#f1c40f', '#e74c3c'];
    
    for (let i = 0; i < 70; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        
        // Random properties
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animation = `fall ${Math.random() * 2 + 1.5}s linear forwards`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        
        confettiContainer.appendChild(confetti);
    }
}
