# 🇪🇺 Horizon Europe Project Map Builder

A modern, standalone interactive web application designed to generate, customize, and export high-resolution consortium maps for **Horizon Europe** project proposals, grant applications, and dissemination reports.

---

## 🎯 Project Goals

- **Visual Impact**: Deliver publication-ready, visually stunning maps highlighting project partner countries and institutions.
- **Granular Customization**: Enable role-based color coding, individual country overrides, institution logo callouts, and dynamic legend generation.
- **Zero Server Dependency**: 100% client-side standalone web application (HTML5, Vanilla CSS, JS/SVG canvas) ensuring maximum privacy and offline capability.

---

## 🗺️ Horizon Europe Country Master List

The map includes pre-configured presets for all eligible country categories under Horizon Europe:

### 1. EU Member States (27 Countries)
`Austria (AT)`, `Belgium (BE)`, `Bulgaria (BG)`, `Croatia (HR)`, `Cyprus (CY)`, `Czechia (CZ)`, `Denmark (DK)`, `Estonia (EE)`, `Finland (FI)`, `France (FR)`, `Germany (DE)`, `Greece (GR)`, `Hungary (HU)`, `Ireland (IE)`, `Italy (IT)`, `Latvia (LV)`, `Lithuania (LT)`, `Luxembourg (LU)`, `Malta (MT)`, `Netherlands (NL)`, `Poland (PL)`, `Portugal (PT)`, `Romania (RO)`, `Slovakia (SK)`, `Slovenia (SI)`, `Spain (ES)`, `Sweden (SE)`

### 2. Associated Countries (Horizon Europe Framework)
`Albania (AL)`, `Armenia (AM)`, `Bosnia and Herzegovina (BA)`, `Faroe Islands (FO)`, `Georgia (GE)`, `Iceland (IS)`, `Israel (IL)`, `Kosovo (XK)`, `Moldova (MD)`, `Montenegro (ME)`, `North Macedonia (MK)`, `Norway (NO)`, `Serbia (RS)`, `Tunisia (TN)`, `Turkey (TR)`, `Ukraine (UA)`, `United Kingdom (GB)`, `New Zealand (NZ - Pillar II)`, `Canada (CA - Pillar II)`, `South Korea (KR - Pillar II)`

### 3. Non-Associated / Third Countries
Option to enable and highlight global partner countries participating with custom co-funding or specific call eligibility.

---

## 🔥 Key Features

### 1. Interactive SVG / GeoJSON Map Rendering & Inset Boxes
- **Focused European Projection**: High-precision vector projection focused optimal zoom on Europe and Mediterranean associated countries.
- 📦 **Distant Country Inset Boxes (Picture-in-Picture Callouts)**:
  - For geographically distant participating countries (e.g. Canada, New Zealand, South Korea, French Outermost Regions / Overseas Territories), the map avoids zooming out to the entire globe.
  - Automatically or manually generates stylized **Inset Cards** placed around the map border (e.g. bottom-right / top-left corners).
  - Each inset box displays the isolated country's boundary outline, role color fill, country code/flag, partner count, and institution logo callouts.
- Hover tooltips showing country name, participation status, partner institutions, and logo previews.
- Instant search & fast filtering (filter by EU27, Associated, Selected, or role).

### 2. Role & Color Customization Engine
- **Role presets**:
  - 👑 **Project Coordinator** (e.g., Deep Royal Indigo `#3B82F6`)
  - 🤝 **Beneficiary / Full Partner** (e.g., Emerald Teal `#10B981`)
  - ⚡ **Work Package Leader** (e.g., Amber Gold `#F59E0B`)
  - 🔗 **Associated Partner** (e.g., Purple Violet `#8B5CF6`)
  - 🌐 **Third Country Partner** (e.g., Rose Crimson `#EF4444`)
- **Color Pickers**: Modern visual color wheel, hex input `#HEX`, RGB values, and opacity sliders.
- **Custom Themes**: EU Official Navy & Gold, Clean Academic Minimal, Dark Neon Cyber, Monochrome Print.

### 3. Institution Logo Overlay System
- **Logo Sources**:
  - Local Image Upload (`PNG`, `JPG`, `SVG`, `WebP`) converted to base64 Data URLs.
  - Remote Image URL input with fallback handling.
- **Logo Badge Styles**:
  - Circular badge, rounded card, floating pill, or clean transparent outline.
  - Custom border color, shadow intensity, and scale adjustment (S, M, L, XL).
- **Positioning Engine**:
  - Automatic geographic centroid anchoring.
  - Drag-and-drop manual repositioning with smart leader lines / callout arrows.

### 4. Dynamic Header & Map Legend
- **Project Header Banner**: Title, Acronym, Call ID (e.g. `HORIZON-CL4-2026-DATA-01`), Grant Agreement ID.
- **Consortium Stats**: Partner count pill, Country count indicator, EU vs Non-EU distribution.
- **Interactive Legend**: Auto-updates based on active roles, colors, and embedded logos. Customizable position (Top-Right, Bottom-Left, Floating, Hidden).

### 5. High-Resolution Export & Import
- 📸 **PNG Export**: 1x (Web), 2x (HD), 4x (Print-ready 300 DPI Ultra HD).
- 📄 **PDF Export**: Single-page document output formatted for grant proposals.
- 💾 **Project Serialization**: Save current map configuration to `.json` file and reload anytime.

---

## 🎨 UI/UX Design System

- **Glassmorphism Aesthetic**: Translucent sidebar controls, glowing active toggles, polished dark/light mode toggle.
- **Micro-Animations**: Smooth selection pulses, crisp color pickers, animated state transitions.
- **Responsive Layout**: Dual pane (Control Drawer on left, Interactive Map Canvas on right).

---

## 🛠 Tech Stack

- **HTML5 & Vanilla CSS3**: Custom design tokens, CSS variables, flex/grid, glassmorphism.
- **JavaScript (ES6+)**: Modular application logic, SVG manipulation.
- **Visualization**: D3.js / TopoJSON or Leaflet SVG engine for crisp vector rendering.
- **Export Engines**: `html2canvas` / `dom-to-image-more` & `jsPDF` for pixel-perfect image/document export.
