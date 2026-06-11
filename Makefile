.PHONY: compile check e2e

compile:
	npm run contracts:build
	npm run frontend:generate-api

check:
	npm run contracts:build
	npm run frontend:generate-api
	npm run backend:generate-api
	npm run frontend:build
	npm run backend:build

e2e:
	npm run test:e2e
