import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  let transporter;

  // Gmail configuration
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
    console.log('📧 Email Service: Using Gmail SMTP');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  } else {
    console.log('📧 Email Service: No email configuration found - using mock mode');
    console.log('📧 Mock Email Sent:', {
      to: options.email,
      subject: options.subject,
      content: options.html?.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
    });
    return Promise.resolve();
  }

  // Verify transporter
  await transporter.verify();

  // Define email options
  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.GMAIL_EMAIL,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  // Send the email
  const result = await transporter.sendMail(mailOptions);
  
  console.log('✅ Email sent successfully:', {
    to: options.email,
    subject: options.subject,
    messageId: result.messageId
  });

  return result;
};

export default sendEmail; 