// src/components/ai/Avatar3D.tsx
"use client";
import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';

// console.log("Avatar3D.tsx: Module loading");

export type AvatarAction = 'idle' | 'talking' | 'waving' | 'pointing' | 'thinking'; // Add more as needed

interface Avatar3DProps {
  action: AvatarAction;
  isVisible: boolean;
  // modelPath: string; // Assuming model path is now fixed internally
}

const Model: React.FC<{ action: AvatarAction; modelPath: string }> = ({ action, modelPath }) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath); // Ensure your GLB path is correct
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      // console.warn("Avatar3D: No animations found in the model or actions object is empty.");
      return;
    }

    let actionToPlayKey = action as keyof typeof actions;

    // Fallback logic if the specified action doesn't exist
    if (!actions[actionToPlayKey]) {
      // console.warn(`Avatar3D: Action "${action}" not found. Trying alternatives.`);
      const alternatives = [
        action.toLowerCase(),
        action.toUpperCase(),
        action.charAt(0).toUpperCase() + action.slice(1).toLowerCase(), // TitleCase
        'idle', 'Idle', 'IDLE', // Common idle names
        'talk', 'Talk', 'TALK', 'talking_loop', // Common talk names
        'wave', 'Wave', 'WAVE',
        'point', 'Point', 'POINT'
      ];
      
      let foundAlternative = false;
      for (const alt of alternatives) {
        if (actions[alt as keyof typeof actions]) {
          actionToPlayKey = alt as keyof typeof actions;
          foundAlternative = true;
          break;
        }
      }

      if (!foundAlternative && Object.keys(actions).length > 0) {
        // console.warn(`Avatar3D: Action "${action}" and alternatives not found. Falling back to first available animation.`);
        actionToPlayKey = Object.keys(actions)[0] as keyof typeof actions;
      } else if (!foundAlternative) {
        // console.warn("Avatar3D: No suitable fallback animation found.");
        return; // No animations to play
      }
    }
    
    const animationToPlay = actions[actionToPlayKey];
    if (animationToPlay) {
      Object.values(actions).forEach(act => {
        if (act && act !== animationToPlay && act.isRunning()) {
          act.fadeOut(0.5);
        }
      });
      animationToPlay.reset().fadeIn(0.5).play();
    } else {
        // console.warn(`Avatar3D: Could not play animation for action key: ${actionToPlayKey}`);
    }

    // Cleanup on unmount or action change
    return () => {
      if (animationToPlay && animationToPlay.isRunning()) {
        animationToPlay.fadeOut(0.5);
      }
    };
  }, [action, actions, mixer]); // Include mixer in dependencies

  return <primitive ref={group} object={scene} scale={1.8} position={[0, -1.7, 0]} />;
};


const Avatar3D: React.FC<Avatar3DProps> = ({ action, isVisible }) => {
  if (!isVisible) return null;
  // console.log(`Avatar3D rendering, action: ${action}, isVisible: ${isVisible}`);

  // Path to your GLB model in the public folder
  const modelPath = '/models/chakradhar-avatar.glb'; // Ensure this path is correct

  return (
    <div className="fixed bottom-0 right-0 w-64 h-96 z-50 pointer-events-none md:w-80 md:h-[480px]"> {/* Ensure z-index is appropriate */}
      <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 3, 5]} intensity={2.5} castShadow /> {/* Corrected: removed comma */}
        <Suspense fallback={null}>
          <Model action={action} modelPath={modelPath} />
        </Suspense>
        {/* <OrbitControls /> */} {/* Uncomment for debugging */}
      </Canvas>
    </div>
  );
};
export default Avatar3D;
