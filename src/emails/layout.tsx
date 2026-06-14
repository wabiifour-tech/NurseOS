/**
 * NurseOS Email Layout — Shared HTML email wrapper
 * All email templates use this layout for consistent branding.
 */

import React from 'react'

export interface EmailLayoutProps {
  children: React.ReactNode
  previewText: string
  appName?: string
}

export function EmailLayout({ children, previewText, appName = 'NurseOS' }: EmailLayoutProps) {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
    }}>
      {/* Hidden preview text for email clients */}
      <div style={{ display: 'none', maxHeight: '0', overflow: 'hidden' }}>
        {previewText}
      </div>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
        padding: '32px 40px',
        textAlign: 'center' as const,
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: '700',
          margin: '0',
          letterSpacing: '-0.5px',
        }}>
          {appName}
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: '14px',
          margin: '8px 0 0 0',
          fontWeight: '400',
        }}>
          The Operating System for Global Nursing Care
        </p>
      </div>

      {/* Body */}
      <div style={{
        padding: '40px',
        color: '#1f2937',
        fontSize: '16px',
        lineHeight: '1.6',
      }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{
        padding: '24px 40px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        textAlign: 'center' as const,
      }}>
        <p style={{
          color: '#6b7280',
          fontSize: '13px',
          margin: '0 0 8px 0',
        }}>
          Sent by <strong>{appName}</strong> — The Operating System for Global Nursing Care
        </p>
        <p style={{
          color: '#9ca3af',
          fontSize: '12px',
          margin: '0',
        }}>
          www.nurseos.digital · support@nurseos.digital
        </p>
      </div>
    </div>
  )
}

// ─── Shared styles ───

export const emailStyles = {
  heading: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 16px 0',
  } as React.CSSProperties,
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#374151',
    margin: '0 0 16px 0',
  } as React.CSSProperties,
  button: {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#059669',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
    margin: '8px 0',
  } as React.CSSProperties,
  buttonDanger: {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
    margin: '8px 0',
  } as React.CSSProperties,
  codeBox: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '2px',
    margin: '16px 0',
  } as React.CSSProperties,
  infoBox: {
    padding: '16px 20px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
    margin: '16px 0',
  } as React.CSSProperties,
  warningBox: {
    padding: '16px 20px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    margin: '16px 0',
  } as React.CSSProperties,
  divider: {
    borderTop: '1px solid #e5e7eb',
    margin: '24px 0',
  } as React.CSSProperties,
}
