// lib/templates/email.ts

export function renderRelansiaEmail(opts: {
  storeName: string;
  message: string;
  ctaUrl?: string;
  ctaLabel?: string;
  footerNote?: string;
}) {
  const { storeName, message, ctaUrl, ctaLabel = "Voir mon achat", footerNote } = opts;

  // Nettoyage simple pour éviter HTML cassé si message contient du texte brut
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const msgHtml = message.trim().startsWith("<")
    ? message
    : `<p style="margin:0 0 12px 0; line-height:1.6">${escape(message).replace(/\n/g, "<br/>")}</p>`;

  return `<!doctype html>
<html>
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>${storeName}</title>
</head>
<body style="margin:0;background:#f6f9fc;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaeaea">
    <tr>
      <td style="padding:20px 24px;border-bottom:1px solid #efefef;background:#0b69ff;color:#fff">
        <div style="font-size:18px;font-weight:700">Relansia • ${storeName}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px">
        ${msgHtml}
        ${ctaUrl ? `
        <div style="margin-top:20px">
          <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:12px 16px;border-radius:8px;border:1px solid #0b69ff;text-decoration:none;font-weight:600">
            ${ctaLabel}
          </a>
        </div>` : ``}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;border-top:1px solid #efefef;font-size:12px;color:#666">
        ${footerNote ? `<div style="margin-bottom:8px">${escape(footerNote)}</div>` : ``}
        <div>Vous recevez cet email parce que vous avez acheté chez <strong>${storeName}</strong>.</div>
        <div>© ${new Date().getFullYear()} Relansia</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
