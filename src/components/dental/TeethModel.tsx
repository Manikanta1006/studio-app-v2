'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDentalStore } from '@/lib/store/dental-store';

// Tooth geometry generator
function createToothGeometry(toothNumber: number, jaw: 'upper' | 'lower'): THREE.BufferGeometry {
  const isUpper = jaw === 'upper';
  const isMolar = toothNumber % 8 === 0 || toothNumber % 8 === 1; // First and last teeth are molars
  
  // Base dimensions
  const width = isMolar ? 8 : 6;
  const height = isMolar ? 12 : 14;
  const depth = isMolar ? 8 : 6;
  
  const geometry = new THREE.BoxGeometry(width, height, depth, 2, 2, 2);
  
  // Add some variation
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const x = positions.getX(i);
    const z = positions.getZ(i);
    
    // Taper towards the top
    const taper = 1 - (y / height) * 0.3;
    positions.setX(i, x * taper);
    positions.setZ(i, z * taper);
    
    // Add slight curvature
    if (y > 0) {
      positions.setY(i, y + Math.sin(x * 0.5) * 0.5);
    }
  }
  
  geometry.computeVertexNormals();
  return geometry;
}

// Single tooth component
interface ToothProps {
  toothNumber: number;
  jaw: 'upper' | 'lower';
  position: [number, number, number];
  onClick?: () => void;
  isHighlighted?: boolean;
  stepOffset?: number;
}

function Tooth({ toothNumber, jaw, position, onClick, isHighlighted, stepOffset = 0 }: ToothProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const currentStep = useDentalStore((s) => s.currentStep);
  
  const geometry = useMemo(() => createToothGeometry(toothNumber, jaw), [toothNumber, jaw]);
  
  // Calculate position offset based on current step
  const stepProgress = currentStep / 17;
  const offsetX = Math.sin(stepProgress * Math.PI * 2 + toothNumber * 0.5) * stepOffset;
  const offsetZ = Math.cos(stepProgress * Math.PI * 2 + toothNumber * 0.3) * stepOffset * 0.5;
  
  // Material with highlighting
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isHighlighted ? '#14B8A6' : hovered ? '#E0E0E0' : '#FFFFFF',
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: isHighlighted ? 1 : 0.95,
    });
  }, [isHighlighted, hovered]);
  
  // Subtle animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = position[0] + offsetX;
      meshRef.current.position.z = position[2] + offsetZ;
      
      if (hovered || isHighlighted) {
        meshRef.current.scale.setScalar(1.05);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      material={material}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    />
  );
}

// Gum component
interface GumProps {
  jaw: 'upper' | 'lower';
  visible: boolean;
}

function Gum({ jaw, visible }: GumProps) {
  const isUpper = jaw === 'upper';
  
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const archWidth = 60;
    const archDepth = 30;
    const segments = 32;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = Math.PI * t;
      const x = Math.cos(angle) * archWidth - archWidth / 2;
      const z = (isUpper ? -1 : 1) * Math.sin(angle) * archDepth;
      const y = isUpper ? -5 : -25;
      
      pts.push(new THREE.Vector3(x, y, z));
    }
    
    return pts;
  }, [isUpper]);
  
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 64, 15, 16, false);
  }, [points]);
  
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#FFB6C1',
      roughness: 0.8,
      metalness: 0,
      transparent: true,
      opacity: 0.9,
    });
  }, []);
  
  if (!visible) return null;
  
  return (
    <mesh geometry={geometry} material={material} receiveShadow />
  );
}

// Main teeth model component
interface TeethModelProps {
  onToothClick?: (toothNumber: number, jaw: 'upper' | 'lower') => void;
}

export function TeethModel({ onToothClick }: TeethModelProps) {
  const showUpper = useDentalStore((s) => s.showUpper);
  const showLower = useDentalStore((s) => s.showLower);
  const highlightedTeeth = useDentalStore((s) => s.highlightedTeeth);
  const currentStep = useDentalStore((s) => s.currentStep);
  
  // Generate tooth positions for upper jaw
  const upperTeeth = useMemo(() => {
    const teeth: Array<{ num: number; pos: [number, number, number] }> = [];
    const archWidth = 50;
    
    // Right side (1-8)
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 0.1 + (Math.PI * 0.8 * i) / 7;
      const x = Math.cos(angle) * archWidth - archWidth * 0.5;
      const z = -Math.sin(angle) * 25 - 5;
      teeth.push({ num: i + 1, pos: [x, 0, z] });
    }
    
    // Left side (9-16)
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 0.1 + (Math.PI * 0.8 * i) / 7;
      const x = Math.cos(angle) * archWidth - archWidth * 0.5;
      const z = Math.sin(angle) * 25 + 5;
      teeth.push({ num: i + 9, pos: [x, 0, z] });
    }
    
    return teeth;
  }, []);
  
  // Generate tooth positions for lower jaw
  const lowerTeeth = useMemo(() => {
    const teeth: Array<{ num: number; pos: [number, number, number] }> = [];
    const archWidth = 50;
    
    // Right side (17-24)
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 0.1 + (Math.PI * 0.8 * i) / 7;
      const x = Math.cos(angle) * archWidth - archWidth * 0.5;
      const z = -Math.sin(angle) * 25 - 5;
      teeth.push({ num: i + 17, pos: [x, -30, z] });
    }
    
    // Left side (25-32)
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 0.1 + (Math.PI * 0.8 * i) / 7;
      const x = Math.cos(angle) * archWidth - archWidth * 0.5;
      const z = Math.sin(angle) * 25 + 5;
      teeth.push({ num: i + 25, pos: [x, -30, z] });
    }
    
    return teeth;
  }, []);
  
  // Step-based movement offset
  const stepOffset = currentStep * 0.3;
  
  return (
    <group>
      {/* Upper jaw */}
      {showUpper && (
        <>
          <Gum jaw="upper" visible={showUpper} />
          {upperTeeth.map(({ num, pos }) => (
            <Tooth
              key={`upper-${num}`}
              toothNumber={num}
              jaw="upper"
              position={pos}
              isHighlighted={highlightedTeeth.includes(num)}
              stepOffset={stepOffset}
              onClick={() => onToothClick?.(num, 'upper')}
            />
          ))}
        </>
      )}
      
      {/* Lower jaw */}
      {showLower && (
        <>
          <Gum jaw="lower" visible={showLower} />
          {lowerTeeth.map(({ num, pos }) => (
            <Tooth
              key={`lower-${num}`}
              toothNumber={num}
              jaw="lower"
              position={pos}
              isHighlighted={highlightedTeeth.includes(num)}
              stepOffset={stepOffset}
              onClick={() => onToothClick?.(num, 'lower')}
            />
          ))}
        </>
      )}
    </group>
  );
}
