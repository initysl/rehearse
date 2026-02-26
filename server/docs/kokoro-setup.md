# Kokoro TTS Setup (Local)

This backend now supports Kokoro as a local TTS provider via an internal Python service.

Prerequisites:
- Python 3.10+
- System dependency: `espeak-ng` (required by Kokoro)

Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y espeak-ng
```

## 1) Create Python environment

```bash
cd server
python3 -m venv .venv-kokoro
source .venv-kokoro/bin/activate
pip install -U pip
pip install -r requirements-kokoro.txt
```

## 2) Start Kokoro service

```bash
cd server
source .venv-kokoro/bin/activate
uvicorn kokoro_service:app --host 127.0.0.1 --port 8001
```

The first startup downloads model weights and can take time on slow networks.

## 3) Configure Node server

Set these in `server/.env`:

```env
TTS_PROVIDER=kokoro
TTS_FALLBACK_PROVIDER=none
TTS_TIMEOUT_MS=60000
KOKORO_TTS_URL=http://127.0.0.1:8001/tts
KOKORO_TTS_LANG_CODE=a
KOKORO_TTS_SPEED=1.0
KOKORO_TTS_VOICE_MALE=am_fenrir
KOKORO_TTS_VOICE_FEMALE=af_heart
```

Optional fallback:

```env
TTS_FALLBACK_PROVIDER=groq
```

## 4) Verify Kokoro endpoint

```bash
curl -X POST http://127.0.0.1:8001/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from Kokoro","voice":"af_heart","lang_code":"a","speed":1.0}' \
  --output /tmp/kokoro-test.wav
```

If `/tmp/kokoro-test.wav` plays, Kokoro is correctly configured.

## 5) Run backend

```bash
cd server
npm run dev
```

Voice flow summary:
- STT and chat remain on Groq.
- TTS uses local Kokoro when `TTS_PROVIDER=kokoro`.
