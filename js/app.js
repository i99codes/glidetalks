/* ═══════════════════════════════════════════════
   GlideTalks — App Logic
   ═══════════════════════════════════════════════ */

const ARTICLES_PER_PAGE = 5;
let visibleCount = ARTICLES_PER_PAGE;
let currentCat = 'all';
let currentTag = null;

// ── Category config ──
const CAT_CONFIG = {
  itom:     { icon: '&#9881;', color: 'c-itom', accent: 'ac-itom' },
  itam:     { icon: '&#128295;', color: 'c-itam', accent: 'ac-itam' },
  csdm:     { icon: '&#9729;&#65039;', color: 'c-csdm', accent: 'ac-csdm' },
  ea:       { icon: '&#127959;', color: 'c-ea', accent: 'ac-ea' },
  spm:      { icon: '&#128202;', color: 'c-spm', accent: 'ac-spm' },
  itsm:     { icon: '&#127899;&#65039;', color: 'c-itsm', accent: 'ac-itsm' },
  platform: { icon: '&#128274;', color: 'c-platform', accent: 'ac-platform' },
  ai:       { icon: '&#129302;', color: 'c-ai', accent: 'ac-ai' },
  it4it:    { icon: '&#128218;', color: 'c-it4it', accent: 'ac-it4it' },
  trends:   { icon: '&#128640;', color: 'c-trends', accent: 'ac-trends' }
};

// ── Render helpers ──
function renderArticleCard(a) {
  const cfg = CAT_CONFIG[a.category] || {};
  const tags = (a.tags || []).map(t =>
    `<a href="index.html?tag=${encodeURIComponent(t)}" class="tag" onclick="event.stopPropagation()">${t}</a>`
  ).join('');

  return `<div class="article" data-cat="${a.category}" onclick="window.location='posts/${a.slug}.html'">
    <div class="article-accent ${cfg.accent || ''}"></div>
    <div class="article-body">
      <div class="article-cat ${cfg.color || ''}"><span class="cat-icon">${a.categoryIcon || ''}</span> ${a.categoryLabel}</div>
      <div class="article-title">${a.title}</div>
      <div class="article-excerpt">${a.excerpt}</div>
      <div class="article-meta"><span>${a.readTime}</span></div>
      ${tags ? `<div class="article-tags">${tags}</div>` : ''}
    </div>
  </div>`;
}

function renderFeaturedCard(a) {
  const tagStr = (a.tags || []).join(' · ');
  return `<div class="featured" onclick="window.location='posts/${a.slug}.html'">
    <div class="featured-badge"><svg viewBox="0 0 16 16" width="12" height="12"><polygon points="8,1 10,6 16,6 11,9.5 13,15 8,11.5 3,15 5,9.5 0,6 6,6"/></svg> Featured</div>
    <div class="featured-cat">${a.categoryLabel}</div>
    <h3>${a.title}</h3>
    <p>${a.excerpt}</p>
    <div class="featured-meta"><span>${a.readTime}</span>${tagStr ? `<span>${tagStr}</span>` : ''}</div>
  </div>`;
}

function renderSidebarPosts(articles) {
  return articles.slice(0, 5).map(a => {
    const cfg = CAT_CONFIG[a.category] || {};
    return `<li onclick="window.location='posts/${a.slug}.html'"><span class="sp-cat ${cfg.color || ''}">${a.categoryLabel}</span>${a.title.length > 40 ? a.title.substring(0, 40) + '...' : a.title}</li>`;
  }).join('');
}

function renderSidebarCats(articles) {
  const counts = {};
  Object.keys(CAT_CONFIG).forEach(c => counts[c] = 0);
  articles.forEach(a => { if (counts[a.category] !== undefined) counts[a.category]++; });

  return Object.entries(CAT_CONFIG).map(([key, cfg]) => {
    const label = key === 'it4it' ? 'IT4IT' : key === 'trends' ? 'Tech Trends' : key.toUpperCase();
    return `<li onclick="filterCat('${key}')">${label} <span class="count">${counts[key]}</span></li>`;
  }).join('');
}

// ── Page rendering ──
function renderHomePage() {
  const featured = ARTICLES.find(a => a.featured);
  const regular = ARTICLES.filter(a => !a.featured);

  const featuredHTML = featured ? renderFeaturedCard(featured) : '';
  const articlesHTML = regular.map(renderArticleCard).join('');

  document.getElementById('featuredArea').innerHTML = featuredHTML;
  document.getElementById('articlesArea').innerHTML = articlesHTML;
  document.getElementById('sidebarPosts').innerHTML = renderSidebarPosts(ARTICLES);
  document.getElementById('sidebarCats').innerHTML = renderSidebarCats(ARTICLES);

  initLoadMore();

  // Handle URL params
  const params = new URLSearchParams(window.location.search);
  const tagParam = params.get('tag');
  const catParam = params.get('cat');
  if (tagParam) {
    filterByTag(tagParam);
  } else if (catParam) {
    filterCat(catParam);
  }
}

// ── Category filter ──
function filterCat(cat, el) {
  currentCat = cat;
  currentTag = null;

  // Clear tag filter UI
  const tagHeader = document.getElementById('tagFilterHeader');
  if (tagHeader) tagHeader.style.display = 'none';

  // Update nav
  document.querySelectorAll('.cat-link').forEach(l => l.classList.remove('active'));
  if (el) {
    el.classList.add('active');
  } else {
    const navEl = document.querySelector('[data-cat="' + cat + '"]');
    if (navEl) navEl.classList.add('active');
  }

  // Filter articles
  const articles = document.querySelectorAll('.article');
  articles.forEach(a => {
    a.style.display = (cat === 'all' || a.dataset.cat === cat) ? 'flex' : 'none';
  });

  // Show featured only for 'all'
  const featuredEl = document.querySelector('.featured');
  if (featuredEl) {
    const featuredArticle = ARTICLES.find(a => a.featured);
    featuredEl.style.display = (cat === 'all' || (featuredArticle && featuredArticle.category === cat)) ? '' : 'none';
  }

  // Reset load more
  visibleCount = ARTICLES_PER_PAGE;
  updateLoadMoreUI();

  // Update URL
  if (cat !== 'all') {
    history.replaceState(null, '', '?cat=' + cat);
  } else {
    history.replaceState(null, '', window.location.pathname);
  }
}

// ── Tag filter ──
function filterByTag(tag) {
  currentTag = tag;
  currentCat = 'all';

  // Show tag filter header
  const tagHeader = document.getElementById('tagFilterHeader');
  if (tagHeader) {
    tagHeader.style.display = 'block';
    document.getElementById('tagFilterName').textContent = tag;
  }

  // Reset nav
  document.querySelectorAll('.cat-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[data-cat="all"]').classList.add('active');

  // Hide featured
  const featuredEl = document.querySelector('.featured');
  if (featuredEl) featuredEl.style.display = 'none';

  // Filter by tag
  const articles = document.querySelectorAll('.article');
  let count = 0;
  articles.forEach(a => {
    const slug = a.querySelector('.article-title').textContent;
    const article = ARTICLES.find(ar => ar.title === slug);
    if (article && article.tags && article.tags.includes(tag)) {
      a.style.display = 'flex';
      count++;
    } else {
      a.style.display = 'none';
    }
  });

  document.getElementById('tagFilterCount').textContent = count + ' article' + (count !== 1 ? 's' : '');

  // Hide load more during tag filter
  document.getElementById('loadMoreWrap').style.display = 'none';

  history.replaceState(null, '', '?tag=' + encodeURIComponent(tag));
}

function clearTagFilter() {
  currentTag = null;
  document.getElementById('tagFilterHeader').style.display = 'none';
  filterCat('all');
  history.replaceState(null, '', window.location.pathname);
}

// ── Search ──
function searchArticles(query) {
  query = query.toLowerCase().trim();
  const articles = document.querySelectorAll('.article');
  const clearBtn = document.getElementById('searchClear');
  const countEl = document.getElementById('searchCount');
  const lmWrap = document.getElementById('loadMoreWrap');
  const featuredEl = document.querySelector('.featured');
  const tagHeader = document.getElementById('tagFilterHeader');

  // Reset to home view
  document.querySelectorAll('.cat-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[data-cat="all"]').classList.add('active');

  if (tagHeader) tagHeader.style.display = 'none';

  if (!query) {
    clearBtn.classList.remove('show');
    countEl.textContent = '';
    lmWrap.style.display = '';
    if (featuredEl) featuredEl.style.display = '';
    visibleCount = ARTICLES_PER_PAGE;
    filterCat('all', document.querySelector('[data-cat="all"]'));
    return;
  }

  lmWrap.style.display = 'none';
  if (featuredEl) {
    const fa = ARTICLES.find(a => a.featured);
    const faMatch = fa && (fa.title.toLowerCase().includes(query) || fa.excerpt.toLowerCase().includes(query) || fa.tags.some(t => t.toLowerCase().includes(query)));
    featuredEl.style.display = faMatch ? '' : 'none';
  }

  clearBtn.classList.add('show');
  let count = 0;
  articles.forEach(a => {
    const title = a.querySelector('.article-title').textContent.toLowerCase();
    const excerpt = a.querySelector('.article-excerpt').textContent.toLowerCase();
    const catText = a.querySelector('.article-cat').textContent.toLowerCase();
    const tagEls = a.querySelectorAll('.tag');
    let tagText = '';
    tagEls.forEach(t => tagText += ' ' + t.textContent.toLowerCase());
    if (title.includes(query) || excerpt.includes(query) || catText.includes(query) || tagText.includes(query)) {
      a.style.display = 'flex'; count++;
    } else {
      a.style.display = 'none';
    }
  });
  countEl.textContent = count + ' result' + (count !== 1 ? 's' : '');
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  searchArticles('');
}

// ── Load More ──
function initLoadMore() {
  visibleCount = ARTICLES_PER_PAGE;
  updateLoadMoreUI();
}

function loadMore() {
  visibleCount += ARTICLES_PER_PAGE;
  updateLoadMoreUI();
}

function updateLoadMoreUI() {
  const articles = document.querySelectorAll('.article');
  let visibleIndex = 0;
  let totalVisible = 0;

  articles.forEach(a => {
    const matchesCat = currentCat === 'all' || a.dataset.cat === currentCat;
    if (matchesCat) {
      totalVisible++;
      if (visibleIndex < visibleCount) {
        a.style.display = 'flex';
      } else {
        a.style.display = 'none';
      }
      visibleIndex++;
    }
  });

  const btn = document.getElementById('loadMoreBtn');
  const countEl = document.getElementById('loadMoreCount');
  const wrap = document.getElementById('loadMoreWrap');
  const showing = Math.min(visibleCount, totalVisible);

  if (showing >= totalVisible) {
    btn.style.display = 'none';
    countEl.textContent = totalVisible + ' article' + (totalVisible !== 1 ? 's' : '');
  } else {
    btn.style.display = '';
    countEl.textContent = 'Showing ' + showing + ' of ' + totalVisible;
  }
}

// ── Back to Top ──
document.addEventListener('DOMContentLoaded', function() {
  const bttBtn = document.getElementById('btt');
  if (bttBtn) {
    window.addEventListener('scroll', function() {
      bttBtn.classList.toggle('show', window.scrollY > 400);
    });
    bttBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Render if on homepage
  if (document.getElementById('articlesArea')) {
    renderHomePage();
  }
});
