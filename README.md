### Hexlet tests and linter status:
[![Actions Status](https://github.com/greenfrontend/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/greenfrontend/ai-for-developers-project-386/actions)

# Event Types API

This project uses TypeSpec as the source of truth for the API contract. TypeSpec
keeps the API description compact and generates the OpenAPI specification from
that source.

## Generate OpenAPI

Install dependencies:

```sh
npm install
```

Generate the OpenAPI specification:

```sh
npm run generate:openapi
```

The generated file is written to
`tsp-output/@typespec/openapi3/openapi.yaml`.
