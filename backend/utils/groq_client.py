import os
import json
import re
import asyncio
import httpx
from typing import List, Dict, Any, Optional

GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions"

async def call_groq(
    messages: List[Dict[str, str]],
    model: str = "llama-3.3-70b-versatile",
    options: Optional[Dict[str, Any]] = None
) -> str:
    """
    Call Groq API with retry logic and fallback
    """
    options = options or {}
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return ""

    final_messages = [m.copy() for m in messages]
    if options.get("json_mode"):
        all_text = " ".join(m.get("content", "") for m in final_messages).lower()
        if "json" not in all_text:
            if final_messages:
                final_messages[-1]["content"] += " Respond in JSON."

    payload = {
        "model": model,
        "messages": final_messages,
        "temperature": options.get("temperature", 0.3),
        "max_tokens": options.get("max_tokens", 1024),
    }

    if options.get("json_mode"):
        payload["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(1, 3):
            try:
                res = await client.post(GROQ_BASE, json=payload, headers=headers)
                res.raise_for_status()
                data = res.json()
                return data["choices"][0]["message"]["content"]
            except Exception as err:
                if attempt == 2:
                    print(f"[GroqClient] Both attempts failed: {err}")
                    raise RuntimeError(f"Groq API failed after 2 attempts: {err}")
                print(f"[GroqClient] Attempt {attempt} failed, retrying...")
                await asyncio.sleep(1)
    return ""

def parse_groq_json(content: str, fallback: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Parse JSON from Groq response, with graceful rule-based fallback
    """
    if fallback is None:
        fallback = {}
    if not content or not content.strip():
        return fallback
    try:
        cleaned = re.sub(r'```json\s*', '', content)
        cleaned = re.sub(r'```\s*', '', cleaned).strip()
        return json.loads(cleaned)
    except Exception:
        return fallback

