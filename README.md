# 🌍 ALLwebGIS: 2D & 3D WebGIS 综合应用平台

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![OpenLayers](https://img.shields.io/badge/OpenLayers-10.9-1F6B75?logo=openlayers&logoColor=white)](https://openlayers.org/)
[![Cesium](https://img.shields.io/badge/Cesium-1.141-6BEF7E?logo=cesium&logoColor=white)](https://cesium.com/)

[🇨🇳 中文版 (Chinese)](./README_zh.md) | [🇬🇧 English (English)](./README_en.md)

这是一个现代化、高性能的 WebGIS 综合应用平台。基于 **Vite** 构建，将 **OpenLayers** (二维空间渲染与分析) 与 **Cesium** (三维数字地球) 无缝整合在同一个前端项目中，展示了卓越的空间数据处理、可视化渲染与多维度地图交互能力。

---

## ✨ 核心功能与亮点

### 🗺️ 二维地图引擎 (OpenLayers)
- **多源底图秒级切换**: 支持无缝切换 OpenStreetMap、高德 (矢量/卫星)、天地图 (矢量/卫星) 以及百度地图。
- **2D-3D & WebGL 视图联动**: 实现了 OpenLayers 核心视图与百度 WebGL 地图的相机参数同步与联动逻辑。
- **原生空间交互**: 
  - 📏 量算工具: 内置原生折线绘制 (测距) 与多边形绘制 (测面) 功能。
  - 📝 自定义标注: 用户在地图上点击即可生成带有气泡样式的自定义文本注记。
- **高级路线动画**: 支持在用户绘制的线段上，通过坐标系插值算法模拟无人机沿线飞行效果。
- **高德 POI 智能搜索**: 接入高德 Web 服务 API，实现地名搜索、坐标解析及地图精准定位飞入。

### 🌐 三维数字地球 (Cesium)
- **丰富的 3D 基础底图**: 可视化叠加 Bing 地图、OSM、天地图、高德、Mapbox 以及单张图片作为基础地表。
- **高精度真实地形**: 支持加载量化网格 (quantized-mesh) 地形数据，真实还原地貌起伏与海拔变化。
- **海量 3D 模型渲染**: 
  - 🏙️ **3D Tiles**: 流畅加载城市级别的宏大场景，例如武汉大学倾斜摄影实景三维模型，以及基于矢量拉伸的建筑白膜数据。
- **三维实体与漫游**: 在三维空间内放置交互式标签 (如定制化 LOGO 点位)，并在真实地形上执行基于插值路径的车辆行驶漫游动画。

### 🛰️ 空间数据接入与后端服务
- **纯前端数据解析**: 原生支持 `.geojson` 与 `.kml` 文件的解析、渲染以及相机自适应。
- **OGC 标准服务对接**: 与 **GeoServer** 深度集成，标准接入 WMS、WMTS (影像瓦片) 以及 WFS (矢量要素) 协议。
- **自定义 Python 后端**: 与基于 FastAPI 驱动的自研 Python 后端通信，动态拉取定制化的 WFS 矢量特征。
- **前沿瓦片技术**:
  - 📦 **MVT (Mapbox Vector Tiles)**: 高效加载与自定义渲染前端矢量切片。
  - 🖼️ **XYZ 栅格瓦片**: 规范化加载基于本地切图工具生成的 XYZ 标准瓦片树。

---

## 🛠️ 技术栈
- **前端工程化**: Vite
- **二维 GIS**: OpenLayers
- **三维 GIS**: CesiumJS (基于 `vite-plugin-cesium` 插件)
- **后端服务生态**: GeoServer (发布 OGC 服务), Python FastAPI (自定义微服务)
- **第三方 API**: 高德开放平台、天地图开放平台、百度地图开放平台

---

## 🚀 快速启动

### 环境要求
- [Node.js](https://nodejs.org/) (建议 v16 及以上)
- 运行中的 GeoServer (如需测试 OGC 服务功能)
- 运行中的 Python 后端服务 (如需测试自定义 WFS 功能)

### 安装与运行
1. **克隆代码库:**
   ```bash
   git clone https://github.com/ilucky666/ALLwebGIS.git
   cd ALLwebGIS
   ```

2. **安装依赖:**
   ```bash
   npm install
   ```

3. **启动开发服务器:**
   ```bash
   npm run dev
   ```

4. **构建生产版本:**
   ```bash
   npm run build
   ```

---

## 📂 数据与存储声明
为了保证代码库的轻量级和拉取速度，**本项目不包含任何大型空间数据**。
凡是体积较大的文件（如 `3dtiels_whu` 文件夹、`dixing` 文件夹、`.rvt` BIM 模型、`.shp` 矢量源文件以及 `.tif` 栅格影像）均已被 `.gitignore` 规则屏蔽。

**如需在本地完整体验相关功能：**
1. 请自行准备好相应的空间数据与三维模型。
2. 将数据放置于项目的 `public/` 目录下（例如：`public/3dtiels_whu/tileset.json`）。
3. 前端应用会在对应功能被勾选时，自动向相对路径发起请求并完成渲染。
