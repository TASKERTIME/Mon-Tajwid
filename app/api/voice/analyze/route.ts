import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const expectedText = formData.get('expected_text') as string
    const duration = parseInt(formData.get('duration') as string) || 0

    if (!audioFile || !expectedText) {
      return NextResponse.json({ error: 'MISSING_DATA' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'placeholder' || apiKey.length < 10) {
      return NextResponse.json({ error: 'NO_API_KEY' }, { status: 503 })
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)
    const blob = new Blob([uint8], { type: 'audio/webm' })
    const file = new File([blob], 'recitation.webm', { type: 'audio/webm' })

    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey })

    let recited: string
    try {
      const transcription = await openai.audio.transcriptions.create({
        file, model: 'whisper-1', language: 'ar', response_format: 'text',
        prompt: 'بسم الله الرحمن الرحيم',
      })
      recited = transcription as unknown as string
    } catch (whisperErr: any) {
      console.error('Whisper error:', whisperErr?.message, whisperErr?.status, whisperErr?.code)
      const msg = (whisperErr?.message || '').toLowerCase()
      const code = whisperErr?.code || ''
      const status = whisperErr?.status || 0

      if (status === 429 || msg.includes('quota') || msg.includes('billing') || 
          msg.includes('insufficient') || code === 'insufficient_quota' ||
          msg.includes('exceeded') || msg.includes('rate_limit')) {
        return NextResponse.json({ error: 'NO_CREDIT' }, { status: 402 })
      }
      if (msg.includes('api key') || msg.includes('invalid_api_key') || msg.includes('authentication')) {
        return NextResponse.json({ error: 'INVALID_API_KEY' }, { status: 401 })
      }
      return NextResponse.json({ error: 'WHISPER_FAILED', detail: whisperErr?.message }, { status: 500 })
    }

    if (!recited || recited.trim().length === 0) {
      return NextResponse.json({ error: 'EMPTY_AUDIO' }, { status: 200 })
    }

    const { compareRecitation, analyzeTajwid } = await import('@/features/tajwid-engine')
    const { accuracy, differences } = compareRecitation(expectedText, recited)
    const tajwidAnalysis = analyzeTajwid(expectedText)
    const overallScore = Math.round(accuracy * 0.6 + tajwidAnalysis.score * 0.4)

    const details = [
      { rule: 'Ghunnah (nasalisation)', status: accuracy >= 60 ? 'correct' : 'manquant', tip: 'Prolonge le son nasal de 2 temps sur noon/meem avec shadda.' },
      { rule: 'Madd naturel', status: accuracy >= 55 ? 'correct' : 'trop court', tip: 'Allonge la voyelle longue de 2 temps.' },
      { rule: 'Ikhfa (dissimulation)', status: accuracy >= 65 ? 'correct' : 'absent', tip: 'Le noon sakin doit être prononcé de façon nasale et légère devant les lettres d\'ikhfa.' },
      { rule: 'Qalqalah (rebond)', status: accuracy >= 50 ? 'correct' : 'faible', tip: 'Les lettres ق ط ب ج د doivent rebondir clairement en position de sukun.' },
      { rule: 'Idgham (fusion)', status: accuracy >= 70 ? 'correct' : 'manquant', tip: 'Le noon sakin doit être fusionné avec la lettre suivante (ي ن م و ل ر).' },
    ]

    return NextResponse.json({
      overallScore, accuracy, transcription: recited, differences,
      tajwidAnalysis: { score: tajwidAnalysis.score, details },
    })
  } catch (error: any) {
    console.error('Voice analysis error:', error)
    return NextResponse.json({ error: 'SERVER_ERROR', detail: error?.message }, { status: 500 })
  }
}
