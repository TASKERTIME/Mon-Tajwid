/**
 * Voice Recognition Service
 * Enregistrement micro + envoi Whisper API + comparaison texte
 */

import { compareRecitation, analyzeTajwid, type TajwidAnalysis } from '../tajwid-engine'

export interface RecitationResult {
  transcription: string
  accuracy: number
  tajwidAnalysis: TajwidAnalysis
  overallScore: number
  differences: string[]
  durationSeconds: number
}

// ===================== VOICE RECORDER =====================

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private startTime: number = 0
  private stream: MediaStream | null = null

  async start(): Promise<void> {
    this.chunks = []
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: this.getSupportedMimeType(),
    })

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }

    this.startTime = Date.now()
    this.mediaRecorder.start(250)
  }

  stop(): Promise<{ blob: Blob; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Not recording'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.chunks[0]?.type || 'audio/webm' })
        const duration = Math.round((Date.now() - this.startTime) / 1000)
        this.cleanup()
        resolve({ blob, duration })
      }

      this.mediaRecorder.onerror = (e) => {
        this.cleanup()
        reject(e)
      }

      this.mediaRecorder.stop()
    })
  }

  pause(): void {
    this.mediaRecorder?.pause()
  }

  resume(): void {
    this.mediaRecorder?.resume()
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.mediaRecorder = null
    this.chunks = []
  }

  private getSupportedMimeType(): string {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || 'audio/webm'
  }
}

// ===================== CLIENT-SIDE ANALYSIS =====================

export async function analyzeRecitation(
  audioBlob: Blob,
  expectedText: string,
  durationSeconds: number
): Promise<RecitationResult> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recitation.webm')
  formData.append('expected_text', expectedText)
  formData.append('duration', durationSeconds.toString())

  const response = await fetch('/api/voice/analyze', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`)
  }

  return response.json()
}

// ===================== SERVER-SIDE PIPELINE =====================

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Convert Buffer to Uint8Array then to File — avoids Buffer/BlobPart type conflict
  const uint8 = new Uint8Array(audioBuffer)
  const blob = new Blob([uint8], { type: 'audio/webm' })
  const file = new File([blob], 'recitation.webm', { type: 'audio/webm' })

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'ar',
    response_format: 'text',
    prompt: '\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062D\u0645\u0646 \u0627\u0644\u0631\u062D\u064A\u0645',
  })

  return transcription as unknown as string
}

export async function fullRecitationAnalysis(
  audioBuffer: Buffer,
  expectedText: string,
  durationSeconds: number
): Promise<RecitationResult> {
  const transcription = await transcribeAudio(audioBuffer)
  const { accuracy, differences } = compareRecitation(expectedText, transcription)
  const tajwidAnalysis = analyzeTajwid(expectedText)
  const overallScore = Math.round(accuracy * 0.6 + tajwidAnalysis.score * 0.4)

  return {
    transcription,
    accuracy,
    tajwidAnalysis,
    overallScore,
    differences,
    durationSeconds,
  }
}
