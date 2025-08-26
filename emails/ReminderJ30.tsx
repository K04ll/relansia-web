import * as React from "react";
import { ReminderEmailProps } from "./ReminderJ1";

const ReminderJ30: React.FC<ReminderEmailProps> = ({
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
            <h1>{firstName}, tu nous manques 💌</h1>
            <p>
              Cela fait un mois que nous n’avons plus eu de tes nouvelles chez{" "}
              {storeName}.
            </p>
            {offer && (
              <p>
                Pour ton retour, nous avons préparé une surprise&nbsp;:
                <br />
                <a
                  href={offer}
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: "#198754",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    marginTop: "16px",
                  }}
                >
                  Découvrir mon avantage
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

export default ReminderJ30;
