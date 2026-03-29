import React from 'react';
import { MessageCircle } from 'lucide-react';

const MessagesTab = ({
  chatUsers,
  selectedUserId,
  chatMessages,
  chatInput,
  setChatInput,
  loadChatForUser,
  handleSendMessage,
  messagesEndRef,
}) => (
  <div className="sa-chat-page">
    <div className="sa-chat-layout">
      <div className="sa-chat-list">
        <h3>Users</h3>
        <ul>
          {chatUsers.map((user) => {
            const active = user.userId === selectedUserId;
            return (
              <li
                key={`chat-user-${user.userId}`}
                className={active ? 'active' : ''}
                onClick={() => loadChatForUser(user.userId)}
              >
                <div className="sa-cell-main">
                  <span className="sa-cell-title">{user.name || 'User'}</span>
                  <span className="sa-cell-sub">{user.email || ''}</span>
                  {user.role && (
                    <span className="sa-cell-sub" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {user.role}
                    </span>
                  )}
                  {user.unreadCount > 0 && (
                    <span className="sa-cell-sub" style={{ color: '#2563eb', fontWeight: 600, marginTop: '4px' }}>
                      {user.unreadCount} unread
                    </span>
                  )}
                </div>
              </li>
            );
          })}
          {chatUsers.length === 0 && (
            <li style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
              No users available
            </li>
          )}
        </ul>
      </div>

      <div className="sa-chat-conversation">
        <div className="sa-chat-header">
          <h3>Messages</h3>
          {selectedUserId && (
            <span className="sa-chat-subtitle">
              Chat with{' '}
              {
                (chatUsers.find((u) => u.userId === selectedUserId) || {})
                  .name || 'User'
              }
            </span>
          )}
        </div>
        <div className="sa-chat-messages">
          {chatMessages.map((msg, index) => {
            const messageContent = msg.content || msg.Content || '';
            const messageCreatedAt = msg.createdAt || msg.CreatedAt || '';
            const messageFromUserId = msg.fromUserId || msg.FromUserId;
            const messageId = msg.id || msg.ID || index;

            // Determine if message is outgoing or incoming
            const storedUser = localStorage.getItem('user');
            let isOutgoing = false;
            if (storedUser) {
              try {
                const user = JSON.parse(storedUser);
                const currentUserId = user.id || user.ID;
                isOutgoing = String(messageFromUserId) === String(currentUserId);
              } catch (e) {
                // Default to incoming if we can't parse user
              }
            }

            return (
              <div
                key={`msg-${messageId}`}
                className={`sa-chat-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}
              >
                <p>{messageContent}</p>
                <span className="sa-chat-meta">
                  {messageCreatedAt
                    ? new Date(messageCreatedAt).toLocaleString()
                    : ''}
                </span>
              </div>
            );
          })}
          {chatMessages.length === 0 && (
            <div className="sa-table-empty">
              {selectedUserId
                ? 'No messages yet. Start the conversation!'
                : 'Select a conversation on the left to start messaging.'}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="sa-chat-input-row">
          <input
            type="text"
            placeholder="Reply..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!selectedUserId}
          />
          <button
            className="sa-primary-cta"
            onClick={handleSendMessage}
            disabled={!selectedUserId || !chatInput.trim()}
          >
            <MessageCircle size={16} />
            Send
          </button>
        </div>
      </div>

      <div className="sa-chat-details">
        <h4>Contact Details</h4>
        {selectedUserId ? (
          (() => {
            const user = chatUsers.find((u) => u.userId === selectedUserId) || {};
            return (
              <>
                <p>
                  <strong>Name:</strong> {user.name || 'N/A'}
                </p>
                <p>
                  <strong>Email:</strong> {user.email || 'N/A'}
                </p>
                <p>
                  <strong>Role:</strong> {user.role || 'N/A'}
                </p>
                {user.company && (
                  <p>
                    <strong>Company:</strong> {user.company}
                  </p>
                )}
              </>
            );
          })()
        ) : (
          <p>Select a conversation to view details.</p>
        )}
      </div>
    </div>
  </div>
);

export default MessagesTab;
