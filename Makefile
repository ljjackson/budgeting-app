.PHONY: dev dev-backend dev-frontend build test

dev-backend:
	cd backend && go run main.go

dev-frontend:
	cd frontend && npm run dev

dev:
	make dev-backend & make dev-frontend & wait

build:
	cd backend && go build -o ../dist/server main.go
	cd frontend && npm run build

test:
	cd backend && go test ./...
