// 24dday 피그마 프로토타입 만들기 스크립트 (피그마 무료 요금제용)
// 쓰는 법: html.to.design으로 screens.html을 불러온 직후, 피그마 파일을 연 브라우저의 개발자 콘솔에서 이 파일 내용을 실행.
// 하는 일:
//  1) 불러온 화면 모음(theblueyoung.github.io 로 시작하는 섹션)에서 화면을 꺼내 "24dday 화면 · 프로토타입" 섹션에 휴대폰 크기로 배치
//     긴 화면은 위아래 스크롤 + 하단 메뉴 고정
//  2) 단계별 복사본: 자금·서비스·마이 화면을 단계(1·3·4·5)마다 복사 → 하단 메뉴가 항상 지금 단계의 홈·일정으로 돌아가게
//     잔금 단계(할 일 10개)는 5개씩 두 묶음이라 '앞 묶음 끝남(3A)'·'뒤 묶음 끝남(3B)' 화면도 복사
//  3) 버튼 연결. 창(팝업) 화면은 겹쳐 뜨는 창(Overlay)으로 열고, 닫기·저장은 창 닫기
//  4) 단계 체크리스트: 홈 '지금 챙길 일'·일정의 지금 단계 할 일을 '어떤 순서로 체크해도 기억하는' 컴포넌트로 만들고,
//     마지막 하나를 체크하면 단계 완료 알림 → 다음 단계 화면으로 이동
//  5) 그 밖의 체크박스·알림 스위치·공사 범위 칩·입력칸: 누르면 켜짐/꺼짐
// 피그마 무료 요금제는 '변수 바꾸기·조건' 기능이 없어서, 단계 중간에 체크한 것은 다른 화면으로 옮겨 가면 기억되지 않아요.
// 화면이나 버튼이 바뀌면 아래 연결 규칙(R)과 단계 정보(STAGE)를 고쳐 주세요.

(async () => {
  // 한 번에 다 하려면 그냥 실행. 오래 걸리면 나눠서: window.PROTO_STEP = 'layout' → 'check:06-1' … 'check:10-4' → 'toggles'
  const STEP = (typeof window !== 'undefined' && window.PROTO_STEP) || 'all';
  const doLayout = STEP === 'all' || STEP === 'layout';
  const page = figma.currentPage;
  const W = 390, H = 844, GX = 120, GY = 200, PAD = 120, COLS = 5;
  const log = [];
  let ns, ns2; const S = {};
  if (doLayout) {
  const gal = page.children.find(n => n.type === 'SECTION' && n.name.startsWith('theblueyoung'));
  if (!gal) throw new Error('불러온 화면 모음 섹션이 없어요. 먼저 html.to.design으로 screens.html을 불러오세요.');
  const old = page.children.find(n => n.name === '24dday 화면 · 프로토타입');
  const pos = old ? { x: old.x, y: old.y } : { x: gal.x, y: gal.y };
  for (const nm of ['24dday 화면 · 프로토타입', '24dday 화면 · 단계별 복사본', '24dday 컴포넌트']) { const x = page.children.find(c => c.name === nm); if (x) x.remove(); }

  // ---------- 1) 화면 꺼내서 배치 ----------
  const root = gal.children[0];
  const secs = root.children.filter(n => n.name === 'Section');
  ns = figma.createSection(); ns.name = '24dday 화면 · 프로토타입'; ns.x = pos.x; ns.y = pos.y;
  secs.forEach((s, i) => {
    const title = s.children.find(c => c.type === 'TEXT').characters;
    const scr = s.children.find(c => c.type !== 'TEXT');
    ns.appendChild(scr); scr.name = title;
    scr.x = PAD + (i % COLS) * (W + GX); scr.y = PAD + Math.floor(i / COLS) * (H + GY); scr.clipsContent = true;
  });
  const nrows = Math.ceil(secs.length / COLS);
  ns.resizeWithoutConstraints(PAD * 2 + COLS * W + (COLS - 1) * GX, PAD * 2 + nrows * H + (nrows - 1) * GY);
  gal.remove();
  for (const f of ns.children) {
    if (f.height <= H + 1) continue;
    const nav = f.findOne(n => n.name === 'Nav');
    if (nav) { f.appendChild(nav); nav.x = 0; nav.y = H - nav.height; f.numberOfFixedChildren = 1; }
    f.resizeWithoutConstraints(W, H); f.overflowDirection = 'VERTICAL';
  }
  ns.children.forEach(f => S[f.name.split(' ')[0]] = f);
  }

  // ---------- 2) 단계별 복사본 ----------
  const HM = { 1: '06-1', 2: '06', 3: '06-3', 4: '06-4', 5: '06-5' };       // 단계별 홈
  const TM = { 1: '10-1', 2: '10', 3: '10-3', 4: '10-4', 5: '10-5' };       // 단계별 일정
  const TABS = ['14', '16', '17', '17-2', '18', '18-2', '20'];               // 단계마다 복사할 탭 화면
  const tab = (s, k) => s === 2 ? k : `${k}@${s}`;
  if (!doLayout) {
    ns = page.children.find(n => n.name === '24dday 화면 · 프로토타입'); ns2 = page.children.find(n => n.name === '24dday 화면 · 단계별 복사본');
    [...ns.children, ...ns2.children].forEach(f => S[f.name.split(' ')[0]] = f);
  }
  if (doLayout) {
  ns2 = figma.createSection(); ns2.name = '24dday 화면 · 단계별 복사본';
  ns2.x = ns.x; ns2.y = ns.y + ns.height + 400;
  let ci = 0;
  const cloneTo = (srcKey, newKey, label) => {
    const c = S[srcKey].clone(); ns2.appendChild(c);
    c.name = newKey + ' ' + S[srcKey].name.slice(srcKey.length + 1) + ' · ' + label;
    c.x = PAD + (ci % 7) * (W + GX); c.y = PAD + Math.floor(ci / 7) * (H + GY); ci++;
    S[newKey] = c;
  };
  for (const s of [1, 3, 4, 5]) for (const k of TABS) cloneTo(k, tab(s, k), s + '단계용');
  cloneTo('06-3', '06-3A', '앞 5개 끝남'); cloneTo('06-3', '06-3B', '뒤 5개 끝남');
  cloneTo('10-3', '10-3A', '앞 5개 끝남'); cloneTo('10-3', '10-3B', '뒤 5개 끝남');
  const crows = Math.ceil(ci / 7);
  ns2.resizeWithoutConstraints(PAD * 2 + 7 * W + 6 * GX, PAD * 2 + crows * H + (crows - 1) * GY);

  // ---------- 3) 버튼 연결 ----------
  const T = n => n.type === 'TEXT' ? n.characters : (n.findAll ? n.findAll(x => x.type === 'TEXT').map(x => x.characters).join('/') : '');
  const lab = n => n.name + ' {' + T(n) + '}';
  const allB = f => f.findAll(n => /^(Button|Link)/.test(n.name));
  const has = s => n => lab(n).includes(s);
  const eq = s => n => T(n).trim() === s;
  const POP = new Set(['08', '09', '11', '12', '13', '15', '19', '19-2', '20-2', '21', '22', '23', '24', '25']); // 겹쳐 뜨는 창
  const DIS = { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 };
  const UP = { type: 'MOVE_IN', direction: 'TOP', matchLayers: false, easing: { type: 'EASE_OUT' }, duration: 0.25 };
  let count = 0;
  const actionFor = (from, d, o = {}) => {
    if (d === 'CLOSE') return { type: 'CLOSE' };
    if (d === 'BACK') return { type: 'BACK' };
    const nav = POP.has(d) ? (POP.has(from) ? 'SWAP' : 'OVERLAY') : 'NAVIGATE';
    return { type: 'NODE', destinationId: S[d].id, navigation: nav, transition: o.transition || (nav === 'NAVIGATE' ? DIS : UP), preserveScrollPosition: false, resetVideoPosition: false };
  };
  const go = async (n, from, d, o = {}) => { await n.setReactionsAsync([{ trigger: o.trigger || { type: 'ON_CLICK' }, actions: [actionFor(from, d, o)] }]); count++; };
  const NAV = s => [[eq('홈'), HM[s]], [eq('일정'), TM[s]], [eq('자금'), tab(s, '14')], [eq('서비스'), tab(s, '16')], [eq('마이'), tab(s, '20')]];
  const HOME = s => [[has('초대하기'), '09'], [has('알림 목록'), '08'], [has('자세히 보기'), TM[s]], [n => /^\d단계/.test(T(n)), TM[s]], [eq('수정'), '21'], ...NAV(s)];
  const SCHED = s => [[has('할 일 추가'), '13'], [eq('수정'), '11'], ...NAV(s)];
  const SVC = s => [[eq('상담 신청'), '19'], [has('업체 등록 문의'), '19-2'], ...NAV(s)];
  const SOC = n => /카카오로|네이버로|Google/.test(T(n));
  const R = {
    '01': [],  // 아래에서 따로: 누르면 01-2(집이 굴러가고 체크리스트) → 잠시 뒤 02
    '02': [[has('앞 화면으로'), '01'], [eq('시작하기'), '03']],
    '03': [[has('앞 화면으로'), '02'], [has('→ 로그인'), '04'], [SOC, '05'], [has('이메일로'), '03-2']],
    '03-2': [[has('앞 화면으로'), '02'], [has('→ 로그인'), '04'], [has('가입하고 이사 등록하기'), '05'], [has('다른 방법'), '03']],
    '04': [[has('앞 화면으로'), '02'], [has('→ 회원가입'), '03'], [SOC, '07'], [has('이메일로'), '04-2']],
    '04-2': [[has('앞 화면으로'), '02'], [has('→ 회원가입'), '03'], [has('다른 방법'), '04']],
    // 온보딩: 계약금 '아직이요' → 1단계 홈(진행률 0%), '냈어요' → 2단계 홈(16%)
    '05': [[has('앞 화면으로'), '03'], [has('냈어요'), '05-2'], [eq('시작하기'), '06-1']],
    '05-2': [[has('앞 화면으로'), '03'], [has('아직이요'), '05'], [eq('시작하기'), '06']],
    '07': [[has('할 일 날짜가 다가와요'), '10'], ...HOME(2)],
    '08': [[has('모두 읽음'), 'CLOSE'], [has('알림 설정'), '20'], [has('닫기'), 'CLOSE'], [has('할 일 날짜'), '10'], [has('할 일을 끝냈어요'), '10'], [has('익스프레스'), '17'], [has('법무사사무소'), '16'], [has('참여했어요'), '20']],
    '09': [[has('초대 링크 복사'), 'CLOSE'], [has('공유자 관리로 가기'), '20'], [has('닫기'), 'CLOSE']],
    '11': [[has('저장하기'), 'CLOSE'], [has('삭제하기'), '12'], [has('닫기'), 'CLOSE']],
    '12': [[has('삭제하기'), 'CLOSE'], [has('취소'), '11'], [has('닫기'), 'CLOSE']],
    '13': [[has('추가하기'), 'CLOSE'], [has('닫기'), 'CLOSE']],
    '15': [[has('저장하기'), 'CLOSE'], [has('닫기'), 'CLOSE']],
    '19': [[has('상담 신청 보내기'), 'CLOSE'], [has('전화로 문의하기'), 'CLOSE'], [has('닫기'), 'CLOSE']],
    '19-2': [[has('닫기'), 'CLOSE'], [n => /^Button/.test(n.name) && T(n).trim().length > 0, 'CLOSE']],
    '20-2': [[has('닫기'), 'CLOSE'], [n => /^Button/.test(n.name) && /추가|저장/.test(T(n)), 'CLOSE']],
    '21': [[has('저장하기'), 'CLOSE'], [has('닫기'), 'CLOSE']],
    '22': [[has('저장하기'), 'CLOSE'], [has('회원 탈퇴'), '23'], [has('닫기'), 'CLOSE']],
    '23': [[has('탈퇴하기'), '01'], [has('취소'), '22'], [has('닫기'), 'CLOSE']],
    '24': [[has('저장하기'), 'CLOSE'], [has('공유자 삭제하기'), 'CLOSE'], [has('닫기'), 'CLOSE']],
    '25': [[eq('로그아웃'), '04'], [has('취소'), 'CLOSE'], [has('닫기'), 'CLOSE']],
  };
  for (const s of [1, 2, 3, 4, 5]) {
    R[HM[s]] = HOME(s); R[TM[s]] = SCHED(s);
    R[tab(s, '14')] = [[eq('수정'), '15'], ...NAV(s)];
    for (const k of ['16', '17', '17-2', '18', '18-2']) R[tab(s, k)] = SVC(s);
    R[tab(s, '20')] = [[has('공유자 추가'), '20-2'], [eq('로그아웃'), '25'], ...NAV(s)];
  }
  R['06-3A'] = R['06-3B'] = HOME(3); R['10-3A'] = R['10-3B'] = SCHED(3);
  for (const k of [2, 3, 4, 5]) R[`06-${k}b`] = HOME(k);   // 단계 완료 알림 화면
  // 창 화면은 뒤에 깔린 화면의 버튼은 빼고, 창 안의 버튼만 연결
  const BASE = { '08': '06', '09': '06', '11': '10', '12': '10', '13': '10', '15': '14', '19': '18', '19-2': '16', '20-2': '20', '21': '20', '22': '20', '23': '20', '24': '20', '25': '20' };
  for (const k of Object.keys(R)) {
    if (!S[k]) { log.push('화면 없음: ' + k); continue; }
    let B = allB(S[k]);
    if (BASE[k]) B = B.slice(allB(S[BASE[k]]).length);
    for (const n of B) {
      if (/ 완료$/.test(n.name)) continue; // 체크박스는 4)·5)에서
      const r = R[k].find(([p]) => p(n));
      if (r && r[1] !== k) await go(n, k, r[1]);
    }
  }
  { const b = allB(S['04-2']).filter(eq('로그인')); await go(b[b.length - 1], '04-2', '07'); }   // 이메일 로그인 → 예시 데이터 홈(알림 배너)
  for (const s of [1, 2, 3, 4, 5]) { const e = allB(S[tab(s, '20')]).filter(eq('수정')); await go(e[0], tab(s, '20'), '22'); await go(e[1], tab(s, '20'), '21'); await go(e[2], tab(s, '20'), '24'); }
  const SV = [['법무사', '16'], ['이삿짐', '17'], ['입주청소', '17-2'], ['인테리어', '18'], ['폐가전', '18-2']];
  for (const s of [1, 2, 3, 4, 5]) for (const [, k] of SV) for (const [t, d] of SV) {
    if (d === k) continue;
    const n = S[tab(s, k)].findOne(x => x.type === 'TEXT' && x.characters === t && /^Tab/.test(x.parent.name));
    if (n) await go(n, tab(s, k), tab(s, d));
  }
  // 랜딩: 누르면 01-2로 스마트 애니메이트(집이 굴러가고 체크리스트), 0.9초 뒤 앱 소개
  { const btn = S['01-2'].children[0] && S['01-2'].children[0].children[0];
    const svg = btn && btn.children.find(c => c.type === 'FRAME' && c.name === 'SVG');
    if (svg) { svg.rotation = -175; svg.opacity = 0.25; svg.x = 360; svg.y = 70; }
    await go(allB(S['01'])[0], '01', '01-2', { transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_IN_AND_OUT' }, duration: 0.8 } });
    await go(S['01-2'], '01-2', '02', { trigger: { type: 'AFTER_TIMEOUT', timeout: 0.9 } }); }
  // 알림 배너 화면(07)은 3초 뒤 배너가 사라진 홈으로, 단계 완료 알림은 2초 뒤 다음 단계 홈으로
  await go(S['07'], '07', '06', { trigger: { type: 'AFTER_TIMEOUT', timeout: 3 }, transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.4 } });
  for (const k of [2, 3, 4, 5]) await go(S[`06-${k}b`], `06-${k}b`, HM[k], { trigger: { type: 'AFTER_TIMEOUT', timeout: 2 }, transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.4 } });
  log.push('화면 이동 연결 ' + count + '개');
  }

  // ---------- 4) 단계 체크리스트 (순서 상관없이 체크, 다 하면 다음 단계) ----------
  let kit = page.children.find(n => n.name === '24dday 컴포넌트');
  if (!kit) { kit = figma.createSection(); kit.name = '24dday 컴포넌트'; kit.x = ns.x + ns.width + 300; kit.y = ns.y; kit.resizeWithoutConstraints(4100, 400); }
  let kx = 80, ky = kit.children.length ? Math.max(...kit.children.map(c => c.y + c.height)) + 120 : 80, rowH = 0, made = 0, variants = 0, swapped = 0;
  const place = n => { if (kx + n.width > 4000) { kx = 80; ky += rowH + 80; rowH = 0; } n.x = kx; n.y = ky; kx += n.width + 80; rowH = Math.max(rowH, n.height); };
  const C = h => ({ r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 });
  const solid = h => [{ type: 'SOLID', color: C(h) }];
  const hexOf = n => { const f = n.fills && n.fills[0]; return f && f.type === 'SOLID' ? [f.color.r, f.color.g, f.color.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') : ''; };
  const loadFonts = async t => { for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f); };
  const isCb = n => (n.type === 'FRAME' || n.type === 'INSTANCE') && n.width < 30 && n.height < 30 && / 완료$/.test(n.name);
  const cbStyle = (n, on) => { n.fills = solid(on ? '7a4dff' : 'ffffff'); n.strokes = solid(on ? '7a4dff' : 'b0b8c1'); const v = n.findOne(x => x.type === 'VECTOR'); if (v) { v.strokes = on ? solid('ffffff') : []; v.strokeWeight = 1.5; } };
  // 섹션 안 할 일 줄 묶기: 체크박스 + 같은 줄의 이름·날짜·담당자·수정 버튼
  const rowsIn = F => {
    const cbs = F.children.filter(isCb).sort((a, b) => a.y - b.y);
    return cbs.map((cb, i) => {
      const top = cb.y - 10, bot = i + 1 < cbs.length ? cbs[i + 1].y - 10 : cb.y + 52;
      const nodes = F.children.filter(c => c.y >= top && c.y < bot);
      const texts = nodes.filter(c => c.type === 'TEXT').sort((a, b) => a.y - b.y);
      const edit = nodes.find(c => c.type !== 'TEXT' && c !== cb && /^Button/.test(c.name));
      const badges = nodes.filter(c => c !== cb && c !== edit && c.type !== 'TEXT');
      const right = Math.min(...[edit, ...badges].filter(Boolean).map(c => c.x), F.width - 20);
      return { cb, nodes, title: texts[0], date: texts[1], top, bot, hitW: right - 8 };
    });
  };
  const counterOf = F => F.children.find(c => c.type === 'TEXT' && /^\d+\/\d+$/.test(c.characters.trim()));
  // 줄 하나를 '완료' 모양으로: 체크박스 보라, 이름 회색 취소선, 날짜 → 완료
  const markDone = async (row, on) => {
    cbStyle(row.cb, on);
    if (row.title && on) { await loadFonts(row.title); row.title.fills = solid('b0b8c1'); row.title.textDecoration = 'STRIKETHROUGH'; }
    if (row.date && on) { await loadFonts(row.date); row.date.characters = row.date.characters.replace(/·.*$/, '· 완료'); }
  };
  // F: 할 일 섹션, plan: [{ rows:[시작,끝], target: 다 체크하면 갈 화면 | 'static'(이미 다 끝난 묶음) }]
  async function makeChecklist(screenKey, F, plan) {
    const rows = rowsIn(F); const cnt = counterOf(F);
    const total = cnt ? cnt.characters.split('/')[1] : String(rows.length);
    let doneBefore = 0;
    for (const c of plan) if (c.target === 'static') { for (let i = c.rows[0]; i <= c.rows[1]; i++) await markDone(rows[i], true); doneBefore += c.rows[1] - c.rows[0] + 1; }
    if (cnt && doneBefore) { await loadFonts(cnt); cnt.characters = doneBefore + '/' + total; }
    const live = plan.filter(c => c.target !== 'static');
    for (const [ci2, c] of live.entries()) {
      const idx = []; for (let i = c.rows[0]; i <= c.rows[1]; i++) idx.push(i);
      const first = plan.indexOf(c) === 0;
      const top = first ? 0 : rows[idx[0]].top - 4;
      const lastRow = rows[idx[idx.length - 1]];
      const nextChunk = plan[plan.indexOf(c) + 1];
      const bot = nextChunk ? rows[nextChunk.rows[0]].top - 4 : F.height;
      // 이 묶음만 남긴 복사본 = 컴포넌트 바탕
      const base = F.clone(); kit.appendChild(base);
      const keep = new Set(); idx.forEach(i => rows[i].nodes.forEach(n => keep.add(F.children.indexOf(n))));
      if (first) F.children.forEach((n, j) => { if (n.y < rows[0].top) keep.add(j); });
      [...base.children].forEach((n, j) => { if (!keep.has(j)) n.remove(); });
      base.children.forEach(n => n.y -= top);
      base.resizeWithoutConstraints(F.width, bot - top);
      base.name = '바탕';
      const bRows = rowsIn(base); const bCnt = first ? counterOf(base) : null;
      const m = idx.length, full = (1 << m) - 1;
      const comps = [];
      for (let mask = 0; mask <= full; mask++) {
        const v = mask === full ? base : base.clone(); if (v !== base) kit.appendChild(v);
        const vr = rowsIn(v);
        for (let i = 0; i < m; i++) if (mask & (1 << i)) await markDone(vr[i], true);
        if (bCnt) { const vc = counterOf(v); await loadFonts(vc); vc.characters = (doneBefore + popc(mask)) + '/' + total; }
        vr.forEach((r, i) => { const h = figma.createRectangle(); h.name = 'hit-' + i; h.fills = [{ type: 'SOLID', color: C('ffffff'), opacity: 0 }]; v.appendChild(h); h.x = 0; h.y = r.top; h.resizeWithoutConstraints(Math.max(r.hitW, 40), r.bot - r.top); });
        const comp = figma.createComponentFromNode(v);
        comp.name = '체크=' + [...Array(m)].map((_, i) => (mask & (1 << i)) ? '1' : '0').join('');
        comps.push(comp);
      }
      const set = figma.combineAsVariants(comps, kit);
      set.name = `${screenKey} · 체크리스트 ${ci2 + 1}`; set.layoutMode = 'HORIZONTAL'; set.layoutWrap = 'WRAP'; set.itemSpacing = 24; set.counterAxisSpacing = 24;
      set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24; set.primaryAxisSizingMode = 'FIXED'; set.resizeWithoutConstraints(Math.min(4 * (F.width + 24) + 24, (full + 1) * (F.width + 24) + 24), 100); set.counterAxisSizingMode = 'AUTO';
      place(set);
      const tr = { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 };
      for (let mask = 0; mask <= full; mask++) for (let i = 0; i < m; i++) {
        const nm = mask ^ (1 << i); const hit = comps[mask].findOne(n => n.name === 'hit-' + i);
        const action = (nm === full && c.target) ? { type: 'NODE', destinationId: S[c.target].id, navigation: 'NAVIGATE', transition: { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false, resetVideoPosition: false }
          : { type: 'NODE', destinationId: comps[nm].id, navigation: 'CHANGE_TO', transition: tr };
        await hit.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [action] }]);
      }
      // 원래 줄(과 머리말)을 지우고 그 자리에 컴포넌트 넣기
      idx.forEach(i => rows[i].nodes.forEach(n => n.remove()));
      if (first) [...F.children].filter(n => n.y < rows[0].top).forEach(n => n.remove());
      const inst = comps[0].createInstance(); F.appendChild(inst); inst.x = 0; inst.y = top;
      made++; variants += full + 1;
    }
  }
  const popc = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
  const homeSec = f => { const t = f.findOne(n => n.type === 'TEXT' && n.characters === '지금 챙길 일'); let p = t; while (p && !(p.children && p.children.some(isCb))) p = p.parent; return p; };
  const schedSec = (f, s) => f.findAll(n => n.type === 'FRAME' && n.children && n.children.some(isCb)).find(F => F.findOne(t => t.type === 'TEXT' && t.characters.startsWith(s + '단계')));
  const STAGE = { 1: 4, 2: 5, 3: 10, 4: 6 };   // 단계별 할 일 수
  const all = s => [[0, STAGE[s] - 1]];
  const PLAN = [
    ['06-1', homeSec, [{ rows: [0, 3], target: '06-2b' }]],
    ['06', homeSec, [{ rows: [0, 4], target: '06-3b' }]],
    ['06-3', homeSec, [{ rows: [0, 4], target: '06-3A' }, { rows: [5, 9], target: '06-3B' }]],
    ['06-3A', homeSec, [{ rows: [0, 4], target: 'static' }, { rows: [5, 9], target: '06-4b' }]],
    ['06-3B', homeSec, [{ rows: [0, 4], target: '06-4b' }, { rows: [5, 9], target: 'static' }]],
    ['06-4', homeSec, [{ rows: [0, 5], target: '06-5b' }]],
    ['10-1', f => schedSec(f, 1), [{ rows: [0, 3], target: '10' }]],
    ['10', f => schedSec(f, 2), [{ rows: [0, 4], target: '10-3' }]],
    ['10-3', f => schedSec(f, 3), [{ rows: [0, 4], target: '10-3A' }, { rows: [5, 9], target: '10-3B' }]],
    ['10-3A', f => schedSec(f, 3), [{ rows: [0, 4], target: 'static' }, { rows: [5, 9], target: '10-4' }]],
    ['10-3B', f => schedSec(f, 3), [{ rows: [0, 4], target: '10-4' }, { rows: [5, 9], target: 'static' }]],
    ['10-4', f => schedSec(f, 4), [{ rows: [0, 5], target: '10-5' }]],
  ];
  for (const [k, find, plan] of PLAN) {
    if (!(STEP === 'all' || STEP === 'check:' + k)) continue;
    const F = find(S[k]); if (!F) { log.push('체크리스트 섹션 못 찾음: ' + k); continue; }
    const n = rowsIn(F).length, need = plan[plan.length - 1].rows[1] + 1;
    if (n !== need) { log.push(`줄 수 다름 ${k}: ${n}개 (예상 ${need})`); continue; }
    await makeChecklist(k, F, plan);
  }
  log.push(`단계 체크리스트 ${made}개 (상태 ${variants}가지)`);

  // ---------- 5) 그 밖에 누르면 켜짐/꺼짐 ----------
  const doToggles = STEP === 'all' || STEP === 'toggles';
  const inInstance = n => { let p = n.parent; while (p && p.type !== 'PAGE') { if (p.type === 'INSTANCE') return true; p = p.parent; } return false; };
  async function makeSet(src, name, style) {
    const on = src.clone(), off = src.clone(); kit.appendChild(on); kit.appendChild(off);
    style(on, true); style(off, false);
    const cOn = figma.createComponentFromNode(on), cOff = figma.createComponentFromNode(off);
    cOn.name = '상태=켜짐'; cOff.name = '상태=꺼짐';
    const set = figma.combineAsVariants([cOn, cOff], kit); set.name = name; set.layoutMode = 'HORIZONTAL'; set.itemSpacing = 16;
    set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 16; set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO';
    place(set);
    const tr = { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 };
    await cOn.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: cOff.id, navigation: 'CHANGE_TO', transition: tr }] }]);
    await cOff.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: cOn.id, navigation: 'CHANGE_TO', transition: tr }] }]);
    return { on: cOn, off: cOff };
  }
  function swap(node, set, isOn) {
    const inst = (isOn ? set.on : set.off).createInstance();
    const parent = node.parent, i = parent.children.indexOf(node);
    parent.insertChild(i, inst); inst.x = node.x; inst.y = node.y; inst.name = node.name;
    node.remove(); swapped++;
  }
  const swStyle = (n, on) => { n.fills = solid(on ? '7a4dff' : 'd1d6db'); const k = n.children[0]; if (k) k.x = on ? n.width - k.width - 3 : 3; };
  const chipStyle = (n, on) => { n.fills = solid(on ? '7a4dff' : 'f2f4f6'); n.findAll(x => x.type === 'TEXT').forEach(x => x.fills = solid(on ? 'ffffff' : '4e5968')); };
  const inStyle = (n, on) => { n.strokes = on ? solid('7a4dff') : []; n.strokeWeight = 2; n.strokeAlign = 'INSIDE'; };
  const keysOf = (...ks) => ks.flat().filter(k => S[k]);
  const S5 = [1, 2, 3, 4, 5];
  // 체크박스: 일정의 다른 단계 할 일, 모두 완료 화면, 마이페이지 알림 종류
  const cbScreens = keysOf(S5.map(s => TM[s]), '10-3A', '10-3B', '06-5', S5.map(s => tab(s, '20')));
  const cbs = !doToggles ? [] : cbScreens.flatMap(k => S[k].findAll(n => n.type === 'FRAME' && n.width < 30 && n.height < 30 && /^Button - /.test(n.name) && n.strokes && n.strokes.length && n.findOne(x => x.type === 'VECTOR') && !inInstance(n)));
  if (cbs.length) { const set = await makeSet(cbs[0], '체크박스', cbStyle); for (const n of cbs) swap(n, set, hexOf(n) === '7a4dff'); }
  const sws = !doToggles ? [] : keysOf(S5.map(s => tab(s, '20'))).flatMap(k => S[k].findAll(n => n.type === 'FRAME' && /^Switch - /.test(n.name)));
  if (sws.length) { const set = await makeSet(sws[0], '스위치', swStyle); for (const n of sws) swap(n, set, hexOf(n) === '7a4dff'); }
  const chipSets = {};
  for (const k of doToggles ? keysOf(S5.map(s => tab(s, '18'))) : []) {
    const chips = S[k].findAll(n => n.type === 'FRAME' && n.name === 'Button' && n.children.length === 1 && n.children[0].type === 'TEXT' && n.height < 45 && ['f2f4f6', '7a4dff'].includes(hexOf(n)));
    for (const n of chips) { const l = n.children[0].characters; if (!chipSets[l]) chipSets[l] = await makeSet(n, '칩 · ' + l, chipStyle); swap(n, chipSets[l], hexOf(n) === '7a4dff'); }
  }
  const inSets = {};
  for (const s of doToggles ? S5 : []) for (const k0 of ['14', '16', '17', '17-2', '18', '18-2']) {
    const k = tab(s, k0); if (!S[k]) continue;
    const inputs = S[k].findAll(n => n.type === 'FRAME' && /^(Input|Select|Combobox|Date)/i.test(n.name));
    for (const [j, n] of inputs.entries()) { const key = k0 + '#' + j; if (!inSets[key]) inSets[key] = await makeSet(n, '입력칸 · ' + k0 + ' · ' + (j + 1), inStyle); swap(n, inSets[key], false); }
  }
  kit.resizeWithoutConstraints(4100, Math.max(kit.height, ky + rowH + 200));
  log.push('켜짐/꺼짐 요소 ' + swapped + '개');

  if (doLayout || doToggles) page.flowStartingPoints = [{ nodeId: S['01'].id, name: '24dday 앱' }];
  log.push('시작 화면 id ' + S['01'].id);
  console.log(log.join('\n'));
})();
