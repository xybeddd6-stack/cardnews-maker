import React, { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// 카드뉴스 메이커 — 하네짱 템플릿(섹션 3·4) 레이아웃 충실 재현.
// 표지(사진+그라데이션+알약뱃지+흰 대제목) · 글 · 사진+글 · 상단사진 · 상하분할 · 정사각 · 마무리.
// 스티커(말풍선·폭발·생각풍선·별·박스·타원)는 SVG로 복원, 문구·색 편집·드래그.
// ─────────────────────────────────────────────────────────────

const BGS = {
  paper: { name: "본문", kind: "solid", hex: "#FDFCF8" },
  cream: { name: "크림", kind: "solid", hex: "#FCFCF0" },
  mist: { name: "안개", kind: "solid", hex: "#FAFAF8" },
  sage: { name: "세이지", kind: "solid", hex: "#F8F9F6" },
  paper2: { name: "종이", kind: "solid", hex: "#F3F0E9" },
  glow: { name: "글로우", kind: "glow", base: "#FDFBF3", glow: "#FBE49B" },
  fade: { name: "미스트", kind: "grad", top: "#F5F4F0", bottom: "#E6E4DD" },
};
const BGKEYS = Object.keys(BGS);
const cssBg = (k) => { const b = BGS[k] || BGS.paper; if (b.kind === "solid") return b.hex; if (b.kind === "glow") return `radial-gradient(65% 48% at 62% 38%, ${b.glow}, rgba(251,228,155,0) 72%), ${b.base}`; return `linear-gradient(180deg, ${b.top}, ${b.bottom})`; };
const isDark = (k) => (BGS[k] || {}).kind === "dark";
const paintBg = (ctx, k, W, H) => {
  const b = BGS[k] || BGS.paper;
  if (b.kind === "solid") { ctx.fillStyle = b.hex; ctx.fillRect(0, 0, W, H); return; }
  if (b.kind === "glow") { ctx.fillStyle = b.base; ctx.fillRect(0, 0, W, H); const cx = W * 0.62, cy = H * 0.38, r = W * 0.72; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, b.glow); g.addColorStop(1, "rgba(251,228,155,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); return; }
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, b.top); g.addColorStop(1, b.bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
};
const FILLS = ["#FFFFFF", "#D7FFFC", "#FFE1EC", "#FFF3C4", "#E5F0D8", "#E7E3FF"];
const TEXTPAL = ["#111111", "#EC4FA0", "#7C6BF0", "#2BB6A3", "#F0902A", "#4A78C9", "#FFFFFF"];
const HLPAL = ["#FFE99C", "#FFC7DF", "#D8C7FF", "#C7F0D8", "#C7E6FF", "#FFD9A8"];
const parseHL = (str) => {
  const out = []; const re = /\[\[(.+?)\]\]/g; let last = 0, m;
  while ((m = re.exec(String(str)))) {
    if (m.index > last) out.push({ t: str.slice(last, m.index), hl: false });
    out.push({ t: m[1], hl: true }); last = m.index + m[0].length;
  }
  if (last < String(str).length) out.push({ t: str.slice(last), hl: false });
  return out.length ? out : [{ t: String(str), hl: false }];
};
function RichTitle({ str, hl }) {
  return parseHL(str).map((s, i) => s.hl
    ? <span key={i} style={{ background: hl || "#FFE99C", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone", borderRadius: "0.14em", padding: "0 0.1em", boxShadow: `0.09em 0 0 ${hl || "#FFE99C"}, -0.09em 0 0 ${hl || "#FFE99C"}` }}>{s.t}</span>
    : <React.Fragment key={i}>{s.t}</React.Fragment>);
}
const FONT = `'Pretendard Variable', Pretendard, 'Gothic A1', 'IBM Plex Sans KR', system-ui, sans-serif`;
const SVGFONT = `'Apple SD Gothic Neo','Pretendard','Gothic A1',sans-serif`;

const LAYOUTS = [
  { key: "text", label: "글" }, { key: "photo", label: "사진+글" }, { key: "phototop", label: "상단사진" },
  { key: "split", label: "상하분할" }, { key: "square", label: "정사각" },
];

const STICKERS = [
  { key: "text1", type: "text", text: "느좋", fill: "#111" },
  { key: "text2", type: "text", text: "둥근해미친거또떴네", fill: "#111" },
  { key: "speech", type: "speech", text: "여름이었다..", fill: "#FFFFFF" },
  { key: "burst", type: "burst", text: "으악!!!", fill: "#FFF3C4" },
  { key: "thought", type: "thought", text: "집가고싶다..ㅋ", fill: "#FFFFFF" },
  { key: "star", type: "star", text: "허거덩거덩스", fill: "#FFE1EC" },
  { key: "box", type: "box", text: "벌써 6월이네.. 쩝", fill: "#FFFFFF" },
  { key: "oval", type: "oval", text: "이거 미쳤다(P)", fill: "#D7FFFC" },
];

const SYSTEM = `당신은 인스타그램 카드뉴스 카피라이터다. 친근하고 편안한 요즘 카드뉴스 톤. 이모지는 제목에 하나 정도 가볍게.
주제를 받아 표지 1장 + 본문 2~4장 + 마무리 1장 구성.
- cover: title(눈에 띄는 짧은 제목. 핵심 단어 하나를 [[ ]]로 감싸면 형광펜 강조가 됨. 예: "[[카드뉴스]] 제작하기"), subtitle(한 줄), badge(짧은 강조 한 마디, 예: ★여기 포인트)
- body 각 장: layout("text"|"photo"|"phototop"), title(소제목), text(2~3문장)
- closing: title(마무리 한 줄), text(저장·공유 유도)
한국어. 반드시 JSON만(마크다운·코드펜스 금지):
{ "cover":{"title":"","subtitle":"","badge":""}, "body":[{"layout":"text","title":"","text":""}], "closing":{"title":"","text":""} }`;

// ── 스티커 SVG ──
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const estW = (t, fs) => { let w = 0; for (const ch of t) { const c = ch.codePointAt(0); w += (c >= 0x1100 && !(c >= 0x2000 && c <= 0x206F)) ? fs : fs * 0.56; } return w; };
const starPts = (cx, cy, spikes, oR, iR) => { let p = "", step = Math.PI / spikes, a = -Math.PI / 2; for (let i = 0; i < spikes * 2; i++) { const r = i % 2 === 0 ? oR : iR; p += `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)} `; a += step; } return p.trim(); };
function genSticker(type, text, fill) {
  const fs = 40, tw = estW(text, fs), sw = 4;
  const txt = (x, y, w = "700") => `<text x="${x}" y="${y}" font-family="${SVGFONT}" font-weight="${w}" font-size="${fs}" fill="#111" text-anchor="middle" dominant-baseline="central">${esc(text)}</text>`;
  const head = (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}">`;
  if (type === "text") { const w = tw + 8, h = fs + 18; return { w, h, svg: head(w, h) + txt(w / 2, h / 2, "800") + "</svg>" }; }
  if (type === "box") { const px = 30, py = 20, w = tw + px * 2, h = fs + py * 2; return { w, h, svg: head(w, h) + `<rect x="${sw / 2}" y="${sw / 2}" width="${w - sw}" height="${h - sw}" rx="18" fill="${fill}" stroke="#111" stroke-width="${sw}"/>` + txt(w / 2, h / 2) + "</svg>" }; }
  if (type === "speech") { const px = 30, py = 20, bw = tw + px * 2, bh = fs + py * 2, tail = 22, w = bw, h = bh + tail, tx = bw * 0.28; return { w, h, svg: head(w, h) + `<rect x="${sw / 2}" y="${sw / 2}" width="${bw - sw}" height="${bh - sw}" rx="16" fill="${fill}" stroke="#111" stroke-width="${sw}"/><path d="M ${tx} ${bh - 2} L ${tx - 16} ${h - 2} L ${tx + 26} ${bh - 2} Z" fill="${fill}" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/><rect x="${tx - 2}" y="${bh - 8}" width="30" height="8" fill="${fill}"/>` + txt(bw / 2, bh / 2) + "</svg>" }; }
  if (type === "oval") { const rx = tw / 2 + 40, ry = fs / 2 + 32, w = rx * 2, h = ry * 2; return { w, h, svg: head(w, h) + `<ellipse cx="${rx}" cy="${ry}" rx="${rx - sw}" ry="${ry - sw}" fill="${fill}" stroke="#111" stroke-width="${sw}"/>` + txt(rx, ry) + "</svg>" }; }
  if (type === "thought") { const rx = tw / 2 + 38, ry = fs / 2 + 30, w = rx * 2 + 46, h = ry * 2 + 56; return { w, h, svg: head(w, h) + `<ellipse cx="${rx}" cy="${ry}" rx="${rx - sw}" ry="${ry - sw}" fill="${fill}" stroke="#111" stroke-width="${sw}"/><circle cx="${rx + 6}" cy="${ry * 2 + 4}" r="18" fill="${fill}" stroke="#111" stroke-width="${sw}"/><circle cx="${rx + 40}" cy="${ry * 2 + 36}" r="11" fill="${fill}" stroke="#111" stroke-width="${sw}"/>` + txt(rx, ry) + "</svg>" }; }
  if (type === "star") { const R = tw / 2 + 78, cx = R, cy = R, w = R * 2, h = R * 2, pts = starPts(cx, cy, 5, R - sw, (R - sw) * 0.46); return { w, h, svg: head(w, h) + `<polygon points="${pts}" fill="${fill}" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/>` + txt(cx, cy + 6) + "</svg>" }; }
  const oR = tw / 2 + 66, iR = oR * 0.74, cx = oR, cy = oR, w = oR * 2, h = oR * 2, pts = starPts(cx, cy, 11, oR - sw, iR - sw);
  return { w, h, svg: head(w, h) + `<polygon points="${pts}" fill="${fill}" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/>` + txt(cx, cy) + "</svg>" };
}
const stickerURL = (st) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(genSticker(st.type, st.text, st.fill).svg);

// photos count per layout
const PHOTON = { cover: 1, text: 0, photo: 2, phototop: 1, split: 2, square: 1, closing: 0 };

const CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
@import url('https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;700;800&family=Fraunces:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap');
.hz-root{ --paper:#F2F1EC; --ink:#111; --stone:#8b877e; --line:#e2ded4; --font:${FONT};
  background:var(--paper); color:var(--ink); min-height:100%; width:100%; font-family:var(--font); -webkit-font-smoothing:antialiased; box-sizing:border-box; }
.hz-root *,.hz-root *::before,.hz-root *::after{ box-sizing:border-box; }
.hz-wrap{ max-width:1120px; margin:0 auto; padding:clamp(26px,5vw,48px) clamp(14px,4vw,30px) 80px; }
.hz-head{ text-align:center; margin-bottom:clamp(20px,4vw,30px); }
.hz-eyebrow{ font-weight:700; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--stone); margin:0; }
.hz-title{ font-weight:800; font-size:clamp(24px,5.5vw,36px); margin:12px 0 0; letter-spacing:-.02em; }
.hz-lede{ font-size:14px; color:var(--stone); margin:10px auto 0; max-width:30em; line-height:1.7; }
.hz-bar{ display:flex; flex-direction:column; gap:12px; max-width:600px; margin:0 auto; }
.hz-input{ width:100%; font-family:var(--font); font-size:16px; color:var(--ink); border:1px solid var(--line); border-radius:12px; padding:15px; background:#fff; resize:vertical; min-height:62px; line-height:1.6; }
.hz-input:focus{ outline:none; border-color:var(--ink); } .hz-input::placeholder{ color:#b6b1a6; }
.hz-chips{ display:flex; flex-wrap:wrap; gap:8px; }
.hz-chip{ font-size:12px; color:var(--stone); background:#fff; border:1px solid var(--line); border-radius:999px; padding:7px 13px; cursor:pointer; }
.hz-chip:hover{ border-color:var(--ink); color:var(--ink); }
.hz-handle{ font-size:13px; color:var(--ink); border:1px solid var(--line); border-radius:10px; padding:11px 12px; background:#fff; max-width:220px; }
.hz-handle:focus{ outline:none; border-color:var(--ink); }
.hz-btn{ font-weight:700; font-size:13px; color:#fff; background:var(--ink); border:1px solid var(--ink); border-radius:999px; padding:13px 28px; cursor:pointer; transition:opacity .16s; }
.hz-btn:hover{ opacity:.85; } .hz-btn:disabled{ opacity:.3; cursor:not-allowed; }
.hz-btn.ghost{ background:#fff; color:var(--ink); } .hz-btn.ghost:hover{ background:#faf9f6; }
.hz-btn.sm{ padding:9px 15px; font-size:12px; }
.hz-actions{ text-align:center; margin-top:18px; }
.hz-loading{ text-align:center; padding:clamp(26px,6vw,42px) 0; font-weight:700; font-size:clamp(18px,5vw,24px); color:var(--stone); }
.hz-loading::after{ content:'…'; animation:hzD 1.4s steps(4,end) infinite; }
@keyframes hzD{ 0%{opacity:.3} 50%{opacity:1} 100%{opacity:.3} }
.hz-err{ font-size:14px; color:var(--stone); border:1px solid var(--line); border-radius:12px; padding:16px 18px; line-height:1.7; max-width:600px; margin:0 auto; background:#fff; }
.hz-tools{ display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:center; margin:0 0 22px; }
.hz-swrow{ display:flex; gap:7px; align-items:center; } .hz-swlabel{ font-size:11px; letter-spacing:.08em; color:var(--stone); margin-right:3px; }
.hz-sw{ width:24px; height:24px; border-radius:999px; border:1px solid var(--line); cursor:pointer; padding:0; }
.hz-sw.on{ box-shadow:0 0 0 2px var(--paper),0 0 0 3px var(--ink); }
.hz-deck{ display:flex; gap:18px; overflow-x:auto; padding:6px 2px 18px; scroll-snap-type:x mandatory; }
.hz-slot{ scroll-snap-align:center; flex:0 0 auto; }
.hz-card{ width:min(80vw,320px); aspect-ratio:4/5; border:1px solid var(--line); border-radius:6px; overflow:hidden; position:relative; cursor:pointer; background:#FDFCF8; transition:box-shadow .15s; touch-action:none; }
.hz-card.sel{ box-shadow:0 0 0 2px var(--ink); }
.hz-bgimg{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.hz-grad{ position:absolute; inset:0; background:linear-gradient(180deg, rgba(217,217,217,0) 0%, rgba(0,0,0,.6) 100%); pointer-events:none; }
.hz-pad{ position:absolute; inset:0; padding:7.5% 7%; pointer-events:none; }
.hz-handletop{ position:absolute; top:4.5%; left:0; right:0; text-align:center; font-weight:700; font-size:min(3.2vw,12px); z-index:3; pointer-events:none; }
.hz-handletop.white{ color:#fff; }
.hz-ctitle{ font-weight:800; letter-spacing:-.02em; line-height:1.25; }
.hz-cbody{ font-weight:400; line-height:1.45; letter-spacing:-.01em; }
.hz-csub{ font-weight:500; line-height:1.4; }
.hz-badge{ display:inline-flex; align-items:center; background:#D7FFFC; color:#111; font-weight:700; border-radius:999px; padding:5px 14px; font-size:min(3.2vw,12px); }
.hz-ph{ position:absolute; overflow:hidden; background:#efece4 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Cpath fill='%23e2ded4' d='M0 0h8v8H0zM8 8h8v8H8z'/%3E%3C/svg%3E"); background-size:16px; cursor:pointer; }
.hz-ph.sq{ border-radius:2px; }
.hz-ph img{ width:100%; height:100%; object-fit:cover; display:block; }
.hz-ph-hint{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:11px; color:#6b6b6b; font-weight:600; background:rgba(255,255,255,.5); }
.hz-sticker{ position:absolute; transform:translate(-50%,-50%); cursor:grab; user-select:none; z-index:4; }
.hz-sticker.dragging{ cursor:grabbing; } .hz-sticker.on{ outline:1.5px dashed rgba(0,0,0,.5); outline-offset:3px; }
.hz-editor{ max-width:640px; margin:20px auto 0; border-top:1px solid var(--line); padding-top:20px; }
.hz-e-h{ font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--stone); margin:0 0 14px; }
.hz-field{ margin-bottom:12px; }
.hz-flabel{ font-size:11px; color:var(--stone); display:block; margin-bottom:5px; }
.hz-ei{ width:100%; font-family:var(--font); font-size:14px; color:var(--ink); border:1px solid var(--line); border-radius:8px; padding:9px 10px; background:#fff; resize:vertical; line-height:1.5; }
.hz-ei:focus{ outline:none; border-color:var(--ink); }
.hz-row{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
/* display:none 이면 Safari 가 programmatic .click() 을 무시한다. 화면에서만 숨긴다. */
.hz-file{ position:fixed; width:1px; height:1px; opacity:0; pointer-events:none; left:-9999px; top:0; }
.hz-lay{ display:flex; flex-wrap:wrap; gap:6px; }
.hz-laybtn{ font-size:12px; color:var(--stone); background:#fff; border:1px solid var(--line); border-radius:8px; padding:7px 12px; cursor:pointer; }
.hz-laybtn.on{ background:var(--ink); color:#fff; border-color:var(--ink); }
.hz-stickpick{ display:flex; flex-wrap:wrap; gap:8px; }
.hz-stickbtn{ background:#fff; border:1px solid var(--line); border-radius:10px; padding:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; height:52px; }
.hz-stickbtn:hover{ border-color:var(--ink); } .hz-stickbtn img{ max-height:36px; max-width:120px; }
.hz-foot{ font-size:11px; color:var(--stone); text-align:center; margin-top:24px; line-height:1.7; }

/* ── 크롬: 소프트 에디토리얼 (라운드 · 페리윙클/옐로우 · Pretendard) ── */
.db-root{ --ink:#211f1b; --mut:#928d84; --line:#ECE8E0; --paper:#FAF8F3; --card:#fff; --page-pad:clamp(14px,3vw,44px);
  --blue:#5B68E0; --blueSoft:#EEF0FC; --yellow:#FBEE86; --yellowSoft:#FDF7C9;
  --display:${FONT}; --sans:${FONT}; --serif:'Fraunces', Georgia, serif;
  background:var(--paper); color:var(--ink); min-height:100vh; padding:var(--page-pad); font-family:var(--sans); }
.db-frame{ max-width:1440px; min-height:calc(100vh - var(--page-pad) - var(--page-pad)); margin:0 auto; background:var(--card); border:1px solid var(--line); border-radius:30px; box-shadow:0 24px 64px rgba(40,38,32,.07); overflow:hidden; display:flex; flex-direction:column; }
.db-top{ display:flex; align-items:center; gap:12px; padding:18px 28px 14px; border-bottom:1px solid var(--line); }
.db-top .side{ display:flex; align-items:center; gap:12px; flex:1 1 0; min-width:0; }
.db-top .side.right{ justify-content:flex-end; }
.db-issue{ font-weight:600; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--mut); white-space:nowrap; }
.db-titleblock{ flex:0 1 auto; min-width:0; display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; }
.db-masthead{ font-family:var(--display); font-weight:700; font-size:21px; letter-spacing:-.02em; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:36vw; color:var(--blue); }
.db-masthead.brand{ font-family:var(--serif); font-weight:600; font-size:22px; letter-spacing:.005em; }
.db-top-sub{ font-weight:500; font-size:clamp(12.5px,3vw,14px); letter-spacing:-.01em; color:var(--mut); white-space:nowrap; }
.db-zoom{ font-size:12px; color:var(--mut); font-weight:500; }
.db-ico{ width:18px; height:18px; color:var(--ink); flex:none; }
.db-hero{ text-align:center; padding:clamp(22px,3.2vw,36px) 24px clamp(14px,2vw,20px); }
.db-kicker{ font-family:var(--display); font-weight:600; font-size:clamp(14px,3vw,18px); letter-spacing:-.02em; color:var(--blue); margin:0 0 12px; }
.db-hero h1{ font-weight:600; font-size:clamp(22px,4.2vw,34px); letter-spacing:-.04em; margin:0; line-height:1.15; }
.db-hero .kr{ font-weight:500; font-size:clamp(12.5px,3vw,14px); letter-spacing:-.01em; margin-top:10px; color:var(--mut); }
.db-rule{ border:0; border-top:1px solid var(--line); margin:0 28px; }
.db-subline{ text-align:center; font-size:clamp(12px,3vw,14px); color:var(--mut); padding:16px 24px 2px; line-height:1.6; }
.db-body{ padding:clamp(20px,3.6vw,38px); flex:1; }
.db-body.landing{ width:min(912px,100%); min-height:min(726px,calc(100vh - 190px)); margin:0 auto; padding:clamp(34px,4.8vh,48px) clamp(18px,3vw,32px) 0; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; }
.db-seclabel{ font-weight:700; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--blue); margin:0 0 16px; }
.db-panel{ background:var(--card); border:1px solid var(--line); border-radius:22px; }
.db-about{ width:min(100%,720px); max-width:720px; min-height:640px; margin:0 auto; padding:56px 44px 54px; display:flex; flex-direction:column; }
.db-about h2{ font-family:var(--display); font-weight:700; font-size:25px; letter-spacing:-.03em; margin:0 0 6px; color:var(--ink); }
.db-about p.sub{ font-size:13px; color:var(--mut); margin:0 0 20px; line-height:1.7; }
.db-work{ display:grid; grid-template-columns:1fr; gap:22px; }
@media (min-width:980px){ .db-work{ grid-template-columns:minmax(0,1fr) 344px; align-items:start; } }
.db-boardwrap{ padding:20px 20px 8px; background:var(--paper); }
.db-boardhead{ display:flex; align-items:baseline; justify-content:space-between; margin:2px 6px 16px; }
.db-boardhead .t{ font-weight:700; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink); }
.db-boardhead .c{ font-size:11px; color:var(--mut); }
.db-editwrap{ padding:24px; }
.db-editwrap .h{ font-family:var(--display); font-weight:700; font-size:18px; letter-spacing:-.03em; margin:0 0 3px; }
.db-editwrap .hc{ font-size:11px; color:var(--mut); margin:0 0 18px; }
.db-loading, .db-error{ max-width:540px; margin:6vh auto; text-align:center; }
.db-error .db-panel{ padding:22px; }
.db-body:has(.db-loading), .db-body:has(.db-error){ display:flex; align-items:flex-start; justify-content:center; }
.db-body:has(.db-loading) .db-loading, .db-body:has(.db-error) .db-error{ width:100%; margin:clamp(54px,12vh,120px) auto 0; }
@media (max-width:820px){ .db-masthead{ max-width:44vw; font-size:18px; } .db-masthead.brand{ font-size:19px; } }
.db-toolbar{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px 16px; padding:14px 28px; border-bottom:1px solid var(--line); }
.db-toolbar-actions{ display:flex; gap:8px; flex:none; }
.db-root .hz-btn{ white-space:nowrap; }
.db-root .hz-swrow{ flex-wrap:wrap; }
.db-root .hz-seg button{ white-space:nowrap; padding:9px 6px; }
.db-about .hz-input{ min-height:82px; }
.db-about .hz-bar{ width:100%; gap:18px; }
.db-about .hz-chips{ gap:12px; margin-bottom:20px; }
.db-about .hz-actions{ margin-top:auto; padding-top:78px; }
.db-editwrap .hz-field{ margin-bottom:24px; }
.db-editwrap .hz-flabel{ margin-bottom:10px; }
.db-editwrap .hz-row{ gap:12px; }
.db-editwrap .hz-lay{ gap:10px; }
.db-editwrap .hz-stickpick{ gap:16px; margin-top:4px; }
.db-editwrap .hz-ai{ margin-bottom:26px; }

/* 소프트 톤 오버라이드 */
.db-root .hz-input, .db-root .hz-ei, .db-root .hz-handle{ border:1px solid var(--line); border-radius:14px; background:#fff; }
.db-root .hz-input:focus, .db-root .hz-ei:focus, .db-root .hz-handle:focus{ border-color:var(--blue); }
.db-root .hz-chip{ border:1px solid var(--line); color:var(--ink); border-radius:999px; }
.db-root .hz-chip:hover{ background:var(--blue); color:#fff; border-color:var(--blue); }
.db-root .hz-btn{ background:var(--blue); border-color:var(--blue); border-radius:999px; }
.db-root .hz-btn:hover{ opacity:.9; }
.db-root .hz-btn.ghost{ background:#fff; color:var(--ink); border:1px solid var(--line); }
.db-root .hz-btn.ghost:hover{ background:var(--blueSoft); }
.db-root .hz-swlabel, .db-root .hz-flabel{ color:var(--mut); }
.db-root .hz-seg{ border:1px solid var(--line); border-radius:12px; overflow:hidden; display:inline-flex; }
.db-root .hz-seg button.on{ background:var(--blue); }
.db-root .hz-seg button{ white-space:nowrap; padding:9px 18px; flex:1 1 0; }
.db-root .hz-seg button + button{ border-left:1px solid var(--line); }
.db-root .hz-laybtn{ border:1px solid var(--line); border-radius:999px; color:var(--ink); }
.db-root .hz-laybtn.on{ background:var(--blue); color:#fff; border-color:var(--blue); }
.db-root .hz-stickbtn{ border:1px solid var(--line); border-radius:14px; }
.db-root .hz-card{ border:1px solid var(--line); border-radius:16px; }
.db-root .hz-loading{ color:var(--mut); font-family:var(--serif); font-style:italic; font-weight:600; font-size:clamp(15px,3.4vw,19px); letter-spacing:0; }
.db-root .hz-ai{ background:var(--blueSoft); border:1px solid #DFE2FA; border-radius:14px; padding:14px; margin-bottom:18px; }
.db-root .hz-ai .lbl{ font-size:11px; font-weight:700; letter-spacing:.06em; color:var(--blue); margin:0 0 10px; }
.db-root .hz-aichips{ display:flex; flex-wrap:wrap; gap:6px; margin-bottom:9px; }
.db-root .hz-aichip{ font-family:var(--sans); font-size:11.5px; background:#fff; border:1px solid #DFE2FA; color:var(--blue); border-radius:999px; padding:6px 11px; cursor:pointer; transition:background .15s,color .15s; }
.db-root .hz-aichip:hover{ background:var(--blue); color:#fff; }
.db-root .hz-aichip:disabled{ opacity:.5; cursor:not-allowed; }
.db-root .hz-airow{ display:flex; gap:6px; }
.db-root .hz-aiin{ flex:1; min-width:0; border:1px solid #DFE2FA; border-radius:10px; padding:9px 11px; font-family:var(--sans); font-size:13px; background:#fff; color:var(--ink); }
.db-root .hz-aiin:focus{ outline:none; border-color:var(--blue); }
.db-root .hz-aiapply{ background:var(--blue); color:#fff; border:0; border-radius:10px; padding:0 15px; font-family:var(--sans); font-weight:600; font-size:12px; cursor:pointer; }
.db-root .hz-aiapply:disabled{ opacity:.4; cursor:not-allowed; }

@media (prefers-reduced-motion:reduce){ .hz-btn,.hz-card,.hz-sticker{ transition:none; } .hz-loading::after{ animation:none; } }
`;

const RAIL = [
  { k: "note", label: "노트", d: "M4 3h10l4 4v14H4z M14 3v4h4" },
  { k: "link", label: "링크", d: "M8 13a4 4 0 0 0 6 0l2-2a4 4 0 0 0-6-6l-1 1 M14 9a4 4 0 0 0-6 0l-2 2a4 4 0 0 0 6 6l1-1" },
  { k: "todo", label: "체크", d: "M4 6h10 M4 12h10 M4 18h6 M17 5l2 2 4-4" },
  { k: "board", label: "보드", act: true, d: "M4 4h7v7H4z M13 4h7v4h-7z M13 10h7v10h-7z M4 13h7v7H4z" },
  { k: "image", label: "이미지", d: "M4 5h16v14H4z M8 11l3 3 3-4 4 5" },
  { k: "upload", label: "업로드", d: "M12 16V6 M8 10l4-4 4 4 M5 19h14" },
  { k: "trash", label: "삭제", d: "M5 7h14 M9 7V5h6v2 M7 7l1 13h8l1-13" },
];

const EX = ["작은 브랜드 인스타 시작 팁", "자취방 미니멀 정리법", "주말 당일치기 여행"];
const TONES = [{ k: "friendly", label: "친근" }, { k: "info", label: "정보" }, { k: "mood", label: "감성" }, { k: "witty", label: "유머" }];
const TONEMAP = { friendly: "친근하고 편안하게", info: "담백하고 정보 전달 중심으로", mood: "짧고 여운 있는 감성으로", witty: "위트 있고 재치 있게" };
const AIQ = [
  { l: "더 짧게", i: "더 짧고 간결하게" },
  { l: "친근하게", i: "더 친근하고 편안한 말투로" },
  { l: "정보 위주", i: "감성 표현은 빼고 정보 위주로 명확하게" },
  { l: "이모지 빼기", i: "이모지를 모두 빼고 담백하게" },
  { l: "임팩트", i: "더 눈에 띄고 임팩트 있게" },
  { l: "새로 쓰기", i: "완전히 새로운 버전으로 다시 써줘" },
];
let idc = 0; const uid = () => `c${++idc}`; const sid = () => `s${++idc}`;

// 서버리스 함수(/api/generate)를 통해 Gemini 호출. 키는 서버에만 있다.
async function askAI({ system, prompt, maxTokens }) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, prompt, maxTokens }),
  });
  if (!res.ok) throw new Error(String(res.status));
  const { text } = await res.json();
  return JSON.parse(text);
}

export default function CardNewsMaker() {
  const [topic, setTopic] = useState("");
  const [handle, setHandle] = useState("@yourhandle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deck, setDeck] = useState(null);
  const [bg, setBg] = useState("paper");
  const [selIdx, setSelIdx] = useState(0);
  const [selSt, setSelSt] = useState(null);
  const [tone, setTone] = useState("friendly");
  const [regenIdx, setRegenIdx] = useState(null);
  const [drag, setDrag] = useState(null);
  const [refining, setRefining] = useState(false);
  const [refineText, setRefineText] = useState("");
  const fileRef = useRef(null);
  const photoTarget = useRef(null);
  const cardRefs = useRef({});

  useEffect(() => { if (document.fonts) document.fonts.ready.catch(() => {}); }, []);

  const run = async () => {
    const q = topic.trim(); if (!q || loading) return;
    setLoading(true); setError(null); setDeck(null); setSelIdx(0); setSelSt(null);
    try {
      const p = await askAI({
        system: SYSTEM,
        prompt: `주제: ${q}\n톤: ${TONEMAP[tone]}\n\n지정된 JSON으로만 구성하라.`,
        maxTokens: 2600,
      });
      const mk = (type, extra) => ({ id: uid(), type, photos: Array(PHOTON[type]).fill(null), stickers: [], color: "#111111", hl: "#FFE99C", ...extra });
      const cards = [mk("cover", { title: p.cover?.title || "", subtitle: p.cover?.subtitle || "", badge: p.cover?.badge || "★여기 포인트", scrim: true })];
      (p.body || []).forEach((b) => { const t = ["text", "photo", "phototop"].includes(b.layout) ? b.layout : "text"; cards.push(mk(t, { title: b.title || "", text: b.text || "" })); });
      cards.push(mk("closing", { title: p.closing?.title || "", text: p.closing?.text || "" }));
      setDeck({ cards });
    } catch (e) { setError("만들지 못했어요. 잠시 후 다시 시도해 주세요."); }
    finally { setLoading(false); }
  };

  const reset = () => { setDeck(null); setError(null); setTopic(""); setSelIdx(0); setSelSt(null); };

  const regenCard = async (i) => {
    if (regenIdx != null || !deck) return;
    const c = deck.cards[i]; setRegenIdx(i);
    const role = c.type === "cover" ? "표지" : c.type === "closing" ? "마무리" : c.type === "square" ? "정사각 사진 캡션" : "본문";
    const fields = c.type === "cover" ? `{"title":"","subtitle":"","badge":""}` : c.type === "square" ? `{"title":""}` : `{"title":"","text":""}`;
    const sys = `당신은 인스타그램 카드뉴스 카피라이터다. 톤: ${TONEMAP[tone]}. 주어진 카드의 문구만 자연스럽게 새로 써라. 표지 title에는 핵심 단어 하나를 [[ ]]로 감싸도 좋다. 반드시 아래 JSON만 출력(마크다운·코드펜스 금지): ${fields}`;
    const cur = `현재 제목: ${c.title || ""}\n현재 내용: ${c.text || c.subtitle || ""}`;
    try {
      const p = await askAI({
        system: sys,
        prompt: `전체 주제: ${topic}\n이 카드 역할: ${role}\n${cur}\n\n같은 주제·역할을 유지하되 문구를 새롭게 바꿔서 JSON으로만.`,
        maxTokens: 1200,
      });
      const patch = {}; if (p.title != null) patch.title = p.title; if (p.text != null) patch.text = p.text; if (p.subtitle != null) patch.subtitle = p.subtitle; if (p.badge != null) patch.badge = p.badge;
      upd(i, patch);
    } catch (e) { /* keep current on failure */ }
    finally { setRegenIdx(null); }
  };
  const upd = (i, patch) => setDeck((d) => ({ ...d, cards: d.cards.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));
  const sel = deck?.cards[selIdx];

  const refineCard = async (instruction) => {
    if (refining || !deck) return;
    const idx = selIdx; const card = deck.cards[idx]; if (!card) return;
    const type = card.type;
    const role = type === "cover" ? "표지" : type === "closing" ? "마무리" : "본문";
    let fields, shape;
    if (type === "cover") { fields = { title: card.title, subtitle: card.subtitle, badge: card.badge }; shape = '{ "title":"", "subtitle":"", "badge":"" }'; }
    else if (type === "square") { fields = { title: card.title }; shape = '{ "title":"" }'; }
    else { fields = { title: card.title, text: card.text }; shape = '{ "title":"", "text":"" }'; }
    setRefining(true);
    try {
      const sys = `당신은 인스타그램 카드뉴스 카피라이터다. 친근하고 담백한 요즘 카드뉴스 톤. 주어진 카드 카피를 사용자의 지시대로 고쳐 쓴다. 원래 의미와 주제는 유지하되 지시를 확실히 반영한다. 표지(cover)의 title에서는 핵심 단어 하나를 [[ ]]로 감싸 형광펜 강조를 줘도 좋다. 한국어. 반드시 아래 JSON만 출력(마크다운·코드펜스 금지): ${shape}`;
      const usr = `전체 주제: ${topic}\n카드 종류: ${role}\n현재 카피: ${JSON.stringify(fields)}\n요청: ${instruction}`;
      const parsed = await askAI({ system: sys, prompt: usr, maxTokens: 1600 });
      const patch = {}; Object.keys(fields).forEach((k) => { if (typeof parsed[k] === "string") patch[k] = parsed[k]; });
      if (Object.keys(patch).length) upd(idx, patch);
      setRefineText("");
    } catch (e) { /* keep original on failure */ }
    finally { setRefining(false); }
  };

  const changeLayout = (i, type) => { const c = deck.cards[i]; const photos = Array(PHOTON[type]).fill(null); (c.photos || []).forEach((ph, k) => { if (k < photos.length) photos[k] = ph; }); upd(i, { type, photos }); };

  const onPhoto = (files) => {
    const f = files && files[0];
    const target = photoTarget.current;
    if (!f || !f.type.startsWith("image/") || !target) return;
    const { cardIdx: idx, slot } = target;
    const r = new FileReader();
    // 읽기가 끝난 뒤 최신 deck 기준으로 반영한다(닫힌 변수 stale 방지).
    r.onload = () => setDeck((d) => (!d ? d : { ...d, cards: d.cards.map((c, i) => {
      if (i !== idx) return c;
      const photos = [...(c.photos || [])];
      photos[slot] = r.result;
      return { ...c, photos };
    }) }));
    r.onerror = () => setError("사진을 불러오지 못했어요. 다른 이미지를 선택해 주세요.");
    r.readAsDataURL(f);
  };
  // value 비우기는 읽는 중이 아니라 다음 선택 직전에. (Safari 에서 읽는 도중 비우면 파일 참조가 깨진다)
  const pickPhoto = (cardIdx, slot) => { photoTarget.current = { cardIdx, slot }; const el = fileRef.current; if (!el) return; el.value = ""; el.click(); };

  const addSticker = (preset) => { const s = { id: sid(), type: preset.type, text: preset.text, fill: preset.fill, xPct: 50, yPct: 50 }; upd(selIdx, { stickers: [...(sel.stickers || []), s] }); setSelSt(s.id); };
  const updSt = (id, patch) => upd(selIdx, { stickers: sel.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const rmSt = (id) => { upd(selIdx, { stickers: sel.stickers.filter((s) => s.id !== id) }); setSelSt((x) => (x === id ? null : x)); };
  const selectedSt = sel?.stickers?.find((s) => s.id === selSt) || null;
  const onStDown = (e, cardIdx, id) => { e.stopPropagation(); setSelIdx(cardIdx); setSelSt(id); const rect = cardRefs.current[cardIdx].getBoundingClientRect(); setDrag({ id, rect }); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} };
  const onMove = (e) => { if (!drag) return; const { rect } = drag; let x = ((e.clientX - rect.left) / rect.width) * 100, y = ((e.clientY - rect.top) / rect.height) * 100; updSt(drag.id, { xPct: Math.max(3, Math.min(97, x)), yPct: Math.max(4, Math.min(96, y)) }); };
  const onUp = () => setDrag(null);

  // ── export ──
  const wrap = (ctx, text, maxW) => { const words = String(text).split(/(\s+)/); let line = "", out = []; for (const w of words) { const t = line + w; if (ctx.measureText(t).width > maxW && line !== "") { out.push(line.trim()); line = w; } else line = t; } if (line.trim()) out.push(line.trim()); return out; };
  const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  const coverDraw = (ctx, img, x, y, w, h) => { const ir = img.width / img.height, cr = w / h; let dw, dh, dx, dy; if (ir > cr) { dh = h; dw = h * ir; dx = x + (w - dw) / 2; dy = y; } else { dw = w; dh = w / ir; dx = x; dy = y + (h - dh) / 2; } ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, dx, dy, dw, dh); ctx.restore(); };
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const drawTitle = (ctx, str, x, y, maxW, fs, lineH, textCol, hlCol) => {
    const chars = []; parseHL(str).forEach((s) => { for (const ch of s.t) chars.push({ ch, hl: s.hl }); });
    let cx = x, cy = y;
    for (const { ch, hl } of chars) {
      if (ch === "\n") { cx = x; cy += lineH; continue; }
      const w = ctx.measureText(ch).width;
      if (cx + w > x + maxW && cx > x) { cx = x; cy += lineH; }
      if (hl && ch.trim()) { ctx.fillStyle = hlCol || "#FFE99C"; rr(ctx, cx - 3, cy - fs * 0.78, w + 6, fs * 0.98, 6); ctx.fill(); }
      ctx.fillStyle = textCol; ctx.fillText(ch, cx, cy); cx += w;
    }
    return cy + lineH;
  };

  const drawCard = async (card) => {
    const W = 1080, H = 1350, pad = 80;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const ctx = cv.getContext("2d");
    try { await document.fonts.load(`800 60px 'Pretendard Variable'`); } catch {}
    try { await document.fonts.load(`400 40px 'Pretendard Variable'`); } catch {}
    const F = `'Pretendard Variable','Gothic A1',sans-serif`;
    const bk = card.bg || bg; const dk = isDark(bk);
    paintBg(ctx, bk, W, H); ctx.textBaseline = "alphabetic";
    const t = card.type;

    if (t === "cover") {
      let white = dk && !card.photos?.[0];
      if (card.photos?.[0]) { const im = await loadImg(card.photos[0]); coverDraw(ctx, im, 0, 0, W, H); if (card.scrim) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(217,217,217,0)"); g.addColorStop(1, "rgba(0,0,0,0.6)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } white = true; }
      const custom = card.color && card.color !== "#111111";
      const col = custom ? card.color : (white ? "#fff" : "#111");
      // badge
      ctx.font = `700 36px ${F}`; const bw = ctx.measureText(card.badge || "").width + 56;
      ctx.fillStyle = "#D7FFFC"; rr(ctx, 90, 846, bw, 70, 35); ctx.fill();
      ctx.fillStyle = "#111"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(card.badge || "", 118, 883); ctx.textBaseline = "alphabetic";
      // title
      ctx.font = `800 88px ${F}`; let y = drawTitle(ctx, card.title, 90, 1000, 900, 88, 108, col, card.hl) - 108 + 108;
      ctx.fillStyle = col; ctx.font = `500 45px ${F}`; ctx.fillText(card.subtitle || "", 90, y + 16);
    } else if (card.scrim && card.photos?.[0]) {
      const im = await loadImg(card.photos[0]); coverDraw(ctx, im, 0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(217,217,217,0)"); g.addColorStop(1, "rgba(0,0,0,0.6)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff"; ctx.font = `700 30px ${F}`; ctx.textAlign = "center"; ctx.fillText(handle, W / 2, 96); ctx.textAlign = "left";
      const col = (card.color && card.color !== "#111111") ? card.color : "#fff";
      ctx.font = `800 84px ${F}`; let y = drawTitle(ctx, card.title, 80, 1010, W - 160, 84, 104, col, card.hl);
      ctx.fillStyle = "#fff"; ctx.font = `400 40px ${F}`; wrap(ctx, card.text, W - 160).forEach((l, k) => ctx.fillText(l, 80, y + 20 + k * 56));
    } else {
      // handle top
      const custom = card.color && card.color !== "#111111";
      const tcol = custom ? card.color : (dk ? "#fff" : "#111");
      const bcol = dk ? "#E9E7E1" : "#111";
      ctx.fillStyle = dk ? "#fff" : "#111"; ctx.font = `700 30px ${F}`; ctx.textAlign = "center"; ctx.fillText(handle, W / 2, 96); ctx.textAlign = "left";
      if (t === "text") {
        ctx.font = `800 56px ${F}`; let y = drawTitle(ctx, card.title, pad, 300, W - pad * 2, 56, 74, tcol, card.hl);
        ctx.fillStyle = bcol; ctx.font = `400 42px ${F}`; y += 40; wrap(ctx, card.text, W - pad * 2).forEach((l) => { ctx.fillText(l, pad, y); y += 64; });
      } else if (t === "photo") {
        ctx.font = `800 54px ${F}`; drawTitle(ctx, card.title, pad, 250, W - pad * 2, 54, 70, tcol, card.hl);
        const slots = [{ x: 92, y: 340, s: 400 }, { x: 588, y: 560, s: 400 }];
        for (let s = 0; s < 2; s++) if (card.photos?.[s]) { const im = await loadImg(card.photos[s]); coverDraw(ctx, im, slots[s].x, slots[s].y, slots[s].s, slots[s].s); }
        ctx.fillStyle = bcol; ctx.font = `400 40px ${F}`; let by = 1080; wrap(ctx, card.text, W - pad * 2).forEach((l) => { ctx.fillText(l, pad, by); by += 58; });
      } else if (t === "phototop") {
        if (card.photos?.[0]) { const im = await loadImg(card.photos[0]); coverDraw(ctx, im, 95, 130, 890, 640); }
        ctx.font = `800 50px ${F}`; let y = drawTitle(ctx, card.title, 96, 856, W - pad * 2, 50, 66, tcol, card.hl);
        ctx.fillStyle = bcol; ctx.font = `400 40px ${F}`; y += 20; wrap(ctx, card.text, 807).forEach((l) => { ctx.fillText(l, 96, y); y += 58; });
      } else if (t === "split") {
        if (card.photos?.[0]) { const im = await loadImg(card.photos[0]); coverDraw(ctx, im, 0, 0, W, 675); }
        if (card.photos?.[1]) { const im = await loadImg(card.photos[1]); coverDraw(ctx, im, 0, 675, W, 675); }
        ctx.font = `800 60px ${F}`; let y = drawTitle(ctx, card.title, 54, 210, 940, 60, 76, tcol, card.hl);
        ctx.fillStyle = bcol; ctx.font = `400 44px ${F}`; y += 12; wrap(ctx, card.text, 700).forEach((l) => { ctx.fillText(l, 54, y); y += 60; });
      } else if (t === "square") {
        if (card.photos?.[0]) { const im = await loadImg(card.photos[0]); coverDraw(ctx, im, 0, 135, W, 1080); }
        ctx.font = `700 44px ${F}`; drawTitle(ctx, card.title, 40, 1290, W - 80, 44, 56, tcol, card.hl);
      } else { // closing
        ctx.font = `800 60px ${F}`; let y = drawTitle(ctx, card.title, pad, 560, W - pad * 2, 60, 80, tcol, card.hl);
        ctx.fillStyle = dk ? "#CFCCC5" : "#333"; ctx.font = `400 40px ${F}`; y += 30; wrap(ctx, card.text, W - pad * 2).forEach((l) => { ctx.fillText(l, pad, y); y += 58; });
      }
    }
    for (const st of card.stickers || []) {
      const g = genSticker(st.type, st.text, st.fill);
      const im = await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(g.svg));
      const cx = (st.xPct / 100) * W, cy = (st.yPct / 100) * H;
      ctx.drawImage(im, cx - g.w / 2, cy - g.h / 2, g.w, g.h);
    }
    return cv;
  };

  const exportAll = async () => {
    if (!deck) return;
    for (let i = 0; i < deck.cards.length; i++) {
      const cv = await drawCard(deck.cards[i]);
      const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = `card-${String(i + 1).padStart(2, "0")}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      await new Promise((r) => setTimeout(r, 250));
    }
  };

  // screen photo slots (% of card)
  const slots = (t) => t === "cover" ? [{ l: 0, t: 0, w: 100, h: 100, full: true }]
    : t === "phototop" ? [{ l: 8.8, t: 9.6, w: 82.4, h: 47.4, sq: true }]
    : t === "photo" ? [{ l: 8.5, t: 25, w: 37, h: 30, sq: true }, { l: 54, t: 41, w: 37, h: 30, sq: true }]
    : t === "split" ? [{ l: 0, t: 0, w: 100, h: 50 }, { l: 0, t: 50, w: 100, h: 50 }]
    : t === "square" ? [{ l: 0, t: 10, w: 100, h: 80 }] : [];

  const cover = sel;

  return (
    <div className="hz-root db-root">
      <style>{CSS}</style>
      <input ref={fileRef} type="file" accept="image/*" className="hz-file" tabIndex={-1} aria-hidden="true" onChange={(e) => onPhoto(e.target.files)} />

      <div className="db-frame">
        {/* 마스트헤드 */}
        <div className="db-top">
          <div className="side"><span className="db-issue">Studio · 2026</span></div>
          <div className="db-titleblock">
            {(() => {
              const t = (deck && topic.trim()) || "Card News Studio";
              // 브랜드명일 때만 Fraunces. 한글 주제는 Pretendard 로 둔다(Fraunces 에 한글 글리프가 없다).
              return <div className={`db-masthead${t === "Card News Studio" ? " brand" : ""}`}>{t}</div>;
            })()}
            {!deck && <div className="db-top-sub">주제 한 줄이면, 카드뉴스가 완성됩니다</div>}
          </div>
          <div className="side right">
            <svg className="db-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
            <svg className="db-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" /><path d="M3 6l9 7 9-7" /></svg>
            <svg className="db-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          </div>
        </div>

        {deck && !loading && (
          <div className="db-toolbar">
            <div className="hz-swrow"><span className="hz-swlabel">배경</span>{BGKEYS.map((k) => <button key={k} className={`hz-sw${bg === k ? " on" : ""}`} style={{ background: cssBg(k) }} onClick={() => setBg(k)} aria-label={BGS[k].name} title={BGS[k].name} />)}</div>
            <div className="db-toolbar-actions">
              <button className="hz-btn sm" onClick={exportAll}>내보내기</button>
              <button className="hz-btn ghost sm" onClick={reset}>새로 만들기</button>
            </div>
          </div>
        )}

        <div className={`db-body${!deck && !loading ? " landing" : ""}`}>
          {!deck && !loading && (
            <section className="db-panel db-about">
              <p className="db-seclabel">New Card News</p>
              <div className="hz-bar">
                <textarea className="hz-input" placeholder="예) 작은 브랜드가 인스타 처음 시작할 때 알아야 할 것" value={topic} onChange={(e) => setTopic(e.target.value)} />
                <div className="hz-chips">{EX.map((ex) => <button key={ex} className="hz-chip" onClick={() => setTopic(ex)}>{ex}</button>)}</div>
                <div>
                  <div className="hz-flabel" style={{ marginBottom: 6 }}>카피 톤</div>
                  <div className="hz-lay">{TONES.map((tn) => <button key={tn.k} className={`hz-laybtn${tone === tn.k ? " on" : ""}`} onClick={() => setTone(tn.k)}>{tn.label}</button>)}</div>
                </div>
                <input className="hz-handle" value={handle} onChange={(e) => setHandle(e.target.value)} aria-label="인스타 아이디" />
              </div>
              <div className="hz-actions"><button className="hz-btn" onClick={run} disabled={!topic.trim()}>카드뉴스 만들기</button></div>
            </section>
          )}

          {loading && <div className="db-loading"><div className="hz-loading">Crafting your cards</div></div>}
          {error && !loading && (<div className="db-error"><div className="db-panel" style={{ padding: 20 }}><div className="hz-err" style={{ border: 0, padding: 0 }}>{error}</div><div className="hz-actions"><button className="hz-btn ghost" onClick={() => setError(null)}>다시 시도</button></div></div></div>)}

          {deck && !loading && (
            <div className="db-work">
              <div className="db-panel db-boardwrap">
                <div className="db-boardhead"><span className="t">Cards · {deck.cards.length}</span><span className="c">카드를 눌러 편집</span></div>
                <div className="hz-deck">
              {deck.cards.map((c, i) => {
                const bk = c.bg || bg; const dk = isDark(bk);
                const fullbleed = c.type !== "cover" && c.scrim && c.photos?.[0];
                const white = (c.type === "cover" && c.photos?.[0]) || (c.type === "cover" && dk) || fullbleed;
                const tc = (c.color && c.color !== "#111111") ? c.color : ((dk || fullbleed) ? "#fff" : "#111");
                const bc = (dk || fullbleed) ? "#E9E7E1" : undefined;
                return (
                  <div className="hz-slot" key={c.id}>
                    <div ref={(el) => (cardRefs.current[i] = el)} className={`hz-card${i === selIdx ? " sel" : ""}`} style={{ background: cssBg(bk) }}
                         onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onClick={() => { setSelIdx(i); setSelSt(null); }}>

                      {fullbleed && (<><img className="hz-bgimg" src={c.photos[0]} alt="" /><div className="hz-grad" /></>)}
                      {/* photos */}
                      {!fullbleed && slots(c.type).map((s, si) => (
                        <div key={si} className={`hz-ph${s.sq ? " sq" : ""}`} style={{ left: `${s.l}%`, top: `${s.t}%`, width: `${s.w}%`, height: `${s.h}%`, borderRadius: s.full ? 0 : undefined }}
                             onClick={(e) => { e.stopPropagation(); setSelIdx(i); pickPhoto(i, si); }}>
                          {c.photos?.[si] ? <img src={c.photos[si]} alt="" /> : <div className="hz-ph-hint">＋ 사진</div>}
                        </div>
                      ))}

                      {c.type === "cover" && c.photos?.[0] && c.scrim && <div className="hz-grad" />}
                      <div className={`hz-handletop${white ? " white" : ""}`}>{handle}</div>

                      <div className="hz-pad">
                        {fullbleed && (
                          <div style={{ position: "absolute", left: "7%", right: "7%", bottom: "10%", color: "#fff" }}>
                            <div className="hz-ctitle" style={{ fontSize: "min(6vw,23px)", color: tc }}><RichTitle str={c.title} hl={c.hl} /></div>
                            {c.text && <div className="hz-cbody" style={{ fontSize: "min(3.5vw,13px)", marginTop: 10 }}>{c.text}</div>}
                          </div>
                        )}
                        {!fullbleed && c.type === "cover" && (
                          <div style={{ position: "absolute", left: "8%", right: "8%", bottom: "9%", color: tc }}>
                            <span className="hz-badge">{c.badge}</span>
                            <div className="hz-ctitle" style={{ fontSize: "min(8vw,31px)", marginTop: 10 }}><RichTitle str={c.title} hl={c.hl} /></div>
                            <div className="hz-csub" style={{ fontSize: "min(4vw,15px)", marginTop: 8, color: tc }}>{c.subtitle}</div>
                          </div>
                        )}
                        {!fullbleed && c.type === "text" && (<div style={{ position: "absolute", left: "7%", right: "7%", top: "17%" }}><div className="hz-ctitle" style={{ fontSize: "min(5.4vw,20px)", color: tc }}><RichTitle str={c.title} hl={c.hl} /></div><div className="hz-cbody" style={{ fontSize: "min(3.7vw,13.5px)", marginTop: 18, color: bc }}>{c.text}</div></div>)}
                        {!fullbleed && c.type === "photo" && (<>
                          <div className="hz-ctitle" style={{ position: "absolute", left: "7%", right: "7%", top: "13%", fontSize: "min(5vw,18px)", color: tc }}><RichTitle str={c.title} hl={c.hl} /></div>
                          <div className="hz-cbody" style={{ position: "absolute", left: "7%", right: "7%", bottom: "13%", fontSize: "min(3.6vw,13px)", color: bc }}>{c.text}</div>
                        </>)}
                        {!fullbleed && c.type === "phototop" && (<>
                          <div className="hz-ctitle" style={{ position: "absolute", left: "9%", right: "9%", top: "60%", fontSize: "min(4.8vw,18px)", color: tc }}><RichTitle str={c.title} hl={c.hl} /></div>
                          <div className="hz-cbody" style={{ position: "absolute", left: "9%", right: "9%", top: "68%", fontSize: "min(3.5vw,13px)", color: bc }}>{c.text}</div>
                        </>)}
                        {!fullbleed && c.type === "split" && (<div style={{ position: "absolute", left: "5%", right: "5%", top: "11%" }}><div className="hz-ctitle" style={{ fontSize: "min(5.4vw,20px)", color: tc }}><RichTitle str={c.title} hl={c.hl} /></div><div className="hz-cbody" style={{ fontSize: "min(3.7vw,13.5px)", marginTop: 8, color: bc }}>{c.text}</div></div>)}
                        {!fullbleed && c.type === "square" && (<div className="hz-ctitle" style={{ position: "absolute", left: "4%", right: "4%", bottom: "5%", fontSize: "min(4.2vw,15px)", color: tc }}><RichTitle str={c.title} hl={c.hl} /></div>)}
                        {!fullbleed && c.type === "closing" && (<div style={{ position: "absolute", left: "7%", right: "7%", top: "40%" }}><div className="hz-ctitle" style={{ fontSize: "min(5.6vw,21px)", color: tc }}><RichTitle str={c.title} hl={c.hl} /></div><div className="hz-cbody" style={{ fontSize: "min(3.6vw,13px)", marginTop: 14, color: dk ? "#CFCCC5" : "#333" }}>{c.text}</div></div>)}
                      </div>

                      {(c.stickers || []).map((st) => (
                        <img key={st.id} className={`hz-sticker${st.id === selSt ? " on" : ""}${drag && drag.id === st.id ? " dragging" : ""}`} src={stickerURL(st)} alt="" draggable={false}
                             style={{ left: `${st.xPct}%`, top: `${st.yPct}%`, width: `${genSticker(st.type, st.text, st.fill).w / 1080 * 100}%` }}
                             onPointerDown={(e) => onStDown(e, i, st.id)} onClick={(e) => { e.stopPropagation(); setSelIdx(i); setSelSt(st.id); }} />
                      ))}
                    </div>
                  </div>
                );
              })}
                </div>
              </div>

              {sel && (
                <aside className="db-panel db-editwrap">
                  <p className="h">편집</p>
                  <p className="hc">{selIdx + 1}번 카드 · {sel.type === "cover" ? "표지" : sel.type === "closing" ? "마무리" : LAYOUTS.find((l) => l.key === sel.type)?.label || "본문"}</p>

                  <div className="hz-field" style={{ background: "var(--blueSoft)", borderRadius: 14, padding: "14px 14px 16px", marginBottom: 18 }}>
                    <label className="hz-flabel" style={{ color: "var(--blue)", fontWeight: 700, letterSpacing: ".04em" }}>AI 다시 쓰기</label>
                    <div className="hz-lay" style={{ margin: "8px 0 10px" }}>{TONES.map((tn) => <button key={tn.k} className={`hz-laybtn${tone === tn.k ? " on" : ""}`} onClick={() => setTone(tn.k)}>{tn.label}</button>)}</div>
                    <button className="hz-btn sm" style={{ width: "100%" }} onClick={() => regenCard(selIdx)} disabled={regenIdx != null}>
                      {regenIdx === selIdx ? "다시 쓰는 중…" : "이 카드 문구 다시 쓰기"}
                    </button>
                  </div>

                  <div className="hz-ai">
                    <p className="lbl">✦ AI로 다듬기{refining && <span style={{ fontWeight: 500, opacity: .8 }}> · 고치는 중…</span>}</p>
                    <div className="hz-aichips">
                      {AIQ.map((q) => <button key={q.l} className="hz-aichip" disabled={refining} onClick={() => refineCard(q.i)}>{q.l}</button>)}
                    </div>
                    <div className="hz-airow">
                      <input className="hz-aiin" placeholder="예: 더 궁금하게, 존댓말로, 이 표현 바꿔줘…" value={refineText} disabled={refining}
                             onChange={(e) => setRefineText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && refineText.trim()) refineCard(refineText); }} />
                      <button className="hz-aiapply" disabled={refining || !refineText.trim()} onClick={() => refineCard(refineText)}>적용</button>
                    </div>
                  </div>

                {sel.type !== "cover" && sel.type !== "closing" && (
                  <div className="hz-field">
                    <label className="hz-flabel">레이아웃</label>
                    <div className="hz-lay">{LAYOUTS.map((l) => <button key={l.key} className={`hz-laybtn${sel.type === l.key ? " on" : ""}`} onClick={() => changeLayout(selIdx, l.key)}>{l.label}</button>)}</div>
                  </div>
                )}

                {sel.type === "cover" && (<>
                  <div className="hz-field"><label className="hz-flabel">뱃지</label><input className="hz-ei" value={sel.badge} onChange={(e) => upd(selIdx, { badge: e.target.value })} /></div>
                  <div className="hz-field"><label className="hz-flabel">제목</label><textarea className="hz-ei" rows={2} value={sel.title} onChange={(e) => upd(selIdx, { title: e.target.value })} /></div>
                  <div className="hz-field"><label className="hz-flabel">부제</label><textarea className="hz-ei" rows={2} value={sel.subtitle} onChange={(e) => upd(selIdx, { subtitle: e.target.value })} /></div>
                </>)}
                {(sel.type === "text" || sel.type === "photo" || sel.type === "phototop" || sel.type === "split") && (<>
                  <div className="hz-field"><label className="hz-flabel">{sel.type === "split" ? "제목" : "소제목"}</label><textarea className="hz-ei" rows={2} value={sel.title} onChange={(e) => upd(selIdx, { title: e.target.value })} /></div>
                  <div className="hz-field"><label className="hz-flabel">본문</label><textarea className="hz-ei" rows={4} value={sel.text} onChange={(e) => upd(selIdx, { text: e.target.value })} /></div>
                </>)}
                {sel.type === "square" && (<div className="hz-field"><label className="hz-flabel">캡션</label><input className="hz-ei" value={sel.title} onChange={(e) => upd(selIdx, { title: e.target.value })} /></div>)}
                {sel.type === "closing" && (<>
                  <div className="hz-field"><label className="hz-flabel">마무리 제목</label><textarea className="hz-ei" rows={2} value={sel.title} onChange={(e) => upd(selIdx, { title: e.target.value })} /></div>
                  <div className="hz-field"><label className="hz-flabel">마무리 문구</label><textarea className="hz-ei" rows={3} value={sel.text} onChange={(e) => upd(selIdx, { text: e.target.value })} /></div>
                </>)}

                <div className="hz-field">
                  <label className="hz-flabel">이 카드 배경</label>
                  <div className="hz-row">
                    {BGKEYS.map((k) => <button key={k} className={`hz-sw${(sel.bg || bg) === k ? " on" : ""}`} style={{ background: cssBg(k) }} onClick={() => upd(selIdx, { bg: k })} aria-label={BGS[k].name} title={BGS[k].name} />)}
                  </div>
                </div>

                {PHOTON[sel.type] > 0 && (
                  <div className="hz-field">
                    <label className="hz-flabel">사진 위 그림자 (하단)</label>
                    <div className="hz-lay">
                      <button className={`hz-laybtn${sel.scrim ? " on" : ""}`} onClick={() => upd(selIdx, { scrim: true })}>켜기</button>
                      <button className={`hz-laybtn${!sel.scrim ? " on" : ""}`} onClick={() => upd(selIdx, { scrim: false })}>끄기</button>
                    </div>
                    {!sel.photos?.[0] && <div style={{ fontSize: 11, color: "var(--stone)", marginTop: 6 }}>사진을 올리면 그림자가 적용돼요.</div>}
                  </div>
                )}

                <div className="hz-field">
                  <label className="hz-flabel">{sel.type === "cover" ? "제목 색" : "글자 색"}</label>
                  <div className="hz-row">
                    {TEXTPAL.map((c) => <button key={c} className={`hz-sw${(sel.color || "#111111").toUpperCase() === c.toUpperCase() ? " on" : ""}`} style={{ background: c }} onClick={() => upd(selIdx, { color: c })} aria-label={c} />)}
                    <input className="hz-sw-pick" type="color" value={sel.color || "#111111"} onChange={(e) => upd(selIdx, { color: e.target.value })} aria-label="색 직접 선택" style={{ width: 24, height: 24, padding: 0, border: "1px dashed var(--stone)", borderRadius: 999 }} />
                  </div>
                </div>

                <div className="hz-field">
                  <label className="hz-flabel">형광펜 강조색</label>
                  <div className="hz-row">
                    {HLPAL.map((c) => <button key={c} className={`hz-sw${(sel.hl || "#FFE99C").toUpperCase() === c.toUpperCase() ? " on" : ""}`} style={{ background: c }} onClick={() => upd(selIdx, { hl: c })} aria-label={c} />)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--stone)", marginTop: 6, lineHeight: 1.5 }}>제목에서 <b>[[강조할 단어]]</b> 처럼 대괄호로 감싸면 형광펜이 칠해져요.</div>
                </div>

                <div className="hz-field" style={{ marginTop: 18 }}>
                  <label className="hz-flabel">스티커 · 말풍선 (눌러서 붙이고 드래그로 배치)</label>
                  <div className="hz-stickpick">{STICKERS.map((s) => (<button key={s.key} className="hz-stickbtn" onClick={() => addSticker(s)} title={s.text}><img src={stickerURL(s)} alt={s.text} /></button>))}</div>
                </div>

                {selectedSt && (
                  <div className="hz-field" style={{ borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 14 }}>
                    <label className="hz-flabel">선택한 스티커</label>
                    <input className="hz-ei" style={{ marginBottom: 8 }} value={selectedSt.text} onChange={(e) => updSt(selectedSt.id, { text: e.target.value })} />
                    {selectedSt.type !== "text" && (<div className="hz-row" style={{ marginBottom: 8 }}>{FILLS.map((f) => <button key={f} className={`hz-sw${selectedSt.fill === f ? " on" : ""}`} style={{ background: f }} onClick={() => updSt(selectedSt.id, { fill: f })} aria-label={f} />)}</div>)}
                    <button className="hz-btn ghost sm" onClick={() => rmSt(selectedSt.id)}>스티커 삭제</button>
                  </div>
                )}
                </aside>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
