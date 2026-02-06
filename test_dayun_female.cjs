
const { Solar, Lunar } = require('lunar-typescript');

// Test case: Born 2024-02-10 12:00 (Dragon year)
// Gender: Female (0)
const solar = Solar.fromYmdHms(2024, 2, 10, 12, 0, 0);
const lunar = solar.getLunar();
const eightChar = lunar.getEightChar();
const yun = eightChar.getYun(0); // Female

console.log("Born Year:", solar.getYear());
console.log("Yun Start Year (Years count):", yun.getStartYear());

const daYunArr = yun.getDaYun();
const validDaYun = daYunArr.filter(dy => dy.getGanZhi() && dy.getGanZhi().length > 0);

console.log("Number of valid DaYun:", validDaYun.length);

if (validDaYun.length > 0) {
    const firstPillar = validDaYun[0];
    console.log("First Pillar Start Year (Actual Year):", firstPillar.getStartYear());
    console.log("First Pillar Start Age:", firstPillar.getStartAge());
    console.log("First Pillar GanZhi:", firstPillar.getGanZhi());
}

if (daYunArr.length > 0) {
    console.log("Raw [0] Start Age:", daYunArr[0].getStartAge());
    console.log("Raw [0] GanZhi:", daYunArr[0].getGanZhi());
}
