// backend/utils/mailer.js
// const path       = require('path');
const nodemailer = require('nodemailer');

// 1) Load /backend/.env (NOT the root .env)
// require('dotenv').config({
//  path: path.resolve(__dirname, '../.env')
// });

// 2) Create your SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, 
    pass: process.env.GMAIL_PASS,
  },
});

// 3) Generic send helper
async function sendMail(to, subject, html) {
  return transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

// 4) Verification email
async function sendVerificationEmail(email, token) {
  const url  = `${process.env.SERVER_URL}/api/verify?token=${token}`;
  const html = `
    <p>Welcome to LMS! Please verify your email:</p>
    <a href="${url}">${url}</a>
  `;
  return sendMail(email, 'Confirm your LMS account', html);
}

// 5) Password-reset email
async function sendResetEmail(email, token) {
  const url  = `${process.env.APP_BASE_URL}/reset?token=${token}`;
  const html = `
    <p>Reset your LMS password by clicking:</p>
    <a href="${url}">${url}</a>
  `;
  return sendMail(email, 'Reset your LMS password', html);
}

// new helper:
async function sendInvitationEmail(email, link) {
  const html = `
    <p>Hi there,</p>
    <p>You’ve been invited to join a class on LMS. Click below to accept:</p>
    <p><a href="${link}">${link}</a></p>
    <p>If you don’t have an account yet, you’ll be prompted to sign up.</p>
  `
  return sendMail(
    email,
    'You’re invited to join a class on LMS',
    html
  )
}

module.exports = {
  sendVerificationEmail,
  sendResetEmail,
  sendMail,
  sendInvitationEmail
};