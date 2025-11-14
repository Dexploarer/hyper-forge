#!/bin/bash
# Migration script to run on Railway
cd /app/packages/core
bun server/scripts/migrate-media-to-cdn.ts
