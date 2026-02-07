import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import './Chat.css'

function Chat() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Connect to the backend
    socketRef.current = io('https://project-4-backend-xe11.onrender.com', {
      reconnection: true,
    })

    socketRef.current.on('connect', () => {
      console.log('Connected to server')
    })

    socketRef.current.on('ai-response', (data) => {
      console.log('Received response:', data)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: data.response,
          sender: 'ai',
          timestamp: new Date(),
        },
      ])
      setIsLoading(false)
    })

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSendMessage = (e) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Send message to AI via Socket.IO
    if (socketRef.current) {
      socketRef.current.emit('ai-message', inputValue)
    }
  }

  return (
    <div className="chat-container">
      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-title">How can I help you today?</h2>
            <p className="empty-subtitle">
              Ask me anything or start a conversation
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-wrapper ${
                msg.sender === 'user' ? 'user' : 'ai'
              }`}
            >
              <div className="message-row">
                <div className="message-avatar">
                  {msg.sender === 'user' && <span className="avatar-text">You</span>}
                </div>
                <div className="message-content">
                  <p className="message-text">{msg.text}</p>
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="message-wrapper ai">
            <div className="message-row">
              <div className="message-avatar ai-typing-icon">✎</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="input-section">
        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message..."
            className="message-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!inputValue.trim() || isLoading}
            title="Send message (Enter)"
          >
            ↑
          </button>
        </form>
        <p className="input-footer">
          Free Research Preview. May produce inaccurate information.
        </p>
      </div>
    </div>
  )
}

export default Chat
