import './style.css'
import { initCesium } from './cesium_main.js'
import { Map, View } from 'ol'
import { Tile as TileLayer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer'
import { OSM, XYZ, TileWMS, WMTS, Vector as VectorSource, VectorTile as VectorTileSource } from 'ol/source'
import MVT from 'ol/format/MVT'
import { Point, LineString, Polygon } from 'ol/geom'
import Feature from 'ol/Feature'
import { fromLonLat, toLonLat, get as getProjection } from 'ol/proj'
import { getWidth, getTopLeft } from 'ol/extent'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { createXYZ } from 'ol/tilegrid'
import { Style, Icon, Stroke, Fill, Text, Circle as CircleStyle } from 'ol/style'
import GeoJSON from 'ol/format/GeoJSON'
import KML from 'ol/format/KML'
import { Draw, Modify, Snap } from 'ol/interaction'
import { getArea, getLength } from 'ol/sphere'
import { unByKey } from 'ol/Observable'
import Overlay from 'ol/Overlay'
import { getVectorContext } from 'ol/render'
import { OverviewMap, MousePosition, defaults as defaultControls } from 'ol/control'
import { createStringXY } from 'ol/coordinate'

document.querySelector('#app').innerHTML = `
  <div id="ol-map" class="map"></div>
  <div id="baidu-map" class="map hidden-map"></div>
  <div id="cesium-container" class="map hidden-map"></div>
  
  <div id="mouse-position" class="mouse-position"></div>
  <div id="popup" class="ol-popup">
    <a href="#" id="popup-closer" class="ol-popup-closer"></a>
    <div id="popup-content"></div>
  </div>

  <div class="view-toggle">
    <button id="toggle-2d3d">切换到 3D 视图</button>
  </div>

  <div class="tools-toolbar" id="toolbar-2d">
    <button id="tool-draw-line" title="测距/路线">测距路线</button>
    <button id="tool-draw-poly" title="测面积">测面积</button>
    <button id="tool-fly" title="无人机飞行">飞行</button>
    <button id="tool-annotate" title="添加标注">标注</button>
    <button id="tool-clear" title="清空">清空</button>
  </div>

  <div class="search-bar">
    <div class="search-box">
      <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      <input type="text" id="search-input" placeholder="搜索地点..." />
      <button id="search-btn">搜索</button>
    </div>
    <div id="poi-results" class="poi-results"></div>
  </div>
  
  <div class="layer-panel" id="panel-2d-layers">
    <h3>地图类型</h3>
    <ul class="layer-list">
      <li data-layer="osm" class="active">
        <span class="icon osm"></span>
        OpenStreetMap
      </li>
      <li data-layer="gaode-vector">
        <span class="icon gaode"></span>
        高德矢量
      </li>
      <li data-layer="gaode-satellite">
        <span class="icon gaode"></span>
        高德影像
      </li>
      <li data-layer="baidu-vector">
        <span class="icon baidu"></span>
        百度矢量
      </li>
      <li data-layer="baidu-satellite">
        <span class="icon baidu"></span>
        百度影像
      </li>
      <li data-layer="tianditu-vector">
        <span class="icon tianditu"></span>
        天地图矢量
      </li>
      <li data-layer="tianditu-satellite">
        <span class="icon tianditu"></span>
        天地图影像
      </li>
    </ul>
  </div>

  <div class="layer-panel hidden-panel" id="panel-3d-layers">
    <h3>三维底图 (3D)</h3>
    <ul class="layer-list">
      <li data-layer-3d="bing" class="active">Bing 地图</li>
      <li data-layer-3d="osm">OSM 影像</li>
      <li data-layer-3d="tianditu">天地图</li>
      <li data-layer-3d="gaode">高德地图</li>
      <li data-layer-3d="mapbox">MapBox 影像</li>
      <li data-layer-3d="single">单张图片底图</li>
    </ul>
  </div>
  
  <div class="local-data-panel" id="panel-2d-data1">
    <h3>本地数据</h3>
    <ul class="data-list">
      <li>
        <input type="checkbox" id="toggle-geojson" />
        <label for="toggle-geojson">GeoJSON 样本</label>
      </li>
      <li>
        <input type="checkbox" id="toggle-kml" />
        <label for="toggle-kml">KML 样本</label>
      </li>
    </ul>
  </div>
  
  <div class="geoserver-panel" id="panel-2d-data2">
    <h3>GeoServer 服务</h3>
    <ul class="data-list">
      <li>
        <input type="checkbox" id="toggle-data-wmts" />
        <label for="toggle-data-wmts">加载影像 data.tif (WMTS)</label>
      </li>
      <li>
        <input type="checkbox" id="toggle-wms" />
        <label for="toggle-wms">加载影像 data.tif (WMS)</label>
      </li>
      <li>
        <input type="checkbox" id="toggle-data-wfs" />
        <label for="toggle-data-wfs">加载影像 data.tif (WFS)</label>
      </li>
      <li>
        <input type="checkbox" id="toggle-wfs" />
        <label for="toggle-wfs">加载矢量 xian (WFS)</label>
      </li>
    </ul>
  </div>

  <div class="custom-panel" id="panel-2d-data3">
    <h3>Python 及瓦片加载</h3>
    <ul class="data-list">
      <li>
        <input type="checkbox" id="toggle-python-wfs" />
        <label for="toggle-python-wfs">加载 Python WFS</label>
      </li>
      <li>
        <input type="checkbox" id="toggle-mvt" />
        <label for="toggle-mvt">加载矢量瓦片 MVT</label>
      </li>
      <li>
        <input type="checkbox" id="toggle-xyz" />
        <label for="toggle-xyz">加载栅格瓦片 XYZ</label>
      </li>
    </ul>
  </div>

  <div class="geoserver-panel hidden-panel" id="panel-3d-data">
    <h3>三维数据加载</h3>
    <ul class="data-list">
      <li><input type="checkbox" id="toggle-3d-wms" /><label for="toggle-3d-wms">加载 WMS/WMTS/TMS</label></li>
      <li><input type="checkbox" id="toggle-3d-geojson" /><label for="toggle-3d-geojson">加载 GeoJSON</label></li>
      <li><input type="checkbox" id="toggle-3d-kml" /><label for="toggle-3d-kml">加载 KML</label></li>
      <li><input type="checkbox" id="toggle-3d-gltf" /><label for="toggle-3d-gltf">加载 BIM (glTF)</label></li>
      <li><input type="checkbox" id="toggle-3d-czml" /><label for="toggle-3d-czml">加载 CZML</label></li>
      <li><input type="checkbox" id="toggle-3d-terrain" /><label for="toggle-3d-terrain">加载地形数据</label></li>
      <li><input type="checkbox" id="toggle-3d-tiles-bldg" /><label for="toggle-3d-tiles-bldg">建筑白膜 (3D Tiles)</label></li>
      <li><input type="checkbox" id="toggle-3d-tiles-whu" /><label for="toggle-3d-tiles-whu">武大倾斜模型 (3D Tiles)</label></li>
      <li><input type="checkbox" id="toggle-3d-pointcloud" /><label for="toggle-3d-pointcloud">点云数据 (Point Cloud)</label></li>
      <li style="justify-content:space-between;">
        <button id="btn-3d-logo" style="padding:4px;cursor:pointer;">放置 LOGO</button>
        <button id="btn-3d-car" style="padding:4px;cursor:pointer;">漫游模拟</button>
      </li>
    </ul>
  </div>
`

const BAIDU_AK = 'UGKVH8VJQn0ZiftuqD8KoJHM3mP83tau'
const GAODE_WEB_KEY = 'ae50a01d06173d9f6c31361864e3353a'
const TIANDITU_KEY = 'af048f2a171ec76cca81e042035d6b81'
const EPSG3857 = 'EPSG:3857'

function createTiandituSource(layer, { useMercator = true } = {}) {
  const matrixSet = useMercator ? 'w' : 'c'
  const suffix = `${layer}_${matrixSet}`

  return new XYZ({
    url: `/proxy/tianditu/${suffix}/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=${matrixSet}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=tiles&tk=${TIANDITU_KEY}`,
    projection: EPSG3857,
    maxZoom: 18,
    tileUrlFunction: (tileCoord) => {
      if (!tileCoord) {
        return ''
      }

      const [z, x, y] = tileCoord
      return `/proxy/tianditu/${suffix}/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=${matrixSet}&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&FORMAT=tiles&tk=${TIANDITU_KEY}`
    }
  })
}

const map = new Map({
  target: 'ol-map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: fromLonLat([116.397428, 39.90923]),
    zoom: 12,
    projection: EPSG3857
  })
})

const gaodeVectorSource = new XYZ({
  url: '/proxy/gaode-vector?lang=zh_cn&size=1&scl=1&style=7&x={x}&y={y}&z={z}',
  projection: EPSG3857
})

const gaodeSatelliteSource = new XYZ({
  url: '/proxy/gaode-satellite?style=6&x={x}&y={y}&z={z}',
  projection: EPSG3857
})

const tiandituVectorSource = createTiandituSource('vec')

const tiandituSatelliteSource = createTiandituSource('img')

const mapSources = {
  osm: new OSM(),
  'gaode-vector': gaodeVectorSource,
  'gaode-satellite': gaodeSatelliteSource,
  'baidu-vector': null,
  'baidu-satellite': null,
  'tianditu-vector': tiandituVectorSource,
  'tianditu-satellite': tiandituSatelliteSource
}

let currentBaseLayer = 'osm'
let baiduMapInstance = null
let baiduApiPromise = null
let baiduPoiMarkers = []

function isBaiduLayer(sourceKey) {
  return sourceKey === 'baidu-vector' || sourceKey === 'baidu-satellite'
}

function getOlMapCenter() {
  const center = map.getView().getCenter()
  return center ? toLonLat(center) : [116.397428, 39.90923]
}

function getOlMapZoom() {
  return Math.max(3, Math.round(map.getView().getZoom() || 12))
}

function syncBaiduViewFromOl() {
  if (!baiduMapInstance) {
    return
  }

  const [lng, lat] = getOlMapCenter()
  baiduMapInstance.centerAndZoom(new window.BMapGL.Point(lng, lat), getOlMapZoom())
}

function syncOlViewFromBaidu() {
  if (!baiduMapInstance) {
    return
  }

  const center = baiduMapInstance.getCenter()
  map.getView().setCenter(fromLonLat([center.lng, center.lat]))
  map.getView().setZoom(baiduMapInstance.getZoom())
}

function updateMapContainerVisibility(sourceKey) {
  const olMapElement = document.getElementById('ol-map')
  const baiduMapElement = document.getElementById('baidu-map')

  if (isBaiduLayer(sourceKey)) {
    olMapElement.classList.add('hidden-map')
    baiduMapElement.classList.remove('hidden-map')
    return
  }

  baiduMapElement.classList.add('hidden-map')
  olMapElement.classList.remove('hidden-map')
  map.updateSize()
}

async function loadBaiduApi() {
  if (window.BMapGL?.Map) {
    return window.BMapGL
  }

  if (baiduApiPromise) {
    return baiduApiPromise
  }

  baiduApiPromise = new Promise((resolve, reject) => {
    window.initBaiduMapCallback = () => {
      resolve(window.BMapGL)
    }

    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${BAIDU_AK}&callback=initBaiduMapCallback`
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('百度 JS API 加载失败'))
    document.head.appendChild(script)
  })

  return baiduApiPromise
}

async function ensureBaiduMap() {
  const BMapGL = await loadBaiduApi()
  if (baiduMapInstance) {
    return baiduMapInstance
  }

  baiduMapInstance = new BMapGL.Map('baidu-map')
  const [lng, lat] = getOlMapCenter()
  baiduMapInstance.centerAndZoom(new BMapGL.Point(lng, lat), getOlMapZoom())
  baiduMapInstance.enableScrollWheelZoom(true)
  baiduMapInstance.setCurrentCity('北京市')
  return baiduMapInstance
}

async function switchToBaiduLayer(sourceKey) {
  const baiduMap = await ensureBaiduMap()
  syncBaiduViewFromOl()
  baiduMap.setMapType(
    sourceKey === 'baidu-satellite' ? window.BMAP_HYBRID_MAP : window.BMAP_NORMAL_MAP
  )
  updateMapContainerVisibility(sourceKey)
}

function clearBaiduPoiMarkers() {
  if (!baiduMapInstance) {
    return
  }

  baiduPoiMarkers.forEach((marker) => baiduMapInstance.removeOverlay(marker))
  baiduPoiMarkers = []
}

async function switchMapLayer(sourceKey) {
  if (isBaiduLayer(currentBaseLayer) && !isBaiduLayer(sourceKey)) {
    syncOlViewFromBaidu()
  }

  if (isBaiduLayer(sourceKey)) {
    await switchToBaiduLayer(sourceKey)
  } else {
    updateMapContainerVisibility(sourceKey)
  }

  const layers = map.getLayers().getArray()
  if (!isBaiduLayer(sourceKey) && layers.length > 0 && mapSources[sourceKey]) {
    layers[0].setSource(mapSources[sourceKey])
  }

  currentBaseLayer = sourceKey
  
  document.querySelectorAll('.layer-list li').forEach(li => {
    li.classList.remove('active')
    if (li.dataset.layer === sourceKey) {
      li.classList.add('active')
    }
  })
}

document.querySelectorAll('.layer-list li').forEach(li => {
  li.addEventListener('click', () => {
    switchMapLayer(li.dataset.layer)
  })
})

let poiLayer = null


document.getElementById('search-btn').addEventListener('click', async () => {
  const keyword = document.getElementById('search-input').value
  if (!keyword) return

  await searchPOI(keyword)
})

document.getElementById('search-input').addEventListener('keydown', handleKeywordEnter)

function handleKeywordEnter(event) {
  if (event.key !== 'Enter') {
    return
  }

  const keyword = event.target.value.trim()
  if (!keyword) {
    return
  }

  searchPOI(keyword)
}

async function searchPOI(keyword) {
  if (poiLayer) {
    map.removeLayer(poiLayer)
    poiLayer = null
  }
  clearBaiduPoiMarkers()

  setResultsMessage('搜索中...')

  const poiData = await fetchGaodePOI(keyword)
  displayPOIResults(poiData)

  if (poiData.length === 0) {
    return
  }

  if (isBaiduLayer(currentBaseLayer)) {
    renderBaiduPOI(poiData)
    return
  }

  const features = poiData.map((poi, index) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([poi.lng, poi.lat]))
    })
    feature.setId(index)
    feature.setProperties({ name: poi.name, address: poi.address })
    return feature
  })
  
  const vectorSource = new VectorSource({ features })
  
  poiLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      image: new Icon({
        src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ea4335" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
        anchor: [0.5, 1]
      })
    })
  })
  
  map.addLayer(poiLayer)
  
  map.getView().animate({
    center: fromLonLat([poiData[0].lng, poiData[0].lat]),
    zoom: 14,
    duration: 500
  })
}

function renderBaiduPOI(poiData) {
  if (!baiduMapInstance) {
    return
  }

  const BMapGL = window.BMapGL
  baiduPoiMarkers = poiData.map((poi) => {
    const point = new BMapGL.Point(poi.lng, poi.lat)
    const marker = new BMapGL.Marker(point)
    baiduMapInstance.addOverlay(marker)
    return marker
  })

  baiduMapInstance.centerAndZoom(
    new BMapGL.Point(poiData[0].lng, poiData[0].lat),
    15
  )
}

async function fetchGaodePOI(keyword) {
  try {
    const url = `https://restapi.amap.com/v3/place/text?key=${GAODE_WEB_KEY}&keywords=${encodeURIComponent(keyword)}&extensions=base&page=1&offset=20`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== '1') {
      throw new Error(data.info || '高德 POI 查询失败')
    }
    
    return data.pois?.map((poi) => {
      const [lng, lat] = poi.location?.split(',') || []
      const lngNum = parseFloat(lng)
      const latNum = parseFloat(lat)
      
      if (isNaN(lngNum) || isNaN(latNum)) {
        return null
      }
      
      return {
        name: poi.name || keyword,
        lng: lngNum,
        lat: latNum,
        address: [poi.cityname, poi.adname, poi.address].filter(Boolean).join(' ')
      }
    }).filter(Boolean) || []
  } catch (error) {
    setResultsMessage(`搜索失败：${error.message}`)
    return []
  }
}

function setResultsMessage(message) {
  document.getElementById('poi-results').innerHTML =
    `<div style="padding: 20px; text-align: center; color: #5f6368;">${message}</div>`
}

function displayPOIResults(results) {
  const container = document.getElementById('poi-results')
  
  if (results.length === 0) {
    setResultsMessage('未找到结果')
    return
  }
  
  container.innerHTML = results.map(item => `
    <div class="result-item" data-lng="${item.lng}" data-lat="${item.lat}">
      <div class="result-name">${item.name}</div>
      <div class="result-address">${item.address || ''}</div>
    </div>
  `).join('')
  
  container.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', () => {
      const lng = parseFloat(item.dataset.lng)
      const lat = parseFloat(item.dataset.lat)
      if (isBaiduLayer(currentBaseLayer) && baiduMapInstance) {
        baiduMapInstance.centerAndZoom(new window.BMapGL.Point(lng, lat), 16)
        return
      }

      map.getView().animate({
        center: fromLonLat([lng, lat]),
        zoom: 16,
        duration: 500
      })
    })
  })
}

// === 本地数据加载 (Item 5) ===
let geoJsonLayer = null;
let kmlLayer = null;

document.getElementById('toggle-geojson').addEventListener('change', (e) => {
  if (e.target.checked) {
    if (!geoJsonLayer) {
      geoJsonLayer = new VectorLayer({
        source: new VectorSource({
          url: '/xian_sample.geojson',
          format: new GeoJSON(),
        }),
        style: new Style({
          stroke: new Stroke({ color: 'blue', width: 2 }),
          fill: new Fill({ color: 'rgba(0, 0, 255, 0.1)' })
        })
      });
    }
    map.addLayer(geoJsonLayer);
    
    // Fit view to GeoJSON once loaded
    geoJsonLayer.getSource().once('change', function(evt) {
      const source = evt.target;
      if (source.getState() === 'ready') {
        const extent = source.getExtent();
        map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
      }
    });

  } else {
    if (geoJsonLayer) map.removeLayer(geoJsonLayer);
  }
});

document.getElementById('toggle-kml').addEventListener('change', (e) => {
  if (e.target.checked) {
    if (!kmlLayer) {
      kmlLayer = new VectorLayer({
        source: new VectorSource({
          url: '/xian_sample.kml',
          format: new KML(),
        })
      });
    }
    map.addLayer(kmlLayer);
    
    // Fit view to KML once loaded
    kmlLayer.getSource().once('change', function(evt) {
      const source = evt.target;
      if (source.getState() === 'ready') {
        const extent = source.getExtent();
        map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
      }
    });
    
  } else {
    if (kmlLayer) map.removeLayer(kmlLayer);
  }
});

// === GeoServer 加载 (Item 6) ===
// 默认工作空间为 'ne'，如果您的 GeoServer 使用了不同的工作空间，请将 'ne' 替换为您的工作空间名
const GEOSERVER_WMTS_URL = '/geoserver/gwc/service/wmts';
const GEOSERVER_WMS_URL = '/geoserver/wms';
const GEOSERVER_WFS_URL = '/geoserver/ows';

const GS_IMAGE_LAYER_NAME = 'ne:data';  // data.tif 影像图层
const GS_VECTOR_LAYER_NAME = 'wuhan_gis:xian'; // xian 矢量图层

let wmsLayer = null;
let wfsLayer = null;
let dataWmtsLayer = null;
let dataWfsLayer = null;

// 计算 WMTS 的 Grid
const projection = getProjection('EPSG:900913') || getProjection('EPSG:3857');
const projectionExtent = projection.getExtent();
const size = getWidth(projectionExtent) / 256;
const resolutions = new Array(14);
const matrixIds = new Array(14);
for (let z = 0; z < 14; ++z) {
  // 生成这个分辨率数组和 matrixIds，通常对于 EPSG:900913，名称是 'EPSG:900913:' + z
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = 'EPSG:900913:' + z;
}

document.getElementById('toggle-data-wmts').addEventListener('change', (e) => {
  if (e.target.checked) {
    if (!dataWmtsLayer) {
      dataWmtsLayer = new TileLayer({
        source: new WMTS({
          url: GEOSERVER_WMTS_URL,
          layer: GS_IMAGE_LAYER_NAME,
          matrixSet: 'EPSG:900913',
          format: 'image/png',
          projection: projection,
          tileGrid: new WMTSTileGrid({
            origin: getTopLeft(projectionExtent),
            resolutions: resolutions,
            matrixIds: matrixIds
          }),
          style: '',
          wrapX: true
        })
      });
    }
    map.addLayer(dataWmtsLayer);
  } else {
    if (dataWmtsLayer) map.removeLayer(dataWmtsLayer);
  }
});

document.getElementById('toggle-wms').addEventListener('change', (e) => {
  if (e.target.checked) {
    if (!wmsLayer) {
      wmsLayer = new TileLayer({
        source: new TileWMS({
          url: GEOSERVER_WMS_URL,
          params: { 'LAYERS': GS_IMAGE_LAYER_NAME, 'TILED': true },
          serverType: 'geoserver',
          crossOrigin: 'anonymous'
        })
      });
    }
    map.addLayer(wmsLayer);
  } else {
    if (wmsLayer) map.removeLayer(wmsLayer);
  }
});

document.getElementById('toggle-data-wfs').addEventListener('change', (e) => {
  if (e.target.checked) {
    if (!dataWfsLayer) {
      // WFS is typically for vector data. We include this to fulfill the requirement,
      // but note that requesting a raster layer via WFS might return empty or error.
      const wfsUrl = `${GEOSERVER_WFS_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=${GS_IMAGE_LAYER_NAME}&maxFeatures=50&outputFormat=application/json`;
      dataWfsLayer = new VectorLayer({
        source: new VectorSource({
          url: wfsUrl,
          format: new GeoJSON()
        }),
        style: new Style({
          stroke: new Stroke({ color: 'red', width: 2 })
        })
      });
    }
    map.addLayer(dataWfsLayer);
  } else {
    if (dataWfsLayer) map.removeLayer(dataWfsLayer);
  }
});

document.getElementById('toggle-wfs').addEventListener('change', (e) => {
  if (e.target.checked) {
    if (!wfsLayer) {
      const wfsUrl = `${GEOSERVER_WFS_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=${GS_VECTOR_LAYER_NAME}&maxFeatures=50&outputFormat=application/json`;
      wfsLayer = new VectorLayer({
        source: new VectorSource({
          url: wfsUrl,
          format: new GeoJSON()
        }),
        style: new Style({
          stroke: new Stroke({ color: 'green', width: 2 })
        })
      });
    }
    map.addLayer(wfsLayer);
  } else {
    if (wfsLayer) map.removeLayer(wfsLayer);
  }
});

// === Python WFS & Tiles (Items 10 & 11) ===

let pythonWfsLayer = null;
document.getElementById('toggle-python-wfs').addEventListener('change', (e) => {
  if (e.target.checked) {
    if (!pythonWfsLayer) {
      pythonWfsLayer = new VectorLayer({
        source: new VectorSource({
          url: '/python-api/ows?service=WFS&request=GetFeature&maxFeatures=50',
          format: new GeoJSON()
        }),
        style: new Style({
          stroke: new Stroke({ color: 'purple', width: 2 }),
          fill: new Fill({ color: 'rgba(128, 0, 128, 0.1)' })
        })
      });
    }
    map.addLayer(pythonWfsLayer);
    
    // Fit view to Python WFS once loaded
    pythonWfsLayer.getSource().once('change', function(evt) {
      const source = evt.target;
      if (source.getState() === 'ready') {
        const extent = source.getExtent();
        map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
      }
    });
  } else {
    if (pythonWfsLayer) map.removeLayer(pythonWfsLayer);
  }
});

let mvtLayer = null;
document.getElementById('toggle-mvt').addEventListener('change', (e) => {
  if (e.target.checked) {
    if (!mvtLayer) {
      // VectorTile 瓦片使用 EPSG:3857 坐标系，需显式指定 projection 和 tileGrid
      mvtLayer = new VectorTileLayer({
        source: new VectorTileSource({
          format: new MVT(),
          url: '/VectorTile/{z}/{x}/{y}.pbf',
          projection: 'EPSG:3857',
          tileGrid: createXYZ({
            extent: getProjection('EPSG:3857').getExtent(),
            minZoom: 2,
            maxZoom: 5,
            tileSize: 256
          })
        }),
        style: new Style({
          stroke: new Stroke({ color: '#ff6600', width: 1.5 }),
          fill: new Fill({ color: 'rgba(255, 102, 0, 0.1)' })
        })
      });
    }
    map.addLayer(mvtLayer);
    // 缩放到 MVT 瓦片有效层级范围内
    map.getView().animate({ zoom: 4, duration: 600 });
  } else {
    if (mvtLayer) map.removeLayer(mvtLayer);
  }
});

let xyzLayer = null;
document.getElementById('toggle-xyz').addEventListener('change', (e) => {
  if (e.target.checked) {
    if (!xyzLayer) {
      // 瓦片由 gdal2tiles.py -xyz 生成，Y 轴无需翻转，格式为 .jpg
      xyzLayer = new TileLayer({
        source: new XYZ({
          url: '/my_tiles/{z}/{x}/{y}.jpg',
          projection: 'EPSG:3857',
          minZoom: 12,
          maxZoom: 12
        })
      });
    }
    map.addLayer(xyzLayer);
    // 飞到瓦片覆盖中心（X:3299~3347, Y:1637~1678 @ z12 → 约 lon=112.1°, lat=32.4°）
    map.getView().animate({
      center: fromLonLat([112.1, 32.4]),
      zoom: 12,
      duration: 800
    });
  } else {
    if (xyzLayer) map.removeLayer(xyzLayer);
  }
});

// === Items 7, 8, 9 (Tools, Animations, Map Controls) ===

// 1. Mouse Position & Overview Map (Item 9)
const mousePositionControl = new MousePosition({
  coordinateFormat: createStringXY(4),
  projection: 'EPSG:4326',
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
});
map.addControl(mousePositionControl);

const overviewMapControl = new OverviewMap({
  className: 'ol-overviewmap ol-custom-overviewmap',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  collapseLabel: '\\u00BB',
  label: '\\u00AB',
  collapsed: true,
});
map.addControl(overviewMapControl);

// 2. Vector Layer for Drawings
const userDrawSource = new VectorSource();
const userDrawLayer = new VectorLayer({
  source: userDrawSource,
  style: new Style({
    fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
    stroke: new Stroke({ color: '#ffcc33', width: 2 }),
    image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#ffcc33' }) })
  })
});
map.addLayer(userDrawLayer);

// Create tooltip overlays
let measureTooltipElement;
let measureTooltip;
function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
  measureTooltip = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center'
  });
  map.addOverlay(measureTooltip);
}

const formatLength = function (line) {
  const length = getLength(line);
  return length > 100 ? (Math.round(length / 1000 * 100) / 100) + ' ' + 'km' : (Math.round(length * 100) / 100) + ' ' + 'm';
};
const formatArea = function (polygon) {
  const area = getArea(polygon);
  return area > 10000 ? (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>' : (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
};

let drawInteraction;
let currentLineFeature = null;

function addDrawInteraction(type) {
  map.removeInteraction(drawInteraction);
  if (!type) return;

  drawInteraction = new Draw({
    source: userDrawSource,
    type: type,
    style: new Style({
      fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
      stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.5)', lineDash: [10, 10], width: 2 }),
      image: new CircleStyle({ radius: 5, stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.7)' }), fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }) })
    })
  });
  map.addInteraction(drawInteraction);

  createMeasureTooltip();
  let listener;
  let sketch;

  drawInteraction.on('drawstart', function (evt) {
    sketch = evt.feature;
    let tooltipCoord = evt.coordinate;
    
    listener = sketch.getGeometry().on('change', function (evt) {
      const geom = evt.target;
      let output;
      if (geom instanceof Polygon) {
        output = formatArea(geom);
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof LineString) {
        output = formatLength(geom);
        tooltipCoord = geom.getLastCoordinate();
      }
      measureTooltipElement.innerHTML = output;
      measureTooltip.setPosition(tooltipCoord);
    });
  });

  drawInteraction.on('drawend', function () {
    if (sketch.getGeometry() instanceof LineString) {
      currentLineFeature = sketch;
    }
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    measureTooltip.setOffset([0, -7]);
    sketch = null;
    measureTooltipElement = null;
    createMeasureTooltip();
    unByKey(listener);
    map.removeInteraction(drawInteraction);
  });
}

document.getElementById('tool-draw-line').addEventListener('click', () => addDrawInteraction('LineString'));
document.getElementById('tool-draw-poly').addEventListener('click', () => addDrawInteraction('Polygon'));
document.getElementById('tool-clear').addEventListener('click', () => {
  userDrawSource.clear();
  currentLineFeature = null;
  map.getOverlays().clear();
});

// Drone Animation (Item 7)
document.getElementById('tool-fly').addEventListener('click', () => {
  if (!currentLineFeature || !(currentLineFeature.getGeometry() instanceof LineString)) {
    alert("请先绘制一条路线(多段线)。");
    return;
  }
  const routeGeom = currentLineFeature.getGeometry();
  
  // Fake drone icon (SVG)
  const svg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg"><path d="M21,16V14L13,9V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" /></svg>';
  const droneIcon = new Style({
    image: new Icon({
      src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scale: 1,
      rotation: 0
    })
  });

  const geoFeature = new Feature(new Point(routeGeom.getFirstCoordinate()));
  geoFeature.setStyle(droneIcon);
  userDrawSource.addFeature(geoFeature);

  let fraction = 0;
  const speed = 0.005; 
  let lastTime;

  function animateDrone(event) {
    const time = event.frameState.time;
    if (lastTime) {
      fraction += (time - lastTime) * speed * 0.01;
    }
    lastTime = time;

    if (fraction <= 1) {
      const currentPoint = routeGeom.getCoordinateAt(fraction);
      const nextPoint = routeGeom.getCoordinateAt(Math.min(fraction + 0.01, 1));
      
      const dx = nextPoint[0] - currentPoint[0];
      const dy = nextPoint[1] - currentPoint[1];
      const rotation = Math.atan2(dy, dx);
      
      geoFeature.getGeometry().setCoordinates(currentPoint);
      droneIcon.getImage().setRotation(-rotation + Math.PI / 2); // default svg points up

      map.render();
    } else {
      unByKey(listenerKey);
      userDrawSource.removeFeature(geoFeature);
    }
  }

  const listenerKey = userDrawLayer.on('postrender', animateDrone);
  map.render();
});

// Annotation Tool (Item 8)
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popup-content');
const popupCloser = document.getElementById('popup-closer');
const annotationOverlay = new Overlay({
  element: popup,
  autoPan: { animation: { duration: 250 } }
});
map.addOverlay(annotationOverlay);

popupCloser.onclick = function () {
  annotationOverlay.setPosition(undefined);
  popupCloser.blur();
  return false;
};

let annotating = false;
document.getElementById('tool-annotate').addEventListener('click', () => {
  annotating = !annotating;
  document.getElementById('tool-annotate').style.background = annotating ? '#e8eaed' : 'white';
  if (!annotating) popupCloser.onclick();
});

map.on('singleclick', function (evt) {
  if (!annotating) return;
  
  const coordinate = evt.coordinate;
  const text = prompt("请输入标注文字:");
  if (text) {
    const feature = new Feature({
      geometry: new Point(coordinate),
      name: text
    });
    
    feature.setStyle(new Style({
      image: new CircleStyle({ radius: 5, fill: new Fill({ color: 'red' }) }),
      text: new Text({
        text: text,
        font: '14px sans-serif',
        offsetY: -15,
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#fff', width: 3 })
      })
    }));
    userDrawSource.addFeature(feature);
  }
  annotating = false;
  document.getElementById('tool-annotate').style.background = 'white';
});

// ==================== 2D/3D 视图切换 (Item 1 & 8) ====================
let is3DMode = false;
document.getElementById('toggle-2d3d').addEventListener('click', () => {
  is3DMode = !is3DMode;
  const btn = document.getElementById('toggle-2d3d');
  
  // 容器和面板引用
  const olMap = document.getElementById('ol-map');
  const baiduMap = document.getElementById('baidu-map');
  const cesiumContainer = document.getElementById('cesium-container');
  
  const panel2dLayers = document.getElementById('panel-2d-layers');
  const panel2dData1 = document.getElementById('panel-2d-data1');
  const panel2dData2 = document.getElementById('panel-2d-data2');
  const panel2dData3 = document.getElementById('panel-2d-data3');
  const toolbar2d = document.getElementById('toolbar-2d');
  
  const panel3dLayers = document.getElementById('panel-3d-layers');
  const panel3dData = document.getElementById('panel-3d-data');

  if (is3DMode) {
    btn.textContent = '切换到 2D 视图';
    
    // 隐藏 2D
    olMap.classList.add('hidden-map');
    baiduMap.classList.add('hidden-map');
    panel2dLayers.classList.add('hidden-panel');
    panel2dData1.classList.add('hidden-panel');
    panel2dData2.classList.add('hidden-panel');
    panel2dData3.classList.add('hidden-panel');
    toolbar2d.classList.add('hidden-panel');
    
    // 显示 3D
    cesiumContainer.classList.remove('hidden-map');
    panel3dLayers.classList.remove('hidden-panel');
    panel3dData.classList.remove('hidden-panel');
    
    // 初始化 Cesium
    initCesium();
    
  } else {
    btn.textContent = '切换到 3D 视图';
    
    // 显示 2D
    updateMapContainerVisibility(currentBaseLayer);
    
    panel2dLayers.classList.remove('hidden-panel');
    panel2dData1.classList.remove('hidden-panel');
    panel2dData2.classList.remove('hidden-panel');
    panel2dData3.classList.remove('hidden-panel');
    toolbar2d.classList.remove('hidden-panel');
    
    // 隐藏 3D
    cesiumContainer.classList.add('hidden-map');
    panel3dLayers.classList.add('hidden-panel');
    panel3dData.classList.add('hidden-panel');
  }
});

