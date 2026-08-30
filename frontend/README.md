# Rent Fit Radar — frontend

## Results map (Mappls Web SDK)

The detail card on the results screen plots the commute anchor and the shortlisted localities with the
[Mappls Web SDK](https://github.com/mappls-api/mappls-web-maps-js). The SDK runs in the browser, so it
needs a Mappls **browser** access token (a key restricted to your domain in the
[Mappls console](https://apps.mappls.com/console/)):

- Set `VITE_MAPPLS_TOKEN` in `.env.local` (see `.env.example`). It is read at build time; there is
  no in-app token entry, and without it the map section reports the token as missing.
- The map renders with the `mappls_jadegreen` style, requested on the SDK loader URL.

## Anchor field (Mappls Auto Suggest)

"Where do you need to be?" is a combobox backed by the [Mappls Auto Suggest API], with the chosen
place confirmed against the Place Details API. Suggestions are ranked around the renter's current
position when they allow geolocation, and each row shows the aerial distance from it.

`search.mappls.com` sends no CORS header, so the browser cannot call it directly. The dev server
proxies both lookups and adds the access token (`mappls-places` in [vite.config.ts](vite.config.ts)):

- `GET /api/places/autosuggest?q=<text>&location=<lat,lng>`
- `GET /api/places/details/<eLoc>`

A real backend must expose the same two routes in production.

[Mappls Auto Suggest API]: https://developer.mappls.com/documentation/sdk/rest-apis/mappls-maps-auto-suggest-api-example/Readme/

Localities are plotted from `spatial.location` and the anchor from `anchor.location` in the
recommendation payload (see [API_CONTRACT.md](API_CONTRACT.md)); anything without coordinates is left
off the map. Source: [src/LocalityMap.tsx](src/LocalityMap.tsx), loader in [src/mappls.ts](src/mappls.ts).

## Template notes: React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
