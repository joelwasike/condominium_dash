import React, { useState, useMemo, useEffect } from 'react';
import { MessageCircle, Send, Search, User, Mail, Building2, ChevronLeft, Circle, Users, Briefcase } from 'lucide-react';
import { buildApiUrl, apiRequest } from '../config/api';

/* ─── helpers ─── */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#06b6d4', '#6366f1', '#f43f5e', '#14b8a6', '#a855f7',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  if (hrs < 48) return 'yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getCurrentUserId() {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      return user.id || user.ID;
    }
  } catch {}
  return null;
}

function getRoleBadge(role) {
  const map = {
    tenant: { bg: '#dbeafe', color: '#1d4ed8', label: 'Tenant' },
    landlord: { bg: '#fef3c7', color: '#92400e', label: 'Landlord' },
    salesmanager: { bg: '#d1fae5', color: '#065f46', label: 'Sales Manager' },
    accounting: { bg: '#ede9fe', color: '#5b21b6', label: 'Accounting' },
    admin: { bg: '#fce7f3', color: '#9d174d', label: 'Admin' },
    technician: { bg: '#ffedd5', color: '#9a3412', label: 'Technician' },
    superadmin: { bg: '#fee2e2', color: '#991b1b', label: 'Super Admin' },
    agency_director: { bg: '#e0e7ff', color: '#3730a3', label: 'Director' },
  };
  return map[role] || { bg: '#f3f4f6', color: '#374151', label: role || 'User' };
}

/* ─── component ─── */
export default function MessagingPanel({
  chatUsers = [],
  selectedUserId,
  chatMessages = [],
  chatInput = '',
  setChatInput,
  loadChatForUser,
  handleSendMessage,
  messagesEndRef,
  hideGroups = false,
}) {
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [groups, setGroups] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const isGroupSelected = !hideGroups && selectedUserId && String(selectedUserId).startsWith('group:');
  const selectedGroupId = isGroupSelected ? String(selectedUserId).replace('group:', '') : null;
  const selectedGroup = groups.find(g => g.groupId === selectedGroupId);

  const selectedUser = isGroupSelected ? null : chatUsers.find(u => u.userId === selectedUserId);

  // Load groups on mount
  useEffect(() => {
    if (hideGroups) {
      setGroups([]);
      return;
    }
    const loadGroups = async () => {
      try {
        const url = buildApiUrl('/api/messaging/groups');
        const data = await apiRequest(url);
        setGroups(Array.isArray(data) ? data : []);
      } catch {}
    };
    loadGroups();
  }, [hideGroups]);

  // Load group messages when a group is selected
  useEffect(() => {
    if (!isGroupSelected || !selectedGroupId) return;
    const loadGroupMessages = async () => {
      try {
        const url = buildApiUrl(`/api/messaging/groups/${selectedGroupId}/messages`);
        const data = await apiRequest(url);
        setGroupMessages(Array.isArray(data) ? data : []);
      } catch {}
    };
    loadGroupMessages();
  }, [isGroupSelected, selectedGroupId]);

  const handleSelectGroup = (groupId) => {
    if (hideGroups) return;
    loadChatForUser('group:' + groupId);
    setMobileView('chat');
  };

  const handleSendGroupMessage = async () => {
    if (!chatInput.trim() || !selectedGroupId) return;
    try {
      const url = buildApiUrl(`/api/messaging/groups/${selectedGroupId}/messages`);
      await apiRequest(url, { method: 'POST', body: JSON.stringify({ content: chatInput.trim() }) });
      setChatInput('');
      const data = await apiRequest(buildApiUrl(`/api/messaging/groups/${selectedGroupId}/messages`));
      setGroupMessages(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleSendAny = () => {
    if (isGroupSelected) {
      handleSendGroupMessage();
    } else {
      handleSendMessage();
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return chatUsers;
    const q = search.toLowerCase();
    return chatUsers.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  }, [chatUsers, search]);

  const handleSelectUser = (userId) => {
    loadChatForUser(userId);
    setMobileView('chat');
  };

  const handleBack = () => {
    setMobileView('list');
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = '';
    chatMessages.forEach((msg) => {
      const ts = msg.createdAt || msg.CreatedAt || '';
      const dateStr = ts ? new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : '';
      if (dateStr !== lastDate) {
        groups.push({ type: 'date', label: dateStr });
        lastDate = dateStr;
      }
      groups.push({ type: 'message', msg });
    });
    return groups;
  }, [chatMessages]);

  // Group messages by date for group chats
  const groupedGroupMessages = useMemo(() => {
    const groups = [];
    let lastDate = '';
    groupMessages.forEach((msg) => {
      const ts = msg.createdAt || '';
      const dateStr = ts ? new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : '';
      if (dateStr !== lastDate) {
        groups.push({ type: 'date', label: dateStr });
        lastDate = dateStr;
      }
      groups.push({ type: 'message', msg });
    });
    return groups;
  }, [groupMessages]);

  return (
    <div style={{ ...s.root, gridTemplateColumns: (selectedUser || selectedGroup) ? '320px 1fr 280px' : '320px 1fr' }}>
      {/* ─── Sidebar: User list ─── */}
      <div style={{ ...s.sidebar, ...(mobileView === 'chat' ? s.sidebarHiddenMobile : {}) }}>
        {/* Search header */}
        <div style={s.sidebarHeader}>
          <h3 style={s.sidebarTitle}>Messages</h3>
          <span style={s.userCount}>{chatUsers.length}</span>
        </div>
        <div style={s.searchWrap}>
          <Search size={16} style={s.searchIcon} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </div>

        {/* User list */}
        <div style={s.userList}>
          {/* Pinned group chats */}
          {!hideGroups && groups.map(group => {
            const active = selectedUserId === 'group:' + group.groupId;
            const isCompany = group.groupId === 'company';
            const borderColor = isCompany ? '#3b82f6' : '#10b981';
            const iconBg = isCompany ? '#dbeafe' : '#d1fae5';
            const iconColor = isCompany ? '#3b82f6' : '#10b981';
            return (
              <div
                key={`g-${group.groupId}`}
                onClick={() => handleSelectGroup(group.groupId)}
                style={{
                  ...s.userItem,
                  ...(active ? s.userItemActive : {}),
                  borderLeft: `3px solid ${active ? 'transparent' : borderColor}`,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  ...s.avatar,
                  backgroundColor: active ? '#fff' : iconBg,
                  borderRadius: '50%',
                }}>
                  {isCompany
                    ? <Users size={20} style={{ color: active ? '#3b82f6' : iconColor }} />
                    : <Briefcase size={20} style={{ color: active ? '#10b981' : iconColor }} />
                  }
                </div>
                <div style={s.userInfo}>
                  <div style={s.userNameRow}>
                    <span style={{ ...s.userName, ...(active ? { color: '#fff' } : {}) }}>
                      {group.name}
                    </span>
                    {group.lastMessageTime && (
                      <span style={{ ...s.timeLabel, ...(active ? { color: 'rgba(255,255,255,0.7)' } : {}) }}>
                        {formatTime(group.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div style={s.userMeta}>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                      color: active ? '#fff' : '#64748b',
                      letterSpacing: '0.05em',
                    }}>GROUP</span>
                    <span style={{
                      fontSize: '0.7rem',
                      color: active ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                      marginLeft: '4px',
                    }}>{group.memberCount} members</span>
                  </div>
                </div>
              </div>
            );
          })}
          {groups.length > 0 && filteredUsers.length > 0 && (
            <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 12px' }} />
          )}
          {filteredUsers.map(user => {
            const active = user.userId === selectedUserId;
            const badge = getRoleBadge(user.role);
            return (
              <div
                key={`u-${user.userId}`}
                onClick={() => handleSelectUser(user.userId)}
                style={{
                  ...s.userItem,
                  ...(active ? s.userItemActive : {}),
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Avatar */}
                <div style={{ ...s.avatar, backgroundColor: active ? '#fff' : getAvatarColor(user.name) }}>
                  <span style={{ ...s.avatarText, color: active ? '#3b82f6' : '#fff' }}>
                    {getInitials(user.name)}
                  </span>
                  {user.unreadCount > 0 && <span style={s.onlineDot} />}
                </div>

                {/* Info */}
                <div style={s.userInfo}>
                  <div style={s.userNameRow}>
                    <span style={{ ...s.userName, ...(active ? { color: '#1d4ed8' } : {}) }}>
                      {user.name || 'User'}
                    </span>
                    {user.lastMessageAt && (
                      <span style={s.timeLabel}>{formatTime(user.lastMessageAt)}</span>
                    )}
                  </div>
                  <div style={s.userMeta}>
                    <span style={{ ...s.rolePill, backgroundColor: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    {user.unreadCount > 0 && (
                      <span style={s.unreadBadge}>{user.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredUsers.length === 0 && (
            <div style={s.emptyList}>
              <User size={32} style={{ color: '#cbd5e1', marginBottom: 8 }} />
              <span>{search ? 'No users match your search' : 'No conversations yet'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Main: Conversation ─── */}
      <div style={{ ...s.main, ...(mobileView === 'list' ? s.mainHiddenMobile : {}) }}>
        {(selectedUser || selectedGroup) ? (
          <>
            {/* Chat header */}
            <div style={s.chatHeader}>
              <button type="button" onClick={handleBack} style={s.backBtn}>
                <ChevronLeft size={20} />
              </button>
              {selectedGroup ? (
                <>
                  <div style={{
                    ...s.avatar, ...s.avatarSm,
                    backgroundColor: selectedGroup.groupId === 'company' ? '#dbeafe' : '#d1fae5',
                    borderRadius: '50%',
                  }}>
                    {selectedGroup.groupId === 'company'
                      ? <Users size={18} style={{ color: '#3b82f6' }} />
                      : <Briefcase size={18} style={{ color: '#10b981' }} />
                    }
                  </div>
                  <div style={s.chatHeaderInfo}>
                    <span style={s.chatHeaderName}>{selectedGroup.name}</span>
                    <span style={s.chatHeaderSub}>
                      {selectedGroup.memberCount} members {selectedGroup.description ? ` \u00b7 ${selectedGroup.description}` : ''}
                    </span>
                  </div>
                  <span style={{
                    ...s.rolePill, ...s.rolePillHeader,
                    backgroundColor: selectedGroup.groupId === 'company' ? '#dbeafe' : '#d1fae5',
                    color: selectedGroup.groupId === 'company' ? '#3b82f6' : '#10b981',
                  }}>
                    Group
                  </span>
                </>
              ) : (
                <>
                  <div style={{ ...s.avatar, ...s.avatarSm, backgroundColor: getAvatarColor(selectedUser.name) }}>
                    <span style={{ ...s.avatarText, fontSize: '0.7rem' }}>{getInitials(selectedUser.name)}</span>
                  </div>
                  <div style={s.chatHeaderInfo}>
                    <span style={s.chatHeaderName}>{selectedUser.name || 'User'}</span>
                    <span style={s.chatHeaderSub}>
                      {selectedUser.email}
                      {selectedUser.company ? ` \u00b7 ${selectedUser.company}` : ''}
                    </span>
                  </div>
                  <span style={{ ...s.rolePill, ...s.rolePillHeader, backgroundColor: getRoleBadge(selectedUser.role).bg, color: getRoleBadge(selectedUser.role).color }}>
                    {getRoleBadge(selectedUser.role).label}
                  </span>
                </>
              )}
            </div>

            {/* Messages */}
            <div style={s.messages}>
              {selectedGroup ? (
                <>
                  {groupedGroupMessages.map((item, i) => {
                    if (item.type === 'date') {
                      return (
                        <div key={`gdate-${i}`} style={s.dateDivider}>
                          <span style={s.dateLine} />
                          <span style={s.dateLabel}>{item.label}</span>
                          <span style={s.dateLine} />
                        </div>
                      );
                    }
                    const msg = item.msg;
                    const content = msg.content || '';
                    const ts = msg.createdAt || '';
                    const fromId = msg.fromUserId;
                    const fromName = msg.fromName || 'Unknown';
                    const isOutgoing = String(fromId) === String(currentUserId);
                    const id = msg.id || i;

                    return (
                      <div key={`gm-${id}`} style={{ ...s.bubbleRow, justifyContent: isOutgoing ? 'flex-end' : 'flex-start' }}>
                        {!isOutgoing && (
                          <div style={{ ...s.avatarTiny, backgroundColor: getAvatarColor(fromName) }}>
                            <span style={{ ...s.avatarText, fontSize: '0.55rem' }}>{getInitials(fromName)}</span>
                          </div>
                        )}
                        <div style={{
                          ...s.bubble,
                          ...(isOutgoing ? s.bubbleOut : s.bubbleIn),
                        }}>
                          {!isOutgoing && (
                            <span style={{
                              display: 'block',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: getAvatarColor(fromName),
                              marginBottom: '2px',
                            }}>{fromName}</span>
                          )}
                          <p style={s.bubbleText}>{content}</p>
                          <span style={{ ...s.bubbleMeta, ...(isOutgoing ? s.bubbleMetaOut : {}) }}>
                            {formatFullTime(ts)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {groupMessages.length === 0 && (
                    <div style={s.emptyChat}>
                      <div style={s.emptyChatIcon}>
                        <Users size={40} style={{ color: '#cbd5e1' }} />
                      </div>
                      <p style={s.emptyChatTitle}>No group messages yet</p>
                      <p style={s.emptyChatSub}>Send a message to start the group conversation</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {groupedMessages.map((item, i) => {
                    if (item.type === 'date') {
                      return (
                        <div key={`date-${i}`} style={s.dateDivider}>
                          <span style={s.dateLine} />
                          <span style={s.dateLabel}>{item.label}</span>
                          <span style={s.dateLine} />
                        </div>
                      );
                    }
                    const msg = item.msg;
                    const content = msg.content || msg.Content || '';
                    const ts = msg.createdAt || msg.CreatedAt || '';
                    const fromId = msg.fromUserId || msg.FromUserId;
                    const isOutgoing = String(fromId) === String(currentUserId);
                    const id = msg.id || msg.ID || i;

                    return (
                      <div key={`m-${id}`} style={{ ...s.bubbleRow, justifyContent: isOutgoing ? 'flex-end' : 'flex-start' }}>
                        {!isOutgoing && (
                          <div style={{ ...s.avatarTiny, backgroundColor: getAvatarColor(selectedUser.name) }}>
                            <span style={{ ...s.avatarText, fontSize: '0.55rem' }}>{getInitials(selectedUser.name)}</span>
                          </div>
                        )}
                        <div style={{
                          ...s.bubble,
                          ...(isOutgoing ? s.bubbleOut : s.bubbleIn),
                        }}>
                          <p style={s.bubbleText}>{content}</p>
                          <span style={{ ...s.bubbleMeta, ...(isOutgoing ? s.bubbleMetaOut : {}) }}>
                            {formatFullTime(ts)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {chatMessages.length === 0 && (
                    <div style={s.emptyChat}>
                      <div style={s.emptyChatIcon}>
                        <MessageCircle size={40} style={{ color: '#cbd5e1' }} />
                      </div>
                      <p style={s.emptyChatTitle}>No messages yet</p>
                      <p style={s.emptyChatSub}>Send a message to start the conversation</p>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={s.inputBar}>
              <input
                type="text"
                placeholder={selectedGroup ? `Message ${selectedGroup.name}...` : 'Type a message...'}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAny(); } }}
                style={s.input}
              />
              <button
                type="button"
                onClick={handleSendAny}
                disabled={!chatInput.trim()}
                style={{
                  ...s.sendBtn,
                  ...(chatInput.trim() ? s.sendBtnActive : {}),
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div style={s.noSelection}>
            <div style={s.noSelectionInner}>
              <div style={s.noSelectionCircle}>
                <MessageCircle size={48} style={{ color: '#94a3b8' }} />
              </div>
              <h3 style={s.noSelectionTitle}>Select a conversation</h3>
              <p style={s.noSelectionSub}>Choose a user or group from the left to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Right: Contact details (desktop only) ─── */}
      {selectedGroup && (
        <div style={s.details}>
          <div style={s.detailsAvatar}>
            <div style={{
              ...s.avatar, ...s.avatarLg,
              backgroundColor: selectedGroup.groupId === 'company' ? '#dbeafe' : '#d1fae5',
              borderRadius: '50%',
            }}>
              {selectedGroup.groupId === 'company'
                ? <Users size={32} style={{ color: '#3b82f6' }} />
                : <Briefcase size={32} style={{ color: '#10b981' }} />
              }
            </div>
            <h4 style={s.detailsName}>{selectedGroup.name}</h4>
            <span style={{
              ...s.rolePill,
              backgroundColor: selectedGroup.groupId === 'company' ? '#dbeafe' : '#d1fae5',
              color: selectedGroup.groupId === 'company' ? '#3b82f6' : '#10b981',
            }}>
              Group Chat
            </span>
          </div>
          <div style={s.detailsSection}>
            <div style={s.detailRow}>
              <Users size={15} style={s.detailIcon} />
              <div>
                <span style={s.detailLabel}>Members</span>
                <span style={s.detailValue}>{selectedGroup.memberCount} members</span>
              </div>
            </div>
            <div style={s.detailRow}>
              <MessageCircle size={15} style={s.detailIcon} />
              <div>
                <span style={s.detailLabel}>Description</span>
                <span style={s.detailValue}>{selectedGroup.description || 'Group chat'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedUser && (
        <div style={s.details}>
          <div style={s.detailsAvatar}>
            <div style={{ ...s.avatar, ...s.avatarLg, backgroundColor: getAvatarColor(selectedUser.name) }}>
              <span style={{ ...s.avatarText, fontSize: '1.4rem' }}>{getInitials(selectedUser.name)}</span>
            </div>
            <h4 style={s.detailsName}>{selectedUser.name || 'User'}</h4>
            <span style={{ ...s.rolePill, backgroundColor: getRoleBadge(selectedUser.role).bg, color: getRoleBadge(selectedUser.role).color }}>
              {getRoleBadge(selectedUser.role).label}
            </span>
          </div>
          <div style={s.detailsSection}>
            <div style={s.detailRow}>
              <Mail size={15} style={s.detailIcon} />
              <div>
                <span style={s.detailLabel}>Email</span>
                <span style={s.detailValue}>{selectedUser.email || 'N/A'}</span>
              </div>
            </div>
            {selectedUser.company && (
              <div style={s.detailRow}>
                <Building2 size={15} style={s.detailIcon} />
                <div>
                  <span style={s.detailLabel}>Company</span>
                  <span style={s.detailValue}>{selectedUser.company}</span>
                </div>
              </div>
            )}
            <div style={s.detailRow}>
              <Circle size={15} style={{ ...s.detailIcon, color: '#10b981' }} />
              <div>
                <span style={s.detailLabel}>Status</span>
                <span style={{ ...s.detailValue, color: '#10b981', fontWeight: 600 }}>Online</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ─── Styles ─── */
const s = {
  root: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr 280px',
    gap: 0,
    height: 'calc(100vh - 160px)',
    minHeight: '500px',
    background: '#fff',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
    border: '1px solid #f1f5f9',
  },

  /* Sidebar */
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #f1f5f9',
    background: '#fff',
    overflow: 'hidden',
  },
  sidebarHiddenMobile: {},
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '20px 20px 0',
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  userCount: {
    background: '#f1f5f9',
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '99px',
  },
  searchWrap: {
    position: 'relative',
    padding: '16px 20px 12px',
  },
  searchIcon: {
    position: 'absolute',
    left: '32px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    background: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  userList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 8px 8px',
  },

  /* User item */
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    marginBottom: '2px',
  },
  userItemActive: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },

  /* Avatar */
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
  },
  avatarSm: { width: '36px', height: '36px', borderRadius: '12px' },
  avatarLg: { width: '72px', height: '72px', borderRadius: '22px' },
  avatarTiny: {
    width: '28px',
    height: '28px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
  onlineDot: {
    position: 'absolute',
    bottom: '-1px',
    right: '-1px',
    width: '12px',
    height: '12px',
    borderRadius: '99px',
    background: '#10b981',
    border: '2px solid #fff',
  },

  /* User info */
  userInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  userNameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1e293b',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  timeLabel: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    fontWeight: 500,
    flexShrink: 0,
  },
  userMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  rolePill: {
    fontSize: '0.65rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '99px',
    letterSpacing: '0.01em',
  },
  rolePillHeader: {
    marginLeft: 'auto',
    fontSize: '0.7rem',
    padding: '4px 10px',
  },
  unreadBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    background: '#3b82f6',
    color: '#fff',
    width: '20px',
    height: '20px',
    borderRadius: '99px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  emptyList: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#94a3b8',
    fontSize: '0.85rem',
    textAlign: 'center',
  },

  /* Main conversation */
  main: {
    display: 'flex',
    flexDirection: 'column',
    background: '#fafbfc',
    overflow: 'hidden',
    minWidth: 0,
  },
  mainHiddenMobile: {},

  /* Chat header */
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    background: '#fff',
    borderBottom: '1px solid #f1f5f9',
    flexShrink: 0,
  },
  backBtn: {
    display: 'none', // shown via media query workaround below
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
  },
  chatHeaderInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeaderName: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  chatHeaderSub: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  /* Messages area */
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  /* Date divider */
  dateDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '16px 0',
  },
  dateLine: {
    flex: 1,
    height: '1px',
    background: '#e2e8f0',
  },
  dateLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },

  /* Bubble */
  bubbleRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    marginBottom: '2px',
  },
  bubble: {
    maxWidth: '65%',
    padding: '10px 16px',
    borderRadius: '18px',
    fontSize: '0.88rem',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  bubbleIn: {
    background: '#fff',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    borderBottomLeftRadius: '6px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  bubbleOut: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    borderBottomRightRadius: '6px',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
  },
  bubbleText: {
    margin: 0,
  },
  bubbleMeta: {
    display: 'block',
    marginTop: '4px',
    fontSize: '0.65rem',
    color: '#94a3b8',
    textAlign: 'right',
  },
  bubbleMetaOut: {
    color: 'rgba(255,255,255,0.7)',
  },

  /* Empty chat */
  emptyChat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
    padding: '40px',
  },
  emptyChatIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyChatTitle: {
    margin: '0 0 4px',
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#475569',
  },
  emptyChatSub: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#94a3b8',
  },

  /* Input bar */
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 24px',
    background: '#fff',
    borderTop: '1px solid #f1f5f9',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '12px 18px',
    border: '2px solid #e2e8f0',
    borderRadius: '24px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: '#f8fafc',
    boxSizing: 'border-box',
  },
  sendBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    background: '#e2e8f0',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'not-allowed',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  sendBtnActive: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },

  /* No selection */
  noSelection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    background: '#fafbfc',
  },
  noSelectionInner: {
    textAlign: 'center',
  },
  noSelectionCircle: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  noSelectionTitle: {
    margin: '0 0 6px',
    fontSize: '1.15rem',
    fontWeight: 600,
    color: '#334155',
  },
  noSelectionSub: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#94a3b8',
  },

  /* Details panel */
  details: {
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #f1f5f9',
    background: '#fff',
    padding: '28px 20px',
    overflow: 'hidden',
  },
  detailsAvatar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '24px',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '20px',
  },
  detailsName: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
  },
  detailsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  detailIcon: {
    color: '#94a3b8',
    marginTop: '2px',
    flexShrink: 0,
  },
  detailLabel: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '2px',
  },
  detailValue: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#334155',
    wordBreak: 'break-all',
  },
};

/* ─── Responsive style injection ─── */
if (typeof document !== 'undefined') {
  const styleId = 'messaging-panel-responsive';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media (max-width: 1024px) {
        /* Hide details panel on tablet */
      }
      @media (max-width: 768px) {
        /* Stack layout on mobile */
      }
    `;
    document.head.appendChild(style);
  }
}
