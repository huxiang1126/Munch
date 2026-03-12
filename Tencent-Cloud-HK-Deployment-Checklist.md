# Munch 腾讯云香港部署清单

适用目标：

- 中国用户可直接访问，不依赖 VPN
- 当前阶段先不上中国大陆备案
- 图像生成与 LLM 继续调用 `Kie`
- 应用自身承载：页面/API、登录、模板、历史、素材库、结果图库

推荐架构：

- 应用服务器：`Tencent Cloud Lighthouse（Hong Kong）`
- 数据库：`TencentDB for PostgreSQL（Hong Kong）`
- 对象存储：`Cloud Object Storage / COS（Hong Kong）`
- CDN：`Tencent Cloud CDN` 或 `EdgeOne`
- 域名：`munch.love`
- 图片生成与 LLM：`Kie`

---

## 0. 总体执行顺序

1. 买服务器
2. 买数据库
3. 创建 COS 存储桶
4. 购买或配置 CDN
5. 配置域名解析
6. 服务器初始化
7. 部署 Munch 应用
8. 配置数据库与存储环境变量
9. 执行数据库迁移
10. 回归验证
11. 开启正式流量

---

## 1. 先买什么

### 1.1 应用服务器

腾讯云产品名：

- `Tencent Cloud Lighthouse`

地区：

- `Hong Kong`

推荐规格：

- 起步：`4 vCPU / 8 GB RAM / 180 GB SSD`
- 如果你想更稳：`4 vCPU / 16 GB RAM`

用途：

- 跑 `Next.js`
- 跑 `Node.js / pnpm / PM2`
- 跑 `Nginx`
- 跑上传 API、中间层 API

为什么先买：

- 它是整个应用的公网入口
- 域名、Nginx、Node、部署都依赖它

你买完以后我接什么：

- 远程部署应用
- 安装 Node / pnpm / PM2 / Nginx
- 配置反向代理
- 配置环境变量
- 启动 `Munch`

---

### 1.2 数据库

腾讯云产品名：

- `TencentDB for PostgreSQL`

地区：

- `Hong Kong`

推荐规格：

- 起步：`2 vCPU / 4 GB RAM / 50 GB Storage`

用途：

- 用户账号资料
- 模板数据
- 积分
- 历史记录
- 素材库元数据
- 结果图库元数据

为什么现在就买：

- 正式上线不要再用本地 fallback
- 素材库和结果图都要落正式数据层

你买完以后我接什么：

- 帮你整理数据库连接串
- 帮你执行迁移 SQL
- 帮你把项目切到正式数据库

---

### 1.3 对象存储

腾讯云产品名：

- `Cloud Object Storage (COS)`

地区：

- `Hong Kong`

现在就要创建 2 个存储桶：

- `munch-user-assets`
- `munch-generated-images`

用途：

- `munch-user-assets`
  - 存用户上传的参考素材图
- `munch-generated-images`
  - 存用户生成出来的结果图

为什么必须要：

- 图片不应该放服务器本地盘
- 服务器迁移、重启、扩容都不影响图片
- CDN 也能直接加速 COS

你创建完以后我接什么：

- 帮你接 SDK / API
- 把素材库和结果图都切到 COS
- 把数据库元数据和 COS 路径打通

---

### 1.4 CDN

腾讯云产品名：

- `Tencent Cloud CDN`
- 或 `Tencent Cloud EdgeOne`

地区策略：

- 先用香港/海外可访问链路
- 暂时不走中国大陆备案链路

用途：

- 加速素材图和结果图访问
- 降低应用服务器带宽压力

你买完以后我接什么：

- 帮你规划图片访问域名
- 帮你把 COS + CDN 的访问路径整理成项目配置

---

### 1.5 域名与证书

你已有域名：

- `munch.love`

腾讯云产品名：

- `SSL Certificate`
- `DNSPod`（如果你把 DNS 托管到腾讯）

你需要做什么：

- 确认 `munch.love`
- 增加 `www.munch.love`
- 后面把 A/CNAME 记录指向香港应用节点或 CDN

我接什么：

- 帮你给出准确的 DNS 记录值
- 帮你写好 Nginx 站点配置
- 帮你启用 HTTPS

---

## 2. 买完以后，你先给我什么

你买完后，把这几样信息给我：

1. `Lighthouse` 公网 IP
2. `Lighthouse` 登录方式
   - root 密码
   - 或 SSH 私钥登录方式
3. `PostgreSQL` 连接信息
   - host
   - port
   - database
   - username
   - password
4. `COS` 桶名
   - `munch-user-assets`
   - `munch-generated-images`
5. `COS` SecretId / SecretKey
   - 建议用子账号最小权限
6. 如果 CDN 配了
   - 加速域名
   - 回源配置

---

## 3. 你买完以后我接什么

### 3.1 服务器初始化

我来做：

- 安装 `Node.js`
- 安装 `pnpm`
- 安装 `PM2`
- 安装 `Nginx`
- 建应用目录
- 拉代码
- 配 systemd / PM2 开机启动

---

### 3.2 应用部署

我来做：

- 配 `.env.production`
- 安装依赖
- `pnpm build`
- `pnpm start` 或 `pm2 start`
- Nginx 反向代理到 `3000`

---

### 3.3 数据库切换

我来做：

- 执行现有 migration
- 把模板、素材库、结果图库元数据切到正式 PostgreSQL
- 检查 Auth / Admin / Credits / Studio 全链路

---

### 3.4 对象存储接入

我来做：

- 用户素材图写入 `munch-user-assets`
- 生成结果图写入 `munch-generated-images`
- 历史记录中的图片 URL 改成 COS/CDN 正式地址

---

### 3.5 域名与 HTTPS

我来做：

- 给你 Nginx 配置文件
- 帮你整理证书部署位置
- 检查 `munch.love` / `www.munch.love`
- 给 HTTPS 站点补 `client_max_body_size 25M;`
  避免模板试用和自由创作上传参考图时被 Nginx 默认 1MB 限制拦截

---

## 4. 详细执行顺序

### 阶段 A：资源采购

1. 购买 `Tencent Cloud Lighthouse (Hong Kong)`
2. 购买 `TencentDB for PostgreSQL (Hong Kong)`
3. 创建 `COS`
   - `munch-user-assets`
   - `munch-generated-images`
4. 配好 `CDN` 或 `EdgeOne`

---

### 阶段 B：把机器交给我配置

你提供：

- 服务器 IP
- 登录方式
- 数据库连接串
- COS 凭证

我执行：

1. 系统初始化
2. 应用部署
3. 数据库连接
4. 存储连接
5. 启动服务

---

### 阶段 C：域名上线

你做：

1. 在域名注册商 / DNS 面板里加记录

我给你：

1. 具体 `A` / `CNAME` 值
2. Nginx 域名配置
3. HTTPS 配置步骤

---

### 阶段 D：上线回归

我来检查：

1. 登录页
2. 首页模板画廊
3. 模板生成
4. Studio 工作台
5. 素材库上传 / 复用
6. 结果图入库
7. 历史记录
8. 管理后台

---

## 5. 最终环境变量建议

这些后面我会帮你落到生产环境：

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KIE_API_KEY`
- `KIE_API_BASE_URL`
- `KIE_UPLOAD_BASE_URL`
- `OPENAI_API_KEY`（如果后面接 OpenAI 图像技能）
- `TENCENTCOS_SECRET_ID`
- `TENCENTCOS_SECRET_KEY`
- `TENCENTCOS_REGION`
- `TENCENTCOS_BUCKET_USER_ASSETS`
- `TENCENTCOS_BUCKET_GENERATED_IMAGES`
- `TENCENTCOS_PUBLIC_BASE_URL`

---

## 6. 我建议你现在就买的最低组合

最小可上线组合：

- `Lighthouse Hong Kong 4C8G`
- `TencentDB for PostgreSQL Hong Kong 2C4G`
- `COS Hong Kong`
- `CDN`

这是我认为对 `Munch` 当前阶段最中肯、最稳、最不浪费钱的配置。

---

## 7. 现在谁做什么

你现在做：

1. 买 `Lighthouse`
2. 买 `PostgreSQL`
3. 建两个 `COS` 桶
4. 把机器 IP / 登录方式 / 数据库信息 / COS 信息发我

我接着做：

1. 服务器部署
2. 数据库迁移
3. 素材图入 COS
4. 结果图入 COS
5. 域名配置清单
6. 上线回归

---

## 8. 当前项目和云端的映射关系

当前项目里已经完成或准备完成的能力：

- 用户素材库：已具备本地 fallback + 云端接口形态
- Studio 工作台：已具备真实生成状态流
- Kie 图像生成：已打通
- GPT-5.2 提示词编译：已打通

所以下一步不需要重做产品，只是把这几层从“本地开发态”迁到“腾讯云香港正式态”。
