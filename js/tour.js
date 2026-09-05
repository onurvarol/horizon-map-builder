/**
 * Horizon Europe Project Map Builder - Interactive Guided Tour (Driver.js)
 * Manages step-by-step onboarding walkthroughs with automatic tab switching.
 */

class ProjectTour {
  constructor() {
    this.driverObj = null;
  }

  /**
   * Helper to switch sidebar tab
   */
  static switchTab(tabId) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (btn) btn.click();
  }

  /**
   * Initialize Driver.js instance and configure tour steps
   */
  init() {
    if (typeof driver === 'undefined' || !driver.js || !driver.js.driver) {
      console.warn('Driver.js library is not loaded');
      return;
    }

    const driverFn = driver.js.driver;

    this.driverObj = driverFn({
      showProgress: true,
      animate: true,
      allowClose: true,
      doneBtnText: 'Finish Tour 🎉',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      steps: [
        {
          element: '.brand-section',
          popover: {
            title: '👋 Welcome to Horizon Map Builder',
            description: 'Easily design, customize, and export publication-ready consortium maps for your Horizon Europe research project proposals.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.project-inputs-header',
          popover: {
            title: '📝 Project Acronym & Call Title',
            description: 'Enter your proposal acronym (e.g. HORIZON-AI) and call ID. These update live on your map header banner and exported images.',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#country-list-container',
          popover: {
            title: '🌍 Country Selection & Filters',
            description: 'Toggle participating EU27, Associated, and Third Countries. Use quick buttons like "+ All EU27" or search by name.',
            side: 'right',
            align: 'start'
          },
          onHighlightStarted: () => ProjectTour.switchTab('countries')
        },
        {
          element: '#tab-pane-roles',
          popover: {
            title: '🎨 Consortium Roles & Custom Colors',
            description: 'Customize colors for Project Coordinators, Beneficiaries, and Associated Partners. Pick colors or enter exact HEX codes.',
            side: 'right',
            align: 'center'
          },
          onHighlightStarted: () => ProjectTour.switchTab('roles')
        },
        {
          element: '#tab-pane-institutions',
          popover: {
            title: '🏛️ Partner Institutions & Logo Badges',
            description: 'Add partner institutions, select their country, and upload logo images (or paste image URLs) to render map badge overlays.',
            side: 'right',
            align: 'center'
          },
          onHighlightStarted: () => ProjectTour.switchTab('institutions')
        },
        {
          element: '#map-stage-viewport',
          popover: {
            title: '📦 Vector Map Stage & Draggable Badges',
            description: 'Pan and zoom vector maps. Drag partner logo badges directly on the map to perfect your visual layout. Distant partners (Canada, NZ) render in callout boxes.',
            side: 'left',
            align: 'center'
          }
        },
        {
          element: '#tab-pane-export',
          popover: {
            title: '📸 High-Res PNG Export & JSON Project Save',
            description: 'Export 2,000px HD or 4,000px 300 DPI print-ready PNG images. Save or load complete project configurations as JSON files anytime.',
            side: 'right',
            align: 'center'
          },
          onHighlightStarted: () => ProjectTour.switchTab('export')
        }
      ]
    });
  }

  /**
   * Start the guided tour
   */
  start() {
    if (!this.driverObj) {
      this.init();
    }
    if (this.driverObj) {
      this.driverObj.drive();
    } else {
      alert('Tour guide engine could not be initialized.');
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProjectTour };
}
