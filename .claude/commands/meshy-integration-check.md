---
description: Verify Meshy AI integration for 3D asset generation
---

# Meshy AI Integration Check

You are verifying the Meshy AI integration in Asset-Forge.

## Tasks

1. **Check Meshy Service**
   - Read `packages/core/server/services/mesh/MeshyService.ts` (if exists)
   - Verify API key is properly configured
   - Check error handling for API failures
   - Verify proper TypeScript types

2. **Check Environment Variables**
   - Verify `MESHY_API_KEY` is documented in `.env.example`
   - Check if key is properly loaded in server code

3. **Check API Routes**
   - Find routes that use Meshy service
   - Verify TypeBox validation for generation requests
   - Check proper error responses
   - Verify Swagger documentation

4. **Check Database Schema**
   - Verify tables for storing generation tasks
   - Check for status tracking (PENDING, PROCESSING, COMPLETE, FAILED)
   - Verify storage of generated asset URLs

5. **Test Flow**
   - Verify text-to-3D workflow
   - Verify image-to-3D workflow
   - Check preview and refine capabilities
   - Verify asset download and storage

6. **Report Findings**
   - List integration status
   - Document any missing pieces
   - Suggest improvements
   - Provide code examples for fixes

## Success Criteria

- Meshy API properly integrated
- Environment variables configured
- Database schema supports generation tracking
- Error handling implemented
- TypeScript types defined
- Tests written (no mocks!)
