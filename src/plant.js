/**
 * plant.js — Controls the SVG plant animation and visual states.
 *
 * Petal logic:   1 petal per 20 happiness points (max 5 at 100%)
 * Leaf color:    Shifts from yellow (thirsty) → green (healthy) → dark (overwatered)
 * Tilt/scale:    Based on happiness & life
 * Sickness:      CSS filter on the whole plant group
 */
export const plant = {
  svgGroup: null,
  leafLeft: null,
  leafRight: null,
  leafStop1: null,
  leafStop2: null,
  petals: [],

  init(state) {
    this.svgGroup = document.getElementById('plant-group');
    this.leafLeft  = document.getElementById('leaf-left');
    this.leafRight = document.getElementById('leaf-right');
    this.leafStop1 = document.getElementById('leaf-stop-1');
    this.leafStop2 = document.getElementById('leaf-stop-2');

    // Cache petal elements 1–5
    for (let i = 1; i <= 5; i++) {
      this.petals.push(document.getElementById(`petal-${i}`));
    }

    this.update(state);
  },

  update(state) {
    const { water, happiness, life, isSick, stage } = state.data;

    // ── Scale & Tilt ────────────────────────────────────────────
    const scale = 0.55 + (life / 100) * 0.45;

    let tilt = 0;
    if (happiness < 50)  tilt = (50 - happiness) * 0.45; // droop when sad
    if (water > 90)      tilt += 8;                       // heavy/waterlogged
    if (water < 15)      tilt += 18;                      // wilting

    this.svgGroup.style.setProperty('--plant-scale', scale);
    this.svgGroup.style.setProperty('--plant-tilt', `${tilt}deg`);

    // ── Animation state ─────────────────────────────────────────
    this.svgGroup.classList.remove('state-happy', 'state-depressed');
    if (happiness > 75 && life > 50 && water > 25 && water < 85) {
      this.svgGroup.classList.add('state-happy');
    } else if (life < 30 || happiness < 20) {
      this.svgGroup.classList.add('state-depressed');
    }

    // ── Sickness & Victory filters ────────────────────────────────
    this.svgGroup.classList.toggle('is-sick', isSick);
    this.svgGroup.classList.toggle('is-golden', state.data.victory === true);

    // ── Leaf color (gradient stops) ──────────────────────────────
    // Water:  <15 yellow, 15–30 lime, 30–80 healthy green, 80–90 dark, >90 very dark/blue
    let col1, col2;
    if (water < 15) {
      col1 = '#E6C000'; col2 = '#BFA000'; // thirsty — yellow
    } else if (water < 30) {
      col1 = '#C5E06A'; col2 = '#A3C93A'; // low — lime
    } else if (water < 80) {
      col1 = '#81C784'; col2 = '#4CAF50'; // healthy — green
    } else if (water < 90) {
      col1 = '#4CAF50'; col2 = '#2E7D32'; // saturated — dark green
    } else {
      col1 = '#43A047'; col2 = '#1B5E20'; // overwatered — slightly lighter than before so it doesn't look black
    }

    if (this.leafStop1) this.leafStop1.setAttribute('stop-color', col1);
    if (this.leafStop2) this.leafStop2.setAttribute('stop-color', col2);

    // ── Petals ───────────────────────────────────────────────────
    // Show 1 petal per 20 happiness (0–4 = 0 petals, 20–39 = 1, etc.)
    const petalCount = Math.min(5, Math.floor(happiness / 20));

    // Petals color shifts with happiness
    let petalFill, petalStroke;
    if (happiness < 40) {
      petalFill = '#FFCC80'; petalStroke = '#E65100'; // pale orange
    } else if (happiness < 70) {
      petalFill = '#FF8A65'; petalStroke = '#BF360C'; // coral
    } else {
      petalFill = '#FF5722'; petalStroke = '#B71C1C'; // vibrant red-orange
    }

    const flowerGroup = document.getElementById('flower-group');
    const flowerCenter = document.getElementById('flower-center');
    const flowerCenterDot = document.getElementById('flower-center-dot');

    this.petals.forEach((petal, i) => {
      if (!petal) return;
      const visible = (i < petalCount) && (stage >= 0);
      petal.classList.toggle('hidden', !visible);
      if (visible) {
        petal.setAttribute('fill', petalFill);
        petal.setAttribute('stroke', petalStroke);
      }
    });

    // Show flower centre only if at least 1 petal is showing
    const showCenter = petalCount > 0 && stage >= 0;
    flowerCenter?.classList.toggle('hidden', !showCenter);
    flowerCenterDot?.classList.toggle('hidden', !showCenter);

    // ── Weeds ────────────────────────────────────────────────────
    for (let i = 1; i <= 3; i++) {
      document.querySelector(`.weed-${i}`)?.classList.toggle('hidden', state.data.weeds < i);
    }
  },
};
