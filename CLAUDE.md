# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RST (Rymansat Satellite Tracker) is an Electron-based desktop application for satellite tracking and antenna control. It's built with Vue 3 + TypeScript + Vuetify for the frontend (renderer process) and Node.js + TypeScript for the backend (main process).

## Development Commands

### Development
```bash
# Start development mode (builds TypeScript + runs Vite dev server + starts Electron)
npm run app:dev

# Run Vite development server only
npm run vite:dev

# Watch TypeScript compilation only
npm run watch
```

### Testing
```bash
# Run all Jest unit tests with coverage
npm run test

# Run specific test file
npm run test -- FileName_part

# Run specific test within file
npm run test -- FileName_part -t "test name"

# Run E2E tests with Playwright
npm run test:e2e
```

### Building
```bash
# Build for preview (builds Vite + compiles TypeScript + runs Electron)
npm run app:preview

# Build production app for all platforms
npm run app:build

# Platform-specific builds
npm run app:build-win
npm run app:build-mac
npm run app:build-linux

# Build frontend only
npm run vite:build

# Compile TypeScript only
npm run ts
```

### Code Formatting
```bash
# Format all code with Prettier
npm run format
```

## Architecture

### Process Structure
- **Main Process** (`src/main/`): Electron main process handling system interactions, file I/O, hardware communication
- **Renderer Process** (`src/renderer/`): Vue.js frontend for the UI
- **Common** (`src/common/`): Shared code between main and renderer processes

### Key Directories
- `src/main/service/`: Core business logic services (satellite calculations, hardware control, data management)
- `src/renderer/service/`: Frontend services for UI logic and data presentation
- `src/renderer/components/`: Vue components organized as atoms/molecules/organisms
- `src/common/model/`: TypeScript models shared between processes
- `src/__tests__/`: Jest unit tests mirroring source structure

### Main Process Services
- `StartupService.ts`: Application initialization and TLE data loading
- `ActiveSatService.ts`: Active satellite tracking and calculations
- `RotatorService.ts` / `TransceiverService.ts`: Hardware control for antenna rotators and transceivers
- `DefaultSatelliteService.ts`: Satellite data management and TLE updates

### Renderer Process Services
- `ActiveSatServiceHub.ts`: Coordinates satellite tracking in the UI
- `FrequencyTrackService.ts`: Manages Doppler frequency compensation
- `AntennaAutoTrackingService.ts`: Handles automatic antenna tracking

### Hardware Integration
The application controls:
- **Antenna Rotators**: Serial communication for antenna positioning
- **Transceivers**: Frequency control and satellite mode management
- **Location Services**: GPS/geolocation for ground station positioning

### TypeScript Configuration
- Uses path aliases: `@/*` maps to `./src/*`
- Import alias replacement: `tscpaths` converts aliases to relative paths for production builds
- Configured for both CommonJS (main process) and ES modules (renderer process)

## Testing

### Unit Tests (Jest)
- Located in `src/__tests__/` with structure mirroring source
- Uses ts-jest for TypeScript support
- Coverage reports generated automatically
- Path aliases configured via `moduleNameMapper`

### E2E Tests (Playwright)
- Located in `src/__tests__/playwright/`
- Tests full application workflows

## Development Tools

### Node Version Management
- Uses Volta for Node.js version management (configured in package.json)
- Target Node.js version: 22.18.0

### VSCode Debugging
- **Main Process**: Use "Electron: Main" configuration after building
- **Renderer Process**: Use "Electron: Renderer" configuration with app:dev running
- **Jest Tests**: Install Jest Runner extension for individual test debugging

## Build Process

1. `vite:build` - Builds the Vue frontend
2. `tsc` - Compiles TypeScript for main process
3. `app:import-replace` - Converts path aliases to relative imports using tscpaths
4. `electron-builder` - Packages the application

## Important Notes

- Log files are stored in user directory (e.g., `%APPDATA%/rst/logs/rst.log` on Windows)
- TLE (Two-Line Element) data is fetched from external sources for satellite tracking
- The application handles serial port communication for hardware control
- Uses Vuetify for UI components and Material Design icons
- Supports multiple languages through I18n service