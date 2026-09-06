# 中国通史 · 大事年表与人物图谱

一个纯静态、开箱即用的**中华通史可视化网站**：从炎黄传说到当代中国，涵盖 **371 位关键人物、217 个重大事件、332 组人物关系**，其中 84 个事件附有**交战双方兵力对比**。

> 在线体验：本地运行后访问 `http://localhost:8080`（Docker）或 `http://localhost:8000`（Python）

![tech](https://img.shields.io/badge/HTML%2FCSS%2FJS-纯静态-blue) ![docker](https://img.shields.io/badge/Docker-nginx%3Aalpine-green) ![size](https://img.shields.io/badge/数据-371%20人物%20%2F%20217%20事件-orange)

## 功能特性

- **大事年表**：217 个重大事件按 16 个时期分组（传说时代 → 夏商西周 → 春秋战国 → 秦汉 → 三国两晋南北朝 → 隋唐五代 → 宋辽金夏 → 元 → 明 → 清前中期 → 晚清 → 民国 → 国共对峙 → 全面抗战 → 解放战争 → 当代），支持按"战争·战役 / 革命·起义 / 变革·运动 / 政治·会议 / 文明·科技"五类筛选。
- **事件详情**：点击任意事件查看经过描述、**对阵双方兵力对比**（如长平之战秦军约 60 万 vs 赵军约 45 万）、结局影响、关键人物。
- **人物关系图谱**：ECharts 力导向图，节点按 29 个阵营（历代王朝、起义军、文化科技人物等）着色，节点大小代表关联度；可按阵营筛选、显示全部人名、悬停查看关系、点击进入人物详情。
- **人物志**：371 位人物按阵营浏览——既有帝王将相，也收录了大量小众人物（妇好、西门豹、介子推、祖逖、张巡、李清照、左宝贵、聂士成、林祥谦、赵一曼、江竹筠、郭永怀……）。
- **人物详情**：生平、生卒年、阵营、参与事件、以该人物为中心的放射状关系图（可连续跳转）。
- **全局搜索**：按事件名、人物名、战役关键词即时过滤。

## 技术栈

- 前端：原生 HTML / CSS / JavaScript（无框架、无构建步骤）
- 图表：Apache ECharts 5（已本地化到 `lib/`，**完全离线可用**）
- 部署：Docker + Nginx（gzip + 静态缓存）

## 目录结构

```
├── index.html              # 入口页面
├── css/style.css           # 样式（深色水墨档案风）
├── lib/echarts.min.js      # ECharts（本地化，离线可用）
├── js/
│   ├── app.js              # 页面渲染与交互逻辑
│   ├── people.js           # 人物数据（1840—1949 核心）
│   ├── events.js           # 事件数据（1840—1949 核心）
│   ├── relations.js        # 人物关系（1840—1949 核心）
│   ├── era-xianqin.js      # 先秦扩展（传说/夏商周/春秋战国）
│   ├── era-qinhan.js       # 秦汉 + 三国两晋南北朝
│   ├── era-suitang.js      # 隋唐五代
│   ├── era-songyuan.js     # 宋辽金夏 + 元
│   ├── era-mingqing.js     # 明 + 清前中期
│   ├── era-modern-extra.js # 近代小众人物与事件补充
│   └── era-contemporary.js # 当代中国（1949—今）
├── Dockerfile              # Docker 镜像定义
├── docker-compose.yml      # 一键部署
└── nginx.conf              # Nginx 站点配置
```

## 本地运行

方式一（任意静态服务器）：

```bash
python -m http.server 8000
# 访问 http://localhost:8000
```

方式二（直接双击 `index.html` 亦可，但建议走 HTTP 以保证字体/脚本加载行为一致）。

## Docker 部署

```bash
# 方式一：docker compose（推荐）
docker compose up -d
# 访问 http://localhost:8080

# 方式二：docker build + run
docker build -t china-history .
docker run -d --name china-history -p 8080:80 china-history
```

停止与清理：

```bash
docker compose down          # 或 docker rm -f china-history
```

## 数据说明

- 所有数据以纯 JS 对象形式存放在 `js/` 目录，无需数据库。
- 人物字段：`name / life / faction / title / bio / events`；
- 事件字段：`id / year / date / category / title / desc / forces / result / people / p(时期)`；
- 关系字段：`a / b / t`（关系描述）。
- 新增人物/事件只需在对应 `era-*.js` 中追加对象并保持 id 引用一致即可。

## 内容依据与免责声明

内容依据通行历史教材与公开资料整理；传说时代人物仅具文化意义；古代兵力数字多为史籍记载的通行口径（如"号称百万"），近代战役数字为常见统计口径，仅供参考学习，不作为学术引用依据。
