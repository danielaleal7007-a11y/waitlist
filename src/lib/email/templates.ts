export const emailTemplates = {
  welcome: {
    subject: 'Welcome to SMM Panel!',
    html: (data: { displayName: string; username: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SMM Panel!</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.displayName}!</h2>
              <p>Thank you for joining SMM Panel. Your account has been successfully created.</p>
              <p><strong>Username:</strong> ${data.username}</p>
              <p>You can now start ordering social media marketing services.</p>
              <a href="${process.env.APP_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SMM Panel. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  emailVerification: {
    subject: 'Verify your email address',
    html: (data: { displayName: string; verificationUrl: string }) => `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.displayName}!</h2>
              <p>Please verify your email address by clicking the button below:</p>
              <a href="${data.verificationUrl}" class="button">Verify Email</a>
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  passwordReset: {
    subject: 'Reset your password',
    html: (data: { displayName: string; resetUrl: string }) => `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.displayName}!</h2>
              <p>You requested to reset your password. Click the button below to proceed:</p>
              <a href="${data.resetUrl}" class="button">Reset Password</a>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  orderConfirmation: {
    subject: 'Order Confirmation',
    html: (data: { displayName: string; orderId: string; serviceName: string; amount: number; currency: string }) => `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.displayName}!</h2>
              <p>Your order has been confirmed and is being processed.</p>
              <p><strong>Order ID:</strong> ${data.orderId}</p>
              <p><strong>Service:</strong> ${data.serviceName}</p>
              <p><strong>Amount:</strong> ${data.currency} ${data.amount.toFixed(2)}</p>
              <a href="${process.env.APP_URL}/orders/${data.orderId}" class="button">View Order</a>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  orderCompleted: {
    subject: 'Order Completed',
    html: (data: { displayName: string; orderId: string; serviceName: string }) => `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Completed</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.displayName}!</h2>
              <p>Your order has been completed successfully!</p>
              <p><strong>Order ID:</strong> ${data.orderId}</p>
              <p><strong>Service:</strong> ${data.serviceName}</p>
              <a href="${process.env.APP_URL}/orders/${data.orderId}" class="button">View Order</a>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  paymentReceived: {
    subject: 'Payment Received',
    html: (data: { displayName: string; amount: number; currency: string; paymentId: string }) => `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.displayName}!</h2>
              <p>We've received your payment.</p>
              <p><strong>Amount:</strong> ${data.currency} ${data.amount.toFixed(2)}</p>
              <p><strong>Payment ID:</strong> ${data.paymentId}</p>
              <a href="${process.env.APP_URL}/wallet" class="button">View Wallet</a>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  ticketReply: {
    subject: 'New reply to your ticket',
    html: (data: { displayName: string; ticketId: string; subject: string; reply: string }) => `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ticket Reply</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.displayName}!</h2>
              <p>You have a new reply to your ticket:</p>
              <p><strong>Ticket:</strong> ${data.subject}</p>
              <p><strong>Reply:</strong></p>
              <blockquote>${data.reply}</blockquote>
              <a href="${process.env.APP_URL}/tickets/${data.ticketId}" class="button">View Ticket</a>
            </div>
          </div>
        </body>
      </html>
    `,
  },
}

export type EmailTemplate = keyof typeof emailTemplates
