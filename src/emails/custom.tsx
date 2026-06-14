/**
 * Custom/Broadcast Email Template
 * Used by Super Admin to compose custom emails to users.
 */

import React from 'react'
import { EmailLayout, emailStyles } from './layout'

interface CustomEmailProps {
  recipientName: string
  message: string
  senderName: string
  senderRole: string
  ctaUrl?: string
  ctaLabel?: string
}

export function CustomEmail({ recipientName, message, senderName, senderRole, ctaUrl, ctaLabel }: CustomEmailProps) {
  return (
    <EmailLayout previewText={`Message from ${senderName} at NurseOS`}>
      <p style={emailStyles.paragraph}>
        Hi <strong>{recipientName}</strong>,
      </p>

      <div
        style={{
          ...emailStyles.paragraph,
          whiteSpace: 'pre-wrap' as const,
        }}
        dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, '<br/>') }}
      />

      {ctaUrl && ctaLabel && (
        <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <a href={ctaUrl} style={emailStyles.button}>
            {ctaLabel}
          </a>
        </div>
      )}

      <div style={emailStyles.divider} />

      <p style={{ ...emailStyles.paragraph, fontSize: '14px', color: '#6b7280' }}>
        This message was sent by <strong>{senderName}</strong> ({senderRole}) via NurseOS.
        If you have questions, please reply to this email or contact support@nurseos.digital.
      </p>
    </EmailLayout>
  )
}
