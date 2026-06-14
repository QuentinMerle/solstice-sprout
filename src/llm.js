/**
 * WebLLM integration for Solstice Sprout.
 * Uses @mlc-ai/web-llm to run a local LLM in the browser (WebGPU).
 * Falls back to curated mock responses if WebGPU is not available or model isn't loaded.
 * Model: Llama-3.2-1B-Instruct-q4f32_1-MLC (very small, fast to download ~800MB)
 */
import * as webllm from '@mlc-ai/web-llm';

const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';

export const llm = {
  engine: null,
  isReady: false,
  isLoading: false,
  onProgress: null, // callback(progress: 0..1, text: string)
  onReady: null,    // callback()

  async init() {
    // WebGPU check
    if (!navigator.gpu) {
      console.warn('[WebLLM] WebGPU not available – using mock responses.');
      return;
    }

    this.isLoading = true;
    try {
      this.engine = await webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (progress) => {
          const pct = Math.round((progress.progress ?? 0) * 100);
          const text = progress.text ?? 'Loading model...';
          if (this.onProgress) this.onProgress(pct, text);
        },
      });
      this.isReady = true;
      if (this.onReady) this.onReady();
    } catch (err) {
      console.warn('[WebLLM] Failed to load model:', err.message);
    } finally {
      this.isLoading = false;
    }
  },

  /**
   * Generate a response from the plant's perspective.
   * @param {string} systemPrompt - Context about the plant's state
   * @param {Array} history - Previous messages [{role: 'user'|'assistant', content: string}]
   * @param {string} userMessage - What the user said/did
   * @returns {Promise<string>} Plant's reply
   */
  async generate(systemPrompt, history, userMessage) {
    if (!this.isReady || !this.engine) return null;

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user',   content: userMessage  },
      ];

      const reply = await this.engine.chat.completions.create({
        messages,
        max_tokens: 80,
        temperature: 0.9,
        top_p: 0.9,
      });
      return reply.choices[0]?.message?.content?.trim() ?? null;
    } catch (err) {
      console.warn('[WebLLM] Generation failed:', err.message);
      return null;
    }
  },
};
