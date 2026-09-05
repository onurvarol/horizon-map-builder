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
      
      // Position card: use saved custom offset or default centroid percentage
      if (state && state.customOffset) {
        card.style.left = state.customOffset.left;
        card.style.top = state.customOffset.top;
        card.style.transform = 'none';
      } else {
        card.style.left = `${leftPct}%`;
        card.style.top = `${topPct}%`;
        card.style.transform = 'translate(-50%, -100%)';
      }
      
      let rowsHTML = '';
      instList.forEach(inst => {
        const logoHTML = inst.logoData 
          ? `<img src="${inst.logoData}" class="stack-logo-thumb" onerror="this.onerror=null; this.style.display='none';">` 
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
          <span><span class="drag-handle-icon" title="Drag to reposition">⋮⋮</span> ${countryObj.flag} ${countryObj.name}</span>
          ${countBadge}
        </div>
        ${rowsHTML}
      `;
      
      // Make partner badge card draggable
      this.makeElementDraggable(card, (left, top) => {
        if (!this.countryState[countryId]) this.countryState[countryId] = { selected: true };
        this.countryState[countryId].customOffset = { left, top };
      });
      
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
      
      if (state && state.customOffset) {
        card.style.position = 'absolute';
        card.style.left = state.customOffset.left;
        card.style.top = state.customOffset.top;
        card.style.transform = 'none';
      }
      
      // Get institutions for this country
      const instList = this.logoManager ? this.logoManager.getInstitutionsForCountry(country.id) : [];
      let instBadgeHTML = '';
      
      if (instList.length > 0) {
        instBadgeHTML = `<div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">`;
        instList.forEach(inst => {
          instBadgeHTML += `
            <div style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.9); padding:3px 6px; border-radius:4px; color:#0f172a; font-size:0.72rem; font-weight:700;">
              ${inst.logoData ? `<img src="${inst.logoData}" class="inset-logo-thumb" onerror="this.onerror=null; this.style.display='none';">` : '🏫'}
              <span>${inst.acronym || inst.name}</span>
            </div>
          `;
        });
        instBadgeHTML += `</div>`;
      }
      
      card.innerHTML = `
        <div class="inset-card-header">
          <div class="inset-flag-name">
            <span class="drag-handle-icon" title="Drag to reposition">⋮⋮</span>
            <span>${country.flag}</span>
            <span>${country.name}</span>
          </div>
          <span style="font-size: 0.68rem; color: ${fillColor}; font-weight: 700;">${country.id}</span>
        </div>
        <div class="inset-mini-canvas" title="Click to zoom in on ${country.name}">
          <svg viewBox="${insetData.viewBox}">
            <path d="${insetData.path}" fill="${fillColor}" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" />
          </svg>
          <div class="inset-zoom-badge">🔍 Zoom In</div>
        </div>
        ${instBadgeHTML}
      `;

      // Handle clicking mini-canvas for zoom modal
      const miniCanvas = card.querySelector('.inset-mini-canvas');
      if (miniCanvas) {
        miniCanvas.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onDistantCountryClickCallback) {
            this.onDistantCountryClickCallback(country.id);
          }
        });
      }

      // Make inset card draggable
      this.makeElementDraggable(card, (left, top) => {
        if (!this.countryState[country.id]) this.countryState[country.id] = { selected: true };
        this.countryState[country.id].customOffset = { left, top };
      });
      
      this.insetContainer.appendChild(card);
    });
  }

  /**
   * Helper method to make DOM elements draggable relative to their container
   */
  makeElementDraggable(element, onDragEndCallback, onClickCallback) {
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;
    let isDragging = false;
    let hasMoved = false;

    const dragHandle = element.querySelector('.drag-handle-icon') || 
                       element.querySelector('.stack-badge-header') || 
                       element.querySelector('.inset-card-header') || 
                       element.querySelector('.legend-title') || 
                       element;

    dragHandle.style.cursor = 'grab';

    const onMouseDown = (e) => {
      if (e.target.closest('button, select, input, a, .inset-mini-canvas')) {
        return;
      }

      isDragging = true;
      hasMoved = false;
      startX = e.clientX || (e.touches && e.touches[0].clientX);
      startY = e.clientY || (e.touches && e.touches[0].clientY);

      const parentEl = element.offsetParent || document.body;
      const parentRect = parentEl.getBoundingClientRect();
      const rect = element.getBoundingClientRect();

      initialLeft = rect.left - parentRect.left;
      initialTop = rect.top - parentRect.top;

      element.style.position = 'absolute';
      element.style.left = `${initialLeft}px`;
      element.style.top = `${initialTop}px`;
      element.style.transform = 'none';
      element.style.zIndex = '100';
      element.classList.add('is-dragging');
      dragHandle.style.cursor = 'grabbing';

      const onMouseMove = (moveEvt) => {
        if (!isDragging) return;

        const currentX = moveEvt.clientX || (moveEvt.touches && moveEvt.touches[0].clientX);
        const currentY = moveEvt.clientY || (moveEvt.touches && moveEvt.touches[0].clientY);

        const dx = currentX - startX;
        const dy = currentY - startY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasMoved = true;
          if (moveEvt.preventDefault) moveEvt.preventDefault();
        }

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        newLeft = Math.max(0, Math.min(newLeft, parentRect.width - rect.width));
        newTop = Math.max(0, Math.min(newTop, parentRect.height - rect.height));

        const leftPct = ((newLeft / parentRect.width) * 100).toFixed(2);
        const topPct = ((newTop / parentRect.height) * 100).toFixed(2);

        element.style.left = `${leftPct}%`;
        element.style.top = `${topPct}%`;
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        element.classList.remove('is-dragging');
        dragHandle.style.cursor = 'grab';

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onMouseMove);
        window.removeEventListener('touchend', onMouseUp);

        if (hasMoved) {
          if (onDragEndCallback) {
            onDragEndCallback(element.style.left, element.style.top);
          }
        } else {
          if (onClickCallback) {
            onClickCallback();
          }
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove, { passive: false });
      window.addEventListener('touchend', onMouseUp);
    };

    dragHandle.addEventListener('mousedown', onMouseDown);
    dragHandle.addEventListener('touchstart', onMouseDown, { passive: true });
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
    
    let html = `<div class="legend-title"><span class="drag-handle-icon" title="Drag to reposition">⋮⋮</span> Project Legend (${totalSelected} Countries)</div>`;
    
    if (rolesInUse.size === 0) {
      html += `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">No countries selected yet. Select countries from the sidebar.</div>`;
    } else {
      rolesInUse.forEach(roleId => {
        const role = this.activeRoles[roleId] || HORIZON_ROLES[roleId];
        if (!role) return;
        const count = Object.values(this.countryState).filter(s => s.selected && s.roleId === roleId).length;
        html += `
          <div class="legend-item">
            <div class="legend-col-icon">
              <div class="legend-color-swatch" style="background-color: ${role.color};"></div>
            </div>
            <div class="legend-col-text">${role.label}</div>
            <div class="legend-col-count">${count}</div>
          </div>
        `;
      });
      
      // Render Partner Institutions in Legend
      if (this.logoManager && this.logoManager.institutions.length > 0) {
        html += `<div class="legend-title" style="margin-top: 8px;">Partner Institutions</div>`;
        html += `<div class="legend-inst-list">`;
        this.logoManager.institutions.forEach(inst => {
          const logoHTML = inst.logoData 
            ? `<img src="${inst.logoData}" class="legend-logo-thumb" onerror="this.onerror=null; this.style.display='none';">` 
            : `<span style="font-size: 16px;">🏫</span>`;
            
          html += `
            <div class="legend-inst-row">
              <div class="legend-col-logo">${logoHTML}</div>
              <div class="legend-col-details">
                <div class="legend-inst-acronym">${inst.acronym} <span class="legend-inst-country">(${inst.countryId})</span></div>
                <div class="legend-inst-fullname" title="${inst.name}">${inst.name}</div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }
    }
    
    this.legend.innerHTML = html;

    // Make legend card draggable
    this.makeElementDraggable(this.legend);
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
            ${inst.logoData ? `<img src="${inst.logoData}" class="tooltip-logo-thumb" onerror="this.onerror=null; this.style.display='none';">` : '🏫'}
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
