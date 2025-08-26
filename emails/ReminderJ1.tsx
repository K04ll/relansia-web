import * as React from "react";

export interface ReminderEmailProps {
  firstName: string;
  storeName: string;
  offer?: string | null;
  signature: string;
  unsubscribeUrl: string;
}

const ReminderJ1: React.FC<ReminderEmailProps> = ({
  firstName,
  storeName,
  offer,
  signature,
  unsubscribeUrl,
}) => (
  <html>
    <body style={{ fontFamily: "sans-serif", margin: 0, padding: 0 }}>
      <table width="100%" style={{ maxWidth: 600, margin: "0 auto" }}>
        <tr>
          <td>
            <h1>Bonjour {firstName},</h1>
            <p>
              Merci pour ta confiance chez <strong>{storeName}</strong> 🛍️
            </p>
            {offer && (
              <p>
                Profite dès maintenant de ton offre&nbsp;:
                <br />
                <a
                  href={offer}
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: "#111",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    marginTop: "16px",
                  }}
                >
                  Voir mon offre
                </a>
              </p>
            )}
            <p>{signature}</p>
            <hr style={{ margin: "32px 0" }} />
            <p style={{ fontSize: "12px", color: "#666" }}>
              Vous recevez cet email car vous avez effectué un achat chez{" "}
              {storeName}.<br />
              <a href={unsubscribeUrl}>Se désabonner</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
);

export default ReminderJ1;
