document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const screens = {
        start: document.getElementById('start-screen'),
        main: document.getElementById('main-game-screen'),
        event: document.getElementById('event-screen'),
        match: document.getElementById('match-screen'),
        result: document.getElementById('result-screen'),
        reward: document.getElementById('reward-screen'),
    };
    const playerNameInput = document.getElementById('player-name-input');
    const startButton = document.getElementById('start-button');
    const weekDisplay = document.getElementById('week-display');
    const countdownDisplay = document.getElementById('countdown-display');
    const playerNameDisplay = document.getElementById('player-name-display');
    const statsDisplays = {
        kick: document.getElementById('kick-stat'),
        speed: document.getElementById('speed-stat'),
        iq: document.getElementById('iq-stat'),
    };
    const friendshipBar = document.getElementById('friendship-bar');
    const npcChar = document.getElementById('npc-char');
    const messageLog = document.getElementById('message-log');
    const trainingButtons = document.querySelectorAll('.menu-button');
    const viewRewardButton = document.getElementById('view-reward-button');
    const restartButton = document.getElementById('restart-button');
    const rewardNotice = document.getElementById('reward-notice'); // ★追加

    let gameState = {};
    let rewardTimer = null; // ★追加：タイマー用の変数を宣言

    const characters = {
        'のぶ': { name: 'のぶ', img: 'images/のぶ.png', specialty: 'kick', friendship: 0 },
        'つばさ': { name: 'つばさ', img: 'images/つばさ.png', specialty: 'speed', friendship: 0 },
        'ダンガン': { name: 'ダンガン', img: 'images/ダンガン.png', specialty: 'dribble', friendship: 0 },
        'かにゃ': { name: 'かにゃ', img: 'images/かにゃ.png', specialty: 'iq', friendship: 0 },
        'バモンキー': { name: 'バモンキー', img: 'images/バモンキー.png', specialty: null, friendship: 0 }
    };
    const characterList = Object.values(characters);

    const openingScenario = [
        { speaker: 'バモンキー', text: 'やあ！ よく来たな！' },
        { speaker: 'バモンキー', text: '今日から君も「あしざるFC」の一員だウキ！' },
        { speaker: '主人公', text: 'はい！ よろしくお願いします！' },
        { speaker: 'バモンキー', text: 'まずは8週間後にある大事な試合に向けて、しっかり練習するウキよ！' },
        { speaker: 'バモンキー', text: '練習で能力を上げて、仲間との絆を深めるんだ。それじゃ、頑張れウキ！' }
    ];

    const events = [
        { 
            id: 1, 
            character: 'のぶ',
            scenario: [
                { speaker: 'のぶ', text: 'おーい！今度のYouTubeの企画で、すごいシュートを決めたいんだ！' },
                { speaker: '主人公', text: '面白そうですね！どんなシュートですか？' },
                { speaker: 'のぶ', text: 'それは見てのお楽しみだ！手伝ってくれたら、キックのコツを教えてやるよ。' }
            ],
            effect: { kick: 15, friendship: 8 }
        },
        { 
            id: 2, 
            character: 'つばさ',
            scenario: [
                { speaker: 'つばさ', text: '最近、走り込みが足りない気がする…。一緒にトレーニングしないか？' },
                { speaker: '主人公', text: 'はい、ぜひ！' },
                { speaker: 'つばさ', text: 'よし、じゃあグラウンド10周だ！ついてこいよ！' }
            ],
            effect: { speed: 15, friendship: 8 }
        },
        {
            id: 3,
            character: 'ダンガン',
            scenario: [
                { speaker: 'ダンガン', text: 'なあ、俺の必殺ドリブル、見てみたくないか？' },
                { speaker: '主人公', text: 'はい！ぜひ見たいです！' },
                { speaker: 'ダンガン', text: 'よし、じゃあ特別に見せてやるよ！この動き、目に焼き付けな！' }
            ],
            effect: { speed: 10, kick: 5, friendship: 8 }
        },
        {
            id: 4,
            character: 'かにゃ',
            scenario: [
                { speaker: 'かにゃ', text: 'ねえねえ、次の対戦相手の試合ビデオ、一緒に見ない？' },
                { speaker: '主人公', text: 'いいですね！分析しましょう。' },
                { speaker: 'かにゃ', text: 'このチーム、サイドバックの裏が弱点かも…ふふ、勝つためのヒント、見つけちゃった♪' }
            ],
            effect: { iq: 15, friendship: 8 }
        }
    ];

    function init() {
        resetGame();
        for (const key in characters) { characters[key].friendship = 0; }
        const restartHandler = () => {
            playerNameInput.value = '';
            init();
            switchScreen('start');
        };
        if (!startButton.dataset.listenerAttached) {
            startButton.addEventListener('click', startGame);
            startButton.dataset.listenerAttached = 'true';
        }
        trainingButtons.forEach(button => {
            if (!button.dataset.listenerAttached) {
                button.addEventListener('click', () => performTraining(button.dataset.training));
                button.dataset.listenerAttached = 'true';
            }
        });
        if(!viewRewardButton.dataset.listenerAttached){
            viewRewardButton.addEventListener('click', showRewardImage);
            viewRewardButton.dataset.listenerAttached = 'true';
        }
        if(!restartButton.dataset.listenerAttached){
            restartButton.addEventListener('click', restartHandler);
            restartButton.dataset.listenerAttached = 'true';
        }
    }

    function resetGame() {
        gameState = {
            playerName: '',
            week: 1,
            stats: { kick: 0, speed: 0, iq: 0 },
        };
        clearTimeout(rewardTimer); // ★追加：タイマーをリセット
    }

    function switchScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }

    function startGame() {
        const name = playerNameInput.value || '主人公';
        gameState.playerName = name;
        playerNameDisplay.textContent = name;
        messageLog.innerHTML = '';
        playStory(openingScenario, characters['バモンキー'], beginMainGame);
    }
    
    function beginMainGame() {
        updateUI();
        switchScreen('main');
    }

    function updateUI() {
        weekDisplay.textContent = `${gameState.week}週目`;
        const remainingWeeks = 9 - gameState.week;
        if (remainingWeeks > 0) {
            countdownDisplay.textContent = `試合まであと ${remainingWeeks} 週`;
        } else {
            countdownDisplay.textContent = 'いよいよ最終試合！';
        }
        statsDisplays.kick.textContent = gameState.stats.kick;
        statsDisplays.speed.textContent = gameState.stats.speed;
        statsDisplays.iq.textContent = gameState.stats.iq;
        friendshipBar.innerHTML = '';
        Object.values(characters).filter(c => c.name !== 'バモンキー').forEach(char => {
            const friendDiv = document.createElement('span');
            friendDiv.textContent = `${char.name}: ${char.friendship}`;
            friendshipBar.appendChild(friendDiv);
        });
    }
    
    function generateGainsMessage(gains, friendshipGain, partnerName) {
        let parts = [];
        if (gains.kick > 0) parts.push(`キック+${gains.kick}`);
        if (gains.speed > 0) parts.push(`スピード+${gains.speed}`);
        if (gains.iq > 0) parts.push(`IQ+${gains.iq}`);
        if (friendshipGain > 0 && partnerName) {
            parts.push(`${partnerName}との親密度+${friendshipGain}`);
        }
        if (parts.length === 0) return "";
        return `▶ ${parts.join(' / ')}`;
    }

    function performTraining(trainingType) {
        if (gameState.week > 8) return;
        let statGains = { kick: 0, speed: 0, iq: 0 };
        let partner = null;
        let friendshipGain = 0;
        let logMessage = '';

        switch(trainingType) {
            case 'kick': statGains.kick += 10; logMessage = 'キックの練習をした！'; break;
            case 'speed': statGains.speed += 10; logMessage = '走り込みをした！'; break;
            case 'dribble': statGains.kick += 5; statGains.speed += 5; logMessage = 'ドリブルの練習をした！'; break;
            case 'iq': statGains.iq += 10; logMessage = 'サッカー理論を勉強した！'; break;
        }

        npcChar.style.display = 'none';
        if (Math.random() < 0.7) {
            partner = characterList[Math.floor(Math.random() * (characterList.length -1))];
            npcChar.src = partner.img;
            npcChar.style.display = 'block';
            friendshipGain = 5;
            logMessage += `\n${partner.name}と一緒に練習した！`;

            if (partner.specialty === trainingType) {
                statGains.kick += 8;
                statGains.speed += 8;
                statGains.iq += 8;
                friendshipGain += 3;
                logMessage += `\n得意な練習だったので、さらに効果が上がった！`;
            }
            partner.friendship += friendshipGain;
        }

        gameState.stats.kick += statGains.kick;
        gameState.stats.speed += statGains.speed;
        gameState.stats.iq += statGains.iq;
        const gainsMessage = generateGainsMessage(statGains, friendshipGain, partner ? partner.name : null);
        messageLog.innerHTML = `${logMessage}<br><span class="gains-display">${gainsMessage}</span>`;
        
        setTimeout(() => { npcChar.style.display = 'none'; }, 1500);
        advanceWeek();
    }

    function advanceWeek() {
        gameState.week++;
        updateUI();
        if (Math.random() < 0.35 && events.length > 0) {
            triggerRandomEvent();
        } else if (gameState.week > 8) {
            startMatch();
        }
    }

    function triggerRandomEvent() {
        const eventData = events[Math.floor(Math.random() * events.length)];
        const character = characters[eventData.character];
        const onEventEnd = () => {
            gameState.stats.kick += eventData.effect.kick || 0;
            gameState.stats.speed += eventData.effect.speed || 0;
            gameState.stats.iq += eventData.effect.iq || 0;
            character.friendship += eventData.effect.friendship || 0;
            const eventGains = generateGainsMessage(eventData.effect, eventData.effect.friendship, character.name);
            messageLog.innerHTML = `${character.name}とのイベントが発生した！<br><span class="gains-display">${eventGains}</span>`;
            if (gameState.week > 8) {
                startMatch();
            } else {
                switchScreen('main');
            }
            updateUI();
        };
        playStory(eventData.scenario, character, onEventEnd);
    }
    
    function playStory(scenario, npc, onComplete) {
        const eventScreen = screens.event;
        const dialogueBox = eventScreen.querySelector('#dialogue-box');
        const speakerName = eventScreen.querySelector('#speaker-name');
        const dialogueText = eventScreen.querySelector('#dialogue-text');
        const nextButton = eventScreen.querySelector('#next-dialogue-button');
        const eventNpcChar = eventScreen.querySelector('#event-npc-char');
        let currentLine = 0;
        function showNextLine() {
            if (currentLine >= scenario.length) {
                onComplete();
                return;
            }
            const line = scenario[currentLine];
            speakerName.textContent = line.speaker === '主人公' ? gameState.playerName : line.speaker;
            dialogueText.textContent = line.text;
            dialogueBox.className = 'dialogue-box';
            if (line.speaker === '主人公') {
                dialogueBox.classList.add('player-speaking');
            } else {
                dialogueBox.classList.add('npc-speaking');
            }
            currentLine++;
        }
        eventNpcChar.src = npc.img;
        switchScreen('event');
        showNextLine();
        nextButton.onclick = showNextLine;
    }

    function startMatch() {
        switchScreen('match');
        const matchLog = document.getElementById('match-log');
        const passChoices = document.getElementById('pass-choices');
        matchLog.innerHTML = '';
        passChoices.innerHTML = '<p>絶好のチャンス！誰にパスを出す？</p>';
        passChoices.style.display = 'none';

        const commentary = [
            "試合開始！", "一進一退の攻防が続く...", "相手チームの厳しいプレス！",
            "カウンターのチャンス！", "サイドを駆け上がる！", "ゴール前までボールを運んだ！",
            "ここでボールは " + gameState.playerName + " へ！"
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < commentary.length) {
                matchLog.innerHTML += `<p>${commentary[i]}</p>`;
                matchLog.scrollTop = matchLog.scrollHeight;
                i++;
            } else {
                clearInterval(interval);
                passChoices.style.display = 'block';
            }
        }, 1000);

        Object.values(characters).filter(c => c.name !== 'バモンキー').forEach(char => {
            const button = document.createElement('button');
            button.textContent = char.name;
            button.onclick = () => resolveMatch(char);
            passChoices.appendChild(button);
        });
    }

    function resolveMatch(selectedCharacter) {
        const totalStats = gameState.stats.kick + gameState.stats.speed + gameState.stats.iq;
        const friendship = selectedCharacter.friendship;
        const isVictory = friendship >= 20 && totalStats >= 100;
        showResult(isVictory);
    }

    function showResult(isVictory) {
        switchScreen('result');
        const title = document.getElementById('result-title');
        const message = document.getElementById('result-message');
        viewRewardButton.style.display = 'none';
        restartButton.style.display = 'none';
        rewardNotice.style.display = 'none'; // ★追加

        if (isVictory) {
            title.textContent = "試合勝利！";
            message.textContent = "素晴らしい活躍でした！";
            viewRewardButton.style.display = 'block';
            rewardNotice.style.display = 'block'; // ★追加：注釈を表示
            let topCharacter = null;
            let maxFriendship = -1;
            Object.values(characters).filter(c => c.name !== 'バモンキー').forEach(char => {
                if (char.friendship > maxFriendship) {
                    maxFriendship = char.friendship;
                    topCharacter = char;
                }
            });
            gameState.rewardImagePath = `images/${topCharacter.name}特典.png`;
        } else {
            title.textContent = "試合敗北…";
            message.textContent = "あと一歩でした。この悔しさをバネに、また挑戦しよう！";
            restartButton.style.display = 'block';
        }
    }

    function showRewardImage() {
        switchScreen('reward');

        // ★追加：10秒後にスタート画面に戻るタイマーをセット
        clearTimeout(rewardTimer); // 念のため既存のタイマーをクリア
        rewardTimer = setTimeout(() => {
            playerNameInput.value = '';
            init();
            switchScreen('start');
        }, 10000); // 10000ミリ秒 = 10秒

        const rewardBackgroundImage = document.getElementById('reward-background-image');
        const rewardTextCanvas = document.getElementById('reward-text-canvas');
        const rewardTextCtx = rewardTextCanvas.getContext('2d');
        rewardBackgroundImage.src = gameState.rewardImagePath;
        rewardBackgroundImage.onload = () => {
            const containerWidth = screens.reward.clientWidth;
            const containerHeight = screens.reward.clientHeight;
            const imgAspectRatio = rewardBackgroundImage.naturalWidth / rewardBackgroundImage.naturalHeight;
            const containerAspectRatio = containerWidth / containerHeight;
            
            let canvasWidth, canvasHeight;

            if (imgAspectRatio > containerAspectRatio) {
                canvasWidth = containerWidth;
                canvasHeight = containerWidth / imgAspectRatio;
            } else {
                canvasHeight = containerHeight;
                canvasWidth = containerHeight * imgAspectRatio;
            }

            rewardTextCanvas.width = canvasWidth;
            rewardTextCanvas.height = canvasHeight;
            
            rewardTextCtx.clearRect(0, 0, rewardTextCanvas.width, rewardTextCanvas.height);
            rewardTextCtx.fillStyle = "white";
            rewardTextCtx.strokeStyle = "black";
            rewardTextCtx.textAlign = "center";
            
            const nameFontSize = canvasWidth * 0.07;
            rewardTextCtx.lineWidth = 4;
            rewardTextCtx.font = `bold ${nameFontSize}px sans-serif`;
            const nameText = `${gameState.playerName}選手`;
            const nameX = rewardTextCanvas.width / 2;
            const nameY = rewardTextCanvas.height - (canvasHeight * 0.1);
            rewardTextCtx.strokeText(nameText, nameX, nameY);
            rewardTextCtx.fillText(nameText, nameX, nameY);

            const statsFontSize = canvasWidth * 0.045;
            rewardTextCtx.lineWidth = 3;
            rewardTextCtx.font = `bold ${statsFontSize}px sans-serif`;
            const stats = gameState.stats;
            const statsText = `KICK:${stats.kick} / SPEED:${stats.speed} / IQ:${stats.iq}`;
            const statsX = rewardTextCanvas.width / 2;
            const statsY = rewardTextCanvas.height - (canvasHeight * 0.05);
            rewardTextCtx.strokeText(statsText, statsX, statsY);
            rewardTextCtx.fillText(statsText, statsX, statsY);
        };
        rewardBackgroundImage.onerror = () => {
            console.error("特典画像の読み込みに失敗しました:", gameState.rewardImagePath);
            rewardBackgroundImage.src = "";
            rewardTextCtx.clearRect(0, 0, rewardTextCanvas.width, rewardTextCanvas.height);
        };
    }
    
    init();
    switchScreen('start');
});