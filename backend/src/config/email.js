const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transport configuration
let transporter;

// Check if we're in production or development
if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
  // Production email setup
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  // Development - log emails to console with improved formatting
  console.log('Email service running in development mode - emails will be logged to console');
  transporter = {
    sendMail: async (options) => {
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL NOTIFICATION');
      console.log('='.repeat(80));
      console.log(`📥 TO:      ${options.to}`);
      console.log(`📤 FROM:    ${options.from}`);
      console.log(`📌 SUBJECT: ${options.subject}`);
      
      if (options.text) {
        console.log('\n📝 TEXT CONTENT:');
        console.log('-'.repeat(80));
        console.log(options.text);
      }
      
      if (options.html) {
        console.log('\n🖥️  HTML CONTENT:');
        console.log('-'.repeat(80));
        console.log(options.html);
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
      return { messageId: 'dev-message-id' };
    }
  };
}

module.exports = {
  sendEmail: async (options) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'AbdulrahmanAlsaadan01@gmail.com',
        ...options
      };

      return await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  // Helper for support inquiries
  sendSupportConfirmation: async (userEmail, name, subject, message, ticketId) => {
    try {
      // Email to user confirming their request
      const userMailOptions = {
        to: userEmail,
        subject: 'Your Support Request Has Been Received - Sayarati',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4169E1; color: white; padding: 20px; text-align: center;">
              <h1>Sayarati Support</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <p>Dear ${name},</p>
              <p>Thank you for contacting Sayarati Support. We have received your request and our team will get back to you shortly.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #4169E1;">
                <p><strong>Ticket ID:</strong> ${ticketId}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Your message:</strong> ${message}</p>
              </div>
              
              <p>Please keep your ticket ID for future reference. You can refer to this ID in any follow-up communications.</p>
              <p>We appreciate your patience and will respond as soon as possible.</p>
              <p>Best regards,<br>The Sayarati Support Team</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">        
              <p>© ${new Date().getFullYear()} Sayarati. All rights reserved.</p>
            </div>
          </div>
        `
      };

      // Email to support team about new inquiry
      const supportMailOptions = {
        to: process.env.SUPPORT_EMAIL || 'AbdulrahmanAlsaadan01@gmail.com',
        subject: `New Support Request: ${subject} [${ticketId}]`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4169E1; color: white; padding: 20px; text-align: center;">
              <h1>New Support Request</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <p><strong>Ticket ID:</strong> ${ticketId}</p>
              <p><strong>From:</strong> ${name} (${userEmail})</p>
              <p><strong>Subject:</strong> ${subject}</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #4169E1;">        
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
              
              <p>Please respond to this customer as soon as possible.</p>
            </div>
          </div>
        `
      };

      // Send both emails
      await module.exports.sendEmail(userMailOptions);
      await module.exports.sendEmail(supportMailOptions);

      return true;
    } catch (error) {
      console.error('Error sending support emails:', error);
      throw error;
    }
  }
};
