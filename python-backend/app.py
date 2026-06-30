from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 使用脚本自身位置推算绝对路径，避免受工作目录影响
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SHP_PATH = os.path.join(_SCRIPT_DIR, "..", "xian.shp")

@app.get("/ows")
def wfs_simulate(service: str = "WFS", request: str = "GetFeature", maxFeatures: int = 50):
    """
    Simulates a basic WFS endpoint returning GeoJSON directly using local ogr2ogr utility.
    """
    if service.upper() == "WFS" and request.upper() == "GETFEATURE":
        if not os.path.exists(SHP_PATH):
            return {"error": f"File {SHP_PATH} not found. Please ensure it is in project root."}

        # Use ogr2ogr to read the shapefile and output GeoJSON to memory (stdout)
        cmd = [
            "ogr2ogr",
            "-f", "GeoJSON",
            "-lco", "RFC7946=YES",
            "/vsistdout/", 
            SHP_PATH,
            "-sql", f"SELECT * FROM xian LIMIT {maxFeatures}"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        if result.returncode == 0:
            return Response(content=result.stdout, media_type="application/json")
        else:
            return {"error": "ogr2ogr command failed", "details": result.stderr}
    
    return {"error": "Unsupported service or request mode."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
