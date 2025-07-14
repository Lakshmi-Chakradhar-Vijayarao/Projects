import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral"

def run_prompt(prompt: str) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        if response.status_code != 200:
            return f"❌ Error {response.status_code}: {response.reason}\n{response.text}"

        result = response.json()
        return result.get("response", "").strip()

    except Exception as e:
        return f"⚠️ Exception occurred: {str(e)}"
