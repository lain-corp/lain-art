#!/usr/bin/env node
/**
 * Test script for face recognition
 * Usage: npx tsx test_recognition.ts <image_path>
 */

import { readFileSync } from 'fs';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './src/declarations/lain_art_backend/lain_art_backend.did.js';

const CANISTER_ID = 'kfp4o-2qaaa-aaaab-qcmsa-cai';
const IC_HOST = 'https://ic0.app';

async function testRecognition(imagePath: string) {
  console.log('🔍 Testing face recognition...');
  console.log(`📸 Image: ${imagePath}`);
  
  try {
    // Read image file
    const imageData = readFileSync(imagePath);
    console.log(`📦 Image size: ${imageData.length} bytes`);
    
    // Create agent
    const agent = new HttpAgent({ host: IC_HOST });
    
    // Fetch root key for local testing (only needed for local replica)
    // await agent.fetchRootKey();
    
    // Create actor
    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId: CANISTER_ID,
    });
    
    console.log('🌐 Calling recognize method...');
    console.log(`📤 Sending ${imageData.length} bytes as array...`);
    
    // Call recognize method with Uint8Array
    let result;
    try {
      result = await (actor as any).recognize(Uint8Array.from(imageData));
    } catch (decodeError: any) {
      console.error('\n❌ Candid decoding error:', decodeError.message);
      console.error('This usually means the canister returned an unexpected format.');
      console.error('The image might be too large or the face database is empty.');
      throw decodeError;
    }
    
    console.log('\n✅ Recognition Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if ('Ok' in result) {
      const { label, score } = result.Ok;
      console.log(`\n✨ Recognized as: ${label}`);
      console.log(`📊 Confidence score: ${score} (lower is better, threshold is 0.85)`);
      
      if (score < 0.3) {
        console.log('🎯 Excellent match!');
      } else if (score < 0.6) {
        console.log('👍 Good match!');
      } else if (score < 0.85) {
        console.log('⚠️  Weak match (but still recognized)');
      }
    } else if ('Err' in result) {
      console.log(`\n❌ Recognition failed: ${result.Err}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npx ts-node test_recognition.ts <image_path>');
  console.log('Example: npx ts-node test_recognition.ts laindb/02.png');
  process.exit(1);
}

testRecognition(args[0]);
