/**
 * Password Reset Email Template
 * Sent when a user requests a password reset.
 */

import React from 'react'
import { EmailLayout, emailStyles } from './layout'

interface PasswordResetEmailProps {
  userName: string
  resetUrl: string
  resetToken: string
  expiryMinutes?: number
}

export function PasswordResetEmail({ userName, resetUrl, resetToken, expiryMinutes = 60 }: PasswordResetEmailProps) {
  return (
    <EmailLayout previewText={`Reset your NurseOS password — expires in ${expiryMinutes} minutes`}>
      <h2 style={emailStyles.heading}>Reset Your Password</h2>

      <p style={emailStyles.paragraph}>
        Hi <strong>{userName}</strong>,
      </p>

      <p style={emailStyles.paragraph}>
        We received a request to reset the password for your NurseOS account.
        Click the button below to set a new password:
      </p>

      <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
        <a href={resetUrl} style={emailStyles.button}>
          Reset Password
        </a>
      </div>

      <p style={emailStyles.paragraph}>
        If the button doesn't work, you can also enter this reset code on the password reset page:
      </p>

      <div style={{ textAlign: 'center' as const }}>
        <span style={emailStyles.codeBox}>{resetToken}</span>
      </div>

      <div style={emailStyles.warningBox}>
        <p style={{ margin: '0', fontSize: '14px', color: '#92400e' }}>
          <strong>⚠ This link expires in {expiryMinutes} minutes.</strong> If you did not request
          a password reset, please ignore this email — your account is safe.
        </p>
      </div>

      <div style={emailStyles.divider} />

      <p style={{ ...emailStyles.paragraph, fontSize: '14px', color: '#6b7280' }}>
        For security reasons, this password reset link can only be used once. If you need to
        reset your password again, please visit the NurseOS login page and submit a new request.
      </p>
    </EmailLayout>
  )
}
