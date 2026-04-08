"""
Python Cloud Function - FastAPI Framework
豆包 TTS (Text-to-Speech) API
"""
import asyncio
import json
import base64
import uuid
import random
import time
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, Response
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from pydantic import BaseModel

app = FastAPI(
    title="豆包 TTS API",
    description="豆包文本转语音服务",
    version="1.0.0"
)


class TTSConfig:
    speaker: str = "zh_female_wenroutaozi_uranus_bigtts"
    format: str = "aac"
    speech_rate: float = 0
    pitch: float = 0
    language: str = "zh"
    aid: int = 497858
    version_code: int = 20800
    pc_version: str = "2.46.3"
    cookie: str = ""


SPEAKERS = {
    "温柔桃子（升级版）": "zh_female_wenroutaozi_uranus_bigtts",
    "磁性俊宇（升级版）": "zh_male_nuanxinshizhe_mars_bigtts",
    "阳光甜妹（升级版）": "zh_female_xiaohe_conversation_wvae_bigtts",
    "温柔桃子（经典版）": "zh_female_wenroutaozi_v2_mars_bigtts",
    "邻家女孩": "zh_female_f261_conversation_wvae_bigtts",
    "魅力苏菲": "zh_female_sophie_conversation_wvae_bigtts",
    "撒娇学妹": "zh_female_yuanqinvyou_wvae_bigtts",
    "邻家男孩": "zh_male_linjiananhai_moon_bigtts",
    "悠悠君子": "zh_male_M100_conversation_wvae_bigtts",
    "温暖阿虎": "zh_male_ahu_conversation_wvae_bigtts",
    "少年梓辛": "zh_male_m286_conversation_wvae_bigtts",
    "阳光阿辰": "zh_male_qingyiyuxuan_mars_bigtts",
    "腹黑霸总": "ICL_c021bc19bf92",
    "冷酷霸总": "ICL_e0b9b93ee322",
    "傲娇霸总": "zh_male_aojiaobazong_wvae_bigtts",
    "霸道总裁": "ICL_d4d40acd33dd",
    "温柔子言": "zh_male_cheng_mars_bigtts",
    "率性阿哲": "zh_male_litiebanzi_mars_bigtts",
    "温柔陆辰": "ICL_df4fc4d1ce4b",
    "甜美小雪": "ICL_6acf86286e24",
    "清冷阿梦": "ICL_16cd9a58768e",
    "东方浩然": "zh_male_dongfanghaoran_moon_bigtts",
    "病娇少爷": "ICL_72afa6c5dc07",
    "清爽男大": "zh_male_junlangxize_mars_bigtts",
    "清朗宇澄": "ICL_9b3bc6941076",
    "奶音俊少": "ICL_932b3f52bf3d",
    "沉稳皓轩": "ICL_5a413fbc14fc",
    "温柔俊彦": "ICL_0ce6ef379e73",
}


def load_cookie() -> str:
    return "sessionid=1554223746fcbbaffa9e672a19002bcd; sid_guard=1554223746fcbbaffa9e672a19002bcd%7C1775665945%7C2592000%7CFri%2C+08-May-2026+16%3A32%3A25+GMT; uid_tt=0722f0c41cb3535cbce42b3565b973dd"


class DoubaoTTS:
    WS_URL = "wss://ws-samantha.doubao.com/samantha/audio/tts"
    
    def __init__(self, config: TTSConfig):
        self.config = config
        self._device_id = str(random.randint(7400000000000000000, 7499999999999999999))
        self._web_id = str(random.randint(7400000000000000000, 7499999999999999999))
    
    def _build_ws_url(self) -> str:
        params = {
            "speaker": self.config.speaker,
            "format": self.config.format,
            "speech_rate": int(self.config.speech_rate * 100) if self.config.speech_rate != 0 else 0,
            "pitch": int(self.config.pitch * 100) if self.config.pitch != 0 else 0,
            "version_code": self.config.version_code,
            "language": self.config.language,
            "device_platform": "web",
            "aid": self.config.aid,
            "real_aid": self.config.aid,
            "pkg_type": "release_version",
            "device_id": self._device_id,
            "pc_version": self.config.pc_version,
            "web_id": self._web_id,
            "tea_uuid": self._web_id,
            "region": "",
            "sys_region": "",
            "samantha_web": 1,
            "use-olympus-account": 1,
            "web_tab_id": str(uuid.uuid4()),
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.WS_URL}?{query}"
    
    async def synthesize(self, text: str):
        import websockets
        
        result = {"audio_data": b"", "sentences": [], "success": False, "error": ""}
        audio_chunks = []
        
        ws_url = self._build_ws_url()
        
        headers = {
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Origin": "https://www.doubao.com",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
        
        if self.config.cookie:
            headers["Cookie"] = self.config.cookie
        
        try:
            async with websockets.connect(ws_url, additional_headers=headers) as ws:
                await ws.send(json.dumps({"event": "text", "text": text}))
                await ws.send(json.dumps({"event": "finish"}))
                
                while True:
                    try:
                        message = await asyncio.wait_for(ws.recv(), timeout=30)
                        
                        if isinstance(message, bytes):
                            audio_chunks.append(message)
                        else:
                            data = json.loads(message)
                            event = data.get("event", "")
                            
                            if event == "sentence_start":
                                readable_text = data.get("sentence_start_result", {}).get("readable_text", "")
                                result["sentences"].append(readable_text)
                                
                            elif event == "error" or data.get("code", 0) != 0:
                                result["error"] = data.get("message", "Unknown error")
                                return result
                                
                    except asyncio.TimeoutError:
                        break
                    except websockets.exceptions.ConnectionClosed:
                        break
                        
        except Exception as e:
            result["error"] = str(e)
            return result
        
        result["audio_data"] = b"".join(audio_chunks)
        result["success"] = len(result["audio_data"]) > 0
        
        return result


class TTSRequest(BaseModel):
    text: str
    speaker: Optional[str] = "zh_female_wenroutaozi_uranus_bigtts"
    speed: Optional[float] = 0
    pitch: Optional[float] = 0
    format: Optional[str] = "aac"
    language: Optional[str] = "zh"


class TTSResponse(BaseModel):
    success: bool
    audio: Optional[str]
    sentences: List[str]
    error: Optional[str]
    duration: float


@app.get("/")
async def index():
    cookie = load_cookie()
    return {
        "message": "豆包 TTS API",
        "version": "1.0.0",
        "cookie_loaded": bool(cookie),
        "endpoints": {
            "POST /tts": "文本转语音",
            "GET /speakers": "获取可用语音列表",
            "GET /health": "健康检查",
            "GET /docs": "Swagger 文档",
            "GET /redoc": "ReDoc 文档"
        }
    }


@app.get("/health")
async def health():
    cookie = load_cookie()
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "cookie_configured": bool(cookie)
    }


@app.get("/docs")
async def docs():
    return get_swagger_ui_html(openapi_url="/openapi.json", title="API Docs")


@app.get("/redoc")
async def redoc():
    return get_redoc_html(openapi_url="/openapi.json", title="API Docs")


@app.get("/speakers")
async def get_speakers():
    return {"speakers": SPEAKERS}


@app.post("/tts", response_model=TTSResponse)
async def tts_synthesize(request: TTSRequest):
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    cookie = load_cookie()
    if not cookie:
        raise HTTPException(status_code=500, detail="Cookie not configured")
    
    config = TTSConfig()
    config.speaker = request.speaker
    config.speech_rate = request.speed
    config.pitch = request.pitch
    config.format = request.format
    config.language = request.language
    config.cookie = cookie
    
    tts = DoubaoTTS(config)
    
    start_time = time.time()
    result = await tts.synthesize(request.text)
    duration = time.time() - start_time
    
    if result["success"]:
        audio_base64 = base64.b64encode(result["audio_data"]).decode("utf-8")
        return TTSResponse(
            success=True,
            audio=audio_base64,
            sentences=result["sentences"],
            error=None,
            duration=duration
        )
    else:
        return TTSResponse(
            success=False,
            audio=None,
            sentences=[],
            error=result["error"],
            duration=duration
        )


@app.get("/tts")
async def tts_get(
    text: str = Query(..., description="要转换的文本"),
    speaker: str = Query("zh_female_wenroutaozi_uranus_bigtts", description="语音角色"),
    speed: float = Query(0, description="语速 -1.0 ~ 1.0"),
    pitch: float = Query(0, description="音调 -1.0 ~ 1.0"),
    format: str = Query("aac", description="音频格式 aac/mp3"),
):
    request = TTSRequest(
        text=text,
        speaker=speaker,
        speed=speed,
        pitch=pitch,
        format=format
    )
    return await tts_synthesize(request)


@app.post("/audio")
async def tts_audio(request: TTSRequest):
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 characters)")
    
    cookie = load_cookie()
    if not cookie:
        raise HTTPException(status_code=500, detail="Cookie not configured")
    
    config = TTSConfig()
    config.speaker = request.speaker
    config.speech_rate = request.speed
    config.pitch = request.pitch
    config.format = request.format
    config.language = request.language
    config.cookie = cookie
    
    tts = DoubaoTTS(config)
    result = await tts.synthesize(request.text)
    
    if result["success"]:
        ext = request.format if request.format else "aac"
        content_type = "audio/aac" if ext == "aac" else "audio/mp3"
        return Response(
            content=result["audio_data"],
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename=tts_{int(time.time())}.{ext}"}
        )
    else:
        raise HTTPException(status_code=500, detail=result["error"])


@app.get("/audio")
async def tts_audio_get(
    text: str = Query(..., description="要转换的文本"),
    speaker: str = Query("zh_female_wenroutaozi_uranus_bigtts", description="语音角色"),
    speed: float = Query(0, description="语速 -1.0 ~ 1.0"),
    pitch: float = Query(0, description="音调 -1.0 ~ 1.0"),
    format: str = Query("aac", description="音频格式 aac/mp3"),
):
    request = TTSRequest(
        text=text,
        speaker=speaker,
        speed=speed,
        pitch=pitch,
        format=format
    )
    return await tts_audio(request)
