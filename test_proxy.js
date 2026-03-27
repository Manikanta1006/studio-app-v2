import fs from 'fs';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

async function testProxy() {
  const url = 'http://localhost:5007/api/remote-model?url=https%3A%2F%2Fpub-a7470c7e34364419b335fd183c2476e4.r2.dev%2FLahari%2F21-03-2025-sai%2520lahari%2F21-03-2025-sai%2520lahari-occlusionfirst.stl';
  console.log('Fetching', url);
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  
  console.log('Loaded ArrayBuffer from Proxy, size:', arrayBuffer.byteLength);

  try {
    const loader = new STLLoader();
    const geometry = loader.parse(arrayBuffer);
    console.log('Geometry loaded through proxy:', !!geometry);
    console.log('Points count:', geometry.attributes.position.count);
  } catch (error) {
    console.error('Error parsing Geometry from Proxy:', error.message);
  }
}

testProxy().catch(console.error);
