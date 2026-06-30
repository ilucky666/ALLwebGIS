# 🌍 ALLwebGIS: 2D & 3D WebGIS Integrated Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![OpenLayers](https://img.shields.io/badge/OpenLayers-10.9-1F6B75?logo=openlayers&logoColor=white)](https://openlayers.org/)
[![Cesium](https://img.shields.io/badge/Cesium-1.141-6BEF7E?logo=cesium&logoColor=white)](https://cesium.com/)

[🇨🇳 中文版 (Chinese)](./README_zh.md) | [🇬🇧 English (English)](./README_en.md)

A modern, high-performance WebGIS application that seamlessly integrates **OpenLayers** (for 2D spatial analysis) and **Cesium** (for 3D digital earth visualization) into a unified platform. Built with **Vite**, this project demonstrates robust spatial data processing, rendering, and interaction.

---

## ✨ Core Features & Capabilities

### 🗺️ 2D Mapping Engine (Powered by OpenLayers)
- **Seamless Basemap Switching**: Toggle dynamically between OpenStreetMap, Gaode (Vector/Satellite), Tianditu (Vector/Satellite), and Baidu Maps.
- **2D-3D & 2D-WebGL Sync**: Dual-screen linkage and view synchronization mechanism between OpenLayers and Baidu Map GL.
- **Native Spatial Interactions**: 
  - 📏 Draw & Measure: Native tools for distance (LineStrings) and area (Polygons) measurement.
  - 📝 Annotations: Click to add customizable text markers and popup overlays.
- **Advanced Animations**: Simulate drone flights over user-drawn routes using coordinate interpolation.
- **POI Search Integration**: Built-in Gaode Web Services API for geocoding, searching, and precise map targeting.

### 🌐 3D Digital Earth (Powered by Cesium)
- **Diverse 3D Basemaps**: Supports Bing Maps, OSM, Mapbox, Gaode, Tianditu, and single static image overlays.
- **Topographic Terrain**: Capable of loading quantized-mesh terrain models for authentic 3D elevations.
- **Massive 3D Data Rendering**: 
  - 🏙️ **3D Tiles**: Effortlessly loads large-scale photogrammetry (e.g., Wuhan University dataset) and untextured building models (white-models).
- **Dynamic 3D Entities**: Place custom billboard LOGOs or simulate moving vehicles traversing paths along the 3D terrain.

### 🛰️ Data Integration & Geoprocessing Services
- **Client-side Parsing**: Natively load and render `.geojson` and `.kml` files.
- **OGC Standards Compliance**: Flawless integration with **GeoServer** to consume WMS, WMTS (Imagery), and WFS (Vector) services.
- **Custom Python Backend**: Communicates with a custom FastAPI backend to fetch tailored WFS feature data dynamically.
- **Advanced Tiling Protocols**:
  - 📦 **MVT (Mapbox Vector Tiles)**: High-performance vector tile rendering.
  - 🖼️ **XYZ Raster Tiles**: Load locally generated raster tiles efficiently.

---

## 🛠️ Technology Stack
- **Frontend Build Tool**: Vite
- **2D WebGIS**: OpenLayers
- **3D WebGIS**: CesiumJS (via `vite-plugin-cesium`)
- **Backend Services**: GeoServer (OGC), Python FastAPI (Custom Services)
- **APIs**: Gaode Maps API, Tianditu API, Baidu Maps API

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- A running GeoServer instance (if testing OGC layers)
- A running Python backend (for custom WFS features)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/ilucky666/ALLwebGIS.git
   cd ALLwebGIS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📂 Data Disclaimer
To keep the repository lightweight, **no massive spatial data files are included**. 
Data such as 3D Tiles (`3dtiels_whu`), quantized-mesh terrain (`dixing`), `.rvt` models, massive `.shp` files, and `.tif` imagery have been intentionally `.gitignore`d. 

To use these features locally:
1. Prepare your spatial data.
2. Place them in the `public/` directory (e.g., `public/3dtiels_whu/tileset.json`).
3. The application will automatically route and load them upon feature activation.

---
*Crafted with ❤️ by the WebGIS Development Team.*
