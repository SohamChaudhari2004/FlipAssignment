import { CURRENCIES } from './constants.js';

/**
 * Get formatted current date string
 * @returns {string} Formatted date (e.g., "Wednesday, January 22, 2026")
 */
export function getCurrentDate() {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Get currency info for a region
 * @param {string} region - Country code (e.g., 'US', 'IN')
 * @returns {string} Currency info string
 */
export function getCurrencyInfo(region) {
    return CURRENCIES[region] || 'local currency';
}

/**
 * Get country name from code
 * @param {string} region - Country code
 * @param {object} countryNames - Country names mapping
 * @returns {string} Full country name
 */
export function getCountryName(region, countryNames) {
    return countryNames[region] || region;
}
