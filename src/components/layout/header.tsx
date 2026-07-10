'use client';

import { motion } from 'framer-motion';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  isProcessing?: boolean;
}

export function Header({ theme, toggleTheme, isProcessing }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            className="logo-mark"
            whileHover={{ rotate: -8, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M4 12L8 4L12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 9H10.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
          <span className="logo-text">GrowEasy</span>
          <span className="logo-badge">
            {isProcessing && <span className="status-dot" style={{ display: 'inline-block', marginRight: 6 }} />}
            CSV Importer
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.button
            onClick={toggleTheme}
            className="theme-toggle"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="3" />
                <path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.17 3.17L4.23 4.23M11.77 11.77L12.83 12.83M3.17 12.83L4.23 11.77M11.77 4.23L12.83 3.17" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13.5 9.5A5.5 5.5 0 116.5 2.5a4.5 4.5 0 007 7z" />
              </svg>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
