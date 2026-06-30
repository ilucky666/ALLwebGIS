import * as Cesium from 'cesium';

// --- 配置 Tokens ---
// 注意：以下 token 需要您在项目中实际申请并替换
const BING_MAP_KEY = 'BingMapsKey'; // 请替换为您自己的 Bing Maps API Key
const TIANDITU_KEY = 'af048f2a171ec76cca81e042035d6b81';
const GAODE_KEY = 'ae50a01d06173d9f6c31361864e3353a';

// 全局变量
export let viewer = null;
let isInitialized = false;

// 数据服务地址
const GEOSERVER_URL = '/geoserver';

export function initCesium() {
    if (isInitialized) return;
    
    // 初始化 Viewer
    viewer = new Cesium.Viewer('cesium-container', {
        animation: true,
        timeline: true,
        baseLayerPicker: false,
        baseLayer: false, // 阻止默认的 Bing Maps 导致 Ion Token 报错
        geocoder: false,
        homeButton: true,
        infoBox: true,
        sceneModePicker: false,
        selectionIndicator: true,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        terrainProvider: undefined // 稍后动态加载
    });

    // 默认隐藏商标
    viewer._cesiumWidget._creditContainer.style.display = "none";

    isInitialized = true;

    // 绑定面板事件
    setupLayerPanel();
    setupDataPanel();
    setup3DFeatures();
}

function setupLayerPanel() {
    const listItems = document.querySelectorAll('#panel-3d-layers li');
    listItems.forEach(li => {
        li.addEventListener('click', () => {
            const layerType = li.dataset.layer3d;
            listItems.forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            switchBaseLayer(layerType);
        });
    });

    // 默认加载高德影像
    switchBaseLayer('gaode');
}

function switchBaseLayer(type) {
    if (!viewer) return;

    const imageryLayers = viewer.imageryLayers;
    imageryLayers.removeAll();

    let provider;
    switch (type) {
        case 'bing':
            // 注意：Cesium 较新版本内置了 Ion 的 Bing 地图，若要直接用 key 可以使用 BingMapsImageryProvider
            if (Cesium.createWorldImageryAsync) {
                provider = Cesium.createWorldImageryAsync({ style: Cesium.IonWorldImageryStyle.AERIAL });
            } else if (Cesium.createWorldImagery) {
                provider = Cesium.createWorldImagery({ style: Cesium.IonWorldImageryStyle.AERIAL });
            }
            break;
        case 'osm':
            provider = new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/'
            });
            break;
        case 'tianditu':
            provider = new Cesium.WebMapTileServiceImageryProvider({
                url: `https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&FORMAT=tiles&tk=${TIANDITU_KEY}`,
                layer: 'img',
                style: 'default',
                format: 'tiles',
                tileMatrixSetID: 'w',
                subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
                maximumLevel: 18
            });
            break;
        case 'gaode':
            // 高德地图切片服务（直接请求并使用多子域名提速）
            provider = new Cesium.UrlTemplateImageryProvider({
                url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
                subdomains: ['1', '2', '3', '4']
            });
            break;
        case 'mapbox':
            // 需替换为自己的 Mapbox Token 和 Style
            provider = new Cesium.UrlTemplateImageryProvider({
                url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=YOUR_MAPBOX_TOKEN'
            });
            break;
        case 'single':
            provider = new Cesium.SingleTileImageryProvider({
                url: '/xian_sample.jpg', // 需放置一张示例图片到 public 目录下
                rectangle: Cesium.Rectangle.fromDegrees(115.0, 39.0, 117.0, 41.0)
            });
            break;
    }

    const addProvider = (p) => {
        if (imageryLayers.addImageryProvider) {
            imageryLayers.addImageryProvider(p);
        } else {
            imageryLayers.add(new Cesium.ImageryLayer(p));
        }
    };

    if (provider) {
        if (provider instanceof Promise) {
            provider.then(addProvider).catch(e => console.error("底图加载失败", e));
        } else {
            addProvider(provider);
        }
    }
}

// ======================== 数据加载 ========================
let geoJsonDataSource = null;
let kmlDataSource = null;
let czmlDataSource = null;
let gltfEntity = null;
let wmsLayer = null;
let bldgTileset = null;
let whuTileset = null;

function setupDataPanel() {
    // GeoServer WMS
    document.getElementById('toggle-3d-wms').addEventListener('change', (e) => {
        if (e.target.checked) {
            const provider = new Cesium.WebMapServiceImageryProvider({
                url: `${GEOSERVER_URL}/wuhan_gis/wms`,
                layers: 'wuhan_gis:xian',
                parameters: {
                    transparent: true,
                    format: 'image/png'
                }
            });
            wmsLayer = viewer.imageryLayers.addImageryProvider(provider);
        } else if (wmsLayer) {
            viewer.imageryLayers.remove(wmsLayer);
            wmsLayer = null;
        }
    });

    // GeoJSON
    document.getElementById('toggle-3d-geojson').addEventListener('change', async (e) => {
        if (e.target.checked) {
            geoJsonDataSource = await Cesium.GeoJsonDataSource.load('/xian_sample.geojson', {
                stroke: Cesium.Color.BLUE,
                fill: Cesium.Color.BLUE.withAlpha(0.3),
                strokeWidth: 3
            });
            viewer.dataSources.add(geoJsonDataSource);
            viewer.flyTo(geoJsonDataSource);
        } else if (geoJsonDataSource) {
            viewer.dataSources.remove(geoJsonDataSource);
            geoJsonDataSource = null;
        }
    });

    // KML
    document.getElementById('toggle-3d-kml').addEventListener('change', async (e) => {
        if (e.target.checked) {
            kmlDataSource = await Cesium.KmlDataSource.load('/xian_sample.kml', {
                camera: viewer.scene.camera,
                canvas: viewer.scene.canvas
            });
            viewer.dataSources.add(kmlDataSource);
            viewer.flyTo(kmlDataSource);
        } else if (kmlDataSource) {
            viewer.dataSources.remove(kmlDataSource);
            kmlDataSource = null;
        }
    });

    // BIM (glTF/3D Tiles)
    document.getElementById('toggle-3d-gltf').addEventListener('change', async (e) => {
        if (e.target.checked) {
            try {
                // 加载转换后的 glTF 模型：
                const position = Cesium.Cartesian3.fromDegrees(114.36, 30.54, 0);
                const heading = Cesium.Math.toRadians(135);
                const pitch = 0;
                const roll = 0;
                const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
                const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
    
                gltfEntity = viewer.entities.add({
                    name: 'BIM 模型',
                    position: position,
                    orientation: orientation,
                    model: {
                        uri: '/turbo/dff4dd4d28364c79ae5de56d81d32ba0.glb',
                        minimumPixelSize: 128,
                        maximumScale: 20000
                    }
                });
                viewer.flyTo(gltfEntity);
            } catch (err) {
                console.error("BIM 加载失败", err);
            }
        } else if (gltfEntity) {
            viewer.entities.remove(gltfEntity);
            gltfEntity = null;
        }
    });

    // CZML
    document.getElementById('toggle-3d-czml').addEventListener('change', async (e) => {
        if (e.target.checked) {
            czmlDataSource = await Cesium.CzmlDataSource.load('/sample.czml'); // 需要用户提供
            viewer.dataSources.add(czmlDataSource);
            viewer.flyTo(czmlDataSource);
        } else if (czmlDataSource) {
            viewer.dataSources.remove(czmlDataSource);
            czmlDataSource = null;
        }
    });

    // Terrain
    document.getElementById('toggle-3d-terrain').addEventListener('change', async (e) => {
        if (e.target.checked) {
            try {
                viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl('/dixing');
            } catch (err) {
                console.error("加载本地地形失败，尝试加载在线地形", err);
                viewer.terrainProvider = await Cesium.createWorldTerrainAsync();
            }
        } else {
            viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        }
    });

    // 建筑白膜 (3D Tiles)
    document.getElementById('toggle-3d-tiles-bldg').addEventListener('change', async (e) => {
        if (e.target.checked) {
            try {
                // 加载已放入的具有地理坐标的建筑白膜
                bldgTileset = await Cesium.Cesium3DTileset.fromUrl('/buildings_3dtiles/tileset.json');

                viewer.scene.primitives.add(bldgTileset);
                viewer.flyTo(bldgTileset);
            } catch (err) {
                console.error("加载白膜失败，请确认数据路径", err);
                alert("加载建筑白膜失败，请检查 public/buildings_3dtiles/tileset.json 是否存在且格式正确。");
            }
        } else if (bldgTileset) {
            viewer.scene.primitives.remove(bldgTileset);
            bldgTileset = null;
        }
    });

    // 武大倾斜模型 (3D Tiles)
    document.getElementById('toggle-3d-tiles-whu').addEventListener('change', async (e) => {
        if (e.target.checked) {
            try {
                // 加载武大倾斜摄影 3D Tiles。关闭 skipLevelOfDetail 解决 CesiumLab 转换的部分模型消失问题
                whuTileset = await Cesium.Cesium3DTileset.fromUrl('/3dtiels_whu/tileset.json', {
                    skipLevelOfDetail: false
                });
                whuTileset.maximumScreenSpaceError = 16; // 优化渲染

                viewer.scene.primitives.add(whuTileset);
                
                try {
                    await viewer.zoomTo(whuTileset);
                } catch(flyErr) {
                    console.warn("自动定位倾斜模型失败，采用手动定位:", flyErr);
                    viewer.camera.flyTo({
                        // 精确匹配 tileset 内部的 ECEF 坐标
                        destination: Cesium.Cartesian3.fromDegrees(114.3535, 30.5309, 800),
                        orientation: {
                            heading: Cesium.Math.toRadians(0),
                            pitch: Cesium.Math.toRadians(-45),
                            roll: 0.0
                        }
                    });
                }
            } catch (err) {
                console.error("加载倾斜模型失败", err);
                alert("加载武大倾斜模型失败: " + err.message);
            }
        } else if (whuTileset) {
            viewer.scene.primitives.remove(whuTileset);
            whuTileset = null;
        }
    });

    // 点云数据 (3D Tiles 转换后)
    let pointCloudTileset = null;
    document.getElementById('toggle-3d-pointcloud').addEventListener('change', async (e) => {
        if (e.target.checked) {
            try {
                // 从 Cesium Ion 加载点云 (Asset ID: 5713)
                pointCloudTileset = await Cesium.Cesium3DTileset.fromIonAssetId(5713);
                viewer.scene.primitives.add(pointCloudTileset);
                viewer.flyTo(pointCloudTileset);
            } catch (err) {
                console.error("加载点云失败", err);
                alert("加载点云数据失败，请确认 Cesium Ion 资产 ID 正确并且拥有访问权限。");
            }
        } else if (pointCloudTileset) {
            viewer.scene.primitives.remove(pointCloudTileset);
            pointCloudTileset = null;
        }
    });
}

// ======================== 三维特性与动画 ========================

function setup3DFeatures() {
    let logoPrimitive = null;
    let carEntity = null;

    document.getElementById('btn-3d-logo').addEventListener('click', () => {
        if (!viewer) return;

        if (logoPrimitive) {
            viewer.scene.primitives.remove(logoPrimitive);
            logoPrimitive = null;
            return;
        }

        // 放置真正的三维体素化（Voxel）文字 LOGO
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 40;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 200, 40); // 黑色作为透明背景参考
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('lyd的三维世界', 100, 20);

        const imgData = ctx.getImageData(0, 0, 200, 40).data;
        const instances = [];

        const origin = Cesium.Cartesian3.fromDegrees(114.36, 30.53, 50);
        const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
        
        // 增加 Y 轴维度（从 0.5 改为 4.0），从而大幅增加文字的厚度
        const boxGeometry = Cesium.BoxGeometry.fromDimensions({
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
            dimensions: new Cesium.Cartesian3(0.5, 4.0, 0.5) 
        });

        for (let y = 0; y < 40; y++) {
            for (let x = 0; x < 200; x++) {
                const idx = (y * 200 + x) * 4;
                if (imgData[idx] > 128) {
                    // 对于每个文字像素，在模型矩阵上做偏移
                    const offsetMatrix = Cesium.Matrix4.fromTranslation(new Cesium.Cartesian3(
                        (x - 100) * 0.5, // X 轴（向东）
                        0,               // Y 轴（向北，即深度）
                        (20 - y) * 0.5   // Z 轴（向上）
                    ));
                    const instanceMatrix = Cesium.Matrix4.multiply(modelMatrix, offsetMatrix, new Cesium.Matrix4());
                    
                    instances.push(new Cesium.GeometryInstance({
                        geometry: boxGeometry,
                        modelMatrix: instanceMatrix,
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.GOLD)
                        }
                    }));
                }
            }
        }

        logoPrimitive = new Cesium.Primitive({
            geometryInstances: instances,
            appearance: new Cesium.PerInstanceColorAppearance({
                closed: true
            })
        });
        viewer.scene.primitives.add(logoPrimitive);
        viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(origin, 100));
    });

    let carEventHandler = null;
    document.getElementById('btn-3d-car').addEventListener('click', () => {
        if (!viewer) return;

        if (carEntity) {
            viewer.entities.remove(carEntity);
            carEntity = null;
        }

        alert("请在地图上点击一个小车起始位置！");

        if (!carEventHandler) {
            carEventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        }

        carEventHandler.setInputAction((click) => {
            carEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);

            // 获取点击位置
            let position = viewer.scene.pickPosition(click.position);
            if (!position) {
                const ray = viewer.camera.getPickRay(click.position);
                position = viewer.scene.globe.pick(ray, viewer.scene);
            }
            if (!position) {
                position = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
            }
            
            if (!position) return;

            const startCarto = Cesium.Cartographic.fromCartesian(position);
            const heading = viewer.camera.heading; 

            const property = new Cesium.SampledPositionProperty();
            const start = Cesium.JulianDate.fromDate(new Date());
            const stop = Cesium.JulianDate.addSeconds(start, 20, new Cesium.JulianDate());
            
            viewer.clock.startTime = start.clone();
            viewer.clock.stopTime = stop.clone();
            viewer.clock.currentTime = start.clone();
            viewer.clock.clockRange = Cesium.ClockRange.CLAMPED; 
            viewer.clock.multiplier = 1;

            // 沿着视角方向向前方生成路径点
            for (let i = 0; i <= 20; i++) {
                const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
                const distance = i * 5; // 5m/s (减慢速度)
                const latOffset = (distance * Math.cos(heading)) / 111320;
                const lonOffset = (distance * Math.sin(heading)) / (111320 * Math.cos(startCarto.latitude));
                
                const nextCarto = new Cesium.Cartographic(
                    startCarto.longitude + lonOffset,
                    startCarto.latitude + latOffset,
                    startCarto.height
                );
                property.addSample(time, Cesium.Cartographic.toCartesian(nextCarto));
            }

            carEntity = viewer.entities.add({
                availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                    start: start,
                    stop: stop
                })]),
                position: property,
                orientation: new Cesium.VelocityOrientationProperty(property),
                model: {
                    uri: 'https://sandcastle.cesium.com/SampleData/models/CesiumMilkTruck/CesiumMilkTruck.glb',
                    minimumPixelSize: 64
                },
                path: {
                    resolution: 1,
                    material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.1, color: Cesium.Color.YELLOW }),
                    width: 10
                }
            });

            // 清理旧的第一人称事件监听
            if (window.fppListener) {
                viewer.scene.preUpdate.removeEventListener(window.fppListener);
                window.fppListener = null;
            }

            viewer.trackedEntity = undefined; // 取消第三人称追踪

            // 第一人称视角 (FPP) 模拟循环
            window.fppListener = function(scene, time) {
                if (!carEntity) {
                    scene.preUpdate.removeEventListener(window.fppListener);
                    window.fppListener = null;
                    return;
                }
                const position = carEntity.position.getValue(time);
                const orientation = carEntity.orientation.getValue(time);
                
                if (position && orientation) {
                    const matrix = Cesium.Matrix3.fromQuaternion(orientation);
                    // 速度方向(前进方向)在模型坐标系中通常为 X 轴
                    const forward = Cesium.Matrix3.getColumn(matrix, 0, new Cesium.Cartesian3());
                    const up = Cesium.Matrix3.getColumn(matrix, 2, new Cesium.Cartesian3());
                    
                    // 设置第一人称视角相对小车的偏移：往后3米，往上2米
                    const offset = new Cesium.Cartesian3(-3.0, 0.0, 2.0); 
                    
                    let camPos = Cesium.Cartesian3.clone(position);
                    camPos = Cesium.Cartesian3.add(camPos, Cesium.Cartesian3.multiplyByScalar(forward, offset.x, new Cesium.Cartesian3()), camPos);
                    camPos = Cesium.Cartesian3.add(camPos, Cesium.Cartesian3.multiplyByScalar(up, offset.z, new Cesium.Cartesian3()), camPos);

                    viewer.camera.position = camPos;
                    viewer.camera.direction = forward;
                    viewer.camera.up = up;
                    viewer.camera.right = Cesium.Cartesian3.cross(forward, up, new Cesium.Cartesian3());
                }
            };
            viewer.scene.preUpdate.addEventListener(window.fppListener);

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    });
}
