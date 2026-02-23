/**
 * Mafia: Crimson Sin - Core Game Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    initRain();
    initSmoke();
    initLobby();
    initAudio();

    // Explicitly transition to lobby to ensure visibility and audio state
    setTimeout(() => {
        switchScreen('lobby-screen');
    }, 100);
});

// --- STATE MANAGEMENT ---
const gameState = {
    screen: 'lobby-screen',
    lang: 'ru',
    player: {
        nick: '',
        alias: '',
        roleClass: 'thug',
        avatar: 'user-secret',
        diamonds: 100,
        score: 0,
        loyalty: 50, // 0-100 scale
        greed: 50
    },
    lobbyCode: '',
    currentAct: 1,
    gameIndex: 0,
    isLobbyOwner: false,
    isEliminated: false,
    audioEnabled: false,
    volume: 0.5,
    isMuted: false,
    inventory: [],
    sessionPlayers: [],
    activeParticipants: [],
    // Networking
    peer: null,
    conn: null, // For clients: connection to host
    connections: [], // For host: list of client connections
    isHost: false,
    myId: null
};

const i18n = {
    ru: {
        title: "CRIMSON SIN",
        subtitle: "ДОБРО ПОЖАЛОВАТЬ В СИНДИКАТ",
        dossier_header: "ЛИЧНОЕ ДЕЛО №7734",
        random_avatar: "СЛУЧАЙНЫЙ ОБРАЗ",
        nickname: "ПСЕВДОНИМ",
        nick_placeholder: "Введите имя...",
        thug: "ГРОМИЛА",
        whisperer: "ШЕПТУН",
        voice_check: "ПРОВЕРКА СВЯЗИ",
        calibration: "КАЛИБРОВКА...",
        ready_status: "ОЖИДАНИЕ ИГРОКОВ...",
        trigger: "НАЖАТЬ НА КУРОК",
        informant: "ИНФОРМАТОР",
        chat_placeholder: "Шепните что-нибудь...",
        voice_done: "ГОТОВО",
        voice_msg: "Ваш голос теперь звучит... правильно. Как в подвале.",
        nick_alert: "Назовите себя, прежде чем нажимать на курок.",
        legend_title: "АКТ I: УЛИЦЫ",
        legend_desc: "Напишите легенду для полиции. Игрок {nick}, начните фразу:",
        legend_start: "В ту ночь мы были в...",
        market_title: "ЧЕРНЫЙ РЫНОК",
        market_subtitle: "ТРАТЬТЕ КРОВАВЫЕ АЛМАЗЫ С УМОМ",
        buy: "КУПИТЬ",
        diamonds_label: "АЛМАЗЫ",
        sabotage_jam: "Глушилка",
        sabotage_spy: "Слежка",
        sabotage_fake: "Фальшивка",
        jam_desc: "Запретить игроку Voice-чат",
        spy_desc: "Видеть голоса другого игрока",
        fake_desc: "Украсть 15% очков у лидера",
        rat_title: "АКТ II: ГРЯЗНЫЕ ДЕЛА",
        rat_desc: "Кто среди нас крыса? Выберите подозреваемого.",
        loot_title: "ИГРА 4: ДЕЛЕЖ ДОБЫЧИ",
        loot_desc: "Договоритесь о доле. Лимит: 1000 алмазов.",
        confirm_btn: "ПОДТВЕРДИТЬ",
        loot_fail: "Лимит превышен! Никто не получил ничего.",
        vote_btn: "ГОЛОСУВАТИ",
        boss_title: "АКТ III: ФИНАЛЬНЫЙ РАСЧЕТ",
        boss_desc: "Оправдайтесь перед Боссом. Используйте слова: 'Случайность', 'Ложь', 'Преданность'.",
        roulette_title: "ИГРА 6: РУССКАЯ РУЛЕТКА",
        roulette_desc: "Последняя ставка. Удвоите капитал или потеряете всё.",
        pull_trigger: "ЖАТЬ НА КУРОК",
        fame_title: "ЗАЛ СЛАВЫ",
        revive_btn: "РЕВАНШ",
        don: "ДОН",
        underboss: "ПОДРУЧНЫЙ",
        consigliere: "СОВЕТНИК",
        council_title: "СОВЕТ (ОМЕРТА)",
        council_desc: "Обсудите и проголосуйте за судьбу лидера.",
        create_lobby: "СОЗДАТЬ ЛОББИ",
        join_btn: "ВОЙТИ",
        lobby_code_placeholder: "КОД ЛОББИ",
        nick_label: "ВАШ ПСЕВДОНИМ (ИМЯ)",
        lobby_waiting: "ОЖИДАНИЕ ИГРОКОВ...",
        code_label: "КОД: ",
        spectator: "НАБЛЮДАТЕЛЬ",
        how_to_play: "КАК ИГРАТЬ",
        tutorial: [
            { title: "СУТЬ ИГРЫ", text: "Mafia: Crimson Sin — это психологическая игра на выживание. Ваша цель — заработать больше всех «Кровавых Алмазов» и выжить до финального расчета с Боссом." },
            { title: "АКТ I: УЛИЦЫ", text: "Вы создаете легенду для полиции и сореануетесь в дуэлях. Каждое действие приносит очки и ресурсы. Будьте быстрее врагов." },
            { title: "АКТ II: ОМЕРТА", text: "Время найти предателя («крысу») и поделить добычу. Используйте Черный Рынок, чтобы купить преимущества или помешать другим." },
            { title: "АКТ III: РАСЧЕТ", text: "Оправдайтесь перед Боссом и пройдите Русскую Рулетку. Только один станет истинным Доном." }
        ],
        legend_prompts: [
            "В ту ночь мы были в...",
            "Я видел как Тони...",
            "Мы просто пили кофе в...",
            "Оружие? Никакого оружия, я...",
            "Полиция ошибается, в 10 вечера мы...",
            "Тот кейс? Он был полон...",
            "Машина стояла прямо у...",
            "Кровь на рубашке? Это просто..."
        ]
    },
    en: {
        title: "CRIMSON SIN",
        subtitle: "WELCOME TO THE SYNDICATE",
        dossier_header: "PERSONNEL FILE №7734",
        random_avatar: "RANDOM AVATAR",
        nickname: "ALIAS",
        nick_placeholder: "Enter name...",
        thug: "THUG",
        whisperer: "WHISPERER",
        voice_check: "VOICE CHECK",
        calibration: "CALIBRATING...",
        ready_status: "WAITING FOR PLAYERS...",
        trigger: "PULL THE TRIGGER",
        informant: "INFORMANT",
        chat_placeholder: "Whisper something...",
        voice_done: "DONE",
        voice_msg: "Your voice sounds... correct now. Like in a basement.",
        nick_alert: "Identify yourself before pulling the trigger.",
        legend_title: "ACT I: STREETS",
        legend_desc: "Write a legend for the police. Player {nick}, start the phrase:",
        legend_start: "That night we were at...",
        market_title: "BLACK MARKET",
        market_subtitle: "SPEND BLOODY DIAMONDS WISELY",
        buy: "BUY",
        diamonds_label: "DIAMONDS",
        sabotage_jam: "Jammer",
        sabotage_spy: "Surveillance",
        sabotage_fake: "Forgery",
        jam_desc: "Disable voice chat for a player",
        spy_desc: "See who another player votes for",
        fake_desc: "Steal 15% of leader's points",
        rat_title: "ACT II: DIRTY DEEDS",
        rat_desc: "Who is the rat among us? Choose a suspect.",
        loot_title: "GAME 4: LOOT DISTRIBUTION",
        loot_desc: "Negotiate the shares. Limit: 1000 diamonds.",
        confirm_btn: "CONFIRM",
        loot_fail: "Limit exceeded! No one gets anything.",
        vote_btn: "VOTE",
        boss_title: "ACT III: FINAL SETTLEMENT",
        boss_desc: "Justify yourself to the Boss. Use words: 'Chance', 'Lies', 'Loyalty'.",
        roulette_title: "GAME 6: RUSSIAN ROULETTE",
        roulette_desc: "The final bet. Double your capital or lose everything.",
        pull_trigger: "PULL THE TRIGGER",
        fame_title: "HALL OF FAME",
        revive_btn: "REMATCH",
        don: "DON",
        underboss: "UNDERBOSS",
        consigliere: "CONSIGLIERE",
        council_title: "COUNCIL (OMERTA)",
        council_desc: "Discuss and vote on the leader's fate.",
        create_lobby: "CREATE LOBBY",
        join_btn: "JOIN",
        lobby_code_placeholder: "CODE",
        nick_label: "YOUR NICKNAME (REAL NAME)",
        lobby_waiting: "WAITING FOR PLAYERS...",
        code_label: "CODE: ",
        spectator: "SPECTATOR",
        how_to_play: "HOW TO PLAY",
        tutorial: [
            { title: "THE ESSENCE", text: "Mafia: Crimson Sin is a psychological survival game. Your goal is to earn the most 'Bloody Diamonds' and survive until the final settlement with the Boss." },
            { title: "ACT I: STREETS", text: "Create a legend for the police and compete in duels. Every action earns points and resources. Be faster than your enemies." },
            { title: "ACT II: OMERTA", text: "Find the traitor ('the rat') and distribute the loot. Use the Black Market to buy advantages or sabotage others." },
            { title: "ACT III: SETTLEMENT", text: "Justify yourself to the Boss and survive Russian Roulette. Only one can become the true Don." }
        ],
        legend_prompts: [
            "That night we were at...",
            "I saw Tony and he was...",
            "We were just having coffee at...",
            "Weapon? No weapon, I was...",
            "Police is wrong, at 10 PM we were...",
            "That briefcase? It was full of...",
            "The car was parked right by...",
            "Blood on the shirt? It's just..."
        ]
    },
    ua: {
        title: "CRIMSON SIN",
        subtitle: "ЛАСКАВО ПРОСИМО ДО СИНДИКАТУ",
        dossier_header: "ОСОБОВА СПРАВА №7734",
        random_avatar: "ВИПАДКОВИЙ ОБРАЗ",
        nickname: "ПСЕВДОНІМ",
        nick_placeholder: "Введіть ім'я...",
        thug: "ГРОМИЛА",
        whisperer: "ШЕПТУН",
        voice_check: "ПЕРЕВІРКА ЗВ'ЯЗКУ",
        calibration: "КАЛІБРУВАННЯ...",
        ready_status: "ОЧІКУВАННЯ ГРАВЦІВ...",
        trigger: "НАТИСНУТИ НА ГАЧОК",
        informant: "ІНФОРМАТОР",
        chat_placeholder: "Шепніть що-небудь...",
        voice_done: "ГОТОВО",
        voice_msg: "Ваш голос теперь звучит... правильно. Как у подвале.",
        nick_alert: "Назвіть себе, перш ніж натискати на гачок.",
        legend_title: "АКТ I: ВУЛИЦІ",
        legend_desc: "Напишіть легенду для поліції. Гравець {nick}, почніть фразу:",
        legend_start: "Тієї ночі ми були в...",
        market_title: "ЧОРНИЙ РИНОК",
        market_subtitle: "ВИТРАЧАЙТЕ КРОВАВІ АЛМАЗИ З РОЗУМОМ",
        buy: "КУПИТИ",
        diamonds_label: "АЛМАЗИ",
        sabotage_jam: "Глушилка",
        sabotage_spy: "Стеження",
        sabotage_fake: "Фальшивка",
        jam_desc: "Заборонити гравцю Voice-чат",
        spy_desc: "Бачити голоси іншого гравця",
        fake_desc: "Вкрасти 15% очок у лідера",
        rat_title: "АКТ II: БРУДНІ СПРАВИ",
        rat_desc: "Хто серед нас щур? Виберіть підозрюваного.",
        loot_title: "ГРА 4: ПОДІЛ ЗДОБИЧІ",
        loot_desc: "Домовтеся про частку. Ліміт: 1000 алмазов.",
        confirm_btn: "ПІДТВЕРДИТЬ",
        loot_fail: "Ліміт перевищено! Ніхто не отримав нічого.",
        loot_success: "Здобич поділена успішно.",
        council_title: "РАДА (ОМЕРТА)",
        council_desc: "Обговоріть та проголосуйте за долю лідера.",
        vote_btn: "ГОЛОСУВАТИ",
        boss_title: "АКТ III: ФІНАЛЬНИЙ РОЗРАХУНОК",
        boss_desc: "Виправдайтеся перед Босом. Використовуйте слова: 'Випадковість', 'Брехня', 'Відданість'.",
        roulette_title: "ГРА 6: РУСЬКА РУЛЕТКА",
        roulette_desc: "Остання ставка. Подвоїте капітал або втратите все.",
        pull_trigger: "ТИСНУТИ НА ГАЧОК",
        fame_title: "ЗАЛ СЛАВИ",
        revive_btn: "РЕВАНШ",
        don: "ДОН",
        underboss: "ПІДРУЧНИЙ",
        consigliere: "РАДНИК",
        create_lobby: "СТВОРИТИ ЛОББІ",
        join_btn: "УВІЙТИ",
        lobby_code_placeholder: "КОД",
        nick_label: "ВАШ ПСЕВДОНІМ (ІМ'Я)",
        lobby_waiting: "ОЧІКУВАННЯ ГРАВЦІВ...",
        code_label: "КОД: ",
        spectator: "СПОСТЕРІГАЧ",
        how_to_play: "ЯК ГРАТИ",
        tutorial: [
            { title: "СУТЬ ГРИ", text: "Mafia: Crimson Sin — це психологічна гра на виживання. Ваша мета — заробити найбільше «Кровавих Алмазів» та вижити до фінального розрахунку з Боссом." },
            { title: "АКТ I: ВУЛИЦІ", text: "Ви створюєте легенду для поліції та змагаєтесь у дуелях. Кожна дія приносить очки та ресурси. Будьте швидшими за ворогів." },
            { title: "АКТ II: ОМЕРТА", text: "Час знайти зрадника («щура») та поділити здобич. Використовуйте Чорний Ринок, щоб купити переваги або завадити іншим." },
            { title: "АКТ III: РОЗРАХУНОК", text: "Виправдайтеся перед Боссом і пройдіть Руську Рулетку. Тільки один стане справжнім Доном." }
        ],
        legend_prompts: [
            "Тієї ночі ми були в...",
            "Я бачив як Тоні...",
            "Ми просто пили каву в...",
            "Зброя? Ніякої зброї, я...",
            "Поліція помиляється, о 10 вечора ми...",
            "Той кейс? Він був повний...",
            "Машина стояла прямо біля...",
            "Кров на сорочці? Это просто..."
        ]
    }
};

const mafiaNames = {
    ru: ["Хромой Тони", "Левеня", "Безглазый Джо", "Шрам", "Крот", "Красавчик Винс", "Тихий Лука", "Мадам Мария", "Гвоздь", "Туз", "Мясник", "Тень", "Лакки", "Зубочистка", "Философ", "Гробовщик"],
    en: ["Hobbling Tony", "The Lion", "Eyeless Joe", "Scarface", "Mole", "Handsome Vince", "Silent Luca", "Madam Maria", "Nail", "Ace", "Butcher", "The Shadow", "Lucky", "Toothpick", "The Philosopher", "The Undertaker"],
    ua: ["Кривий Тоні", "Левко", "Безглазий Джо", "Шрам", "Кріт", "Красунчик Вінс", "Тихий Лука", "Мадам Марія", "Цвях", "Туз", "М'ясник", "Тінь", "Лаккі", "Зубочистка", "Філософ", "Гробар"]
};

function updateUI() {
    const t = i18n[gameState.lang];
    document.querySelector('.glitch').dataset.text = t.title;
    document.querySelector('.glitch').innerText = t.title;
    document.querySelector('.subtitle').innerText = t.subtitle;
    document.querySelector('.dossier-header').innerText = t.dossier_header;
    document.querySelector('.input-group label').innerText = t.nick_label;
    document.getElementById('player-nick').placeholder = t.nick_placeholder;
    document.getElementById('start-voice-check').innerHTML = `<i class="fa-solid fa-microphone"></i> ${t.voice_check}`;
    document.getElementById('ready-status').innerText = t.ready_status;
    document.querySelector('.trigger-label').innerText = t.trigger;
    document.querySelector('.chat-header').innerText = t.informant;
    document.getElementById('chat-input').placeholder = t.chat_placeholder;
    document.getElementById('create-lobby-btn').innerText = t.create_lobby;
    document.getElementById('join-lobby-btn').innerText = t.join_btn;
    document.getElementById('join-code-input').placeholder = t.lobby_code_placeholder;
    document.querySelector('.lobby-code-display').innerHTML = `${t.code_label} <span id="current-lobby-code">${gameState.lobbyCode || '---'}</span>`;
    document.getElementById('how-to-play-text').innerText = t.how_to_play;
}

function initNetworking() {
    gameState.peer = new Peer(generateShortId(), { debug: 1 });

    gameState.peer.on('open', (id) => {
        gameState.myId = id;
        console.log('My P2P ID:', id);
    });

    gameState.peer.on('connection', (conn) => {
        if (!gameState.isHost) {
            conn.close();
            return;
        }
        gameState.connections.push(conn);
        conn.on('data', (data) => handleNetMessage(data, conn));
    });
}

function generateShortId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function handleNetMessage(data, conn) {
    switch (data.type) {
        case 'JOIN_REQUEST':
            const np = {
                id: conn.peer,
                nick: data.nick,
                avatar: data.avatar,
                isBot: false
            };
            gameState.sessionPlayers.push(np);
            broadcast({ type: 'UPDATE_PLAYERS', players: gameState.sessionPlayers });
            renderLobbyPlayers();
            playSound('shuffling');
            break;
        case 'UPDATE_PLAYERS':
            gameState.sessionPlayers = data.players;
            renderLobbyPlayers();
            break;
        case 'START_GAME':
            gameState.activeParticipants = data.participants;
            triggerGameStartSequence();
            break;
        case 'NEXT_STEP':
            nextStep(false);
            break;
    }
}

function broadcast(data) {
    gameState.connections.forEach(c => {
        if (c.open) c.send(data);
    });
}

// --- CORE FUNCTIONS ---
function initLobby() {
    // Auto-detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (['ru', 'en', 'ua'].includes(browserLang)) {
        gameState.lang = browserLang;
    } else {
        gameState.lang = 'en';
    }

    // Language Selection
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        if (btn.dataset.lang === gameState.lang) btn.classList.add('active');
        else btn.classList.remove('active');

        btn.addEventListener('click', () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.lang = btn.dataset.lang;
            updateUI();
            playSound('click');
        });
    });
    initNetworking();
    updateUI();

    const createBtn = document.getElementById('create-lobby-btn');
    const joinBtn = document.getElementById('join-lobby-btn');
    const joinInput = document.getElementById('join-code-input');
    const nickInput = document.getElementById('player-nick');
    const startGameBtn = document.getElementById('start-game-btn');
    const voiceCheckBtn = document.getElementById('start-voice-check');

    createBtn.addEventListener('click', () => {
        gameState.isHost = true;
        gameState.lobbyCode = gameState.myId;
        enterLobby();
        playSound('gunshot');
    });

    joinBtn.addEventListener('click', () => {
        const val = joinInput.value.trim().toUpperCase();
        if (!val) return alert(i18n[gameState.lang].nick_alert); // Use existing alert logic or generic

        gameState.isHost = false;
        gameState.lobbyCode = val;

        gameState.conn = gameState.peer.connect(val);
        gameState.conn.on('open', () => {
            enterLobby();
            gameState.conn.send({
                type: 'JOIN_REQUEST',
                nick: gameState.player.nick || "Anonymous",
                avatar: gameState.player.avatar
            });
        });

        gameState.conn.on('data', (data) => handleNetMessage(data, gameState.conn));
        playSound('click');
    });

    function enterLobby() {
        document.getElementById('lobby-init-ui').classList.add('hidden');
        document.getElementById('player-dossier').classList.remove('hidden');
        document.getElementById('lobby-footer').classList.remove('hidden');
        assignRandomIdentity();

        // Add self to session
        gameState.sessionPlayers = [{
            id: 'player-self',
            nick: gameState.player.nick || "Anonymous",
            alias: gameState.player.alias,
            avatar: gameState.player.avatar,
            isBot: false
        }];

        updateUI();
        renderLobbyPlayers();
    }

    window.mockPlayerJoin = () => {
        const names = mafiaNames[gameState.lang] || mafiaNames['en'];
        const avatars = ['assets/avatar_boss.png', 'assets/avatar_lady.png', 'assets/avatar_thug.png', 'assets/avatar_silent.png'];

        if (gameState.sessionPlayers.length >= 5) return;

        const newPlayer = {
            id: 'mock-' + Date.now(),
            nick: "Player_" + (gameState.sessionPlayers.length + 1),
            alias: names[Math.floor(Math.random() * names.length)],
            avatar: avatars[Math.floor(Math.random() * avatars.length)],
            isBot: false // Mocking a real player joining
        };

        gameState.sessionPlayers.push(newPlayer);
        renderLobbyPlayers();
        playSound('shuffling');
    };

    function renderLobbyPlayers() {
        const list = document.getElementById('lobby-players-list');
        if (!list) return;

        list.innerHTML = gameState.sessionPlayers.map(p => `
            <div class="lobby-player-badge">
                <img src="${p.avatar}">
                <div class="name-tag">${p.nick === gameState.player.nick ? 'YOU' : p.nick}</div>
            </div>
        `).join('');
    }

    function assignRandomIdentity() {
        const t = i18n[gameState.lang];
        const roles = ['thug', 'whisperer'];
        const avatars = [
            'assets/avatar_boss.png',
            'assets/avatar_lady.png',
            'assets/avatar_thug.png',
            'assets/avatar_silent.png'
        ];
        const names = mafiaNames[gameState.lang] || mafiaNames['en'];

        gameState.player.roleClass = roles[Math.floor(Math.random() * roles.length)];
        gameState.player.avatar = avatars[Math.floor(Math.random() * avatars.length)];
        gameState.player.alias = names[Math.floor(Math.random() * names.length)];

        // Update Dossier View
        document.getElementById('current-avatar').innerHTML = `<img src="${gameState.player.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius: 5px;">`;
        document.getElementById('player-alias').innerText = gameState.player.alias;
        document.getElementById('player-role-badge').innerText = gameState.lang === 'ru' ? (gameState.player.roleClass === 'thug' ? 'ГРОМИЛА' : 'ШЕПТУН') : gameState.player.roleClass.toUpperCase();

        playSound('shuffling');
    }

    nickInput.addEventListener('input', (e) => {
        gameState.player.nick = e.target.value;
    });

    initTutorial();

    // Push-to-Talk (PTT) Logic
    const startVoice = () => {
        const waves = document.getElementById('voice-waves');
        waves.classList.remove('hidden');
        voiceCheckBtn.classList.add('recording');
        playSound('radio-on');
    };

    const stopVoice = () => {
        const waves = document.getElementById('voice-waves');
        waves.classList.add('hidden');
        voiceCheckBtn.classList.remove('recording');
    };

    voiceCheckBtn.addEventListener('mousedown', startVoice);
    voiceCheckBtn.addEventListener('touchstart', startVoice);
    window.addEventListener('mouseup', stopVoice);
    window.addEventListener('touchend', stopVoice);

    // Start Game
    startGameBtn.addEventListener('click', () => {
        if (!gameState.player.nick) {
            alert(i18n[gameState.lang].nick_alert);
            return;
        }

        if (gameState.isHost) {
            // 1. Finalize participants
            gameState.activeParticipants = [...gameState.sessionPlayers];
            if (gameState.activeParticipants.length < 5) {
                const botNames = mafiaNames[gameState.lang] || mafiaNames['en'];
                const avatars = ['assets/avatar_boss.png', 'assets/avatar_lady.png', 'assets/avatar_thug.png', 'assets/avatar_silent.png'];
                while (gameState.activeParticipants.length < 5) {
                    gameState.activeParticipants.push({
                        id: 'bot-' + Math.random().toString(36).substring(7),
                        nick: botNames[Math.floor(Math.random() * botNames.length)],
                        alias: "The Bot",
                        avatar: avatars[Math.floor(Math.random() * avatars.length)],
                        isBot: true
                    });
                }
            }
            // 2. Broadcast to all clients
            broadcast({
                type: 'START_GAME',
                participants: gameState.activeParticipants
            });
            // 3. Start locally
            triggerGameStartSequence();
        }
    });
}

function triggerGameStartSequence() {
    playSound('gunshot');
    setTimeout(() => playSound('shell-casing'), 1000);
    gsap.to('.blood-overlay', { opacity: 1, duration: 0.1, yoyo: true, repeat: 1 });
    gsap.to('#lobby-screen', {
        opacity: 0,
        duration: 1,
        onComplete: () => {
            const script = [
                { text: gameState.lang === 'ru' ? "Город засыпает..." : "The city falls asleep...", duration: 2000 },
                { text: gameState.lang === 'ru' ? "Но мы — нет." : "But we don't.", duration: 2000, sound: 'radio-on' }
            ];
            playCutscene(script, () => switchScreen('game-legend'));
        }
    });
}

function initTutorial() {
    const tutorialBtn = document.getElementById('how-to-play-btn');
    const modal = document.getElementById('tutorial-modal');
    const closeBtn = document.getElementById('close-tutorial');
    const nextBtn = document.getElementById('tutorial-next');
    const prevBtn = document.getElementById('tutorial-prev');
    const content = document.getElementById('tutorial-content');
    const title = document.getElementById('tutorial-title');
    const indicator = document.getElementById('tutorial-page-indicator');

    let currentPage = 0;

    const renderPage = () => {
        const t = i18n[gameState.lang].tutorial;
        title.innerText = t[currentPage].title;
        content.innerHTML = `<p>${t[currentPage].text}</p>`;
        indicator.innerText = `${currentPage + 1} / ${t.length}`;
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage === t.length - 1;
    };

    tutorialBtn.addEventListener('click', () => {
        currentPage = 0;
        renderPage();
        modal.classList.remove('hidden');
        playSound('shuffling');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        playSound('click');
    });

    nextBtn.addEventListener('click', () => {
        currentPage++;
        renderPage();
        playSound('click');
    });

    prevBtn.addEventListener('click', () => {
        currentPage--;
        renderPage();
        playSound('click');
    });
}

const gameSequence = [
    { type: 'game-legend', act: 1 },
    { type: 'game-shooting', act: 1 },
    { type: 'event', act: 1 }, // Event moved to END of Act I
    { type: 'marketplace', act: 'meta' },
    { type: 'game-rat', act: 2 },
    { type: 'game-loot', act: 2 },
    { type: 'event', act: 2 }, // Event moved to END of Act II
    { type: 'game-laundry', act: 3 },
    { type: 'game-wiretap', act: 3 },
    { type: 'marketplace', act: 'meta' },
    { type: 'game-evidence', act: 4 },
    { type: 'council-table', act: 4 },
    { type: 'game-boss', act: 5 },
    { type: 'game-roulette', act: 5 },
    { type: 'game-final-stand', act: 5 },
    { type: 'hall-of-fame', act: 'final' }
];

function nextStep(shouldBroadcast = true) {
    if (gameState.isHost && shouldBroadcast) {
        broadcast({ type: 'NEXT_STEP' });
    }
    gameState.gameIndex++;
    console.log("Advancing to step:", gameState.gameIndex);
    if (gameState.gameIndex < gameSequence.length) {
        const step = gameSequence[gameState.gameIndex];
        console.log("Step type:", step.type);
        if (step.type === 'event') {
            // Hide current screen before starting event to avoid clutter
            const screens = document.querySelectorAll('.screen');
            screens.forEach(s => {
                s.classList.remove('active');
                s.style.display = 'none';
            });
            triggerRandomEvent(() => nextStep());
        } else {
            switchScreen(step.type);
        }
    } else {
        console.log("End of game sequence reached.");
    }
}

function triggerRandomEvent(onComplete) {
    const events = [
        {
            title: { ru: "ПОЛИЦЕЙСКИЙ РЕЙД", en: "POLICE RAID" },
            text: { ru: "Копы на хвосте! Сбросить товар или рискнуть?", en: "Cops on your tail! Dump the goods or take the risk?" },
            options: [
                { text: { ru: "СБРОСИТЬ (-20 алмазов)", en: "DUMP (-20 diamonds)" }, action: () => { gameState.player.diamonds -= 20; gameState.player.loyalty += 5; } },
                { text: { ru: "РИСКНУТЬ (50/50)", en: "RISK IT (50/50)" }, action: () => { if (Math.random() < 0.5) gameState.player.score += 200; else gameState.player.score -= 200; } }
            ]
        },
        {
            title: { ru: "ПРЕДЛОЖЕНИЕ ОТ КОНКУРЕНТОВ", en: "COMPETITOR OFFER" },
            text: { ru: "Вам предлагают предать семью за 100 алмазов.", en: "Offered to betray the family for 100 diamonds." },
            options: [
                { text: { ru: "ПРИНЯТЬ", en: "ACCEPT" }, action: () => { gameState.player.diamonds += 100; gameState.player.loyalty -= 20; } },
                { text: { ru: "ОТКАЗАТЬСЯ", en: "REFUSE" }, action: () => { gameState.player.loyalty += 20; } }
            ]
        },
        {
            title: { ru: "ТАИНСТВЕННЫЙ ИНФОРМАТОР", en: "MYSTERIOUS INFORMANT" },
            text: { ru: "Некто шепчет секреты конкурентов... за цену.", en: "Someone whispers rival secrets... for a price." },
            options: [
                { text: { ru: "ЗАПЛАТИТЬ (50 алмазов)", en: "PAY (50 diamonds)" }, action: () => { gameState.player.diamonds -= 50; gameState.player.score += 500; } },
                { text: { ru: "ПРОГНАТЬ", en: "DISMISS" }, action: () => { gameState.player.greed += 5; } }
            ]
        },
        {
            title: { ru: "УЖИН С БОССОМ", en: "DINNER WITH THE BOSS" },
            text: { ru: "Старик смотрит на вас пронзительно. Что скажете?", en: "The old man looks at you piercingly. What do you say?" },
            options: [
                { text: { ru: "КЛЯТВА ВЕРНОСТИ", en: "VOW LOYALTY" }, action: () => { gameState.player.loyalty += 15; } },
                { text: { ru: "ОБСУДИТЬ ДОЛЮ", en: "DISCUSS SHARE" }, action: () => { gameState.player.greed += 15; gameState.player.diamonds += 30; } }
            ]
        }
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    const script = [
        { text: ev.title[gameState.lang], duration: 1500, sound: 'radio-on' },
        { text: ev.text[gameState.lang], duration: 3000 }
    ];

    playCutscene(script, () => {
        // Show choice UI in interaction overlay
        const overlay = document.getElementById('interaction-overlay');
        overlay.innerHTML = `
            <div class="event-choice-box dossier-card">
                <h2>${ev.title[gameState.lang]}</h2>
                <p>${ev.text[gameState.lang]}</p>
                <div class="choice-btns">
                    ${ev.options.map((opt, i) => `<button class="btn-primary" onclick="handleEventChoice(${i})">${opt.text[gameState.lang]}</button>`).join('')}
                </div>
            </div>
        `;
        overlay.classList.remove('hidden');
        let choiceResolved = false;
        window.handleEventChoice = (index) => {
            if (choiceResolved) return;
            choiceResolved = true;
            ev.options[index].action();
            overlay.innerHTML = '';
            overlay.classList.add('hidden');
            playSound('click');
            if (onComplete) {
                console.log("Event complete, advancing...");
                onComplete();
            }
        };
    });
}

function switchScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
        s.style.opacity = 0;
    });

    const activeScreen = document.getElementById(screenId);
    if (!activeScreen) {
        console.error("CRITICAL: Screen ID not found:", screenId);
        return;
    }
    activeScreen.style.display = 'flex';
    activeScreen.style.opacity = 0;

    // Spectator Mode Check
    const spectatorOverlay = document.getElementById('spectator-overlay');
    if (gameState.isEliminated) {
        if (spectatorOverlay) {
            spectatorOverlay.classList.remove('hidden');
            const msg = spectatorOverlay.querySelector('.spectator-msg');
            if (msg) msg.innerText = i18n[gameState.lang].spectator;
        }
    } else if (spectatorOverlay) {
        spectatorOverlay.classList.add('hidden');
    }

    setTimeout(() => {
        activeScreen.classList.add('active');
        gsap.to(activeScreen, { opacity: 1, duration: 1 });
    }, 50);

    gameState.screen = screenId;
    loadScreenModule(screenId);

    // Context-Aware Music
    if (screenId === 'game-shooting' || screenId === 'game-roulette' || screenId === 'game-final-stand') {
        switchMusic('action-theme');
    } else if (screenId === 'lobby-screen') {
        switchMusic('mafia-theme');
    } else if (screenId === 'marketplace' || screenId === 'game-laundry' || screenId === 'game-wiretap') {
        switchMusic('jazz');
    }
}

// --- MODULE LOADER ---
function loadScreenModule(screenId) {
    console.log("Loading module:", screenId);
    switch (screenId) {
        case 'game-legend': initLegendGame(); break;
        case 'game-shooting': initShootingGame(); break;
        case 'marketplace': initMarketplace(); break;
        case 'game-rat': initRatGame(); break;
        case 'game-loot': initLootGame(); break;
        case 'game-laundry': initLaundryGame(); break;
        case 'game-wiretap': initWiretapGame(); break;
        case 'game-evidence': initEvidenceGame(); break;
        case 'council-table': initCouncilTable(); break;
        case 'game-boss': initBossGame(); break;
        case 'game-roulette': initRouletteGame(); break;
        case 'game-final-stand': initFinalStand(); break;
        case 'hall-of-fame': initHallOfFame(); break;
        // ... more cases
    }
}

// --- MINI-GAMES ---

// Game 1: Legend writing
// Game 1: The Legend (Multi-Question Version)
function initLegendGame() {
    const t = i18n[gameState.lang];
    const container = document.getElementById('game-legend');
    const promptsPool = t.legend_prompts || [t.legend_start];

    // Pick 3 unique questions or as many as available
    let questions = [];
    const poolCopy = [...promptsPool];
    for (let i = 0; i < 3 && poolCopy.length > 0; i++) {
        const idx = Math.floor(Math.random() * poolCopy.length);
        questions.push(poolCopy.splice(idx, 1)[0]);
    }

    let currentQ = 0;
    let legendFinished = false;

    function renderQuestion() {
        if (currentQ >= questions.length) {
            finishLegendGame();
            return;
        }

        container.innerHTML = `
            <div class="game-container streets-bg">
                <h2 class="act-title">${t.legend_title} (${currentQ + 1}/${questions.length})</h2>
                <div class="legend-box">
                    <p class="desc">${t.legend_desc.replace('{nick}', gameState.player.nick)}</p>
                    <div class="typewriter-area">
                        <span id="story-text">${questions[currentQ]}</span>
                        <input type="text" id="legend-input" maxlength="50" autofocus>
                    </div>
                </div>
                <div class="timer-countdown" id="game1-timer">15</div>
            </div>
        `;

        const input = document.getElementById('legend-input');
        input.focus();
        let timeLeft = 15;
        const timerDisplay = document.getElementById('game1-timer');

        const countdown = setInterval(() => {
            if (gameState.screen !== 'game-legend') { clearInterval(countdown); return; }
            timeLeft--;
            if (timerDisplay) timerDisplay.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(countdown);
                advanceQuestion();
            }
        }, 1000);

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearInterval(countdown);
                advanceQuestion();
            }
        });

        function advanceQuestion() {
            const val = input.value || "...";
            addChatMessage(gameState.player.nick, val);
            gameState.player.score += 20;
            currentQ++;
            renderQuestion();
        }
    }

    function finishLegendGame() {
        if (legendFinished) return;
        legendFinished = true;
        console.log("Legend cycle finished, moving to next step.");
        nextStep();
    }

    renderQuestion();
}

// Game 2: The Duel
function initShootingGame() {
    const t = i18n[gameState.lang];
    const container = document.getElementById('game-shooting');
    container.innerHTML = `
        <div class="game-container duel-arena">
            <h2 class="act-title">${gameState.lang === 'ru' ? 'ДУЭЛЬ: БЫСТРАЯ РУКА' : 'THE DUEL: QUICK DRAW'} ${gameState.isEliminated ? '(' + t.spectator + ')' : ''}</h2>
            <div class="duel-field">
                <div class="gangster-enemy" id="enemy-gangster">
                    <img src="assets/avatar_silent.png">
                </div>
                <div class="duel-prompt" id="duel-status">WAITING...</div>
            </div>
            <div class="timer-countdown" id="duel-timer">READY</div>
        </div>
    `;

    if (gameState.isEliminated) {
        setTimeout(() => switchScreen('marketplace'), 5000);
        return;
    }

    const statusDisplay = document.getElementById('duel-status');
    const timerDisplay = document.getElementById('duel-timer');
    const enemy = document.getElementById('enemy-gangster');

    let canShoot = false;
    let duelStartTime = 0;

    const startDuelAttempt = () => {
        const delay = Math.random() * 3000 + 2000;
        statusDisplay.innerText = gameState.lang === 'ru' ? 'ЖДИ...' : 'WAIT...';

        setTimeout(() => {
            statusDisplay.innerText = gameState.lang === 'ru' ? 'ОГОНЬ!' : 'DRAW!';
            statusDisplay.classList.add('fire-blink');
            canShoot = true;
            duelStartTime = Date.now();
            playSound('click');
        }, delay);
    };

    const handleShoot = () => {
        if (canShoot) {
            const reactionTime = Date.now() - duelStartTime;
            canShoot = false;
            playSound('gunshot');
            flashScreen();
            createParticles('spark', event.clientX, event.clientY, 20);
            statusDisplay.innerText = gameState.lang === 'ru' ? `ПОПАЛ! (${reactionTime}ms)` : `HIT! (${reactionTime}ms)`;
            gameState.player.score += Math.max(0, 1000 - reactionTime);
            enemy.classList.add('enemy-shot');
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 500);
            setTimeout(() => nextStep(), 2000);
        } else {
            // Premature shooting
            playSound('click');
            statusDisplay.innerText = gameState.lang === 'ru' ? 'РАНО!' : 'TOO EARLY!';
            statusDisplay.style.color = '#ff0000';
            setTimeout(startDuelAttempt, 1000);
        }
    };

    container.addEventListener('click', handleShoot);
    startDuelAttempt();
}

// Meta-Layer 1: Black Market
function initMarketplace() {
    const t = i18n[gameState.lang];
    const container = document.getElementById('marketplace');
    container.innerHTML = `
        <div class="market-container">
            <h1 class="market-title">${t.market_title}</h1>
            <p class="market-subtitle">${t.market_subtitle}</p>
            <div class="diamonds-count">
                <img src="https://img.icons8.com/color/48/000000/ruby.png">
                <span id="player-diamonds">${gameState.player.diamonds}</span>
            </div>
            <div class="cards-grid">
                <div class="market-card" data-item="jam" data-cost="40">
                    <div class="card-icon"><i class="fa-solid fa-volume-xmark"></i></div>
                    <h3>${t.sabotage_jam}</h3>
                    <p>${t.jam_desc}</p>
                    <button class="buy-btn">40 <img src="https://img.icons8.com/color/24/000000/ruby.png"></button>
                </div>
                <div class="market-card" data-item="spy" data-cost="60">
                    <div class="card-icon"><i class="fa-solid fa-eye"></i></div>
                    <h3>${t.sabotage_spy}</h3>
                    <p>${t.spy_desc}</p>
                    <button class="buy-btn">60 <img src="https://img.icons8.com/color/24/000000/ruby.png"></button>
                </div>
                <div class="market-card" data-item="fake" data-cost="80">
                    <div class="card-icon"><i class="fa-solid fa-mask"></i></div>
                    <h3>${t.sabotage_fake}</h3>
                    <p>${t.fake_desc}</p>
                    <button class="buy-btn">80 <img src="https://img.icons8.com/color/24/000000/ruby.png"></button>
                </div>
                <!-- NEW ITEMS -->
                <div class="market-card" data-item="brass" data-cost="50">
                    <div class="card-icon"><i class="fa-solid fa-hand-fist"></i></div>
                    <h3>${gameState.lang === 'ru' ? 'Кастет' : 'Brass Knuckles'}</h3>
                    <p>${gameState.lang === 'ru' ? '+10% к очкам в дуэлях' : '+10% score in duels'}</p>
                    <button class="buy-btn">50 <img src="https://img.icons8.com/color/24/000000/ruby.png"></button>
                </div>
                <div class="market-card" data-item="golden" data-cost="250">
                    <div class="card-icon"><i class="fa-solid fa-gun" style="color:gold"></i></div>
                    <h3>${gameState.lang === 'ru' ? 'Золотой ТТ' : 'Golden TT'}</h3>
                    <p>${gameState.lang === 'ru' ? 'Престиж и +500 очков сразу' : 'Prestige and +500 points'}</p>
                    <button class="buy-btn">250 <img src="https://img.icons8.com/color/24/000000/ruby.png"></button>
                </div>
            </div>
            <div class="timer-countdown" id="market-timer">40</div>
        </div>
    `;

    const buyBtns = container.querySelectorAll('.buy-btn');
    buyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (gameState.isEliminated) return;
            const card = btn.closest('.market-card');
            const cost = parseInt(card.dataset.cost);
            if (gameState.player.diamonds >= cost) {
                const oldVal = gameState.player.diamonds;
                gameState.player.diamonds -= cost;

                flashScreen();
                createParticles('spark', e.clientX, e.clientY, 15);
                playSound('cash');

                animateValue(null, oldVal, gameState.player.diamonds, 500, (v) => {
                    document.getElementById('player-diamonds').innerText = v;
                });

                btn.disabled = true;
                btn.innerText = "OWNED";
                addChatMessage(gameState.player.nick, `Bought ${card.querySelector('h3').innerText}`);
            } else {
                alert("Not enough diamonds!");
            }
        });
    });

    let timeLeft = 40;
    const timerDisplay = document.getElementById('market-timer');
    const countdown = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            nextStep();
        }
    }, 1000);
}
// Game 3: Find the Rat
function initRatGame() {
    const t = i18n[gameState.lang];
    const container = document.getElementById('game-rat');
    const otherPlayers = gameState.activeParticipants.filter(p => p.id !== 'player-self' && !p.id.startsWith('mock-'));
    // If it's mock testing, we might want to exclude mock players from being "rats" or just show them for UI testing.
    // Actually, show everyone EXCEPT the local player.
    const targets = gameState.activeParticipants.filter(p => p.nick !== gameState.player.nick);

    container.innerHTML = `
        <div class="game-container rat-game-container">
            <h2 class="act-title">${t.rat_title}</h2>
            <p class="desc">${t.rat_desc}</p>
            <div class="player-list">
                ${targets.map(p => `<div class="player-token" data-id="${p.id}">${p.nick}</div>`).join('')}
            </div>
            <div class="timer-countdown" id="rat-timer">20</div>
        </div>
    `;

    const tokens = container.querySelectorAll('.player-token');
    tokens.forEach(token => {
        token.addEventListener('click', () => {
            if (gameState.isEliminated) return;
            tokens.forEach(t => t.classList.remove('selected'));
            token.classList.add('selected');
            playSound('click');
        });
    });

    let timeLeft = 20;
    const timerDisplay = document.getElementById('rat-timer');
    const countdown = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            nextStep();
        }
    }, 1000);
}

// Game 4: Loot Distribution
function initLootGame() {
    const t = i18n[gameState.lang];
    const container = document.getElementById('game-loot');
    container.innerHTML = `
        <div class="game-container loot-game-container">
            <h2 class="act-title">${t.loot_title}</h2>
            <p class="desc">${t.loot_desc}</p>
            <div class="loot-input-area">
                <input type="number" id="loot-offer" value="250" step="50" min="0" max="1000" ${gameState.isEliminated ? 'disabled' : ''}>
                <button id="confirm-loot" class="btn-primary" ${gameState.isEliminated ? 'disabled' : ''}>${t.confirm_btn}</button>
            </div>
            <div class="timer-countdown" id="loot-timer">30</div>
        </div>
    `;

    document.getElementById('confirm-loot').addEventListener('click', () => {
        if (gameState.isEliminated) return;
        const offer = parseInt(document.getElementById('loot-offer').value || 0);
        addChatMessage(gameState.player.nick, `Offered: ${offer}`);
        gameState.player.diamonds += offer / 2; // Symbolic gain
        nextStep();
    });

    let timeLeft = 30;
    const timerDisplay = document.getElementById('loot-timer');
    const countdown = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            nextStep();
        }
    }, 1000);
}

function initCouncilTable() {
    const t = i18n[gameState.lang];
    const container = document.getElementById('council-table');
    // Map participants to table positions
    const others = gameState.activeParticipants.filter(p => p.nick !== gameState.player.nick);

    container.innerHTML = `
        <div class="council-container">
            <h1 class="act-title">${t.council_title}</h1>
            <p class="desc">${t.council_desc}</p>
            <div class="round-table">
                ${others.map((p, i) => `
                    <div class="player-spot spot-${i + 1} seated-gangster" data-id="${p.id}">
                        <img src="${p.avatar}">
                        <span>${p.nick}</span>
                    </div>
                `).join('')}
                <div class="player-spot player-self seated-gangster" id="self-spot">
                    <img src="${gameState.player.avatar}">
                    <span>${gameState.player.nick}</span>
                </div>
            </div>
            <div class="vote-panel">
                <button id="vote-confiscate" class="btn-primary" ${gameState.isEliminated ? 'disabled' : ''}>${t.vote_btn}</button>
            </div>
            <div class="timer-countdown" id="council-timer">60</div>
        </div>
    `;

    let selectedId = null;
    const spots = container.querySelectorAll('.player-spot');

    spots.forEach(spot => {
        spot.style.cursor = 'pointer';
        spot.addEventListener('click', () => {
            if (gameState.isEliminated) return;
            spots.forEach(s => s.classList.remove('selected-gangster'));
            spot.classList.add('selected-gangster');
            selectedId = spot.dataset.id || 'self';
            playSound('click');
            console.log("Selected player:", selectedId);
        });
    });

    document.getElementById('vote-confiscate').addEventListener('click', () => {
        if (gameState.isEliminated) return;
        if (!selectedId) {
            alert(gameState.lang === 'ru' ? "Выберите подозреваемого!" : (gameState.lang === 'ua' ? "Виберіть підозрюваного!" : "Select a suspect!"));
            return;
        }

        addChatMessage(gameState.player.nick, `Voted against ID: ${selectedId}`);
        playSound('gunshot');

        const script = [
            { text: gameState.lang === 'ru' ? "Босс хочет тебя видеть." : "The Boss wants to see you.", duration: 2500 },
            { text: gameState.lang === 'ru' ? "Попробуй не облажаться." : "Try not to screw up.", duration: 2000, sound: 'radio-on' }
        ];
        playCutscene(script, () => switchScreen('game-boss'));
    });

    let timeLeft = 60;
    const countdown = setInterval(() => {
        timeLeft--;
        const timer = document.getElementById('council-timer');
        if (timer) timer.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            switchScreen('game-boss');
        }
    }, 1000);
}

// Act III: Final Settlement
function initBossGame() {
    const t = i18n[gameState.lang];
    const container = document.getElementById('game-boss');
    container.innerHTML = `
        <div class="game-container boss-interrogation">
            <h1 class="act-title">${t.boss_title}</h1>
            <p class="desc">${t.boss_desc}</p>
            <div class="boss-input-area">
                <textarea id="boss-justification" placeholder="Speak..." ${gameState.isEliminated ? 'disabled' : ''}></textarea>
                <button id="confirm-justification" class="btn-primary" ${gameState.isEliminated ? 'disabled' : ''}>${t.confirm_btn}</button>
            </div>
        </div>
    `;

    document.getElementById('confirm-justification').addEventListener('click', () => {
        if (gameState.isEliminated) return;
        addChatMessage("Boss", "We'll see...");
        switchScreen('game-roulette');
    });
}

function initRouletteGame() {
    const t = i18n[gameState.lang];
    const container = document.getElementById('game-roulette');
    container.innerHTML = `
        <div class="game-container roulette-range">
            <h1 class="act-title">${t.roulette_title}</h1>
            <p class="desc">${t.roulette_desc}</p>
            <div class="roulette-disc" id="drum">?</div>
            <button id="pull-trigger" class="btn-primary" ${gameState.isEliminated ? 'disabled' : ''}>${t.pull_trigger}</button>
        </div>
    `;

    document.getElementById('pull-trigger').addEventListener('click', (e) => {
        if (gameState.isEliminated) return;
        playSound('gunshot');
        flashScreen();
        createParticles('spark', e.clientX, e.clientY, 10);
        setTimeout(() => playSound('shell-casing'), 1000);

        const drum = document.getElementById('drum');
        drum.innerText = "!";
        gsap.to(drum, {
            rotation: 360, duration: 1, onComplete: () => {
                // Randomly eliminate player for demo purposes
                if (Math.random() < 0.5) {
                    gameState.isEliminated = true;
                    playDeathAnimation();
                }
                setTimeout(() => switchScreen('hall-of-fame'), 2000);
            }
        });
    });
}

function initHallOfFame() {
    const t = i18n[gameState.lang];
    const container = document.getElementById('hall-of-fame');
    container.innerHTML = `
        <div class="game-container hall-fame">
            <h1 class="act-title">${t.fame_title}</h1>
            <div class="winner-pods">
                <div class="winner-card don">
                    <h2>${t.don}</h2>
                    <p>${gameState.isEliminated ? 'RIP' : gameState.player.nick}</p>
                </div>
                <div class="winner-card underboss">
                    <h2>${t.underboss}</h2>
                    <p>Tony</p>
                </div>
                <div class="winner-card consigliere">
                    <h2>${t.consigliere}</h2>
                    <p>Maria</p>
                </div>
            </div>
            <button class="btn-primary" onclick="location.reload()">${t.revive_btn}</button>
        </div>
    `;
}
function initRain() {
    const container = document.querySelector('.rain-container');
    const dropCount = 100;

    for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement('div');
        drop.className = 'drop';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = (Math.random() * 1 + 0.5) + 's';
        drop.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(drop);
    }
}

function initSmoke() {
    const container = document.getElementById('particle-container');
    setInterval(() => {
        if (gameState.screen !== 'lobby-screen') return;
        const p = document.createElement('div');
        p.className = 'particle smoke-puff';
        const size = Math.random() * 100 + 100;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.bottom = '-100px';

        container.appendChild(p);

        gsap.to(p, {
            y: -window.innerHeight - 200,
            x: (Math.random() - 0.5) * 200,
            opacity: 0,
            duration: 10,
            ease: "power1.out",
            onComplete: () => p.remove()
        });
    }, 1000);
}

function addChatMessage(sender, text) {
    const log = document.getElementById('chat-log');
    const msg = document.createElement('div');
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;

    // Juicy feedback for chat
    gsap.from(msg, { x: -20, opacity: 0, duration: 0.3 });
}

// --- JUICY HELPERS ---
function createParticles(type, x, y, count = 10) {
    const container = document.getElementById('particle-container');
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = `particle ${type}`;
        p.style.left = x + 'px';
        p.style.top = y + 'px';

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 100 + 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        container.appendChild(p);

        gsap.to(p, {
            x: tx,
            y: ty,
            opacity: 0,
            duration: Math.random() * 1 + 0.5,
            onComplete: () => p.remove()
        });
    }
}

function animateValue(obj, start, end, duration, onUpdate) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        if (onUpdate) onUpdate(current);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function flashScreen() {
    const overlay = document.getElementById('interaction-overlay');
    overlay.classList.add('flash-white');
    setTimeout(() => overlay.classList.remove('flash-white'), 200);
}

// --- CINEMATIC SYSTEM ---
function playCutscene(script, onComplete) {
    const bars = document.getElementById('cutscene-bars');
    const caption = document.getElementById('cutscene-caption');
    bars.classList.remove('hidden');

    let step = 0;
    const nextPhrase = () => {
        if (step < script.length) {
            caption.innerText = script[step].text;
            caption.style.opacity = 1;
            playSound(script[step].sound || 'click');

            setTimeout(() => {
                caption.style.opacity = 0;
                setTimeout(() => {
                    step++;
                    nextPhrase();
                }, 500);
            }, script[step].duration || 2000);
        } else {
            bars.classList.add('hidden');
            if (onComplete) onComplete();
        }
    };
    nextPhrase();
}

function playDeathAnimation() {
    playSound('body-fall');
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);

    const container = document.getElementById('blood-splatter-container');
    for (let i = 0; i < 20; i++) {
        const drop = document.createElement('div');
        drop.className = 'blood-drop';
        const size = Math.random() * 50 + 20;
        drop.style.width = size + 'px';
        drop.style.height = size + 'px';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.top = Math.random() * 100 + '%';
        container.appendChild(drop);
        setTimeout(() => drop.remove(), 2000);
    }
}

// --- AUDIO SYSTEM ---
let sounds = {};
let bgMusic = null;

function initAudio() {
    sounds = {
        'jazz': new Howl({ src: ['https://assets.mixkit.co/music/preview/mixkit-smooth-jazz-741.mp3'], loop: true, volume: 0.2 }),
        'mafia-theme': new Howl({ src: ['https://assets.mixkit.co/music/preview/mixkit-tense-detective-loop-2139.mp3'], loop: true, volume: 0.3 }),
        'action-theme': new Howl({ src: ['https://assets.mixkit.co/music/preview/mixkit-fast-action-cinematic-773.mp3'], loop: true, volume: 0.3 }),
        'rain': new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3'], loop: true, volume: 0.15 }),
        'street-noise': new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-city-traffic-ambience-900.mp3'], loop: true, volume: 0.1 }),
        'gunshot': new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-revolver-shot-short-1100.mp3'] }),
        'click': new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-modern-click-box-check-1120.mp3'] }),
        'buy': new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-winning-chime-2024.mp3'] }),
        'radio-on': new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-radio-static-noise-1077.mp3'] }),
        'shuffling': new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-shuffling-papers-2315.mp3'] }),
        'body-fall': new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-human-body-fall-on-wooden-floor-2129.mp3'] }),
        'shell-casing': new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-bullet-shell-casing-fall-741.mp3'] }),
        'cash': new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-cashier-machine-register-shuffling-2041.mp3'] })
    };

    const volumeSlider = document.getElementById('volume-slider');
    const muteBtn = document.getElementById('mute-btn');

    volumeSlider.addEventListener('input', (e) => {
        gameState.volume = parseFloat(e.target.value);
        Howler.volume(gameState.isMuted ? 0 : gameState.volume);
    });

    muteBtn.addEventListener('click', () => {
        gameState.isMuted = !gameState.isMuted;
        muteBtn.innerHTML = gameState.isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
        Howler.volume(gameState.isMuted ? 0 : gameState.volume);
    });

    document.addEventListener('click', () => {
        if (!gameState.audioEnabled) {
            sounds['mafia-theme'].play();
            sounds.rain.play();
            sounds['street-noise'].play();
            gameState.audioEnabled = true;
            Howler.volume(gameState.volume);
        }
    }, { once: true });
}

function switchMusic(newTheme) {
    const themes = ['jazz', 'mafia-theme', 'action-theme'];
    themes.forEach(t => {
        if (sounds[t] && sounds[t].playing()) {
            sounds[t].fade(sounds[t].volume(), 0, 1000);
            setTimeout(() => sounds[t].stop(), 1000);
        }
    });
    if (sounds[newTheme]) {
        sounds[newTheme].play();
        sounds[newTheme].fade(0, 0.3, 1000);
    }
}

function playSound(key) {
    if (sounds[key]) sounds[key].play();
}

// Act III: Game 5 - Money Laundering
function initLaundryGame() {
    const container = document.getElementById('game-laundry');
    if (!container) return;
    container.innerHTML = `
        <div class="game-container laundry-bg">
            <h1 class="act-title">${gameState.lang === 'ru' ? 'ОТМЫВАНИЕ ДЕНЕГ' : 'MONEY LAUNDERING'}</h1>
            <p class="desc">${gameState.lang === 'ru' ? 'Сбалансируйте счета. Не дайте налоговой вас поплавить!' : 'Balance the accounts. Don\'t let the IRS catch you!'}</p>
            <div class="laundry-balance">
                <div class="scale-bar"><div id="scale-cursor"></div></div>
                <div class="controls">
                    <button class="btn-secondary" id="lax-minus">-</button>
                    <button class="btn-secondary" id="lax-plus">+</button>
                </div>
            </div>
            <div class="timer-countdown" id="laundry-timer">15</div>
        </div>
    `;

    let balance = 50;
    const cursor = document.getElementById('scale-cursor');
    const updateScale = () => { if (cursor) cursor.style.left = balance + '%'; };

    document.getElementById('lax-plus').onclick = () => { balance = Math.min(100, balance + 10); updateScale(); playSound('click'); };
    document.getElementById('lax-minus').onclick = () => { balance = Math.max(0, balance - 10); updateScale(); playSound('click'); };

    const noise = setInterval(() => {
        balance += (Math.random() - 0.5) * 15;
        if (balance < 0 || balance > 100) {
            flashScreen();
            balance = 50;
        }
        updateScale();
    }, 200);

    let timeLeft = 15;
    const timer = setInterval(() => {
        timeLeft--;
        const tDisp = document.getElementById('laundry-timer');
        if (tDisp) tDisp.innerText = timeLeft;
        if (timeLeft <= 0 || gameState.screen !== 'game-laundry') {
            clearInterval(noise);
            clearInterval(timer);
            if (timeLeft <= 0) {
                const score = 100 - Math.abs(50 - balance);
                gameState.player.score += Math.floor(score * 5);
                nextStep();
            }
        }
    }, 1000);
}

// Act III: Game 6 - Wiretap
function initWiretapGame() {
    const container = document.getElementById('game-wiretap');
    if (!container) return;
    container.innerHTML = `
        <div class="game-container wiretap-bg">
            <h1 class="act-title">${gameState.lang === 'ru' ? 'ПРОСЛУШКА' : 'THE WIRETAP'}</h1>
            <p class="desc">${gameState.lang === 'ru' ? 'Слушайте шум. Поймайте частоту конкурентов.' : 'Listen to the noise. Catch the rival frequency.'}</p>
            <div class="radio-tuner">
                <input type="range" id="radio-freq" min="0" max="100" value="0">
                <div id="signal-strength">SIGNAL: 0%</div>
                <div id="wave-display" class="voice-waves"><span></span><span></span><span></span></div>
            </div>
        </div>
    `;

    const target = Math.random() * 100;
    const tuner = document.getElementById('radio-freq');
    const signal = document.getElementById('signal-strength');
    const waves = document.getElementById('wave-display');
    if (waves) waves.classList.remove('hidden');

    tuner.oninput = () => {
        const dist = Math.abs(tuner.value - target);
        const strength = Math.max(0, 100 - dist * 5);
        signal.innerText = `SIGNAL: ${Math.floor(strength)}%`;
        signal.style.color = `rgb(${Math.floor(255 - strength * 2.5)}, ${Math.floor(strength * 2.5)}, 0)`;

        if (strength > 98) {
            playSound('radio-on');
            flashScreen();
            tuner.disabled = true;
            setTimeout(() => nextStep(), 1500);
        }
    };
}

// Act IV: Game 7 - Evidence Disposal
function initEvidenceGame() {
    const container = document.getElementById('game-evidence');
    if (!container) return;
    container.innerHTML = `
        <div class="game-container evidence-bg">
            <h1 class="act-title">${gameState.lang === 'ru' ? 'УЛИКИ' : 'EVIDENCE'}</h1>
            <p class="desc">${gameState.lang === 'ru' ? 'Избавьтесь от пистолета! Быстро!' : 'Get rid of the gun! Fast!'}</p>
            <div class="disposal-pit" id="pit">
                <img src="assets/revolver.png" id="evidence-gun" style="cursor:grab; width: 80px;">
            </div>
        </div>
    `;

    const gun = document.getElementById('evidence-gun');
    const pit = document.getElementById('pit');

    gun.onmousedown = (e) => {
        const move = (ev) => {
            gun.style.position = 'fixed';
            gun.style.left = (ev.clientX - 40) + 'px';
            gun.style.top = (ev.clientY - 40) + 'px';

            const pitRect = pit.getBoundingClientRect();
            if (ev.clientX > pitRect.left && ev.clientX < pitRect.right &&
                ev.clientY > pitRect.top && ev.clientY < pitRect.bottom) {
                gun.remove();
                playSound('body-fall');
                flashScreen();
                document.removeEventListener('mousemove', move);
                setTimeout(() => nextStep(), 1500);
            }
        };
        document.addEventListener('mousemove', move);
        document.onmouseup = () => document.removeEventListener('mousemove', move);
    };
}

// Act V: Final Stand
function initFinalStand() {
    const container = document.getElementById('game-final-stand');
    if (!container) return;
    container.innerHTML = `
        <div class="game-container final-stand-bg">
            <h1 class="act-title">${gameState.lang === 'ru' ? 'ПОСЛЕДНИЙ РУБЕЖ' : 'FINAL STAND'}</h1>
            <p class="desc">${gameState.lang === 'ru' ? 'Они окружают! Отстреливайся (10 целей)!' : 'They are surrounding us! Fire back (10 targets)!'}</p>
            <div id="target-area" style="position:relative; width:100%; height:400px; overflow:hidden; border: 1px solid #333;"></div>
        </div>
    `;

    const area = document.getElementById('target-area');
    let targetsHit = 0;

    const spawnTarget = () => {
        if (gameState.screen !== 'game-final-stand' || targetsHit >= 10) return;
        const t = document.createElement('div');
        t.className = 'shadow-target';
        t.style.left = Math.random() * 90 + '%';
        t.style.top = Math.random() * 80 + '%';
        area.appendChild(t);

        t.onclick = (e) => {
            targetsHit++;
            createParticles('spark', e.clientX, e.clientY, 10);
            playSound('gunshot');
            t.remove();
            if (targetsHit >= 10) {
                setTimeout(() => nextStep(), 1000);
            }
        };

        setTimeout(() => { if (t.parentNode) t.remove(); }, 2000);
        setTimeout(spawnTarget, 700);
    };

    spawnTarget();
}
