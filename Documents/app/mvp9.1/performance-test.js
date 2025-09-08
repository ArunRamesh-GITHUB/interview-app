#!/usr/bin/env node

// Simple performance test for transcription endpoints
import fs from 'fs'
import fetch from 'node-fetch'

const SERVER_URL = 'http://localhost:3000'

// Simple test audio data (very short silence)
const createTestAudioFile = () => {
  // Create a minimal WebM audio file (just a few bytes of silence)
  const buffer = Buffer.from([
    0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1f, 
    0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81, 0x04,
    0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, 0x42,
    0x87, 0x81, 0x04, 0x42, 0x85, 0x81, 0x02
  ])
  
  // Write to temp file
  const filePath = './test-audio.webm'
  fs.writeFileSync(filePath, buffer)
  return filePath
}

async function testEndpoint(url, audioFile, testName) {
  console.log(`\n🧪 Testing ${testName}...`)
  
  const formData = new FormData()
  formData.append('audio', new Blob([fs.readFileSync(audioFile)], { type: 'audio/webm' }), 'test.webm')
  formData.append('question', 'What is your greatest strength?')
  formData.append('mode', 'live')
  formData.append('cvText', '[Interviewer persona: MEDICAL admissions]')
  
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${SERVER_URL}${url}`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    console.log(`✅ ${testName} completed in ${duration}ms`)
    console.log(`   - Transcript: "${data.transcript?.substring(0, 50)}..."`)
    console.log(`   - Score: ${data.scoring?.score || 'N/A'} (${data.scoring?.band || 'N/A'})`)
    console.log(`   - Immediate: ${data.immediate ? '⚡ Yes' : 'No'}`)
    
    return { duration, success: true, data }
    
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`❌ ${testName} failed after ${duration}ms: ${error.message}`)
    return { duration, success: false, error: error.message }
  }
}

async function runPerformanceTest() {
  console.log('🚀 Starting Performance Test Suite')
  console.log('==================================')
  
  // Create test audio file
  const audioFile = createTestAudioFile()
  
  try {
    // Test both endpoints multiple times for average
    const iterations = 3
    
    console.log(`\nRunning ${iterations} iterations of each endpoint...`)
    
    let fastTimes = []
    let regularTimes = []
    
    for (let i = 0; i < iterations; i++) {
      console.log(`\n--- Iteration ${i + 1}/${iterations} ---`)
      
      // Test fast endpoint
      const fastResult = await testEndpoint('/api/transcribe-fast', audioFile, 'Fast Endpoint')
      if (fastResult.success) fastTimes.push(fastResult.duration)
      
      // Wait a moment between tests
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Test regular endpoint
      const regularResult = await testEndpoint('/api/transcribe', audioFile, 'Regular Endpoint')
      if (regularResult.success) regularTimes.push(regularResult.duration)
      
      // Wait a moment before next iteration
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Calculate averages
    const avgFast = fastTimes.length ? Math.round(fastTimes.reduce((a, b) => a + b, 0) / fastTimes.length) : 0
    const avgRegular = regularTimes.length ? Math.round(regularTimes.reduce((a, b) => a + b, 0) / regularTimes.length) : 0
    
    console.log('\n📊 PERFORMANCE SUMMARY')
    console.log('=======================')
    console.log(`Fast Endpoint Average:    ${avgFast}ms`)
    console.log(`Regular Endpoint Average: ${avgRegular}ms`)
    
    if (avgFast && avgRegular) {
      const improvement = Math.round(((avgRegular - avgFast) / avgRegular) * 100)
      const speedup = Math.round(avgRegular / avgFast * 10) / 10
      
      console.log(`Performance Improvement:  ${improvement}% faster`)
      console.log(`Speed Multiplier:         ${speedup}x faster`)
      
      if (improvement > 20) {
        console.log('\n🎉 Performance optimization successful!')
      } else {
        console.log('\n⚠️  Performance improvement might be marginal')
      }
    }
    
  } finally {
    // Clean up test file
    try { fs.unlinkSync(audioFile) } catch {}
  }
}

// Run the test
runPerformanceTest().catch(console.error)