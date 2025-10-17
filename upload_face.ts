#!/usr/bin/env tsx
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './src/declarations/lain_art_backend/lain_art_backend.did.js';
import { readFileSync } from 'fs';

// Configuration
const IC_HOST = 'https://ic0.app';
const CANISTER_ID = 'kfp4o-2qaaa-aaaab-qcmsa-cai';

async function uploadFace(imagePath: string, label: string) {
  console.log(`Uploading face from ${imagePath} with label "${label}"...`);

  // Read the image file
  const imageData = readFileSync(imagePath);
  console.log(`Image size: ${imageData.length} bytes`);

  // Create agent
  const agent = new HttpAgent({ host: IC_HOST });

  // Create actor
  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId: CANISTER_ID,
  });

  try {
    // Call the add method
    const result = await actor.add(label, Uint8Array.from(imageData));
    
    if ('Ok' in result) {
      console.log('✅ Face uploaded successfully!');
      
      // Verify it was added
      const faceCount = await actor.get_face_count();
      const storedFaces = await actor.list_stored_faces();
      console.log(`Total faces in database: ${faceCount}`);
      console.log(`Stored face labels:`, storedFaces);
    } else if ('Err' in result) {
      console.error('❌ Error uploading face:', result.Err);
    }
  } catch (error) {
    console.error('❌ Exception during upload:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: npx tsx upload_face.ts <image_path> [label]');
  console.error('Example: npx tsx upload_face.ts laindb/01.png Lain');
  process.exit(1);
}

const imagePath = args[0];
const label = args[1] || 'Lain';

uploadFace(imagePath, label);
