// web/src/components/ui/realtime-question-bank-manager.tsx
import React, { useState, useEffect } from 'react'
import { Button } from './button'
import { RealtimeQuestionBankManager, RealtimePersonaKey, RealtimeOxbridgeSubject } from '../../lib/realtimeQuestionBank'
import { X, Plus, Edit3, Trash2, RotateCcw } from 'lucide-react'

const REALTIME_OXBRIDGE_SUBJECTS: RealtimeOxbridgeSubject[] = [
  'Engineering','Mathematics','Computer Science','Natural Sciences (Physics/Chemistry)',
  'Economics','PPE','Law','Medicine',
]

interface RealtimeQuestionBankManagerProps {
  isOpen: boolean
  onClose: () => void
  currentPersona: RealtimePersonaKey | null
  currentSubject: RealtimeOxbridgeSubject | null
}

export function RealtimeQuestionBankManagerComponent({ isOpen, onClose, currentPersona, currentSubject }: RealtimeQuestionBankManagerProps) {
  const [selectedPersona, setSelectedPersona] = useState<RealtimePersonaKey>(currentPersona || 'medicine')
  const [selectedSubject, setSelectedSubject] = useState<RealtimeOxbridgeSubject | null>(currentSubject)
  const [isCommonQuestions, setIsCommonQuestions] = useState<boolean>(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [editingText, setEditingText] = useState<string>('')
  const [newQuestionText, setNewQuestionText] = useState<string>('')
  const [showNewForm, setShowNewForm] = useState<boolean>(false)

  const qbManager = RealtimeQuestionBankManager.getInstance()

  // Load questions when persona/subject changes
  useEffect(() => {
    if (selectedPersona === 'oxbridge' && isCommonQuestions) {
      setQuestions(qbManager.getQuestions('oxbridge'))
    } else if (selectedPersona === 'oxbridge' && selectedSubject) {
      setQuestions(qbManager.getQuestions('oxbridge', selectedSubject))
    } else if (selectedPersona !== 'oxbridge') {
      setQuestions(qbManager.getQuestions(selectedPersona))
    } else {
      setQuestions([])
    }
  }, [selectedPersona, selectedSubject, isCommonQuestions])

  // Update selected when props change
  useEffect(() => {
    if (currentPersona) setSelectedPersona(currentPersona)
    if (currentSubject) setSelectedSubject(currentSubject)
  }, [currentPersona, currentSubject])

  if (!isOpen) return null

  const handleSaveEdit = (index: number) => {
    if (editingText.trim()) {
      const subject = selectedPersona === 'oxbridge' && !isCommonQuestions ? selectedSubject : undefined
      qbManager.editQuestion(selectedPersona, index, editingText.trim(), subject)
      loadQuestions()
    }
    setEditingIndex(-1)
    setEditingText('')
  }

  const handleCancelEdit = () => {
    setEditingIndex(-1)
    setEditingText('')
  }

  const handleStartEdit = (index: number, currentText: string) => {
    setEditingIndex(index)
    setEditingText(currentText)
  }

  const handleDeleteQuestion = (index: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const subject = selectedPersona === 'oxbridge' && !isCommonQuestions ? selectedSubject : undefined
      qbManager.removeQuestion(selectedPersona, index, subject)
      loadQuestions()
    }
  }

  const handleAddQuestion = () => {
    if (newQuestionText.trim()) {
      const subject = selectedPersona === 'oxbridge' && !isCommonQuestions ? selectedSubject : undefined
      qbManager.addQuestion(selectedPersona, newQuestionText.trim(), subject)
      loadQuestions()
      setNewQuestionText('')
      setShowNewForm(false)
    }
  }

  const loadQuestions = () => {
    if (selectedPersona === 'oxbridge' && isCommonQuestions) {
      setQuestions(qbManager.getQuestions('oxbridge'))
    } else if (selectedPersona === 'oxbridge' && selectedSubject) {
      setQuestions(qbManager.getQuestions('oxbridge', selectedSubject))
    } else if (selectedPersona !== 'oxbridge') {
      setQuestions(qbManager.getQuestions(selectedPersona))
    } else {
      setQuestions([])
    }
  }

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all questions to defaults? This will remove all your custom questions and cannot be undone.')) {
      qbManager.resetToDefaults()
      loadQuestions()
    }
  }

  const handlePersonaChange = (persona: RealtimePersonaKey) => {
    setSelectedPersona(persona)
    if (persona !== 'oxbridge') {
      setSelectedSubject(null)
      setIsCommonQuestions(false)
    } else {
      setSelectedSubject(REALTIME_OXBRIDGE_SUBJECTS[0])
      setIsCommonQuestions(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl border border-divider w-full max-w-4xl max-h-[90vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-divider">
          <h2 className="text-xl font-semibold text-text-primary">Realtime Question Bank Manager</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-divider bg-surface space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Persona */}
            <div className="space-y-1">
              <label className="text-sm text-text-secondary">Persona</label>
              <select 
                className="w-full rounded-md border border-divider bg-card text-text-primary px-3 py-2.5 text-sm"
                value={selectedPersona} 
                onChange={e => handlePersonaChange(e.target.value as RealtimePersonaKey)}
              >
                <option value="medicine">Medicine</option>
                <option value="oxbridge">Oxbridge</option>
                <option value="apprenticeship">Apprenticeship</option>
              </select>
            </div>

            {/* Subject/Question Type (for Oxbridge) */}
            {selectedPersona === 'oxbridge' && (
              <div className="space-y-1">
                <label className="text-sm text-text-secondary">Questions For</label>
                <select 
                  className="w-full rounded-md border border-divider bg-card text-text-primary px-3 py-2.5 text-sm"
                  value={isCommonQuestions ? 'common' : selectedSubject || ''}
                  onChange={e => {
                    if (e.target.value === 'common') {
                      setIsCommonQuestions(true)
                      setSelectedSubject(null)
                    } else {
                      setIsCommonQuestions(false)
                      setSelectedSubject(e.target.value as RealtimeOxbridgeSubject)
                    }
                  }}
                >
                  <option value="common">Common Questions</option>
                  {REALTIME_OXBRIDGE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowNewForm(!showNewForm)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Question
            </Button>
            <Button
              variant="outline"
              onClick={handleResetToDefaults}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <RotateCcw size={16} />
              Reset All to Defaults
            </Button>
          </div>

          {/* Add New Question Form */}
          {showNewForm && (
            <div className="bg-card p-4 rounded-lg border border-divider space-y-3">
              <div className="space-y-1">
                <label className="text-sm text-text-secondary">New Question</label>
                <textarea
                  className="w-full rounded-md border border-divider bg-card text-text-primary px-3 py-2.5 text-sm min-h-[80px] resize-y"
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                  placeholder="Enter your new question here..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddQuestion} disabled={!newQuestionText.trim()}>
                  Add
                </Button>
                <Button variant="outline" onClick={() => {setShowNewForm(false); setNewQuestionText('')}}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                {selectedPersona === 'oxbridge' 
                  ? `${isCommonQuestions ? 'Common Oxbridge' : selectedSubject} Questions`
                  : `${selectedPersona.charAt(0).toUpperCase() + selectedPersona.slice(1)} Questions`
                }
              </h3>
              <span className="text-sm text-text-secondary">{questions.length} questions</span>
            </div>
            
            {questions.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No questions found. Add some questions to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={index} className="bg-surface rounded-lg border border-divider p-4">
                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <textarea
                          className="w-full rounded-md border border-divider bg-card text-text-primary px-3 py-2.5 text-sm min-h-[80px] resize-y"
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleSaveEdit(index)} disabled={!editingText.trim()}>
                            Save
                          </Button>
                          <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-xs text-text-secondary mb-1">Question {index + 1}</div>
                          <div className="text-text-primary leading-relaxed">{question}</div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStartEdit(index, question)}
                            className="p-2 hover:bg-surface-alt rounded-md transition-colors"
                            title="Edit question"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(index)}
                            className="p-2 hover:bg-surface-alt rounded-md transition-colors text-red-600 hover:text-red-700"
                            title="Delete question"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-divider bg-surface">
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  )
}