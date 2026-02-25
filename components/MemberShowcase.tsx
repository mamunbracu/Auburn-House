
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { MEMBERS } from '../constants';

const createTextTexture = (text: string, color: string = '#ffffff', isMobile: boolean = false) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  canvas.width = 512;
  canvas.height = 128;
  
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // High contrast background bubble
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  const radius = isMobile ? 32 : 64;
  const x = isMobile ? 128 : 56, y = isMobile ? 32 : 14, w = isMobile ? 256 : 400, h = isMobile ? 64 : 100;
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
  ctx.font = `bold ${isMobile ? '30px' : '50px'} Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text.toUpperCase(), 256, isMobile ? 64 : 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
};

const MemberShowcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ target: 0, current: 0, velocity: 0.005, isDragging: false, lastX: 0 });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

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
      const labelTexture = createTextTexture(member.name, '#ffffff', isMobile);
      if (labelTexture) {
        const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
        const labelSprite = new THREE.Sprite(labelMaterial);
        labelSprite.scale.set(isMobile ? 3 : 6, isMobile ? 0.75 : 1.5, 1);
        labelSprite.position.set(0, isMobile ? 2.5 : 3.5, 0);
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

    const onMouseDown = (e: MouseEvent) => onDown(e.clientX);
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX);

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    container.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX));
    container.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX));
    container.addEventListener('touchend', onUp);

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
      
      // Make all members face the camera
      mainGroup.children.forEach((memberGroup) => {
        memberGroup.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
            obj.quaternion.copy(camera.quaternion);
          }
        });
      });
      
      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [isMobile]);

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-[1rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl mt-4 sm:mt-6 group select-none transition-colors duration-300 max-w-full">
      <div ref={containerRef} className="w-full aspect-square sm:aspect-video cursor-grab active:cursor-grabbing" />
      
      <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none w-full px-4 text-center">
        <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] text-primary mb-1 sm:mb-2 italic drop-shadow-sm">Resident Portal Gallery</div>
        <div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-primary/30 rounded-full"></div>
      </div>
      
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 w-full px-4 flex justify-center">
        <div className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-white/10 flex items-center gap-2 sm:gap-3 shadow-2xl">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-ping"></div>
          <span className="text-[7px] sm:text-[9px] font-black text-white uppercase tracking-widest">Swipe to Discover Residents</span>
        </div>
      </div>
    </div>
  );
};

export default MemberShowcase;
