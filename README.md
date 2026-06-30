# 2D/3D WebGIS Application (ALLwebGIS)

A comprehensive WebGIS application integrating 2D mapping (OpenLayers) and 3D globe visualization (Cesium) into a single unified platform. 

## Key Features & Components

### 1. 2D Mapping (OpenLayers)
The 2D aspect of the application uses OpenLayers for high-performance map rendering and analysis.
- **Multi-Source Basemaps**: Easily switch between OpenStreetMap, Gaode (Vector/Satellite), Tianditu (Vector/Satellite), and Baidu Maps. Includes a synchronization mechanism between OpenLayers and Baidu Map GL.
- **Controls**: Includes interactive `MousePosition` and `OverviewMap` controls for better navigation context.
- **Drawing & Measurement**: Native tools for drawing LineStrings (measuring distance) and Polygons (measuring area) on the map.
- **Custom Annotations**: Add text markers at clicked locations with a custom styled overlay.
- **Drone Simulation**: Animate a simulated drone flight along a user-drawn LineString.
- **Search (Gaode POI)**: Search for places using Gaode Web API.

### 2. 3D Globe (Cesium)
The 3D aspect provides a rich, immersive digital earth experience using Cesium.
- **3D Basemaps**: Toggle between Bing Maps, OSM, Tianditu, Gaode, Mapbox, and custom single-image overlays.
- **Terrain & Elevations**: Supports loading quantized-mesh terrain for accurate 3D elevations.
- **3D Tiles (Tilt Photography & BIM)**: Supports loading massive 3D models like the Wuhan University tilt-photography dataset and building white-models.
- **Dynamic Entities**: Place 3D labels (e.g., custom LOGO marks) and simulate vehicle routing on the 3D terrain.

### 3. Data Integration & Services
- **Local Spatial Data**: Parse and display GeoJSON and KML files directly in both 2D and 3D views.
- **GeoServer OGC Services**: Connects to GeoServer instances to retrieve imagery (WMS, WMTS) and vector data (WFS).
- **Python Custom APIs**: Interacts with a Python backend (FastAPI) to fetch WFS features dynamically.
- **Tile Formats**: Supports loading vector tiles (Mapbox Vector Tiles / MVT) and raster tiles (XYZ format).

## Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   *Note: Ensure the Python backend and GeoServer (if configured) are running to utilize all data integration features.*

## Disclaimer
Data sets (3D Tiles, terrain, RVT, GeoJSON, etc.) are excluded from this repository due to size limitations. You must supply your own spatial data in the `public/` directory.
