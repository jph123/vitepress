/*!
 * Global Search Component
 * Auto-injects search modal + logic into the page.
 * Requires: window.SEARCH_INDEX (from search-index.js)
 */
(function() {
  'use strict';

  if (!window.SEARCH_INDEX) {
    console.warn('[search] SEARCH_INDEX not found. Include search-index.js before search.js');
    return;
  }

  // ---- Inject CSS ----
  var css = `
  .search-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding-top:12vh;opacity:0;visibility:hidden;transition:opacity .25s ease,visibility .25s ease}
  .search-overlay.active{opacity:1;visibility:visible}
  .search-modal{width:90%;max-width:620px;max-height:70vh;background:var(--bg-soft,#1a1a2e);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.4);overflow:hidden;display:flex;flex-direction:column;transform:translateY(-24px) scale(.97);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
  [data-theme="light"] .search-modal{box-shadow:0 24px 70px rgba(0,0,0,.12)}
  .search-overlay.active .search-modal{transform:translateY(0) scale(1)}
  .search-input-wrap{display:flex;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid var(--border,rgba(255,255,255,.08))}
  .search-input-wrap svg{width:22px;height:22px;flex-shrink:0;opacity:.5}
  .search-input{flex:1;background:none;border:none;outline:none;font-size:1.05rem;color:var(--text,#e8e8f0);font-family:inherit}
  .search-input::placeholder{color:var(--text-dim,var(--text-soft,#9090a8));opacity:.7}
  .search-kbd{font-size:.7rem;padding:3px 8px;border-radius:6px;background:var(--card,rgba(255,255,255,.06));border:1px solid var(--border,rgba(255,255,255,.1));color:var(--text-dim,var(--text-soft,#9090a8));flex-shrink:0}
  .search-results{overflow-y:auto;flex:1;padding:8px}
  .search-results::-webkit-scrollbar{width:6px}
  .search-results::-webkit-scrollbar-thumb{background:var(--border,rgba(255,255,255,.12));border-radius:3px}
  .search-group{margin-bottom:4px}
  .search-group-title{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim,var(--text-soft,#9090a8));padding:10px 14px 6px;display:flex;align-items:center;gap:8px}
  .search-group-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
  .search-item{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;cursor:pointer;transition:background .15s ease;color:var(--text,#e8e8f0);text-decoration:none}
  .search-item:hover,.search-item.selected{background:var(--card-hover,rgba(255,255,255,.08))}
  .search-item-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0}
  .search-item-text{flex:1;min-width:0}
  .search-item-title{font-size:.92rem;font-weight:500;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .search-item-desc{font-size:.78rem;color:var(--text-dim,var(--text-soft,#9090a8));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
  .search-item-arrow{font-size:.8rem;color:var(--text-dim,var(--text-soft,#9090a8));opacity:0;transition:opacity .15s ease;flex-shrink:0}
  .search-item:hover .search-item-arrow,.search-item.selected .search-item-arrow{opacity:1}
  .search-empty{text-align:center;padding:48px 24px;color:var(--text-dim,var(--text-soft,#9090a8));font-size:.9rem}
  .search-empty svg{width:48px;height:48px;opacity:.3;margin-bottom:12px}
  .search-footer{display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-top:1px solid var(--border,rgba(255,255,255,.08));font-size:.75rem;color:var(--text-dim,var(--text-soft,#9090a8))}
  .search-footer-hints{display:flex;gap:14px}
  .search-footer-hint{display:flex;align-items:center;gap:5px}
  .search-footer kbd{font-size:.68rem;padding:2px 6px;border-radius:5px;background:var(--card,rgba(255,255,255,.06));border:1px solid var(--border,rgba(255,255,255,.1))}
  .search-count{font-weight:600;color:var(--text,#e8e8f0)}
  /* Highlight */
  .search-hl{color:var(--accent,#646cff);font-weight:700}
  /* Mobile */
  @media(max-width:640px){
    .search-overlay{padding-top:0;align-items:flex-start}
    .search-modal{width:100%;max-width:100%;max-height:100vh;border-radius:0;border:none}
    .search-input-wrap{padding:16px 18px}
    .search-input{font-size:1rem}
    .search-kbd{display:none}
    .search-footer{display:none}
  }
  `;
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---- Build modal HTML ----
  var overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'searchOverlay';
  overlay.innerHTML = `
    <div class="search-modal" role="dialog" aria-label="搜索">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" class="search-input" id="searchInput" placeholder="搜索知识点、面试题、技术..." autocomplete="off" spellcheck="false">
        <span class="search-kbd">ESC</span>
      </div>
      <div class="search-results" id="searchResults"></div>
      <div class="search-footer">
        <div class="search-footer-hints">
          <span class="search-footer-hint"><kbd>↑</kbd><kbd>↓</kbd> 导航</span>
          <span class="search-footer-hint"><kbd>↵</kbd> 打开</span>
          <span class="search-footer-hint"><kbd>ESC</kbd> 关闭</span>
        </div>
        <div><span class="search-count" id="searchCount">0</span> 条结果</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  var input = document.getElementById('searchInput');
  var resultsEl = document.getElementById('searchResults');
  var countEl = document.getElementById('searchCount');
  var selectedIndex = -1;
  var currentResults = [];

  // ---- Add search trigger buttons ----
  // Find existing nav to insert search button
  function addSearchButton() {
    // Homepage navbar structure
    var navRight = document.querySelector('.nav-right');
    if (navRight) {
      var btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.id = 'searchTrigger';
      btn.setAttribute('aria-label', '搜索');
      btn.style.marginRight = '6px';
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
      btn.addEventListener('click', openSearch);
      navRight.insertBefore(btn, navRight.firstChild);
      return;
    }

    // Inner pages nav structure
    var navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      var btn2 = document.createElement('button');
      btn2.className = 'theme-btn';
      btn2.id = 'searchTrigger';
      btn2.setAttribute('aria-label', '搜索');
      btn2.style.marginRight = '6px';
      btn2.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
      btn2.addEventListener('click', openSearch);
      var themeBtn = navLinks.querySelector('#themeToggle, .theme-btn');
      if (themeBtn) {
        navLinks.insertBefore(btn2, themeBtn);
      } else {
        navLinks.appendChild(btn2);
      }
      return;
    }
  }

  // ---- Open / Close ----
  function openSearch() {
    overlay.classList.add('active');
    input.value = '';
    input.focus();
    renderResults('');
    // Close mobile menu if open
    var navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.remove('open');
    var navLinks2 = document.getElementById('nav-links');
    if (navLinks2) navLinks2.classList.remove('open');
  }

  function closeSearch() {
    overlay.classList.remove('active');
    input.blur();
  }

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeSearch();
  });

  // ---- Keyboard shortcuts ----
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to open
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
      return;
    }
    // "/" to open (when not typing in an input)
    if (e.key === '/' && !isTyping(e.target)) {
      e.preventDefault();
      openSearch();
      return;
    }
    if (!overlay.classList.contains('active')) return;
    // Esc to close
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
      return;
    }
    // Arrow navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
      updateSelection();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection();
      return;
    }
    // Enter to navigate
    if (e.key === 'Enter' && selectedIndex >= 0 && currentResults[selectedIndex]) {
      e.preventDefault();
      navigateTo(currentResults[selectedIndex]);
      return;
    }
  });

  function isTyping(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  // ---- Search logic ----
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, query) {
    if (!query) return text;
    var re = new RegExp('(' + escapeRegex(query) + ')', 'gi');
    return text.replace(re, '<span class="search-hl">$1</span>');
  }

  function scoreMatch(text, query) {
    var lower = text.toLowerCase();
    var q = query.toLowerCase();
    if (lower === q) return 100;
    if (lower.startsWith(q)) return 80;
    if (lower.includes(q)) return 60;
    // Word boundary match
    var words = q.split(/\s+/);
    var score = 0;
    for (var i = 0; i < words.length; i++) {
      if (lower.includes(words[i])) score += 20;
    }
    return score;
  }

  function search(query) {
    query = query.trim().toLowerCase();
    if (!query) {
      // Return all pages as suggestions
      return window.SEARCH_INDEX.map(function(p) {
        return { type: 'page', title: p.title, desc: p.desc, url: p.url, color: p.color, category: p.category, score: 0 };
      });
    }

    var results = [];
    var pages = window.SEARCH_INDEX;

    for (var i = 0; i < pages.length; i++) {
      var p = pages[i];
      var pageScore = scoreMatch(p.title, query) + scoreMatch(p.category, query) + scoreMatch(p.desc, query);
      if (pageScore > 0) {
        results.push({ type: 'page', title: p.title, desc: p.desc, url: p.url, color: p.color, category: p.category, score: pageScore });
      }
      // Search items
      if (p.items) {
        for (var j = 0; j < p.items.length; j++) {
          var itemScore = scoreMatch(p.items[j], query);
          if (itemScore > 0) {
            results.push({ type: 'item', title: p.items[j], desc: p.title + ' · ' + p.category, url: p.url, color: p.color, category: p.category, score: itemScore + 5 });
          }
        }
      }
    }

    results.sort(function(a, b) { return b.score - a.score; });
    return results.slice(0, 30);
  }

  // ---- Render results ----
  function renderResults(query) {
    currentResults = search(query);
    selectedIndex = -1;
    countEl.textContent = currentResults.length;

    if (currentResults.length === 0) {
      resultsEl.innerHTML = '<div class="search-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6" stroke-linecap="round"/></svg><div>没有找到相关内容</div><div style="margin-top:6px;font-size:.8rem">试试搜索 HTML、CSS、Vue、闭包、定时器...</div></div>';
      return;
    }

    // Group by category
    var groups = {};
    var groupOrder = [];
    for (var i = 0; i < currentResults.length; i++) {
      var r = currentResults[i];
      var key = r.category;
      if (!groups[key]) {
        groups[key] = [];
        groupOrder.push({ key: key, color: r.color });
      }
      groups[key].push(r);
    }

    var html = '';
    var globalIdx = 0;
    for (var g = 0; g < groupOrder.length; g++) {
      var gk = groupOrder[g].key;
      var gc = groupOrder[g].color;
      var items = groups[gk];
      html += '<div class="search-group">';
      html += '<div class="search-group-title"><span class="search-group-dot" style="background:' + gc + '"></span>' + gk + '</div>';
      for (var k = 0; k < items.length; k++) {
        var r = items[k];
        var iconText = r.type === 'page' ? '📄' : '💡';
        var titleHl = highlight(r.title, query);
        var descHl = highlight(r.desc, query);
        var itemUrl = r.type === 'item' ? r.url + '?q=' + encodeURIComponent(r.title) : r.url;
        html += '<a class="search-item" data-idx="' + globalIdx + '" href="' + itemUrl + '">';
        html += '<div class="search-item-icon" style="background:' + r.color + '">' + iconText + '</div>';
        html += '<div class="search-item-text">';
        html += '<div class="search-item-title">' + titleHl + '</div>';
        html += '<div class="search-item-desc">' + descHl + '</div>';
        html += '</div>';
        html += '<span class="search-item-arrow">→</span>';
        html += '</a>';
        globalIdx++;
      }
      html += '</div>';
    }
    resultsEl.innerHTML = html;

    // Attach click handlers
    var itemEls = resultsEl.querySelectorAll('.search-item');
    itemEls.forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        var idx = parseInt(el.getAttribute('data-idx'));
        navigateTo(currentResults[idx]);
      });
      el.addEventListener('mouseenter', function() {
        selectedIndex = parseInt(el.getAttribute('data-idx'));
        updateSelection();
      });
    });
  }

  function updateSelection() {
    var items = resultsEl.querySelectorAll('.search-item');
    items.forEach(function(el, i) {
      var idx = parseInt(el.getAttribute('data-idx'));
      if (idx === selectedIndex) {
        el.classList.add('selected');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        el.classList.remove('selected');
      }
    });
  }

  function navigateTo(result) {
    if (!result) return;
    if (result.type === 'item' && result.title) {
      // Append ?q= so the target page can auto-expand the matching card
      window.location.href = result.url + '?q=' + encodeURIComponent(result.title);
    } else {
      window.location.href = result.url;
    }
  }

  // ---- Auto-expand on page load (from search ?q= param) ----
  function autoExpandFromSearch() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (!q) return;

    // Decode and normalize
    q = decodeURIComponent(q).trim().toLowerCase();

    // Try both .qa-question (front-end pages) and .ka-title (electrical pages)
    var selectors = ['.qa-question', '.ka-title'];
    var items = [];

    for (var s = 0; s < selectors.length; s++) {
      var els = document.querySelectorAll(selectors[s]);
      els.forEach(function(el) {
        items.push(el);
      });
    }

    var bestMatch = null;
    var bestScore = 0;

    for (var i = 0; i < items.length; i++) {
      var text = items[i].textContent.trim().toLowerCase();
      var score = 0;
      if (text === q) score = 100;
      else if (text.startsWith(q)) score = 80;
      else if (text.includes(q)) score = 60;
      else if (q.includes(text)) score = 40;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = items[i];
      }
    }

    if (bestMatch) {
      // Find the parent item (.qa-item or .ka-item)
      var item = bestMatch.closest('.qa-item, .ka-item');
      if (item) {
        // Close all other items first
        document.querySelectorAll('.qa-item.open, .ka-item.open').forEach(function(el) {
          el.classList.remove('open');
          var body = el.querySelector('.qa-body, .ka-body');
          if (body) body.style.maxHeight = null;
        });

        // Open the matched item
        item.classList.add('open');
        var body = item.querySelector('.qa-body, .ka-body');
        if (body) body.style.maxHeight = body.scrollHeight + 'px';

        // Highlight the matched item
        var oldHighlight = document.getElementById('search-highlight');
        if (oldHighlight) oldHighlight.remove();
        var style = document.createElement('style');
        style.id = 'search-highlight';
        style.textContent = '@keyframes searchPulse{0%,100%{box-shadow:0 0 0 0 var(--accent,#646cff)}50%{box-shadow:0 0 0 6px transparent}}.qa-item.search-hit,.ka-item.search-hit{animation:searchPulse 1.5s ease 3;border-color:var(--accent,#646cff)!important}';
        document.head.appendChild(style);
        item.classList.add('search-hit');

        // Scroll to the item after a small delay (let max-height transition start)
        setTimeout(function() {
          item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);

        // Clean up the highlight class after animation
        setTimeout(function() {
          item.classList.remove('search-hit');
        }, 5000);
      }
    }
  }

  // Run auto-expand after DOM is ready and other scripts have initialized
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(autoExpandFromSearch, 200);
    });
  } else {
    setTimeout(autoExpandFromSearch, 200);
  }

  // ---- Input handler ----
  var debounceTimer;
  input.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      renderResults(input.value);
    }, 120);
  });

  // ---- Initialize ----
  addSearchButton();

  // Expose for debugging
  window.__search = { open: openSearch, close: closeSearch };
})();
