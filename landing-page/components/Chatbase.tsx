'use client'

import { useEffect } from 'react'

const Chatbase = () => {
  useEffect(() => {
    // Add Chatbase config
    window.embeddedChatbotConfig = {
      chatbotId: "YOUR_CHATBASE_CHATBOT_ID", // Replace with your actual Chatbase chatbot ID
      domain: "www.chatbase.co"
    }

    // Load Chatbase script
    const script = document.createElement('script')
    script.src = "https://www.chatbase.co/embed.min.js"
    script.defer = true
    script.setAttribute('chatbotId', 'YOUR_CHATBASE_CHATBOT_ID') // Replace with your actual Chatbase chatbot ID
    script.setAttribute('domain', 'www.chatbase.co')

    document.body.appendChild(script)

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}

export default Chatbase

declare global {
  interface Window {
    embeddedChatbotConfig: {
      chatbotId: string
      domain: string
    }
  }
}
