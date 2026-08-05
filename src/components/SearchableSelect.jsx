import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

/**
 * A dropdown with a built-in search box, used anywhere a plain <select> with a long
 * list of options (tenants, etc.) makes it hard to find the right entry by scrolling.
 *
 * options: [{ value: string, label: string, search?: string }]
 *   `search` is optional extra text (email, phone, property...) matched against the
 *   query in addition to `label`; defaults to `label` when omitted.
 */
const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches found',
  disabled = false,
  required = false,
  id,
  name,
  style
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)) || null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((opt) => {
      const haystack = `${opt.label || ''} ${opt.search || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      // Focus the search box as soon as the panel opens.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const selectOption = (opt) => {
    onChange?.(opt ? String(opt.value) : '');
    setOpen(false);
    setQuery('');
  };

  const baseStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    background: disabled ? '#f3f4f6' : '#fff',
    color: selected ? '#0f172a' : '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxSizing: 'border-box',
    ...style
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Hidden input keeps native `required` form validation working without a real <select>. */}
      {required &&
      <input
        tabIndex={-1}
        aria-hidden="true"
        value={value || ''}
        required
        onChange={() => {}}
        style={{ position: 'absolute', opacity: 0, height: 0, width: '100%', pointerEvents: 'none' }} />

      }
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        style={baseStyle}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {selected && !disabled &&
          <X
            size={14}
            color="#94a3b8"
            onClick={(e) => {
              e.stopPropagation();
              selectOption(null);
            }} />

          }
          <ChevronDown size={16} color="#94a3b8" />
        </span>
      </button>

      {open && !disabled &&
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 40,
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.14)',
          overflow: 'hidden'
        }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>
            <Search size={15} color="#94a3b8" />
            <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
                setQuery('');
              }
              if (e.key === 'Enter' && filtered.length === 1) {
                e.preventDefault();
                selectOption(filtered[0]);
              }
            }}
            placeholder={searchPlaceholder}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem' }} />

          </div>
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filtered.length === 0 ?
          <div style={{ padding: '14px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>{emptyText}</div> :

          filtered.map((opt) =>
          <div
            key={opt.value}
            onClick={() => selectOption(opt)}
            style={{
              padding: '10px 14px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: String(opt.value) === String(value) ? '#eef2ff' : 'transparent',
              color: '#0f172a'
            }}
            onMouseEnter={(e) => {
              if (String(opt.value) !== String(value)) e.currentTarget.style.background = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              if (String(opt.value) !== String(value)) e.currentTarget.style.background = 'transparent';
            }}>

                  {opt.label}
                </div>
          )}
          </div>
        </div>
      }
    </div>);

};

export default SearchableSelect;
