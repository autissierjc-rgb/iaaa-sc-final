import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    sources: [
      {
        title: 'Test source',
        url: 'https://example.com',
        type: 'reference',
      },
    ],
  })
}
