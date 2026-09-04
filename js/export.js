/**
 * Horizon Europe Project Map Builder - Export Engine
 * Handles PNG rendering (1x, 2x, 4x), PDF export, and JSON project save/load.
 */

class ExportEngine {
  constructor(mapStageId) {
    this.mapStage = document.getElementById(mapStageId);
  }

  /**
   * Export the Map Stage (Canvas + Insets + Legend + Header) to PNG
   */
  async exportPNG(scale = 2, filename = 'horizon_europe_project_map.png') {
    if (!this.mapStage) return;
    
    try {
      // Use html2canvas if available on window, or canvas SVG fallback
      if (typeof html2canvas !== 'undefined') {
        const canvas = await html2canvas(this.mapStage, {
          scale: scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false
        });
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        // SVG Data URI fallback
        const svg = this.mapStage.querySelector('svg');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = svg.clientWidth * scale;
          canvas.height = svg.clientHeight * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const a = document.createElement('a');
          a.download = filename;
          a.href = canvas.toDataURL('image/png');
          a.click();
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    } catch (err) {
      console.error('PNG Export failed:', err);
      alert('Export failed. Please check browser permissions.');
    }
  }

  /**
   * Export Project Configuration to JSON File
   */
  exportJSON(projectState, filename = 'horizon_project_config.json') {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExportEngine };
}
