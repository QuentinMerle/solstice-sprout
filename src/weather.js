import { state } from './state.js';
import { chat } from './chat.js';

export const weather = {
  isRaining: false,
  weatherCode: 0,
  temperature: 20,
  
  async init(stateObj) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => this.fetchWeather(position.coords.latitude, position.coords.longitude, stateObj),
        (error) => console.warn("Geolocation denied or error. Using default weather.")
      );
    }
  },

  async fetchWeather(lat, lon, stateObj) {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`);
      const data = await res.json();
      
      this.weatherCode = data.current.weather_code;
      this.temperature = data.current.temperature_2m;
      const isDay = data.current.is_day;

      const body = document.body;
      body.className = '';
      
      let weatherEmoji = '☀️';
      
      if (this.weatherCode >= 61 && this.weatherCode <= 99) {
        this.isRaining = true;
        weatherEmoji = '🌧️';
        body.classList.add('theme-rain');
        
        // Dynamic rain intensity
        const intensity = this.weatherCode >= 65 ? 80 : (this.weatherCode >= 63 ? 40 : 15);
        let drops = '';
        for (let i = 0; i < intensity; i++) {
          const left = Math.random() * 100;
          const delay = Math.random() * 2;
          const duration = 0.5 + Math.random() * 0.5;
          drops += `<div class="raindrop" style="left:${left}%; animation-delay:${delay}s; animation-duration:${duration}s;"></div>`;
        }
        document.getElementById('env-effects').innerHTML = drops;
        
      } else {
        const hour = new Date().getHours();
        let sunSize = '120px';
        let sunColor = '#fdfd96';
        let top = '10%';
        let left = '50%';
        
        if (hour < 8 || hour > 18) {
           sunColor = '#ffb7b2';
           top = '50%';
           left = hour < 8 ? '20%' : '80%';
        } else if (hour >= 8 && hour <= 18) {
           const progress = (hour - 8) / 10;
           left = `${20 + (progress * 60)}%`;
           const heightRatio = 4 * progress * (1 - progress);
           top = `${50 - (heightRatio * 40)}%`; 
        }

        if (isDay === 0) {
          weatherEmoji = '🌙';
          body.classList.add('theme-night');
          sunColor = '#fff';
          sunSize = '80px';
          document.getElementById('env-effects').innerHTML = `
            <div class="sun-orb" style="
              width:${sunSize}; height:${sunSize}; 
              background: radial-gradient(circle, #ffffff 30%, #e0eaf5 70%, transparent 100%); 
              top:${top}; left:${left}; transform:translate(-50%,-50%); 
              box-shadow: 0 0 40px 10px rgba(255,255,255,0.3), inset 0 0 20px rgba(255,255,255,0.8);
            "></div>`;
        } else {
          body.classList.add('theme-sun');
          document.getElementById('env-effects').innerHTML = `
            <div class="sun-orb" style="
              width:${sunSize}; height:${sunSize}; 
              background: radial-gradient(circle, #ffffff 10%, ${sunColor} 70%, transparent 100%); 
              top:${top}; left:${left}; transform:translate(-50%,-50%); 
              box-shadow: 0 0 60px 20px rgba(253, 253, 150, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.9);
            "></div>`;
        }
      }
      
      document.getElementById('current-weather').innerText = `${weatherEmoji} ${Math.round(this.temperature)}°C`;
    } catch (e) {
      console.error("Error fetching weather:", e);
    }
  },

  update(stateObj) {
    if (this.isRaining && stateObj.data.isWindowOpen) {
      stateObj.update({ water: Math.min(100, stateObj.data.water + 0.2) });
      
      if (stateObj.data.water > 80) {
        document.getElementById('rain-action').classList.remove('hidden');
      }
    }
  },

  closeWindow() {
    state.update({ isWindowOpen: false });
    document.getElementById('rain-action').classList.add('hidden');
    chat.systemMessage("Phew! Thank you for closing the window. My roots were swimming!");
  }
};
