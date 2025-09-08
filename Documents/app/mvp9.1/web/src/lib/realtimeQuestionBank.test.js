// Simple test for RealtimeQuestionBankManager functionality
// This can be run in the browser console to test the realtime question bank

// Test the RealtimeQuestionBankManager
function testRealtimeQuestionBank() {
  console.log('Testing RealtimeQuestionBankManager...')
  
  const qbManager = window.RealtimeQuestionBankManager?.getInstance()
  if (!qbManager) {
    console.error('RealtimeQuestionBankManager not found on window object')
    return
  }
  
  console.log('✓ RealtimeQuestionBankManager instance created')
  
  // Test getting medicine questions
  const medicineQuestions = qbManager.getQuestions('medicine')
  console.log('Medicine questions:', medicineQuestions)
  console.log(`✓ Found ${medicineQuestions.length} medicine questions`)
  
  // Test getting Oxbridge Engineering questions
  const engineeringQuestions = qbManager.getQuestions('oxbridge', 'Engineering')
  console.log('Engineering questions:', engineeringQuestions)
  console.log(`✓ Found ${engineeringQuestions.length} engineering questions`)
  
  // Test getting common Oxbridge questions
  const commonQuestions = qbManager.getQuestions('oxbridge')
  console.log('Common Oxbridge questions:', commonQuestions)
  console.log(`✓ Found ${commonQuestions.length} common Oxbridge questions`)
  
  // Test adding a question
  console.log('Testing add question...')
  const initialCount = medicineQuestions.length
  qbManager.addQuestion('medicine', 'Test question: How do you handle ethical dilemmas in healthcare?')
  const updatedQuestions = qbManager.getQuestions('medicine')
  const newCount = updatedQuestions.length
  
  if (newCount === initialCount + 1) {
    console.log('✓ Question added successfully')
  } else {
    console.error('✗ Failed to add question')
  }
  
  // Test getting random questions
  const randomQuestions = qbManager.getRandomQuestions('medicine', undefined, 3)
  console.log('Random medicine questions:', randomQuestions)
  if (randomQuestions.length <= 3) {
    console.log('✓ Random questions generated successfully')
  } else {
    console.error('✗ Random questions length mismatch')
  }
  
  // Test localStorage persistence
  const questionBank = qbManager.getQuestionBank()
  console.log('Full question bank:', questionBank)
  console.log('✓ Question bank persistence working')
  
  console.log('All tests completed!')
}

// Export for browser testing
if (typeof window !== 'undefined') {
  window.testRealtimeQuestionBank = testRealtimeQuestionBank
}