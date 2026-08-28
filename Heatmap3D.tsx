import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Asset } from '../types';

interface Heatmap3DProps {
  assets: Asset[];
  onSelectAsset?: (asset: Asset) => void;
}

const getChangeColor = (change: number) => {
  if (change <= -3) return '#b91c1c'; // rose-700
  if (change < -0.5) return '#fb7185'; // rose-400
  if (Math.abs(change) <= 0.5) return '#52525b'; // zinc-600
  if (change <= 3) return '#34d399'; // emerald-400
  return '#10b981'; // emerald-500
};

function AssetCube({ asset, position, onSelectAsset }: { asset: Asset; position: [number, number, number], onSelectAsset?: (asset: Asset) => void }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Height based on relative weighting (mocking market cap/volume representation)
  // Let's make height between 0.2 and 3
  const height = Math.max(0.2, Math.min(3, (asset.marketCap || 100) / 500));
  const color = getChangeColor(asset.change);
  
  const targetScale = hovered ? 1.05 : 1;
  const targetY = position[1] + height / 2 + (hovered ? 0.2 : 0);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, 1, targetScale), 0.1);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onSelectAsset?.(asset); }}
      >
        <boxGeometry args={[0.9, height, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* 3D Text Label on top of the cube */}
      <Text
        position={[0, height + 0.1 + (hovered ? 0.2 : 0), 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {asset.symbol}
      </Text>

      {/* HTML Tooltip on hover */}
      {hovered && (
        <Html position={[0, height + 0.5, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-zinc-950/90 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 text-white text-[10px] p-2 rounded-lg font-mono shadow-2xl whitespace-nowrap pointer-events-none backdrop-blur-md">
            <div className="font-bold text-xs">{asset.symbol} - {asset.name}</div>
            <div className={`mt-1 font-bold ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
            </div>
            <div className="text-zinc-400">Price: {asset.price.toFixed(2)}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function Heatmap3D({ assets, onSelectAsset }: Heatmap3DProps) {
  // Sort assets by market cap and only take top 100 to avoid clutter and performance issues
  const displayAssets = useMemo(() => {
    return [...assets].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)).slice(0, 64);
  }, [assets]);

  // Create a grid layout constraint
  const gridSize = Math.ceil(Math.sqrt(displayAssets.length));
  
  const gridSpacing = 1.2;
  const offsetX = (gridSize * gridSpacing) / 2;
  const offsetZ = (gridSize * gridSpacing) / 2;

  return (
    <div className="w-full h-full min-h-[500px] relative bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-zinc-700/80 transition-colors duration-300 shadow-2xl">
      <Canvas shadows camera={{ position: [0, 8, 10], fov: 45 }}>
        <fog attach="fog" args={['#09090b', 10, 25]} />
        <ambientLight intensity={0.4} />
        <directionalLight 
          castShadow 
          position={[10, 15, 10]} 
          intensity={1.2} 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#3b82f6" />
        
        <group position={[-offsetX + gridSpacing/2, 0, -offsetZ + gridSpacing/2]}>
          {displayAssets.map((asset, index) => {
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            return (
              <AssetCube 
                key={asset.symbol} 
                asset={asset} 
                position={[col * gridSpacing, 0, row * gridSpacing]}
                onSelectAsset={onSelectAsset}
              />
            );
          })}
        </group>

        {/* Base Grid Plate */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[gridSize * gridSpacing + 4, gridSize * gridSpacing + 4]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} metalness={0.2} />
        </mesh>
        
        <gridHelper args={[gridSize * gridSpacing + 4, gridSize * gridSpacing + 4, '#27272a', '#18181b']} position={[0, 0, 0]} />

        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2 - 0.05} // don't go below ground
          minDistance={5}
          maxDistance={30}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      <div className="absolute top-4 left-4 pointer-events-none">
        <h3 className="text-xs font-bold text-zinc-300 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          3D Market Topography
        </h3>
        <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">
          Height represents market weight. Color represents 24h performance. Drag to rotate landscape.
        </p>
      </div>
    </div>
  );
}
