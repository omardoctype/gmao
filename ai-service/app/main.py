from __future__ import annotations

import logging
from time import perf_counter

from fastapi import FastAPI, HTTPException, Request, Response

try:
    from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
except ImportError:  # pragma: no cover - local fallback if requirements were not refreshed
    CONTENT_TYPE_LATEST = "text/plain; version=0.0.4"

    class _NoopMetric:
        def labels(self, *args, **kwargs):
            return self

        def inc(self) -> None:
            return None

        def observe(self, value: float) -> None:
            return None

    def Counter(*args, **kwargs):  # type: ignore[no-redef]
        return _NoopMetric()

    def Histogram(*args, **kwargs):  # type: ignore[no-redef]
        return _NoopMetric()

    def generate_latest() -> bytes:  # type: ignore[no-redef]
        return b"# prometheus_client is not installed. Run: pip install -r requirements.txt\n"

from app.config import Settings
from app.rag_service import RagService
from app.schemas import (
    AskRequest,
    AskResponse,
    DiagnosisRequest,
    DiagnosisResponse,
    EquipmentDocumentGenerateRequest,
    EquipmentDocumentGenerateResponse,
    HealthResponse,
    IngestResponse,
)
from app.vector_store import VectorStore


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)

settings = Settings()
vector_store = VectorStore(
    chroma_path=str(settings.chroma_dir),
    collection_name=settings.collection_name,
    embedding_model=settings.embedding_model,
)
rag_service = RagService(settings=settings, vector_store=vector_store)

app = FastAPI(title="GMAO AI Service", version="1.0.0")

HTTP_REQUESTS_TOTAL = Counter(
    "gmao_ai_http_requests_total",
    "Total HTTP requests handled by the GMAO AI service.",
    ["method", "path", "status"],
)
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "gmao_ai_http_request_duration_seconds",
    "HTTP request duration for the GMAO AI service.",
    ["method", "path"],
)


@app.middleware("http")
async def collect_metrics(request: Request, call_next):
    started_at = perf_counter()
    status = "500"
    path = request.url.path
    try:
        response = await call_next(request)
        status = str(response.status_code)
        return response
    finally:
        duration = perf_counter() - started_at
        HTTP_REQUESTS_TOTAL.labels(request.method, path, status).inc()
        HTTP_REQUEST_DURATION_SECONDS.labels(request.method, path).observe(duration)


@app.get("/metrics")
def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    started_at = perf_counter()
    try:
        return HealthResponse(status="UP", service=settings.service_name, model=settings.ollama_model)
    finally:
        logger.info(
            "AI endpoint timing path=/health requestParsingMs=0.0 totalMs=%.1f",
            (perf_counter() - started_at) * 1000,
        )


@app.post("/ai/ingest", response_model=IngestResponse)
def ingest() -> IngestResponse:
    started_at = perf_counter()
    status = "success"
    try:
        result = rag_service.ingest()
        return IngestResponse(**result)
    except Exception as exc:  # pragma: no cover - garde-fou runtime
        status = "error"
        raise HTTPException(status_code=500, detail=f"Ingestion error: {exc}") from exc
    finally:
        logger.info(
            "AI endpoint timing path=/ai/ingest status=%s requestParsingMs=0.0 totalMs=%.1f",
            status,
            (perf_counter() - started_at) * 1000,
        )


@app.post("/ai/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    started_at = perf_counter()
    status = "success"
    try:
        result = rag_service.ask(question=request.question, equipment_code=request.equipmentCode)
        return AskResponse(**result)
    except RuntimeError as exc:
        status = "runtime_error"
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - garde-fou runtime
        status = "error"
        raise HTTPException(status_code=500, detail=f"Ask error: {exc}") from exc
    finally:
        logger.info(
            "AI endpoint timing path=/ai/ask status=%s requestParsingMs=0.0 totalMs=%.1f",
            status,
            (perf_counter() - started_at) * 1000,
        )


@app.post("/ai/diagnosis", response_model=DiagnosisResponse)
def diagnosis(request: DiagnosisRequest) -> DiagnosisResponse:
    started_at = perf_counter()
    status = "success"
    try:
        result = rag_service.diagnosis(
            equipment_code=request.equipmentCode,
            breakdown_description=request.breakdownDescription,
        )
        return DiagnosisResponse(**result)
    except RuntimeError as exc:
        status = "runtime_error"
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - garde-fou runtime
        status = "error"
        raise HTTPException(status_code=500, detail=f"Diagnosis error: {exc}") from exc
    finally:
        logger.info(
            "AI endpoint timing path=/ai/diagnosis status=%s requestParsingMs=0.0 totalMs=%.1f",
            status,
            (perf_counter() - started_at) * 1000,
        )


@app.post("/ai/equipment-document/generate", response_model=EquipmentDocumentGenerateResponse)
def generate_equipment_document(
    request: EquipmentDocumentGenerateRequest,
) -> EquipmentDocumentGenerateResponse:
    started_at = perf_counter()
    status = "success"
    try:
        result = rag_service.generate_equipment_document(request.model_dump())
        return EquipmentDocumentGenerateResponse(**result)
    except RuntimeError as exc:
        status = "runtime_error"
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - garde-fou runtime
        status = "error"
        raise HTTPException(status_code=500, detail=f"Equipment document generation error: {exc}") from exc
    finally:
        logger.info(
            "AI endpoint timing path=/ai/equipment-document/generate status=%s requestParsingMs=0.0 totalMs=%.1f",
            status,
            (perf_counter() - started_at) * 1000,
        )
