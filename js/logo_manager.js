/**
 * Partner Institution & Logo Management System
 * Manages partner logos (File upload Base64 or Image URL), acronyms, country assignments, and map badge styling
 */

const SABANCI_LOGO_BASE64 = 'data:image/jpeg;base64,' +
  '/9j/4RRqRXhpZgAATU0AKgAAAAgABwESAAMAAAABAAEAAAEaAAUAAAABAAAAYgEbAAUAAAABAAAAagEoAAMAAAABAAIAAAExAAIAAAAhAAAAcgEyAAIAAAAUAAAAk4dpAAQAAAABAAAAqAAAANQACACYAAACcAAAAAJAAAh0b21pYwAAMjAyMTowODoyNiAxNDozMDozMQAAAYpAAB9AAAABikAAH0AAAAAQw3EAAAsEAAADcQAACwQAAEFkb2JlIFBob3Rvc2hvcCAyMS4wIChXaW5kb3dzKQANIMDDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/' +
  '9sAQwACAQECAQECAgICAgICAgMFAwMDAwMGBAQDBQIGBAIGCAQICAkKCwkLDgoICg4NDQwMDQ0NEBIQERANExENGAD/2wBDAQIICAkKCwkLDgoICg4NDQwMDQ0NEBIQERANExENGAD/wgARCAF4AYoDASIAAhEBAxEB/8QAGwABAQADAQEBAAAAAAAAAAAAAAECBAUDBgf/xAAaAQEAAwEBAQAAAAAAAAAAAAAAAQIGBAUD/9oADAMBAA2A2L/l2v59b/pGv79vL0v1/W/j9+Xf2+9x/V+b0b/6+n/AEb5f7Pz/wCL4fT4f+0/x7f5+d6fr2t0uv8AP+b37W7/ANX9vz3yfn9Pr19e/h7e3p6fV15/r/L8f3ef/f8Aw9P0uHw+Xz/935n7Pn07/f7+/R+p7eX8fv8AnHk9vv8Ajy+n+x8f59vL39PPy+nr8/u79vx7/mPn/vcf28f1eD6PZ8+3o3fJ2/Hl/t/jPz8v9/n8v2er8fz+vh/v8erl2+nv7/1/z/m/1fh0b3z9vx392r6er7Nf/EACYQAAIBAgUFAAMBAQAAAAAAAAECAAMEERIwITFBUBNQUSJicIH/2gAIAQEAAT8A/wCnlh0m0xG4TMIZ2jAieJv4Fz198Z/11/g17P0Yx+gT8XmI75Kz+A/8QAKREAAgEEAgECBwEBAAAAAAAAAQIAAxEQITEEEiAFEzBBUWFxIzL/2gAIAQIBAT8A/wCno9oXwZfyB63H0bXnZ218h91x837uWvP0u0o2FmN/e9p3t+8t21O0Ivl04lHjUqXF7z11t2g+61q/7p/f2LSl6gX/oT41v53/n9j+ytx6dVx0f7KtEp8m28vfxb2laq7g4Fv8AY1X4b910R834v3l7zvdL20v8+8vD2e9iL/8Ac0v9y7q/K1oWJ99R7sffqdr2/k7/AOHVte39nf8Ah1bXt8yv+e/Lp4f/xAAnEQACAgIBAgUFAAAAAAAAAAAAAQIDEQQSAAUhMRAiQVFhMmCBsf/aAAgBAwEBPwD+q4+pXQ3755p2670eR6iV33yvUTqfXLq33yt4/B12dvd1p9e6t+/e1/eN+2Wrf025t48nN236bU+36/d7v7NrfL934e6+fV2sP19nbf/9k=';

class LogoManager {
  constructor() {
    this.institutions = [
      {
        id: 'inst-default-su',
        name: 'Sabancı University',
        acronym: 'SU',
        countryId: 'TR',
        logoData: SABANCI_LOGO_BASE64,
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
