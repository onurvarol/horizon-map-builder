/**
 * Partner Institution & Logo Management System
 * Manages partner logos (File upload Base64 or Image URL), acronyms, country assignments, and map badge styling
 */

class LogoManager {
  constructor() {
    this.institutions = [
      // Pre-populated default example institution for immediate visual feedback
      {
        id: 'inst-default-1',
        name: 'Technical University of Munich',
        acronym: 'TUM',
        countryId: 'DE',
        logoData: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Logo_of_the_Technical_University_of_Munich.svg',
        badgeStyle: 'circle'
      }
    ];
    this.onUpdateCallback = null;
  }

  addInstitution(name, acronym, countryId, logoData, badgeStyle = 'circle') {
    const newInst = {
      id: 'inst-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: name || 'Partner Institution',
      acronym: acronym || (name ? name.substring(0, 5).toUpperCase() : 'INST'),
      countryId: countryId || 'DE',
      logoData: logoData || null,
      badgeStyle: badgeStyle // 'circle' | 'pill' | 'card' | 'transparent'
    };
    
    this.institutions.push(newInst);
    if (this.onUpdateCallback) this.onUpdateCallback(this.institutions);
    return newInst;
  }

  removeInstitution(instId) {
    this.institutions = this.institutions.filter(i => i.id !== instId);
    if (this.onUpdateCallback) this.onUpdateCallback(this.institutions);
  }

  getInstitutionsForCountry(countryId) {
    return this.institutions.filter(i => i.countryId === countryId);
  }

  clear() {
    this.institutions = [];
    if (this.onUpdateCallback) this.onUpdateCallback(this.institutions);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LogoManager };
}
