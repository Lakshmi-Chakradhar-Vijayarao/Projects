// src/components/ai/Avatar3D.tsx
"use client";
import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';

console.log("Avatar3D.tsx: Module loading"); 

export type AvatarAction = 'idle' | 'talking' | 'waving' | 'pointing' | 'thinking';

interface Avatar3DProps {
  action: AvatarAction;
  isVisible: boolean;
}

const Model: React.FC<{ action: AvatarAction; modelPath: string }> = ({ action, modelPath }) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath); 
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    let actionToPlay = action;
    if (!actions[actionToPlay] && actions.idle) {
      actionToPlay = 'idle';
    } else if (!actions[actionToPlay] && Object.keys(actions).length > 0) {
      actionToPlay = Object.keys(actions)[0] as AvatarAction;
    } else if (!actions[actionToPlay]) {
      return; 
    }

    const currentActionClip = actions[actionToPlay];
    if (currentActionClip) {
      Object.values(actions).forEach(act => {
        if (act && act !== currentActionClip) {
          act.fadeOut(0.5);
        }
      });
      currentActionClip.reset().fadeIn(0.5).play();
    }

    return () => {
      if (mixer && currentActionClip) {
        currentActionClip.fadeOut(0.5);
      }
    };
  }, [action, actions, mixer]);

  return <primitive ref={group} object={scene} scale={1.8} position={[0, -1.7, 0]} />;
};

const Avatar3D: React.FC<Avatar3DProps> = ({ action, isVisible }) => {
  if (!isVisible) return null;

  const modelPath = '/models/chakradhar-avatar.glb'; 

  return (
    <div className="fixed bottom-0 right-0 w-64 h-96 z-50 pointer-events-none md:w-80 md:h-[480px]"> {/* Ensure z-index is appropriate */}
      <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 3, 5]} intensity={2.5} />
        <Suspense fallback={null}>
          <Model action={action} modelPath={modelPath} />
        </Suspense>
        {/* <OrbitControls /> */} {/* Usually commented out for production */}
      </Canvas>
    </div>
  );
};

export default Avatar3D;
