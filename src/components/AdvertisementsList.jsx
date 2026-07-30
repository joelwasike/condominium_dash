import React, { useState } from 'react';
import { API_CONFIG } from '../config/api';

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: 600,
    color: '#1e293b'
  },
  headerSubtitle: {
    margin: '4px 0 0',
    fontSize: '0.85rem',
    color: '#64748b'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
    border: '1px solid #f1f5f9',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    display: 'flex',
    flexDirection: 'column'
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    flexShrink: 0
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  noImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
    fontSize: '0.85rem'
  },
  badge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '0.7rem',
    fontWeight: 600,
    background: '#16a34a',
    color: '#fff',
    letterSpacing: '0.02em'
  },
  cardBody: {
    padding: '16px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
    lineHeight: 1.4
  },
  text: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#475569',
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  textExpanded: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#475569',
    lineHeight: 1.6
  },
  readMore: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: '0.8rem',
    color: '#3b82f6',
    cursor: 'pointer',
    fontWeight: 500,
    alignSelf: 'flex-start'
  },
  date: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: 'auto',
    paddingTop: '8px'
  },
  linkButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    marginTop: '10px'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8',
    fontSize: '0.95rem',
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #f1f5f9'
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '12px',
    display: 'block'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    cursor: 'pointer',
    padding: '40px'
  },
  overlayImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
  }
};

function AdCard({ ad }) {
  const [expanded, setExpanded] = useState(false);
  const [viewImage, setViewImage] = useState(false);

  const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL;
  const fullImageUrl = imageUrl ?
  imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}` :
  null;
  const title = ad.Title || ad.title || 'Untitled Advertisement';
  const text = ad.Text || ad.text || ad.description || ad.Description || '';
  const date = ad.CreatedAt || ad.createdAt;
  const linkUrl = ad.LinkURL || ad.linkUrl || ad.linkURL || ad.link;
  const isLongText = text.length > 150;

  return (
    <>
      <div
        style={styles.card}
        onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.1)';}}
        onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)';e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.06)';}}>
        
        <div style={styles.imageContainer}>
          {fullImageUrl ?
          <img
            src={fullImageUrl}
            alt={title}
            style={{ ...styles.image, cursor: 'pointer' }}
            onClick={() => setViewImage(true)}
            onError={(e) => {
              e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f1f5f9;color:#94a3b8;font-size:0.85rem">Image unavailable</div>';
            }} /> :


          <div style={styles.noImage}>No image</div>
          }
          <span style={styles.badge}>Active</span>
        </div>

        <div style={styles.cardBody}>
          <h3 style={styles.title}>{title}</h3>
          {text &&
          <p style={expanded ? styles.textExpanded : styles.text}>{text}</p>
          }
          {isLongText &&
          <button type="button" style={styles.readMore} onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show less' : 'Read more'}
            </button>
          }
          {date &&
          <span style={styles.date}>
              Posted {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          }
          {linkUrl &&
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.linkButton}
            onClick={(e) => e.stopPropagation()}>
            
              View Property
            </a>
          }
        </div>
      </div>

      {viewImage && fullImageUrl &&
      <div style={styles.overlay} onClick={() => setViewImage(false)}>
          <img src={fullImageUrl} alt={title} style={styles.overlayImage} />
        </div>
      }
    </>);

}

export default function AdvertisementsList({ advertisements = [] }) {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>Advertisements</h2>
          <p style={styles.headerSubtitle}>Active advertisements from the platform</p>
        </div>
      </div>

      {advertisements.length > 0 ?
      <div style={styles.grid}>
          {advertisements.map((ad, index) =>
        <AdCard key={ad.ID || ad.id || index} ad={ad} />
        )}
        </div> :

      <div style={styles.empty}>
          <span style={styles.emptyIcon}>No active advertisements available at this time.</span>
        </div>
      }
    </div>);

}
