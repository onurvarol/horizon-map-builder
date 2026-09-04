/**
 * Partner Institution & Logo Management System
 * Manages partner logos (File upload Base64 or Image URL), acronyms, country assignments, and map badge styling
 */

class LogoManager {
  constructor() {
    this.institutions = [
      {
        id: 'inst-default-su',
        name: 'Sabancı University',
        acronym: 'SU',
        countryId: 'TR',
        logoData: 'assets/sabanci-icon.jpg',
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

  updateInstitution(instId, updatedFields) {
    const inst = this.institutions.find(i => i.id === instId);
    if (!inst) return null;
    
    if (updatedFields.name !== undefined) inst.name = updatedFields.name;
    if (updatedFields.acronym !== undefined) inst.acronym = updatedFields.acronym;
    if (updatedFields.countryId !== undefined) inst.countryId = updatedFields.countryId;
    if (updatedFields.logoData !== undefined) inst.logoData = updatedFields.logoData;
    if (updatedFields.badgeStyle !== undefined) inst.badgeStyle = updatedFields.badgeStyle;
    
    if (this.onUpdateCallback) this.onUpdateCallback(this.institutions);
    return inst;
  }

  getInstitution(instId) {
    return this.institutions.find(i => i.id === instId) || null;
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
