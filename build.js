/**
 * GlideTalks Build Script
 * Converts markdown posts from content/posts/ into:
 *   1. posts/*.html  (article detail pages)
 *   2. js/articles.js (article data for homepage)
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// ── Category config ──
const CATEGORIES = {
  itom:     { label: 'ITOM',     icon: '&#9881;',   css: 'c-itom' },
  csdm:     { label: 'CSDM',     icon: '&#128202;',  css: 'c-csdm' },
  ai:       { label: 'AI',       icon: '&#129302;',  css: 'c-ai' },
  ea:       { label: 'EA',       icon: '&#127970;',  css: 'c-ea' },
  it4it:    { label: 'IT4IT',    icon: '&#128218;',  css: 'c-it4it' },
  itsm:     { label: 'ITSM',     icon: '&#127899;',  css: 'c-itsm' },
  platform: { label: 'Platform', icon: '&#128274;',  css: 'c-platform' },
  secops:   { label: 'SecOps',   icon: '&#128737;',  css: 'c-secops' },
  hrsd:     { label: 'HRSD',     icon: '&#128101;',  css: 'c-hrsd' },
  itam:     { label: 'ITAM',    icon: '&#128295;',  css: 'c-itam' },
  trends:   { label: 'Tech Trends', icon: '&#128640;', css: 'c-trends' }
};

const NAV_CATS = [
  { key: 'itom', label: 'ITOM' },
  { key: 'csdm', label: 'CSDM' },
  { key: 'ea',   label: 'EA' },
  { key: 'itsm', label: 'ITSM' },
  { key: 'platform', label: 'Platform' },
  { key: 'ai',   label: 'AI' },
  { key: 'it4it', label: 'IT4IT' },
  { key: 'itam', label: 'ITAM' },
  { key: 'trends', label: 'Tech Trends' }
];

// ── Parse frontmatter from markdown ──
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    meta[key] = val;
  });

  return { meta, body: match[2] };
}

// ── Generate excerpt from body ──
function makeExcerpt(body, maxLen = 160) {
  const text = body
    .replace(/<[^>]+>/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_>`~\-]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

// ── Build nav HTML ──
function buildNav(activeCat) {
  const links = NAV_CATS.map(c =>
    '      <a href="../index.html?cat=' + c.key + '" class="cat-link' + (c.key === activeCat ? ' active' : '') + '">' + c.label + '</a>'
  ).join('\n');

  return '<div class="topnav">\n  <div class="topnav-inner">\n    <a href="../index.html" class="logo"><span>Glide</span>Talks</a>\n    <div class="cat-nav">\n      <a href="../index.html" class="cat-link">All</a>\n' + links + '\n      <a href="../about.html" class="cat-link">Author</a>\n    </div>\n  </div>\n</div>';
}

// ── Build sidebar ──
function buildSidebar(currentSlug, currentCat, allArticles) {
  const catInfo = CATEGORIES[currentCat] || { label: currentCat, css: '' };
  const related = allArticles
    .filter(a => a.category === currentCat && a.slug !== currentSlug)
    .slice(0, 3);

  const relatedItems = related.map(a =>
    '        <li onclick="window.location=\'' + a.slug + '.html\'"><span class="sp-cat ' + catInfo.css + '">' + catInfo.label + '</span>' + a.title.slice(0, 50) + '...</li>'
  ).join('\n');

  return '  <aside class="sidebar">\n    <div class="sb-card sb-about">\n      <div class="sb-avatar">KC</div>\n      <div class="sb-name">Kiran Kumar Chitrada</div>\n      <div class="sb-role">Veteran &middot; ServiceNow CTA</div>\n      <div class="sb-bio">Building resilient IT environments through ITOM, CMDB, and enterprise architecture.</div>\n      <div class="sb-social">\n        <a href="https://www.linkedin.com/in/ck-kumar/" target="_blank">\n          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>\n          LinkedIn\n        </a>\n        <a href="../about.html">More &rarr;</a>\n      </div>\n    </div>\n\n    <div class="sb-card">\n      <div class="sb-title">More in ' + catInfo.label + '</div>\n      <ul class="sb-posts">\n' + relatedItems + '\n        <li onclick="window.location=\'../index.html?cat=' + currentCat + '\'">View all ' + catInfo.label + ' articles &rarr;</li>\n      </ul>\n    </div>\n  </aside>';
}

// ── Build post HTML page ──
function buildPostHTML(article, allArticles, prevArticle, nextArticle) {
  const cat = CATEGORIES[article.category] || { label: article.category, icon: '', css: '' };
  const tagsHTML = (article.tags || []).filter(Boolean).map(t =>
    '<a href="../index.html?tag=' + t + '" class="tag">' + t + '</a>'
  ).join(' ');

  const prevLink = prevArticle
    ? '<a href="' + prevArticle.slug + '.html">&larr; ' + prevArticle.title.slice(0, 50) + '...</a>'
    : '<span></span>';
  const nextLink = nextArticle
    ? '<a href="' + nextArticle.slug + '.html">' + nextArticle.title.slice(0, 50) + '... &rarr;</a>'
    : '<span></span>';

  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + article.title + ' | GlideTalks</title>\n<meta name="description" content="' + article.excerpt.slice(0, 160).replace(/"/g, '&quot;') + '">\n<meta name="author" content="Kiran Kumar Chitrada">\n<meta property="og:title" content="' + article.title.replace(/"/g, '&quot;') + '">\n<meta property="og:type" content="article">\n<link rel="canonical" href="https://glidetalks.com/' + article.slug + '/">\n<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="../css/style.css">\n</head>\n<body>\n<div class="reading-progress" id="readingProgress"></div>\n\n' + buildNav(article.category) + '\n\n<div class="main">\n  <div class="content">\n    <div class="post-header">\n      <div class="article-cat ' + cat.css + '"><span class="cat-icon">' + cat.icon + '</span> ' + cat.label + '</div>\n      <h1>' + article.title + '</h1>\n      <div class="article-meta">\n        <span>' + article.readTime + '</span>\n        <span>By Kiran Kumar Chitrada</span>\n      </div>\n' + (tagsHTML ? '      <div class="article-tags" style="margin-top:12px">' + tagsHTML + '</div>\n' : '') + '    </div>\n\n    <div class="post-content">\n      ' + article.html + '\n    </div>\n\n    <div class="post-nav">\n      ' + prevLink + '\n      ' + nextLink + '\n    </div>\n  </div>\n\n' + buildSidebar(article.slug, article.category, allArticles) + '\n</div>\n\n<footer>\n  <div style="max-width:1100px;margin:auto;padding:0 20px;display:flex;justify-content:space-between;align-items:center;font-size:.82rem;color:var(--text3)">\n    <span>&copy; 2025 GlideTalks. All rights reserved.</span>\n    <span>By Kiran Kumar Chitrada</span>\n  </div>\n</footer>\n\n<button class="btt" onclick="window.scrollTo({top:0,behavior:\'smooth\'})">\n  <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>\n</button>\n<script>\nwindow.addEventListener(\'scroll\',function(){\n  document.querySelector(\'.btt\').classList.toggle(\'show\',window.scrollY>400);\n  var bar=document.getElementById(\'readingProgress\');\n  if(bar){var h=document.documentElement.scrollHeight-window.innerHeight;bar.style.width=h>0?(window.scrollY/h*100)+\'%\':\'0%\'}\n});\n</script>\n</body>\n</html>';
}

// ── Build articles.js ──
function buildArticlesJS(articles) {
  const entries = articles.map(a => {
    const tags = (a.tags || []).filter(Boolean).map(t => '"' + t + '"').join(', ');
    const escapedTitle = a.title.replace(/"/g, '\\"');
    const escapedExcerpt = a.excerpt.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const cats = (a.categories || [a.category]).filter(Boolean).map(c => '"' + c + '"').join(', ');
    return '  {\n    slug: "' + a.slug + '",\n    title: "' + escapedTitle + '",\n    excerpt: "' + escapedExcerpt + '",\n    category: "' + a.category + '",\n    categories: [' + cats + '],\n    categoryLabel: "' + ((CATEGORIES[a.category] || {}).label || a.category) + '",\n    categoryIcon: "' + ((CATEGORIES[a.category] || {}).icon || '') + '",\n    readTime: "' + a.readTime + '",\n    tags: [' + tags + '],\n    featured: ' + (a.featured ? 'true' : 'false') + '\n  }';
  });

  return '/* GlideTalks Article Data */\n\nconst ARTICLES = [\n' + entries.join(',\n') + '\n];\n';
}

// ══════════════════════════════════════════════════════
//  MAIN BUILD
// ══════════════════════════════════════════════════════
const contentDir = path.join(__dirname, 'content', 'posts');
const postsDir = path.join(__dirname, 'posts');
const jsDir = path.join(__dirname, 'js');

if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });
if (!fs.existsSync(jsDir)) fs.mkdirSync(jsDir, { recursive: true });

// Check if content/posts exists (might not exist on first deploy before CMS is used)
if (!fs.existsSync(contentDir)) {
  console.log('No content/posts directory found. Skipping build.');
  process.exit(0);
}

const mdFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
console.log('Found ' + mdFiles.length + ' markdown posts');

if (mdFiles.length === 0) {
  console.log('No markdown files found. Skipping build.');
  process.exit(0);
}

const articles = [];

for (const file of mdFiles) {
  const raw = fs.readFileSync(path.join(contentDir, file), 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const slug = file.replace('.md', '');
  const html = marked(body);

  articles.push({
    slug,
    title: meta.title || slug,
    excerpt: meta.excerpt || makeExcerpt(body),
    category: meta.categories ? (Array.isArray(meta.categories) ? meta.categories[0] : meta.categories) : (meta.category || 'platform'),
    categories: meta.categories ? (Array.isArray(meta.categories) ? meta.categories : [meta.categories]) : (meta.category ? [meta.category] : ['platform']),
    readTime: meta.readTime || '5 min read',
    tags: Array.isArray(meta.tags) ? meta.tags : (meta.tags || '').split(',').map(s => s.trim()).filter(Boolean),
    featured: meta.featured === true,
    html
  });
}

// Sort: featured first, then alphabetically
articles.sort((a, b) => {
  if (a.featured && !b.featured) return -1;
  if (!a.featured && b.featured) return 1;
  return a.title.localeCompare(b.title);
});

// Generate post HTML files
for (let i = 0; i < articles.length; i++) {
  const prev = i > 0 ? articles[i - 1] : null;
  const next = i < articles.length - 1 ? articles[i + 1] : null;
  const html = buildPostHTML(articles[i], articles, prev, next);
  fs.writeFileSync(path.join(postsDir, articles[i].slug + '.html'), html);
}

// Generate articles.js
fs.writeFileSync(path.join(jsDir, 'articles.js'), buildArticlesJS(articles));

console.log('Built ' + articles.length + ' article pages and articles.js');
