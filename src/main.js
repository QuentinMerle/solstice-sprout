import { state } from './state.js';
import { plant } from './plant.js';
import { weather } from './weather.js';
import { chat } from './chat.js';
import { retention } from './retention.js';

class App {
  constructor() {
    this.tickInterval = null;
    this.saveDebounce = null;
    this.init();
  }

  async init() {
    console.log('Solstice Sprout Initializing...');

    state.init();
    plant.init(state);
    retention.init(state);
    chat.init(state);
    await weather.init(state);

    this.setupListeners();
    this.updateGoalBar(state.data.name);

    // ── Naming modal ──────────────────────────────────────
    const titleDisplay = document.getElementById('plant-title-display');
    if (!localStorage.getItem('sprout_named')) {
      const modal = document.getElementById('naming-modal');
      modal.classList.remove('hidden');
      const submit = () => {
        const input = document.getElementById('plant-name-input').value.trim();
        if (!input) return;
        state.update({ name: input });
        localStorage.setItem('sprout_named', 'true');
        titleDisplay.innerText = input;
        modal.classList.add('hidden');
        this.updateGoalBar(input);
        chat.systemMessage(`Nice to meet you! My name is ${input} 🌱`);
      };
      document.getElementById('plant-name-submit').addEventListener('click', submit);
      document.getElementById('plant-name-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submit();
      });
    } else {
      titleDisplay.innerText = state.data.name;
    }

    // ── State event bus ───────────────────────────────────
    state.onEvent((evt) => {
      if (evt.type === 'update') {
        plant.update(state);
        retention.update(state);
      } else if (evt.type === 'weed_spawned') {
        chat.systemMessage('🐛 A weed just sprouted! I feel itchy...');
      } else if (evt.type === 'sick') {
        chat.systemMessage('🥀 I feel really sick... my leaves are turning brown. Please heal me!');
      } else if (evt.type === 'evolved') {
        chat.systemMessage('🌸 Oh wow! I grew a flower! Thank you for taking such good care of me!');
      } else if (evt.type === 'victory') {
        chat.systemMessage('🎉 HAPPY SUMMER SOLSTICE! We made it to June 21st! ☀️🌻');
        document.body.classList.add('theme-golden');
        chat.playMusic(); // Play a tune for victory
        const modal = document.getElementById('naming-modal');
        modal.innerHTML = `
          <div class="modal-content victory-content">
            <h2 class="victory-title">☀️ Victory! 🌻</h2>
            <p>You kept <strong>${state.data.name}</strong> alive until the Summer Solstice!</p>
            <p>Your little sprout has bloomed into a radiant Golden Flower.</p>
            <br>
            <button onclick="document.getElementById('naming-modal').classList.add('hidden')" class="btn-primary" style="background:var(--yellow-shadow); color:var(--white);">Bask in the Sun</button>
          </div>
        `;
        modal.classList.remove('hidden');
      } else if (evt.type === 'game_over') {
        chat.systemMessage('💀 The plant has died... Game Over.');
        clearInterval(this.tickInterval);
        const modal = document.getElementById('naming-modal');
        modal.innerHTML = `
          <div class="modal-content">
            <h2>Game Over 🥀</h2>
            <p><strong>${state.data.name}</strong> has died. You failed as a gardener.</p>
            <br>
            <button onclick="localStorage.removeItem('sprout_state'); localStorage.removeItem('sprout_named'); window.location.reload();" class="btn-primary" style="background:var(--red)">Try Again</button>
          </div>
        `;
        modal.classList.remove('hidden');
      }
    });

    // ── Game tick: setInterval instead of RAF for logic ───
    // This frees up the render thread from game-logic overhead
    this.tickInterval = setInterval(() => this.tick(), 1000);

    // Clock stays on RAF for smoothness
    requestAnimationFrame(() => this.clockTick());

    // Debounced autosave every 10 seconds
    setInterval(() => state.save(), 10_000);

    window.addEventListener('beforeunload', () => state.save());
  }

  // Clock-only RAF loop (lightweight)
  clockTick() {
    const now = new Date();
    document.getElementById('current-time').innerText =
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    requestAnimationFrame(() => this.clockTick());
  }

  // Game logic tick (1 Hz via setInterval)
  tick() {
    state.tick();
    plant.update(state);
    retention.update(state);
    weather.update(state);
  }

  // Prevent spamming buttons
  actionDebounce(callback) {
    if (this._isActionCooldown) return;
    this._isActionCooldown = true;
    callback();
    setTimeout(() => { this._isActionCooldown = false; }, 1200); // 1.2s cooldown
  }

  setupListeners() {
    document.getElementById('water-btn').addEventListener('click', () => this.actionDebounce(() => {
      const wasThirsty = state.data.water < 30;
      const happyBonus = wasThirsty ? 12 : 2;
      state.update({
        water: Math.min(100, state.data.water + 10),
        happiness: Math.min(100, state.data.happiness + happyBonus)
      });
      chat.systemMessage(`💧 Watered! (+10% water${wasThirsty ? ', +12% happiness' : ', +2% happiness'})`);
      setTimeout(() => chat.generateResponse('*waters the plant*', state), 300);
    }));

    document.getElementById('sun-btn').addEventListener('click', () => this.actionDebounce(() => {
      const wasOverwatered = state.data.water > 80;
      const happyBonus = wasOverwatered ? 12 : 2;
      state.update({
        water: Math.max(0, state.data.water - 10),
        happiness: Math.min(100, state.data.happiness + happyBonus)
      });
      chat.systemMessage(`☀️ Sunbathed! (-10% water${wasOverwatered ? ', +12% happiness' : ', +2% happiness'})`);
      setTimeout(() => chat.generateResponse('*sunbathes the plant*', state), 300);
    }));

    document.getElementById('close-window-btn').addEventListener('click', () => {
      weather.closeWindow();
    });

    document.getElementById('fertilize-btn').addEventListener('click', () => this.actionDebounce(() => {
      const wasHungry = state.data.fertilizer < 20;
      const happyBonus = wasHungry ? 10 : 2;
      state.update({
        fertilizer: Math.min(100, state.data.fertilizer + 20),
        life: Math.min(100, state.data.life + 5),
        happiness: Math.min(100, state.data.happiness + happyBonus)
      });
      chat.systemMessage(`🌱 Applied fertilizer! (+20% fertilizer${wasHungry ? ', +10% happiness' : ', +2% happiness'})`);
      setTimeout(() => chat.generateResponse('*fertilizes the plant*', state), 300);
    }));

    document.getElementById('weed-btn').addEventListener('click', () => this.actionDebounce(() => {
      if (state.data.weeds > 0) {
        state.update({ weeds: 0, happiness: Math.min(100, state.data.happiness + 10) });
        chat.systemMessage('🐛 Weeds removed! (+10% happiness)');
        setTimeout(() => chat.generateResponse('*cleans the weeds*', state), 300);
      } else {
        chat.systemMessage('🐛 No weeds right now, we\'re clean!');
      }
    }));

    document.getElementById('heal-btn').addEventListener('click', () => this.actionDebounce(() => {
      if (state.data.isSick) {
        state.update({ isSick: false, life: Math.min(100, state.data.life + 20), happiness: Math.min(100, state.data.happiness + 15) });
        chat.systemMessage('✂️ Pruned sick leaves and applied medicine. (+20% life, +15% happiness)');
        setTimeout(() => chat.generateResponse('*heals the plant*', state), 300);
      } else {
        chat.systemMessage('✂️ All good here — no pruning needed!');
      }
    }));

    document.getElementById('music-btn').addEventListener('click', () => this.actionDebounce(() => {
      chat.playMusic();
      state.update({ happiness: Math.min(100, state.data.happiness + 15) });
      chat.systemMessage('🎵 Played a cheerful melody! (+15% happiness)');
      setTimeout(() => chat.generateResponse('*plays music*', state), 300);
    }));
  }

  updateGoalBar(name) {
    const SOLSTICE  = new Date('2026-06-21T23:59:59');
    const START     = new Date('2026-06-13T00:00:00');
    const now       = new Date();
    const totalMs   = SOLSTICE - START;
    const elapsedMs = Math.max(0, now - START);
    const pct       = Math.min(100, (elapsedMs / totalMs) * 100);
    const totalDays   = Math.ceil(totalMs / 86400000);
    const elapsedDays = Math.min(totalDays, Math.ceil(elapsedMs / 86400000));

    document.getElementById('goal-fill')?.style.setProperty('width', pct.toFixed(1) + '%');
    const daysEl = document.getElementById('goal-days');
    if (daysEl) daysEl.textContent = `Day ${elapsedDays} / ${totalDays}`;
    const nameEl = document.getElementById('goal-name');
    if (nameEl && name) nameEl.textContent = name;
    // Update the label too
    const labelEl = document.getElementById('goal-label');
    if (labelEl && name) {
      const strong = labelEl.querySelector('strong');
      if (strong) strong.textContent = name;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => { new App(); });
