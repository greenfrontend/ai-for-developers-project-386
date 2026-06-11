### Hexlet tests and linter status:
[![Actions Status](https://github.com/greenfrontend/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/greenfrontend/ai-for-developers-project-386/actions)

# Booking UI

This project is an npm monorepo with a TypeSpec API contract and a Vite
frontend.

## Workspaces

- `contracts` contains the TypeSpec contract and generated OpenAPI document.
- `backend` contains the Fastify + Drizzle + PostgreSQL API implementation.
- `frontend` contains the Vite + React + TypeScript + Mantine UI.

## Install

Install dependencies from the repository root:

```sh
npm install
```

## Generate contract artifacts

Generate the OpenAPI specification:

```sh
npm run contracts:build
```

The generated file is written to `contracts/generated/openapi.yaml`.

Generate the frontend SDK from the contract:

```sh
npm run frontend:generate-api
```

## Development

Start PostgreSQL and apply the backend schema:

```sh
docker compose up -d postgres
npm run backend:db:migrate
```

Run the backend API:

```sh
npm run backend:dev
```

Alternatively, run the Prism mock API instead of the backend:

```sh
npm run contracts:mock
```

Run the frontend:

```sh
npm run frontend:dev
```

The frontend uses `VITE_API_BASE_URL` for API calls and defaults to
`http://localhost:4010`.
