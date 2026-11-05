// 24dday 피그마 프로토타입 만들기 스크립트
// 쓰는 법: html.to.design으로 screens.html을 불러온 직후, 피그마 파일을 연 브라우저의 개발자 콘솔에서 이 파일 내용을 실행.
// 하는 일:
//  1) 불러온 화면 모음(theblueyoung.github.io 로 시작하는 섹션)에서 화면들(지금 28개)을 꺼내
//     "24dday 화면 · 프로토타입" 섹션에 휴대폰 크기(390×844)로 5줄 배치 (같은 이름 섹션이 있으면 지우고 새로 만듦)
//  2) 긴 화면은 위아래 스크롤 + 하단 메뉴 고정
//  3) 버튼 연결(누르면 해당 화면으로 이동), 시작 화면 = 01 랜딩
// 화면이나 버튼이 바뀌면 아래 R(연결 규칙)을 고쳐 주세요.

(async () => {
  const page = figma.currentPage;
  const gal = page.children.find(n => n.type === 'SECTION' && n.name.startsWith('theblueyoung'));
  if (!gal) throw new Error('불러온 화면 모음 섹션이 없어요. 먼저 html.to.design으로 screens.html을 불러오세요.');
  const old = page.children.find(n => n.name === '24dday 화면 · 프로토타입');
  const pos = old ? { x: old.x, y: old.y } : { x: gal.x, y: gal.y };
  if (old) old.remove();

  // 1) 화면 꺼내서 배치
  const root = gal.children[0];
  const secs = root.children.filter(n => n.name === 'Section');
  const ns = figma.createSection();
  ns.name = '24dday 화면 · 프로토타입';
  ns.x = pos.x; ns.y = pos.y;
  const COLS = 5, W = 390, H = 844, GX = 120, GY = 200, PAD = 120;
  secs.forEach((s, i) => {
    const title = s.children.find(c => c.type === 'TEXT').characters;
    const scr = s.children.find(c => c.type !== 'TEXT');
    ns.appendChild(scr);
    scr.name = title;
    scr.x = PAD + (i % COLS) * (W + GX);
    scr.y = PAD + Math.floor(i / COLS) * (H + GY);
    scr.clipsContent = true;
  });
  const rows = Math.ceil(secs.length / COLS);
  ns.resizeWithoutConstraints(PAD * 2 + COLS * W + (COLS - 1) * GX, PAD * 2 + rows * H + (rows - 1) * GY);
  gal.remove();

  // 2) 긴 화면: 스크롤 + 하단 메뉴 고정
  for (const f of ns.children) {
    if (f.height <= H + 1) continue;
    const nav = f.findOne(n => n.name === 'Nav');
    if (nav) { f.appendChild(nav); nav.x = 0; nav.y = H - nav.height; f.numberOfFixedChildren = 1; }
    f.resizeWithoutConstraints(W, H);
    f.overflowDirection = 'VERTICAL';
  }

  // 3) 버튼 연결
  const S = {}; ns.children.forEach(f => S[f.name.split(' ')[0]] = f);  // 화면 번호(예: '05-2')로 찾기
  const T = n => n.type === 'TEXT' ? n.characters : (n.findAll ? n.findAll(x => x.type === 'TEXT').map(x => x.characters).join('/') : '');
  const lab = n => n.name + ' {' + T(n) + '}';
  const allB = f => f.findAll(n => /^(Button|Link)/.test(n.name));
  let count = 0;
  const go = async (n, d, o = {}) => {
    await n.setReactionsAsync([{ trigger: o.trigger || { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: S[d].id, navigation: 'NAVIGATE', transition: o.transition || { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 }, preserveScrollPosition: false, resetVideoPosition: false }] }]);
    count++;
  };
  const has = s => n => lab(n).includes(s);
  const eq = s => n => T(n).trim() === s;
  const NAV = [[eq('홈'), '06'], [eq('일정'), '10'], [eq('자금'), '14'], [eq('서비스'), '16'], [eq('마이'), '20']];
  const HOME = [[has('초대하기'), '09'], [has('알림 목록'), '08'], [has('자세히 보기'), '10'], [n => /^\d단계/.test(T(n)), '10'], [eq('수정'), '21'], ...NAV];
  // 연결 규칙: 화면번호: [[어떤 버튼, 갈 화면], ...]  (위에서부터 먼저 맞는 규칙 적용)
  const R = {
    '01': [],  // 아래에서 따로: 누르면 01-2(집이 굴러가고 체크리스트) → 잠시 뒤 02
    '02': [[has('앞 화면으로'), '01'], [eq('시작하기'), '03']],
    // 회원가입·로그인: 카카오·네이버·Google 은 시연용으로 바로 다음 단계, 이메일은 입력 화면
    '03': [[has('앞 화면으로'), '02'], [has('→ 로그인'), '04'], [n => /카카오로|네이버로|Google/.test(T(n)), '05'], [has('이메일로'), '03-2']],
    '03-2': [[has('앞 화면으로'), '02'], [has('→ 로그인'), '04'], [has('가입하고 이사 등록하기'), '05'], [has('다른 방법'), '03']],
    '04': [[has('앞 화면으로'), '02'], [has('→ 회원가입'), '03'], [n => /카카오로|네이버로|Google/.test(T(n)), '07'], [has('이메일로'), '04-2']],
    '04-2': [[has('앞 화면으로'), '02'], [has('→ 회원가입'), '03'], [has('다른 방법'), '04']],
    // 온보딩: 계약금 '아직이요'(05) ↔ '냈어요'(05-2), 시작하기 → 가입 직후 홈(진행률 0% / 16%)
    '05': [[has('앞 화면으로'), '03'], [has('냈어요'), '05-2'], [eq('시작하기'), '05-3']],
    '05-2': [[has('앞 화면으로'), '03'], [has('아직이요'), '05'], [eq('시작하기'), '05-4']],
    '05-3': HOME,
    '05-4': HOME,
    '06': HOME,
    '07': [[has('할 일 날짜가 다가와요'), '10'], ...HOME],
    '10': [[has('할 일 추가'), '13'], [eq('수정'), '11'], ...NAV],
    '14': [[eq('수정'), '15'], ...NAV],
    // 서비스 탭 5개: 상담 신청 → 019, 업체 등록 문의 → 019-2
    '16': [[eq('상담 신청'), '19'], [has('업체 등록 문의'), '19-2'], ...NAV],
    '17': [[eq('상담 신청'), '19'], [has('업체 등록 문의'), '19-2'], ...NAV],
    '17-2': [[eq('상담 신청'), '19'], [has('업체 등록 문의'), '19-2'], ...NAV],
    '18': [[eq('상담 신청'), '19'], [has('업체 등록 문의'), '19-2'], ...NAV],
    '18-2': [[eq('상담 신청'), '19'], [has('업체 등록 문의'), '19-2'], ...NAV],
    // 마이: 공유자 추가 → 마이페이지 위에 뜨는 공유자 추가 창(020-2)
    '20': [[has('공유자 추가'), '20-2'], [eq('로그아웃'), '25'], ...NAV],
    '19-2': [[has('닫기'), '16'], [n => /^Button/.test(n.name) && T(n).trim().length > 0, '16']],
    '20-2': [[has('닫기'), '20'], [n => /^Button/.test(n.name) && /추가|저장/.test(T(n)), '20']],
    '08': [[has('모두 읽음'), '06'], [has('알림 설정'), '20'], [has('닫기'), '06'], [has('할 일 날짜'), '10'], [has('할 일을 끝냈어요'), '10'], [has('익스프레스'), '17'], [has('법무사사무소'), '16'], [has('참여했어요'), '20']],
    '09': [[has('초대 링크 복사'), '06'], [has('공유자 관리로 가기'), '20'], [has('닫기'), '06']],
    '11': [[has('저장하기'), '10'], [has('삭제하기'), '12'], [has('닫기'), '10']],
    '12': [[has('삭제하기'), '10'], [has('취소'), '11'], [has('닫기'), '10']],
    '13': [[has('추가하기'), '10'], [has('닫기'), '10']],
    '15': [[has('저장하기'), '14'], [has('닫기'), '14']],
    '19': [[has('상담 신청 보내기'), '18'], [has('전화로 문의하기'), '18'], [has('닫기'), '18']],
    '21': [[has('저장하기'), '20'], [has('닫기'), '20']],
    '22': [[has('저장하기'), '20'], [has('회원 탈퇴'), '23'], [has('닫기'), '20']],
    '23': [[has('탈퇴하기'), '01'], [has('취소'), '22'], [has('닫기'), '22']],
    '24': [[has('저장하기'), '20'], [has('공유자 삭제하기'), '20'], [has('닫기'), '20']],
    '25': [[eq('로그아웃'), '04'], [has('취소'), '20'], [has('닫기'), '20']],
  };
  // 창(팝업) 화면은 뒤에 깔린 기본 화면 버튼은 빼고, 창 안의 버튼만 연결
  const BASE = { '08': '06', '09': '06', '11': '10', '12': '10', '13': '10', '15': '14', '19': '18', '19-2': '16', '20-2': '20', '21': '20', '22': '20', '23': '20', '24': '20', '25': '20' };
  for (const k of Object.keys(R)) {
    let B = allB(S[k]);
    if (BASE[k]) B = B.slice(allB(S[BASE[k]]).length);
    if (k === '01') B = B.slice(0, 1);
    for (const n of B) {
      if (/ 완료$/.test(n.name)) continue; // 체크박스는 연결 안 함
      const r = R[k].find(([p]) => p(n));
      if (r && r[1] !== k) await go(n, r[1]);
    }
  }
  // 이메일 로그인 화면: 아래쪽 '로그인' 버튼 → 예시 데이터 홈(알림 배너가 뜬 07)
  { const b = allB(S['04-2']).filter(eq('로그인')); await go(b[b.length - 1], '07'); }
  // 랜딩: 화면을 누르면 01-2로 스마트 애니메이트(집이 굴러가고 체크리스트), 0.9초 뒤 앱 소개(02)
  { const b = allB(S['01'])[0]; await go(b, '01-2', { transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_IN_AND_OUT' }, duration: 0.8 } });
    await go(S['01-2'], '02', { trigger: { type: 'AFTER_TIMEOUT', timeout: 0.9 } }); }
  // 마이페이지 수정 버튼 3개: 프로필, 이사 정보, 공유자
  { const e = allB(S['20']).filter(eq('수정')); await go(e[0], '22'); await go(e[1], '21'); await go(e[2], '24'); }
  // 서비스 탭 5개(법무사/이삿짐/입주청소/인테리어/폐가전)
  for (const k of ['16', '17', '17-2', '18', '18-2']) for (const [t, d] of [['법무사', '16'], ['이삿짐', '17'], ['입주청소', '17-2'], ['인테리어', '18'], ['폐가전', '18-2']]) {
    if (d === k) continue;
    const n = S[k].findOne(x => x.type === 'TEXT' && x.characters === t && /^Tab/.test(x.parent.name));
    if (n) await go(n, d);
  }

  // 4) 누르면 켜짐/꺼짐이 바뀌는 요소 (체크박스, 알림 스위치, 공사 범위 칩, 입력칸 선택 표시)
  //    각 요소를 '켜짐/꺼짐' 두 상태가 있는 컴포넌트로 바꾸고, 누르면 다른 상태로 바뀌게(Change to) 연결
  const oldKit = page.children.find(n => n.name === '24dday 컴포넌트');
  if (oldKit) oldKit.remove();
  const kit = figma.createSection(); kit.name = '24dday 컴포넌트';
  kit.x = ns.x + ns.width + 300; kit.y = ns.y;
  const C = h => ({ r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 });
  const solid = h => [{ type: 'SOLID', color: C(h) }];
  const hexOf = n => { const f = n.fills && n.fills[0]; return f && f.type === 'SOLID' ? [f.color.r, f.color.g, f.color.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') : ''; };
  let kx = 80, ky = 80, rowH = 0, made = 0, swapped = 0;
  const place = n => { if (kx + n.width > 1600) { kx = 80; ky += rowH + 60; rowH = 0; } n.x = kx; n.y = ky; kx += n.width + 60; rowH = Math.max(rowH, n.height); };
  async function makeSet(src, name, style) {
    const on = src.clone(), off = src.clone();
    kit.appendChild(on); kit.appendChild(off);
    style(on, true); style(off, false);
    const cOn = figma.createComponentFromNode(on), cOff = figma.createComponentFromNode(off);
    cOn.name = '상태=켜짐'; cOff.name = '상태=꺼짐';
    const set = figma.combineAsVariants([cOn, cOff], kit); set.name = name; set.layoutMode = 'HORIZONTAL'; set.itemSpacing = 16;
    set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 16; set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO';
    place(set);
    const tr = { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.15 };
    await cOn.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: cOff.id, navigation: 'CHANGE_TO', transition: tr }] }]);
    await cOff.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: cOn.id, navigation: 'CHANGE_TO', transition: tr }] }]);
    made++;
    return { on: cOn, off: cOff };
  }
  function swap(node, set, isOn) {
    const inst = (isOn ? set.on : set.off).createInstance();
    const parent = node.parent, i = parent.children.indexOf(node);
    parent.insertChild(i, inst); inst.x = node.x; inst.y = node.y; inst.name = node.name;
    node.remove(); swapped++;
  }
  const cbStyle = (n, on) => { n.fills = solid(on ? '7a4dff' : 'ffffff'); n.strokes = solid(on ? '7a4dff' : 'b0b8c1'); const v = n.findOne(x => x.type === 'VECTOR'); if (v) { v.strokes = on ? solid('ffffff') : []; v.strokeWeight = 1.5; } };
  const swStyle = (n, on) => { n.fills = solid(on ? '7a4dff' : 'd1d6db'); const k = n.children[0]; if (k) k.x = on ? n.width - k.width - 3 : 3; };
  const chipStyle = (n, on) => { n.fills = solid(on ? '7a4dff' : 'f2f4f6'); n.findAll(x => x.type === 'TEXT').forEach(x => x.fills = solid(on ? 'ffffff' : '4e5968')); };
  const inStyle = (n, on) => { n.strokes = on ? solid('7a4dff') : []; n.strokeWeight = 2; n.strokeAlign = 'INSIDE'; };
  // 체크박스(할 일 완료, 알림 종류) — 하나의 컴포넌트를 모든 화면에서 같이 씀
  const allCb = ns.findAll(n => n.type === 'FRAME' && n.width < 30 && n.height < 30 && /^Button - /.test(n.name) && n.strokes && n.strokes.length && n.findOne(x => x.type === 'VECTOR'));
  if (allCb.length) { const set = await makeSet(allCb[0], '체크박스', cbStyle); for (const n of allCb) swap(n, set, hexOf(n) === '7a4dff'); }
  // 알림 받기 스위치
  const allSw = ns.findAll(n => n.type === 'FRAME' && /^Switch - /.test(n.name));
  if (allSw.length) { const set = await makeSet(allSw[0], '스위치', swStyle); for (const n of allSw) swap(n, set, hexOf(n) === '7a4dff'); }
  // 인테리어 공사 범위 칩 — 글자마다 컴포넌트 하나
  const chipSets = {};
  for (const k of ['18', '19']) {
    if (!S[k]) continue;
    const chips = S[k].findAll(n => n.type === 'FRAME' && n.name === 'Button' && n.children.length === 1 && n.children[0].type === 'TEXT' && n.height < 45 && ['f2f4f6', '7a4dff'].includes(hexOf(n)));
    for (const n of chips) { const label = n.children[0].characters; if (!chipSets[label]) chipSets[label] = await makeSet(n, '칩 · ' + label, chipStyle); swap(n, chipSets[label], hexOf(n) === '7a4dff'); }
  }
  // 입력칸: 누르면 보라 테두리로 선택된 것처럼 보이게 (피그마 미리보기에서는 글자 입력은 안 됨)
  for (const k of ['14', '16', '17', '17-2', '18', '18-2']) {
    if (!S[k]) continue;
    const inputs = S[k].findAll(n => n.type === 'FRAME' && /^(Input|Select|Combobox|Date)/i.test(n.name));
    for (const n of inputs) { const set = await makeSet(n, '입력칸 · ' + k + ' · ' + (n.findAll(x => x.type === 'TEXT').map(x => x.characters).join('').slice(0, 12) || n.name), inStyle); swap(n, set, false); }
  }
  kit.resizeWithoutConstraints(1700, ky + rowH + 120);
  console.log('누르면 바뀌는 요소: 컴포넌트 ' + made + '개, 바꾼 요소 ' + swapped + '개');

  page.flowStartingPoints = [{ nodeId: S['01'].id, name: '24dday 앱' }];
  console.log('연결 ' + count + '개 완료');
})();
