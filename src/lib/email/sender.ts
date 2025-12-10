import nodemailer from 'nodemailer'
import { emailTemplates, EmailTemplate } from './templates'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) {
    return transporter
  }

  const emailProvider = process.env.EMAIL_PROVIDER || 'smtp'

  if (emailProvider === 'smtp') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  } else if (emailProvider === 'sendgrid') {
    // SendGrid SMTP configuration
    transporter = nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  }

  return transporter
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  from?: string
}): Promise<boolean> {
  try {
    const transport = getTransporter()

    if (!transport) {
      console.error('Email transporter not configured')
      return false
    }

    await transport.sendMail({
      from: params.from || process.env.EMAIL_FROM || 'noreply@smmpanel.com',
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendTemplateEmail(params: {
  to: string
  template: EmailTemplate
  data: any
  from?: string
}): Promise<boolean> {
  const templateConfig = emailTemplates[params.template]

  if (!templateConfig) {
    console.error(`Email template not found: ${params.template}`)
    return false
  }

  return sendEmail({
    to: params.to,
    subject: templateConfig.subject,
    html: templateConfig.html(params.data),
    from: params.from,
  })
}

// Test email configuration
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transport = getTransporter()
    
    if (!transport) {
      return false
    }

    await transport.verify()
    return true
  } catch (error) {
    console.error('Email connection test failed:', error)
    return false
  }
}
