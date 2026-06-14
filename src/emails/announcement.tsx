/**
 * Announcement Email Template
 * Sent when a facility admin or super admin creates an announcement.
 */

import React from 'react'
import { EmailLayout, emailStyles } from './layout'

interface AnnouncementEmailProps {
  recipientName: string
  announcementTitle: string
  announcementMessage: string
  category: string
  priority: string
  facilityName?: string
  senderName: string
  dashboardUrl?: string
}

export function AnnouncementEmail({
  recipientName,
  announcementTitle,
  announcementMessage,
  category,
  priority,
  facilityName,
  senderName,
  dashboardUrl,
}: AnnouncementEmailProps) {
  const isUrgent = ['URGENT', 'CRITICAL'].includes(priority)

  return (
    <EmailLayout previewText={`${isUrgent ? '🚨 ' : ''}${announcementTitle}`}>
      <h2 style={{
        ...emailStyles.heading,
        color: isUrgent ? '#dc2626' : '#111827',
      }}>
        {isUrgent && '🚨 '}{announcementTitle}
      </h2>

      <p style={emailStyles.paragraph}>
        Hi <strong>{recipientName}</strong>,
      </p>

      <p style={emailStyles.paragraph}>
        {facilityName
          ? `A new announcement from <strong>${facilityName}</strong>:`
          : 'A new system-wide announcement:'}
      </p>

      <div style={{
        padding: '20px 24px',
        backgroundColor: isUrgent ? '#fef2f2' : '#f9fafb',
        border: `1px solid ${isUrgent ? '#fecaca' : '#e5e7eb'}`,
        borderRadius: '8px',
        margin: '16px 0',
      }}>
        <p style={{
          margin: '0 0 8px 0',
          fontSize: '12px',
          fontWeight: '600',
          color: isUrgent ? '#991b1b' : '#6b7280',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.5px',
        }}>
          {category} · {priority} priority
        </p>
        <p style={{
          margin: '0',
          fontSize: '15px',
          color: '#1f2937',
          whiteSpace: 'pre-wrap' as const,
        }}>
          {announcementMessage}
        </p>
      </div>

      {dashboardUrl && (
        <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <a href={dashboardUrl} style={emailStyles.button}>
            View in NurseOS
          </a>
        </div>
      )}

      <div style={emailStyles.divider} />

      <p style={{ ...emailStyles.paragraph, fontSize: '13px', color: '#9ca3af' }}>
        Posted by <strong>{senderName}</strong> via NurseOS Announcements
      </p>
    </EmailLayout>
  )
}
