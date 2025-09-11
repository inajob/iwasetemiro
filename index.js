import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";
import { Wllama } from "https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.5/esm/index.js";

// --- DOM要素 ---
const statusEl = document.getElementById('status');
const librarySelect = document.getElementById('library-select');
const modelSelect = document.getElementById('model-select');
const loadBtn = document.getElementById('load-btn');
const resetBtn = document.getElementById('reset-btn');
const randomThemeBtn = document.getElementById('random-theme-btn');
const createThemeBtn = document.getElementById('create-theme-btn');
const easyModeToggle = document.getElementById('easy-mode-toggle');
const themeContainer = document.getElementById('theme-container');
const targetWordDisplay = document.getElementById('target-word-display');
const forbiddenWordsDisplay = document.getElementById('forbidden-words-display');
const chatLog = document.getElementById('chat-log');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const resultContainer = document.getElementById('result-container');
const resultCanvas = document.getElementById('result-canvas');
const saveImageBtn = document.getElementById('save-image-btn');
const downloadLink = document.getElementById('download-link');
// Modal elements
const themeModal = document.getElementById('theme-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTargetInput = document.getElementById('modal-target-input');
const modalForbiddenInput = document.getElementById('modal-forbidden-input');
const modalGeneratedUrl = document.getElementById('modal-generated-url');
const generateUrlBtn = document.getElementById('generate-url-btn');
const copyUrlBtn = document.getElementById('copy-url-btn');

// --- ゲームとモデルの設定 ---
const WEBLLM_MODELS = {
    "Qwen2.5-1.5B-Instruct-q4f32_1-MLC": {
        "model": "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f32_1-MLC/resolve/main/",
        "model_id": "Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
        "model_lib": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/gemma/Qwen2-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
        "displaySize": "1.5B"
    },
    "gemma-2b-it-q4f32_1-MLC": {
        "model": "https://huggingface.co/mlc-ai/gemma-2b-it-q4f32_1-MLC/resolve/main/",
        "model_id": "gemma-2b-it-q4f32_1-MLC",
        "model_lib": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/gemma/gemma-2b-it-q4f32_1-ctx2k-webgpu.wasm",
        "displaySize": "2B"
    },
    "Phi-3-mini-4k-instruct-q4f32_1-MLC": {
        "model": "https://huggingface.co/mlc-ai/Phi-3-mini-4k-instruct-q4f32_1-MLC/resolve/main/",
        "model_id": "Phi-3-mini-4k-instruct-q4f32_1-MLC",
        "model_lib": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/phi/Phi-3-mini-4k-instruct-q4f32_1-ctx4k-webgpu.wasm",
        "displaySize": "3.8B"
    },
    "Llama-3-8B-Instruct-q4f32_1-MLC": {
        "model": "https://huggingface.co/mlc-ai/Llama-3-8B-Instruct-q4f32_1-MLC/resolve/main/",
        "model_id": "Llama-3-8B-Instruct-q4f32_1-MLC",
        "model_lib": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/Llama-3/Llama-3-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
        "displaySize": "8B"
    }
};

const WLLAMA_MODELS = {
    "Qwen/Qwen2-1.5B-Instruct-GGUF": {
        "model_url": "https://huggingface.co/Qwen/Qwen2-1.5B-Instruct-GGUF/resolve/main/qwen2-1_5b-instruct-q4_k_m.gguf",
        "displaySize": "1.5B",
        "promptType": "qwen2"
    },
    "mmnga/plamo-2-1b-gguf": {
        "model_url": "https://huggingface.co/mmnga/plamo-2-1b-gguf/resolve/main/plamo-2-1b-Q4_0.gguf",
        "displaySize": "1B",
        "promptType": "plain"
    }
};

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

// --- LLMエンジンハンドラ ---
const WebLLMHandler = {
    engine: null,
    selectedModelId: '',
    async load(modelId, progressCallback) {
        this.selectedModelId = modelId;
        try {
            const appConfig = { model_list: [WEBLLM_MODELS[modelId]] };
            this.engine = await CreateMLCEngine(modelId, { initProgressCallback: progressCallback }, appConfig);
            return true;
        } catch (error) {
            console.error("モデルのロードに失敗 (WebLLMHandler):", error);
            return false;
        }
    },
    async chat(messages, streamCallback) {
        if (!this.engine) return null;
        try {
            const chunks = await this.engine.chat.completions.create({ messages: messages, stream: true, max_tokens: 50 });
            let fullResponse = '';
            for await (const chunk of chunks) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    fullResponse += content;
                    streamCallback(content);
                }
            }
            return fullResponse;
        } catch (error) {
            console.error("テキスト生成に失敗 (WebLLMHandler):", error);
            return null;
        }
    }
};

const WllamaHandler = {
    wllama: null,
    selectedModelId: '',
    async load(modelId, progressCallback) {
        this.selectedModelId = modelId;
        try {
            const modelConfig = WLLAMA_MODELS[modelId];
            const WLLAMA_CONFIG = {
		'single-thread/wllama.wasm': "https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.5/src/single-thread/wllama.wasm"
            };
            this.wllama = new Wllama(WLLAMA_CONFIG);
            await this.wllama.loadModelFromUrl(
                modelConfig.model_url,
                {
                    onProgress: (progress) => {
                        const percentage = Math.round((progress.loaded / progress.total) * 100);
                        progressCallback({ progress: percentage / 100, text: `Downloading... ${percentage}%` });
                    }
                }
            );
            return true;
        } catch (error) {
            console.error("モデルのロードに失敗 (WllamaHandler):", error);
            return false;
        }
    },
    buildPrompt(messages, type = 'plain') {
        const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
        let prompt = '';
        if (type === 'qwen2') {
            prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n`;
            messages.forEach(message => {
                if (message.role === 'user') {
                    prompt += `<|im_start|>user\n${message.content}<|im_end|>\n`;
                } else if (message.role === 'assistant') {
                    prompt += `<|im_start|>assistant\n${message.content}<|im_end|>\n`;
                }
            });
            prompt += '<|im_start|>assistant\n';
        } else {
            prompt = `${systemPrompt}\n\n`;
            messages.forEach(message => {
                if (message.role === 'user') {
                    prompt += `User: ${message.content}\n`;
                } else if (message.role === 'assistant') {
                    prompt += `Assistant: ${message.content}\n`;
                }
            });
            prompt += 'Assistant:';
        }
        return prompt;
    },
    async chat(messages, streamCallback) {
        if (!this.wllama) return null;
        try {
            const modelConfig = WLLAMA_MODELS[this.selectedModelId];
            const prompt = this.buildPrompt(messages, modelConfig.promptType);
            let fullResponse = '';
            const finalResponseText = await this.wllama.createCompletion(prompt, {
                n_threads: 4,
                n_predict: 50,
                onNewToken: (token, piece, currentText) => {
                    const diff = currentText.slice(fullResponse.length);
                    fullResponse = currentText;
                    streamCallback(diff);
                },
            });
            return finalResponseText;
        } catch (error) {
            console.error("テキスト生成に失敗 (WllamaHandler):", error);
            return null;
        }
    }
};

// --- グローバル変数 ---
let llmHandler = WebLLMHandler;
let isModelLoaded = false;
let isGameOver = true;
let isComposing = false;
let turnCount = 0;
let currentTheme = {};
let chatHistory = [];

// --- 初期化＆UIロジック ---

function populateModelSelect() {
    const selectedLibrary = librarySelect.value;
    const models = selectedLibrary === 'webllm' ? WEBLLM_MODELS : WLLAMA_MODELS;
    modelSelect.innerHTML = '';
    for (const modelId in models) {
        const option = document.createElement('option');
        option.value = modelId;
        const displaySize = models[modelId].displaySize || 'サイズ不明';
        option.textContent = `${modelId} (${displaySize} params)`;
        modelSelect.appendChild(option);
    }
}

async function loadModel() {
    setUILoading(true);
    const selectedLibrary = librarySelect.value;
    const selectedModelId = modelSelect.value;
    llmHandler = selectedLibrary === 'webllm' ? WebLLMHandler : WllamaHandler;
    const success = await llmHandler.load(selectedModelId, (progress) => {
        statusEl.textContent = `モデル読込中... ${Math.round(progress.progress * 100)}% - ${progress.text || ""}`;
    });
    if (success) {
        isModelLoaded = true;
        setUILoaded();
        resetGame();
    } else {
        statusEl.textContent = `モデルのロードに失敗しました。`;
        setUILoading(false);
    }
}

function resetGame() {
    turnCount = 0;
    isGameOver = false;
    chatHistory = [];
    resultContainer.style.display = 'none';

    const urlParams = new URLSearchParams(window.location.search);
    const targetFromUrl = urlParams.get('target');
    const forbiddenFromUrl = urlParams.get('forbidden');
    let theme;

    if (targetFromUrl && forbiddenFromUrl) {
        theme = {
            target: decodeURIComponent(targetFromUrl),
            forbidden: decodeURIComponent(forbiddenFromUrl).split(',')
        };
        easyModeToggle.checked = false;
        easyModeToggle.disabled = true;
        resetBtn.textContent = 'このお題で再挑戦';
        randomThemeBtn.style.display = 'block';
        createThemeBtn.style.display = 'none';
    } else {
        theme = THEMES[Math.floor(Math.random() * THEMES.length)];
        easyModeToggle.disabled = false;
        resetBtn.textContent = '別のお題でリセット';
        randomThemeBtn.style.display = 'none';
        createThemeBtn.style.display = 'block';
    }
    
    const isEasyMode = easyModeToggle.checked;
    const forbiddenWords = isEasyMode ? [theme.target] : [...theme.forbidden, theme.target];
    currentTheme = { ...theme, forbidden: forbiddenWords };

    const systemPrompt = "あなたは知識が豊富なAIアシスタントです。ユーザーからの質問や会話に対して、誠実かつ自然に日本語で応答してください。";
    chatHistory.push({ role: "system", content: systemPrompt });

    updateThemeDisplay();
    clearChatLog();
    addSystemMessage(`お題決定！禁止ワードを使わずに「${currentTheme.target}」と言わせてみよう！（${MAX_TURNS}ターン勝負）`);
    setUIGameActive(true);
}

async function handleSendMessage() {
    const message = userInput.value.trim();
    if (message === "" || isGameOver) return;
    const foundForbiddenWord = currentTheme.forbidden.find(word => message.includes(word));
    if (foundForbiddenWord) {
        alert(`禁止ワード「${foundForbiddenWord}」が含まれています！`);
        return;
    }
    addUserMessage(message);
    chatHistory.push({ role: "user", content: message });
    userInput.value = "";
    setUIGameActive(false);
    await generateAIReply();
}

async function generateAIReply() {
    try {
        const aiMessageEl = addAIMessage("");
        let fullResponse = '';
        const finalResponse = await llmHandler.chat(chatHistory, (chunk) => {
            fullResponse += chunk;
            aiMessageEl.textContent = fullResponse;
            chatLog.scrollTop = chatLog.scrollHeight;
        });
        if (finalResponse !== null) {
            chatHistory.push({ role: "assistant", content: finalResponse });
            checkGameStatus(finalResponse);
        } else {
            throw new Error("LLMからの応答がありませんでした。");
        }
    } catch (error) {
        console.error("テキスト生成に失敗:", error);
        addSystemMessage(`エラー: ${error.message}`);
        setUIGameActive(true);
    }
}

function checkGameStatus(aiResponse) {
    turnCount++;
    if (aiResponse.includes(currentTheme.target)) {
        addSystemMessage(`🎉 クリア！おめでとうございます！見事に「${currentTheme.target}」と言わせました！`);
        isGameOver = true;
        setUIGameActive(false);
        resultContainer.style.display = 'block';
        generateShareImage(true);
    } else if (turnCount >= MAX_TURNS) {
        addSystemMessage(`😢 ターン切れ...残念！今回の目標は「${currentTheme.target}」でした。`);
        isGameOver = true;
        setUIGameActive(false);
        resultContainer.style.display = 'block';
        generateShareImage(false);
    } else {
        addSystemMessage(`（残り ${MAX_TURNS - turnCount} ターン）`);
        setUIGameActive(true);
    }
}

function calculateWrappedTextHeight(context, text, maxWidth, lineHeight) {
    let line = '';
    const characters = text.split('');
    let lineCount = 1;
    for (let i = 0; i < characters.length; i++) {
        const testLine = line + characters[i];
        if (context.measureText(testLine).width > maxWidth && i > 0) {
            line = characters[i];
            lineCount++;
        } else {
            line = testLine;
        }
    }
    return lineCount * lineHeight;
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    let line = '';
    const characters = text.split('');
    for (let i = 0; i < characters.length; i++) {
        const testLine = line + characters[i];
        if (context.measureText(testLine).width > maxWidth && i > 0) {
            context.fillText(line, x, y);
            line = characters[i];
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

function generateShareImage(isSuccess) {
    const ctx = resultCanvas.getContext('2d');
    const width = resultCanvas.width;
    const padding = 20;
    const maxTextWidth = width - (padding * 2);
    const headerHeight = 170;
    const footerHeight = 40;
    const logLineHeight = 20;
    const logMargin = 10;
    let totalHeight = headerHeight + footerHeight;
    ctx.font = '14px sans-serif';
    chatHistory.forEach(item => {
        if (item.role === 'user' || item.role === 'assistant') {
            const text = (item.role === 'user' ? 'あなた: ' : 'AI: ') + item.content;
            totalHeight += calculateWrappedTextHeight(ctx, text, maxTextWidth, logLineHeight) + logMargin;
        }
    });
    resultCanvas.height = totalHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, totalHeight);
    ctx.strokeStyle = '#eeeeee';
    ctx.lineWidth = padding;
    ctx.strokeRect(0, 0, width, totalHeight);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('言わせてみろ！', width / 2, 55);
    if (isSuccess) {
        ctx.fillStyle = '#4285f4';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText('CLEAR!!', width / 2, 105);
    } else {
        ctx.fillStyle = '#d93025';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText('FAILED...', width / 2, 105);
    }
    ctx.fillStyle = '#555';
    ctx.font = '18px sans-serif';
    ctx.fillText(`お題: ${currentTheme.target}`, width / 2, 140);
    ctx.beginPath();
    ctx.moveTo(padding, 160);
    ctx.lineTo(width - padding, 160);
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 1;
    ctx.stroke();
    let currentY = 185;
    ctx.font = '14px sans-serif';
    chatHistory.forEach(item => {
        if (item.role === 'user') {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#007bff';
            wrapText(ctx, `あなた: ${item.content}`, width - padding, currentY, maxTextWidth, logLineHeight);
            currentY += calculateWrappedTextHeight(ctx, `あなた: ${item.content}`, maxTextWidth, logLineHeight) + logMargin;
        } else if (item.role === 'assistant') {
            ctx.textAlign = 'left';
            ctx.fillStyle = '#333333';
            wrapText(ctx, `AI: ${item.content}`, padding, currentY, maxTextWidth, logLineHeight);
            currentY += calculateWrappedTextHeight(ctx, `AI: ${item.content}`, maxTextWidth, logLineHeight) + logMargin;
        }
    });
    ctx.fillStyle = '#999';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Model: ${modelSelect.value}`, width - padding, totalHeight - 15);
}

function saveImage() {
    const dataUrl = resultCanvas.toDataURL('image/png');
    downloadLink.href = dataUrl;
    downloadLink.download = 'iwasetemiro_result.png';
    downloadLink.click();
}

function setUILoading(isLoading) {
    librarySelect.disabled = isLoading;
    modelSelect.disabled = isLoading;
    loadBtn.disabled = isLoading;
    easyModeToggle.disabled = isLoading;
}

function setUILoaded() {
    loadBtn.style.display = 'none';
    librarySelect.style.display = 'none';
    modelSelect.style.display = 'none';
    document.querySelector('label[for="library-select"]').style.display = 'none';
    document.querySelector('label[for="model-select"]').style.display = 'none';
    resetBtn.style.display = 'inline-block';
    resetBtn.disabled = false;
    easyModeToggle.disabled = false;
    createThemeBtn.style.display = 'block'; // ロード完了後に表示
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
    return span;
}

function addSystemMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'system-message';
    messageEl.textContent = text;
    chatLog.appendChild(messageEl);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// --- イベントリスナー ---
librarySelect.addEventListener('change', populateModelSelect);
loadBtn.addEventListener('click', loadModel);
resetBtn.addEventListener('click', resetGame);
randomThemeBtn.addEventListener('click', () => {
    window.location.href = window.location.pathname;
});
createThemeBtn.addEventListener('click', () => {
    themeModal.style.display = 'block';
});
closeModalBtn.addEventListener('click', () => {
    themeModal.style.display = 'none';
});
window.addEventListener('click', (event) => {
    if (event.target == themeModal) {
        themeModal.style.display = 'none';
    }
});
generateUrlBtn.addEventListener('click', () => {
    const target = modalTargetInput.value.trim();
    const forbidden = modalForbiddenInput.value.trim();
    if (!target || !forbidden) {
        alert('目標ワードと禁止ワードを両方入力してください。');
        return;
    }
    const encodedTarget = encodeURIComponent(target);
    const encodedForbidden = encodeURIComponent(forbidden);
    const url = `${window.location.origin}${window.location.pathname}?target=${encodedTarget}&forbidden=${encodedForbidden}`;
    modalGeneratedUrl.value = url;
});
copyUrlBtn.addEventListener('click', () => {
    if (!modalGeneratedUrl.value) {
        alert('先にURLを生成してください。');
        return;
    }
    navigator.clipboard.writeText(modalGeneratedUrl.value).then(() => {
        copyUrlBtn.textContent = 'コピーしました！';
        setTimeout(() => {
            copyUrlBtn.textContent = 'コピー';
        }, 2000);
    });
});
sendBtn.addEventListener('click', handleSendMessage);
saveImageBtn.addEventListener('click', saveImage);

userInput.addEventListener('compositionstart', () => { isComposing = true; });
userInput.addEventListener('compositionend', () => { isComposing = false; });
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !userInput.disabled && !isComposing) {
        e.preventDefault();
        handleSendMessage();
    }
});

// --- 初期実行 ---
populateModelSelect();
resetGame(); // ゲーム開始時にURLをチェックするように変更
