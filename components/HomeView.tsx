import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
// Fixed: Using Member instead of Roommate, and BillItem instead of Bill
import { Member, BillItem, ChoreOverride } from '../types';
import { getLaundryAssignment, getCleaningAssignment, getBinAssignment, getRentSchedule } from '../services/dataService';

interface HomeViewProps {
  roommates: Member[];
  bills: BillItem[];
  overrides: ChoreOverride[];
  onUpdateRoommate: (r: Member) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ roommates, bills, overrides, onUpdateRoommate }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  // Fixed: Updated property names to match types.ts definitions
  const totalRent = roommates.reduce((sum, r) => sum + r.rentShare, 0);
  const totalBills = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const homeCount = roommates.filter(r => r.isHome).length;

  const today = useMemo(() => new Date(), []);
  const laundryToday = useMemo(() => getLaundryAssignment(today, overrides), [today, overrides]);
  const cleanerToday = useMemo(() => getCleaningAssignment(today, overrides), [today, overrides]);
  
  // Logic for Bin: Next Wednesday
  const nextWed = useMemo(() => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = (day <= 3) ? (3 - day) : (10 - day);
    d.setDate(today.getDate() + diff);
    return d;
  }, [today]);
  
  const binResponsible = useMemo(() => getBinAssignment(nextWed, overrides), [nextWed, overrides]);

  const nextRentDate = useMemo(() => {
    const schedule = getRentSchedule(50);
    return schedule.find(d => d >= today) || schedule[0];
  }, [today]);

  const formattedRentDate = useMemo(() => {
    return nextRentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [nextRentDate]);

  const daysToRent = Math.ceil((nextRentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isRentUrgent = daysToRent <= 10;

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const width = mountRef.current.clientWidth;
    const height = 180;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const textureLoader = new THREE.TextureLoader();

    roommates.forEach((rm, i) => {
      const rmGroup = new THREE.Group();
      const geometry = new THREE.CircleGeometry(1.2, 32);
      // Fixed: Using rm.avatar instead of rm.photo
      const texture = textureLoader.load(rm.avatar);
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
      const avatar = new THREE.Mesh(geometry, material);
      rmGroup.add(avatar);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 256;
        canvas.height = 80;
        ctx.fillStyle = 'rgba(79, 70, 229, 0.8)';
        ctx.beginPath();
        const r = 10, x = 40, y = 0, w = 176, h = 50;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(rm.name, 128, 35);
        
        const nameTexture = new THREE.CanvasTexture(canvas);
        const nameMaterial = new THREE.SpriteMaterial({ map: nameTexture });
        const nameSprite = new THREE.Sprite(nameMaterial);
        nameSprite.position.y = -1.6;
        nameSprite.scale.set(3, 1, 1);
        rmGroup.add(nameSprite);
      }

      const angle = (i / roommates.length) * Math.PI * 2;
      rmGroup.position.x = Math.cos(angle) * 4.5;
      rmGroup.position.z = Math.sin(angle) * 4.5;
      group.add(rmGroup);
    });

    camera.position.z = 10;
    camera.position.y = 1;
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y += 0.005;
      group.children.forEach(child => {
        child.quaternion.copy(camera.quaternion);
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      if (mountRef.current) {
        const child = mountRef.current.querySelector('canvas');
        if (child) mountRef.current.removeChild(child);
      }
    };
  }, [roommates]);

  return (
    <div className="relative space-y-4 pb-12 select-none rounded-[40px] overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 -z-10 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[300px] bg-gradient-to-b from-indigo-500/20 via-rose-500/5 to-transparent blur-[80px] -z-10 opacity-60" />

      <header className="flex justify-between items-start pt-2 px-2 relative z-10">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none drop-shadow-2xl">37 Auburn House</h1>
          <p className="text-indigo-300 text-[9px] font-black uppercase tracking-[0.3em] mt-1 opacity-80">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xl shadow-[0_8px_20px_rgba(79,70,229,0.4)] border border-white/20">
          🏠
        </div>
      </header>

      {/* 3D Visualizer Area */}
      <div ref={mountRef} className="w-full h-[180px] relative z-10" />

      {/* SUMMARY GRID */}
      <div className="grid grid-cols-2 gap-3 px-1 relative z-10">
        <div className="relative overflow-hidden p-4 rounded-3xl border border-indigo-400/30 bg-indigo-900/60 shadow-xl">
          <p className="text-[8px] text-indigo-200 font-black uppercase tracking-widest opacity-80">TOTAL RENT</p>
          <p className="text-2xl font-black text-white mt-1 tracking-tighter drop-shadow-lg">${totalRent}</p>
          <p className="text-[9px] text-yellow-300 font-bold mt-1 uppercase tracking-tighter">{formattedRentDate.toUpperCase()}</p>
        </div>
        <div className="glass p-4 rounded-3xl border border-white/10 bg-slate-900/60 shadow-lg flex flex-col justify-center">
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Utility Split</p>
          <p className="text-xl font-black text-rose-400 mt-1 tracking-tighter">${(totalBills / 8).toFixed(2)}</p>
          <p className="text-[8px] text-slate-500 font-bold mt-1 uppercase tracking-tighter opacity-60">PER ROOMMATE</p>
        </div>
      </div>

      {/* CHORE SCHEDULES */}
      <section className="space-y-3 px-1 relative z-10">
        <div className="flex gap-3">
          <div className="flex-1 bg-gradient-to-br from-sky-600/30 to-indigo-600/10 backdrop-blur-xl p-4 rounded-[32px] border border-sky-400/20 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-30 group-hover:opacity-100 transition-opacity">🧺</div>
            <p className="text-[8px] font-black text-sky-200 uppercase tracking-widest mb-1">LAUNDRY TODAY</p>
            <p className="text-sm font-black text-white truncate drop-shadow-md uppercase tracking-tighter leading-tight mt-1">{laundryToday}</p>
          </div>
          
          <div className="flex-1 bg-gradient-to-br from-amber-600/30 to-rose-600/10 backdrop-blur-xl p-4 rounded-[32px] border border-amber-400/20 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-30 group-hover:opacity-100 transition-opacity">🧹</div>
            <p className="text-[8px] font-black text-amber-200 uppercase tracking-widest mb-1">CLEANING TODAY</p>
            <p className="text-sm font-black text-white truncate drop-shadow-md uppercase tracking-tighter leading-tight mt-1">{cleanerToday}</p>
          </div>
        </div>

        {/* Bin Out Section */}
        <div className="w-full bg-gradient-to-r from-emerald-900/40 via-emerald-800/20 to-transparent glass p-5 rounded-[36px] border border-emerald-500/20 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl shadow-inner border border-emerald-500/10">
                ♻️
              </div>
              <div>
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em]">NEXT BIN DAY</p>
                <h3 className="text-[13px] font-black text-white uppercase tracking-tighter leading-tight">
                  {nextWed.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-emerald-500/60 uppercase mb-0.5">RESPONSIBLE</p>
              <p className="text-base font-black text-white uppercase italic tracking-tighter drop-shadow-lg">
                {binResponsible}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RENT REMINDER - RED BACKGROUND & ANIMATED, BIN OUT STYLE */}
      <section className="px-1 relative z-10">
        <div className={`w-full bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 animate-gradient p-5 rounded-[36px] border border-white/30 shadow-[0_20px_40px_rgba(225,29,72,0.4)] transition-all duration-700 ${isRentUrgent ? 'opacity-100 scale-100' : 'opacity-40 grayscale blur-[1px]'}`}>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center text-2xl shadow-inner border border-white/30 animate-pulse">
                💸
              </div>
              <div>
                <p className="text-[8px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">RENT REMINDER</p>
                <h3 className="text-[13px] font-black text-white uppercase tracking-tighter leading-tight drop-shadow-lg">
                  Due: {formattedRentDate.toUpperCase()}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-white/70 uppercase mb-0.5 tracking-widest">PAY TO MAMUN</p>
              <p className="text-2xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">
                $3,000
              </p>
            </div>
          </div>
        </div>
        {isRentUrgent && (
          <p className="text-center text-[7px] font-black text-rose-500 uppercase tracking-[0.6em] mt-3 animate-pulse">
            •• URGENT ACTION REQUIRED ••
          </p>
        )}
      </section>

      <div className="h-8" />
    </div>
  );
};

export default HomeView;
