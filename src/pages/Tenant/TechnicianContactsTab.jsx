import React from 'react';
import { Phone, Copy, Search } from 'lucide-react';

const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const searchBar = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '220px' };
const emptyState = { padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' };

const TechnicianContactsTab = ({
  loading, technicianContacts, technicianContactSearch, setTechnicianContactSearch, addNotification
}) => {
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addNotification('Phone number copied to clipboard!', 'success');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {document.execCommand('copy');addNotification('Phone number copied to clipboard!', 'success');}
      catch (err) {addNotification('Failed to copy phone number', 'error');}
      document.body.removeChild(textArea);
    }
  };

  const searchTrim = (technicianContactSearch || '').trim().toLowerCase();
  const filteredContacts = searchTrim ?
  technicianContacts.filter((contact) => {
    const name = (contact.Name || contact.name || '').toLowerCase();
    const category = (contact.Category || contact.category || '').toLowerCase();
    return name.includes(searchTrim) || category.includes(searchTrim);
  }) :
  technicianContacts;

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Technician Contacts</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Find and contact technicians for your maintenance needs</p>
        </div>
      </div>
      {technicianContacts.length > 0 &&
      <div style={{ marginBottom: '20px' }}>
          <div style={{ ...searchBar, maxWidth: '400px' }}>
            <Search size={18} color="#94a3b8" />
            <input type="text" placeholder="Search by worker name or category..." value={technicianContactSearch} onChange={(e) => setTechnicianContactSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '0.88rem', outline: 'none', color: '#334155' }} />
          </div>
        </div>
      }
      {loading ?
      <div style={emptyState}>Loading technician contacts...</div> :
      technicianContacts.length === 0 ?
      <div style={emptyState}>No technician contacts available</div> :
      filteredContacts.length === 0 ?
      <div style={emptyState}>No technicians match your search</div> :

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '8px', alignItems: 'stretch' }}>
          {filteredContacts.map((contact) => {
          const contactId = contact.ID || contact.id;
          const name = contact.Name || contact.name || 'Unknown';
          const phone = contact.Phone || contact.phone || '';
          const email = contact.Email || contact.email || '';
          const address = contact.Address || contact.address || '';
          const description = contact.Description || contact.description || '';
          const categoryName = contact.Category || contact.category || '';
          const photoUrl = contact.PhotoURL || contact.photoURL || contact.photoUrl || '';
          return (
            <div key={contactId} style={{
              border: '1px solid #f1f5f9', borderRadius: '16px', padding: '20px', backgroundColor: '#fff',
              boxShadow: '0 2px 12px rgba(15,23,42,0.06)', transition: 'box-shadow 0.2s, transform 0.15s',
              display: 'flex', flexDirection: 'column', minHeight: '0'
            }}
            onMouseEnter={(e) => {e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)';e.currentTarget.style.transform = 'translateY(-2px)';}}
            onMouseLeave={(e) => {e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.06)';e.currentTarget.style.transform = '';}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {photoUrl ?
                  <img src={photoUrl} alt={name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }} onClick={() => window.open(photoUrl, '_blank')} /> :

                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600, flexShrink: 0 }}>
                        {(name || 'U').charAt(0).toUpperCase()}
                      </div>
                  }
                    <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.05rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</h4>
                  </div>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '99px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 }}>{categoryName || '\u2014'}</span>
                </div>
                {phone &&
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Phone size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#334155', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{phone}</span>
                    <button onClick={() => copyToClipboard(phone)} style={{
                  padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem',
                  color: '#3b82f6', fontWeight: 600, flexShrink: 0
                }}
                onMouseEnter={(e) => {e.currentTarget.style.background = '#eff6ff';}}
                onMouseLeave={(e) => {e.currentTarget.style.background = '#fff';}}
                title="Copy phone number">
                      <Copy size={14} /> Copy
                    </button>
                  </div>
              }
                {email &&
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem', flexShrink: 0 }}>Email:</span>
                    <a href={`mailto:${email}`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</a>
                  </div>
              }
                {address &&
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px', flexShrink: 0 }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem', flexShrink: 0 }}>Address:</span>
                    <span style={{ color: '#334155', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{address}</span>
                  </div>
              }
                {description &&
              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.83rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</p>
                  </div>
              }
              </div>);

        })}
        </div>
      }
    </div>);

};

export default TechnicianContactsTab;
