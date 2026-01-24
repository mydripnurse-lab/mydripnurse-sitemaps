// services/ghlLocationToken.js
import { ghlFetch } from "./ghlClient.js";

/**
 * Get Location Access Token (GHL)
 * Endpoint: POST https://services.leadconnectorhq.com/oauth/locationToken
 *
 * Required:
 * - Authorization: Bearer <AGENCY_ACCESS_TOKEN>
 * - Version: 2021-07-28
 * - Body: { companyId, locationId }
 *
 * Returns:
 * - { access_token, token_type, expires_in, ... }  (depende del response real)
 */
export async function getLocationAccessToken({ companyId, locationId, agencyAccessToken }) {
    if (!companyId) throw new Error("companyId is required");
    if (!locationId) throw new Error("locationId is required");
    if (!agencyAccessToken) throw new Error("agencyAccessToken is required");

    const url = "https://services.leadconnectorhq.com/oauth/locationToken";

    // NOTE:
    // ghlFetch debe aceptar URL absoluta. Si ghlFetch solo acepta paths tipo "/locations/",
    // entonces hay que ajustarlo en ghlClient.js para detectar URLs absolutas.
    const res = await ghlFetch(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Version: "2021-07-28",
            Authorization: `Bearer ${agencyAccessToken}`,
        },
        body: JSON.stringify({
            companyId,
            locationId,
        }),
    });

    return res;
}
