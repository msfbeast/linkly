
// Country code to full name mapping
export const COUNTRY_NAMES: Record<string, string> = {
    'IN': 'India', 'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada',
    'AU': 'Australia', 'DE': 'Germany', 'FR': 'France', 'NP': 'Nepal', 'BD': 'Bangladesh',
    'PK': 'Pakistan', 'AE': 'UAE', 'SG': 'Singapore', 'MY': 'Malaysia', 'ID': 'Indonesia',
    'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines', 'JP': 'Japan', 'KR': 'South Korea',
    'CN': 'China', 'BR': 'Brazil', 'MX': 'Mexico', 'SA': 'Saudi Arabia', 'QA': 'Qatar',
    'KW': 'Kuwait', 'OM': 'Oman', 'BH': 'Bahrain', 'LK': 'Sri Lanka', 'MM': 'Myanmar',
    'NZ': 'New Zealand', 'ZA': 'South Africa', 'NG': 'Nigeria', 'KE': 'Kenya', 'EG': 'Egypt',
    'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands', 'BE': 'Belgium', 'SE': 'Sweden',
    'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'PL': 'Poland', 'RU': 'Russia',
    'UA': 'Ukraine', 'TR': 'Turkey', 'IL': 'Israel', 'IE': 'Ireland', 'PT': 'Portugal',
    'CH': 'Switzerland', 'AT': 'Austria', 'CZ': 'Czech Republic', 'GR': 'Greece', 'HU': 'Hungary',
};

export const getCountryName = (code: string): string => {
    if (!code) return 'Unknown';
    // Already a full name
    if (code.length > 3) return code;
    return COUNTRY_NAMES[code.toUpperCase()] || code;
};
