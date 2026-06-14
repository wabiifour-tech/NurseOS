/**
 * User Approved/Rejected Email Template
 * Sent when a facility admin approves or rejects a pending user.
 */

import React from 'react'
import { EmailLayout, emailStyles } from './layout'

interface UserApprovalEmailProps {
  userName: string
  action: 'approved' | 'rejected'
  facilityName: string
  role: string
  rejectionReason?: string
  dashboardUrl?: string
}

export function UserApprovalEmail({
  userName,
  action,
  facilityName,
  role,
  rejectionReason,
  dashboardUrl,
}: UserApprovalEmailProps) {
  const isApproved = action === 'approved'
  const roleLabel = role === 'NURSE' ? 'Nurse' : role === 'ADMIN' ? 'Facility Admin' : role

  return (
    <EmailLayout previewText={`Your NurseOS account has been ${action}`}>
      <h2 style={emailStyles.heading}>
        {isApproved ? '✅ Account Approved!' : '❌ Account Not Approved'}
      </h2>

      <p style={emailStyles.paragraph}>
        Hi <strong>{userName}</strong>,
      </p>

      {isApproved ? (
        <>
          <p style={emailStyles.paragraph}>
            Great news! Your account as a <strong>{roleLabel}</strong> at{' '}
            <strong>{facilityName}</strong> has been approved by the facility administrator.
          </p>

          <p style={emailStyles.paragraph}>
            You can now log in to NurseOS and access all features available to your role,
            including patient charting, consultations, and more.
          </p>

          {dashboardUrl && (
            <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <a href={dashboardUrl} style={emailStyles.button}>
                Go to Dashboard
              </a>
            </div>
          )}
        </>
      ) : (
        <>
          <p style={emailStyles.paragraph}>
            Your request to join <strong>{facilityName}</strong> as a <strong>{roleLabel}</strong>{' '}
            was not approved by the facility administrator.
          </p>

          {rejectionReason && (
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              margin: '16px 0',
            }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#991b1b', fontWeight: '600' }}>
                Reason:
              </p>
              <p style={{ margin: '0', fontSize: '14px', color: '#991b1b' }}>
                {rejectionReason}
              </p>
            </div>
          )}

          <p style={emailStyles.paragraph}>
            If you believe this was an error, please contact the facility administrator directly
            or reach out to NurseOS support at support@nurseos.digital.
          </p>
        </>
      )}
    </EmailLayout>
  )
}
