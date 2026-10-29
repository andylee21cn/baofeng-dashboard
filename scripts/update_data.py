"""云端数据更新脚本（GitHub Actions 运行）。

抓取三路数据并重新生成 app/src/data/marketData.ts：
- 股价：腾讯行情接口（sh600989 前复权日线）
- 煤价：Mysteel 鄂尔多斯市场日评列表页 + CCTD 鄂尔多斯混煤指数页
- 油价：新浪财经全球期货 OIL（布伦特原油连续）日线

同时把煤价/油价历史存回 data/*.json（随仓库提交，作为下次抓取的历史基底）。
摘要写入 summary.md；若设置环境变量 SERVERCHAN_KEY，则推送微信通知。
"""
import json
import os
import re
import time
import urllib.request
from datetime import datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

SEED_COAL = [
    ("2025-10-04", 500, 560, "Mysteel 鄂尔多斯市场日评"),
    ("2025-11-13", 580, 630, "Mysteel 鄂尔多斯市场日评"),
    ("2025-12-09", 550, 620, "Mysteel 煤焦信息汇总"),
    ("2025-12-15", 525, 531, "盐城市发改委监测（鄂尔多斯混煤5500坑口价）"),
    ("2026-02-10", 500, 560, "Mysteel 鄂尔多斯市场日评"),
    ("2026-03-19", 500, 550, "Mysteel 鄂尔多斯市场日评"),
    ("2026-03-23", 530, 580, "Mysteel 鄂尔多斯市场日评"),
    ("2026-04-09", 530, 570, "Mysteel 煤焦信息汇总"),
    ("2026-04-28", 550, 590, "Mysteel 鄂尔多斯市场日评"),
    ("2026-05-13", 560, 600, "Mysteel 煤焦信息汇总"),
    ("2026-05-28", 580, 650, "Mysteel 动力煤市场盘点"),
    ("2026-06-10", 580, 635, "Mysteel 煤焦信息汇总"),
    ("2026-06-30", 631, 631, "太重向明2026半年报（鄂尔多斯Q5500坑口价）"),
    ("2026-07-17", 615, 615, "国泰海通煤炭周报（东胜Q5500坑口价）"),
    ("2026-07-31", 620, 650, "Mysteel 鄂尔多斯市场日评"),
    ("2026-08-06", 620, 660, "Mysteel 鄂尔多斯市场日评"),
    ("2026-08-20", 630, 700, "Mysteel 调研（腾讯新闻转载）"),
    ("2026-09-24", 780, 860, "Mysteel 鄂尔多斯市场日评"),
    ("2026-09-30", 760, 830, "Mysteel 鄂尔多斯市场日评"),
    ("2026-10-13", 790, 850, "Mysteel 鄂尔多斯市场日评"),
    ("2026-10-14", 827, 833, "CCTD 鄂尔多斯混煤指数（5500K坑口价）"),
]

MYSTEEL_PAGES = [
    "https://list1.mysteel.com/zhishi/eedsdlmjgkkzs.html",
    "https://list1.mysteel.com/zhishi/eedsmtjg.html",
    "https://list1.mysteel.com/zhishi/mdsqyd.html",
    "https://list1.mysteel.com/zhishi/dlmzlj.html",
]
CCTD_PAGE = "https://www.cctd.com.cn/index.php?m=content&c=index&a=lists&catid=520"


def fetch(url, encoding="utf-8", retries=3):
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read().decode(encoding, "ignore")
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(2 * (attempt + 1))
    raise last_err


def fetch_stock_bars():
    beg = (datetime.now() - timedelta(days=380)).strftime("%Y-%m-%d")
    end = datetime.now().strftime("%Y-%m-%d")
    url = (
        "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get"
        f"?param=sh600989,day,{beg},{end},400,qfq"
    )
    data = json.loads(fetch(url))
    node = (data.get("data") or {}).get("sh600989") or {}
    rows = node.get("qfqday") or node.get("day") or []
    bars = []
    for p in rows:
        bars.append({
            "date": p[0],
            "open": round(float(p[1]), 2),
            "high": round(float(p[3]), 2),
            "low": round(float(p[4]), 2),
            "close": round(float(p[2]), 2),
            "volume": int(float(p[5])) * 100,
        })
    if not bars:
        raise RuntimeError("腾讯行情接口未返回K线数据")
    return bars


def clean_text(html):
    text = re.sub(r"<[^>]+>", "", html)
    return re.sub(r"\s+", " ", text)


def fetch_coal_quotes():
    found = {}
    pat = re.compile(
        r"(20\d\d-\d\d-\d\d)\s*\d\d:\d\d(?:(?!20\d\d-\d\d-\d\d).){0,800}?"
        r"Q\s?5500\s?坑口含税报\s?(\d+)\s?-\s?(\d+)\s?元/吨"
    )
    for url in MYSTEEL_PAGES:
        try:
            text = clean_text(fetch(url))
        except Exception:
            continue
        for m in pat.finditer(text):
            d, lo, hi = m.group(1), int(m.group(2)), int(m.group(3))
            if 300 <= lo <= hi <= 2000:
                found.setdefault(d, (lo, hi, "Mysteel 鄂尔多斯市场日评"))
    try:
        text = clean_text(fetch(CCTD_PAGE, encoding="gb18030"))
        m = re.search(r"鄂尔多斯混煤指数.{0,40}?5500K坑口价\s*(\d+)\s*-\s*(\d+)", text)
        dm = re.search(r"BSPI\s*[:：]\s*(20\d\d-\d\d-\d\d)", text)
        if m:
            d = dm.group(1) if dm else datetime.now().strftime("%Y-%m-%d")
            lo, hi = int(m.group(1)), int(m.group(2))
            if 300 <= lo <= hi <= 2000:
                found.setdefault(d, (lo, hi, "CCTD 鄂尔多斯混煤指数（5500K坑口价）"))
    except Exception:
        pass
    return found


def fetch_oil_bars(fallback_path=None):
    try:
        url = (
            "https://stock2.finance.sina.com.cn/futures/api/jsonp.php/x/"
            "GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=OIL"
        )
        req = urllib.request.Request(
            url, headers={**UA, "Referer": "https://finance.sina.com.cn"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", "ignore")
        arr = json.loads(body[body.find("["): body.rfind("]") + 1])
        cutoff = (datetime.now() - timedelta(days=380)).strftime("%Y-%m-%d")
        bars = [
            {
                "date": r["date"],
                "open": round(float(r["open"]), 2),
                "high": round(float(r["high"]), 2),
                "low": round(float(r["low"]), 2),
                "close": round(float(r["close"]), 2),
                "volume": int(float(r.get("volume") or 0)),
            }
            for r in arr
            if r["date"] >= cutoff
        ]
        if bars:
            return bars, "sina"
    except Exception:
        pass
    if fallback_path and os.path.exists(fallback_path):
        with open(fallback_path, encoding="utf-8") as f:
            return json.load(f), "local-store"
    return [], "unavailable"


def render_ts(bars, points, oil_bars):
    return f"""// Auto-generated by daily-update automation — do not edit by hand.
// 宝丰能源（600989.SH）日线行情：腾讯行情，前复权
// 内蒙古鄂尔多斯 Q5500 动力煤坑口含税报价：公开渠道市场日评（以 Mysteel 为主，CCTD 为辅）
// 布伦特原油连续（Brent）日线：新浪财经全球期货，美元/桶

export interface StockBar {{
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // 股
}}

export interface OilBar {{
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // 手
}}

export interface CoalPoint {{
  date: string;
  low: number;   // 报价区间下限，元/吨
  high: number;  // 报价区间上限，元/吨
  mid: number;   // 区间中值
  source: string;
}}

export const STOCK_NAME = "宝丰能源";
export const STOCK_CODE = "600989.SH";
export const COAL_NAME = "鄂尔多斯 Q5500 动力煤坑口价（含税）";
export const OIL_NAME = "布伦特原油连续（Brent）";

export const stockBars: StockBar[] = {json.dumps(bars, ensure_ascii=False)};

export const coalPoints: CoalPoint[] = {json.dumps(points, ensure_ascii=False, indent=2)};

export const oilBars: OilBar[] = {json.dumps(oil_bars, ensure_ascii=False)};
"""


def push_serverchan(summary, link):
    key = os.environ.get("SERVERCHAN_KEY")
    if not key:
        return "not-configured"
    from urllib.parse import urlencode
    title = "宝丰能源×动力煤×油价看板"
    body = summary + (f"\n\n[点击打开线上看板]({link})" if link else "")
    try:
        url = f"https://sctapi.ftqq.com/{key}.send"
        data = urlencode({"title": title, "desp": body}).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=UA)
        with urllib.request.urlopen(req, timeout=20):
            pass
        return "serverchan"
    except Exception as e:  # noqa: BLE001
        return f"failed: {type(e).__name__}: {e}"


def main():
    store_path = os.path.join(ROOT, "data", "coal_points.json")
    ts_path = os.path.join(ROOT, "app", "src", "data", "marketData.ts")

    bars = fetch_stock_bars()

    if os.path.exists(store_path):
        with open(store_path, encoding="utf-8") as f:
            existing = json.load(f)
    else:
        existing = [
            {"date": d, "low": lo, "high": hi, "mid": round((lo + hi) / 2, 1), "source": s}
            for d, lo, hi, s in SEED_COAL
        ]
    by_date = {p["date"]: p for p in existing}
    scraped = fetch_coal_quotes()
    new_count = 0
    for d, (lo, hi, src) in scraped.items():
        if d not in by_date:
            by_date[d] = {"date": d, "low": lo, "high": hi, "mid": round((lo + hi) / 2, 1), "source": src}
            new_count += 1
    points = sorted(by_date.values(), key=lambda p: p["date"])

    oil_store_path = os.path.join(ROOT, "data", "oil_bars.json")
    oil_bars, oil_src = fetch_oil_bars(fallback_path=oil_store_path)
    if oil_src == "sina":
        with open(oil_store_path, "w", encoding="utf-8") as f:
            json.dump(oil_bars, f, ensure_ascii=False, indent=1)

    os.makedirs(os.path.dirname(store_path), exist_ok=True)
    with open(store_path, "w", encoding="utf-8") as f:
        json.dump(points, f, ensure_ascii=False, indent=1)
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write(render_ts(bars, points, oil_bars))

    last_bar, last_coal = bars[-1], points[-1]
    last_oil = oil_bars[-1] if oil_bars else None
    summary = (
        f"股价更新至 {last_bar['date']}（收盘 ¥{last_bar['close']}，共 {len(bars)} 个交易日）；"
        f"煤价最新 {last_coal['date']}（{last_coal['low']}–{last_coal['high']} 元/吨，"
        f"共 {len(points)} 个报价点，本次新增 {new_count} 个）"
    )
    if last_oil:
        summary += f"；布伦特原油更新至 {last_oil['date']}（${last_oil['close']}，来源 {oil_src}）"

    with open(os.path.join(ROOT, "summary.md"), "w", encoding="utf-8") as f:
        f.write(summary)
    print(summary)

    push_result = push_serverchan(summary, "https://andylee21cn.github.io/baofeng-dashboard/")
    print("phone push:", push_result)


if __name__ == "__main__":
    main()
