import io
import os
from typing import Dict, List

import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from kokoro import KPipeline
from pydantic import BaseModel, Field

app = FastAPI(title="Rehearse Kokoro TTS", version="1.0.0")

MODEL_REPO_ID = os.getenv("KOKORO_REPO_ID", "hexgrad/Kokoro-82M")
DEFAULT_LANG_CODE = os.getenv("KOKORO_DEFAULT_LANG_CODE", "a")
SAMPLE_RATE = int(os.getenv("KOKORO_SAMPLE_RATE", "24000"))

# Common English voices in Kokoro (not exhaustive).
KNOWN_VOICES: List[str] = [
    "af_heart",
    "af_bella",
    "af_nicole",
    "af_sarah",
    "af_sky",
    "am_fenrir",
    "am_michael",
    "am_adam",
    "am_onyx",
    "am_echo",
]

_pipelines: Dict[str, KPipeline] = {}


class TtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    voice: str = Field(default="af_heart", min_length=2, max_length=64)
    lang_code: str = Field(default=DEFAULT_LANG_CODE, min_length=1, max_length=4)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


def _get_pipeline(lang_code: str) -> KPipeline:
    key = (lang_code or DEFAULT_LANG_CODE).strip().lower()
    if key not in _pipelines:
        _pipelines[key] = KPipeline(lang_code=key, repo_id=MODEL_REPO_ID)
    return _pipelines[key]


def _synthesize(request: TtsRequest) -> bytes:
    pipeline = _get_pipeline(request.lang_code)
    segments = pipeline(request.text, voice=request.voice, speed=request.speed)
    chunks: List[np.ndarray] = []

    for _, _, audio in segments:
        arr = np.asarray(audio, dtype=np.float32).squeeze()
        if arr.size:
            chunks.append(arr)

    if not chunks:
        raise HTTPException(status_code=500, detail="Kokoro produced empty audio output.")

    merged = np.concatenate(chunks)
    wav_bytes = io.BytesIO()
    sf.write(wav_bytes, merged, SAMPLE_RATE, format="WAV", subtype="PCM_16")
    return wav_bytes.getvalue()


@app.on_event("startup")
def _startup() -> None:
    # Warm up the default pipeline so first request latency is lower.
    _get_pipeline(DEFAULT_LANG_CODE)


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "model_repo_id": MODEL_REPO_ID,
        "default_lang_code": DEFAULT_LANG_CODE,
        "sample_rate": SAMPLE_RATE,
    }


@app.get("/voices")
def voices() -> dict:
    return {"voices": KNOWN_VOICES}


@app.post("/tts")
def tts(request: TtsRequest) -> Response:
    try:
        audio_bytes = _synthesize(request)
    except HTTPException:
        raise
    except Exception as error:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(error))

    return Response(content=audio_bytes, media_type="audio/wav")
