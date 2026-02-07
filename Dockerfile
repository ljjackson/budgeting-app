# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN VITE_API_URL=/api npm run build

# Stage 2: Build backend
FROM golang:1.24-alpine AS backend-build
RUN apk add --no-cache gcc musl-dev
WORKDIR /app
COPY backend/go.mod backend/go.sum ./backend/
RUN cd backend && go mod download
COPY backend/ ./backend/
RUN cd backend && CGO_ENABLED=1 go build -o /server main.go

# Stage 3: Final image
FROM alpine:3.21
RUN apk add --no-cache ca-certificates wget
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=backend-build /server ./server
COPY --from=frontend-build /app/frontend/dist ./static

ENV PORT=8080
ENV DB_PATH=/app/data/budget.db
ENV STATIC_DIR=/app/static
ENV GIN_MODE=release

RUN mkdir -p /app/data && chown -R app:app /app
USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["./server"]
