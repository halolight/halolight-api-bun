.PHONY: help dev build start install db-generate db-migrate db-push db-studio db-seed docker-build docker-up docker-down docker-logs clean test lint format

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	bun install

dev: ## Start development server
	bun run dev

build: ## Build for production
	bun run build

start: ## Start production server
	bun run start

db-generate: ## Generate Drizzle schema
	bun run db:generate

db-migrate: ## Run database migrations
	bun run db:migrate

db-push: ## Push schema to database
	bun run db:push

db-studio: ## Open Drizzle Studio
	bun run db:studio

db-seed: ## Seed database
	bun run db:seed

docker-build: ## Build Docker image
	docker-compose build

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

test: ## Run tests
	bun test

lint: ## Run linter
	bun run lint

format: ## Format code
	bun run format

clean: ## Clean build artifacts
	rm -rf dist node_modules coverage
