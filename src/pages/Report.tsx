import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Download, Zap, Heart, Briefcase, Smile, User, RefreshCcw, TrendingUp, Hexagon, Feather, Sparkles, Shield, Flame, Droplets, Mountain, Wind, Star, StarHalf, Coins, Leaf, Mars, Venus, Video } from 'lucide-react';
import html2canvas from 'html2canvas';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Bar, Line, ReferenceLine, Cell
} from 'recharts';
import { useBaziStore } from '../store/useBaziStore';
import { Pillar } from '../types';
import BaziScene from '../components/BaziScene';
import { calculateBazi } from '../utils/bazi';

const Report = () => {
  const navigate = useNavigate();
  const { currentReport, currentInput, setReport } = useBaziStore();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentReport) {
      navigate('/');
    } else if (!currentReport.yearlyLuck && currentInput) {
      // Auto-migrate: Recalculate to get yearly luck data
      const newReport = calculateBazi(currentInput);
      setReport(newReport);
    }
  }, [currentReport, navigate, currentInput, setReport]);

  if (!currentReport || !currentInput) return null;

  const { chart, wuxing, analysis, lifeEnergy } = currentReport;

  const handleDownload = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#020617', // Dark background for export
        scale: 2,
        useCORS: true, // helpful for external images if any
        logging: false
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `八字命盘_${currentInput.name}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const ScoreBar = ({ label, score, icon, color }: any) => (
    <div className="bg-black/40 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold text-slate-300">{label}</span>
        </div>
        <span className="text-sm font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{score}</span>
      </div>
      <div className="h-1.5 bg-slate-800/50 rounded-full border border-white/5 relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1 }}
          className={`h-full rounded-full ${color} shadow-[0_0_15px_currentColor]`}
        />
      </div>
    </div>
  );

  const CustomTick = ({ payload, x, y, textAnchor, stroke, radius }: any) => {
    return (
      <g className="recharts-layer recharts-polar-angle-axis-tick">
        <text
          radius={radius}
          stroke={stroke}
          x={x}
          y={y}
          className="recharts-text recharts-polar-angle-axis-tick-value"
          textAnchor={textAnchor}
          fill="#94a3b8"
          fontSize="14"
          fontWeight="bold"
        >
          <tspan x={x} dy="0.355em">{payload.value}</tspan>
        </text>
      </g>
    );
  };

  const StarRating = ({ score }: { score: number }) => {
    // Convert 0-100 score to 0-5 stars
    const rating = score / 20;
    const fullStars = Math.floor(rating);
    const decimal = rating % 1;
    const hasHalfStar = decimal >= 0.25 && decimal < 0.75;
    // If decimal is >= 0.75, it effectively rounds up to next full star, but let's stick to floor + half logic
    // Actually, standard rounding: 
    // 4.0 - 4.24 -> 4 stars
    // 4.25 - 4.74 -> 4.5 stars
    // 4.75 - 5.0 -> 5 stars (but loop logic needs care)
    
    // Better logic:
    let stars = [];
    let currentRating = rating;

    for (let i = 1; i <= 5; i++) {
        if (currentRating >= i - 0.25) {
            // Full star
            stars.push(<Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]" />);
        } else if (currentRating >= i - 0.75) {
            // Half star
            stars.push(<StarHalf key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]" />);
        } else {
            // Empty star
            stars.push(<Star key={i} className="w-5 h-5 text-slate-700/50" />);
        }
    }

    return (
      <div className="flex items-center gap-1 ml-4 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
        {stars}
      </div>
    );
  };

  const CharacterCard = ({ name, chart, wuxing }: { name: string, chart: any, wuxing: any }) => {
    const { scores } = wuxing;
    const { dayMasterElement, dayMaster: dayGan } = chart;
    const totalScore = Object.values(scores).reduce((a: any, b: any) => a + b, 0) as number || 1;
    
    const ZODIAC_MAP: Record<string, string> = {
      '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
      '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
      '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
    };

    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(chart.solarDate);
    const age = currentYear - birthYear;
    const zodiac = ZODIAC_MAP[chart.year.zhi] || '';

    const getElementIcon = (elm: string) => {
      switch(elm) {
        case '木': return <Wind className="w-12 h-12 text-green-200" />;
        case '火': return <Flame className="w-12 h-12 text-red-200" />;
        case '土': return <Mountain className="w-12 h-12 text-yellow-200" />;
        case '金': return <Shield className="w-12 h-12 text-slate-200" />;
        case '水': return <Droplets className="w-12 h-12 text-blue-200" />;
        default: return <Sparkles className="w-12 h-12 text-white" />;
      }
    };

    const getBgGradient = (elm: string) => {
      switch(elm) {
        case '木': return 'bg-gradient-to-br from-green-600 to-teal-900';
        case '火': return 'bg-gradient-to-br from-red-600 to-orange-900';
        case '土': return 'bg-gradient-to-br from-yellow-600 to-amber-900';
        case '金': return 'bg-gradient-to-br from-slate-500 to-slate-800';
        case '水': return 'bg-gradient-to-br from-blue-600 to-indigo-900';
        default: return 'bg-gradient-to-br from-purple-600 to-indigo-900';
      }
    };

    const DarkPillar = ({ title, pillar }: { title: string, pillar: any }) => (
      <div className="flex flex-col items-center p-3 bg-black/40 rounded-lg border border-white/10 relative overflow-hidden group hover:border-[var(--neon-cyan)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-300">
        <span className="text-[10px] font-bold mb-1 uppercase text-slate-400 tracking-widest">{title}</span>
        <div className="flex flex-col gap-1 items-center z-10">
          <span className={`text-xl font-bold ${getElementColor(pillar.gan)}`}>{pillar.gan}</span>
          <span className={`text-xl font-bold ${getElementColor(pillar.zhi)}`}>{pillar.zhi}</span>
        </div>
        <div className="mt-2 flex flex-col items-center gap-0.5">
          {pillar.hiddenGan.map((g: string, i: number) => (
            <span key={i} className={`text-[9px] ${getElementColor(g)}`}>{g}</span>
          ))}
        </div>
        <div className="mt-2 w-full h-6 bg-slate-900/50 rounded-lg border border-slate-700/50 relative">
           <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-medium text-slate-300 whitespace-nowrap">
             {pillar.shishen}
           </span>
        </div>
      </div>
    );

    return (
      <div className="relative w-full max-w-5xl mx-auto bg-gradient-to-br from-slate-900/80 to-black/80 backdrop-blur-md rounded-2xl overflow-hidden border border-slate-700/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col md:flex-row ring-1 ring-white/5">
        {/* Left Column: Avatar & Role Info */}
        <div className="w-full md:w-1/3 relative flex flex-col">
           {/* Card Header (Name, Attribute & Birth Info) */}
          <div className="absolute top-0 left-0 w-full p-6 z-20 pointer-events-none">
            <div className="flex items-start gap-6">
              {/* Left: Name & Attribute */}
              <div className="flex flex-col items-start gap-2">
                <h2 className="text-3xl font-bold text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none">{name}</h2>
                <div className="bg-black/60 backdrop-blur-md h-8 px-4 rounded-xl border border-white/10 shadow-lg flex items-center justify-center gap-2">
                    {dayMasterElement === '木' ? <Leaf className="w-4 h-4 text-green-400" /> :
                     dayMasterElement === '火' ? <Flame className="w-4 h-4 text-red-400" /> :
                     dayMasterElement === '土' ? <Mountain className="w-4 h-4 text-yellow-400" /> :
                     dayMasterElement === '金' ? <Shield className="w-4 h-4 text-slate-300" /> :
                     <Droplets className="w-4 h-4 text-blue-400" />}
                    <span className="text-xs text-white/90 font-bold whitespace-nowrap pt-[1px]">
                        {dayMasterElement}命
                    </span>
                </div>
              </div>

              {/* Right: Birth Info (New Layout) */}
              <div className="flex flex-col gap-1.5 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl min-w-[160px]">
                 <div className="flex items-center border-b border-white/10 pb-2 mb-0.5">
                    <div className="flex items-center">
                       <div className="w-4 h-4 flex items-center justify-center mr-2">
                          {chart.gender === 'male' ? <Mars className="w-3.5 h-3.5 text-blue-400" /> : <Venus className="w-3.5 h-3.5 text-pink-400" />}
                       </div>
                       <div className="flex items-baseline text-xs font-bold tracking-widest text-white/90">
                         <span className="mr-2">{chart.gender === 'male' ? '男性' : '女生'}</span>
                         <span className="font-normal text-slate-300">属{zodiac}，{age}岁</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--neon-cyan)] opacity-70 font-serif font-bold italic">公</span>
                    <span className="font-mono tracking-wide text-white/90">{chart.solarDate.split(' ')[0]}{chart.solarDate.split(' ')[1]}</span>
                 </div>

                 <div className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--neon-cyan)] opacity-70 font-serif font-bold italic">农</span>
                    <span className="font-mono tracking-wide text-white/90">{chart.lunarDate}</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Visual Scene Area */}
          <div className="flex-1 min-h-[300px] relative flex flex-col items-center justify-center overflow-hidden group bg-slate-900">
             {/* Dynamic Scene */}
             <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105">
               <BaziScene 
                 dayMasterElement={dayMasterElement} 
                 monthZhi={chart.month.zhi} 
                 hourZhi={chart.hour.zhi}
                 chart={chart}
                 wuxingScores={scores}
               />
             </div>


          </div>
        </div>

        {/* Right Column: Data Matrix & Attributes */}
        <div className="w-full md:w-2/3 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-md p-6 flex flex-col gap-6 relative border-l border-white/5">
           {/* Tech Decoration */}
           <div className="absolute top-0 right-0 p-2 opacity-50">
              <Hexagon className="w-16 h-16 text-slate-800/50 stroke-1" />
           </div>

           {/* Section 1: Four Pillars Matrix */}
           <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
               <span className="w-1 h-3 bg-[var(--neon-cyan)] rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
               命盘排盘
             </h3>
             <div className="grid grid-cols-4 gap-3">
               <DarkPillar title="年柱" pillar={chart.year} />
               <DarkPillar title="月柱" pillar={chart.month} />
               <DarkPillar title="日柱" pillar={chart.day} />
               <DarkPillar title="时柱" pillar={chart.hour} />
             </div>
           </div>

           {/* Section 2: Five Elements Attributes */}
           <div className="flex-1">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
               <span className="w-1 h-3 bg-[var(--neon-purple)] rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
               五行属性
             </h3>
             <div className="space-y-3 pr-2">
                {['木', '火', '土', '金', '水'].map((elm) => {
                  const score = scores[elm] || 0;
                  const percentage = Math.min(100, (score / 15) * 100); 
                  
                  return (
                    <div key={elm} className="flex items-center gap-3">
                      <div className="w-6 text-xs font-bold text-slate-400 text-center">{elm}</div>
                      <div className="flex-1 h-2 bg-black/40 rounded-full border border-white/10 relative">
                         {/* Grid lines background */}
                         <div className="absolute inset-0 flex justify-between px-1 overflow-hidden rounded-full">
                            {[1,2,3,4].map(i => <div key={i} className="w-[1px] h-full bg-white/5"></div>)}
                         </div>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full relative z-10 ${
                            elm === '木' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]' :
                            elm === '火' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' :
                            elm === '土' ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' :
                            elm === '金' ? 'bg-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.8)]' :
                            'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]'
                          }`}
                        />
                      </div>
                      <div className="w-8 text-right text-[10px] font-mono text-slate-500">
                        {score}
                      </div>
                    </div>
                  );
                })}
             </div>
           </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen p-4 md:p-8 relative bg-[var(--cyber-bg)] overflow-x-hidden text-[var(--text-primary)]">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[var(--neon-purple)] opacity-5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[var(--neon-cyan)] opacity-5 rounded-full blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center relative z-20">
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-[#18181b] border border-[#27272a] rounded-full hover:bg-[#27272a] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-[#18181b]/80 backdrop-blur-sm border border-white/10 rounded-full text-xs font-bold text-white hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
        >
          <Download className="w-4 h-4" />
          导出图片
        </button>
      </div>

      {/* Main Report Container */}
      <div ref={reportRef} className="max-w-4xl mx-auto space-y-6 relative z-10 pb-20">
        
        {/* Header Profile - Character Card (Integrated with Pillars) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <CharacterCard 
            name={currentInput.name} 
            chart={chart}
            wuxing={wuxing}
          />
        </motion.div>

        {/* Life Energy Section */}
        <GlowCard 
          variant="violet" 
          icon={<Zap />}
          title="人生能量值"
          subTitle="五维运势全面评估"
          delay={0.2}
        >
          <div className="flex flex-col gap-6">
             {/* Total Score Box - Full Width */}
             <div className="bg-black/20 p-6 rounded-xl border border-white/5 relative overflow-hidden group/score">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/score:opacity-20 transition-opacity duration-500">
                  <Sparkles className="w-32 h-32 text-violet-500" />
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                         <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                         <span className="text-base font-bold text-white">综合运势解读</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                         <div className="flex items-baseline gap-2">
                             <span className="text-5xl font-bold text-[var(--neon-cyan)] drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">{lifeEnergy?.totalScore || 75}</span>
                             <span className="text-lg text-slate-400">分</span>
                         </div>
                         <StarRating score={lifeEnergy?.totalScore || 75} />
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed text-justify max-w-2xl">
                         {lifeEnergy?.description || '暂无详细描述，请重新生成报告。'}
                      </p>
                   </div>
                   
                   {/* 4 Bars Grid on the right side on Desktop */}
                   <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ScoreBar label="贵人运" score={lifeEnergy?.subScores?.nobleman || 70} icon={<Star className="w-3 h-3 text-yellow-400" />} color="bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                      <ScoreBar label="桃花运" score={lifeEnergy?.subScores?.peachBlossom || 70} icon={<Heart className="w-3 h-3 text-pink-400" />} color="bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                      <ScoreBar label="事业运" score={lifeEnergy?.subScores?.career || 70} icon={<Briefcase className="w-3 h-3 text-blue-400" />} color="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                      <ScoreBar label="财富运" score={lifeEnergy?.subScores?.wealth || 70} icon={<Coins className="w-3 h-3 text-green-400" />} color="bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                   </div>
                </div>
             </div>
          </div>
        </GlowCard>

        {/* Luck Chart */}
        <GlowCard 
          variant="blue" 
          icon={<TrendingUp />}
          title="人生K线图"
          subTitle="十年大运走势预测"
          delay={0.3}
        >
          <div className="h-[300px] w-full relative">
             {/* Background Grid Lines (Optional custom grid) */}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                  data={currentReport.yearlyLuck || []}
                  margin={{ top: 20, right: 10, left: -20, bottom: 40 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="daYunBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6d28d9" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.5} />
                  
                  {/* Age Axis */}
                  <XAxis 
                    dataKey="age" 
                    axisLine={false}
                    tickLine={false}
                    ticks={currentReport.luckPillars.map(p => p.startAge)}
                    interval={0}
                    tick={({ x, y, payload }) => {
                       // Find the corresponding pillar to get the year
                       const pillar = currentReport.luckPillars.find(p => p.startAge === payload.value);
                       return (
                         <g transform={`translate(${x},${y})`}>
                           <text x={0} y={0} dy={12} textAnchor="middle" fill="#a1a1aa" fontSize={11} fontWeight="bold">
                              {payload.value}岁
                           </text>
                           {pillar && (
                             <text x={0} y={0} dy={26} textAnchor="middle" fill="#a1a1aa" fontSize={11} fontWeight="bold">
                                {pillar.startYear}
                             </text>
                           )}
                         </g>
                       );
                    }}
                  />
                <YAxis hide domain={[0, 110]} />

                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                  labelFormatter={(label, payload) => {
                     if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return `${data.year}年 (${data.age}岁) - ${data.daYun}大运`;
                     }
                     return `${label}岁`;
                  }}
                  formatter={(value: any) => [`${value}分`, '运势指数']}
                />

                {/* Bars for Yearly Luck */}
                <Bar 
                   dataKey="score" 
                   barSize={4} 
                   radius={[2, 2, 0, 0]}
                   isAnimationActive={true}
                >
                  {
                    (currentReport.yearlyLuck || []).map((entry, index) => {
                      // Check if this year is a DaYun start year
                       const isDaYunStart = currentReport.luckPillars.some(p => p.startYear === entry.year);
                       return (
                         <Cell 
                           key={`cell-${index}`} 
                           fill={isDaYunStart ? 'url(#daYunBarGradient)' : 'url(#barGradient)'}
                         />
                       );
                     })
                  }
                </Bar>

                {/* Trend Line */}
                <Line 
                   type="monotone" 
                   dataKey="score" 
                   stroke="url(#lineGradient)" 
                   strokeWidth={3} 
                   dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      // Show dot ONLY if this year is the current year
                      const currentYear = new Date().getFullYear();
                      const isCurrent = payload.year === currentYear;
                      
                      if (isCurrent) {
                         return (
                            <g>
                               <circle cx={cx} cy={cy} r={3} fill="#fbbf24" stroke="#fff" strokeWidth={1.5} />
                               <circle cx={cx} cy={cy} r={6} stroke="#fbbf24" strokeWidth={1} fill="transparent" opacity={0.5}>
                                  <animate attributeName="r" from="6" to="10" dur="1.5s" repeatCount="indefinite" />
                                  <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                               </circle>
                            </g>
                         );
                      }
                      return <></>;
                   }}
                   activeDot={{ r: 4, fill: "#fff", stroke: "#fbbf24", strokeWidth: 1.5 }}
                />
                
                <ReferenceLine y={90} stroke="#fbbf24" strokeDasharray="3 3" opacity={0.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        {/* Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnalysisCard 
            icon={<User className="w-5 h-5" />}
            title="性格密码"
            content={analysis.personality}
            variant="personality"
          />
          <AnalysisCard 
            icon={<Briefcase className="w-5 h-5" />}
            title="事业财富"
            content={analysis.career}
            variant="career"
          />
          <AnalysisCard 
            icon={<Heart className="w-5 h-5" />}
            title="婚姻情感"
            content={analysis.love}
            variant="love"
          />
          <AnalysisCard 
            icon={<Zap className="w-5 h-5" />}
            title="健康养生"
            content={analysis.health}
            variant="health"
          />
        </div>

        {/* Lucky Tips Card */}
        <div className="grid grid-cols-1">
          <AnalysisCard 
            icon={<Smile className="w-5 h-5" />}
            title="开运锦囊"
            content={analysis.advice}
            variant="advice"
          />
        </div>

        {/* Life Message Card */}
        <div className="grid grid-cols-1">
          <AnalysisCard 
            icon={<Feather className="w-5 h-5" />}
            title="人生寄语"
            content={analysis.lifeMessage}
            variant="message"
          />
        </div>
        
        <div className="flex justify-center pt-8">
           <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 text-cyan-100 rounded-full hover:from-cyan-800 hover:to-blue-800 transition-all border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] group backdrop-blur-sm"
          >
            <RefreshCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500 text-cyan-400" />
            <span className="text-sm font-bold tracking-widest leading-none mt-[1px]">开启新纪元</span>
          </button>
        </div>

      </div>
    </div>
  );
};

// --- Sub Components ---

const GlowCard = ({ variant = 'default', icon, title, subTitle, children, delay = 0, className = '' }: any) => {
  const styles: any = {
    violet: "border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-slate-900/60 shadow-[0_0_20px_rgba(139,92,246,0.1)]",
    blue: "border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-slate-900/60 shadow-[0_0_20px_rgba(59,130,246,0.1)]",
    cyan: "border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-900/60 shadow-[0_0_20px_rgba(6,182,212,0.1)]",
    amber: "border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-slate-900/60 shadow-[0_0_20px_rgba(245,158,11,0.1)]",
    pink: "border-pink-500/30 bg-gradient-to-br from-pink-950/40 to-slate-900/60 shadow-[0_0_20px_rgba(236,72,153,0.1)]",
    emerald: "border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-slate-900/60 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
    rose: "border-rose-500/30 bg-gradient-to-br from-rose-950/40 to-slate-900/60 shadow-[0_0_20px_rgba(244,63,94,0.1)]",
    teal: "border-teal-500/30 bg-gradient-to-br from-teal-950/40 to-slate-900/60 shadow-[0_0_20px_rgba(20,184,166,0.1)]",
    default: "border-slate-700/50 bg-slate-900/50"
  };

  const textColors: any = {
    violet: "text-violet-400",
    blue: "text-blue-400",
    cyan: "text-cyan-400",
    amber: "text-amber-400",
    pink: "text-pink-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    teal: "text-teal-400",
    default: "text-slate-400"
  };

  const iconBg: any = {
    violet: "bg-violet-950/50 text-violet-400",
    blue: "bg-blue-950/50 text-blue-400",
    cyan: "bg-cyan-950/50 text-cyan-400",
    amber: "bg-amber-950/50 text-amber-400",
    pink: "bg-pink-950/50 text-pink-400",
    emerald: "bg-emerald-950/50 text-emerald-400",
    rose: "bg-rose-950/50 text-rose-400",
    teal: "bg-teal-950/50 text-teal-400",
    default: "bg-slate-800 text-slate-300"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`p-6 md:p-8 rounded-2xl border backdrop-blur-md ${styles[variant]} ${className} hover:translate-y-[-2px] transition-all duration-300`}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-xl border border-white/5 ${iconBg[variant]}`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" }) : icon}
        </div>
        <div>
          <h3 className={`text-lg font-bold tracking-wider uppercase ${textColors[variant]}`}>{title}</h3>
          {subTitle && <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{subTitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
};

const AnalysisCard = ({ icon, title, subTitle, content = [], variant = 'default' }: { icon: React.ReactNode; title: string; subTitle?: string; content?: string[], variant?: string }) => {
  const getVariantColor = (v: string) => {
    switch (v) {
      case 'personality': return 'cyan';
      case 'career': return 'amber';
      case 'love': return 'pink';
      case 'health': return 'emerald';
      case 'advice': return 'rose';
      case 'message': return 'teal';
      default: return 'default';
    }
  };

  const cardVariant = getVariantColor(variant);
  // Infer subtitle if not provided
  const inferredSubTitle = subTitle || {
    personality: '天生性格与潜能',
    career: '事业发展与财富',
    love: '情感婚姻与家庭',
    health: '身体健康与保养',
    advice: '每日开运锦囊',
    message: '致未来的自己',
    default: ''
  }[variant] || '';

  return (
    <GlowCard variant={cardVariant} icon={icon} title={title} subTitle={inferredSubTitle}>
      <div className="space-y-3">
        {(content || []).map((item, i) => {
          const isHeader = item.startsWith('【') && (item.trim().endsWith(':') || item.trim().endsWith('：'));
          
          if (isHeader) {
            return (
              <div key={i} className="text-sm font-bold text-slate-200 mt-5 first:mt-0 pb-2 border-b border-dashed border-white/10">
                {item}
              </div>
            );
          }
          
          return (
            <div key={i} className="text-sm text-slate-400 leading-relaxed flex gap-3 pl-1">
              <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 bg-current opacity-50`}></span>
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </GlowCard>
  );
};

const CircularProgress = ({ value, label, subLabel, color, size = 'md' }: { value: number, label: string, subLabel: string, color: string, size?: 'sm' | 'md' }) => {
  const isSmall = size === 'sm';
  const radius = isSmall ? 20 : 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const width = isSmall ? 60 : 80;
  const height = isSmall ? 60 : 80;
  const center = isSmall ? 30 : 40;
  const strokeWidth = isSmall ? 4 : 6;
  const fontSize = isSmall ? "text-sm" : "text-xl";
  const subLabelSize = isSmall ? "text-[6px]" : "text-[8px]";

  return (
    <div className={`flex flex-col items-center justify-center relative`} style={{ width, height }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${fontSize} font-bold text-white`}>{label}</span>
        <span className={`${subLabelSize} uppercase text-slate-400`}>{subLabel}</span>
      </div>
    </div>
  );
};


// Helpers
const getElementColor = (str: string) => {
  if (['甲', '乙', '寅', '卯', '木'].some(c => str.includes(c))) return 'text-[var(--neon-green)]';
  if (['丙', '丁', '巳', '午', '火'].some(c => str.includes(c))) return 'text-[var(--neon-red)]';
  if (['戊', '己', '辰', '戌', '丑', '未', '土'].some(c => str.includes(c))) return 'text-[var(--neon-yellow)]';
  if (['庚', '辛', '申', '酉', '金'].some(c => str.includes(c))) return 'text-slate-300'; // Metal grey/slate (lighter for dark mode)
  if (['壬', '癸', '亥', '子', '水'].some(c => str.includes(c))) return 'text-[var(--neon-cyan)]';
  return 'text-slate-400';
};

const getElementHexColor = (str: string) => {
  if (['木'].includes(str)) return '#22c55e'; // Green 500
  if (['火'].includes(str)) return '#ef4444'; // Red 500
  if (['土'].includes(str)) return '#eab308'; // Yellow 500
  if (['金'].includes(str)) return '#64748b'; // Slate 500
  if (['水'].includes(str)) return '#3b82f6'; // Blue 500
  return '#64748b';
};

export default Report;
