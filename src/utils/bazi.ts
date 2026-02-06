import { Solar, Lunar } from 'lunar-typescript';
import { UserInput, BaziReport, Pillar, BaziChart, LuckPillar, YearlyLuck } from '../types';

// ==========================================
// Constants & Helpers
// ==========================================

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const WUXING_MAP: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

const ZHI_HIDDEN_GAN: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '戊', '庚'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
};

// 五行生克关系 (用于文案)
const WUXING_RELATION = {
  Generate: { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' },
  Control: { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' },
};

const GAN_POLARITY: Record<string, number> = {
  '甲': 1, '乙': 0, '丙': 1, '丁': 0, '戊': 1, '己': 0, '庚': 1, '辛': 0, '壬': 1, '癸': 0
};

// 十神查找表
// Key: DayMasterElement + TargetElement + PolarityRelation (Same=1, Diff=0)
// Simplified logic:
const SHISHEN_MAP: Record<string, string> = {
  'BiJian': '比肩', 'JieCai': '劫财',
  'ShiShen': '食神', 'ShangGuan': '伤官',
  'PianCai': '偏财', 'ZhengCai': '正财',
  'QiSha': '七杀', 'ZhengGuan': '正官',
  'PianYin': '偏印', 'ZhengYin': '正印',
};

const getWuXing = (char: string): string => WUXING_MAP[char] || '';

const getShiShen = (dayMaster: string, targetGan: string): string => {
  if (!dayMaster || !targetGan) return '';
  
  const dmWuXing = getWuXing(dayMaster);
  const tWuXing = getWuXing(targetGan);
  
  const dmPol = GAN_POLARITY[dayMaster];
  const tPol = GAN_POLARITY[targetGan];
  const samePol = dmPol === tPol;

  // Compare WuXing
  if (dmWuXing === tWuXing) {
    return samePol ? '比肩' : '劫财';
  }
  
  // Check Generation/Control
  // Wood generates Fire, Fire generates Earth...
  const generates = (a: string, b: string) => WUXING_RELATION.Generate[a as keyof typeof WUXING_RELATION.Generate] === b;
  const controls = (a: string, b: string) => WUXING_RELATION.Control[a as keyof typeof WUXING_RELATION.Control] === b;

  if (generates(dmWuXing, tWuXing)) {
    // I generate it -> Output
    return samePol ? '食神' : '伤官';
  }
  if (generates(tWuXing, dmWuXing)) {
    // It generates me -> Resource
    return samePol ? '偏印' : '正印';
  }
  if (controls(dmWuXing, tWuXing)) {
    // I control it -> Wealth
    return samePol ? '偏财' : '正财';
  }
  if (controls(tWuXing, dmWuXing)) {
    // It controls me -> Officer
    return samePol ? '七杀' : '正官';
  }

  return '';
};


// ==========================================
// Main Function
// ==========================================

export const calculateBazi = (input: UserInput): BaziReport => {
  let solar: Solar;
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const [hour, minute] = input.birthTime.split(':').map(Number);

  // 1. 初始化时间对象
  try {
    if (input.isLunar) {
      const lunar = Lunar.fromYmd(year, month, day);
      solar = lunar.getSolar();
      solar = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), hour, minute, 0);
    } else {
      solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    }
  } catch (e) {
    console.error("Date parsing error:", e);
    throw new Error(input.isLunar ? `农历日期 ${year}年${month}月${day}日 不存在 (可能是该月只有29天)` : '公历日期无效');
  }

  // 2. 真太阳时校正
  if (input.useSolarTime && input.birthLocation) {
    const standardLong = 120;
    const userLong = input.birthLocation.longitude;
    const diffSeconds = (userLong - standardLong) * 4 * 60;
    
    // Fix: lunar-typescript Solar object might not have getCalendar(), construct Date manually
    // JS Date month is 0-indexed (0-11)
    const currentMs = new Date(
      solar.getYear(), 
      solar.getMonth() - 1, 
      solar.getDay(), 
      solar.getHour(), 
      solar.getMinute(), 
      solar.getSecond()
    ).getTime();

    const timestamp = currentMs + diffSeconds * 1000;
    solar = Solar.fromDate(new Date(timestamp));
  }

  // 3. 获取农历对象用于排盘
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  
  // 4. 获取四柱干支 (String)
  const yearGan = eightChar.getYearGan();
  const yearZhi = eightChar.getYearZhi();
  const monthGan = eightChar.getMonthGan();
  const monthZhi = eightChar.getMonthZhi();
  const dayGan = eightChar.getDayGan();
  const dayZhi = eightChar.getDayZhi();
  const timeGan = eightChar.getTimeGan();
  const timeZhi = eightChar.getTimeZhi();

  const dayMaster = dayGan;
  const dayMasterElement = getWuXing(dayMaster);

  // 5. 构建四柱对象
  const createPillar = (gan: string, zhi: string): Pillar => {
    return {
      gan,
      zhi,
      hiddenGan: ZHI_HIDDEN_GAN[zhi] || [],
      shishen: getShiShen(dayMaster, gan), // Gan's shishen relative to DayMaster
      wuxing: getWuXing(gan) + getWuXing(zhi),
    };
  };

  const chart: BaziChart = {
    year: createPillar(yearGan, yearZhi),
    month: createPillar(monthGan, monthZhi),
    day: { ...createPillar(dayGan, dayZhi), shishen: '日主' }, // 日主自己
    hour: createPillar(timeGan, timeZhi),
    dayMaster: dayMaster,
    dayMasterElement: dayMasterElement,
    me: dayMasterElement,
    gender: input.gender,
    solarDate: `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日 ${solar.getHour()}时`,
    lunarDate: lunar.toString(),
  };

  // 6. 大运
  // 1 = Male, 0 = Female. Ensure consistent logic.
  const genderNum = input.gender === 'male' ? 1 : 0;
  const yun = eightChar.getYun(genderNum);
  const daYunArr = yun.getDaYun();
  
  // 简单的身强身弱判定 (基于月令)
  const isStrong = isDayMasterStrong(dayMasterElement, monthZhi);
  
  // 大运评分逻辑
  const calculateLuckScore = (ganEle: string, zhiEle: string, dmEle: string, strong: boolean): number => {
    let score = 60; // 基础分
    
    // 判断喜忌
    // 身强：喜克泄耗 (官杀、食伤、财星) -> 金克木, 木生火, 木克土
    // 身弱：喜生扶 (印枭、比劫) -> 水生木, 木帮木
    
    const checkRelation = (targetEle: string): number => {
      if (targetEle === dmEle) return strong ? -1 : 1; // 比劫: 身强忌, 身弱喜
      
      const generates = (a: string, b: string) => WUXING_RELATION.Generate[a as keyof typeof WUXING_RELATION.Generate] === b;
      const controls = (a: string, b: string) => WUXING_RELATION.Control[a as keyof typeof WUXING_RELATION.Control] === b;
      
      if (generates(dmEle, targetEle)) return strong ? 1 : -1; // 食伤 (泄): 身强喜, 身弱忌
      if (generates(targetEle, dmEle)) return strong ? -1 : 1; // 印枭 (生): 身强忌, 身弱喜
      if (controls(dmEle, targetEle)) return strong ? 1 : -1;  // 财星 (耗): 身强喜, 身弱忌
      if (controls(targetEle, dmEle)) return strong ? 1 : -1;  // 官杀 (克): 身强喜(有制), 身弱忌
      
      return 0;
    };
    
    // 天干占40%, 地支占60%
    score += checkRelation(ganEle) * 10;
    score += checkRelation(zhiEle) * 15;
    
    // 随机波动 (0-5) 增加趣味性
    score += Math.floor(Math.random() * 6);
    
    return Math.max(0, Math.min(100, score));
  };

  // Filter out empty or invalid DaYun (sometimes index 0 is empty/placeholder)
  const validDaYun = daYunArr.filter(dy => dy.getGanZhi() && dy.getGanZhi().length > 0);
  
  const luckPillars: LuckPillar[] = validDaYun.slice(0, 8).map(dy => {
    const gz = dy.getGanZhi();
    const gan = gz.substring(0, 1);
    const zhi = gz.substring(1, 2);
    const ganElement = getWuXing(gan);
    const zhiElement = getWuXing(zhi);
    
    return {
      gan,
      zhi,
      startAge: dy.getStartAge(),
      startYear: dy.getStartYear(),
      ganElement,
      zhiElement,
      score: calculateLuckScore(ganElement, zhiElement, dayMasterElement, isStrong),
    };
  });

  // 7. Calculate Yearly Luck (LiuNian) for Chart (Detailed Trend)
  const yearlyLuck: YearlyLuck[] = [];
  if (luckPillars.length > 0) {
    const startYear = luckPillars[0].startYear;
    // Generate data for 80 years approx
    const endYear = startYear + 80;
    
    // Helper to find current DaYun
    const getDaYunForYear = (y: number) => {
        // Find the pillar where startYear <= y < nextPillar.startYear
        // Or simply the last one that started before or on y
        // Since luckPillars are sorted by age:
        for (let i = luckPillars.length - 1; i >= 0; i--) {
            if (y >= luckPillars[i].startYear) return luckPillars[i];
        }
        return luckPillars[0];
    };

    for (let y = startYear; y < endYear; y++) {
        const daYun = getDaYunForYear(y);
        // Calculate nominal age (Xu Sui) to align with Luck Pillars which usually use Xu Sui
        const birthYear = input.birthDate.split('-').map(Number)[0];
        const age = y - birthYear + 1; 
        
        // Use Lunar to get Yearly Pillar
        const lunarYear = Lunar.fromYmd(y, 6, 15); 
        const yearGan = lunarYear.getYearGan();
        const yearZhi = lunarYear.getYearZhi();
        const yearGanEle = getWuXing(yearGan);
        const yearZhiEle = getWuXing(yearZhi);

        // Calculate Score
        const yearlyScoreRaw = calculateLuckScore(yearGanEle, yearZhiEle, dayMasterElement, isStrong);
        
        // Blend scores: DaYun (60%) + Yearly (40%)
        let finalScore = (daYun.score * 0.6) + (yearlyScoreRaw * 0.4);
        
        // Add volatility (Sine wave + Noise)
        const volatility = Math.sin(y * 0.5) * 5 + (Math.random() * 6 - 3);
        finalScore += volatility;

        // Clamp
        finalScore = Math.max(10, Math.min(95, finalScore));

        yearlyLuck.push({
            year: y,
            age: age < 0 ? 0 : age, // Ensure non-negative
            gan: yearGan,
            zhi: yearZhi,
            score: Math.round(finalScore),
            daYun: `${daYun.gan}${daYun.zhi}`
        });
    }
  }

  // 7. 五行分析 (Original step 7 becomes 8)
  const elements = [
    getWuXing(yearGan), getWuXing(yearZhi),
    getWuXing(monthGan), getWuXing(monthZhi),
    getWuXing(dayGan), getWuXing(dayZhi),
    getWuXing(timeGan), getWuXing(timeZhi),
  ];
  
  const scores: Record<string, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  elements.forEach(e => {
    if (scores[e] !== undefined) scores[e]++;
  });
  
  const sortedElements = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const strongest = sortedElements[0][0];
  const weakest = sortedElements[sortedElements.length - 1][0];
  const missing = sortedElements.filter(e => e[1] === 0).map(e => e[0]);

  // 8. 生成文案
  const { personality, career, love, health, advice, lifeMessage } = generateAnalysis(chart, scores, missing, isStrong, luckPillars);

  // 9. 计算人生能量值
  const lifeEnergy = calculateLifeEnergy(dayMasterElement, scores, isStrong);

  return {
    chart,
    luckPillars,
    yearlyLuck,
    wuxing: {
      scores,
      strongest,
      weakest,
      missing,
    },
    analysis: {
      personality,
      career,
      love,
      health,
      advice,
      lifeMessage
    },
    lifeEnergy
  };
};

// Helper for Life Energy
const calculateLifeEnergy = (dmElement: string, wuxingScores: Record<string, number>, isStrong: boolean) => {
  // 1. Identify Ten Gods Elements
  const me = dmElement;
  // Generate: Me generates Output
  const output = WUXING_RELATION.Generate[me as keyof typeof WUXING_RELATION.Generate];
  // Control: Me controls Wealth
  const wealth = WUXING_RELATION.Control[me as keyof typeof WUXING_RELATION.Control];
  // Officer: Controls Me
  const officer = Object.keys(WUXING_RELATION.Control).find(k => WUXING_RELATION.Control[k as keyof typeof WUXING_RELATION.Control] === me) || '';
  // Resource: Generates Me
  const resource = Object.keys(WUXING_RELATION.Generate).find(k => WUXING_RELATION.Generate[k as keyof typeof WUXING_RELATION.Generate] === me) || '';

  const getScore = (elm: string) => (wuxingScores[elm] || 0);

  // 2. Calculate Dimension Scores (0-100)
  // Base score calculation with some randomness for "Game Feel"
  const calcBase = (val: number) => Math.min(95, 60 + val * 8 + Math.random() * 5);

  const careerScore = calcBase(getScore(officer) * 1.5 + getScore(output) * 0.5);
  const wealthScore = calcBase(getScore(wealth) * 1.5 + getScore(output) * 0.5); // Output generates Wealth
  const wisdomScore = calcBase(getScore(resource) * 1.5 + getScore(output) * 0.5); // Resource = Input, Output = Expression
  
  // Emotion: Harmony. 
  const spouseStar = getScore(wealth) + getScore(officer);
  const emotionScore = calcBase(spouseStar * 0.8 + (isStrong ? getScore(wealth) : getScore(officer)) * 0.5);

  // Health: Balance.
  const missingCount = Object.values(wuxingScores).filter(v => v === 0).length;
  const excessiveCount = Object.values(wuxingScores).filter(v => v >= 4).length;
  const healthScore = 90 - (missingCount * 5) - (excessiveCount * 5);

  const scores = {
    career: Math.floor(careerScore),
    wealth: Math.floor(wealthScore),
    emotion: Math.floor(emotionScore),
    health: Math.floor(healthScore),
    wisdom: Math.floor(wisdomScore),
  };

  const totalScore = Math.floor((scores.career + scores.wealth + scores.emotion + scores.health + scores.wisdom) / 5);

  // SubScores for Bars
  const nobleman = calcBase(getScore(resource) * 1.2 + (getScore(officer) > 0 ? 2 : 0)); // Resource represents help
  const peachBlossom = calcBase(getScore(wealth) + getScore(output)); // Wealth/Output = Charisma

  return {
    scores,
    totalScore,
    description: `根据您的生辰八字分析，您的整体运势评分为 ${totalScore}分，属于${totalScore > 80 ? '上等' : totalScore > 65 ? '中等' : '潜力'}水平。您的命格属于${me}命，性格${isStrong ? '刚毅果断' : '温和内敛'}，${missingCount === 0 ? '五行平衡' : '五行有所偏颇'}，${scores.career > scores.wealth ? '适合追求事业成就，在职场中容易获得突破' : '适合追求财富积累，商业嗅觉敏锐'}。`,
    subScores: {
      nobleman: Math.floor(nobleman),
      peachBlossom: Math.floor(peachBlossom),
      career: Math.floor(careerScore),
      wealth: Math.floor(wealthScore),
    }
  };
};

// Helper for Strong/Weak
const isDayMasterStrong = (dmElement: string, mZhi: string): boolean => {
  const mZhiElement = getWuXing(mZhi);
  // 得令 (月支生助日主)
  const generates = (a: string, b: string) => WUXING_RELATION.Generate[a as keyof typeof WUXING_RELATION.Generate] === b;
  return dmElement === mZhiElement || generates(mZhiElement, dmElement);
};

function generateAnalysis(chart: BaziChart, scores: Record<string, number>, missing: string[], isStrong: boolean, luckPillars: LuckPillar[]) {
  const me = chart.dayMasterElement;
  const dayGan = chart.day.gan;
  const dayZhi = chart.day.zhi;

  // Calculate strongest and weakest for internal use
  const sortedElements = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const strongest = sortedElements[0][0];
  const weakest = sortedElements[sortedElements.length - 1][0];
  
  // Day Master Poems (Poetic description of the Day Master)
  const POEMS: Record<string, string> = {
    '甲': '栋梁之才生性直，高大威严有志气。仁慈心善多恻隐，刚健进取不知疲。',
    '乙': '藤萝花草生性柔，能屈能伸亦无忧。聪明灵秀多才艺，依附贵人好出头。',
    '丙': '太阳之火光万丈，热情豪爽照四方。光明磊落心无毒，只是性急易受伤。',
    '丁': '灯烛之火夜生明，内敛温柔更重情。思维缜密多心计，外柔内刚最分明。',
    '戊': '城墙厚土重信义，稳重踏实有根基。包容万物心宽广，只怕固执失良机。',
    '己': '田园之土生万物，心地善良性温和。多才多艺善筹谋，疑心重重反成魔。',
    '庚': '刚健锐利如刀剑，果断侠义不虚言。好打不平心刚直，只怕伤人亦伤缘。',
    '辛': '珠玉金银温润光，外表柔和内刚强。爱慕虚荣重面子，细腻敏感费思量。',
    '壬': '江河之水流不息，聪明智慧有机智。宽宏大量能容物，任性奔波难自持。',
    '癸': '雨露之水润无声，温柔内向重感情。心思细腻多变化，阴晴不定最难明。'
  };

  // Day Master Descriptions (Detailed analysis)
  const DM_DESC: Record<string, string> = {
    '甲': '作为「甲木」，你像一颗参天大树。你有很强的进取心和责任感，正直、仁慈，不屑于搞小动作。你希望成为栋梁之才，保护身边的人。但有时你可能过于固执，像大树一样难以弯曲，容易在风雨中折断。',
    '乙': '作为「乙木」，你像花草藤萝。你性格柔和，适应能力极强，所谓“能屈能伸”。你心思细腻，善于察言观色，有很好的艺术天分。你比甲木更懂得生存之道，但也更容易依赖他人，内心缺乏安全感，容易多愁善感。',
    '丙': '作为「丙火」，你像天上的太阳。你热情、开朗、大方，走到哪里都能带来光和热。你从不记仇，也不藏着掖着，光明磊落。但你有时过于急躁，容易冲动，好面子，可能会因为说话太直而无意中得罪人。',
    '丁': '作为「丁火」，你像夜晚的烛光。你外表温和，内心却很有主见。你心思缜密，观察力强，比丙火更注重细节。你重感情，甚至有些感性，容易为了别人燃烧自己。但你内心敏感，容易想太多，有时候会陷入自我纠结。',
    '戊': '作为「戊土」，你像厚重的高山。你稳重、踏实，非常讲信用。你心胸宽广，包容力强，是大家值得信赖的依靠。你做事按部就班，不喜欢变动。但你有时反应较慢，固执己见，不懂变通，可能会错过一些稍纵即逝的机会。',
    '己': '作为「己土」，你像田园里的泥土。你温和、善良，具有很强的包容性和孕育能力。你做事细心，有条理，多才多艺。你虽然外表随和，但内心很有城府，疑心病较重，不容易真正信任一个人，喜欢把事情藏在心里。',
    '庚': '作为「庚金」，你像锋利的刀剑。你性格刚毅，果断，讲义气，好打抱不平。你做事干脆利落，不喜欢拖泥带水。你有很强的执行力，但也容易因为过于刚直而伤人。你需要经历磨练（火炼）才能成大器。',
    '辛': '作为「辛金」，你像珍贵的首饰。你外表温润，气质高雅，非常爱面子，注重仪表。你内心刚毅，自尊心极强，受不得半点委屈。你心思细腻，敏感，有时会因为一点小事而耿耿于怀，甚至会有一些虚荣心。',
    '壬': '作为「壬水」，你像奔腾的江河。你聪明、智慧，思维活跃，反应极快。你喜欢自由，讨厌束缚，有很强的闯劲。你宽宏大量，但也容易任性，有时候做事三分钟热度，缺乏持久的耐性，情绪波动也比较大。',
    '癸': '作为「癸水」，你像春天的雨露。你温柔、内敛，富有同情心。你心思极其细腻，想象力丰富，重情重义。你做事喜欢慢慢渗透，不喜欢正面冲突。但你有时过于阴沉，容易悲观，喜欢把事情往坏处想，情绪化比较严重。'
  };

  const personality = [
    `日主为${dayGan}${me}`,
    '【基本性格】:',
    `${DM_DESC[dayGan]}`,
    '【诗云】:',
    `${POEMS[dayGan]}`,
    '【命理原象】:',
    `日干为「${dayGan}」，五行属「${me}」。日支为「${dayZhi}」，五行属「${getWuXing(dayZhi)}」。${
      me === getWuXing(dayZhi) ? '干支同气，自我意识强，主观性强。' : 
      WUXING_RELATION.Generate[me as keyof typeof WUXING_RELATION.Generate] === getWuXing(dayZhi) ? '日主生坐下，为人付出，对配偶关爱有加。' :
      WUXING_RELATION.Generate[getWuXing(dayZhi) as keyof typeof WUXING_RELATION.Generate] === me ? '坐下生日主，得配偶或家庭助力，内心有依靠。' :
      WUXING_RELATION.Control[me as keyof typeof WUXING_RELATION.Control] === getWuXing(dayZhi) ? '日主克坐下，控制欲较强，在家庭中占据主导。' :
      '坐下克日主，责任感强，或受家庭/配偶约束较多。'
    }`
  ];

  // Determine Favorable Elements (Xi Yong Shen)
  // Simplified logic:
  // Weak: Likes Resource (Generate Me) and Peer (Same)
  // Strong: Likes Wealth (I Control), Officer (Control Me), Output (I Generate)
  const getFavorableElements = (dm: string, strong: boolean) => {
    const resource = Object.entries(WUXING_RELATION.Generate).find(([k, v]) => v === dm)?.[0] || '';
    const output = WUXING_RELATION.Generate[dm as keyof typeof WUXING_RELATION.Generate];
    const wealth = WUXING_RELATION.Control[dm as keyof typeof WUXING_RELATION.Control];
    const officer = Object.entries(WUXING_RELATION.Control).find(([k, v]) => v === dm)?.[0] || '';
    
    if (strong) {
      return [wealth, officer, output]; // Wealth, Officer, Output
    } else {
      return [resource, dm]; // Resource, Peer
    }
  };

  const favorableElements = getFavorableElements(me, isStrong);
  const primaryFavorable = favorableElements[0]; // Use the first one for primary industry recommendation

  const INDUSTRIES: Record<string, string> = {
    '木': '文化教育、医疗卫生、园林种植、家具设计、公务员、出版业',
    '火': '互联网、人工智能、能源化工、餐饮娱乐、美容美发、自媒体',
    '土': '房地产、建筑工程、农业畜牧、企业管理、仓储物流、古董买卖',
    '金': '金融证券、五金机械、法律法务、外科医生、珠宝首饰、汽车交通',
    '水': '进出口贸易、旅游运输、清洁环保、服务行业、自由职业、营销策划'
  };

  // Strategy Logic
  let strategy = '';
  // Special Case: Yi Wood + Jia Wood (Vine to Pine)
  const hasJia = [chart.year.gan, chart.month.gan, chart.hour.gan].includes('甲') || 
                 [chart.year.zhi, chart.month.zhi, chart.day.zhi, chart.hour.zhi].some(z => ['寅', '亥'].includes(z));
  
  if (dayGan === '乙' && hasJia) {
    strategy = '【藤萝系甲】: 你的命局自带「藤萝系甲」格局。乙木为藤，甲木为松柏。建议在职场中寻找强大的合作伙伴或平台（大树）进行依附和合作。不要单打独斗，背靠大树好乘凉，利用贵人的资源能让你事半功倍。';
  } else if (!isStrong) {
    strategy = '【借力使力】: 命局能量偏弱，职场上不宜过于锋芒毕露或单打独斗。核心策略是「寻找靠山」和「团队合作」。多考取证书（印星代表资源/学历），多结交行业内的前辈或朋友（比劫代表同僚），用平台和团队的力量来弥补自身的不足。';
  } else {
    strategy = '【独当一面】: 命局能量强旺，具备很强的抗压能力和执行力。职场上适合「主动出击」，承担核心责任。适合开拓性工作，或者处于领导位置。注意收敛锋芒，避免功高盖主，利用你的才华（食伤）或管理能力（官杀）去创造价值。';
  }

  // Wealth Logic
  const wealthStars = ['正财', '偏财'];
  const hasWealth = [chart.year.shishen, chart.month.shishen, chart.hour.shishen].some(s => wealthStars.includes(s));
  const hasPianCai = [chart.year.shishen, chart.month.shishen, chart.hour.shishen].includes('偏财');
  
  let wealthAdvice = '';
  if (hasPianCai) {
    if (isStrong) {
      wealthAdvice = '【偏财得用】: 命带偏财且身强，天生有投资眼光和意外之财的运势。适合从事副业、投资、理财或经商。可以适当进行风险投资，甚至有机会通过非工资收入实现财富跃迁。';
    } else {
      wealthAdvice = '【财多身弱】: 虽有偏财机遇，但自身能量恐难驾驭巨额财富。建议「见好就收」，不要过度贪婪。投资需谨慎，宜通过团队或合伙人（比劫）来共同求财，分担风险。';
    }
  } else if (hasWealth) {
    // Only ZhengCai
    wealthAdvice = '【正财稳健】: 命局以正财为主，财源主要来自于本职工作和稳定薪资。建议深耕主业，通过升职加薪积累财富。不宜进行高风险投机，稳健理财是王道。';
  } else {
    // No explicit Wealth Star (check Output or just general advice)
    if (isStrong) {
      wealthAdvice = '【技艺生财】: 命局财星不显，但身强有力。财富多来源于你的专业技能或才华（食伤生财）。只要拥有一技之长，并在行业内做到极致，财富自然随之而来。';
    } else {
      wealthAdvice = '【积少成多】: 财运需要依靠积累。初期可能较为辛苦，需要通过不断的学习和积累人脉来开辟财源。建议养成储蓄习惯，开源节流。';
    }
  }

  const career = [
    '【行业选择】:',
    `建议优先选择五行属 <${primaryFavorable}> 的行业（补运法）。例如：${INDUSTRIES[primaryFavorable] || '该五行相关行业'}。其次可选择属 <${favorableElements[1] || favorableElements[0]}> 的行业。`,
    '【职场策略】:',
    `${strategy}`,
    '【财运规划】:',
    `${wealthAdvice}`
  ];

  // Love & Marriage Logic
  const SIX_CLASHES: Record<string, string> = {
    '子': '午', '午': '子',
    '丑': '未', '未': '丑',
    '寅': '申', '申': '寅',
    '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰',
    '巳': '亥', '亥': '巳',
  };

  const dayClash = SIX_CLASHES[dayZhi];
  const hasDayMonthClash = chart.month.zhi === dayClash;
  const hasDayYearClash = chart.year.zhi === dayClash;
  const hasDayHourClash = chart.hour.zhi === dayClash;

  const PARTNER_TYPE: Record<string, string> = {
    '水': '寻找“印星”或“包容”型伴侣：对方最好能给您带来温暖、包容和支持（五行水主智、主柔），或者能够理解并分担您的压力。',
    '火': '寻找“食伤”或“才华”型伴侣：对方最好热情开朗，欣赏您的才华，能逗您开心（五行火主礼、主热）。',
    '木': '寻找“仁慈”或“正直”型伴侣：对方最好积极向上，心地善良，像大树一样给您依靠（五行木主仁、主直）。',
    '金': '寻找“果断”或“义气”型伴侣：对方最好做事干练，有原则，能帮您理清生活中的决断（五行金主义、主刚）。',
    '土': '寻找“稳重”或“踏实”型伴侣：对方最好诚实守信，包容心强，能给您十足的安全感（五行土主信、主厚）。'
  };

  const partnerAdvice = PARTNER_TYPE[primaryFavorable] || PARTNER_TYPE[favorableElements[0]] || '寻找能与您五行互补的伴侣。';

  let marriageAdvice = '正视关系中的波动。';
  if (hasDayMonthClash || hasDayYearClash) {
    marriageAdvice = `正视“${dayZhi}${dayClash}冲”：您的夫妻宫与${hasDayMonthClash ? '月支' : '年支'}相冲。认识到您的婚姻天生存在不稳定的基因。这不代表一定会离婚，而是需要您们双方都有经营的意识和智慧。`;
  } else {
    marriageAdvice = '用心经营：虽然夫妻宫无明显刑冲，但平淡的生活更需要仪式感来点缀。';
  }

  // Communication Advice based on DM
  const commsAdvice = ['丙', '丁'].includes(dayGan) 
    ? '有效沟通：您性格热情或细腻，但有时容易急躁或想太多。有话直说但要温和。' 
    : ['戊', '己', '甲', '乙'].includes(dayGan)
    ? '有效沟通：您可能偏向稳重或内敛，不喜表达。但婚姻中的问题，沉默是毒药。要学会把您的感受说出来。'
    : '有效沟通：保持真诚的交流，不要让冷战消耗感情。';

  // Critical Years
  const criticalYears = `关注关键年份：逢${dayClash}年，都是婚姻关系的考验期，需加倍耐心和包容。`;

  // Family Analysis
  const monthZhiMainQi = ZHI_HIDDEN_GAN[chart.month.zhi]?.[0];
  const monthZhiShishen = getShiShen(chart.dayMaster, monthZhiMainQi);
  
  let parentRel = `与父母：月柱为父母宫。${hasDayMonthClash ? '逢冲，可能与父母缘分不深，或父母对您管束严格，关系较为紧张。' : '月柱稳健，父母是您的坚实后盾。'}`;
  if (monthZhiShishen === '七杀') {
    parentRel += ' 月令坐七杀，父母可能较为严厉或对您期望极高。';
  }

  const hourZhiMainQi = ZHI_HIDDEN_GAN[chart.hour.zhi]?.[0];
  const hourZhiShishen = getShiShen(chart.dayMaster, hourZhiMainQi);
  
  let childRel = `与子女：时柱为子女宫，坐${hourZhiShishen}。`;
  if (['食神', '伤官'].includes(hourZhiShishen)) {
    childRel += ' 子女星得位，孩子聪明伶俐，才华出众。';
  } else if (['七杀', '正官'].includes(hourZhiShishen)) {
    childRel += ' 子女宫见官杀，子女个性较强，或您对子女管教较严。';
  } else {
    childRel += ' 与子女关系正常发展，晚年可享天伦之乐。';
  }

  const love = [
    '这是您人生中需要投入最多心力去经营的领域。',
    '【择偶标准】:',
    `${partnerAdvice}`,
    '避免“官杀”过重或性格极端的伴侣：如果对方控制欲过强，关系将难以平衡。',
    (dayGan === '乙' && hasJia) ? '利用“藤萝系甲”：您的伴侣很可能也是您事业上的“甲木”，能力强，有社会地位。' : '',
    '【婚姻经营】:',
    `${marriageAdvice}`,
    `${commsAdvice}`,
    hasDayMonthClash ? `保持距离美：适当的空间和距离，对于缓解“${dayZhi}${dayClash}冲”的紧张关系有好处。` : '',
    `${criticalYears}`,
    '【家庭关系】:',
    `${parentRel}`,
    `${childRel}`
  ].filter(Boolean);

  // Health Logic
  const getCoreHealthIssues = () => {
    const issues = [];
    
    // 1. Clashes (Simplified: Check Strongest vs Weakest)
    const strongestEl = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const weakestEl = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
    
    if (strongestEl[1] >= 3 && weakestEl[1] <= 1) {
      const s = strongestEl[0];
      const w = weakestEl[0];
      if (WUXING_RELATION.Control[s as keyof typeof WUXING_RELATION.Control] === w) {
        issues.push({
          title: `${s}${w}交战`,
          desc: `强${s}克弱${w}。“${w}”${getOrgan(w)}。“${s}”${getOrgan(s)}。因此，您要终身提防：${getSymptoms(w)}等问题。`
        });
      }
    }
    
    // 2. Temperature (Month Zhi)
    const monthZhi = chart.month.zhi;
    if (['亥', '子', '丑'].includes(monthZhi)) {
      issues.push({
        title: '寒湿过重',
        desc: `生于${monthZhi}月，局中水寒土湿。${['丑', '辰'].includes(monthZhi) ? '土主脾胃' : '水主肾膀胱'}。易有${['丑', '辰'].includes(monthZhi) ? '消化不良、胃寒' : '腰膝酸软、体寒怕冷'}、女性妇科（寒凝血瘀）等问题。`
      });
    } else if (['巳', '午', '未'].includes(monthZhi)) {
       issues.push({
        title: '火炎土燥',
        desc: `生于${monthZhi}月，局中火旺土燥。易有心火旺、失眠多梦、皮肤干痒、便秘等问题。`
      });
    }

    if (issues.length === 0) {
      issues.push({
        title: '五行流通',
        desc: '您的五行能量相对平衡，无明显的严重冲克。主要注意季节交替时的基础保养即可。'
      });
    }

    return issues;
  };

  const getOrgan = (elm: string) => {
    const map: Record<string, string> = {
      '木': '主肝、胆、头、神经、四肢',
      '火': '主心、小肠、血液、眼睛',
      '土': '主脾、胃、消化、肌肉',
      '金': '主肺、呼吸道、大肠、皮肤、骨骼',
      '水': '主肾、膀胱、生殖系统、耳'
    };
    return map[elm] || '';
  };

  const getSymptoms = (elm: string) => {
    const map: Record<string, string> = {
      '木': '神经衰弱、焦虑、抑郁、失眠、肝气郁结、头痛、四肢易受伤',
      '火': '心律不齐、高血压、贫血、视力下降、心神不宁',
      '土': '消化不良、胃病、身体沉重、消瘦或肥胖',
      '金': '呼吸系统敏感、易感冒咳嗽、皮肤过敏、鼻炎',
      '水': '肾虚、水肿、生殖系统疾病、畏寒肢冷'
    };
    return map[elm] || '';
  };

  const coreIssues = getCoreHealthIssues();
  
  // Wellness Principles
  const principles = [];
  if (favorableElements.includes('火')) principles.push('暖局', '补火');
  if (favorableElements.includes('水')) principles.push('润燥', '补水');
  if (favorableElements.includes('木')) principles.push('扶木', '疏肝');
  if (favorableElements.includes('金')) principles.push('强金', '宣肺');
  if (favorableElements.includes('土')) principles.push('健脾', '固本');
  
  const wellnessMotto = principles.join('、');

  const dietAdvice = () => {
    const foods: Record<string, string> = {
      '木': '绿色蔬菜、酸味食物（入肝）、猕猴桃、绿茶',
      '火': '红枣、桂圆、羊肉、辣椒（适量）、红豆、苹果',
      '土': '小米、南瓜、红薯、牛肉、黄色食物',
      '金': '白萝卜、梨、银耳、百合、鸡肉、辛味食物',
      '水': '黑豆、黑芝麻、黑木耳、海鲜、咸味食物（适量）'
    };
    const avoid = primaryFavorable === '火' ? '忌食生冷寒凉：冰饮、西瓜、螃蟹等务必节制。' : 
                  primaryFavorable === '水' ? '忌食辛辣燥热：烧烤、油炸、烈酒等。' : '少吃加工食品，保持饮食清淡。';
    
    return [
      `多食属${primaryFavorable}、属${favorableElements[1] || primaryFavorable}的食物：如${foods[primaryFavorable]}等。`,
      avoid
    ];
  };

  const exerciseAdvice = () => {
    if (primaryFavorable === '火' || primaryFavorable === '木') return '适合能让身体发热、出汗的运动，如慢跑、瑜伽、舞蹈、羽毛球。多晒太阳，吸收阳气。';
    if (primaryFavorable === '水' || primaryFavorable === '金') return '适合游泳、太极、散步等较为柔和或流动的运动。避免大汗淋漓伤津。';
    return '适合徒步、爬山、园艺等接触大自然的运动。';
  };

  const emotionAdvice = () => {
    if (weakest === '木') return '“肝主怒”，您要学会疏导情绪，避免生闷气。要刻意练习积极心理学，多看喜剧，多和乐观的朋友在一起。';
    if (weakest === '火') return '“心主喜”，但也容易焦虑。建议多做冥想，保持心态平和，避免大喜大悲。';
    if (weakest === '土') return '“脾主思”，您可能容易思虑过重。建议多做户外活动，不要把自己关在屋子里想问题。';
    if (weakest === '金') return '“肺主悲”，您可能容易多愁善感。秋季尤其要注意调节情绪，多做扩胸运动。';
    return '“肾主恐”，您可能容易缺乏安全感。建议多晒太阳，增强自信。';
  };
  
  const health = [
    '您的健康问题主要源于五行能量的分布现状。',
    '【核心病灶】:',
    ...coreIssues.map(i => `${i.title}：${i.desc}`),
    '【养生总则】:',
    `“${wellnessMotto}”`,
    '【饮食建议】:',
    ...dietAdvice(),
    '【运动建议】:',
    exerciseAdvice(),
    '【情志调摄】:',
    emotionAdvice(),
    '【中医理疗】:',
    primaryFavorable === '火' ? '艾灸是绝佳的暖局祛湿方法，可以常灸关元、足三里、命门等穴位。' : '可尝试推拿按摩，疏通经络。',
    '【心性修炼】:',
    '接纳压力：认识到压力是您生命的底色，是您成就的基石。不抗拒它，而是学习与它共舞。'
  ];

  // Lucky Tips Logic
  const allElements = ['木', '火', '土', '金', '水'];
  const unfavorableElements = allElements.filter(e => !favorableElements.includes(e));

  const INFO: Record<string, any> = {
    '木': { 
      dir: '东方、东南方', 
      color: '绿色、青色、翠色', 
      num: '3、8', 
      item: '木质饰品、佛珠、植物',
      animal: '虎、兔',
      goodDesc: '您的贵人方位，适合居住、工作，能增强健康运。',
      badDesc: '压力最大的方位，尽量避免。'
    },
    '火': { 
      dir: '南方', 
      color: '红色、紫色、粉色', 
      num: '2、7', 
      item: '红绳、朱砂、电子产品、灯光',
      animal: '蛇、马',
      goodDesc: '您最重要的事业发展和求财方位，能增强自信和活力。',
      badDesc: '容易引发口舌是非或急躁情绪的方位。'
    },
    '土': { 
      dir: '本地、东北、西南', 
      color: '黄色、棕色、卡其色', 
      num: '5、0', 
      item: '玉石、陶瓷、黄水晶',
      animal: '龙、狗、牛、羊',
      goodDesc: '利于置业安家，能给您带来稳稳的安全感。',
      badDesc: '耗泄您精力、助长压力的方位。'
    },
    '金': { 
      dir: '西方、西北方', 
      color: '白色、金色、银色', 
      num: '4、9', 
      item: '金银饰品、金属腕表',
      animal: '猴、鸡',
      goodDesc: '利于决策和执行，能增强您的决断力。',
      badDesc: '容易产生肃杀之气，增加心理压力的方位。'
    },
    '水': { 
      dir: '北方', 
      color: '黑色、蓝色、灰色', 
      num: '1、6', 
      item: '黑曜石、水晶、流动挂件',
      animal: '猪、鼠',
      goodDesc: '利于思考和策划，化解危机，带来贵人。',
      badDesc: '容易陷入情绪低落或漂泊不定的方位。'
    }
  };

  const advice = [
    '您的专属幸运密码',
    '【有利方位】:',
    ...favorableElements.map(e => `${INFO[e].dir}（${e}）：${INFO[e].goodDesc}`),
    '【不利方位】:',
    ...unfavorableElements.map(e => `${INFO[e].dir}（${e}）：${INFO[e].badDesc}`),
    '【幸运色彩】:',
    ...favorableElements.map(e => `${INFO[e].color}（${e}）：${e === primaryFavorable ? '首选色，' : '次选色，'}能增强气场。`),
    '【忌用色彩】:',
    ...unfavorableElements.map(e => `${INFO[e].color}（${e}）。`),
    '【幸运数字】:',
    ...favorableElements.map(e => `${INFO[e].num} (五行属${e})`),
    '【开运饰品/吉祥物】:',
    `${INFO[primaryFavorable].item}。`,
    `生肖萌物：${INFO[primaryFavorable].animal}。`,
    `家居风水：在${INFO[primaryFavorable].dir}，可以摆放${INFO[primaryFavorable].item}或长明灯，催旺${primaryFavorable}运。`
  ];

  // Life Message Logic (Taoist Style)
  const generateLifeMessage = () => {
    const dm = dayGan;
    const dmDesc = WUXING_MAP[dm] || '行';
    
    let natureDesc = '';
    if (isStrong) {
      natureDesc = `福主元神强旺，如${dmDesc}之势，中正刚毅。天行健，君子以自强不息。您骨子里有一股不服输的韧劲，此乃成事之基，亦是修身之本。`;
    } else {
      natureDesc = `福主元神温润，如${dmDesc}之质，内敛含蓄。地势坤，君子以厚德载物。您善于审时度势，以柔克刚，此乃智慧之源，亦是安身之所。`;
    }

    // Check for "late bloomer" pattern (good luck in later pillars)
    const lateLuck = luckPillars.slice(3).some(l => l.score >= 70);
    const flowDesc = lateLuck 
      ? '观您命盘，实乃一曲先抑后扬的交响乐。早年或许波折磨砺，皆是天将降大任之前的苦其心志。待时机一到，如潜龙出渊，必将腾必九霄。'
      : '观您命盘，行云流水，自有其节奏。人生起伏本是常态，莫问前程凶吉，但求落幕无悔。顺境时不骄不躁，逆境时亦能安然自若，方为大智慧。';

    return [
      '【结语】:',
      `福主，${flowDesc}`,
      `${natureDesc}`,
      `所谓“命”者，先天之定数；“运”者，后天之造化。今贫道为您点出“${primaryFavorable}”字为机锋，望您在人生岔路口时，能多向${INFO[primaryFavorable].dir}而行，多亲近${INFO[primaryFavorable].color}之物，顺应天时地利。`,
      '贫道言尽于此。天道酬勤，更酬心善。愿福主知命而不认命，在因果流转中，修得一颗圆满无碍之心。',
      '无量寿佛。'
    ];
  };

  const lifeMessage = generateLifeMessage();

  return { personality, career, love, health, advice, lifeMessage };
}
