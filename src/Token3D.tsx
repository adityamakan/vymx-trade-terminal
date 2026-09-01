import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

function Coin({ color, symbol }: { color: string, symbol: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Float floatIntensity={2} speed={3} rotationIntensity={1}>
      <mesh ref={meshRef} castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.4, 64]} />
        <meshStandardMaterial 
          color={color} 
          metalness={1} 
          roughness={0.2} 
        />
        {/* Inner ring */}
        <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
           <ringGeometry args={[1.8, 2.2, 64]} />
           <meshStandardMaterial color={color} metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
           <ringGeometry args={[1.8, 2.2, 64]} />
           <meshStandardMaterial color={color} metalness={0.8} roughness={0.4} />
        </mesh>
        
        {/* Symbol Text */}
        <Text
          position={[0, 0.22, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1.2}
          color="#111"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {symbol}
        </Text>
        <Text
          position={[0, -0.22, 0]}
          rotation={[Math.PI / 2, Math.PI, 0]}
          fontSize={1.2}
          color="#111"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {symbol}
        </Text>
      </mesh>
    </Float>
  );
}

export default function Token3D({ assetType, symbol }: { assetType: string, symbol: string }) {
  // Determine color based on type
  let color = '#d4af37'; // Gold default
  let shortSymbol = symbol.substring(0, 3);
  
  if (assetType === 'crypto') {
    if (symbol.includes('BTC')) {
      color = '#F7931A';
      shortSymbol = '₿';
    } else if (symbol.includes('ETH')) {
      color = '#627EEA';
      shortSymbol = 'Ξ';
    } else {
      color = '#888888';
    }
  } else if (assetType === 'stock') {
    color = '#cbd5e1';
  } else if (assetType === 'index') {
    color = '#10b981';
  } else if (symbol === 'GC=F') {
    color = '#ffd700';
    shortSymbol = 'AU';
  } else {
    color = '#a8a29e';
  }

  return (
    <div className="w-full h-full min-h-[160px] relative pointer-events-none">
      <Canvas camera={{ position: [0, 2, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Environment preset="city" />
        <Coin color={color} symbol={shortSymbol} />
        <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={10} blur={2} far={4} />
      </Canvas>
    </div>
  );
}
