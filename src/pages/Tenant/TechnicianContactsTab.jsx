import React from 'react';
import { Phone, Copy, Search } from 'lucide-react';

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
      try { document.execCommand('copy'); addNotification('Phone number copied to clipboard!', 'success'); }
      catch (err) { addNotification('Failed to copy phone number', 'error'); }
      document.body.removeChild(textArea);
    }
  };

  const searchTrim = (technicianContactSearch || '').trim().toLowerCase();
  const filteredContacts = searchTrim
    ? technicianContacts.filter((contact) => {
        const name = (contact.Name || contact.name || '').toLowerCase();
        const category = (contact.Category || contact.category || '').toLowerCase();
        return name.includes(searchTrim) || category.includes(searchTrim);
      })
    : technicianContacts;

  return (
    <div className="sa-section-card">
      <div className="sa-section-header">
        <div><h2>Technician Contacts</h2><p>Find and contact technicians for your maintenance needs</p></div>
      </div>
      {technicianContacts.length > 0 && (
        <div style={{ marginBottom: '20px', marginTop: '8px' }}>
          <div className="sa-search-input" style={{ maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
            <Search size={18} color="#6b7280" />
            <input type="text" placeholder="Search by worker name or category..." value={technicianContactSearch} onChange={(e) => setTechnicianContactSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '0.9rem', outline: 'none' }} />
          </div>
        </div>
      )}
      {loading ? (
        <div className="sa-table-empty">Loading technician contacts...</div>
      ) : technicianContacts.length === 0 ? (
        <div className="sa-table-empty">No technician contacts available</div>
      ) : filteredContacts.length === 0 ? (
        <div className="sa-table-empty">No technicians match your search</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '24px', alignItems: 'stretch' }}>
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
              <div key={contactId} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column', minHeight: '0' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onClick={() => window.open(photoUrl, '_blank')} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '600', flexShrink: 0 }}>
                        {(name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.05rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</h4>
                  </div>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '0.7rem', textTransform: 'capitalize', flexShrink: 0 }}>{categoryName || '\u2014'}</span>
                </div>
                {phone && (
                  <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Phone size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#374151', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{phone}</span>
                    <button onClick={() => copyToClipboard(phone)} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#374151', flexShrink: 0 }} title="Copy phone number">
                      <Copy size={14} /> Copy
                    </button>
                  </div>
                )}
                {email && (<div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}><span style={{ color: '#6b7280', fontSize: '0.8rem', flexShrink: 0 }}>Email:</span><a href={`mailto:${email}`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</a></div>)}
                {address && (<div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px', flexShrink: 0 }}><span style={{ color: '#6b7280', fontSize: '0.8rem', flexShrink: 0 }}>Address:</span><span style={{ color: '#374151', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{address}</span></div>)}
                {description && (<div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</p></div>)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TechnicianContactsTab;
