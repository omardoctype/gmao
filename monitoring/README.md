# Monitoring - GMAO

This folder contains the local Prometheus and Grafana configuration used by `docker-compose.yml`.

## Services

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## Metrics sources

- Backend Spring Boot: `http://backend:8080/actuator/prometheus`
- AI Service FastAPI: `http://ai-service:8000/metrics`
- Prometheus self-monitoring: `http://prometheus:9090/metrics`

## Grafana login

Default local values are controlled by environment variables:

- `GF_SECURITY_ADMIN_USER`
- `GF_SECURITY_ADMIN_PASSWORD`

Use `.env.example` as a template and never commit real credentials.

## Important dashboards

- Platform availability.
- Backend latency and request volume.
- AI/RAG latency and request volume.
- JVM memory.
- Pod/container resources when running under Kubernetes with kube-prometheus-stack.

## Recommended alerts

- Backend down.
- AI service down.
- High 5xx error rate.
- RAG latency high.
- MySQL restart.
- High CPU or memory usage.
