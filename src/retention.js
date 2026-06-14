export const retention = {
  canvas: null,
  ctx: null,
  favicon: null,
  notifPermission: false,
  notified: false,

  init(state) {
    this.canvas = document.getElementById('favicon-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.favicon = document.getElementById('dynamic-favicon');
    
    // Request notification permission
    if ("Notification" in window) {
      Notification.requestPermission().then(perm => {
        this.notifPermission = (perm === "granted");
      });
    }

    this.update(state);
  },

  update(state) {
    const { water, happiness, life, isSick, weeds } = state.data;
    let emoji = '🌱';
    let title = 'Solstice Sprout';
    let critical = false;

    if (life < 15) {
      emoji = '💀';
      title = '⚠️ Solstice Sprout is dying!';
      critical = true;
    } else if (isSick) {
      emoji = '🥀';
      title = '⚠️ Solstice Sprout is sick!';
      critical = true;
    } else if (water < 20) {
      emoji = '💧';
      title = '⚠️ Solstice Sprout is thirsty!';
    } else if (water > 90) {
      emoji = '🌧️';
      title = '⚠️ Overwatered!';
    } else if (weeds >= 3) {
      emoji = '🐛';
      title = '⚠️ Weeds are invading!';
    } else if (happiness < 20) {
      emoji = '😢';
      title = '⚠️ Solstice Sprout is sad!';
    } else if (life > 90) {
      emoji = '🌸';
    }

    // Update Title
    if (document.title !== title) {
      document.title = title;
    }

    // Trigger notification if critical (dying or sick) and tab is hidden
    if (critical) {
      this.triggerAlert(title);
    } else {
      this.notified = false;
    }

    // Generate and update Favicon
    this.ctx.clearRect(0, 0, 64, 64);
    this.ctx.font = '50px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(emoji, 32, 36);
    this.favicon.href = this.canvas.toDataURL('image/png');
  },

  triggerAlert(msg) {
    if (document.hidden && this.notifPermission && !this.notified) {
      new Notification(msg, { body: "Come back to check on your plant!" });
      this.notified = true;
    } else if (!document.hidden) {
      this.notified = false;
    }
  }
};
