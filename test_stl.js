import * as fs from 'fs';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

async function testSTL() {
  const url = 'https://pub-a7470c7e34364419b335fd183c2476e4.r2.dev/Lahari/21-03-2025-sai%20lahari/21-03-2025-sai%20lahari-occlusionfirst.stl';
  console.log('Fetching', url);
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  
  console.log('Loaded ArrayBuffer of size:', arrayBuffer.byteLength);

  const loader = new STLLoader();
  const geometry = loader.parse(arrayBuffer);
  
  console.log('Geometry loaded:', !!geometry);
  
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  
  if (bounds) {
    console.log('Bounds Min:', bounds.min);
    console.log('Bounds Max:', bounds.max);
    
    const size = new THREE.Vector3();
    bounds.getSize(size);
    console.log('Bounds Size:', size);
    
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    console.log('Bounds Center:', center);
    
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const scale = 4.8 / maxDimension;
    console.log('Calculated Scale:', scale);
    
    // Test the logic directly
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.scale(scale, scale, scale);
    geometry.computeBoundingBox();
    const newBounds = geometry.boundingBox;
    console.log('New Bounds Min:', newBounds?.min);
    console.log('New Bounds Max:', newBounds?.max);
    console.log('Points count:', geometry.attributes.position.count);
    
  } else {
    console.log('No bounding box found!');
  }
}

testSTL().catch(console.error);
