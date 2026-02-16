import { NextRequest, NextResponse } from 'next/server'
import { fullRecitationAnalysis } from '@/features/voice-recognition'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const expectedText = formData.get('expected_text') as string
    const duration = parseInt(formData.get('duration') as string) || 0

    if (!audioFile || !expectedText) {
      return NextResponse.json({ error: 'Missing audio file or expected text' }, { status: 400 })
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await fullRecitationAnalysis(buffer, expectedText, duration)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Voice analysis error:', error)
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 })
  }
}
