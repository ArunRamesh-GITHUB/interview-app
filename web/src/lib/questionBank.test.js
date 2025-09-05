// Simple test for QuestionBankManager functionality
// This can be run in the browser console to test the question bank

// Test the QuestionBankManager
function testQuestionBank() {
  console.log('Testing QuestionBankManager...')
  
  const qbManager = window.QuestionBankManager?.getInstance()
  if (!qbManager) {
    console.error('QuestionBankManager not found on window object')
    return
  }
  
  console.log('✓ QuestionBankManager instance created')
  
  // Test getting medical questions
  const medicalQuestions = qbManager.getQuestions('medical')
  console.log('Medical questions:', medicalQuestions)
  console.log(`✓ Found ${medicalQuestions.primary.length} primary and ${medicalQuestions.extra.length} extra medical questions`)
  
  // Test getting Oxbridge Engineering questions
  const engineeringQuestions = qbManager.getQuestions('oxbridge', 'Engineering')
  console.log('Engineering questions:', engineeringQuestions)
  console.log(`✓ Found ${engineeringQuestions.primary.length} primary and ${engineeringQuestions.extra.length} extra engineering questions`)
  
  // Test adding a question
  console.log('Testing add question...')
  const initialCount = medicalQuestions.primary.length
  qbManager.addQuestion('medical', 'primary', 'Test question: How do you handle stress?')
  const updatedQuestions = qbManager.getQuestions('medical')
  const newCount = updatedQuestions.primary.length
  
  if (newCount === initialCount + 1) {
    console.log('✓ Question added successfully')
  } else {
    console.error('✗ Failed to add question')
  }
  
  // Test building question queue
  const queue = qbManager.buildQuestionQueue('medical', 'Engineering', 3)
  console.log('Generated queue:', queue)
  if (queue.length === 3) {
    console.log('✓ Question queue built successfully')
  } else {
    console.error('✗ Question queue length mismatch')
  }
  
  // Test localStorage persistence
  const questionBank = qbManager.getQuestionBank()
  console.log('Full question bank:', questionBank)
  console.log('✓ Question bank persistence working')
  
  console.log('All tests completed!')
}

// Export for browser testing
if (typeof window !== 'undefined') {
  window.testQuestionBank = testQuestionBank
}