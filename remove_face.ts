#!/usr/bin/env tsx
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './src/declarations/lain_art_backend/lain_art_backend.did.js';

// Configuration
const IC_HOST = 'https://ic0.app';
const CANISTER_ID = 'kfp4o-2qaaa-aaaab-qcmsa-cai';

async function removeFace(label: string) {
  console.log(`Removing face with label "${label}"...`);

  // Create agent
  const agent = new HttpAgent({ host: IC_HOST });

  // Create actor
  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId: CANISTER_ID,
  });

  try {
    // Get face count before
    const beforeCount = await actor.get_face_count();
    const beforeFaces = await actor.list_stored_faces();
    console.log(`\nBefore removal:`);
    console.log(`  Total faces: ${beforeCount}`);
    console.log(`  Face labels:`, beforeFaces);

    // Remove the face
    await actor.remove_face(label);
    console.log(`\n✅ Face "${label}" removed successfully!`);

    // Get face count after
    const afterCount = await actor.get_face_count();
    const afterFaces = await actor.list_stored_faces();
    console.log(`\nAfter removal:`);
    console.log(`  Total faces: ${afterCount}`);
    console.log(`  Face labels:`, afterFaces);
  } catch (error) {
    console.error('❌ Exception during removal:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: npx tsx remove_face.ts <label>');
  console.error('Example: npx tsx remove_face.ts TestFace');
  process.exit(1);
}

const label = args[0];
removeFace(label);
