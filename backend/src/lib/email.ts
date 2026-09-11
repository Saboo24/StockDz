import crypto from 'crypto'
import dns from 'dns'
import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'
import { env } from '../config/env'

// Gmail can resolve AAAA records first in some environments, which leads to IPv6 connection timeouts.
// Force IPv4 first so the real admin notification is delivered reliably without changing the auth flow.
dns.setDefaultResultOrder('ipv4first')

type EmailLanguage = 'en' | 'fr'

type ApprovalEmailInput = {
  to: string
  firstName: string
  lastName: string
  email: string
  companyName: string
  phone?: string
  approvalUrl: string
  rejectUrl: string
  language?: EmailLanguage
}

type DecisionEmailInput = {
  to: string
  firstName: string
  lastName: string
  companyName: string
  decision: 'approve' | 'reject'
  loginUrl?: string
  language?: EmailLanguage
}

type PasswordResetEmailInput = {
  to: string
  firstName: string
  lastName: string
  code: string
  expiresInMinutes?: number
  language?: EmailLanguage
  verificationUrl?: string
}

type PasswordChangedEmailInput = {
  to: string
  firstName: string
  lastName: string
  language?: EmailLanguage
  loginUrl?: string
}

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.password,
  },
})

const STOCKDZ_BLUES = {
  navy: '#0f172a',
  blue: '#2563eb',
  blueSoft: '#eff6ff',
  border: '#dbeafe',
  text: '#0f172a',
  muted: '#475569',
  white: '#ffffff',
  shadow: 'rgba(37, 99, 235, 0.12)',
}

export function isEmailConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.password && env.smtp.user !== 'demo@example.com')
}

function getLogoDataUri() {
  try {
    const logoPath = path.resolve(__dirname, '../../../frontend/src/assets/logo.png')
    const buffer = fs.readFileSync(logoPath)
    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#2563eb"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#g)"/>
        <text x="50%" y="58%" text-anchor="middle" font-size="48" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">S</text>
        <text x="50%" y="80%" text-anchor="middle" font-size="15" font-weight="700" fill="#dbeafe" font-family="Arial, sans-serif" letter-spacing="3">DZ</text>
      </svg>
    `)}`
  }
}

function getLogoBuffer() {
  try {
    const logoPath = path.resolve(__dirname, '../../../frontend/src/assets/logo.png')
    return fs.readFileSync(logoPath)
  } catch {
    return null
  }
}

function getLocalizedCopy(language: EmailLanguage = 'en') {
  if (language === 'fr') {
    return {
      brand: 'StockDZ',
      brandTag: 'Gestion commerciale',
      supportLabel: 'Besoin d’aide ?',
      supportEmail: 'stockdz.support@gmail.com',
      footer: '© StockDZ',
    }
  }

  return {
    brand: 'StockDZ',
    brandTag: 'Business OS',
    supportLabel: 'Need help?',
    supportEmail: 'stockdz.support@gmail.com',
    footer: '© StockDZ',
  }
}

function renderStockDzEmail({
  title,
  heading,
  intro,
  bodyHtml,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  language = 'en',
}: {
  title: string
  heading: string
  intro: string
  bodyHtml: string
  primaryButtonText?: string
  primaryButtonHref?: string
  secondaryButtonText?: string
  secondaryButtonHref?: string
  language?: EmailLanguage
}) {
  const copy = getLocalizedCopy(language)
  const logo = getLogoDataUri()

  const primaryButton = primaryButtonText && primaryButtonHref
    ? `
      <tr>
        <td align="center" style="padding:0 24px 12px 24px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;max-width:420px;">
            <tr>
              <td align="center" bgcolor="#2563eb" style="border-radius:10px;">
                <a href="${primaryButtonHref}" style="display:block;padding:15px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;background-color:#2563eb;">
                  ${primaryButtonText}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : ''

  const secondaryButton = secondaryButtonText && secondaryButtonHref
    ? `
      <tr>
        <td align="center" style="padding:0 24px 18px 24px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;max-width:420px;">
            <tr>
              <td align="center" bgcolor="#ffffff" style="border:1px solid #dbeafe;border-radius:10px;">
                <a href="${secondaryButtonHref}" style="display:block;padding:14px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:700;color:#1d4ed8;text-decoration:none;border-radius:10px;background-color:#ffffff;">
                  ${secondaryButtonText}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html lang="${language}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <title>${title}</title>
        <style>
          body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
          a { text-decoration: none; }
          @media screen and (max-width: 600px) {
            .wrapper { width: 100% !important; }
            .content-pad { padding-left: 20px !important; padding-right: 20px !important; }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;background-color:#f3f4f6;padding:24px 12px;">
          <tr>
            <td align="center" valign="top">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapper" style="width:100%;max-width:640px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:18px;">
                <tr>
                  <td style="padding:24px 24px 12px 24px;background-color:#ffffff;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="padding:0 0 10px 0;">
                          <img src="${logo}" alt="StockDZ logo" width="140" height="140" style="display:block;width:140px;height:auto;max-width:140px;border:0;outline:none;text-decoration:none;border-radius:18px;" />
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:30px;line-height:36px;font-weight:700;letter-spacing:-0.04em;padding:0 0 2px 0;">
                          ${copy.brand}
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="font-family:Arial,Helvetica,sans-serif;color:#64748b;font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:0 0 16px 0;">
                          ${copy.brandTag}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="content-pad" style="padding:0 24px 8px 24px;background-color:#ffffff;">
                    <div style="font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.14em;color:#2563eb;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">${copy.brand}</div>
                    <h1 style="margin:10px 0 12px;font-size:30px;line-height:36px;font-weight:700;color:#0f172a;letter-spacing:-0.04em;font-family:Arial,Helvetica,sans-serif;">${heading}</h1>
                    <div style="font-size:16px;line-height:26px;color:#475569;font-family:Arial,Helvetica,sans-serif;">${intro}</div>
                  </td>
                </tr>
                <tr>
                  <td class="content-pad" style="padding:0 24px 16px 24px;background-color:#ffffff;">
                    ${bodyHtml}
                  </td>
                </tr>
                ${primaryButton}
                ${secondaryButton}
                <tr>
                  <td style="padding:18px 24px 24px 24px;background-color:#ffffff;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e5e7eb;">
                      <tr>
                        <td style="padding-top:18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#475569;">
                          <div style="font-weight:700;color:#0f172a;">${copy.brand}</div>
                          <div style="margin-top:2px;color:#64748b;">${copy.brandTag}</div>
                          <div style="margin-top:12px;">${copy.supportLabel}</div>
                          <div><a href="mailto:${copy.supportEmail}" style="color:#2563eb;font-weight:700;text-decoration:none;">${copy.supportEmail}</a></div>
                          <div style="margin-top:12px;color:#64748b;">${copy.footer}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

export async function sendApprovalRequestEmail(input: ApprovalEmailInput) {
  const recipient = input.to || env.adminEmail
  const isFrench = input.language === 'fr'
  const subject = isFrench ? 'StockDZ — Nouvelle demande d\'inscription' : 'StockDZ — New Account Approval Request'

  const html = `<!DOCTYPE html>
<html lang="${isFrench ? 'fr' : 'en'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;margin:0 auto;" border="0" cellpadding="0" cellspacing="0">
          <!-- Header -->
          <tr>
            <td style="padding:30px 24px;border-bottom:1px solid #e5e7eb;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#0f172a;margin:0 0 4px 0;">StockDZ</div>
              <div style="font-size:13px;color:#64748b;letter-spacing:0.08em;margin:0;">Business OS</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:24px 24px 12px 24px;">
              <div style="font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">${isFrench ? 'Nouvelle demande d\'inscription' : 'New Account Approval Request'}</div>
              <div style="font-size:15px;color:#475569;margin:0;">${isFrench ? 'Une nouvelle demande d\'accès a été soumise dans StockDZ.' : 'A new user has requested access to StockDZ.'}</div>
            </td>
          </tr>

          <!-- User Information -->
          <tr>
            <td style="padding:24px;">
              <div style="background-color:#f8fbff;border:1px solid #dbeafe;border-radius:8px;padding:16px;">
                <div style="margin:0 0 12px 0;">
                  <div style="font-size:13px;color:#64748b;margin:0 0 2px 0;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">${isFrench ? 'Informations du compte' : 'Account Information'}</div>
                </div>
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;font-size:14px;">
                      <strong>${isFrench ? 'Nom:' : 'Name:'}</strong> ${input.firstName} ${input.lastName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:14px;">
                      <strong>${isFrench ? 'E-mail:' : 'Email:'}</strong> ${input.email}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:14px;">
                      <strong>${isFrench ? 'Entreprise:' : 'Company:'}</strong> ${input.companyName}
                    </td>
                  </tr>
                  ${input.phone ? `<tr>
                    <td style="padding:8px 0;font-size:14px;">
                      <strong>${isFrench ? 'Téléphone:' : 'Phone:'}</strong> ${input.phone}
                    </td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:8px 0;font-size:14px;">
                      <strong>${isFrench ? 'Statut:' : 'Status:'}</strong> <span style="background-color:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:12px;">PENDING</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding:24px;text-align:center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:8px;" width="50%">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" bgcolor="#10b981" style="border-radius:6px;">
                          <a href="${input.approvalUrl}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">
                            ✓ ${isFrench ? 'Approuver' : 'Approve'}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding:8px;" width="50%">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" bgcolor="#ef4444" style="border-radius:6px;">
                          <a href="${input.rejectUrl}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">
                            ✕ ${isFrench ? 'Refuser' : 'Reject'}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Instruction Text -->
          <tr>
            <td style="padding:0 24px 24px 24px;font-size:14px;color:#475569;">
              ${isFrench ? 'Veuillez examiner cette demande et valider ou refuser l\'accès.' : 'Please review this account and decide whether to approve or reject access.'}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px;border-top:1px solid #e5e7eb;background-color:#f9fafb;font-size:12px;color:#64748b;">
              <div style="margin:0 0 8px 0;">
                <strong style="color:#0f172a;">StockDZ</strong> — Business OS
              </div>
              <div style="margin:0 0 8px 0;">
                ${isFrench ? 'Besoin d\'aide ?' : 'Need help?'} <a href="mailto:stockdz.support@gmail.com" style="color:#2563eb;text-decoration:none;">stockdz.support@gmail.com</a>
              </div>
              <div style="margin:0;color:#94a3b8;">
                © StockDZ — ${isFrench ? 'Gestion commerciale' : 'Business Management'}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  try {
    const info = await transporter.sendMail({
      from: env.smtp.from,
      to: recipient,
      replyTo: input.email,
      subject,
      html,
    })

    console.log('[StockDZ EMAIL]', {
      type: 'ADMIN_REGISTRATION_NOTIFICATION',
      to: recipient,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
    })

    return { delivered: true, info }
  } catch (error) {
    console.error('[StockDZ EMAIL ERROR]', {
      type: 'ADMIN_REGISTRATION_NOTIFICATION',
      to: recipient,
      error: error instanceof Error ? error.message : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return { delivered: false, error: error instanceof Error ? error.message : 'unknown' }
  }
}

export async function sendApprovalDecisionEmail(input: DecisionEmailInput) {
  const isFrench = input.language === 'fr'
  const subject = input.decision === 'approve'
    ? (isFrench ? 'StockDZ — Votre compte a été approuvé' : 'StockDZ — Your Account Has Been Approved')
    : (isFrench ? 'StockDZ — Mise à jour de votre demande' : 'StockDZ — Account Request Update')
  const loginUrl = input.loginUrl || `${env.frontendUrl || 'http://localhost:3000'}/login`
  const isApproved = input.decision === 'approve'
  const logo = getLogoBuffer()
  const text = isApproved
    ? `StockDZ\nBusiness OS\n\nAccount Approved\n\nHello ${input.firstName},\n\nYour StockDZ account has been approved.\n\nYour account is now active.\n\nGo to StockDZ: ${loginUrl}\n\nStockDZ\nBusiness OS`
    : `StockDZ\nBusiness OS\n\nAccount Rejected\n\nHello ${input.firstName},\n\nThe account for ${input.to} has been rejected.\n\nPlease contact the StockDZ administrator if you have questions.\n\nStockDZ\nBusiness OS`
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#ffffff;color:#111827;font-family:Arial,Helvetica,sans-serif;"><table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;"><tr><td align="center" style="padding:24px 12px;"><table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;"><tr><td align="center" style="padding:16px;"><img src="cid:stockdz-logo@stockdz" width="140" height="140" alt="StockDZ" style="display:block;width:140px;height:140px;border:0;"><br><span style="font-size:28px;line-height:36px;font-weight:bold;color:#111827;">StockDZ</span></td></tr><tr><td align="center" style="padding:0 16px 20px 16px;font-size:14px;line-height:20px;color:#374151;">Business OS</td></tr><tr><td style="padding:20px 16px;border-top:1px solid #e5e7eb;font-size:26px;line-height:34px;font-weight:bold;color:${isApproved ? '#047857' : '#b91c1c'};">${isApproved ? 'Account Approved' : 'Account Rejected'}</td></tr><tr><td style="padding:0 16px 12px 16px;font-size:16px;line-height:25px;color:#111827;">Hello ${input.firstName},</td></tr><tr><td style="padding:0 16px 12px 16px;font-size:16px;line-height:25px;color:#374151;">${isApproved ? 'Your StockDZ account has been approved.' : `The account for ${input.to} has been rejected.`}</td></tr><tr><td style="padding:0 16px 12px 16px;font-size:16px;line-height:25px;color:#374151;">${isApproved ? 'Your account is now active.' : 'Please contact the StockDZ administrator if you have questions.'}</td></tr>${isApproved ? `<tr><td style="padding:12px 16px 24px 16px;"><a href="${loginUrl}" style="color:#2563EB;font-size:16px;line-height:24px;font-weight:bold;">Go to StockDZ</a></td></tr>` : ''}<tr><td style="padding:20px 16px;border-top:1px solid #e5e7eb;font-size:14px;line-height:20px;color:#374151;">StockDZ<br>Business OS</td></tr></table></td></tr></table></body></html>`

  try {
    const info = await transporter.sendMail({
      from: env.smtp.from,
      to: input.to,
      subject,
      text,
      html,
      ...(logo ? { attachments: [{ filename: 'stockdz-logo.png', content: logo, cid: 'stockdz-logo@stockdz' }] } : {}),
    })

    console.log('[StockDZ DECISION EMAIL]', {
      type: input.decision === 'approve' ? 'APPROVAL_NOTICE' : 'REJECTION_NOTICE',
      to: input.to,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
    })

    return { delivered: true, info }
  } catch (error) {
    console.error('[StockDZ DECISION EMAIL ERROR]', {
      type: input.decision === 'approve' ? 'APPROVAL_NOTICE' : 'REJECTION_NOTICE',
      to: input.to,
      error: error instanceof Error ? error.message : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return { delivered: false, error: error instanceof Error ? error.message : 'unknown' }
  }
}

export function buildPasswordResetEmailHtml(input: PasswordResetEmailInput) {
  const expiresInMinutes = input.expiresInMinutes ?? 10
  const isFrench = input.language === 'fr'
  const subject = isFrench ? 'StockDZ — Code de réinitialisation' : 'StockDZ — Password Reset Code'
  const verificationUrl = input.verificationUrl || `${env.frontendUrl || 'http://localhost:3000'}/forgot-password?email=${encodeURIComponent(input.to)}`
  const text = `StockDZ\nBusiness OS\n\nReset your password\n\nHello ${input.firstName},\n\nWe received a request to reset your StockDZ password.\n\nYour verification code is:\n${input.code}\n\nThis code expires in ${expiresInMinutes} minutes.\n\nReset Password\n\nIf you did not request this password reset, you can safely ignore this email.\n\nStockDZ\nBusiness OS`
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#ffffff;color:#111827;font-family:Arial,Helvetica,sans-serif;"><table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;"><tr><td align="center" style="padding:24px 12px;"><table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;"><tr><td align="center" style="padding:16px;font-size:28px;line-height:36px;font-weight:bold;color:#111827;">StockDZ</td></tr><tr><td align="center" style="padding:0 16px 20px 16px;font-size:14px;line-height:20px;color:#374151;">Business OS</td></tr><tr><td style="padding:20px 16px;border-top:1px solid #e5e7eb;font-size:26px;line-height:34px;font-weight:bold;color:#111827;">Reset your password</td></tr><tr><td style="padding:0 16px 12px 16px;font-size:16px;line-height:25px;color:#111827;">Hello ${input.firstName},</td></tr><tr><td style="padding:0 16px 12px 16px;font-size:16px;line-height:25px;color:#374151;">We received a request to reset your StockDZ password.</td></tr><tr><td style="padding:0 16px 8px 16px;font-size:16px;line-height:25px;color:#374151;">Your verification code is:</td></tr><tr><td style="padding:8px 16px 20px 16px;font-size:30px;line-height:38px;font-weight:bold;letter-spacing:4px;color:#111827;">${input.code}</td></tr><tr><td style="padding:0 16px 12px 16px;font-size:16px;line-height:25px;color:#374151;">This code expires in ${expiresInMinutes} minutes.</td></tr><tr><td align="center" style="padding:0 16px 24px 16px;"><table border="0" cellpadding="0" cellspacing="0"><tr><td bgcolor="#2563EB" style="background-color:#2563EB;padding:12px 20px;"><a href="${verificationUrl}" style="color:#ffffff;font-size:16px;line-height:20px;font-weight:bold;text-decoration:none;">Reset Password</a></td></tr></table></td></tr><tr><td style="padding:0 16px 24px 16px;font-size:16px;line-height:25px;color:#374151;">If you did not request this password reset, you can safely ignore this email.</td></tr><tr><td style="padding:20px 16px;border-top:1px solid #e5e7eb;font-size:14px;line-height:20px;color:#374151;">StockDZ<br>Business OS</td></tr></table></td></tr></table></body></html>`
  return { html, text }
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const isFrench = input.language === 'fr'
  const subject = isFrench ? 'StockDZ — Code de réinitialisation' : 'StockDZ — Password Reset Code'

  const { html, text } = buildPasswordResetEmailHtml(input)

  try {
    const info = await transporter.sendMail({
      from: env.smtp.from,
      to: input.to,
      subject,
      text,
      html,
    })

    return { delivered: true, info }
  } catch (error) {
    console.error('[StockDZ PASSWORD RESET EMAIL ERROR]', {
      to: input.to,
      error: error instanceof Error ? error.message : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return { delivered: false, error: error instanceof Error ? error.message : 'unknown' }
  }
}

export async function sendPasswordChangedEmail(input: PasswordChangedEmailInput) {
  const isFrench = input.language === 'fr'
  const subject = isFrench ? 'StockDZ — Mot de passe modifié avec succès' : 'StockDZ — Password Successfully Changed'
  const heading = isFrench ? 'Mot de passe modifié avec succès' : 'Password changed successfully'
  const intro = isFrench ? `Bonjour ${input.firstName},` : `Hello ${input.firstName},`
  const loginUrl = input.loginUrl || `${env.frontendUrl || 'http://localhost:3000'}/login`

  const bodyHtml = `
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f8fbff;border:1px solid #dbeafe;border-radius:16px;">
      <tr>
        <td style="padding:18px 18px 10px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#475569;">
          ${isFrench ? 'Votre mot de passe StockDZ a été modifié avec succès.' : 'Your StockDZ password has been changed successfully.'}
        </td>
      </tr>
      <tr>
        <td style="padding:0 18px 18px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#475569;">
          ${isFrench ? 'Si vous n’avez pas effectué ce changement, contactez immédiatement l’administrateur.' : 'If you did not make this change, contact the administrator immediately.'}
        </td>
      </tr>
    </table>
  `

  const html = renderStockDzEmail({
    title: subject,
    heading,
    intro,
    bodyHtml,
    primaryButtonText: isFrench ? 'Se connecter à StockDZ' : 'Sign in to StockDZ',
    primaryButtonHref: loginUrl,
    language: isFrench ? 'fr' : 'en',
  })

  try {
    const info = await transporter.sendMail({
      from: env.smtp.from,
      to: input.to,
      subject,
      html,
    })

    return { delivered: true, info }
  } catch (error) {
    console.error('[StockDZ PASSWORD CHANGED EMAIL ERROR]', {
      to: input.to,
      error: error instanceof Error ? error.message : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return { delivered: false, error: error instanceof Error ? error.message : 'unknown' }
  }
}

export function createSingleUseToken() {
  return crypto.randomBytes(32).toString('hex')
}
