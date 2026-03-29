import React from 'react';
import { API_CONFIG } from '../../config/api';

const AdvertisementsTab = ({ advertisements }) => (
  <div className="sa-ads-page">
    <div className="sa-ads-header"><div><h2>Advertisements</h2><p>View active advertisements posted by Super Admin</p></div></div>
    <div className="sa-ads-list">{advertisements.length > 0 ? advertisements.map((ad, index) => { const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL; const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}`) : null; return (<div key={`ad-${ad.ID || ad.id || index}`} className="sa-ad-card"><div className="sa-ad-status-column"><span className="sa-ad-status published">Active</span></div><div className="sa-ad-main">{fullImageUrl && (<img src={fullImageUrl} alt={ad.Title || ad.title || 'Advertisement'} className="sa-ad-image" onError={(e) => { e.target.style.display = 'none'; }} />)}<h3>{ad.Title || ad.title || 'Untitled Advertisement'}</h3><p>{ad.Text || ad.text || ad.description || ad.Description || 'No description available'}</p>{ad.CreatedAt && (<span className="sa-ad-date" style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px', display: 'block' }}>Posted: {new Date(ad.CreatedAt).toLocaleDateString()}</span>)}</div></div>); }) : (<div className="sa-table-empty">No active advertisements available.</div>)}</div>
  </div>
);

export default AdvertisementsTab;
