# lain-art: Copilot AI Agent Instructions

## Project Overview
- **lain-art** is a decentralized art platform on the Internet Computer (ICP) where users upload Lain-inspired artwork, which is verified for authenticity and rewarded with crypto and NFTs.
- The project is split into:
  - **Backend**: Rust canister (`lain_art_backend`) for model-based face detection/recognition, submission, verification, and reward logic.
  - **Frontend**: Astro-based web UI (`lain_art_frontend`) with TypeScript, using DFINITY's AuthClient and agent libraries for canister interaction.

## Key Architecture & Data Flow
- **User Flow**: Authenticate (Internet Identity) → Upload artwork (frontend) → Chunked upload to backend canister → Verification (AI/DB) → Reward/NFT.
- **Backend**: Rust canister exposes Candid API (see `lain_art_backend.did`). Handles chunked uploads, model setup, and verification. Model files are managed via stable memory and loaded at runtime.
- **Frontend**: Uses generated actor bindings (`src/declarations/lain_art_backend/`). Handles authentication, file chunking, and calls backend methods directly from browser.
- **Model Management**: Large ONNX models are uploaded in chunks via shell scripts and canister methods. See `upload_model_to_canister.sh`.

## Developer Workflows
- **Local Dev**:
  - Start local replica: `dfx start --background`
  - Deploy canisters: `dfx deploy`
  - Frontend dev server: `npm run dev` (in `icp/src/lain_art_frontend/`)
- **Model Upload**:
  - Download model: `./download_face_detection_model.sh`
  - Upload to canister: `./upload_model_to_canister.sh`
- **Testing**: No formal test suite detected; use browser and console logs for manual verification.

## Project-Specific Conventions
- **Canister IDs**: Hardcoded in `src/declarations/lain_art_backend/index.js` for production. Update if redeploying.
- **Chunked Uploads**: All large files (art, models) are uploaded in 1MB chunks. See `src/scripts/upload.ts` and backend methods (`put_chunk`, `append_*_model_bytes`).
- **Authentication**: Always use DFINITY AuthClient (`lib/auth.ts`). UI state is driven by authentication events.
- **Frontend-Backend Integration**: Use generated actor bindings, never call canister endpoints directly via HTTP.
- **Debugging**: In dev, actors are exposed globally for browser console inspection.

## Key Files & Directories
- `icp/src/lain_art_backend/`: Rust backend, Candid interface, model logic
- `icp/src/lain_art_frontend/`: Astro frontend, scripts, components
- `icp/src/lain_art_frontend/src/declarations/lain_art_backend/`: Actor bindings
- `upload_model_to_canister.sh`, `download_face_detection_model.sh`: Model management scripts
- `icp/dfx.json`, `icp/canister_ids.json`: Canister config and IDs

## External Integrations
- **DFINITY/ICP**: All backend logic runs as a canister on the Internet Computer.
- **ONNX Models**: Used for face detection/recognition in Rust backend.
- **Astro**: Frontend framework for static site generation and UI.

## Patterns & Gotchas
- Always check for actor method existence before calling (see `upload.ts`).
- All file uploads must be authenticated; UI disables upload if not.
- Model files must be uploaded and loaded before verification endpoints work.
- For new canister deployments, update hardcoded canister IDs in frontend bindings.

---
For more, see `README.md` (root and frontend), backend `.did` file, and shell scripts for model management.
