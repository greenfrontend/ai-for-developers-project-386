.PHONY: compile check

compile:
	npm run contracts:build
	npm run frontend:generate-api

check:
	npm run contracts:build
	npm run frontend:generate-api
	npm run frontend:build
