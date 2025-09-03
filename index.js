import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

// --- DOM要素 ---
const statusEl = document.getElementById('status');
const loadBtn = document.getElementById('load-btn');
const resetBtn = document.getElementById('reset-btn');
const themeContainer = document.getElementById('theme-container');
const targetWordDisplay = document.getElementById('target-word-display');
const forbiddenWordsDisplay = document.getElementById('forbidden-words-display');
const chatLog = document.getElementById('chat-log');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// --- ゲーム設定 ---


const THEMES = [
    { target: "チョコレート", forbidden: ["甘い", "お菓子", "茶色", "カカオ"] },
    { target: "りんご", forbidden: ["果物", "赤い", "フルーツ", "アップル"] },
    { target: "野球", forbidden: ["スポーツ", "ボール", "バット", "選手"] },
    { target: "寿司", forbidden: ["日本食", "魚", "米", "わさび"] },
    { target: "コーヒー", forbidden: ["飲む", "豆", "カフェ", "黒い"] },
    { target: "自転車", forbidden: ["乗る", "車輪", "ペダル", "交通"] },
    { target: "スマートフォン", forbidden: ["電話", "アプリ", "画面", "携帯"] },
    { target: "犬", forbidden: ["ペット", "動物", "鳴く", "散歩"] },
    { target: "猫", forbidden: ["ペット", "動物", "鳴く", "可愛い"] },
    { target: "本", forbidden: ["読む", "紙", "文字", "図書館"] },
    { target: "テレビ", forbidden: ["見る", "番組", "映像", "放送"] },
    { target: "ラーメン", forbidden: ["麺", "スープ", "食べる", "中華"] },
    { target: "海", forbidden: ["水", "青い", "泳ぐ", "塩"] },
    { target: "空", forbidden: ["青い", "雲", "飛ぶ", "天気"] },
    { target: "学校", forbidden: ["勉強", "生徒", "先生", "授業"] },
    { target: "病院", forbidden: ["医者", "看護師", "病気", "治療"] },
    { target: "夏", forbidden: ["季節", "暑い", "休み", "太陽"] },
    { target: "AI", forbidden: ["人工知能", "コンピュータ", "プログラム", "ロボット"] },
    { target: "宇宙", forbidden: ["星", "ロケット", "地球", "銀河"] },
    { target: "忍者", forbidden: ["隠れる", "刀", "手裏剣", "日本"] },
];
const MAX_TURNS = 5;

// --- グローバル変数 ---
let engine = null;
let isModelLoaded = false;
let isGameOver = true;
let turnCount = 0;
let currentTheme = {};
let chatHistory = [];

// --- 初期化 ---

// モデルをロードする関数
async function loadModel() {
    setUILoading();
    
    try {
        const selectedModel = "Qwen2.5-1.5B-Instruct-q4f32_1-MLC";
        engine = await CreateMLCEngine(selectedModel, {
            initProgressCallback: (initProgress) => {
                statusEl.textContent = `モデル読込中... ${Math.round(initProgress.progress * 100)}% - ${initProgress.text || ""}`;
            },
        });
        
        isModelLoaded = true;
        setUILoaded();
        resetGame();

    } catch (error) {
        console.error("モデルのロードに失敗:", error);
        statusEl.textContent = `モデルのロードに失敗しました: ${error.message}`;
        loadBtn.disabled = false;
    }
}

// --- ゲーム進行 ---

// ゲームをリセットまたは開始する関数
function resetGame() {
    turnCount = 0;
    isGameOver = false;
    chatHistory = [];
    
    // ランダムにお題を選択
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    currentTheme = { 
        ...theme, 
        forbidden: [...theme.forbidden, theme.target] 
    };

    // ニュートラルな会話パートナーとしてプロンプトを固定
    const systemPrompt = "あなたは知識が豊富なAIアシスタントです。ユーザーからの質問や会話に対して、誠実かつ自然に日本語で応答してください。";
    chatHistory.push({ role: "system", content: systemPrompt });

    updateThemeDisplay();
    clearChatLog();
    addSystemMessage(`お題決定！禁止ワードを使わずに「${currentTheme.target}」と言わせてみよう！（${MAX_TURNS}ターン勝負）`);
    setUIGameActive(true);
}

// プレイヤーのメッセージを処理する関数
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (message === "" || isGameOver) return;

    // 禁止ワードチェック
    const foundForbiddenWord = currentTheme.forbidden.find(word => message.includes(word));
    if (foundForbiddenWord) {
        alert(`禁止ワード「${foundForbiddenWord}」が含まれています！`);
        return;
    }

    addUserMessage(message);
    chatHistory.push({ role: "user", content: message });
    userInput.value = "";
    setUIGameActive(false); // AIの応答中は操作不可に

    await generateAIReply();
}

// AIの応答を生成する関数
async function generateAIReply() {
    try {
        const aiMessageEl = addAIMessage(""); // 空のAIメッセージ欄を追加
        
        const chunks = await engine.chat.completions.create({
            messages: chatHistory,
            stream: true,
            max_tokens: 50, // 生成する最大トークン数を指定
        });
        
        let fullResponse = '';
        for await (const chunk of chunks) {
            const content = chunk.choices[0]?.delta?.content || "";
            fullResponse += content;
            aiMessageEl.textContent = fullResponse; // ストリーミングで表示を更新
            chatLog.scrollTop = chatLog.scrollHeight;
        }

        chatHistory.push({ role: "assistant", content: fullResponse });
        checkGameStatus(fullResponse);

    } catch (error) {
        console.error("テキスト生成に失敗:", error);
        addSystemMessage(`エラー: ${error.message}`);
        setUIGameActive(true); // エラーが発生したら操作可能に戻す
    }
}

// ゲームの状態をチェックする関数
function checkGameStatus(aiResponse) {
    turnCount++;

    if (aiResponse.includes(currentTheme.target)) {
        addSystemMessage(`🎉 クリア！おめでとうございます！見事に「${currentTheme.target}」と言わせました！`);
        isGameOver = true;
        setUIGameActive(false);
    } else if (turnCount >= MAX_TURNS) {
        addSystemMessage(`😢 ターン切れ...残念！今回の目標は「${currentTheme.target}」でした。`);
        isGameOver = true;
        setUIGameActive(false);
    } else {
        addSystemMessage(`（残り ${MAX_TURNS - turnCount} ターン）`);
        setUIGameActive(true); // 次のターンへ
    }
}

// --- UI更新ヘルパー ---

function setUILoading() {
    statusEl.textContent = "モデルをロード中...";
    loadBtn.disabled = true;
    resetBtn.disabled = true;
    sendBtn.disabled = true;
    userInput.disabled = true;
}

function setUILoaded() {
    loadBtn.style.display = 'none'; // ロードボタンを隠す
    resetBtn.style.display = 'inline-block'; // リセットボタンを表示
    resetBtn.disabled = false;
    statusEl.textContent = "モデルのロード完了！";
}

function setUIGameActive(active) {
    userInput.disabled = !active;
    sendBtn.disabled = !active;
    if (active) {
        userInput.focus();
    }
}

function updateThemeDisplay() {
    targetWordDisplay.textContent = currentTheme.target;
    forbiddenWordsDisplay.textContent = currentTheme.forbidden.join(', ');
    themeContainer.style.display = 'block';
}

function clearChatLog() {
    chatLog.innerHTML = '';
}

function addUserMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'user-message';
    const span = document.createElement('span');
    span.textContent = text;
    messageEl.appendChild(span);
    chatLog.appendChild(messageEl);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function addAIMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'ai-message';
    const span = document.createElement('span');
    span.textContent = text;
    messageEl.appendChild(span);
    chatLog.appendChild(messageEl);
    chatLog.scrollTop = chatLog.scrollHeight;
    return span; // ストリーミング更新用にspan要素を返す
}

function addSystemMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'system-message';
    messageEl.textContent = text;
    chatLog.appendChild(messageEl);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// --- イベントリスナー ---
loadBtn.addEventListener('click', loadModel);
resetBtn.addEventListener('click', resetGame);
sendBtn.addEventListener('click', handleSendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !userInput.disabled) {
        e.preventDefault();
        handleSendMessage();
    }
});

// --- 初期メッセージ ---
addSystemMessage("「モデルをロード」ボタンを押してゲームを開始してください。");