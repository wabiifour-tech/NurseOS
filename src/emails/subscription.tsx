/**
 * Subscription Email Template
 * Sent for subscription verification, renewal reminders, and expiring notices.
 */

import React from 'react'
import { EmailLayout, emailStyles } from './layout'

interface SubscriptionEmailProps {
  adminName: string
  facilityName: string
  plan: string
  action: 'verified' | 'expiring' | 'expired' | 'renewed'
  expiryDate?: string
  amountPaid?: string
  dashboardUrl?: string
}

export function SubscriptionEmail({
  adminName,
  facilityName,
  plan,
  action,
  expiryDate,
  amountPaid,
  dashboardUrl,
}: SubscriptionEmailProps) {
  return (
    <EmailLayout previewText={`NurseOS subscription update for ${facilityName}`}>
      <h2 style={emailStyles.heading}>
        {action === 'verified' && '✅ Subscription Activated!'}
        {action === 'expiring' && '⚠ Subscription Expiring Soon'}
        {action === 'expired' && '❌ Subscription Expired'}
        {action === 'renewed' && '🔄 Subscription Renewed'}
      </h2>

      <p style={emailStyles.paragraph}>
        Hi <strong>{adminName}</strong>,
      </p>

      {action === 'verified' && (
        <>
          <p style={emailStyles.paragraph}>
            Your <strong>{plan}</strong> plan subscription for <strong>{facilityName}</strong>{' '}
            has been verified and activated. {amountPaid && `Payment of ${amountPaid} confirmed.`}
          </p>
          <div style={emailStyles.infoBox}>
            <p style={{ margin: '0', fontSize: '14px', color: '#065f46' }}>
              <strong>Plan:</strong> {plan} &nbsp;·&nbsp;
              {expiryDate && <><strong>Valid until:</strong> {expiryDate}</>}
            </p>
          </div>
        </>
      )}

      {action === 'expiring' && (
        <>
          <p style={emailStyles.paragraph}>
            Your <strong>{plan}</strong> plan subscription for <strong>{facilityName}</strong>{' '}
            is expiring soon. {expiryDate && `It will expire on ${expiryDate}.`}
          </p>
          <div style={emailStyles.warningBox}>
            <p style={{ margin: '0', fontSize: '14px', color: '#92400e' }}>
              <strong>⚠ Don't lose access!</strong> Renew your subscription to continue using
              all NurseOS features for your facility.
            </p>
          </div>
        </>
      )}

      {action === 'expired' && (
        <>
          <p style={emailStyles.paragraph}>
            Your <strong>{plan}</strong> plan subscription for <strong>{facilityName}</strong>{' '}
            has expired. Some features may be restricted until you renew.
          </p>
        </>
      )}

      {action === 'renewed' && (
        <>
          <p style={emailStyles.paragraph}>
            Your <strong>{plan}</strong> plan subscription for <strong>{facilityName}</strong>{' '}
            has been renewed successfully. {expiryDate && `It is now valid until ${expiryDate}.`}
          </p>
        </>
      )}

      {dashboardUrl && (
        <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <a href={dashboardUrl} style={emailStyles.button}>
            Manage Subscription
          </a>
        </div>
      )}
    </EmailLayout>
  )
}
