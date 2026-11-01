/**
 * Turn Vercel's geo headers (ISO codes) into the names click analytics
 * already store. Clicks were previously geolocated with ip-api.com, which
 * returns full names ("India", "Maharashtra"), and the dashboard's maps and
 * tables group by those names. These tables reproduce ip-api's spellings
 * for India and the US (taken from production data); other countries'
 * regions keep Vercel's code.
 */

const IN_REGIONS: Record<string, string> = {
    AN: 'Andaman and Nicobar',
    AP: 'Andhra Pradesh',
    AR: 'Arunachal Pradesh',
    AS: 'Assam',
    BR: 'Bihar',
    CH: 'Chandigarh',
    CG: 'Chhattisgarh',
    CT: 'Chhattisgarh',
    DH: 'Dadra and Nagar Haveli and Daman and Diu',
    DN: 'Dadra and Nagar Haveli and Daman and Diu',
    DD: 'Dadra and Nagar Haveli and Daman and Diu',
    DL: 'National Capital Territory of Delhi',
    GA: 'Goa',
    GJ: 'Gujarat',
    HR: 'Haryana',
    HP: 'Himachal Pradesh',
    JK: 'Jammu and Kashmir',
    JH: 'Jharkhand',
    KA: 'Karnataka',
    KL: 'Kerala',
    LA: 'Ladakh',
    LD: 'Lakshadweep',
    MP: 'Madhya Pradesh',
    MH: 'Maharashtra',
    MN: 'Manipur',
    ML: 'Meghalaya',
    MZ: 'Mizoram',
    NL: 'Nagaland',
    OD: 'Odisha',
    OR: 'Odisha',
    PY: 'Union Territory of Puducherry',
    PB: 'Punjab',
    RJ: 'Rajasthan',
    SK: 'Sikkim',
    TN: 'Tamil Nadu',
    TG: 'Telangana',
    TS: 'Telangana',
    TR: 'Tripura',
    UP: 'Uttar Pradesh',
    UK: 'Uttarakhand',
    UT: 'Uttarakhand',
    WB: 'West Bengal',
};

const US_REGIONS: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington, D.C.', FL: 'Florida',
    GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
    IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
    MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
    MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
    NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
    OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
    SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
    VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin',
    WY: 'Wyoming', PR: 'Puerto Rico',
};

let displayNames: Intl.DisplayNames | null | undefined;

/** "IN" -> "India"; unknown or invalid codes are returned unchanged. */
export function countryName(code: string | null | undefined): string | null {
    if (!code) return null;
    const upper = code.toUpperCase();
    if (displayNames === undefined) {
        try {
            displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
        } catch {
            displayNames = null;
        }
    }
    try {
        return displayNames?.of(upper) || upper;
    } catch {
        return upper;
    }
}

/** ("IN", "MH") -> "Maharashtra"; other countries keep the region code. */
export function regionName(countryCode: string | null | undefined, regionCode: string | null | undefined): string | null {
    if (!regionCode) return null;
    const region = regionCode.toUpperCase();
    const table = countryCode?.toUpperCase() === 'IN' ? IN_REGIONS
        : countryCode?.toUpperCase() === 'US' ? US_REGIONS
        : null;
    return table?.[region] ?? regionCode;
}

export interface GeoFromHeaders {
    country: string | null;
    countryCode: string | null;
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
}

function decode(value: string | null): string | null {
    if (!value) return null;
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function num(value: string | null): number | null {
    if (value === null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/** Visitor location from Vercel's x-vercel-ip-* request headers. */
export function geoFromVercelHeaders(headers: Headers): GeoFromHeaders {
    const countryCode = headers.get('x-vercel-ip-country')?.toUpperCase() || null;
    return {
        country: countryName(countryCode),
        countryCode,
        region: regionName(countryCode, headers.get('x-vercel-ip-country-region')),
        city: decode(headers.get('x-vercel-ip-city')),
        latitude: num(headers.get('x-vercel-ip-latitude')),
        longitude: num(headers.get('x-vercel-ip-longitude')),
    };
}
