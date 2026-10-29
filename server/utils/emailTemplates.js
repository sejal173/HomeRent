// server/utils/emailTemplates.js
// 5 clean HTML email templates for platform notifications.
// Styled with white background, blue #2563EB header, HomeRent text logo, and no external CSS.

const getClientBaseUrl = () => {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
};

const renderLayout = (title, contentHtml) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2563EB; padding: 24px 32px; text-align: left;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; text-decoration: none;">HomeRent</span>
            </td>
          </tr>
          <!-- Content Body -->
          <tr>
            <td style="padding: 32px; font-size: 15px; line-height: 1.6; color: #334155;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 4px;">This is an automated notification from HomeRent platform.</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} HomeRent. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * 1. propertyApproved
 */
export const propertyApproved = (landlordName, propertyTitle, propertyId) => {
  const propertyUrl = `${getClientBaseUrl()}/properties/${propertyId}`;
  const subject = 'Your listing is approved on HomeRent';
  const html = renderLayout(
    subject,
    `<h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Congratulations, ${landlordName || 'Landlord'}!</h2>
     <p>We are pleased to inform you that your rental property listing <strong>"${propertyTitle}"</strong> has been reviewed and approved by our moderation team.</p>
     <p>Your property is now live and visible to thousands of verified tenants searching on HomeRent.</p>
     <div style="margin: 28px 0; text-align: left;">
       <a href="${propertyUrl}" style="background-color: #2563EB; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
         View Live Listing &rarr;
       </a>
     </div>
     <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:<br><a href="${propertyUrl}" style="color: #2563EB;">${propertyUrl}</a></p>`
  );

  return { subject, html };
};

/**
 * 2. propertyRejected
 */
export const propertyRejected = (landlordName, propertyTitle, rejectionReason) => {
  const myListingsUrl = `${getClientBaseUrl()}/my-listings`;
  const subject = 'Update needed for your HomeRent listing';
  const html = renderLayout(
    subject,
    `<h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${landlordName || 'Landlord'},</h2>
     <p>Your listing <strong>"${propertyTitle}"</strong> requires updates before it can be published on HomeRent.</p>
     <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
       <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Reason from Moderation Team:</strong>
       <span style="color: #7f1d1d; font-size: 14px;">${rejectionReason || 'Details need review or clarification.'}</span>
     </div>
     <p>Please edit your listing to resolve the feedback above and resubmit it for review.</p>
     <div style="margin: 28px 0; text-align: left;">
       <a href="${myListingsUrl}" style="background-color: #2563EB; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
         Go to My Listings &rarr;
       </a>
     </div>
     <p style="font-size: 13px; color: #64748b;">Direct link: <a href="${myListingsUrl}" style="color: #2563EB;">${myListingsUrl}</a></p>`
  );

  return { subject, html };
};

/**
 * 3. visitConfirmed
 */
export const visitConfirmed = (tenantName, propertyTitle, date, time, ownerPhone) => {
  const subject = 'Your visit is confirmed - HomeRent';
  const html = renderLayout(
    subject,
    `<h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Visit Confirmed, ${tenantName || 'Tenant'}!</h2>
     <p>Good news! The landlord has accepted your in-person visit request for <strong>"${propertyTitle}"</strong>.</p>
     <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
       <p style="margin: 0 0 8px; font-size: 14px;"><strong>Property:</strong> ${propertyTitle}</p>
       <p style="margin: 0 0 8px; font-size: 14px;"><strong>Scheduled Date:</strong> ${date || 'As coordinated'}</p>
       <p style="margin: 0 0 8px; font-size: 14px;"><strong>Scheduled Time:</strong> ${time || 'As coordinated'}</p>
       <p style="margin: 0; font-size: 14px;"><strong>Owner Contact Number:</strong> ${ownerPhone || 'Provided upon coordination'}</p>
     </div>
     <p>Please arrive on time. If you need to reschedule or have any questions, you can reach out directly to the owner at the phone number above.</p>`
  );

  return { subject, html };
};

/**
 * 4. accountSuspended
 */
export const accountSuspended = (userName, suspensionReason) => {
  const subject = 'Your HomeRent account has been suspended';
  const html = renderLayout(
    subject,
    `<h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Account Notification</h2>
     <p>Dear ${userName || 'User'},</p>
     <p>Your HomeRent account has been suspended by the platform administration.</p>
     <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
       <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Reason for suspension:</strong>
       <span style="color: #7f1d1d; font-size: 14px;">${suspensionReason || 'Violation of platform safety guidelines.'}</span>
     </div>
     <p>While suspended, you will not be able to log in, post listings, or request property tours. If you believe this action was taken in error, please reply to this email or contact support.</p>`
  );

  return { subject, html };
};

/**
 * 5. accountReactivated
 */
export const accountReactivated = (userName) => {
  const propertiesUrl = `${getClientBaseUrl()}/properties`;
  const subject = 'Your HomeRent account is reactivated - HomeRent';
  const html = renderLayout(
    subject,
    `<h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Welcome Back, ${userName || 'User'}!</h2>
     <p>Your HomeRent account has been reviewed and successfully reactivated. All access to your account and platform features has been fully restored.</p>
     <div style="margin: 28px 0; text-align: left;">
       <a href="${propertiesUrl}" style="background-color: #2563EB; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
         Browse Properties &rarr;
       </a>
     </div>
     <p style="font-size: 13px; color: #64748b;">Direct link: <a href="${propertiesUrl}" style="color: #2563EB;">${propertiesUrl}</a></p>`
  );

  return { subject, html };
};

export default {
  propertyApproved,
  propertyRejected,
  visitConfirmed,
  accountSuspended,
  accountReactivated,
};

