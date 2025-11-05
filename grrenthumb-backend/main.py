"""
FastAPI Backend for Plant Disease Analysis
Main application server
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import shutil
import os
from pathlib import Path
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
from typing import List, Dict
from pydantic import BaseModel
import uvicorn
from pydantic import BaseModel
import logging
from typing import Optional

from routes import soil_analysis


from models.disease_classifier import PlantDiseaseClassifier
from utils.dataset_handler import DatasetHandler
from utils.training import ModelTrainer
from utils.soil_processing import SoilImageProcessor
from models.soil_analyzer import SoilAnalyzer


# Initialize FastAPI app
app = FastAPI(
    title="GreenThumb Plant Disease API",
    description="AI-powered plant disease detection and analysis",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models and utilities
classifier = None
dataset_handler = None
trainer = None

class PredictionResponse(BaseModel):
    crop_type: str
    disease_status: str
    severity_level: int  # 0 (healthy), 20, 40, 60, 80, 100 (dead)
    confidence: float
    recommendations: List[str]

class TrainingConfig(BaseModel):
    epochs: int = 50
    batch_size: int = 16
    learning_rate: float = 0.001
    test_split: float = 0.2

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    global classifier, dataset_handler, trainer
    
    # Create necessary directories
    Path("data/raw").mkdir(parents=True, exist_ok=True)
    Path("data/processed").mkdir(parents=True, exist_ok=True)
    Path("models/saved").mkdir(parents=True, exist_ok=True)
    Path("models/checkpoints").mkdir(parents=True, exist_ok=True)
    
    # Initialize handlers
    dataset_handler = DatasetHandler(base_path="data")
    classifier = PlantDiseaseClassifier(model_path="models/saved/plant_classifier.pth")
    trainer = ModelTrainer(dataset_handler=dataset_handler, classifier=classifier)
    
    print("✓ Plant Disease Analysis Backend Started")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Plant Disease Analysis API",
        "gpu_available": torch.cuda.is_available()
    }

@app.post("/analyze")
async def analyze_plant(file: UploadFile = File(...)):
    """
    Analyze a single plant image for disease
    """
    try:
        # Validate file
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Make prediction
        prediction = classifier.predict(image)
        
        # Generate recommendations
        recommendations = classifier.get_recommendations(
            prediction["crop_type"],
            prediction["disease_status"],
            prediction["severity_level"]
        )
        
        return PredictionResponse(
            crop_type=prediction["crop_type"],
            disease_status=prediction["disease_status"],
            severity_level=prediction["severity_level"],
            confidence=prediction["confidence"],
            recommendations=recommendations
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-analyze")
async def batch_analyze(files: List[UploadFile] = File(...)):
    """
    Analyze multiple plant images
    """
    results = []
    
    for file in files:
        try:
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            prediction = classifier.predict(image)
            
            results.append({
                "filename": file.filename,
                "prediction": prediction,
                "status": "success"
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e),
                "status": "failed"
            })
    
    return {"results": results, "total": len(files), "successful": sum(1 for r in results if r["status"] == "success")}

@app.post("/train")
async def train_model(config: TrainingConfig, background_tasks: BackgroundTasks):
    """
    Start model training with custom configuration
    """
    try:
        # Verify dataset exists
        if not dataset_handler.validate_dataset():
            raise HTTPException(
                status_code=400,
                detail="Dataset not properly organized. Please upload training images first."
            )
        
        # Schedule training in background
        background_tasks.add_task(
            trainer.train,
            epochs=config.epochs,
            batch_size=config.batch_size,
            learning_rate=config.learning_rate,
            test_split=config.test_split
        )
        
        return {
            "status": "training_started",
            "config": config.dict(),
            "message": "Model training started in background"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-training-data")
async def upload_training_data(
    crop_type: str,
    severity: int,
    file: UploadFile = File(...)
):
    """
    Upload training images organized by crop type and severity level
    Directory structure: data/raw/{crop_type}/{severity}/image.jpg
    severity: 0 (healthy), 20, 40, 60, 80, 100 (dead)
    """
    try:
        # Validate severity
        valid_severities = [0, 20, 40, 60, 80, 100]
        if severity not in valid_severities:
            raise HTTPException(
                status_code=400,
                detail=f"Severity must be one of: {valid_severities}"
            )
        
        # Create directory structure
        save_path = Path(f"data/raw/{crop_type}/{severity}")
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Save file
        file_path = save_path / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "status": "success",
            "crop_type": crop_type,
            "severity": severity,
            "filename": file.filename,
            "path": str(file_path)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dataset-stats")
async def get_dataset_stats():
    """
    Get statistics about the training dataset
    """
    stats = dataset_handler.get_statistics()
    return stats

@app.get("/model-info")
async def get_model_info():
    """
    Get current model information
    """
    return {
        "model_type": "ResNet50 + Custom Classifier",
        "crops_supported": classifier.crops_list,
        "severity_levels": [0, 20, 40, 60, 80, 100],
        "input_size": [224, 224],
        "last_updated": classifier.get_model_info()
    }

@app.delete("/reset-model")
async def reset_model():
    """Reset model to initial state"""
    try:
        classifier.reset()
        return {"status": "success", "message": "Model reset to initial state"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

from routes import soil_analysis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="GreenThumb API",
    description="Plant Disease Detection & Soil Analysis API",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev
        "http://localhost:3000",
        "*"  # For development - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response Models
class HealthResponse(BaseModel):
    status: str
    message: str
    services: dict

# NEW: Include soil analysis routes
app.include_router(soil_analysis.router, prefix="/api")

# Root Endpoint
@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - API information"""
    return HealthResponse(
        status="healthy",
        message="GreenThumb API is running! 🌱",
        services={
            "plant_disease": "available",
            "soil_analysis": "available"
        }
    )

# Health Check
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="All systems operational",
        services={
            "plant_disease": "healthy",
            "soil_analysis": "healthy"
        }
    )

# ============================================
# EXISTING PLANT DISEASE ENDPOINTS (Keep as is)
# ============================================

@app.post("/analyze")
async def analyze_plant(file: UploadFile = File(...)):
    """
    Analyze plant image for disease detection
    (Your existing implementation)
    """
    try:
        # Your existing plant disease analysis code
        # Keep all your existing logic here
        
        # Example placeholder - replace with your actual code:
        """
        image_bytes = await file.read()
        result = disease_classifier.predict(image_bytes)
        
        return {
            "crop_type": result["crop"],
            "disease_status": result["disease"],
            "severity_level": result["severity"],
            "confidence": result["confidence"],
            "recommendations": result["recommendations"]
        }
        """
        pass
    except Exception as e:
        logger.error(f"Plant analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting GreenThumb API...")
    logger.info("✓ Plant Disease Detection - Ready")
    logger.info("✓ Soil Analysis - Ready")
    logger.info("API is now accepting requests")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down GreenThumb API...")

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )    