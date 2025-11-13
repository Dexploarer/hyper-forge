# Asset Forge API Documentation

Static documentation site for the 3D Asset Forge API, powered by [Scalar](https://github.com/scalar/scalar).

## Deployment

This documentation is deployed as a separate Railway service.

### Railway Setup

1. Create a new service in Railway
2. Link to this repository
3. Set the root directory to `packages/docs`
4. Railway will automatically detect this as a static site (via `index.html` and `Staticfile`)
5. Nginx will serve the static files

### Configuration

- `index.html` - Scalar UI that fetches OpenAPI spec from API server
- `Staticfile` - Railway static site configuration
- `railway.toml` - Railway service configuration

### Environment Detection

The documentation automatically detects the environment:

- **Production**: Fetches OpenAPI spec from `https://asset-forge-production.up.railway.app/swagger/json`
- **Localhost**: Fetches from `http://localhost:3000/swagger/json` for local testing

### Local Testing

To test locally:

```bash
# Simple Python HTTP server
cd packages/docs
python -m http.server 8080

# Or with Bun
bun --port 8080 --hot index.html
```

Then open http://localhost:8080 in your browser.

### CORS Configuration

The documentation uses Scalar's proxy (`https://proxy.scalar.com`) to avoid CORS issues when fetching the OpenAPI spec from the API server.

### Customization

Edit `index.html` to customize:

- Theme colors
- Layout style
- Dark mode settings
- Authentication preferences
- Metadata and descriptions

See [Scalar Configuration](https://github.com/scalar/scalar#configuration) for all options.
