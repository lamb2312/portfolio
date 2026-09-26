/* ============================================================
   らんびー Portfolio — script.js
============================================================ */
'use strict';

// ============================================================
// 1. 画像保護 (右クリック・ドラッグ禁止)
// ============================================================
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});

// ============================================================
// 2. ヘッダー: スクロールで透明→磨りガラス
// ============================================================
const header = document.getElementById('header');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ============================================================
// 3. ハンバーガーメニュー
// ============================================================
const hamburger = document.getElementById('hamburger');
const nav       = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  nav.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
// ナビリンクをクリックでメニューを閉じる
nav.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    nav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// ============================================================
// 4. Gallery タブ切替
// ============================================================
const tabBtns     = document.querySelectorAll('.tab-btn');
const galleryGrid = document.getElementById('gallery-grid');
const galleryStatus = document.getElementById('gallery-status');
const worksNote = document.getElementById('works-note');
let selectedTab = 'all';

function filterGallery() {
  galleryGrid.querySelectorAll('.gallery-item').forEach(item => {
    item.hidden = selectedTab !== 'all' && item.dataset.tab !== selectedTab;
  });
  worksNote.hidden = selectedTab === 'personal' || !galleryGrid.children.length;
  triggerRevealForVisible();
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedTab = btn.dataset.tab;
    tabBtns.forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    filterGallery();
  });
});

// 引用符で囲んだカンマ・改行・二重引用符と、UTF-8 BOMに対応。
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (char === ',' || char === '\n' || char === '\r')) {
      row.push(field);
      field = '';
      if (char !== ',') {
        if (row.some(value => value.trim())) rows.push(row);
        row = [];
        if (char === '\r' && text[i + 1] === '\n') i++;
      }
    } else field += char;
  }
  if (quoted) throw new Error('CSVの引用符が閉じられていません。');
  row.push(field);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

async function loadGallery() {
  // HTML内の一覧はCSVから生成したもの。file://でも表示できるよう残す。
  filterGallery();
  if (window.location.protocol === 'file:') return;
  galleryGrid.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('作品の順番.csv', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`CSVの読み込みに失敗しました: ${response.status}`);
    const [headers, ...rows] = parseCSV(await response.text());
    const columns = ['順番', 'タブ', 'ファイル名', '作品タイトル', '仕事内容'];
    if (!headers || columns.some(name => !headers.includes(name))) {
      throw new Error('CSVの列名を確認してください。');
    }
    const artworks = rows.map(row => {
      const work = Object.fromEntries(headers.map((name, i) => [name, (row[i] || '').trim()]));
      if (!work['順番'] || !Number.isFinite(Number(work['順番'])) ||
          !['personal', 'works'].includes(work['タブ']) || !work['ファイル名'] || !work['作品タイトル']) {
        throw new Error('CSVの順番・タブ・ファイル名・作品タイトルを確認してください。');
      }
      return work;
    }).sort((a, b) => Number(a['順番']) - Number(b['順番']));

    const fragment = document.createDocumentFragment();
    artworks.forEach(work => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'gallery-item reveal';
      item.dataset.tab = work['タブ'];
      const filename = work['ファイル名'].replace(/\.webp$/i, '') + '.webp';
      item.dataset.src = `images/${work['タブ']}/${encodeURIComponent(filename)}`;
      item.dataset.caption = [work['作品タイトル'], work['仕事内容']].filter(Boolean).join('｜');
      item.setAttribute('aria-label', `${work['作品タイトル']}を拡大表示`);
      const img = document.createElement('img');
      img.src = item.dataset.src;
      img.alt = work['作品タイトル'];
      img.draggable = false;
      img.loading = 'lazy';
      const overlay = document.createElement('span');
      overlay.className = 'gallery-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      const zoom = document.createElement('span');
      zoom.className = 'zoom-icon';
      zoom.textContent = '＋';
      overlay.append(zoom);
      item.append(img, overlay);
      fragment.append(item);
    });
    galleryGrid.replaceChildren(fragment);
    galleryStatus.textContent = artworks.length ? '' : '公開中の作品はありません。';
    galleryStatus.hidden = artworks.length > 0;
    filterGallery();
  } catch (error) {
    // 通信エラーやCSVの配置漏れでも、既存の作品一覧を消さない。
    if (!galleryGrid.children.length) {
      galleryStatus.textContent = '作品を読み込めませんでした。時間をおいてページを再読み込みしてください。';
      galleryStatus.hidden = false;
    }
    console.warn('CSVを読み込めなかったため、HTMLに保存された作品一覧を表示します。', error);
  } finally {
    galleryGrid.setAttribute('aria-busy', 'false');
  }
}

// ============================================================
// 5. スクロールアニメーション (IntersectionObserver)
// ============================================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

function triggerRevealForVisible() {
  document.querySelectorAll('.reveal').forEach(el => {
    if (!el.classList.contains('visible')) observer.observe(el);
  });
}
triggerRevealForVisible();
loadGallery();

// ============================================================
// 6. Lightbox
// ============================================================
const lightbox        = document.getElementById('lightbox');
const lightboxImg     = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose   = document.getElementById('lightbox-close');
const lightboxPrev    = document.getElementById('lightbox-prev');
const lightboxNext    = document.getElementById('lightbox-next');

let currentItems = [];
let currentIndex = 0;

function openLightbox(items, index) {
  currentItems = items;
  currentIndex = index;
  showLightboxItem(currentIndex);
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function showLightboxItem(index) {
  const item = currentItems[index];
  if (!item) return;

  // フェードアウト → 切替 → フェードイン
  lightboxImg.style.opacity = '0';
  lightboxImg.style.transform = 'scale(0.96)';
  lightboxImg.style.transition = 'opacity 0.2s, transform 0.2s';

  setTimeout(() => {
    lightboxImg.src     = item.dataset.src;
    lightboxImg.alt     = item.querySelector('img').alt;
    lightboxCaption.textContent = item.dataset.caption || '';
    lightboxImg.style.opacity   = '1';
    lightboxImg.style.transform = 'scale(1)';
    lightboxImg.style.transition = 'opacity 0.3s, transform 0.3s';
  }, 200);

  // prev/next ボタンの表示
  lightboxPrev.style.opacity = currentIndex > 0 ? '1' : '0.3';
  lightboxNext.style.opacity = currentIndex < currentItems.length - 1 ? '1' : '0.3';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  lightboxImg.src = '';
}

// 表示中の作品だけを、現在の並び順で拡大表示する。
galleryGrid.addEventListener('click', event => {
  const item = event.target.closest('.gallery-item');
  if (!item || item.hidden) return;
  const items = Array.from(galleryGrid.querySelectorAll('.gallery-item:not([hidden])'));
  openLightbox(items, items.indexOf(item));
});

// Lightbox コントロール
lightboxClose.addEventListener('click', closeLightbox);

lightboxPrev.addEventListener('click', () => {
  if (currentIndex > 0) { currentIndex--; showLightboxItem(currentIndex); }
});
lightboxNext.addEventListener('click', () => {
  if (currentIndex < currentItems.length - 1) { currentIndex++; showLightboxItem(currentIndex); }
});

// 背景クリックで閉じる
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

// キーボード操作
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft'  && currentIndex > 0) { currentIndex--; showLightboxItem(currentIndex); }
  if (e.key === 'ArrowRight' && currentIndex < currentItems.length - 1) { currentIndex++; showLightboxItem(currentIndex); }
});

// タッチスワイプ対応
let touchStartX = 0;
lightbox.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });
lightbox.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(dx) > 50) {
    if (dx < 0 && currentIndex < currentItems.length - 1) { currentIndex++; showLightboxItem(currentIndex); }
    if (dx > 0 && currentIndex > 0)                       { currentIndex--; showLightboxItem(currentIndex); }
  }
}, { passive: true });

// ============================================================
// 7. カスタムイージングスクロール（href="#id" の a タグ全般）
// ============================================================

/**
 * easeInOutQuart: 最初ゆっくり→加速→ゆっくり止まる、アニメーションらしい動き
 */
function easeInOutQuart(t) {
  return t < 0.5
    ? 8 * t * t * t * t
    : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function animateScrollTo(targetY, duration) {
  const startY = window.scrollY;
  const diff   = targetY - startY;
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed  = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = easeInOutQuart(progress);
    window.scrollTo(0, startY + diff * ease);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const targetY = target.getBoundingClientRect().top + window.scrollY - 72;
    animateScrollTo(targetY, 900); // 900ms でアニメーション（お好みで調整可）
  });
});
