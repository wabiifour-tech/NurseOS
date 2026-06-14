/**
 * Welcome Email Template
 * Sent when a new user registers on NurseOS.
 */

import React from 'react'
import { EmailLayout, emailStyles } from './layout'

interface WelcomeEmailProps {
  userName: string
  role: string
  facilityName?: string
  dashboardUrl: string
}

export function WelcomeEmail({ userName, role, facilityName, dashboardUrl }: WelcomeEmailProps) {
  const roleLabel = role === 'NURSE' ? 'Nurse' : role === 'ADMIN' ? 'Facility Admin' : role === 'SUPER_ADMIN' ? 'Super Admin' : role

  return (
    <EmailLayout previewText={`Welcome to NurseOS, ${userName}!`}>
      <h2 style={emailStyles.heading}>Welcome to NurseOS! 🎉</h2>

      <p style={emailStyles.paragraph}>
        Hi <strong>{userName}</strong>,
      </p>

      <p style={emailStyles.paragraph}>
        Your NurseOS account has been created successfully. You've joined as a{' '}
        <strong>{roleLabel}</strong>{facilityName ? <> at <strong>{facilityName}</strong></> : ''}.
      </p>

      <div style={emailStyles.infoBox}>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#065f46' }}>
          <strong>What you can do with NurseOS:</strong>
        </p>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', color: '#065f46' }}>
          <li>Smart clinical charting with AI assistance</li>
          <li>Referrals & inter-facility consultations</li>
          <li>Professional credentials & CPD tracking</li>
          <li>Online courses & clinical simulations</li>
          <li>Analytics & disease surveillance</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
        <a href={dashboardUrl} style={emailStyles.button}>
          Go to Dashboard
        </a>
      </div>

      <p style={{ ...emailStyles.paragraph, fontSize: '14px', color: '#6b7280' }}>
        If you have any questions, feel free to contact our support team at support@nurseos.digital
        or message us on WhatsApp.
      </p>
    </EmailLayout>
  )
}
