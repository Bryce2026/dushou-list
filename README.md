# 剁手清单

想买先冷却。记下一件想剁的东西，答几题定冷却天数，到期再决定买或不买。

**在线试用：** https://bryce2026.github.io/dushou-list/

## 做什么用

- 把冲动购物先关进清单，打断「现在就下单」
- 五道题打分 → 冷却 3 / 7 / 14 / 21 / 30 天
- 到期后：剁了、反剁、再冷静，或删掉
- 可填时薪，把价格换算成「要干多少小时」

数据存在本机浏览器（`localStorage`）。没有账号、没有服务器；清缓存或换设备会丢，引导页里也写了这点。

## 怎么打开

| 方式 | 说明 |
|------|------|
| 网页 | 打开上面的试用链接 |
| 安卓 | Chrome →「安装应用」/「添加到主屏幕」 |
| iPhone | Safari → 分享 →「添加到主屏幕」 |
| 本机调试 | 见下方 |

```bash
cd demo
python3 -m http.server 8765
# 浏览器打开 http://localhost:8765
```

不要用 `file://` 打开，Service Worker 和部分浏览器能力需要 http(s)。

## 仓库里有什么

```
demo/          ← 可运行的网页 / PWA（也是 GitHub Pages 内容）
剁手清单/       ← 早期 Mac 桌面原型源码（苹果 Swift 语言）
demo/case/     ← 一页纸案例（截图 + 说明）
```

当前主力是 `demo/` 这套网页。Swift 那份是最初的原型材料，方便对照产品逻辑，不是上架 App。

## 一页纸案例

过程说明和界面截图：

- 网页：https://bryce2026.github.io/dushou-list/case/
- 仓库内：[`demo/case/`](demo/case/)（含 Word：`剁手清单-一页纸案例.docx`）

## 技术说明（很短）

- 纯前端：HTML / CSS / JS
- PWA：`manifest.webmanifest` + `sw.js` + icons
- 发布：`gh-pages` 分支 → GitHub Pages

## License

源码按 MIT 开放使用（见 [LICENSE](LICENSE)）。
