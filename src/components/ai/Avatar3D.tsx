// src/components/ai/Avatar3D.tsx
"use client";
import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';

export type AvatarAction = 'idle' | 'talking' | 'waving' | 'pointing' | 'thinking'; // Add more as needed

interface Avatar3DProps {
  action: AvatarAction;
  isVisible: boolean;
  // You might add props for position, scale, rotation if needed
}

const Model: React.FC<{ action: AvatarAction; modelPath: string }> = ({ action, modelPath }) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath);
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    console.log("Avatar3D Model: Action prop changed to:", action);
    console.log("Avatar3D Model: Available animations:", Object.keys(actions));

    const currentAction = actions[action];
    if (currentAction) {
      // Fade out other actions and fade in the new one
      Object.values(actions).forEach(act => {
        if (act && act !== currentAction) {
          act.fadeOut(0.5);
        }
      });
      currentAction.reset().fadeIn(0.5).play();
    } else if (actions.idle) { // Fallback to idle if specific action not found
      console.warn(`Avatar3D Model: Action "${action}" not found, falling back to idle.`);
      Object.values(actions).forEach(act => {
        if (act && act !== actions.idle) {
          act.fadeOut(0.5);
        }
      });
      actions.idle.reset().fadeIn(0.5).play();
    } else {
      console.warn(`Avatar3D Model: Action "${action}" and fallback "idle" not found.`);
    }

    // Cleanup function to stop all animations when the component unmounts or action changes
    return () => {
      if (mixer) { // Check if mixer exists
        // mixer.stopAllAction(); // Or fade out current action
         if (actions[action]) actions[action]?.fadeOut(0.5);
         else if (actions.idle) actions.idle?.fadeOut(0.5);
      }
    };
  }, [action, actions, mixer]);

  // Adjust scale and position as needed for your model
  return <primitive ref={group} object={scene} scale={1.8} position={[0, -1.7, 0]} />;
};

const Avatar3D: React.FC<Avatar3DProps> = ({ action, isVisible }) => {
  if (!isVisible) return null;

  // IMPORTANT: Replace 'chakradhar-avatar.glb' with your actual model's filename
  const modelPath = '/models/chakradhar-avatar.glb'; 

  return (
    <div className="fixed bottom-0 right-0 w-64 h-96 z-50 pointer-events-none md:w-80 md:h-[480px]"> {/* Adjust size as needed */}
      <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 3, 5]} intensity={2.5} />
        <Suspense fallback={null}> {/* Add a fallback for model loading */}
          <Model action={action} modelPath={modelPath} />
        </Suspense>
        {/* OrbitControls are useful for debugging, remove for production if not needed */}
        {/* <OrbitControls />  */}
      </Canvas>
    </div>
  );
};

export default Avatar3D;
