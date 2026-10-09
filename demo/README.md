# 剁手清单 · PWA Demo

想买先冷却。纯前端，数据在本机。

## 启动

```bash
cd demo
python3 -m http.server 8765
```

打开：http://localhost:8765

安卓 Chrome：菜单 → **安装应用** / **添加到主屏幕**（需 http(s)，不要用 `file://`）。

## PWA

- `manifest.webmanifest` + `icons/`
- `sw.js` 基础离线缓存
