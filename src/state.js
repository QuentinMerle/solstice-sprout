export const state = {
  data: {
    name: "Sprout",
    water: 50,
    happiness: 80,
    life: 100,
    lastUpdate: Date.now(),
    isWindowOpen: true,
    weeds: 0,
    fertilizer: 0,
    isSick: false,
    stage: 0,
    aliveTime: 0, // seconds
    victory: false
  },
  
  listeners: [],

  onEvent(cb) {
    this.listeners.push(cb);
  },
  
  dispatch(event) {
    this.listeners.forEach(cb => cb(event));
  },

  init() {
    this.load();
    this.applyTimeTravel();
    this.updateUI();
  },

  load() {
    const saved = localStorage.getItem('sprout_state');
    if (saved) {
      try {
        this.data = { ...this.data, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Could not parse saved state.");
      }
    }
  },

  save() {
    this.data.lastUpdate = Date.now();
    localStorage.setItem('sprout_state', JSON.stringify(this.data));
  },

  applyTimeTravel() {
    const now = Date.now();
    const elapsedHours = (now - this.data.lastUpdate) / (1000 * 60 * 60);
    
    if (elapsedHours > 0) {
      this.data.water = Math.max(0, this.data.water - (elapsedHours * 5));
      this.data.fertilizer = Math.max(0, this.data.fertilizer - (elapsedHours * 10));
      
      if (this.data.water < 30) {
        this.data.happiness = Math.max(0, this.data.happiness - (elapsedHours * 10));
      }
      
      // Weeds spawn over time
      const newWeeds = Math.floor(elapsedHours * 0.5);
      this.data.weeds = Math.min(3, this.data.weeds + newWeeds);
      
      this.calculateLife();
      this.save();
    }
  },

  update(newVals) {
    this.data = { ...this.data, ...newVals };
    this.calculateLife();
    this.save();
    this.updateUI();
    this.dispatch({ type: 'update' });
  },

  tick() {
    let changed = false;
    this.data.aliveTime += 1;
    
    // Slow degradation
    if (Math.random() < 0.05) {
      this.data.water = Math.max(0, this.data.water - 0.5);
      this.data.fertilizer = Math.max(0, this.data.fertilizer - 1);
      changed = true;
    }
    
    // Weeds spawning
    if (Math.random() < 0.005 && this.data.weeds < 3) {
      this.data.weeds += 1;
      this.dispatch({ type: 'weed_spawned' });
      changed = true;
    }
    
    // Sickness logic
    if (!this.data.isSick && (this.data.weeds >= 3 || this.data.fertilizer > 80 || this.data.water <= 5 || this.data.water >= 95)) {
      if (Math.random() < 0.1) {
        this.data.isSick = true;
        this.dispatch({ type: 'sick' });
        changed = true;
      }
    }

    if (this.data.water > 90 && this.data.isWindowOpen) {
      this.data.happiness = Math.max(0, this.data.happiness - 1.5);
      changed = true;
    } else if (this.data.water < 20) {
      this.data.happiness = Math.max(0, this.data.happiness - 1);
      changed = true;
    }

    // Evolution logic (if happy for a while)
    if (this.data.stage === 0 && this.data.aliveTime > 120 && this.data.happiness > 80 && this.data.life > 80) {
      this.data.stage = 1; // Grow a flower!
      this.dispatch({ type: 'evolved' });
      changed = true;
    }
    
    // Victory Condition: June 21st
    if (!this.data.victory) {
      const d = new Date();
      if (d.getMonth() === 5 && d.getDate() >= 21 && this.data.life > 0) {
        this.data.victory = true;
        this.dispatch({ type: 'victory' });
        changed = true;
      }
    }

    if (changed) {
      this.calculateLife();
      this.save();
      this.updateUI();
    }
  },

  calculateLife() {
    if (this.data.isSick) {
      this.data.life = Math.max(0, this.data.life - 0.5); // Dropped from -2 to -0.5
    } else if (this.data.water === 0 || this.data.water === 100) {
      // Very slow drain instead of fast drain. It will drop happiness mostly.
      this.data.life = Math.max(0, this.data.life - 0.2); 
    } else if (this.data.happiness > 50 && this.data.water > 30 && this.data.water < 80) {
      this.data.life = Math.min(100, this.data.life + 0.5);
    }

    if (this.data.life <= 0 && !this.data.dead) {
      this.data.dead = true;
      this.dispatch({ type: 'game_over' });
    }
  },

  updateUI() {
    document.getElementById('water-val').innerText = `${Math.round(this.data.water)}%`;
    document.getElementById('happy-val').innerText = `${Math.round(this.data.happiness)}%`;
    document.getElementById('life-val').innerText = `${Math.round(this.data.life)}%`;
    
    document.getElementById('water-fill').style.width = `${this.data.water}%`;
    document.getElementById('happy-fill').style.width = `${this.data.happiness}%`;
    document.getElementById('life-fill').style.width = `${this.data.life}%`;
  }
};
