import nodemailer from 'nodemailer';
import { User } from '@prisma/client';
import config from '../../config';

class Email {
  private to: string;
  private user: User;
  private from: string;

  constructor(user: User) {
    this.user = user;
    this.to = user.email || 'admin@gmail.com';
    this.from = `Willmo <${config.mail}>`; // আপনার Gmail এখানে যাবে
  }

  private newTransport() {
    return nodemailer.createTransport({
      service: 'gmail', // Gmail SMTP use করব
      auth: {
        user: process.env.MAIL,            // আপনার Gmail address
        pass: process.env.MAIL_PASS   // Gmail App Password
      },
    });
  }

  private async send(subject: string, html: string) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };

    try {
      const result = await this.newTransport().sendMail(mailOptions);
      console.log('✅ Email sent to:', this.to, result.messageId);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
    }
  }

  async sendEmailVerificationLink(subject: string, link: string) {
    const html = `
      <div style="padding: 20px; background: #fff; font-family: Arial;">
        <h2 style="color: #8dc63f;">Email Verification</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${link}" style="display: inline-block; background: #000; color: #fff; padding: 10px 15px; border-radius: 4px;">VERIFY NOW</a>
      </div>
    `;
    await this.send(subject, html);
  }

  async sendPasswordReset(OTP: string) {
    const html = `
      <div style="padding: 20px; background: #fff; font-family: Arial;">
        <h2 style="color: #FF7600;">OTP Verification</h2>
        <p>Your OTP is:</p>
        <div style="font-size: 32px; font-weight: bold; color: #FF7600;">${OTP}</div>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `;
    await this.send('Reset your password', html);
  }

  async sendContactMail(message: string) {
    const html = `<p>${message}</p>`;
    await this.send('Contact Message', html);
  }

  async sendCustomEmail(subject: string, message: string) {
    const html = `<div><p>${message}</p></div>`;
    await this.send(subject, html);
  }

  async sendWelcome() {
    const html = `<h2>Welcome to FLIND!</h2><p>We’re glad to have you on board.</p>`;
    await this.send('Welcome to FLIND', html);
  }
}

export default Email;
