const axios = require('axios');

const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Call Groq API with retry logic and fallback
 * @param {Array} messages - OpenAI-format messages array
 * @param {string} model - Groq model ID
 * @param {object} options - temperature, max_tokens, etc.
 * @returns {string} - assistant message content
 */
async function callGroq(messages, model = 'llama-3.3-70b-versatile', options = {}) {
  // Groq requires the word 'json' somewhere in messages when using json_object mode
  let finalMessages = messages;
  if (options.json_mode) {
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    if (!allText.includes('json')) {
      finalMessages = messages.map((m, i) =>
        i === messages.length - 1
          ? { ...m, content: m.content + ' Respond in JSON.' }
          : m
      );
    }
  }

  const payload = {
    model,
    messages: finalMessages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 1024,
    response_format: options.json_mode ? { type: 'json_object' } : undefined,
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await axios.post(GROQ_BASE, payload, {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      return res.data.choices[0].message.content;
    } catch (err) {
      if (attempt === 2) {
        console.error('[GroqClient] Both attempts failed:', err.message);
        throw new Error(`Groq API failed after 2 attempts: ${err.message}`);
      }
      console.warn(`[GroqClient] Attempt ${attempt} failed, retrying...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

/**
 * Parse JSON from Groq response, with fallback
 */
function parseGroqJSON(content, fallback = {}) {
  try {
    // Strip markdown code fences if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    console.warn('[GroqClient] JSON parse failed, returning fallback');
    return fallback;
  }
}

module.exports = { callGroq, parseGroqJSON };
