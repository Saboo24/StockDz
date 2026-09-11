#!/usr/bin/env python3
import re

# Read the file
with open('backend/src/lib/email.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# New approval email function - Gmail compatible, simple HTML
new_function = '''export async function sendApprovalRequestEmail(input: ApprovalEmailInput) {
  const recipient = input.to || env.adminEmail
  const isFrench = input.language === 'fr'
  const subject = isFrench ? 'StockDZ — Nouvelle demande d\\'inscription' : 'StockDZ — New Account Approval Request'

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
              <div style="font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">${isFrench ? 'Nouvelle demande d\\'inscription' : 'New Account Approval Request'}</div>
              <div style="font-size:15px;color:#475569;margin:0;">${isFrench ? 'Une nouvelle demande d\\'accès a été soumise dans StockDZ.' : 'A new user has requested access to StockDZ.'}</div>
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
              ${isFrench ? 'Veuillez examiner cette demande et valider ou refuser l\\'accès.' : 'Please review this account and decide whether to approve or reject access.'}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px;border-top:1px solid #e5e7eb;background-color:#f9fafb;font-size:12px;color:#64748b;">
              <div style="margin:0 0 8px 0;">
                <strong style="color:#0f172a;">StockDZ</strong> — Business OS
              </div>
              <div style="margin:0 0 8px 0;">
                ${isFrench ? 'Besoin d\\'aide ?' : 'Need help?'} <a href="mailto:stockdz.support@gmail.com" style="color:#2563eb;text-decoration:none;">stockdz.support@gmail.com</a>
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
}'''

# Find and replace the old function
start = content.find('export async function sendApprovalRequestEmail')
if start == -1:
    print("ERROR: Function not found")
    exit(1)

brace_start = content.find('{', start)
brace_count = 1
pos = brace_start + 1
while brace_count > 0 and pos < len(content):
    if content[pos] == '{':
        brace_count += 1
    elif content[pos] == '}':
        brace_count -= 1
    pos += 1

func_end = pos

# Replace the old function with the new one
new_content = content[:start] + new_function + content[func_end:]

# Write back
with open('backend/src/lib/email.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✓ Approval email function replaced successfully")
