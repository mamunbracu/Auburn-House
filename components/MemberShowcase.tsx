
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { MEMBERS } from '../constants';

const createTextTexture = (text: string, color: string = '#ffffff') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  canvas.width = 512;
  canvas.height = 128;
  
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // High contrast background bubble
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  const radius = 64;
  const x = 56, y = 14, w = 400, h = 100;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();

  // Vibrant text
  ctx.font = 'bold 50px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text.toUpperCase(), 256, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
};

const MemberShowcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ target: 0, current: 0, velocity: 0.005, isDragging: false, lastX: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 500;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Dynamic color from CSS
    const getThemeColor = () => {
      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue('--color-primary').trim();
      return new THREE.Color(color || '#4f46e5');
    };

    let themeColor = getThemeColor();

    const textureLoader = new THREE.TextureLoader();
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Neon Floor Ring
    const ringGeo = new THREE.TorusGeometry(10.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: themeColor, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2.5;
    scene.add(ring);

    // Particles
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 40;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.08, color: themeColor, transparent: true, opacity: 0.3 });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    const radius = 10;

    MEMBERS.forEach((member, i) => {
      const memberGroup = new THREE.Group();
      
      // Avatar
      const texture = textureLoader.load(member.avatar);
      const geometry = new THREE.CircleGeometry(2.3, 64);
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);
      memberGroup.add(mesh);

      // Back glow
      const glowGeo = new THREE.CircleGeometry(2.5, 32);
      const glowMat = new THREE.MeshBasicMaterial({ color: themeColor, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.z = -0.01;
      memberGroup.add(glowMesh);

      // Prominent Label
      const labelTexture = createTextTexture(member.name);
      if (labelTexture) {
        const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
        const labelSprite = new THREE.Sprite(labelMaterial);
        labelSprite.scale.set(6, 1.5, 1);
        labelSprite.position.set(0, 3.5, 0);
        memberGroup.add(labelSprite);
      }

      const angle = (i / MEMBERS.length) * Math.PI * 2;
      memberGroup.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      mainGroup.add(memberGroup);
    });

    camera.position.z = 18;
    camera.position.y = 1;

    // Interaction
    const onDown = (x: number) => {
      rotationRef.current.isDragging = true;
      rotationRef.current.lastX = x;
    };
    const onMove = (x: number) => {
      if (!rotationRef.current.isDragging) return;
      const deltaX = x - rotationRef.current.lastX;
      rotationRef.current.velocity = deltaX * 0.005;
      rotationRef.current.lastX = x;
    };
    const onUp = () => rotationRef.current.isDragging = false;

    window.addEventListener('mousedown', (e) => onDown(e.clientX));
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', onUp);
    containerRef.current.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX));
    containerRef.current.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX));
    containerRef.current.addEventListener('touchend', onUp);

    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update theme color dynamically
      themeColor = getThemeColor();
      ringMat.color.copy(themeColor);
      particlesMat.color.copy(themeColor);

      if (!rotationRef.current.isDragging) {
        rotationRef.current.velocity *= 0.95;
        if (Math.abs(rotationRef.current.velocity) < 0.001) rotationRef.current.velocity = 0.003;
      }
      
      mainGroup.rotation.y += rotationRef.current.velocity;
      particles.rotation.y += 0.001;

      const time = Date.now() * 0.002;
      ring.scale.setScalar(1 + Math.sin(time) * 0.04);
      ringMat.opacity = 0.3 + Math.sin(time) * 0.2;
      
      mainGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
          if (obj.parent !== mainGroup) return; 
          obj.quaternion.copy(camera.quaternion);
        }
      });
      
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, height);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl mt-6 group select-none transition-colors duration-300">
      <div ref={containerRef} className="w-full h-[500px] cursor-grab active:cursor-grabbing" />
      
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2 italic">Resident Portal Gallery</div>
        <div className="w-16 h-1 bg-primary/30 rounded-full"></div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>
          <span className="text-[9px] font-black text-white uppercase tracking-widest">Swipe to Discover Residents</span>
        </div>
      </div>
    </div>
  );
};

export default MemberShowcase;
