# 各級英文檢定自適應測驗練習平台 (Adaptive English Testing Platform)

一套符合 **CEFR 國際架構**（A1 入門 ~ C2 精通）與台灣主流英文檢定（**全民英檢 GEPT**、**多益 TOEIC**、**雅思 IELTS**、**托福 TOEFL iBT**）的電腦化適性測驗（Computerized Adaptive Testing, CAT）練習平台。系統運用 **2-PL 項目反應理論（Item Response Theory, IRT）** 即時推估作答者能力指標 $\theta$ 與測量標準誤（SEM），實現動態難度自適應調適。

---

## 🚀 GitHub Pages 部署說明

本專案已配置完整的 **GitHub Actions 自動部署工作流程**（位於 `.github/workflows/deploy.yml`）。只要將程式碼推送到 GitHub 倉庫，GitHub Actions 將會自動編譯並部署至 GitHub Pages。

### 步驟 1：建立並推送至 GitHub 倉庫

```bash
# 1. 初始化本地 Git 倉庫
git init

# 2. 加入所有檔案並提交
git add .
git commit -m "feat: 各級英文檢定自適應測驗平台 (支援 GitHub Pages 自動部署)"

# 3. 綁定你的 GitHub 遠端倉庫（請替換為你的 GitHub 網址）
git remote add origin https://github.com/<你的GitHub帳號>/<你的倉庫名稱>.git

# 4. 推送至 main 分支
git branch -M main
git push -u origin main
```

### 步驟 2：在 GitHub 倉庫開啟 Pages 設定

1. 前往 GitHub 倉庫頁面，點擊上方 **Settings（設定）**。
2. 在左側選單點選 **Pages**。
3. 在 **Build and deployment** 下方的 **Source** 選擇：
   - **GitHub Actions**
4. 設定完成後，回到 **Actions** 頁籤，即可看到 `Deploy to GitHub Pages` 正在自動建置。
5. 部署完成後，頁面頂端將顯示可直接點擊進入的專屬網址：
   `https://<你的GitHub帳號>.github.io/<你的倉庫名稱>/`

---

## 🌟 靜態部署相容性保證（樣式與資源）

- **相對路徑適配**：`vite.config.ts` 已配置 `base: process.env.BASE_URL || './'`，打包後的 CSS、JS 與靜態資源均使用相對路徑引用，避免在 GitHub Pages 子路徑（Subpath）下產生資源 404 或白屏。
- **純前端 IRT 離線引擎支援**：除了連線模式下的 Gemini 智能診斷外，針對純靜態託管（如 GitHub Pages）提供離線 2-PL IRT 演算法智慧診斷降級，即便沒有 Node.js 後端伺服器，測驗、題目解析、能力值收斂、弱項分析與備考路徑皆能 100% 正常運作。
- **防 Jekyll 阻擋**：部署流程自動生成 `.nojekyll` 標記，確保 Vite 打包產生的 `_` 或自訂資料夾能被正常存取。
