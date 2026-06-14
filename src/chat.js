import { weather } from './weather.js';
import { llm } from './llm.js';

export const chat = {
  historyContainer: null,
  inputEl: null,
  sendBtn: null,
  audioCtx: null,
  _llmStatusEl: null,
  llmHistory: [],
  
  /** Play a short chirpy melody using Web Audio API */
  playMusic() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = this.audioCtx;
    
    // 3 distinct procedural melodies and synth styles
    const melodies = [
      // Melody 1: Cozy Garden Lullaby (Warm Triangle Flute)
      {
        type: 'triangle',
        notes: [
          { freq: 523.25, t: 0.00, dur: 0.24 }, // C5
          { freq: 659.25, t: 0.24, dur: 0.24 }, // E5
          { freq: 783.99, t: 0.48, dur: 0.24 }, // G5
          { freq: 880.00, t: 0.72, dur: 0.24 }, // A5
          { freq: 783.99, t: 0.96, dur: 0.24 }, // G5
          { freq: 1046.5, t: 1.20, dur: 0.60 }, // C6
        ]
      },
      // Melody 2: Retro 8-Bit Jump (Square Wave Chiptune)
      {
        type: 'square',
        notes: [
          { freq: 523.25, t: 0.00, dur: 0.08 }, // C5
          { freq: 587.33, t: 0.08, dur: 0.08 }, // D5
          { freq: 659.25, t: 0.16, dur: 0.08 }, // E5
          { freq: 783.99, t: 0.24, dur: 0.08 }, // G5
          { freq: 659.25, t: 0.32, dur: 0.08 }, // E5
          { freq: 783.99, t: 0.40, dur: 0.08 }, // G5
          { freq: 1046.5, t: 0.48, dur: 0.16 }, // C6
        ]
      },
      // Melody 3: Sparkling Chimes (Sine Wave Bells)
      {
        type: 'sine',
        notes: [
          { freq: 880.00, t: 0.00, dur: 0.20 }, // A5
          { freq: 987.77, t: 0.20, dur: 0.20 }, // B5
          { freq: 1174.7, t: 0.40, dur: 0.20 }, // D6
          { freq: 1318.5, t: 0.60, dur: 0.20 }, // E6
          { freq: 1760.0, t: 0.80, dur: 0.40 }, // A6
        ]
      }
    ];
    
    const choice = melodies[Math.floor(Math.random() * melodies.length)];

    choice.notes.forEach(({ freq, t, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = choice.type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      // Square waves are naturally much louder, so we lower the peak gain for comfort
      const peakGain = choice.type === 'square' ? 0.05 : 0.22;
      gain.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur - 0.02);

      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur);
    });

    // Spawn floating music notes on the plant
    const plantContainer = document.getElementById('plant-container');
    if (plantContainer) {
      ['🎵','🎶','♪','🎵'].forEach((note, i) => {
        setTimeout(() => {
          const el = document.createElement('span');
          el.className = 'music-note';
          el.textContent = note;
          el.style.left = (30 + Math.random() * 40) + '%';
          el.style.top  = (20 + Math.random() * 30) + '%';
          plantContainer.appendChild(el);
          setTimeout(() => el.remove(), 1500);
        }, i * 300);
      });
    }
  },

  init(state) {
    this.historyContainer = document.getElementById('chat-history');
    this.inputEl = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-btn');
    this._llmStatusEl = document.getElementById('llm-status');

    this.sendBtn.addEventListener('click', () => this.handleUserMessage(state));
    this.inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleUserMessage(state);
    });

    // Start WebLLM loading in background (non-blocking)
    if (navigator.gpu) {
      this._setLlmStatus('loading', '⚡ Loading AI...');
      llm.onProgress = (pct, text) => {
        this._setLlmStatus('loading', `⚡ ${pct}%`);
      };
      llm.onReady = () => {
        this._setLlmStatus('ready', '🧠 AI Ready');
        this.systemMessage(`✨ Local AI model loaded! I can now think for myself. Powered by ${llm.engine?.modelId ?? 'WebLLM'}.`);
      };
      llm.init();
    } else {
      this._setLlmStatus('mock', '🤖 Mock Mode');
    }
  },

  _setLlmStatus(state, text) {
    if (!this._llmStatusEl) return;
    this._llmStatusEl.textContent = text;
    this._llmStatusEl.dataset.state = state;
  },

  handleUserMessage(state) {
    const msg = this.inputEl.value.trim();
    if (!msg) return;

    // Add User Message
    this.appendMessage('User', msg, 'user');
    this.inputEl.value = '';

    // Mock WebLLM processing
    setTimeout(() => {
      this.generateResponse(msg, state);
    }, 300);
  },

  appendMessage(sender, text, type = 'system') {
    const div = document.createElement('div');
    div.className = `chat-message ${type}`;
    const avatar = sender === 'User' ? '👤' : '🌱';
    div.innerHTML = `
      <span class="chat-avatar">${avatar}</span>
      <div class="chat-bubble">${text}</div>
    `;
    this.historyContainer.appendChild(div);
    this.historyContainer.scrollTop = this.historyContainer.scrollHeight;

    // Cap history at 40 messages to prevent memory leak
    const messages = this.historyContainer.querySelectorAll('.chat-message');
    if (messages.length > 40) messages[0].remove();

    // Add to LLM history (only actual messages, not system notifications)
    if (type !== 'system' || sender !== 'System') {
      this.llmHistory.push({
        role: sender === 'User' ? 'user' : 'assistant',
        content: text
      });
      // Keep last 4 interactions (8 messages) for context memory
      if (this.llmHistory.length > 8) this.llmHistory.shift();
    }
  },

  showThinking(name) {
    const div = document.createElement('div');
    div.className = 'chat-message system thinking-msg';
    div.innerHTML = `
      <span class="chat-avatar">🌱</span>
      <div class="chat-bubble thinking-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
    `;
    this.historyContainer.appendChild(div);
    this.historyContainer.scrollTop = this.historyContainer.scrollHeight;
    return div;
  },

  systemMessage(text) {
    this.appendMessage('System', text, 'system');
  },

  async generateResponse(userMessage, state) {
    const { water, happiness, life, isWindowOpen } = state.data;
    const { isRaining } = weather;
    const name = state.data.name || 'Sprout';
    
    const systemPrompt = `You are ${name}, a living sentient plant in a browser tamagotchi game called Solstice Sprout.
Your stats: Water=${water.toFixed(0)}%, Happiness=${happiness.toFixed(0)}%, Life=${life.toFixed(0)}%.
Weather: ${isRaining ? 'Raining' : 'Clear'}. Window open: ${isWindowOpen}.
Personality: Witty, dramatic, slightly sarcastic, uses plant puns. Keep replies under 2 sentences.
Respond in English only. Never break character.`;

    // Show thinking indicator
    const thinkingEl = this.showThinking(name);

    // Try WebLLM first
    if (llm.isReady) {
      const aiReply = await llm.generate(systemPrompt, this.llmHistory, userMessage);
      thinkingEl.remove();
      if (aiReply) {
        this.appendMessage(name, aiReply, 'system');
        return;
      }
    } else {
      // Small delay for mock to feel natural
      await new Promise(r => setTimeout(r, 400));
      thinkingEl.remove();
    }

    const mock = this._mockResponse(userMessage, state);
    this.appendMessage(name, mock, 'system');
  },

  /** Curated mock responses when WebLLM is not available */
  _mockResponse(userMessage, state) {
    const { water, happiness, life, isWindowOpen } = state.data;
    const { isRaining } = weather;

    let reply = "Did you know 90% of my job is just sitting here looking cute? 💅";
    const isWaterAction = userMessage === "*waters the plant*";
    const isSunAction   = userMessage === "*sunbathes the plant*";
    const isFertilize   = userMessage === "*fertilizes the plant*";
    const isWeed        = userMessage === "*cleans the weeds*";
    const isHeal        = userMessage === "*heals the plant*";
    const isMusic       = userMessage === "*plays music*";
    
    const cleanMsg = userMessage.toLowerCase();
    
    // Check for questions about stats
    const asksAboutWater = cleanMsg.includes("water") || cleanMsg.includes("thirsty") || cleanMsg.includes("soif") || cleanMsg.includes("drink") || cleanMsg.includes("boire");
    const asksAboutHappiness = cleanMsg.includes("happy") || cleanMsg.includes("happiness") || cleanMsg.includes("sad") || cleanMsg.includes("mood") || cleanMsg.includes("humeur") || cleanMsg.includes("joie");
    const asksAboutHealth = cleanMsg.includes("health") || cleanMsg.includes("life") || cleanMsg.includes("sick") || cleanMsg.includes("malade") || cleanMsg.includes("how are you") || cleanMsg.includes("cv") || cleanMsg.includes("ça va") || cleanMsg.includes("ca va") || cleanMsg.includes("healthier");
    const asksAboutPetals = cleanMsg.includes("petal") || cleanMsg.includes("pétale") || cleanMsg.includes("flower") || cleanMsg.includes("fleur") || cleanMsg.includes("bloom");

    if (isMusic) {
      reply = "Oh I love this song! 🎵 Photosynthesizing to the beat!";
    } else if (isHeal) {
      reply = "Ouch! But also... thank you. I feel much better now. ✂️✨";
    } else if (isWeed) {
      reply = "Ah, finally! Those weeds were stealing all my nutrients. Good riddance! 🐛";
    } else if (isFertilize) {
      reply = state.data.fertilizer > 80
        ? "Ugh... too... much... food. I feel sick. 🤢 Please stop."
        : "Mmm, delicious nitrogen! I feel myself growing stronger! 🌱💪";
    } else if (state.data.isSick) {
      reply = "I feel awful... please use the medicine/pruners... 🥀";
    } else if (life < 30) {
      reply = "Tell my mom I loved her... and that you're a terrible gardener. 💀";
    } else if (water > 90) {
      reply = isSunAction
        ? "Oh wow, a tan! Evaporation feels amazing. I was getting pruney. 🏖️"
        : (isRaining && isWindowOpen
          ? "Bro, are you building an ark? CLOSE THE WINDOW! 🚣‍♂️"
          : "Waterboarding is illegal in most countries! Stop drowning me! 🫧☠️");
    } else if (water < 20) {
      reply = isSunAction
        ? "Are you trying to turn me into a raisin?! Water me, don't bake me! 🔥"
        : (isWaterAction ? "Finally! I was about to text my ex for some tears. 💧" : "*cough* Do I look like a cactus to you? Water me! 🌵");
    } else if (isWaterAction) {
      reply = "Glou glou glou... Ah, the good stuff. Straight from the tap? Fancy. 🍸🌿";
    } else if (isSunAction) {
      reply = "Praise the sun! ☀️ Photosynthesis time.";
    } else if (asksAboutWater) {
      if (water < 35) {
        reply = `I am parched! My water is down to ${water.toFixed(0)}%. Please water me before I turn into tumbleweed. 🌵💧`;
      } else if (water > 85) {
        reply = `I'm practically drowning at ${water.toFixed(0)}% water! No more drinks, please. 🚣‍♂️`;
      } else {
        reply = `My water level is a comfortable ${water.toFixed(0)}%. I'm doing great! 💧`;
      }
    } else if (asksAboutHappiness) {
      if (happiness < 40) {
        reply = `Honestly, I'm pretty sad right now (${happiness.toFixed(0)}% happiness). Play me some music or clear these weeds! 🎵`;
      } else if (happiness > 80) {
        reply = `I'm on cloud nine! ${happiness.toFixed(0)}% happy! Life is beautiful! 🌸✨`;
      } else {
        reply = `I'm reasonably happy (${happiness.toFixed(0)}%). Not too shabby! 😊`;
      }
    } else if (asksAboutHealth) {
      if (state.data.isSick) {
        reply = "I'm super sick! 🥀 Please prune my leaves and apply medicine (Heal).";
      } else if (life < 40) {
        reply = `I'm barely hanging on at ${life.toFixed(0)}% health... Please take care of me! 💀`;
      } else {
        reply = `I feel great! My health is at ${life.toFixed(0)}%. Let's survive until June 21st! ☀️`;
      }
    } else if (asksAboutPetals) {
      if (happiness < 20) {
        reply = `I don't have any petals because my happiness is only ${happiness.toFixed(0)}%! I need at least 20% happiness for my first petal to bloom. Try playing some music! 🎵🌸`;
      } else {
        const count = Math.min(5, Math.floor(happiness / 20));
        reply = `I've got ${count} petal${count > 1 ? 's' : ''} right now because my happiness is at ${happiness.toFixed(0)}%. Make me happier to see more bloom! 🌸✨`;
      }
    } else if (cleanMsg.includes("hello") || cleanMsg.includes("salut") || cleanMsg.includes("hey") || cleanMsg.includes("hi")) {
      reply = "Oh hey. Just converting CO2 into oxygen so you can breathe and bother me. 💅";
    }
    return reply;
  },
};
