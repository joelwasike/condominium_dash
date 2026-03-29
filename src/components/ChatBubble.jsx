import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Phone, Video, MoreVertical } from 'lucide-react';
import './ChatBubble.css';

const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! How can I help you today?",
      sender: 'support',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      setMessages([...messages, message]);
      setNewMessage('');
      
      // Simulate response after 1 second
      setTimeout(() => {
        const response = {
          id: messages.length + 2,
          text: "Thank you for your message. Our support team will get back to you shortly.",
          sender: 'support',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setMessages(prev => [...prev, response]);
      }, 1000);
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <div className={`chat-bubble ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && <span className="notification-dot"></span>}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <h4>Support Chat</h4>
              <span className="status-online">Online</span>
            </div>
            <div className="chat-header-actions">
              <button className="action-btn"><Phone size={16} /></button>
              <button className="action-btn"><Video size={16} /></button>
              <button className="action-btn"><MoreVertical size={16} /></button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">{message.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="message-input"
            />
            <button type="submit" className="send-button">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBubble;
