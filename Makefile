.PHONY: compile check postgres-up db-migrate e2e

compile:
	npm run contracts:build
	npm run frontend:generate-api

check:
	npm run contracts:build
	npm run frontend:generate-api
	npm run backend:generate-api
	npm run frontend:build
	npm run backend:build

postgres-up:
	docker compose up -d --wait postgres

db-migrate: postgres-up
	npm run backend:db:migrate

e2e: db-migrate
	npm run test:e2e
