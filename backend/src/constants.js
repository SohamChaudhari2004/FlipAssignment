// Country code to full name mapping
export const COUNTRY_NAMES = {
    'US': 'United States',
    'IN': 'India',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'JP': 'Japan',
    'CN': 'China',
    'AU': 'Australia',
    'CA': 'Canada',
    'BR': 'Brazil',
    'AE': 'United Arab Emirates',
    'SG': 'Singapore',
    'KR': 'South Korea',
    'RU': 'Russia',
    'SA': 'Saudi Arabia',
};

export const RESTRICTED_BRANDS = ["huawei", "samsung"]

// Currency info by region
export const CURRENCIES = {
    'US': 'USD ($)',
    'IN': 'INR (₹)',
    'GB': 'GBP (£)',
    'DE': 'EUR (€)',
    'FR': 'EUR (€)',
    'JP': 'JPY (¥)',
    'CN': 'CNY (¥)',
    'AU': 'AUD (A$)',
    'CA': 'CAD (C$)',
    'BR': 'BRL (R$)',
    'AE': 'AED (د.إ)',
    'SG': 'SGD (S$)',
    'KR': 'KRW (₩)',
    'RU': 'RUB (₽)',
    'SA': 'SAR (ر.س)',
};

// Agent configuration
export const AGENT_CONFIG = {
    model: 'mistral-large-latest',
    temperature: 0.3,
    maxIterations: 3,
    maxResults: 5,
    historyLimit: 20,
    defaultRegion: 'IN',
};
