/**
 * Horizon Europe Project Map Builder - SVG Vector Map Engine
 * Handles real geographic boundaries, zoom/pan, hover tooltips, color fills, and Institution Logo Overlays
 */

class MapEngine {
  constructor(svgElementId, tooltipElementId, legendElementId, insetContainerId) {
    this.svg = document.getElementById(svgElementId);
    this.tooltip = document.getElementById(tooltipElementId);
    this.legend = document.getElementById(legendElementId);
    this.insetContainer = document.getElementById(insetContainerId);
    
    this.viewBox = { x: 0, y: 0, width: 1000, height: 800 };
    this.zoomScale = 1;
    this.isPanning = false;
    this.startPan = { x: 0, y: 0 };
    
    this.countryState = {}; // { 'DE': { selected: true, roleId: 'COORDINATOR', customColor: null } }
    this.activeRoles = { ...HORIZON_ROLES };
    this.logoManager = null; // Attached logo manager
    
    this.onCountryClickCallback = null;
    
    this.init();
  }

  init() {
    if (!this.svg) return;
    
    // Set ViewBox
    this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
    
    // Create base group elements
    this.mapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.mapGroup.setAttribute('id', 'main-map-group');
    this.svg.appendChild(this.mapGroup);
    
    this.logoPinsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.logoPinsGroup.setAttribute('id', 'logo-pins-group');
    this.svg.appendChild(this.logoPinsGroup);
    
    this.renderEuropeanMap();
    this.setupPanZoomEvents();
  }

  renderEuropeanMap() {
    this.mapGroup.innerHTML = '';
    
    Object.keys(EUROPE_COUNTRY_SVG).forEach(countryId => {
      const pathData = EUROPE_COUNTRY_SVG[countryId];
      if (!pathData) return;
      
      const countryObj = HORIZON_COUNTRIES.find(c => c.id === countryId) || { id: countryId, name: countryId, flag: '', category: 'third' };
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('id', `country-path-${countryId}`);
      path.setAttribute('class', 'country-path');
      path.setAttribute('data-id', countryId);
      path.setAttribute('data-name', countryObj.name);
      
      // Apply initial styling
      this.updateCountryStyle(path, countryId);
      
      // Event listeners
      path.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, countryObj));
      path.addEventListener('mouseleave', () => this.handleMouseLeave());
      path.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      path.addEventListener('click', () => {
        if (this.onCountryClickCallback) {
          this.onCountryClickCallback(countryId);
        }
      });
      
      this.mapGroup.appendChild(path);
    });
  }

  updateCountryState(countryId, isSelected, roleId = 'BENEFICIARY', customColor = null) {
    if (!this.countryState[countryId]) {
      this.countryState[countryId] = { selected: false, roleId: 'BENEFICIARY', customColor: null };
    }
    
    this.countryState[countryId].selected = isSelected;
    if (roleId) this.countryState[countryId].roleId = roleId;
    if (customColor !== undefined) this.countryState[countryId].customColor = customColor;
    
    // Update main map path if exists
    const path = document.getElementById(`country-path-${countryId}`);
    if (path) {
      this.updateCountryStyle(path, countryId);
    }
    
    // Re-render Inset Boxes, Logo Pins & Legend
    this.renderInsetBoxes();
    this.updateLegend();
    this.renderLogoPins();
  }

  updateCountryStyle(pathElement, countryId) {
    const state = this.countryState[countryId];
    if (state && state.selected) {
      const role = this.activeRoles[state.roleId] || HORIZON_ROLES.BENEFICIARY;
      const fillColor = state.customColor || role.color;
      pathElement.style.fill = fillColor;
      pathElement.classList.add('participating');
    } else {
      pathElement.style.fill = 'var(--country-default)';
      pathElement.classList.remove('participating');
    }
  }

  /**
   * Render Institution Logo Pins & Multi-Partner Stacks (HTML Overlay Layer for 100% PNG Export Fidelity)
   */
  renderLogoPins() {
    const overlayContainer = document.getElementById('logo-pins-overlay-container');
    if (!overlayContainer) return;
    overlayContainer.innerHTML = '';
    if (!this.logoManager) return;
    
    const institutions = this.logoManager.institutions;
    
    // Group institutions by countryId
    const countryInstMap = {};
    institutions.forEach(inst => {
      if (!countryInstMap[inst.countryId]) countryInstMap[inst.countryId] = [];
      countryInstMap[inst.countryId].push(inst);
    });
    
    Object.keys(countryInstMap).forEach(countryId => {
      const state = this.countryState[countryId];
      // Only render if country is selected/participating
      if (!state || !state.selected) return;
      
      const centroid = EUROPE_COUNTRY_CENTROIDS[countryId];
      if (!centroid) return; // Distant country is rendered in inset card
      
      const [cx, cy] = centroid;
      const instList = countryInstMap[countryId];
      const countryObj = HORIZON_COUNTRIES.find(c => c.id === countryId) || { flag: '', name: countryId };
      
      // Calculate percentage positions on 1000x800 viewBox
      const leftPct = (cx / 1000) * 100;
      const topPct = (cy / 800) * 100;
      
      const card = document.createElement('div');
      card.className = 'country-logo-stack-badge';
      card.style.left = `${leftPct}%`;
      card.style.top = `${topPct}%`;
      
      let rowsHTML = '';
      instList.forEach(inst => {
        const logoHTML = inst.logoData 
          ? `<img src="${inst.logoData}" class="stack-logo-thumb">` 
          : `<span style="font-size:12px;">🏫</span>`;
          
        rowsHTML += `
          <div class="stack-partner-row" title="${inst.name}">
            ${logoHTML}
            <span class="stack-partner-acronym">${inst.acronym}</span>
            <span class="stack-partner-name">${inst.name}</span>
          </div>
        `;
      });
      
      const countBadge = instList.length > 1 ? `<span style="color: var(--eu-gold); font-size: 0.68rem; font-weight:700;">(${instList.length})</span>` : '';
      
      card.innerHTML = `
        <div class="stack-badge-header">
          <span>${countryObj.flag} ${countryObj.name}</span>
          ${countBadge}
        </div>
        ${rowsHTML}
      `;
      
      overlayContainer.appendChild(card);
    });
  }

  /**
   * Render Distant Country Inset Box System (Picture-in-Picture)
   */
  renderInsetBoxes() {
    if (!this.insetContainer) return;
    this.insetContainer.innerHTML = '';
    
    HORIZON_COUNTRIES.forEach(country => {
      if (!country.isDistant) return;
      const state = this.countryState[country.id];
      if (!state || !state.selected) return; // Only show participating distant countries
      
      const role = this.activeRoles[state.roleId] || HORIZON_ROLES.BENEFICIARY;
      const fillColor = state.customColor || role.color;
      const insetData = DISTANT_INSET_SVG[country.id];
      if (!insetData) return;
      
      const card = document.createElement('div');
      card.className = 'inset-card';
      card.setAttribute('data-id', country.id);
      
      // Get institutions for this country
      const instList = this.logoManager ? this.logoManager.getInstitutionsForCountry(country.id) : [];
      let instBadgeHTML = '';
      
      if (instList.length > 0) {
        instBadgeHTML = `<div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">`;
        instList.forEach(inst => {
          instBadgeHTML += `
            <div style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.9); padding:3px 6px; border-radius:4px; color:#0f172a; font-size:0.72rem; font-weight:700;">
              ${inst.logoData ? `<img src="${inst.logoData}" style="width:14px; height:14px; object-fit:contain;">` : '🏫'}
              <span>${inst.acronym || inst.name}</span>
            </div>
          `;
        });
        instBadgeHTML += `</div>`;
      }
      
      card.innerHTML = `
        <div class="inset-card-header">
          <div class="inset-flag-name">
            <span>${country.flag}</span>
            <span>${country.name}</span>
          </div>
          <span style="font-size: 0.68rem; color: ${fillColor}; font-weight: 700;">${country.id}</span>
        </div>
        <div class="inset-mini-canvas">
          <svg viewBox="${insetData.viewBox}">
            <path d="${insetData.path}" fill="${fillColor}" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" />
          </svg>
        </div>
        ${instBadgeHTML}
      `;
      
      this.insetContainer.appendChild(card);
    });
  }

  /**
   * Update Dynamic Map Legend Card
   */
  updateLegend() {
    if (!this.legend) return;
    
    const rolesInUse = new Set();
    let totalSelected = 0;
    
    Object.keys(this.countryState).forEach(id => {
      const st = this.countryState[id];
      if (st.selected) {
        rolesInUse.add(st.roleId);
        totalSelected++;
      }
    });
    
    let html = `<div class="legend-title">Project Legend (${totalSelected} Countries)</div>`;
    
    if (rolesInUse.size === 0) {
      html += `<div style="font-size: 0.75rem; color: var(--text-muted);">No countries selected yet. Select countries from the sidebar.</div>`;
    } else {
      rolesInUse.forEach(roleId => {
        const role = this.activeRoles[roleId] || HORIZON_ROLES[roleId];
        if (!role) return;
        const count = Object.values(this.countryState).filter(s => s.selected && s.roleId === roleId).length;
        html += `
          <div class="legend-item">
            <div class="legend-color-swatch" style="background-color: ${role.color};"></div>
            <span style="flex: 1;">${role.label}</span>
            <span style="font-weight: 700; color: var(--text-muted);">${count}</span>
          </div>
        `;
      });
      
      // Render Partner Institutions in Legend
      if (this.logoManager && this.logoManager.institutions.length > 0) {
        html += `<div class="legend-title" style="margin-top: 8px;">Partner Institutions</div>`;
        this.logoManager.institutions.forEach(inst => {
          html += `
            <div class="legend-item">
              ${inst.logoData ? `<img src="${inst.logoData}" style="width:14px; height:14px; object-fit:contain; border-radius:50%; background:#fff;">` : '🏫'}
              <span style="flex:1; font-weight:600;">${inst.acronym} (${inst.countryId})</span>
            </div>
          `;
        });
      }
    }
    
    this.legend.innerHTML = html;
  }

  handleMouseEnter(event, country) {
    if (!this.tooltip) return;
    
    const state = this.countryState[country.id];
    let roleText = 'Not Selected';
    let roleColor = 'var(--text-muted)';
    
    if (state && state.selected) {
      const role = this.activeRoles[state.roleId] || HORIZON_ROLES.BENEFICIARY;
      roleText = role.label;
      roleColor = state.customColor || role.color;
    }
    
    const categoryName = country.category === 'eu27' ? 'EU Member State' : (country.category === 'associated' ? 'Associated Country' : 'Third Country');
    
    // Partner Institutions for this country
    const instList = this.logoManager ? this.logoManager.getInstitutionsForCountry(country.id) : [];
    let instHTML = '';
    if (instList.length > 0) {
      instHTML = `<div style="margin-top:4px; border-top:1px solid rgba(255,255,255,0.1); padding-top:4px;">`;
      instList.forEach(inst => {
        instHTML += `
          <div style="display:flex; align-items:center; gap:6px; font-size:0.72rem; color:#f8fafc;">
            ${inst.logoData ? `<img src="${inst.logoData}" style="width:12px; height:12px; object-fit:contain;">` : '🏫'}
            <span>${inst.name} (${inst.acronym})</span>
          </div>
        `;
      });
      instHTML += `</div>`;
    }
    
    this.tooltip.innerHTML = `
      <div class="tooltip-title">
        <span>${country.flag}</span>
        <span>${country.name} (${country.id})</span>
      </div>
      <div style="font-size: 0.72rem; color: var(--text-muted);">${categoryName}</div>
      <div class="tooltip-role" style="color: ${roleColor}; font-weight: 600; margin-top: 2px;">
        ${roleText}
      </div>
      ${instHTML}
    `;
    
    this.tooltip.style.display = 'flex';
  }

  handleMouseMove(event) {
    if (!this.tooltip) return;
    const bounds = this.svg.getBoundingClientRect();
    const x = event.clientX - bounds.left + 15;
    const y = event.clientY - bounds.top + 15;
    
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  handleMouseLeave() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  setupPanZoomEvents() {
    this.svg.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('country-path')) return;
      this.isPanning = true;
      this.startPan = { x: e.clientX, y: e.clientY };
    });
    
    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      const dx = (e.clientX - this.startPan.x) * (this.viewBox.width / this.svg.clientWidth);
      const dy = (e.clientY - this.startPan.y) * (this.viewBox.height / this.svg.clientHeight);
      
      this.viewBox.x -= dx;
      this.viewBox.y -= dy;
      this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
      
      this.startPan = { x: e.clientX, y: e.clientY };
    });
    
    window.addEventListener('mouseup', () => {
      this.isPanning = false;
    });
    
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
      this.zoom(zoomFactor);
    }, { passive: false });
  }

  zoom(factor) {
    const newWidth = this.viewBox.width * factor;
    const newHeight = this.viewBox.height * factor;
    
    if (newWidth < 300 || newWidth > 3000) return;
    
    this.viewBox.x += (this.viewBox.width - newWidth) / 2;
    this.viewBox.y += (this.viewBox.height - newHeight) / 2;
    this.viewBox.width = newWidth;
    this.viewBox.height = newHeight;
    
    this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
  }

  resetZoom() {
    this.viewBox = { x: 0, y: 0, width: 1000, height: 800 };
    this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MapEngine };
}
