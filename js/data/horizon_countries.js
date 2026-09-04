/**
 * Horizon Europe Country Master Dataset
 * Includes EU27 Member States, Associated Countries, and Third Countries
 */

const HORIZON_ROLES = {
  COORDINATOR: { id: 'COORDINATOR', label: 'Project Coordinator', color: '#3b82f6' },
  BENEFICIARY: { id: 'BENEFICIARY', label: 'Beneficiary (Partner)', color: '#10b981' },
  ASSOCIATED:  { id: 'ASSOCIATED',  label: 'Associated Partner',  color: '#8b5cf6' }
};

const HORIZON_COUNTRIES = [
  // --- EU27 Member States ---
  { id: 'AT', iso3: 'AUT', name: 'Austria', flag: '🇦🇹', category: 'eu27', centroid: [14.55, 47.51] },
  { id: 'BE', iso3: 'BEL', name: 'Belgium', flag: '🇧🇪', category: 'eu27', centroid: [4.46, 50.50] },
  { id: 'BG', iso3: 'BGR', name: 'Bulgaria', flag: '🇧🇬', category: 'eu27', centroid: [25.48, 42.73] },
  { id: 'HR', iso3: 'HRV', name: 'Croatia', flag: '🇭🇷', category: 'eu27', centroid: [15.20, 45.10] },
  { id: 'CY', iso3: 'CYP', name: 'Cyprus', flag: '🇨🇾', category: 'eu27', centroid: [33.42, 35.12] },
  { id: 'CZ', iso3: 'CZE', name: 'Czechia', flag: '🇨🇿', category: 'eu27', centroid: [15.47, 49.81] },
  { id: 'DK', iso3: 'DNK', name: 'Denmark', flag: '🇩🇰', category: 'eu27', centroid: [9.50, 56.26] },
  { id: 'EE', iso3: 'EST', name: 'Estonia', flag: '🇪🇪', category: 'eu27', centroid: [25.01, 58.59] },
  { id: 'FI', iso3: 'FIN', name: 'Finland', flag: '🇫🇮', category: 'eu27', centroid: [25.74, 61.92] },
  { id: 'FR', iso3: 'FRA', name: 'France', flag: '🇫🇷', category: 'eu27', centroid: [2.21, 46.22] },
  { id: 'DE', iso3: 'DEU', name: 'Germany', flag: '🇩🇪', category: 'eu27', centroid: [10.45, 51.16] },
  { id: 'GR', iso3: 'GRC', name: 'Greece', flag: '🇬🇷', category: 'eu27', centroid: [21.82, 39.07] },
  { id: 'HU', iso3: 'HUN', name: 'Hungary', flag: '🇭🇺', category: 'eu27', centroid: [19.50, 47.16] },
  { id: 'IE', iso3: 'IRL', name: 'Ireland', flag: '🇮🇪', category: 'eu27', centroid: [-8.24, 53.41] },
  { id: 'IT', iso3: 'ITA', name: 'Italy', flag: '🇮🇹', category: 'eu27', centroid: [12.56, 41.87] },
  { id: 'LV', iso3: 'LVA', name: 'Latvia', flag: '🇱🇻', category: 'eu27', centroid: [24.60, 56.87] },
  { id: 'LT', iso3: 'LTU', name: 'Lithuania', flag: '🇱🇹', category: 'eu27', centroid: [23.88, 55.16] },
  { id: 'LU', iso3: 'LUX', name: 'Luxembourg', flag: '🇱🇺', category: 'eu27', centroid: [6.12, 49.81] },
  { id: 'MT', iso3: 'MLT', name: 'Malta', flag: '🇲🇹', category: 'eu27', centroid: [14.37, 35.93] },
  { id: 'NL', iso3: 'NLD', name: 'Netherlands', flag: '🇳🇱', category: 'eu27', centroid: [5.29, 52.13] },
  { id: 'PL', iso3: 'POL', name: 'Poland', flag: '🇵🇱', category: 'eu27', centroid: [19.14, 51.91] },
  { id: 'PT', iso3: 'PRT', name: 'Portugal', flag: '🇵🇹', category: 'eu27', centroid: [-8.22, 39.39] },
  { id: 'RO', iso3: 'ROU', name: 'Romania', flag: '🇷🇴', category: 'eu27', centroid: [24.96, 45.94] },
  { id: 'SK', iso3: 'SVK', name: 'Slovakia', flag: '🇸🇰', category: 'eu27', centroid: [19.69, 48.66] },
  { id: 'SI', iso3: 'SVN', name: 'Slovenia', flag: '🇸🇮', category: 'eu27', centroid: [14.99, 46.15] },
  { id: 'ES', iso3: 'ESP', name: 'Spain', flag: '🇪🇸', category: 'eu27', centroid: [-3.74, 40.46] },
  { id: 'SE', iso3: 'SWE', name: 'Sweden', flag: '🇸🇪', category: 'eu27', centroid: [18.64, 60.12] },

  // --- Horizon Europe Associated Countries ---
  { id: 'AL', iso3: 'ALB', name: 'Albania', flag: '🇦🇱', category: 'associated', centroid: [20.16, 41.15] },
  { id: 'AM', iso3: 'ARM', name: 'Armenia', flag: '🇦🇲', category: 'associated', centroid: [45.03, 40.06] },
  { id: 'BA', iso3: 'BIH', name: 'Bosnia & Herzegovina', flag: '🇧🇦', category: 'associated', centroid: [17.67, 43.91] },
  { id: 'FO', iso3: 'FRO', name: 'Faroe Islands', flag: '🇫🇴', category: 'associated', centroid: [-6.91, 61.89] },
  { id: 'GE', iso3: 'GEO', name: 'Georgia', flag: '🇬🇪', category: 'associated', centroid: [43.35, 42.31] },
  { id: 'IS', iso3: 'ISL', name: 'Iceland', flag: '🇮🇸', category: 'associated', centroid: [-19.02, 64.96] },
  { id: 'IL', iso3: 'ISR', name: 'Israel', flag: '🇮🇱', category: 'associated', centroid: [34.85, 31.04] },
  { id: 'XK', iso3: 'XKX', name: 'Kosovo', flag: '🇽🇰', category: 'associated', centroid: [20.90, 42.60] },
  { id: 'MD', iso3: 'MDA', name: 'Moldova', flag: '🇲🇩', category: 'associated', centroid: [28.36, 47.41] },
  { id: 'ME', iso3: 'MNE', name: 'Montenegro', flag: '🇲🇪', category: 'associated', centroid: [19.26, 42.70] },
  { id: 'MK', iso3: 'MKD', name: 'North Macedonia', flag: '🇲🇰', category: 'associated', centroid: [21.74, 41.60] },
  { id: 'NO', iso3: 'NOR', name: 'Norway', flag: '🇳🇴', category: 'associated', centroid: [8.46, 60.47] },
  { id: 'RS', iso3: 'SRB', name: 'Serbia', flag: '🇷🇸', category: 'associated', centroid: [21.00, 44.01] },
  { id: 'TN', iso3: 'TUN', name: 'Tunisia', flag: '🇹🇳', category: 'associated', centroid: [9.53, 33.88] },
  { id: 'TR', iso3: 'TUR', name: 'Türkiye', flag: '🇹🇷', category: 'associated', centroid: [35.24, 38.96] },
  { id: 'UA', iso3: 'UKR', name: 'Ukraine', flag: '🇺🇦', category: 'associated', centroid: [31.16, 48.37] },
  { id: 'GB', iso3: 'GBR', name: 'United Kingdom', flag: '🇬🇧', category: 'associated', centroid: [-3.43, 55.37] },
  { id: 'CH', iso3: 'CHE', name: 'Switzerland', flag: '🇨🇭', category: 'associated', centroid: [8.22, 46.81] },

  // --- Distant Associated & Third Countries (Trigger Inset Boxes) ---
  { id: 'CA', iso3: 'CAN', name: 'Canada', flag: '🇨🇦', category: 'associated', isDistant: true, centroid: [-106.34, 56.13] },
  { id: 'NZ', iso3: 'NZL', name: 'New Zealand', flag: '🇳🇿', category: 'associated', isDistant: true, centroid: [174.88, -40.90] },
  { id: 'KR', iso3: 'KOR', name: 'South Korea', flag: '🇰🇷', category: 'associated', isDistant: true, centroid: [127.76, 35.90] },
  { id: 'US', iso3: 'USA', name: 'United States', flag: '🇺🇸', category: 'third', isDistant: true, centroid: [-95.71, 37.09] },
  { id: 'JP', iso3: 'JPN', name: 'Japan', flag: '🇯🇵', category: 'third', isDistant: true, centroid: [138.25, 36.20] },
  { id: 'AU', iso3: 'AUS', name: 'Australia', flag: '🇦🇺', category: 'third', isDistant: true, centroid: [133.77, -25.27] },
  { id: 'BR', iso3: 'BRA', name: 'Brazil', flag: '🇧🇷', category: 'third', isDistant: true, centroid: [-51.92, -14.23] },
  { id: 'IN', iso3: 'IND', name: 'India', flag: '🇮🇳', category: 'third', isDistant: true, centroid: [78.96, 20.59] },
  { id: 'ZA', iso3: 'ZAF', name: 'South Africa', flag: '🇿🇦', category: 'third', isDistant: true, centroid: [22.93, -30.55] }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HORIZON_ROLES, HORIZON_COUNTRIES };
}
