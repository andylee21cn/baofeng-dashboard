// 关键市场事件标注（手工维护，定时任务不会覆盖此文件）
// theme: oil=油价相关 coal=煤价相关 both=共同影响

export interface MarketEvent {
  date: string; // 需为 A 股交易日
  theme: 'oil' | 'coal' | 'both'
  label: string
  detail: string
}

export const marketEvents: MarketEvent[] = [
  {
    date: '2026-03-16',
    theme: 'oil',
    label: '霍尔木兹海峡航运受阻',
    detail: '伊朗地缘冲突致霍尔木兹海峡航运受阻，布伦特原油升至约 105 美元/桶，较年初上涨逾 45%（摩根士丹利报告）',
  },
  {
    date: '2026-05-13',
    theme: 'coal',
    label: '“反内卷”专项行动启动',
    detail: '市场监管总局启动为期 8 个月的“反内卷”专项行动；同期主产区安监收紧、高温提前，坑口煤价持续走强',
  },
  {
    date: '2026-07-23',
    theme: 'oil',
    label: '布伦特突破 100 美元',
    detail: '伊朗宣布关闭霍尔木兹海峡、胡塞武装袭击沙特油轮，布伦特原油突破 100 美元/桶，单日涨超 7%（国信证券点评）',
  },
  {
    date: '2026-09-07',
    theme: 'coal',
    label: '坑口价快速拉涨',
    detail: '部分煤矿迎检停产减产、冬储备煤启动，鄂尔多斯 Q5500 坑口价一周内由 760–830 拉涨至 820–920 元/吨（Mysteel 日评）',
  },
  {
    date: '2026-10-13',
    theme: 'both',
    label: '煤油双强、高位运行',
    detail: '节后补库叠加供应偏紧，坑口价再上台阶至 790–850 元/吨；全球石油库存降至 2017 年以来低位，布伦特维持 100 美元上方（高盛报告）',
  },
]
