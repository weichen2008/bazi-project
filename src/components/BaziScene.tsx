import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface BaziSceneProps {
  dayMasterElement: string; // 木, 火, 土, 金, 水
  monthZhi: string; // 月支 (Season)
  hourZhi: string; // 时支 (Time)
  chart?: any; // Full chart for complex analysis
  wuxingScores?: Record<string, number>; // Full element scores
}

// ==========================================
// Helpers & Generators
// ==========================================

const getSeason = (zhi: string) => {
  if (['寅', '卯', '辰'].includes(zhi)) return 'spring';
  if (['巳', '午', '未'].includes(zhi)) return 'summer';
  if (['申', '酉', '戌'].includes(zhi)) return 'autumn';
  return 'winter'; // 亥, 子, 丑
};

const getTimeOfDay = (zhi: string) => {
  if (['亥', '子', '丑'].includes(zhi)) return 'night';
  if (['寅', '卯'].includes(zhi)) return 'dawn';
  if (['辰', '巳', '午', '未'].includes(zhi)) return 'day';
  return 'dusk'; // 申, 酉, 戌
};

// Poetic Description Generator
const generatePoeticTitleAndDesc = (props: BaziSceneProps) => {
  const { dayMasterElement, monthZhi, hourZhi, chart } = props;
  const season = getSeason(monthZhi);
  const time = getTimeOfDay(hourZhi);
  
  const dm = chart?.day?.gan || '日主';
  const dmZhi = chart?.day?.zhi || '';
  const yearZhi = chart?.year?.zhi || '';
  const monthGan = chart?.month?.gan || '';
  const hourGan = chart?.hour?.gan || '';
  const hourZhiVal = chart?.hour?.zhi || '';

  // Scene Components
  let title = "命局意象";
  let description = "天地之间，五行流转。";

  // Specific Logic for "Gui Hai" Winter scenario (User's Example)
  if (season === 'winter' && dayMasterElement === '木' && ['亥', '子'].includes(monthZhi)) {
    if (time === 'night') {
       title = "寒江孤影图";
       description = `冬夜深沉，${monthZhi}水当令，天地间一片苍茫寒色。${dm}木生于寒冬，根气深藏，犹如江边老柳，虽受寒气侵袭，却傲然挺立。远处${hourGan}火微光闪烁，似寒夜孤灯，温暖局势，照亮前程。`;
       return { title, description };
    }
  }

  // General Logic Generators
  const seasonName = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[season];
  const timeName = { dawn: '晨', day: '日', dusk: '暮', night: '夜' }[time];
  
  // Title construction
  const elementMap: any = { '木': '林', '火': '炎', '土': '山', '金': '峰', '水': '江' };
  const mainChar = elementMap[dayMasterElement] || '影';
  
  title = `${seasonName}${timeName}${mainChar}韵图`;

  // Description construction
  const seasonDesc = {
    spring: '春风拂面，万物复苏，',
    summer: '夏日炎炎，生机勃勃，',
    autumn: '金秋萧瑟，天高云淡，',
    winter: '冬雪皑皑，寒气逼人，'
  }[season];

  const timeDesc = {
    dawn: '晨曦微露，朝霞初上。',
    day: '日丽中天，光影斑驳。',
    dusk: '夕阳西下，暮色苍茫。',
    night: '夜幕低垂，星月交辉。'
  }[time];

  const elementDesc = {
    '木': '日主为木，如林间劲草，坚韧向上。',
    '火': '日主为火，如暗夜明灯，温暖人心。',
    '土': '日主为土，如巍巍高山，厚德载物。',
    '金': '日主为金，如锋锐宝剑，光芒内敛。',
    '水': '日主为水，如滔滔江河，奔流不息。'
  }[dayMasterElement];

  description = `${elementDesc}${seasonDesc}${timeDesc}`;

  return { title, description };
};

// ==========================================
// SVG Components (Enhanced)
// ==========================================

const WillowTree = ({ color, frozen }: { color: string, frozen?: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
    {/* Trunk */}
    <path d="M50 90 Q45 70 50 50 Q55 30 40 10" stroke={frozen ? "#475569" : "#5d4037"} strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* Branches */}
    <path d="M50 50 Q30 60 20 80" stroke={color} strokeWidth="1" fill="none" opacity="0.8" />
    <path d="M50 40 Q70 50 80 70" stroke={color} strokeWidth="1" fill="none" opacity="0.8" />
    <path d="M45 30 Q25 40 15 60" stroke={color} strokeWidth="1" fill="none" opacity="0.7" />
    {frozen && <path d="M50 90 Q45 70 50 50" stroke="#cbd5e1" strokeWidth="1" fill="none" opacity="0.5" />} {/* Frost */}
  </svg>
);

const Bamboo = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
    <path d="M45 90 L45 10 M55 95 L55 20 M35 85 L35 30" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* Nodes */}
    {[20, 40, 60, 80].map(y => (
      <path key={y} d={`M42 ${y} L48 ${y}`} stroke={color} strokeWidth="3" />
    ))}
    {/* Leaves */}
    <path d="M45 30 Q30 20 25 35" stroke={color} fill="none" />
    <path d="M55 40 Q70 30 75 45" stroke={color} fill="none" />
  </svg>
);

const Lantern = ({ x, y }: { x: number, y: number }) => (
  <motion.svg 
    initial={{ opacity: 0.8 }}
    animate={{ opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 3, repeat: Infinity }}
    viewBox="0 0 40 40" 
    style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: '40px', height: '40px', zIndex: 30 }}
  >
    <circle cx="20" cy="20" r="10" fill="url(#glow)" />
    <defs>
      <radialGradient id="glow">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
      </radialGradient>
    </defs>
    <path d="M15 15 L25 15 L25 25 L15 25 Z" fill="#fff" opacity="0.5" />
  </motion.svg>
);

const FrozenGround = () => (
  <svg viewBox="0 0 100 100" className="absolute bottom-0 w-full h-1/3 z-10 opacity-80" preserveAspectRatio="none">
    <path d="M0 50 Q20 40 40 60 T100 50 V100 H0 Z" fill="#e2e8f0" />
    <path d="M0 70 Q30 60 50 80 T100 70 V100 H0 Z" fill="#94a3b8" opacity="0.5" />
  </svg>
);

const WaterRiver = () => (
  <svg viewBox="0 0 100 100" className="absolute bottom-0 w-full h-1/2 z-0 opacity-60" preserveAspectRatio="none">
    <path d="M0 20 Q50 40 100 20 V100 H0 Z" fill="#1e293b" />
    <motion.path 
      d="M0 30 Q50 50 100 30" 
      stroke="#334155" 
      strokeWidth="1" 
      fill="none"
      animate={{ d: ["M0 30 Q50 50 100 30", "M0 30 Q50 10 100 30", "M0 30 Q50 50 100 30"] }}
      transition={{ duration: 5, repeat: Infinity }}
    />
  </svg>
);

const BaziScene: React.FC<BaziSceneProps> = (props) => {
  const { dayMasterElement, monthZhi, hourZhi, chart, wuxingScores } = props;
  const season = useMemo(() => getSeason(monthZhi), [monthZhi]);
  const time = useMemo(() => getTimeOfDay(hourZhi), [hourZhi]);
  const [sceneInfo, setSceneInfo] = useState({ title: '', description: '' });

  useEffect(() => {
    setSceneInfo(generatePoeticTitleAndDesc(props));
  }, [props]);

  // 1. Determine Sky Gradient
  const getSkyGradient = () => {
    if (time === 'night') return 'bg-gradient-to-b from-[#020617] via-[#172554] to-[#1e293b]'; // Deep night
    if (time === 'dawn') return 'bg-gradient-to-b from-[#1e1b4b] via-[#4c1d95] to-[#f472b6]';
    if (time === 'dusk') return 'bg-gradient-to-b from-[#4a044e] via-[#be185d] to-[#fb923c]';
    if (season === 'winter') return 'bg-gradient-to-b from-[#cbd5e1] to-[#f1f5f9]'; // Grey winter day
    return 'bg-gradient-to-b from-[#0ea5e9] to-[#fef08a]';
  };

  // 2. Render Scene Layers
  const renderLayers = () => {
    const layers = [];

    // Water Layer (Base)
    if (season === 'winter' || dayMasterElement === '水' || (wuxingScores?.['水'] || 0) > 20) {
       layers.push(<WaterRiver key="water" />);
    }

    // Ground Layer
    if (season === 'winter' || ['丑', '辰'].includes(monthZhi)) {
       layers.push(<FrozenGround key="ground" />);
    }

    // Vegetation Layer (Day Master or Strong Wood)
    if (dayMasterElement === '木') {
       const isWinter = season === 'winter';
       layers.push(
         <motion.div 
           key="tree"
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1.5 }}
           className="absolute bottom-10 left-1/4 w-64 h-64 z-20"
         >
           {isWinter ? <WillowTree color="#94a3b8" frozen /> : <Bamboo color="#22c55e" />}
         </motion.div>
       );
    }

    // Fire/Light Layer (Day Master or Time)
    if (dayMasterElement === '火' || ['巳', '午'].includes(hourZhi) || ['丁', '丙'].includes(chart?.hour?.gan)) {
       const isNight = time === 'night';
       if (isNight) {
         // Lantern
         layers.push(<Lantern key="lantern" x={60} y={60} />);
       }
    }

    // Atmosphere
    if (season === 'winter') {
      layers.push(
        <div key="snow" className="absolute inset-0 pointer-events-none z-50">
           {[...Array(30)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute w-1 h-1 bg-white rounded-full opacity-80"
               initial={{ x: Math.random() * 400, y: -10 }}
               animate={{ y: 400, x: `calc(${Math.random() * 400}px + ${Math.random() * 100 - 50}px)` }}
               transition={{ duration: Math.random() * 3 + 4, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
             />
           ))}
        </div>
      );
    }

    return layers;
  };

  return (
    <div className={`w-full h-full relative overflow-hidden ${getSkyGradient()} flex items-center justify-center`}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.5\'/%3E%3C/svg%3E')] opacity-10 mix-blend-overlay pointer-events-none" />
      
      {/* Dynamic Layers */}
      {renderLayers()}

      {/* Text Overlay (Title & Desc) */}
      <div className="absolute bottom-4 right-4 text-right z-50 max-w-[80%]">
         <motion.h3 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="text-xl font-bold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,1)] font-serif"
         >
           {sceneInfo.title}
         </motion.h3>
         <motion.p 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.5 }}
           className="text-xs text-white/80 mt-1 leading-relaxed drop-shadow-[0_4px_8px_rgba(0,0,0,1)] line-clamp-3"
         >
           {sceneInfo.description}
         </motion.p>
      </div>
    </div>
  );
};

export default BaziScene;