import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

function RotatingMesh({ position, color, scale }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <Sphere args={[1, 32, 32]}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          distort={0.4}
          speed={2}
        />
      </Sphere>
    </mesh>
  );
}

export default function FloatingShapes() {
  return (
    <Canvas className="absolute inset-0 -z-10" camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#1e90ff" />
      <pointLight position={[-10, -10, 10]} intensity={0.3} color="#a855f7" />

      <RotatingMesh position={[-2, 1, -3]} color="#1e90ff" scale={1.2} />
      <RotatingMesh position={[2, -1, -2]} color="#a855f7" scale={0.9} />
      <RotatingMesh position={[0, 0, -4]} color="#06b6d4" scale={1.5} />
    </Canvas>
  );
}
