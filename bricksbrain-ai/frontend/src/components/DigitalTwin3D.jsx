import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCcw, Maximize2 } from "lucide-react";

/**
 * Interactive 3D Digital Twin of a property using Three.js.
 * Procedurally generates a simple multi-room apartment/villa massing model
 * (walls, floors, roof, windows) scaled by bhk/areaSqft, with orbit-style
 * mouse-drag rotation, zoom, and an auto-rotate toggle — a lightweight,
 * dependency-free stand-in for a full BIM/CAD digital twin.
 */
export default function DigitalTwin3D({ bhk = 2, areaSqft = 1000, propertyType = "Apartment" }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(9, 7, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(8, 12, 6);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffe8d6, 0.3);
    fillLight.position.set(-6, 4, -6);
    scene.add(fillLight);

    // Ground / plot
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xdcdfe3 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    // Building group
    const building = new THREE.Group();

    const roomsPerSide = Math.max(1, Math.ceil(Math.sqrt(bhk)));
    const roomSize = 2.4;
    const floorHeight = 2.6;
    const numFloors = propertyType === "Villa" ? 2 : Math.min(3, Math.max(1, Math.round(areaSqft / 1200)));

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf4a89f });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b3a3a });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.75 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const buildingWidth = roomsPerSide * roomSize;
    const buildingDepth = roomsPerSide * roomSize;

    for (let f = 0; f < numFloors; f++) {
      const floorGroup = new THREE.Group();
      const wallGeo = new THREE.BoxGeometry(buildingWidth, floorHeight, buildingDepth);
      const wallEdges = new THREE.Mesh(wallGeo, wallMat);
      wallEdges.position.y = f * floorHeight + floorHeight / 2;
      floorGroup.add(wallEdges);

      // Floor slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(buildingWidth + 0.2, 0.15, buildingDepth + 0.2), floorMat);
      slab.position.y = f * floorHeight;
      floorGroup.add(slab);

      // Windows around perimeter
      const winSize = 0.6;
      for (let i = 0; i < roomsPerSide; i++) {
        const wx = -buildingWidth / 2 + roomSize * i + roomSize / 2;
        const win1 = new THREE.Mesh(new THREE.BoxGeometry(winSize, winSize, 0.05), windowMat);
        win1.position.set(wx, f * floorHeight + floorHeight / 2, buildingDepth / 2 + 0.01);
        floorGroup.add(win1);
        const win2 = win1.clone();
        win2.position.z = -buildingDepth / 2 - 0.01;
        floorGroup.add(win2);
      }

      building.add(floorGroup);
    }

    // Roof
    const roofHeight = 1.2;
    const roofGeo = new THREE.ConeGeometry(Math.max(buildingWidth, buildingDepth) * 0.78, roofHeight, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = numFloors * floorHeight + roofHeight / 2;
    building.add(roof);

    // Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.05), new THREE.MeshStandardMaterial({ color: 0x5c3d2e }));
    door.position.set(0, 0.8, buildingDepth / 2 + 0.02);
    building.add(door);

    scene.add(building);

    // Simple boundary trees for context
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41 });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = Math.max(buildingWidth, buildingDepth) * 1.3;
      const tx = Math.cos(angle) * r;
      const tz = Math.sin(angle) * r;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.6), trunkMat);
      trunk.position.set(tx, 0.3, tz);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), treeMat);
      leaves.position.set(tx, 0.85, tz);
      scene.add(trunk, leaves);
    }

    // Mouse drag rotation
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let rotY = Math.PI / 4, rotX = 0.5;
    const radius = 13;

    const updateCamera = () => {
      camera.position.x = radius * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = radius * Math.sin(rotX) + 3;
      camera.position.z = radius * Math.cos(rotY) * Math.cos(rotX);
      camera.lookAt(0, numFloors * floorHeight / 2, 0);
    };
    updateCamera();

    const onDown = (e) => { isDragging = true; prevX = e.clientX || e.touches?.[0]?.clientX; prevY = e.clientY || e.touches?.[0]?.clientY; };
    const onUp = () => { isDragging = false; };
    const onMove = (e) => {
      if (!isDragging) return;
      const x = e.clientX || e.touches?.[0]?.clientX;
      const y = e.clientY || e.touches?.[0]?.clientY;
      rotY -= (x - prevX) * 0.006;
      rotX = Math.max(0.15, Math.min(1.3, rotX + (y - prevY) * 0.004));
      prevX = x; prevY = y;
      updateCamera();
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("touchstart", onDown);
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchmove", onMove);

    stateRef.current.autoRotateRef = autoRotate;

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (stateRef.current.autoRotateRef && !isDragging) {
        rotY += 0.0025;
        updateCamera();
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", handleResize);

    stateRef.current.reset = () => { rotY = Math.PI / 4; rotX = 0.5; updateCamera(); };

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchmove", onMove);
      renderer.dispose();
    };
  }, [bhk, areaSqft, propertyType]);

  useEffect(() => {
    stateRef.current.autoRotateRef = autoRotate;
  }, [autoRotate]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-ink">Interactive 3D Digital Twin</h3>
          <p className="text-xs text-gray-500">Drag to rotate • Procedural massing model based on {bhk} BHK / {areaSqft} sqft</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAutoRotate((a) => !a)} className={`text-xs px-2 py-1 rounded border ${autoRotate ? "border-brand-600 text-brand-600" : "border-gray-300 text-gray-500"}`}>
            {autoRotate ? "Auto-rotate: On" : "Auto-rotate: Off"}
          </button>
          <button onClick={() => stateRef.current.reset && stateRef.current.reset()} className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-500 flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>
      <div ref={mountRef} className="w-full rounded-lg overflow-hidden cursor-grab active:cursor-grabbing" />
    </div>
  );
}
