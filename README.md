# 🌱 Solstice Sprout

> A cozy, local-first, sentient Tamagotchi-style browser game built for the [June Solstice Game Jam](https://dev.to/challenges/june-game-jam-2026-06-03).

Keep your digital sprout alive and happy until the **Summer Solstice (June 21st)**. Talk to it, water it, play music, and watch it bloom into a radiant Golden Flower!

---

## 🌟 Key Features

### 1. 🧠 Local AI Mind (WebGPU)
Solstice Sprout runs a quantized 1.2 Billion Parameter LLM (`Llama-3.2-1B-Instruct`) entirely inside your browser using `@mlc-ai/web-llm` and WebGPU. 
* **State-Awareness**: The plant reads its live stats (`Water`, `Happiness`, `Life`, `isSick`, `weeds`) and real-world environment conditions to discuss them dynamically in the chat.
* **Deterministic Fallback**: If your device lacks WebGPU support, the game falls back to a custom, stat-aware regex engine that mirrors the plant's personality and state parameters.

### 2. 🌧️ Real-World Weather Synchronization
Using the browser's Geolocation API and the Open-Meteo API, the game synchronizes with your real-world local weather:
* Sells day/night cycle themes based on your timezone.
* If it starts raining outside your real-life window, rain particles fall in-game, slowly filling the plant's water meter. If it gets overwatered, you must click the context action to close the virtual window!

### 3. 🎵 Procedural Synth Engine (Web Audio API)
To keep the bundle size extremely lightweight, we bypass heavy audio files entirely:
* Playing music to your sprout generates procedurally synthesized melodies in real-time.
* Features three randomized melodies and synthesis wave profiles (warm triangle wave flute, retro square wave chiptune, and crystal sine wave bells).

### 4. 🎨 Dynamic SVG Visuals & Themes
* **Reactive Leaves**: Leaf color shifts from thirsty yellow to lime, healthy green, and overwatered deep forest green.
* **Petal Bloom**: The plant grows petals one by one as its happiness levels cross specific thresholds.
* **Expression animations**: The plant sways gently when happy, and trembles slowly with a sad shiver animation when depressed or sick.
* **Victory Event**: Surviving until June 21st unlocks the **Golden Flower Solstice Theme** with custom levitation animations, victory sound chimes, and a shimmering background theme.

### 5. 🔔 Tab Retention Loop
* **Canvas Favicon**: The tab favicon dynamically redraws on an HTML5 canvas to display the plant's health status emoji (🌱 $\rightarrow$ 🌸 $\rightarrow$ 💧 $\rightarrow$ 💀).
* **Title Alerts**: The browser tab title updates when the plant needs attention.
* **System Notifications**: Uses the Web Notifications API to nudge you back when the tab is hidden and the plant is sick or near death.

---

## 🛠️ Tech Stack
* **Core**: Vanilla JavaScript (ES Modules) & HTML5
* **Styling**: Pure CSS (Neobrutalist Pastel Theme)
* **Bundler**: Vite
* **AI Inferences**: `@mlc-ai/web-llm` (W3C WebGPU)
* **Weather API**: Open-Meteo (Geolocation-based)

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: Version 20.12+ or 22+
* **Browser**: Chrome/Edge/Firefox with WebGPU support enabled (for the local LLM).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/QuentinMerle/solstice-sprout.git
   cd solstice-sprout
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the local development server:
   ```bash
   npm run dev
   ```
4. Build the production assets:
   ```bash
   npm run build
   ```

---

## 🚀 Deployment (GitHub Pages)
This repository is configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the compiled assets to the `gh-pages` branch on every push to `main`.

To enable hosting:
1. Go to your GitHub repository settings.
2. Select **Pages** on the left menu.
3. Under **Build and deployment**, set the Source to **Deploy from a branch**.
4. Select `gh-pages` as the branch and `/ (root)` as the folder.
5. Save the configuration.

---

*Proudly developed in Beauce, Québec 🍁*
