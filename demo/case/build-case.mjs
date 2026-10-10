import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ExternalHyperlink,
  HeadingLevel,
  ShadingType,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const img = (name) => fs.readFileSync(path.join(__dirname, name));

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const thin = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "E5E0D8" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E0D8" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "E5E0D8" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "E5E0D8" },
};

function h(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 80 },
    children: [
      new TextRun({ text, bold: true, size: 24, font: "PingFang SC", color: "1A1A1A" }),
    ],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    ...opts,
    children: [
      new TextRun({
        text,
        size: 20,
        font: "PingFang SC",
        color: "333333",
      }),
    ],
  });
}

function shotCell(file, caption, colDxA) {
  const displayW = 168; // px in doc
  const displayH = Math.round(displayW * (1756 / 882));
  return new TableCell({
    borders: noBorder,
    width: { size: colDxA, type: WidthType.DXA },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new ImageRun({
            type: "png",
            data: img(file),
            transformation: { width: displayW, height: displayH },
            altText: { title: caption, description: caption, name: file },
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({ text: caption, size: 16, font: "PingFang SC", color: "666666" }),
        ],
      }),
    ],
  });
}

function shotRow(pairs) {
  const total = 10466;
  const col = Math.floor(total / pairs.length);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: pairs.map(() => col),
    rows: [
      new TableRow({
        children: pairs.map(([file, caption]) => shotCell(file, caption, col)),
      }),
    ],
  });
}

const linkPara = (label, url) =>
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}：`, size: 20, font: "PingFang SC", color: "333333" }),
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: url,
            size: 20,
            font: "PingFang SC",
            color: "0B57D0",
            underline: {},
          }),
        ],
        link: url,
      }),
    ],
  });

const doc = new Document({
  styles: {
    default: {
      document: {
        styles: [{ id: "Normal", run: { font: "PingFang SC", size: 20 } }],
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: "剁手清单",
              bold: true,
              size: 40,
              font: "PingFang SC",
              color: "1A1A1A",
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: "一页纸案例 · 从念头到可分享的小工具",
              size: 22,
              font: "PingFang SC",
              color: "666666",
            }),
          ],
        }),

        new Table({
          width: { size: 10466, type: WidthType.DXA },
          columnWidths: [10466],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: thin,
                  width: { size: 10466, type: WidthType.DXA },
                  shading: { type: ShadingType.CLEAR, fill: "FFF8E7" },
                  children: [
                    new Paragraph({
                      spacing: { before: 80, after: 40 },
                      indent: { left: 120, right: 120 },
                      children: [
                        new TextRun({
                          text: "一句话",
                          bold: true,
                          size: 18,
                          font: "PingFang SC",
                          color: "8A6A00",
                        }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { after: 100 },
                      indent: { left: 120, right: 120 },
                      children: [
                        new TextRun({
                          text: "想剁手前先冻几天。答几题定冷却时长，到期再决定买或不买。纯前端 PWA，数据在本机浏览器。",
                          size: 20,
                          font: "PingFang SC",
                          color: "333333",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        h("链接"),
        linkPara("在线试用", "https://bryce2026.github.io/dushou-list/"),
        linkPara("GitHub", "https://github.com/Bryce2026/dushou-list"),

        h("想法从哪来"),
        p(
          "最初是一份临时的 Mac 桌面小工具（用苹果的 Swift 语言写的）：把冲动购物先关进清单，用冷却期打断「现在就下单」。后面想让更多人随手打开试试，又不想走 App Store 审核和上架流程，就把同一套产品逻辑做成网页 / PWA。"
        ),
        p(
          "产品状态很简单：冷却中 → 可剁 → 已剁 / 反剁。冷却天数由五道题得分映射到 3 / 7 / 14 / 21 / 30 天；时薪只用来换算「这东西要干多少小时」，藏在设置里，不挡主路径。"
        ),

        h("怎么做的"),
        p(
          "技术选型刻意收窄：HTML + CSS + 原生 JS，localStorage 存清单和设置，Service Worker + manifest 做成可「添加到主屏幕」的 PWA。没有账号、没有后端——换设备或清缓存数据会丢，这点在引导页写清楚了。"
        ),
        p(
          "界面从偏说明文的版本，收成色块卡片（状态一眼能分：绿 GO、橙倒数、紫 NO）。列表按可剁 → 冷却 → 已剁 → 反剁排序；详情里「剁了 / 反剁 / 再冷静 / 删除」按状态显隐，危险操作用确认框。"
        ),

        h("过程里改了什么"),
        p(
          "中间绕了一圈：先有 Mac 桌面原型当材料，再重做成网页；文案从「答疑 / 功能介绍」砍到引导页三步 + 一句 P.S.；时薪、冷却对照表都塞进设置，主列表只留清单本身。手机上还踩过安全区和对话框底部被挡的问题，用 100dvh / 安全区 padding 收了一下。"
        ),
        p(
          "发布时 GitHub Actions 受 token 权限限制没立刻跑通，改推 gh-pages 分支挂 GitHub Pages。仓库公开，链接谁都能开；数据仍是各自浏览器本地的。"
        ),

        h("发布与布置"),
        p(
          "仓库：Bryce2026/dushou-list。Pages 指向 gh-pages，站点根目录即 demo 构建产物。本机调试：在 demo 目录起静态服务即可。安卓 Chrome 可「安装应用」；iOS Safari 用「添加到主屏幕」。"
        ),

        h("界面一览"),
        p("下面几张是手机宽度下的实际页面（本地数据示例）。"),
        shotRow([
          ["case-onboard.png", "首次引导"],
          ["case-list.png", "清单首页"],
          ["case-detail.png", "可剁 · 详情"],
        ]),
        shotRow([
          ["case-cooling.png", "冷却中 · 详情"],
          ["case-settings.png", "设置 / 时薪"],
          ["case-cool-faq.png", "冷却天数对照"],
        ]),

        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: "截图与源文件见仓库 demo/case/。案例写于 2026-10。",
              size: 16,
              font: "PingFang SC",
              color: "999999",
            }),
          ],
        }),
      ],
    },
  ],
});

const out = path.join(__dirname, "剁手清单-一页纸案例.docx");
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(out, buffer);
console.log("wrote", out);
