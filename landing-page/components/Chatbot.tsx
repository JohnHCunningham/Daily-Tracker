'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiXMark, HiChatBubbleLeftRight, HiPaperAirplane } from 'react-icons/hi2'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initial greeting when chatbot opens
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true)
      const greeting: Message = {
        role: 'assistant',
        content: "Hi! 👋 I'm here to help you understand how SalesAI.Coach can help your sales team execute their methodology with discipline.\n\nWhat brings you here today?",
        timestamp: new Date()
      }
      setMessages([greeting])
    }
  }, [isOpen, hasGreeted])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call your API endpoint to get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Check if user provided contact info and send to n8n
      if (data.leadCaptured) {
        await fetch('https://aiadvantagesolutions.app.n8n.cloud/webhook/e58280f2-f704-4517-bcf2-1395ef44edad', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'chatbot',
            ...data.leadData,
            conversation: messages.map(m => `${m.role}: ${m.content}`).join('\n')
          })
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. You can also email us at john@aiadvantagesolutions.ca or book a demo directly: https://tidycal.com/aiautomations/sales-coach",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-teal to-aqua rounded-full shadow-2xl shadow-teal/30 flex items-center justify-center hover:scale-110 transition-transform duration-200"
            aria-label="Open chat"
          >
            <HiChatBubbleLeftRight className="text-white text-3xl" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-md h-[600px] bg-navy border-2 border-teal/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal to-aqua p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-white font-bold">SalesAI Assistant</h3>
                  <p className="text-white/80 text-xs">Typically replies instantly</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                aria-label="Close chat"
              >
                <HiXMark className="text-2xl" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-navy-dark">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-teal to-aqua text-white'
                        : 'bg-navy-light border border-teal/20 text-light'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-navy-light border border-teal/20 rounded-2xl px-4 py-3">
                    <div className="flex gap-2">
                      <span className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-navy border-t border-teal/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-navy-light border border-teal/20 rounded-full px-4 py-3 text-light placeholder-light-muted focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-teal to-aqua text-white p-3 rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Send message"
                >
                  <HiPaperAirplane className="text-xl" />
                </button>
              </div>
              <p className="text-xs text-light-muted mt-2 text-center">
                Powered by AI • We respect your privacy
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chatbot
