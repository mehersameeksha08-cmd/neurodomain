import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Furniture({ devices = {} }) {
  const bulb = useRef();
  const bulbGlass = useRef();
  const door = useRef();
  const leftWindow = useRef();
  const rightWindow = useRef();
  const tvScreen = useRef();
  const radioLight = useRef();
  const phoneLight = useRef();

  useFrame((_, delta) => {
    const lightOn = Boolean(devices.light);
    if (bulb.current) bulb.current.intensity = THREE.MathUtils.damp(bulb.current.intensity, lightOn ? 4.2 : 0, 3, delta);
    if (bulbGlass.current) bulbGlass.current.emissiveIntensity = THREE.MathUtils.damp(bulbGlass.current.emissiveIntensity, lightOn ? 2.5 : 0.05, 3, delta);
    if (door.current) door.current.rotation.y = THREE.MathUtils.damp(door.current.rotation.y, devices.door ? -Math.PI / 2.15 : 0, 2.6, delta);
    if (leftWindow.current) leftWindow.current.rotation.y = THREE.MathUtils.damp(leftWindow.current.rotation.y, devices.window ? 0.8 : 0, 2.5, delta);
    if (rightWindow.current) rightWindow.current.rotation.y = THREE.MathUtils.damp(rightWindow.current.rotation.y, devices.window ? -0.8 : 0, 2.5, delta);
    if (tvScreen.current) tvScreen.current.emissiveIntensity = THREE.MathUtils.damp(tvScreen.current.emissiveIntensity, devices.tv ? 1.5 : 0.03, 3, delta);
    if (radioLight.current) radioLight.current.emissiveIntensity = THREE.MathUtils.damp(radioLight.current.emissiveIntensity, devices.radio ? 1 : 0.05, 3, delta);
    if (phoneLight.current) phoneLight.current.emissiveIntensity = THREE.MathUtils.damp(phoneLight.current.emissiveIntensity, devices.telephone ? 1.1 : 0.05, 3, delta);
  });

  const mat = (color, roughness = 0.75) => <meshStandardMaterial color={color} roughness={roughness} />;
  const wood = "#70472f";

  return (
    <>
      {/* Floor and open-front room shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />{mat("#9a8069")}
      </mesh>
      <mesh position={[-4.45, 1.7, -3.9]} receiveShadow><boxGeometry args={[1.1, 3.5, 0.18]} />{mat("#e8dfd2")}</mesh>
      <mesh position={[0.35, 1.7, -3.9]} receiveShadow><boxGeometry args={[3.2, 3.5, 0.18]} />{mat("#e8dfd2")}</mesh>
      <mesh position={[4.55, 1.7, -3.9]} receiveShadow><boxGeometry args={[0.9, 3.5, 0.18]} />{mat("#e8dfd2")}</mesh>
      <mesh position={[-4.9, 1.7, 0]} receiveShadow><boxGeometry args={[0.18, 3.5, 8]} />{mat("#d7d1c8")}</mesh>
      <mesh position={[0, 3.45, -1.8]}><boxGeometry args={[9.8, 0.12, 4.2]} />{mat("#eee7dd")}</mesh>

      {/* Hanging warm bulb */}
      <mesh position={[0, 3.23, 0]}><cylinderGeometry args={[0.025, 0.025, 0.34, 12]} />{mat("#28282a", 0.35)}</mesh>
      <mesh position={[0, 3.02, 0]}><cylinderGeometry args={[0.14, 0.11, 0.16, 24]} />{mat("#343033", 0.3)}</mesh>
      <mesh position={[0, 2.75, 0]}><sphereGeometry args={[0.23, 24, 20]} /><meshStandardMaterial ref={bulbGlass} color="#fff0ba" emissive="#ffb94f" emissiveIntensity={0.05} roughness={0.18} metalness={0.08} /></mesh>
      <mesh position={[0, 2.75, 0]}><cylinderGeometry args={[0.07, 0.07, 0.28, 12]} /><meshStandardMaterial color="#f9c96a" emissive="#ffb52f" emissiveIntensity={devices.light ? 1.8 : 0.1} /></mesh>
      <pointLight ref={bulb} position={[0, 2.7, 0]} color="#ffd18a" intensity={0} distance={10} decay={1.7} />

      {/* Window: outdoor view, hinged panes and curtains */}
      <mesh position={[-2.35, 2.1, -3.78]}><boxGeometry args={[2.55, 1.72, 0.14]} />{mat("#553c2d", 0.4)}</mesh>
      <mesh position={[-2.35, 2.1, -3.685]}><boxGeometry args={[2.3, 1.48, 0.025]} /><meshBasicMaterial color="#8bcdf1" /></mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[-3.15 + i * 0.5, 1.55 + (i % 2) * 0.1, -3.64]}><sphereGeometry args={[0.28, 12, 10]} /><meshBasicMaterial color={i % 2 ? "#3c9660" : "#66ad70"} /></mesh>)}
      {/* Window panels pivot from their outside edges */}
      <group position={[-3.47, 2.1, -3.57]} ref={leftWindow}>
        <mesh position={[0.56, 0, 0]}><boxGeometry args={[1.08, 1.38, 0.055]} /><meshPhysicalMaterial color="#9fe4ff" roughness={0.14} transparent opacity={0.42} /></mesh>
        <mesh position={[0.56, 0, 0.04]}><boxGeometry args={[0.045, 1.38, 0.07]} />{mat("#eee7dc", 0.4)}</mesh>
        <mesh position={[0.56, 0, 0.04]}><boxGeometry args={[1.08, 0.045, 0.07]} />{mat("#eee7dc", 0.4)}</mesh>
      </group>
      <group position={[-1.23, 2.1, -3.57]} ref={rightWindow}>
        <mesh position={[-0.56, 0, 0]}><boxGeometry args={[1.08, 1.38, 0.055]} /><meshPhysicalMaterial color="#9fe4ff" roughness={0.14} transparent opacity={0.42} /></mesh>
        <mesh position={[-0.56, 0, 0.04]}><boxGeometry args={[0.045, 1.38, 0.07]} />{mat("#eee7dc", 0.4)}</mesh>
        <mesh position={[-0.56, 0, 0.04]}><boxGeometry args={[1.08, 0.045, 0.07]} />{mat("#eee7dc", 0.4)}</mesh>
      </group>
      {[-3.75, -0.95].map((x) => <mesh key={x} position={[x, 2.12, -3.43]}><boxGeometry args={[0.25, 1.88, 0.14]} />{mat("#b66e6a")}</mesh>)}
      <mesh position={[-2.35, 1.25, -3.48]}><boxGeometry args={[2.65, 0.12, 0.24]} />{mat("#f4eee5", 0.4)}</mesh>

      {/* Door frame and open doorway */}
      <mesh position={[2.94, 1.35, -3.78]}><boxGeometry args={[0.12, 2.78, 0.12]} />{mat("#f4eee5", 0.4)}</mesh>
      <mesh position={[4.16, 1.35, -3.78]}><boxGeometry args={[0.12, 2.78, 0.12]} />{mat("#f4eee5", 0.4)}</mesh>
      <mesh position={[3.55, 2.74, -3.78]}><boxGeometry args={[1.34, 0.12, 0.12]} />{mat("#f4eee5", 0.4)}</mesh>
      <group ref={door} position={[2.97, 1.35, -3.62]}>
        <mesh position={[0.56, 0, 0]} castShadow><boxGeometry args={[1.1, 2.62, 0.09]} />{mat("#815238", 0.45)}</mesh>
        <mesh position={[0.56, 0, 0.052]}><boxGeometry args={[0.9, 2.39, 0.025]} />{mat("#a16d49", 0.55)}</mesh>
        <mesh position={[0.94, 0, 0.09]}><sphereGeometry args={[0.065, 16, 16]} /><meshStandardMaterial color="#f5ca70" metalness={0.75} roughness={0.25} /></mesh>
      </group>
      {/* Dark floor beyond doorway: no wall blocking the view */}
      <mesh position={[3.55, 0.005, -4.65]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.1, 1.6]} /><meshBasicMaterial color="#222a31" /></mesh>

      {/* Sofa faces the TV wall */}
      <mesh position={[-0.35, 0.32, 1.1]} castShadow><boxGeometry args={[2.75, 0.38, 1.12]} />{mat(wood)}</mesh>
      <mesh position={[-0.35, 0.77, 1.52]} castShadow><boxGeometry args={[2.75, 0.86, 0.3]} />{mat("#285579")}</mesh>
      {[-1.2, -0.35, 0.5].map((x) => <mesh key={x} position={[x, 0.67, 0.97]} rotation={[0.05, 0, -0.04]} castShadow><boxGeometry args={[0.78, 0.45, 0.75]} />{mat(devices.light ? "#548ab1" : "#3977a5", 0.95)}</mesh>)}
      {[-1.68, 0.98].map((x) => <mesh key={x} position={[x, 0.48, 1.1]}><boxGeometry args={[0.22, 0.68, 1.16]} />{mat("#244968")}</mesh>)}
      {[-1.35, 0.65].map((x) => [-0.1, 1.95].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.12, z]}><cylinderGeometry args={[0.055, 0.055, 0.2, 12]} />{mat("#3b3029")}</mesh>))}

      {/* Rug and coffee table */}
      <mesh position={[-0.15, -0.015, -0.25]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.8, 2.35]} /><meshStandardMaterial color="#d2b79d" roughness={1} /></mesh>
      <mesh position={[-0.15, 0.47, -0.25]} castShadow><boxGeometry args={[1.65, 0.12, 0.82]} />{mat("#8c5a3b", 0.35)}</mesh>
      {[-0.82, 0.52].map((x) => [-0.53, 0.03].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.24, -0.25 + z]}><boxGeometry args={[0.07, 0.42, 0.07]} />{mat("#59402e")}</mesh>))}

      {/* Wider TV sideboard, shifted left; radio and telephone sit on top */}
      <mesh position={[0.9, 0.34, -3.05]} castShadow><boxGeometry args={[3.25, 0.48, 0.62]} />{mat("#65432f", 0.5)}</mesh>
      <mesh position={[0.9, 0.61, -2.99]}><boxGeometry args={[3.12, 0.08, 0.58]} />{mat("#8a6042", 0.42)}</mesh>
      {[-0.25, 0.85, 1.95].map((x) => <mesh key={x} position={[x, 0.36, -2.72]}><boxGeometry args={[0.035, 0.35, 0.025]} />{mat("#c49a72")}</mesh>)}
      <mesh position={[0.55, 1.2, -3.34]}><boxGeometry args={[1.68, 1.05, 0.12]} />{mat("#141b24", 0.25)}</mesh>
      <mesh position={[0.55, 1.2, -3.265]}><boxGeometry args={[1.49, 0.85, 0.025]} /><meshStandardMaterial ref={tvScreen} color={devices.tv ? "#174e86" : "#03070c"} emissive="#248bff" emissiveIntensity={0.03} roughness={0.12} /></mesh>

      {/* Retro radio resting on the sideboard */}
      <mesh position={[1.95, 0.79, -2.76]} castShadow><boxGeometry args={[0.78, 0.38, 0.42]} />{mat("#8b5836", 0.42)}</mesh>
      <mesh position={[1.95, 0.80, -2.535]}><boxGeometry args={[0.7, 0.28, 0.025]} /><meshStandardMaterial ref={radioLight} color="#30343a" emissive="#38d8b0" emissiveIntensity={0.05} /></mesh>
      <mesh position={[1.78, 0.8, -2.515]}><boxGeometry args={[0.3, 0.22, 0.012]} />{mat("#242b31", 0.3)}</mesh>
      {[-0.02, 0.12, 0.26].map((dx) => <mesh key={dx} position={[1.95 + dx, 0.72, -2.51]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.032, 0.032, 0.025, 16]} />{mat("#d6c8a7", 0.3)}</mesh>)}
      <mesh position={[1.95, 1.02, -2.76]}><cylinderGeometry args={[0.012, 0.012, 0.48, 8]} />{mat("#c8cbd0", 0.3)}</mesh>

      {/* Classic telephone resting on the sideboard */}
      <mesh position={[-0.48, 0.73, -2.76]} castShadow><boxGeometry args={[0.66, 0.16, 0.44]} /><meshStandardMaterial ref={phoneLight} color="#28252a" roughness={0.32} emissive="#8c70ff" emissiveIntensity={0.04} /></mesh>
      <mesh position={[-0.48, 0.825, -2.76]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.14, 0.14, 0.025, 32]} />{mat("#b28a48", 0.3)}</mesh>
      <mesh position={[-0.48, 0.843, -2.76]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.018, 32]} />{mat("#42332a", 0.4)}</mesh>
      {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <mesh key={i} position={[-0.48 + Math.cos(a) * 0.105, 0.86, -2.76 + Math.sin(a) * 0.105]}><sphereGeometry args={[0.012, 10, 8]} />{mat("#f0d28b", 0.3)}</mesh>; })}
      <mesh position={[-0.48, 0.99, -2.76]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.055, 0.34, 6, 12]} /><meshStandardMaterial color="#29262d" emissive="#8c70ff" emissiveIntensity={devices.telephone ? 0.8 : 0.04} roughness={0.3} /></mesh>
      {[-0.23, 0.23].map((dx) => <mesh key={dx} position={[-0.48 + dx, 0.99, -2.76]} rotation={[0, 0, dx > 0 ? -0.4 : 0.4]}><capsuleGeometry args={[0.06, 0.1, 6, 12]} /><meshStandardMaterial color="#d4b9ff" emissive="#8c70ff" emissiveIntensity={devices.telephone ? 0.8 : 0.04} /></mesh>)}

      {/* Floor plant */}
      <mesh position={[-3.8, 0.25, -1.65]}><cylinderGeometry args={[0.2, 0.26, 0.48, 24]} />{mat("#a36e4c")}</mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} position={[-3.8 + Math.sin(i * 1.25) * 0.25, 0.67 + (i % 2) * 0.15, -1.65 + Math.cos(i * 1.25) * 0.18]} rotation={[0.2, i * 0.8, (i - 2) * 0.16]}><sphereGeometry args={[0.22, 16, 12]} /><meshStandardMaterial color={i % 2 ? "#367650" : "#559568"} roughness={0.85} /></mesh>)}
    </>
  );
}

export default function RealHome3D({ devices = {} }) {
  return (
    <div style={{ width: "100%", height: "min(72vh, 680px)", minHeight: 440, borderRadius: 18, overflow: "hidden" }}>
      <Canvas shadows camera={{ position: [7.5, 5.7, 9.5], fov: 42 }} gl={{ antialias: true }}>
        <color attach="background" args={["#101722"]} />
        <fog attach="fog" args={["#101722", 12, 23]} />
        <ambientLight intensity={0.75} />
        <hemisphereLight skyColor="#e6f2ff" groundColor="#705747" intensity={0.65} />
        <directionalLight position={[-4, 8, 5]} intensity={2.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <Furniture devices={devices} />
        <OrbitControls target={[0, 1.15, -0.65]} enablePan={false} minDistance={7} maxDistance={15} maxPolarAngle={Math.PI / 2.02} />
      </Canvas>
    </div>
  );
}
