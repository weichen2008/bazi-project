import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, ArrowRight, Zap, MapPin } from 'lucide-react';
import { useBaziStore } from '../store/useBaziStore';
import { calculateBazi } from '../utils/bazi';
import { getLongitude } from '../utils/cityData';
import { UserInput } from '../types';

const Home = () => {
  const navigate = useNavigate();
  const setInput = useBaziStore((state) => state.setInput);
  const setReport = useBaziStore((state) => state.setReport);
  const saveRecord = useBaziStore((state) => state.saveRecord);

  const [formData, setFormData] = useState<UserInput>({
    name: '',
    gender: 'male',
    birthDate: '',
    birthTime: '12:00',
    isLunar: false,
    useSolarTime: false,
    birthLocation: {
      province: '',
      city: '',
      longitude: 120.0,
      latitude: 30.0,
    },
  });

  const [isDateFocused, setIsDateFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.birthDate) {
      alert('请输入完整信息');
      return;
    }

    // 1. 保存输入
    setInput(formData);

    // 2. 计算排盘
    try {
      const report = calculateBazi(formData);
      setReport(report);
      saveRecord(); // 自动保存历史
      
      // 3. 跳转
      navigate('/report');
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`排盘计算出错: ${errorMessage}\n请检查输入日期是否有效（特别是农历日期是否存在）`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--cyber-bg)]">
      {/* 赛博朋克背景光效 */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[var(--neon-cyan)] opacity-10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-[var(--neon-purple)] opacity-10 rounded-full blur-[100px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md cyber-card z-10 relative"
      >
        <div className="text-center mb-8">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 20px rgba(6,182,212,0.4)",
                "0 0 40px rgba(6,182,212,0.8)",
                "0 0 20px rgba(6,182,212,0.4)"
              ]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[var(--neon-cyan)] to-blue-600 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            <Zap className="w-6 h-6 text-white fill-white" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2 text-white tracking-wider">
            量子<span className="text-[var(--neon-cyan)]">命运系统</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            人生K线图
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 姓名与性别 */}
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-200" />
              <input
                type="text"
                placeholder="请输入姓名"
                className="cyber-input pl-12"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'male' })}
                className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                  formData.gender === 'male'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                男性
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'female' })}
                className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                  formData.gender === 'female'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)] border border-fuchsia-400/30'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                女生
              </button>
            </div>
          </div>

          {/* 出生日期 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">出生日期</label>
              <div className="flex bg-slate-800/80 border border-slate-700 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isLunar: false })}
                  className={`text-[10px] px-3 py-1 rounded-md transition-all ${!formData.isLunar ? 'bg-[var(--theme-primary)] text-slate-900 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  公历
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isLunar: true })}
                  className={`text-[10px] px-3 py-1 rounded-md transition-all ${formData.isLunar ? 'bg-[var(--theme-primary)] text-slate-900 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  农历
                </button>
              </div>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-200" />
              <input
                type={formData.birthDate || isDateFocused ? "date" : "text"}
                placeholder="年/月/日"
                onFocus={() => setIsDateFocused(true)}
                onBlur={() => setIsDateFocused(false)}
                max="9999-12-31"
                className="cyber-input pl-12"
                value={formData.birthDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && val.split('-')[0].length > 4) return;
                  setFormData({ ...formData, birthDate: val });
                }}
              />
            </div>
          </div>

          {/* 出生时间 */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">出生时间</label>
            <div className="relative">
              <Clock className="absolute left-3 top-3.5 w-5 h-5 text-slate-200" />
              <input
                type="time"
                className="cyber-input pl-12"
                value={formData.birthTime}
                onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full cyber-btn-primary flex items-center justify-center gap-2 mt-8 group"
          >
            <span className="tracking-widest">启动人生</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Home;
