/**
 * Facility Approved/Rejected Email Template
 * Sent when super admin approves or rejects a facility creation request.
 */

import React from 'react'
import { EmailLayout, emailStyles } from './layout'

interface FacilityApprovalEmailProps {
  adminName: string
  facilityName: string
  action: 'approved' | 'rejected'
  rejectionReason?: string
  dashboardUrl?: string
}

export function FacilityApprovalEmail({
  adminName,
  facilityName,
  action,
  rejectionReason,
  dashboardUrl,
}: FacilityApprovalEmailProps) {
  const isApproved = action === 'approved'

  return (
    <EmailLayout previewText={`Your facility "${facilityName}" has been ${action}`}>
      <h2 style={emailStyles.heading}>
        {isApproved ? '🏥 Facility Approved!' : 'Facility Not Approved'}
      </h2>

      <p style={emailStyles.paragraph}>
        Hi <strong>{adminName}</strong>,
      </p>

      {isApproved ? (
        <>
          <p style={emailStyles.paragraph}>
            Your facility <strong>{facilityName}</strong> has been verified and approved by the
            NurseOS team. It is now live on the platform and visible to nurses and healthcare
            professionals across Nigeria.
          </p>

          <div style={emailStyles.infoBox}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#065f46', fontWeight: '600' }}>
              Next steps:
            </p>
            <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', color: '#065f46' }}>
              <li>Set up your facility departments and services</li>
              <li>Invite nurses and staff to join your facility</li>
              <li>Configure subscription plan for your team</li>
              <li>Start using NurseAI for clinical charting</li>
            </ul>
          </div>

          {dashboardUrl && (
            <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <a href={dashboardUrl} style={emailStyles.button}>
                Manage Facility
              </a>
            </div>
          )}
        </>
      ) : (
        <>
          <p style={emailStyles.paragraph}>
            Your facility registration for <strong>{facilityName}</strong> could not be verified
            at this time. This may be due to incomplete documentation or unverifiable registration
            details.
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
            To resolve this, please contact our support team at support@nurseos.digital with
            updated documentation, including your facility's official registration certificate
            and accreditation documents.
          </p>
        </>
      )}
    </EmailLayout>
  )
}
