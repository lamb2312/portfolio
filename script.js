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
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    const target = document.getElementById('tab-content-' + btn.dataset.tab);
    if (target) target.classList.add('active');

    // タブ切替後に新しく見えた要素をreveal
    setTimeout(triggerRevealForVisible, 50);
  });
});

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

// Gallery アイテムにクリックイベントを設定
function setupGalleryItems() {
  document.querySelectorAll('.tab-content').forEach(tab => {
    const items = Array.from(tab.querySelectorAll('.gallery-item'));
    items.forEach((item, idx) => {
      item.addEventListener('click', () => openLightbox(items, idx));
    });
  });
}
setupGalleryItems();

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
// 7. スムーススクロール（href="#id" の a タグ全般）
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  });
});
