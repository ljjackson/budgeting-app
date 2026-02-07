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
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend-build /server ./server
COPY --from=frontend-build /app/frontend/dist ./static

ENV PORT=8080
ENV DB_PATH=/app/data/budget.db
ENV STATIC_DIR=/app/static
ENV GIN_MODE=release

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["./server"]
