/**
 * Horizon Europe Project Map Builder - Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Engines
  const mapEngine = new MapEngine('map-svg', 'map-tooltip', 'map-legend', 'inset-boxes-container');
  const logoManager = new LogoManager();
  const exportEngine = new ExportEngine('map-stage-viewport');

  // Attach logo manager to map engine
  mapEngine.logoManager = logoManager;

  // UI Element References
  const searchInput = document.getElementById('country-search-input');
  const countryListContainer = document.getElementById('country-list-container');
  const categoryFilterChips = document.querySelectorAll('.filter-chips .chip-btn');
  const instCountrySelect = document.getElementById('inst-country-select');
  const instItemsContainer = document.getElementById('institution-items-container');
  
  let currentCategoryFilter = 'all';
  let searchQuery = '';

  // 1. Populate Country Dropdowns
  function populateCountryDropdowns() {
    const editInstCountrySelect = document.getElementById('edit-inst-country-select');
    [instCountrySelect, editInstCountrySelect].forEach(selectEl => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      HORIZON_COUNTRIES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.flag} ${c.name} (${c.id})`;
        selectEl.appendChild(opt);
      });
    });
  }

  // 2. Render Country List Items in Sidebar
  function renderCountryList() {
    if (!countryListContainer) return;
    countryListContainer.innerHTML = '';
    
    HORIZON_COUNTRIES.forEach(country => {
      // Filter logic
      if (currentCategoryFilter !== 'all') {
        if (currentCategoryFilter === 'selected') {
          const st = mapEngine.countryState[country.id];
          if (!st || !st.selected) return;
        } else if (country.category !== currentCategoryFilter) {
          return;
        }
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = country.name.toLowerCase().includes(query);
        const matchId = country.id.toLowerCase().includes(query);
        if (!matchName && !matchId) return;
      }
      
      const st = mapEngine.countryState[country.id] || { selected: false, roleId: 'BENEFICIARY' };
      
      const item = document.createElement('div');
      item.className = `country-item ${st.selected ? 'selected' : ''}`;
      item.id = `sidebar-item-${country.id}`;
      
      const categoryBadge = country.category === 'eu27' ? 'EU27' : (country.category === 'associated' ? 'Assoc' : 'Third');
      
      item.innerHTML = `
        <div class="country-info">
          <input type="checkbox" class="country-checkbox" data-id="${country.id}" ${st.selected ? 'checked' : ''}>
          <span class="country-flag">${country.flag}</span>
          <span class="country-name">${country.name}</span>
          <span class="country-category-tag">${categoryBadge}</span>
          ${country.isDistant ? '<span title="Renders as Inset Card" style="font-size: 11px;">📦</span>' : ''}
        </div>
        <select class="country-role-select" data-id="${country.id}" ${!st.selected ? 'disabled' : ''}>
          <option value="COORDINATOR" ${st.roleId === 'COORDINATOR' ? 'selected' : ''}>Coord</option>
          <option value="BENEFICIARY" ${st.roleId === 'BENEFICIARY' ? 'selected' : ''}>Partner</option>
          <option value="ASSOCIATED" ${st.roleId === 'ASSOCIATED' ? 'selected' : ''}>Assoc</option>
        </select>
      `;
      
      // Checkbox listener
      const checkbox = item.querySelector('.country-checkbox');
      const roleSelect = item.querySelector('.country-role-select');
      
      checkbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        roleSelect.disabled = !isChecked;
        mapEngine.updateCountryState(country.id, isChecked, roleSelect.value);
        item.classList.toggle('selected', isChecked);
        updateHeaderStats();
      });
      
      roleSelect.addEventListener('change', (e) => {
        if (checkbox.checked) {
          mapEngine.updateCountryState(country.id, true, e.target.value);
        }
      });
      
      countryListContainer.appendChild(item);
    });
  }

  // Synchronize country click on SVG map with sidebar list
  mapEngine.onCountryClickCallback = (countryId) => {
    const st = mapEngine.countryState[countryId] || { selected: false, roleId: 'BENEFICIARY' };
    const newSelected = !st.selected;
    mapEngine.updateCountryState(countryId, newSelected, st.roleId);
    
    // Update sidebar UI
    const item = document.getElementById(`sidebar-item-${countryId}`);
    if (item) {
      const checkbox = item.querySelector('.country-checkbox');
      const roleSelect = item.querySelector('.country-role-select');
      if (checkbox) checkbox.checked = newSelected;
      if (roleSelect) roleSelect.disabled = !newSelected;
      item.classList.toggle('selected', newSelected);
    }
    updateHeaderStats();
  };

  // 2b. Distant Country Zoom Detail Modal Logic
  const distantZoomModal = document.getElementById('distant-zoom-modal');
  const distantModalClose = document.getElementById('distant-modal-close');

  if (distantModalClose && distantZoomModal) {
    distantModalClose.addEventListener('click', () => {
      distantZoomModal.style.display = 'none';
    });
    distantZoomModal.addEventListener('click', (e) => {
      if (e.target === distantZoomModal) {
        distantZoomModal.style.display = 'none';
      }
    });
  }

  function openDistantCountryZoomModal(countryId) {
    const countryObj = HORIZON_COUNTRIES.find(c => c.id === countryId);
    if (!countryObj || !distantZoomModal) return;

    const state = mapEngine.countryState[countryId] || { selected: true, roleId: 'BENEFICIARY' };
    const role = mapEngine.activeRoles[state.roleId] || HORIZON_ROLES.BENEFICIARY;
    const fillColor = state.customColor || role.color;
    const insetData = DISTANT_INSET_SVG[countryId];

    document.getElementById('distant-modal-flag').innerText = countryObj.flag;
    document.getElementById('distant-modal-country-name').innerText = countryObj.name;
    document.getElementById('distant-modal-code-tag').innerText = countryObj.id;

    // Render zoomed SVG
    const canvasContainer = document.getElementById('distant-zoom-canvas-container');
    if (canvasContainer && insetData) {
      canvasContainer.innerHTML = `
        <svg viewBox="${insetData.viewBox}">
          <path d="${insetData.path}" fill="${fillColor}" stroke="rgba(255,255,255,0.6)" stroke-width="1.2" />
        </svg>
      `;
    }

    // Render body details
    const bodyEl = document.getElementById('distant-modal-body');
    if (bodyEl) {
      const instList = logoManager.getInstitutionsForCountry(countryId);
      let instHTML = '';
      if (instList.length > 0) {
        instHTML = `
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-top: 6px;">Partner Institutions (${instList.length}):</div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
        `;
        instList.forEach(inst => {
          instHTML += `
            <div style="display: flex; align-items: center; gap: 8px; background: var(--bg-primary); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
              ${inst.logoData ? `<img src="${inst.logoData}" style="width: 22px; height: 22px; object-fit: contain; border-radius: 50%; background: #fff; padding: 2px;">` : '🏫'}
              <div style="flex: 1;">
                <div style="font-size: 0.82rem; font-weight: 700;">${inst.acronym}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">${inst.name}</div>
              </div>
            </div>
          `;
        });
        instHTML += `</div>`;
      } else {
        instHTML = `<div style="font-size: 0.78rem; color: var(--text-muted); font-style: italic; margin-top: 4px;">No partner institutions added yet for ${countryObj.name}.</div>`;
      }

      bodyEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-primary); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color);">
          <span style="font-size: 0.82rem; font-weight: 600;">Consortium Role:</span>
          <span style="font-size: 0.82rem; font-weight: 700; color: ${fillColor}; padding: 3px 8px; background: rgba(255,255,255,0.06); border-radius: 4px;">${role.label}</span>
        </div>
        ${instHTML}
      `;
    }

    distantZoomModal.style.display = 'flex';
  }

  mapEngine.onDistantCountryClickCallback = (countryId) => {
    openDistantCountryZoomModal(countryId);
  };

  /**
   * Compress and resize uploaded logo files using an offscreen Canvas
   * to keep JSON configuration sizes small (~20-40KB) and prevent config bloat.
   */
  function processLogoFile(file, maxWidth = 300, maxHeight = 300) {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(e.target.result); // Fallback to raw data URL
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // 3. Render Institution List in Sidebar Tab 3
  function renderInstitutionList() {
    if (!instItemsContainer) return;
    instItemsContainer.innerHTML = '';
    
    if (logoManager.institutions.length === 0) {
      instItemsContainer.innerHTML = `<div style="font-size: 0.78rem; color: var(--text-muted); padding: 8px;">No partner institutions added yet. Use the form above to add your first institution.</div>`;
      return;
    }
    
    logoManager.institutions.forEach(inst => {
      const countryObj = HORIZON_COUNTRIES.find(c => c.id === inst.countryId) || { flag: '', name: inst.countryId };
      const card = document.createElement('div');
      card.className = 'institution-item';
      
      const logoHTML = inst.logoData 
        ? `<img src="${inst.logoData}" class="logo-preview-thumb">`
        : `<div class="logo-preview-thumb" style="display:flex; align-items:center; justify-content:center; color:#0f172a; font-weight:bold; font-size:11px;">${inst.acronym.substring(0,3)}</div>`;
        
      card.innerHTML = `
        ${logoHTML}
        <div class="institution-details">
          <div class="inst-name">${inst.name}</div>
          <div class="inst-country">${countryObj.flag} ${countryObj.name} (${inst.acronym})</div>
        </div>
        <div style="display: flex; gap: 4px; align-items: center;">
          <button class="btn-xs btn-edit-inst" data-id="${inst.id}" title="Edit Institution" style="padding: 4px 6px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); cursor: pointer;">✏️</button>
          <button class="btn-xs btn-remove-inst" data-id="${inst.id}" title="Remove Institution" style="padding: 4px 6px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; color: var(--accent-rose); cursor: pointer;">🗑️</button>
        </div>
      `;
      
      card.querySelector('.btn-edit-inst').addEventListener('click', () => {
        openEditInstitutionModal(inst.id);
      });

      card.querySelector('.btn-remove-inst').addEventListener('click', () => {
        logoManager.removeInstitution(inst.id);
      });
      
      instItemsContainer.appendChild(card);
    });
  }

  // Subscribe logo manager updates to map re-render
  logoManager.onUpdateCallback = () => {
    renderInstitutionList();
    mapEngine.renderLogoPins();
    mapEngine.renderInsetBoxes();
    mapEngine.updateLegend();
  };

  // Edit Institution Modal Logic
  const editInstModal = document.getElementById('edit-inst-modal');
  const editInstModalClose = document.getElementById('edit-inst-modal-close');
  const btnCancelEditInst = document.getElementById('btn-cancel-edit-inst');
  const btnSaveEditInst = document.getElementById('btn-save-edit-inst');
  let currentEditingLogoData = null;

  function openEditInstitutionModal(instId) {
    const inst = logoManager.getInstitution(instId);
    if (!inst || !editInstModal) return;

    document.getElementById('edit-inst-id').value = inst.id;
    document.getElementById('edit-inst-name-input').value = inst.name;
    document.getElementById('edit-inst-acronym-input').value = inst.acronym;
    
    const countrySelect = document.getElementById('edit-inst-country-select');
    if (countrySelect) countrySelect.value = inst.countryId;

    document.getElementById('edit-inst-logo-file').value = '';
    document.getElementById('edit-inst-logo-url').value = '';
    currentEditingLogoData = inst.logoData;

    renderEditLogoPreview();
    editInstModal.style.display = 'flex';
  }

  function renderEditLogoPreview() {
    const previewContainer = document.getElementById('edit-inst-logo-preview');
    if (!previewContainer) return;

    if (currentEditingLogoData) {
      previewContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${currentEditingLogoData}" style="width: 28px; height: 28px; object-fit: contain; border-radius: 4px; background: #fff; padding: 2px;">
          <span style="font-size: 0.75rem; color: var(--text-primary);">Logo attached</span>
        </div>
        <button type="button" id="btn-remove-edit-logo" style="padding: 2px 6px; font-size: 0.72rem; color: var(--accent-rose); background: transparent; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">Remove Logo</button>
      `;
      document.getElementById('btn-remove-edit-logo')?.addEventListener('click', () => {
        currentEditingLogoData = null;
        renderEditLogoPreview();
      });
    } else {
      previewContainer.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">No logo attached (acronym avatar will be used)</span>`;
    }
  }

  function closeEditInstitutionModal() {
    if (editInstModal) editInstModal.style.display = 'none';
  }

  if (editInstModalClose) editInstModalClose.addEventListener('click', closeEditInstitutionModal);
  if (btnCancelEditInst) btnCancelEditInst.addEventListener('click', closeEditInstitutionModal);

  if (btnSaveEditInst) {
    btnSaveEditInst.addEventListener('click', async () => {
      const instId = document.getElementById('edit-inst-id').value;
      const name = document.getElementById('edit-inst-name-input').value.trim();
      const acronym = document.getElementById('edit-inst-acronym-input').value.trim();
      const countryId = document.getElementById('edit-inst-country-select').value;
      const fileInput = document.getElementById('edit-inst-logo-file');
      const urlInput = document.getElementById('edit-inst-logo-url').value.trim();

      if (!name) {
        alert('Please enter an institution name.');
        return;
      }

      let logoData = currentEditingLogoData;

      if (fileInput.files && fileInput.files[0]) {
        logoData = await processLogoFile(fileInput.files[0]);
      } else if (urlInput) {
        logoData = urlInput;
      }

      logoManager.updateInstitution(instId, {
        name,
        acronym: acronym || name.substring(0, 5).toUpperCase(),
        countryId,
        logoData
      });

      // Ensure country is selected on the map
      mapEngine.updateCountryState(countryId, true, 'BENEFICIARY');
      renderCountryList();
      updateHeaderStats();

      closeEditInstitutionModal();
    });
  }

  // 4. Add Institution Form Submission
  const btnAddInst = document.getElementById('btn-add-inst');
  if (btnAddInst) {
    btnAddInst.addEventListener('click', async () => {
      const nameInput = document.getElementById('inst-name-input');
      const acronymInput = document.getElementById('inst-acronym-input');
      const countrySelect = document.getElementById('inst-country-select');
      const fileInput = document.getElementById('inst-logo-file');
      const urlInput = document.getElementById('inst-logo-url');
      
      const name = nameInput.value.trim();
      const acronym = acronymInput.value.trim() || (name ? name.substring(0, 5).toUpperCase() : 'INST');
      const countryId = countrySelect.value;
      
      if (!name) {
        alert('Please enter an institution name.');
        return;
      }
      
      // Auto-select the country on the map
      mapEngine.updateCountryState(countryId, true, 'BENEFICIARY');
      renderCountryList();
      updateHeaderStats();
      
      let logoData = urlInput.value.trim() || null;
      if (fileInput.files && fileInput.files[0]) {
        logoData = await processLogoFile(fileInput.files[0]);
      }
      
      logoManager.addInstitution(name, acronym, countryId, logoData);
      
      // Clear inputs
      nameInput.value = '';
      acronymInput.value = '';
      fileInput.value = '';
      urlInput.value = '';
    });
  }

  // 5. Search & Filter Handlers
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderCountryList();
    });
  }

  categoryFilterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      categoryFilterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategoryFilter = chip.getAttribute('data-filter');
      renderCountryList();
    });
  });

  // Quick Action Buttons
  document.getElementById('btn-select-eu27')?.addEventListener('click', () => {
    HORIZON_COUNTRIES.filter(c => c.category === 'eu27').forEach(c => {
      mapEngine.updateCountryState(c.id, true, 'BENEFICIARY');
    });
    renderCountryList();
    updateHeaderStats();
  });

  document.getElementById('btn-select-assoc')?.addEventListener('click', () => {
    HORIZON_COUNTRIES.filter(c => c.category === 'associated').forEach(c => {
      mapEngine.updateCountryState(c.id, true, 'ASSOCIATED');
    });
    renderCountryList();
    updateHeaderStats();
  });

  document.getElementById('btn-clear-all')?.addEventListener('click', () => {
    HORIZON_COUNTRIES.forEach(c => {
      mapEngine.updateCountryState(c.id, false);
    });
    renderCountryList();
    updateHeaderStats();
  });

  // Tab Switching
  const tabBtns = document.querySelectorAll('.sidebar-nav-tabs .tab-btn');
  const tabPanes = document.querySelectorAll('.tab-content-container .tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`tab-pane-${targetTab}`)?.classList.add('active');
    });
  });

  // Role Color Pickers
  document.querySelectorAll('.color-picker-input').forEach(picker => {
    picker.addEventListener('input', (e) => {
      const roleId = picker.getAttribute('data-role');
      const hexInput = document.getElementById(`hex-input-${roleId}`);
      if (hexInput) hexInput.value = e.target.value.toUpperCase();
      
      if (HORIZON_ROLES[roleId]) {
        HORIZON_ROLES[roleId].color = e.target.value;
        mapEngine.activeRoles[roleId].color = e.target.value;
      }
      
      Object.keys(mapEngine.countryState).forEach(cId => {
        const st = mapEngine.countryState[cId];
        if (st.selected && st.roleId === roleId) {
          mapEngine.updateCountryState(cId, true, roleId);
        }
      });
    });
  });

  // Header Stats Updater
  function updateHeaderStats() {
    let totalCount = 0;
    let euCount = 0;
    let assocCount = 0;
    
    Object.keys(mapEngine.countryState).forEach(cId => {
      const st = mapEngine.countryState[cId];
      if (st.selected) {
        totalCount++;
        const cObj = HORIZON_COUNTRIES.find(c => c.id === cId);
        if (cObj) {
          if (cObj.category === 'eu27') euCount++;
          else if (cObj.category === 'associated') assocCount++;
        }
      }
    });
    
    const countEl = document.getElementById('header-country-count');
    if (countEl) countEl.innerText = `${totalCount} Countries (${euCount} EU / ${assocCount} Assoc)`;
  }

  // Export & Config Actions
  function saveProjectConfig() {
    const acronym = document.getElementById('project-acronym-input')?.value || 'horizon';
    const state = {
      acronym: document.getElementById('project-acronym-input')?.value,
      title: document.getElementById('project-title-input')?.value,
      countryState: mapEngine.countryState,
      roles: mapEngine.activeRoles,
      institutions: logoManager.institutions
    };
    exportEngine.exportJSON(state, `${acronym}_map_config.json`);
  }

  document.getElementById('btn-export-png')?.addEventListener('click', () => {
    const scale = parseInt(document.getElementById('export-scale-select')?.value || '2');
    const acronym = document.getElementById('project-acronym-input')?.value || 'horizon';
    exportEngine.exportPNG(scale, `${acronym}_consortium_map.png`);
  });

  document.getElementById('btn-export-png-tab')?.addEventListener('click', () => {
    const scale = parseInt(document.getElementById('export-scale-select')?.value || '2');
    const acronym = document.getElementById('project-acronym-input')?.value || 'horizon';
    exportEngine.exportPNG(scale, `${acronym}_consortium_map.png`);
  });

  document.getElementById('btn-save-json')?.addEventListener('click', saveProjectConfig);
  document.getElementById('btn-save-json-tab')?.addEventListener('click', saveProjectConfig);

  // Load Config JSON Logic
  const configFileFileInput = document.getElementById('config-file-input');

  function triggerLoadConfig() {
    if (configFileFileInput) {
      configFileFileInput.click();
    }
  }

  document.getElementById('btn-load-json')?.addEventListener('click', triggerLoadConfig);
  document.getElementById('btn-load-json-tab')?.addEventListener('click', triggerLoadConfig);

  configFileFileInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // 1. Restore Project Metadata
        if (data.acronym !== undefined) {
          const acrInput = document.getElementById('project-acronym-input');
          if (acrInput) acrInput.value = data.acronym;
        }
        if (data.title !== undefined) {
          const titleInput = document.getElementById('project-title-input');
          if (titleInput) titleInput.value = data.title;
        }

        // 2. Restore Roles & Colors
        if (data.roles) {
          Object.keys(data.roles).forEach(rId => {
            if (HORIZON_ROLES[rId]) {
              HORIZON_ROLES[rId].color = data.roles[rId].color;
              if (data.roles[rId].label) HORIZON_ROLES[rId].label = data.roles[rId].label;
            }
            if (mapEngine.activeRoles[rId]) {
              mapEngine.activeRoles[rId].color = data.roles[rId].color;
              if (data.roles[rId].label) mapEngine.activeRoles[rId].label = data.roles[rId].label;
            }
            // Update color pickers & hex inputs
            const hexInput = document.getElementById(`hex-input-${rId}`);
            if (hexInput) hexInput.value = data.roles[rId].color.toUpperCase();
            const colorPicker = document.querySelector(`.color-picker-input[data-role="${rId}"]`);
            if (colorPicker) colorPicker.value = data.roles[rId].color;
          });
        }

        // 3. Restore Partner Institutions & Logos
        if (Array.isArray(data.institutions)) {
          logoManager.institutions = data.institutions;
        }

        // 4. Restore Country Selections
        if (data.countryState) {
          mapEngine.countryState = {};
          HORIZON_COUNTRIES.forEach(c => {
            const p = document.getElementById(`country-path-${c.id}`);
            if (p) {
              p.style.fill = 'var(--country-default)';
              p.classList.remove('participating');
            }
          });
          
          Object.keys(data.countryState).forEach(cId => {
            const st = data.countryState[cId];
            mapEngine.updateCountryState(cId, st.selected, st.roleId, st.customColor);
          });
        }

        // Re-render UI
        renderCountryList();
        renderInstitutionList();
        mapEngine.renderLogoPins();
        mapEngine.renderInsetBoxes();
        mapEngine.updateLegend();
        updateHeaderStats();

        configFileFileInput.value = '';

      } catch (err) {
        alert('Failed to parse configuration JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // Toolbar actions
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => mapEngine.zoom(0.85));
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => mapEngine.zoom(1.15));
  document.getElementById('btn-reset-view')?.addEventListener('click', () => mapEngine.resetZoom());

  // Dark/Light Theme Toggle (Default to Light Theme)
  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    const initialTheme = document.body.getAttribute('data-theme') || 'light';
    themeBtn.innerText = initialTheme === 'dark' ? '🌙' : '☀️';

    themeBtn.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', newTheme);
      themeBtn.innerText = newTheme === 'dark' ? '🌙' : '☀️';
    });
  }

  // Initial renders
  populateCountryDropdowns();
  // Activate default institution in Sabancı University, TR
  mapEngine.updateCountryState('TR', true, 'COORDINATOR');
  renderCountryList();
  renderInstitutionList();
  updateHeaderStats();
});
