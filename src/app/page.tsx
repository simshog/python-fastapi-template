"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Download, Volume2, Sparkles, RefreshCw, Settings2 } from "lucide-react"

interface Speaker {
  id: string
  name: string
  desc: string
}

const speakers: Speaker[] = [
  { id: "taozi", name: "桃子", desc: "女声 · 对话" },
  { id: "shuangkuai", name: "爽快", desc: "女声 · 活泼" },
  { id: "tianmei", name: "甜美", desc: "女声 · 温柔" },
  { id: "qingche", name: "清澈", desc: "女声 · 清亮" },
  { id: "yangguang", name: "阳光", desc: "男声 · 温暖" },
  { id: "chenwen", name: "沉稳", desc: "男声 · 成熟" },
  { id: "rap", name: "说唱", desc: "男声 · 节奏" },
  { id: "en_female", name: "Sarah", desc: "英文 · 女声" },
  { id: "en_male", name: "Adam", desc: "英文 · 男声" },
]

export default function Home() {
  const [text, setText] = useState("")
  const [speaker, setSpeaker] = useState("taozi")
  const [speed, setSpeed] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string; duration?: number } | null>(null)
  const [audioBase64, setAudioBase64] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!text.trim()) return

    setIsGenerating(true)
    setResult(null)
    setAudioUrl(null)
    setAudioBase64(null)

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          speaker: speaker,
          speed: speed,
          pitch: pitch,
        }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success && data.audio) {
        setAudioBase64(data.audio)
        const blob = base64ToBlob(data.audio, "audio/aac")
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
      }
    } catch (error) {
      setResult({ success: false, error: "请求失败" })
    } finally {
      setIsGenerating(false)
    }
  }

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  const handlePlay = () => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    audio.onended = () => setIsPlaying(false)
    audio.play()
    setIsPlaying(true)
  }

  const handleDownload = () => {
    if (!audioUrl || !text) return

    const a = document.createElement("a")
    a.href = audioUrl
    a.download = `tts_${speaker}_${Date.now()}.aac`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleStop = () => {
    setAudioUrl(null)
    setAudioBase64(null)
    setResult(null)
    setIsPlaying(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />

      <header className="relative z-10 border-b border-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">豆包 TTS</span>
            </div>
            <a
              href="https://github.com/TencentEdgeOne/python-fastapi-template"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                文本转语音
              </span>
            </h1>
            <p className="text-gray-400 text-lg">输入文本，选择音色，快速生成语音</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gray-900/50 border-white/10 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  输入文本
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="请输入要转换的文本..."
                    className="w-full h-48 bg-gray-800/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    maxLength={5000}
                  />
                  <p className="text-gray-500 text-sm mt-2 text-right">{text.length}/5000</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-3 block">选择音色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {speakers.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSpeaker(s.id)}
                        className={`p-3 rounded-xl text-left transition-all ${
                          speaker === s.id
                            ? "bg-purple-500/20 border-2 border-purple-500"
                            : "bg-gray-800/30 border-2 border-transparent hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="font-medium text-sm">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    声音设置
                  </label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">语速</span>
                        <span className="text-purple-400">{speed > 0 ? `+${speed}` : speed}</span>
                      </div>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.1"
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>慢</span>
                        <span>正常</span>
                        <span>快</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">音调</span>
                        <span className="text-purple-400">{pitch > 0 ? `+${pitch}` : pitch}</span>
                      </div>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.1"
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>低</span>
                        <span>正常</span>
                        <span>高</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!text.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      生成语音
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-white/10 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Volume2 className="w-5 h-5 text-pink-400" />
                  预览 & 下载
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center h-48 bg-gray-800/30 rounded-xl border-2 border-dashed border-white/10">
                  {isGenerating ? (
                    <div className="text-center">
                      <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                      <p className="text-gray-400">正在生成语音...</p>
                    </div>
                  ) : audioUrl ? (
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                        <Volume2 className="w-10 h-10" />
                      </div>
                      <p className="text-gray-300 mb-1">{text.slice(0, 30)}{text.length > 30 ? "..." : ""}</p>
                      <p className="text-gray-500 text-sm">
                        {result?.duration?.toFixed(2)}s
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Volume2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500">生成语音后将显示预览</p>
                    </div>
                  )}
                </div>

                {result && !result.success && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm">{result.error}</p>
                  </div>
                )}

                {audioUrl && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handlePlay}
                      variant="outline"
                      className="flex-1 border-white/20 hover:bg-white/10"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          暂停
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          播放
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      下载
                    </Button>
                  </div>
                )}

                {audioUrl && (
                  <Button
                    onClick={handleStop}
                    variant="ghost"
                    className="w-full text-gray-500 hover:text-white"
                  >
                    清除
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 mt-12">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <span>Powered by</span>
            <a
              href="https://pages.edgeone.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"
            >
              <img src="/eo-logo-blue.svg" alt="EdgeOne" width={16} height={16} />
              EdgeOne Pages
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
