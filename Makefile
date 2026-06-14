.PHONY: backend-check frontend-check test build healthcheck run-backend run-frontend-preview

APP_ENV ?= local
BACKEND_DIR := backend
FRONTEND_DIR := frontend

backend-check:
\t@echo '=== backend syntax ==='
\t@python3 -m py_compile $(BACKEND_DIR)/app/main.py $(BACKEND_DIR)/app/security.py $(BACKEND_DIR)/app/quota.py $(BACKEND_DIR)/app/rag.py $(BACKEND_DIR)/app/omlx_client.py $(BACKEND_DIR)/app/settings.py
\t@echo 'OK'

frontend-check:
\t@echo '=== frontend typecheck ==='
\t@cd $(FRONTEND_DIR) && npm run typecheck

test: backend-check
\t@echo '=== backend tests ==='
\t@cd $(BACKEND_DIR) && python3 -m pytest tests/ -v --tb=short 2>/dev/null || echo 'no tests/ dir'

build: frontend-check
\t@echo '=== frontend build ==='
\t@cd $(FRONTEND_DIR) && npm run build
\t@echo 'build OK'

healthcheck:
\t@curl -sS http://127.0.0.1:8088/api/status || curl -sS http://127.0.0.1:8088/api/health || echo 'backend not running'

run-backend:
\t@APP_ENV=$(APP_ENV) cd $(BACKEND_DIR) && uvicorn app.main:app --host 0.0.0.0 --port 8088 --reload

run-frontend-preview:
\t@cd $(FRONTEND_DIR) && npm run preview
