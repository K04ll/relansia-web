import * as React from "react";

type ReminderEmailProps = {
  subject?: string;
  previewText?: string;
  storeName?: string | null;
  senderName?: string | null;
  firstName?: string | null;
  message?: string;
  offerUrl?: string | null;
  signature?: string | null;
  logoUrl?: string | null;
  unsubscribeUrl?: string | null;
};

export default function ReminderEmail({
  subject = "Un petit rappel — Relansia",
  previewText = "Votre rappel automatique",
  storeName = "Votre boutique",
  senderName = "Relansia",
  firstName,
  message = "",
  offerUrl,
  signature = "— L’équipe",
  logoUrl,
  unsubscribeUrl,
}: ReminderEmailProps) {
  const bg = "#F5F7FB";
  const panel = "#FFFFFF";
  const text = "#0F172A";
  const subText = "#475569";
  const primary = "#2563EB";
  const border = "#E2E8F0";

  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>{subject}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: bg,
          fontFamily:
            "ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Préheader invisible */}
        <span
          style={{
            display: "none",
            overflow: "hidden",
            lineHeight: "1px",
            opacity: 0,
            maxHeight: 0,
            maxWidth: 0,
          }}
        >
          {previewText}
          {" ".repeat(180)}
        </span>

        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ padding: "24px 0" }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width={600}
                  style={{
                    background: panel,
                    borderRadius: "12px",
                    border: `1px solid ${border}`,
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td style={{ padding: "24px 28px" }}>
                        <div style={{ 
  display: "inline-block",
  padding: "4px 8px",
  fontSize: "11px",
  borderRadius: "999px",
  background: "#E2E8F0",
  color: "#0F172A",
  marginBottom: "10px"
}}>
  HTML MODE ✅
</div>

                        {logoUrl ? (
                          <img src={logoUrl} alt={storeName ?? "Logo"} width="120" />
                        ) : (
                          <strong style={{ fontSize: "18px", color: text }}>
                            {storeName}
                          </strong>
                        )}
                      </td>
                    </tr>

                    {/* Body */}
                    <tr>
                      <td style={{ padding: "28px" }}>
                        <h1
                          style={{
                            margin: 0,
                            fontSize: "22px",
                            lineHeight: "28px",
                            color: text,
                          }}
                        >
                          {firstName ? `Bonjour ${firstName},` : "Bonjour,"}
                        </h1>
                        <p
                          style={{
                            margin: "12px 0 0",
                            fontSize: "15px",
                            lineHeight: "22px",
                            color: text,
                          }}
                        >
                          {message || "Nous avons pensé à vous…"}
                        </p>

                        {offerUrl && (
                          <div style={{ marginTop: "20px" }}>
                            <a
                              href={offerUrl}
                              target="_blank"
                              rel="noopener"
                              style={{
                                display: "inline-block",
                                padding: "12px 18px",
                                borderRadius: "999px",
                                background: primary,
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "14px",
                                textDecoration: "none",
                              }}
                            >
                              Voir l’offre
                            </a>
                          </div>
                        )}

                        <p
                          style={{
                            margin: "20px 0 0",
                            fontSize: "14px",
                            color: subText,
                          }}
                        >
                          {signature}
                        </p>
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td style={{ padding: "24px 28px", fontSize: "12px", color: subText }}>
                        <div style={{ height: "1px", background: border, marginBottom: "8px" }} />
                        Envoyé par {senderName} — {storeName}.
                        <br />
                        <a
                          href={unsubscribeUrl ?? "#"}
                          style={{ color: subText, textDecoration: "underline" }}
                        >
                          Se désabonner
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
