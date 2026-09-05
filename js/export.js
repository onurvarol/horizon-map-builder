/**
 * Horizon Europe Project Map Builder - Export Engine
 * Handles PNG rendering (1x, 2x, 4x), PDF export, and JSON project save/load.
 */

class ExportEngine {
  constructor(mapStageId) {
    this.mapStage = document.getElementById(mapStageId);
  }

  /**
   * Helper to convert SVG text to PNG Data URI
   */
  static svgToPngDataUrl(svgText, targetWidth = 400, targetHeight = 400) {
    return new Promise((resolve) => {
      try {
        let text = svgText;
        // Inject width and height if missing on root <svg> tag
        const hasWidth = /<svg[^>]*\bwidth\s*=/i.test(text);
        const hasHeight = /<svg[^>]*\bheight\s*=/i.test(text);

        if (!hasWidth || !hasHeight) {
          const match = text.match(/viewBox=[\"']\s*([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s*[\"']/i);
          if (match) {
            const w = parseFloat(match[3]) || targetWidth;
            const h = parseFloat(match[4]) || targetHeight;
            text = text.replace(/<svg/i, `<svg width="${w}" height="${h}"`);
          } else {
            text = text.replace(/<svg/i, `<svg width="${targetWidth}" height="${targetHeight}"`);
          }
        }

        const svgBlob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
        const blobUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const w = img.naturalWidth || targetWidth;
            const h = img.naturalHeight || targetHeight;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(blobUrl);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            URL.revokeObjectURL(blobUrl);
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(svgBlob);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          resolve(null);
        };
        img.src = blobUrl;
      } catch (e) {
        resolve(null);
      }
    });
  }

  /**
   * Helper to generate a clean vector emblem SVG Data URI when remote logo URL is unreachable via CORS
   */
  static generateEmblemDataUrl(acronym = 'INST', name = 'Partner') {
    const text = (acronym || name || 'INST').substring(0, 5).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" rx="100" fill="#1e293b" stroke="#38bdf8" stroke-width="8"/>
      <text x="100" y="118" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="bold" font-size="52" fill="#ffffff" text-anchor="middle">${text}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /**
   * Helper to convert an image URL or relative path to Base64 Data URI
   */
  static async imageUrlToBase64(url, timeoutMs = 3000, fallbackAcronym = 'INST') {
    if (!url || typeof url !== 'string') {
      return ExportEngine.generateEmblemDataUrl(fallbackAcronym);
    }
    if (url.startsWith('data:')) return url;

    const timeoutPromise = new Promise((res) => setTimeout(() => res(null), timeoutMs));

    const convertPromise = (async () => {
      // SVG data URI handling
      if (url.startsWith('data:image/svg+xml')) {
        try {
          const svgContent = atob(url.split(',')[1] || '') || decodeURIComponent(url.split(',')[1] || '');
          const pngB64 = await ExportEngine.svgToPngDataUrl(svgContent);
          if (pngB64) return pngB64;
        } catch (e) {}
      }

      let blob = null;

      // 1. Direct fetch
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 1500) : null;
        const res = await fetch(url, controller ? { signal: controller.signal } : {});
        if (timer) clearTimeout(timer);
        if (res.ok) {
          blob = await res.blob();
        }
      } catch (e) {}

      // 2. Proxy fetch if direct fetch failed
      if (!blob || blob.size === 0) {
        const proxies = [
          (u) => `https://images.weserv.nl/?url=${encodeURIComponent(u)}&output=png`,
          (u) => `https://images.weserv.nl/?url=${encodeURIComponent(u)}`,
          (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
          (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
          (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
        ];

        for (const proxyFn of proxies) {
          try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timer = controller ? setTimeout(() => controller.abort(), 2000) : null;
            const proxyUrl = proxyFn(url);
            const res = await fetch(proxyUrl, controller ? { signal: controller.signal } : {});
            if (timer) clearTimeout(timer);
            if (res.ok) {
              blob = await res.blob();
              if (blob && blob.size > 0) break;
            }
          } catch (e) {}
        }
      }

      // 3. Direct Image + Canvas fallback if fetch unavailable
      if (!blob || blob.size === 0) {
        try {
          const b64 = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width || 100;
                canvas.height = img.naturalHeight || img.height || 100;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              } catch (e) {
                resolve(null);
              }
            };
            img.onerror = () => resolve(null);
            img.src = url;
          });
          if (b64 && b64.startsWith('data:')) return b64;
        } catch (e) {}

        return null;
      }

      // Check if blob is SVG -> convert to PNG Data URI
      const isSvg = blob.type.includes('svg') || url.toLowerCase().includes('.svg');
      if (isSvg) {
        try {
          const text = await blob.text();
          const pngB64 = await ExportEngine.svgToPngDataUrl(text);
          if (pngB64) return pngB64;
        } catch (e) {}
      }

      // Convert PNG/JPG blob to Data URI via FileReader
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    })();

    const result = await Promise.race([convertPromise, timeoutPromise]);
    if (result && typeof result === 'string' && result.startsWith('data:')) {
      return result;
    }
    return ExportEngine.generateEmblemDataUrl(fallbackAcronym);
  }

  /**
   * Export the Map Stage (Canvas + Insets + Legend + Header) to PNG
   */
  async exportPNG(scale = 2, filename = 'horizon_europe_project_map.png') {
    if (!this.mapStage) return;
    
    try {
      // 1. Convert all institution logoData in logoManager to Base64 Data URIs
      if (this.logoManager && Array.isArray(this.logoManager.institutions)) {
        await Promise.all(this.logoManager.institutions.map(async (inst) => {
          if (inst.logoData && !inst.logoData.startsWith('data:')) {
            try {
              const b64 = await ExportEngine.imageUrlToBase64(inst.logoData, 3500, inst.acronym);
              if (b64 && b64.startsWith('data:')) {
                inst.logoData = b64;
              }
            } catch (e) {}
          }
        }));

        // Re-render pins, inset boxes, and legend with converted Base64 logoData
        if (this.mapEngine) {
          this.mapEngine.renderLogoPins();
          this.mapEngine.renderInsetBoxes();
          this.mapEngine.updateLegend();
        }
      }

      // 2. Pre-process stage images: convert remaining URLs/paths to Base64 Data URIs
      const imgElements = Array.from(this.mapStage.querySelectorAll('img'));
      await Promise.all(imgElements.map(async (img) => {
        if (img.src && !img.src.startsWith('data:image/png') && !img.src.startsWith('data:image/jpeg')) {
          try {
            const base64 = await ExportEngine.imageUrlToBase64(img.src, 2500);
            if (base64 && base64.startsWith('data:')) {
              img.src = base64;
            }
          } catch (e) {}
        }
        if (!img.complete) {
          await new Promise((res) => {
            const timer = setTimeout(res, 800);
            img.onload = () => { clearTimeout(timer); res(); };
            img.onerror = () => { clearTimeout(timer); res(); };
          });
        }
        if (img.decode) {
          await img.decode().catch(() => {});
        }
      }));

      let dataUrl = null;

      // Primary Export Engine: htmlToImage (Browser Native foreignObject DOM Screenshot)
      if (typeof htmlToImage !== 'undefined' && htmlToImage.toPng) {
        try {
          dataUrl = await htmlToImage.toPng(this.mapStage, {
            pixelRatio: scale,
            cacheBust: false,
            filter: (node) => {
              // Exclude controls marked with data-html2canvas-ignore
              return !(node.dataset && node.dataset.html2canvasIgnore === 'true');
            }
          });
        } catch (errA) {
          console.warn('htmlToImage export failed, falling back to html2canvas:', errA);
        }
      }

      // Secondary Fallback Engine: html2canvas
      if (!dataUrl && typeof html2canvas !== 'undefined') {
        const liveStage = this.mapStage;
        const stageRect = liveStage.getBoundingClientRect();
        const liveImgs = Array.from(liveStage.querySelectorAll('img'));
        const liveBadges = Array.from(liveStage.querySelectorAll('.country-logo-stack-badge, .inset-card, .map-legend-card'));

        const canvas = await html2canvas(this.mapStage, {
          scale: scale,
          useCORS: true,
          allowTaint: false,
          backgroundColor: null,
          logging: false,
          imageTimeout: 3000,
          onclone: (clonedDoc) => {
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(el => {
              if (el.style) {
                if (el.style.backdropFilter) el.style.backdropFilter = 'none';
                if (el.style.webkitBackdropFilter) el.style.webkitBackdropFilter = 'none';
              }
            });

            const clonedBadges = Array.from(clonedDoc.querySelectorAll('.country-logo-stack-badge, .inset-card, .map-legend-card'));
            clonedBadges.forEach((clonedBadge, idx) => {
              const liveBadge = liveBadges[idx];
              if (liveBadge && stageRect.width > 0) {
                const bRect = liveBadge.getBoundingClientRect();
                const relLeft = bRect.left - stageRect.left;
                const relTop = bRect.top - stageRect.top;

                clonedBadge.style.position = 'absolute';
                clonedBadge.style.left = relLeft + 'px';
                clonedBadge.style.top = relTop + 'px';
                clonedBadge.style.transform = 'none';
                clonedBadge.style.width = Math.ceil(bRect.width) + 'px';
              }
            });

            const clonedImgs = Array.from(clonedDoc.querySelectorAll('img'));
            clonedImgs.forEach((clonedImg, idx) => {
              const liveImg = liveImgs[idx];
              if (liveImg) {
                const rect = liveImg.getBoundingClientRect();
                const w = Math.ceil(rect.width) || liveImg.offsetWidth || liveImg.naturalWidth || 32;
                const h = Math.ceil(rect.height) || liveImg.offsetHeight || liveImg.naturalHeight || 32;

                clonedImg.style.width = w + 'px';
                clonedImg.style.height = h + 'px';
                clonedImg.style.maxWidth = 'none';
                clonedImg.style.maxHeight = 'none';
                clonedImg.setAttribute('width', w);
                clonedImg.setAttribute('height', h);
              }
              clonedImg.style.display = 'inline-block';
              clonedImg.style.opacity = '1';
              clonedImg.style.visibility = 'visible';
            });
          }
        });
        dataUrl = canvas.toDataURL('image/png');
      }

      if (dataUrl) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        alert('PNG Export failed. Please try taking a screenshot or saving project JSON.');
      }
    } catch (err) {
      console.error('PNG Export failed:', err);
      alert('Export failed: ' + (err.message || err));
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
