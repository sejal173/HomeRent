import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Property from '../models/Property.js';
import {
  propertyApproved as tplPropertyApproved,
  propertyRejected as tplPropertyRejected,
  visitConfirmed as tplVisitConfirmed,
  accountSuspended as tplAccountSuspended,
  accountReactivated as tplAccountReactivated,
} from './emailTemplates.js';

let transporter = null;

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
}

/**
 * Sends an email notification.
 * Non-blocking / fire-and-forget safe: skips gracefully if credentials are not configured.
 * Never throws unhandled rejections or crashes the server.
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} htmlBody - Clean HTML email content
 */
export const sendEmail = (to, subject, htmlBody) => {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.warn(`⚠️  [emailService] EMAIL_USER or EMAIL_PASS not configured. Skipping email to "${to}".`);
      return Promise.resolve(null);
    }

    if (!to) {
      console.warn('⚠️  [emailService] Missing recipient email address.');
      return Promise.resolve(null);
    }

    const client = getTransporter();
    if (!client) {
      return Promise.resolve(null);
    }

    const mailOptions = {
      from: `"HomeRent" <${user}>`,
      to,
      subject,
      html: htmlBody,
    };

    return client
      .sendMail(mailOptions)
      .then((info) => {
        console.log(`📧 [emailService] Email sent to ${to}: "${subject}" (MessageId: ${info.messageId})`);
        return info;
      })
      .catch((err) => {
        console.error(`❌ [emailService] Failed to send email to ${to}:`, err.message);
        return null;
      });
  } catch (err) {
    console.error('❌ [emailService] Unexpected error in sendEmail:', err.message);
    return Promise.resolve(null);
  }
};

// Internal helper to extract or lookup recipient email & name
async function resolveEmailAndName(target, fallbackName = '') {
  if (typeof target === 'string' && target.includes('@')) {
    return { email: target, name: fallbackName };
  }
  if (target && typeof target === 'object' && target.email) {
    return { email: target.email, name: target.name || fallbackName };
  }
  if (target) {
    try {
      const user = await User.findById(target._id || target, 'name email').lean();
      if (user) {
        return { email: user.email, name: user.name || fallbackName };
      }
    } catch {
      // Lookup failed or invalid ID
    }
  }
  return { email: null, name: fallbackName };
}

// Internal helper to extract or lookup property title
async function resolvePropertyTitle(property) {
  if (typeof property === 'string' && property.length > 0 && !property.match(/^[0-9a-fA-F]{24}$/)) {
    return property;
  }
  if (property && typeof property === 'object' && property.title) {
    return property.title;
  }
  if (property) {
    try {
      const prop = await Property.findById(property._id || property, 'title').lean();
      if (prop) return prop.title;
    } catch {
      // Lookup failed
    }
  }
  return 'Rental Property';
}

/**
 * 1. Notify Landlord of Property Approval
 */
export const sendPropertyApproved = (ownerTarget, landlordName, propertyTitle, propertyId) => {
  return (async () => {
    try {
      const { email, name } = await resolveEmailAndName(ownerTarget, landlordName);
      if (!email) return;
      const title = await resolvePropertyTitle(propertyTitle);
      const { subject, html } = tplPropertyApproved(name, title, propertyId);
      return sendEmail(email, subject, html);
    } catch (err) {
      console.error('❌ [emailService] Error sending propertyApproved email:', err.message);
    }
  })();
};

/**
 * 2. Notify Landlord of Property Rejection
 */
export const sendPropertyRejected = (ownerTarget, landlordName, propertyTitle, rejectionReason) => {
  return (async () => {
    try {
      const { email, name } = await resolveEmailAndName(ownerTarget, landlordName);
      if (!email) return;
      const title = await resolvePropertyTitle(propertyTitle);
      const { subject, html } = tplPropertyRejected(name, title, rejectionReason);
      return sendEmail(email, subject, html);
    } catch (err) {
      console.error('❌ [emailService] Error sending propertyRejected email:', err.message);
    }
  })();
};

/**
 * 3. Notify User of Account Suspension
 */
export const sendAccountSuspended = (userTarget, userName, suspensionReason) => {
  return (async () => {
    try {
      const { email, name } = await resolveEmailAndName(userTarget, userName);
      if (!email) return;
      const { subject, html } = tplAccountSuspended(name, suspensionReason);
      return sendEmail(email, subject, html);
    } catch (err) {
      console.error('❌ [emailService] Error sending accountSuspended email:', err.message);
    }
  })();
};

/**
 * 4. Notify User of Account Reactivation
 */
export const sendAccountReactivated = (userTarget, userName) => {
  return (async () => {
    try {
      const { email, name } = await resolveEmailAndName(userTarget, userName);
      if (!email) return;
      const { subject, html } = tplAccountReactivated(name);
      return sendEmail(email, subject, html);
    } catch (err) {
      console.error('❌ [emailService] Error sending accountReactivated email:', err.message);
    }
  })();
};

/**
 * 5. Notify Tenant of Visit Confirmation
 */
export const sendVisitConfirmed = (tenantTarget, tenantName, propertyTarget, date, time, ownerPhone) => {
  return (async () => {
    try {
      const { email, name } = await resolveEmailAndName(tenantTarget, tenantName);
      if (!email) return;
      const title = await resolvePropertyTitle(propertyTarget);
      const formattedDate = date instanceof Date ? date.toLocaleDateString('en-IN', { dateStyle: 'medium' }) : String(date || '');
      const { subject, html } = tplVisitConfirmed(name, title, formattedDate, time, ownerPhone);
      return sendEmail(email, subject, html);
    } catch (err) {
      console.error('❌ [emailService] Error sending visitConfirmed email:', err.message);
    }
  })();
};

export default {
  sendEmail,
  sendPropertyApproved,
  sendPropertyRejected,
  sendAccountSuspended,
  sendAccountReactivated,
  sendVisitConfirmed,
};
