import React from 'react';
import { API_CONFIG } from '../config/api';

const styles = {
  wrapper: {
    gridColumn: 'span 2',
    minHeight: '400px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  viewport: {
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
  },
  track: {
    display: 'flex',
    height: '100%',
    transition: 'transform 0.5s ease-in-out',
  },
  slide: {
    width: '100%',
    minWidth: '100%',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    position: 'absolute',
    inset: 0,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
    padding: '40px 28px 20px',
    color: '#fff',
  },
  title: {
    margin: '0 0 6px',
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  text: {
    margin: 0,
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  noImage: {
    padding: '40px 28px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
  },
  noImageTitle: {
    margin: '0 0 8px',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  noImageText: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#64748b',
    lineHeight: 1.5,
    maxWidth: '300px',
  },
  indicators: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
    zIndex: 2,
  },
  dot: {
    height: '8px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  counter: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '99px',
    zIndex: 2,
  },
};

export default function AdCarousel({
  advertisements = [],
  currentAdIndex = 0,
  setCurrentAdIndex,
  carouselIntervalRef,
}) {
  if (!advertisements.length) return null;

  const goTo = (index) => {
    setCurrentAdIndex(index);
    if (carouselIntervalRef?.current) clearInterval(carouselIntervalRef.current);
    if (carouselIntervalRef) {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % advertisements.length);
      }, 5000);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.viewport}>
        {/* Counter badge */}
        {advertisements.length > 1 && (
          <span style={styles.counter}>
            {currentAdIndex + 1} / {advertisements.length}
          </span>
        )}

        {/* Track — each slide is exactly 100% wide */}
        <div
          style={{
            ...styles.track,
            transform: `translateX(-${currentAdIndex * 100}%)`,
          }}
        >
          {advertisements.map((ad, index) => {
            const imageUrl = ad.ImageURL || ad.imageUrl || ad.imageURL;
            const fullImageUrl = imageUrl
              ? imageUrl.startsWith('http') ? imageUrl : `${API_CONFIG.BASE_URL}${imageUrl}`
              : null;
            const title = ad.Title || ad.title || 'Untitled Advertisement';
            const text = ad.Text || ad.text || ad.description || ad.Description || '';

            return (
              <div key={`slide-${ad.ID || ad.id || index}`} style={styles.slide}>
                {fullImageUrl ? (
                  <>
                    <img
                      src={fullImageUrl}
                      alt={title}
                      style={styles.image}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'none';
                        e.target.parentElement.querySelector('[data-fallback]').style.display = 'flex';
                      }}
                    />
                    <div style={styles.overlay}>
                      <h3 style={styles.title}>{title}</h3>
                      {text && <p style={styles.text}>{text}</p>}
                    </div>
                    <div data-fallback style={{ ...styles.noImage, display: 'none' }}>
                      <h3 style={styles.noImageTitle}>{title}</h3>
                      {text && <p style={styles.noImageText}>{text}</p>}
                    </div>
                  </>
                ) : (
                  <div style={styles.noImage}>
                    <h3 style={styles.noImageTitle}>{title}</h3>
                    {text && <p style={styles.noImageText}>{text}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dot indicators */}
        {advertisements.length > 1 && (
          <div style={styles.indicators}>
            {advertisements.map((_, index) => (
              <button
                key={`dot-${index}`}
                onClick={() => goTo(index)}
                style={{
                  ...styles.dot,
                  width: index === currentAdIndex ? '24px' : '8px',
                  backgroundColor: index === currentAdIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
