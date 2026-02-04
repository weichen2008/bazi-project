export type Gender = 'male' | 'female';
export type CalendarType = 'solar' | 'lunar';

export interface UserInput {
  name: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  isLunar: boolean;
  birthLocation?: {
    province: string;
    city: string;
    area?: string;
    longitude: number;
    latitude: number;
  };
  useSolarTime: boolean;
}

export interface Pillar {
  gan: string; // 天干
  zhi: string; // 地支
  hiddenGan: string[]; // 藏干
  shishen: string; // 十神 (对日主)
  nayin?: string; 
  wuxing: string; // 柱的五行属性 (例如 "木火")
}

export interface BaziChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  dayMaster: string; // 日主天干
  dayMasterElement: string; // 日主五行
  me: string; // 日主五行
  gender: Gender;
  solarDate: string;
  lunarDate: string;
}

export interface LuckPillar {
  gan: string;
  zhi: string;
  startAge: number;
  startYear: number;
  ganElement: string;
  zhiElement: string;
  score: number; // 运势评分 (0-100)
}

export interface YearlyLuck {
  year: number;
  age: number;
  gan: string;
  zhi: string;
  score: number;
  daYun: string;
}

export interface BaziReport {
  chart: BaziChart;
  luckPillars: LuckPillar[];
  yearlyLuck: YearlyLuck[];
  wuxing: {
    scores: Record<string, number>; // 金木水火土的分数
    strongest: string;
    weakest: string;
    missing: string[]; // 缺少的五行
  };
  analysis: {
    personality: string[];
    career: string[];
    love: string[];
    health: string[];
    advice: string[];
    lifeMessage: string[];
  };
  lifeEnergy: {
    scores: {
      career: number;
      wealth: number;
      emotion: number;
      health: number;
      wisdom: number;
    };
    totalScore: number;
    description: string;
    subScores: {
      nobleman: number;
      peachBlossom: number;
      career: number;
      wealth: number;
    };
  };
}
