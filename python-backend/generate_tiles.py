import subprocess
import os
import shutil

def generate_vector_tiles():
    """
    使用 ogr2ogr 工具从 xian.shp 生成 Mapbox Vector Tiles (MVT)。
    生成的瓦片将存放在 public/xian_mvt 目录下。
    """
    print("准备从 xian.shp 生成矢量瓦片 (MVT)...")
    
    output_dir = "../public/xian_mvt"
    shp_path = "../xian.shp"
    
    if not os.path.exists(shp_path):
        print(f"找不到 {shp_path}，请确保该 Shapefile 文件位于根目录。")
        return

    # 若目录已存在，则清除（可根据需求不清除，这里为测试方便直接清除）
    if os.path.exists(output_dir):
        print(f"清空旧的瓦片缓存 {output_dir}")
        shutil.rmtree(output_dir)
        
    os.makedirs(output_dir, exist_ok=True)

    # 这里的 MAXZOOM 设为 12 保证切分不会占用过久时间。由于源文件非常庞大，也可以附加 -sql "SELECT * FROM xian LIMIT 100" 来避免内存溢出和磁盘过满。
    cmd = [
        "ogr2ogr",
        "-f", "MVT",
        "-dsco", "MAXZOOM=8",
        "-dsco", "COMPRESS=NO", # 不压缩以便直接通过 web 服务器快速访问
        output_dir,
        shp_path
    ]
    
    print(f"执行命令: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    
    if result.returncode == 0:
        print(f"矢量瓦片生成成功！存放在 {output_dir}/ 目录下。")
        print("之后在前端可以使用 ol/layer/VectorTile 和 ol/source/VectorTile 加载这些矢量切片。")
    else:
        print("矢量瓦片生成失败：")
        print(result.stderr)

if __name__ == "__main__":
    generate_vector_tiles()
    print("提示：若是影像数据生成栅格瓦片，请使用 gdal2tiles.py。")
