'use client'

import { useState, useRef, useEffect } from 'react'
import { HiX, HiChat, HiThumbUp, HiThumbDown, HiLightningBolt } from 'react-icons/hi'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  interactionId?: string
  feedbackGiven?: 'helpful' | 'not_helpful' | null
}

export default function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Add welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `**Hi! I'm your methodology coaching assistant.**

Ask me anything about your selected sales methodology:
• "Help me prepare for this call"
• "What questions should I ask next?"
• "How do I handle this objection?"

Or type "help" to see all topics I can help with.`
      }])
    }
  }, [isOpen, messages.length])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        interactionId: data.interactionId,
        feedbackGiven: null
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Copilot error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment."
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFeedback(messageId: string, interactionId: string, helpful: boolean) {
    try {
      await fetch('/api/copilot/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId, helpful })
      })

      // Update message to show feedback was given
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, feedbackGiven: helpful ? 'helpful' : 'not_helpful' }
          : msg
      ))
    } catch (error) {
      console.error('Feedback error:', error)
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-terracotta to-terracotta-bright text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 font-semibold"
        >
          <HiLightningBolt className="text-xl" />
          <span className="hidden sm:inline">Sales Coach</span>
        </button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl border-t-4 border-t-terracotta flex flex-col h-[600px] max-h-[80vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-terracotta to-terracotta-bright text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <HiLightningBolt className="text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sales Coach</h3>
                  <p className="text-xs text-white/80">Real-time methodology help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-bone-light/20 to-white">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-terracotta to-terracotta-bright text-white'
                        : 'bg-white border border-bone-dark shadow-sm'
                    }`}
                  >
                    {/* Message content with markdown support */}
                    <div
                      className={`text-sm prose prose-sm max-w-none ${
                        message.role === 'user' ? 'prose-invert' : 'prose-stone'
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br />')
                          .replace(/• /g, '• ')
                      }}
                    />

                    {/* Feedback buttons for assistant messages */}
                    {message.role === 'assistant' && message.interactionId && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-bone-dark/30">
                        <span className="text-xs text-stone-light mr-2">Helpful?</span>
                        <button
                          onClick={() => handleFeedback(message.id, message.interactionId!, true)}
                          disabled={message.feedbackGiven !== null}
                          className={`p-1.5 rounded-lg transition-colors ${
                            message.feedbackGiven === 'helpful'
                              ? 'bg-green-100 text-green-600'
                              : 'hover:bg-bone text-stone-light hover:text-terracotta'
                          } disabled:cursor-not-allowed`}
                        >
                          <HiThumbUp className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, message.interactionId!, false)}
                          disabled={message.feedbackGiven !== null}
                          className={`p-1.5 rounded-lg transition-colors ${
                            message.feedbackGiven === 'not_helpful'
                              ? 'bg-red-100 text-red-600'
                              : 'hover:bg-bone text-stone-light hover:text-terracotta'
                          } disabled:cursor-not-allowed`}
                        >
                          <HiThumbDown className="text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-bone-dark shadow-sm rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-terracotta rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-terracotta rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-terracotta rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-bone-dark bg-white rounded-b-xl">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your methodology..."
                  className="flex-1 px-4 py-2.5 rounded-lg border border-bone-dark focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta text-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-terracotta to-terracotta-bright text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
