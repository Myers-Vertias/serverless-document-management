import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = i18n.language === 'vi' ? 'Tiếng Việt' : 'English';

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="language-switcher" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        className="lang-btn" 
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsBtnHovered(true)}
        onMouseLeave={() => setIsBtnHovered(false)}
        style={{
          background: isBtnHovered ? '#f8fafc' : '#FFFFFF',
          border: `1px solid ${isBtnHovered ? '#94a3b8' : '#cbd5e1'}`,
          padding: '0.4rem 0.75rem',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#0f172a',
          minWidth: '120px',
          justifyContent: 'space-between',
          transition: 'all 0.15s ease-in-out'
        }}
      >
        <span>{currentLang}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#0f172a" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="lang-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            background: '#FFFFFF',
            border: '1px solid #cbd5e1',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            minWidth: '140px',
            zIndex: 50,
            overflow: 'hidden'
          }}
        >
          <button 
            onClick={() => handleLanguageChange('vi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '0.6rem 1rem',
              background: i18n.language === 'vi' ? '#f1f5f9' : '#FFFFFF',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: i18n.language === 'vi' ? '#0f172a' : '#334155',
              fontWeight: i18n.language === 'vi' ? '600' : '400'
            }}
          >
            <span style={{ width: '1.5rem', display: 'inline-block', color: '#2563eb', fontWeight: 'bold' }}>
              {i18n.language === 'vi' && '✓'}
            </span>
            Tiếng Việt
          </button>
          <button 
            onClick={() => handleLanguageChange('en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '0.6rem 1rem',
              background: i18n.language === 'en' ? '#f1f5f9' : '#FFFFFF',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: i18n.language === 'en' ? '#0f172a' : '#334155',
              fontWeight: i18n.language === 'en' ? '600' : '400'
            }}
          >
            <span style={{ width: '1.5rem', display: 'inline-block', color: '#2563eb', fontWeight: 'bold' }}>
              {i18n.language === 'en' && '✓'}
            </span>
            English
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
