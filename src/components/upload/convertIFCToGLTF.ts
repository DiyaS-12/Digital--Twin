import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { IFCLoader } from 'web-ifc-three/IFCLoader';

export async function convertIFCToGLTF(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();

  const ifcLoader = new IFCLoader();

  // ✅ Make sure your /public/wasm folder contains web-ifc.wasm etc.
  ifcLoader.ifcManager.setWasmPath('/wasm/');

  // ⛔ Do NOT call useWebWorkers — it doesn’t exist in this version.
  // ⛔ Do NOT manually parse with callbacks (new versions return Promise)
  
  // ✅ Parse IFC directly from ArrayBuffer
  const model = await ifcLoader.parse(buffer);

  const scene = new THREE.Scene();
  scene.add(model);

  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        const blob =
          result instanceof ArrayBuffer
            ? new Blob([result], { type: 'model/gltf-binary' })
            : new Blob([JSON.stringify(result)], { type: 'model/gltf+json' });

        console.log(
          `✅ GLB blob created: ${(blob.size / 1024 / 1024).toFixed(2)} MB`
        );
        resolve(blob);
      },
      (error) => {
        console.error('❌ GLTF export failed:', error);
        reject(error);
      },
      { binary: true }
    );
  });
}
