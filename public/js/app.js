(() => {
  'use strict';
  const API = '/api';
  const STORE = {
    region: 'movimoon-region-v3', saved: 'movimoon-watchlist-v3', history: 'movimoon-history-v3',
    items: 'movimoon-item-cache-v3'
  };
  const TITLES = {
    home: 'Discover', movies: 'Movies', shows: 'TV Shows', trending: 'Trending',
    'top-rated': 'Top Rated', upcoming: 'Coming Soon', watchlist: 'My Watchlist',
    history: 'Recently Viewed', search: 'Search results', live: 'Live TV', blog: 'Journal',
    article: 'Journal', page: 'Site page', about: 'About & credits', privacy: 'Privacy policy',
    terms: 'Terms of use', disclaimer: 'Disclaimer'
  };
  const INFO = {
    about: {
      title: 'About MoviMoon', kicker: 'MOVIMOON · CREDITS',
      paragraphs: [
        'This site rebuilds the MoviMoon Blogger theme experience as ordinary HTML, CSS, JavaScript, and an optional Cloudflare Pages Functions backend: responsive navigation, spotlight, catalog rows, search, title detail, regional release discovery, Live TV player shell, local watchlist/history, and editorial pages.',
        'TMDB is an optional server-side catalogue provider. Its API credential is not present in browser code; Pages Functions stay in configuration mode until an owner adds a secret. TMDB data is attributed below and in the footer.',
        'Regional discovery is explicitly user-selected and filters movie release-region data. TMDB Trending remains global; this site does not infer location or call IP geolocation services.'
      ], links: [{ label: 'TMDB API attribution and logo guidance', href: 'https://developer.themoviedb.org/docs/faq' }]
    },
    privacy: {
      title: 'Privacy policy', kicker: 'INFORMATION',
      paragraphs: [
        'The chosen region, watchlist, recently viewed titles, and a small metadata cache are stored in this browser only. They are not associated with an account or synchronized to a server.',
        'With no TMDB Pages Functions secret, the site makes no TMDB API request and displays a fictional local sample catalogue. If an owner configures TMDB, catalogue searches are sent to this site’s Pages Functions proxy; the browser does not receive the server-side credential.',
        'No IP geolocation, analytics, advertising pixels, or tracking SDK is included. Selecting a trailer, configured player, or provider link may contact that third party. Review the privacy notice again before enabling comments, CMS, or media integrations.'
      ]
    },
    terms: {
      title: 'Terms of use', kicker: 'INFORMATION',
      paragraphs: [
        'This package is a theme migration and integration shell, not a content licence, streaming service, or rights clearance. The local article entries and no-key catalogue are illustrative examples.',
        'An operator must supply authorized API credentials, editorial content, player URLs, and any distribution rights. The player is disabled by default and accepts only configured HTTPS origins.'
      ]
    },
    disclaimer: {
      title: 'Disclaimer', kicker: 'INFORMATION',
      paragraphs: [
        'Movie and television discovery metadata is not an offer to stream, download, or redistribute media. A TMDB catalogue entry does not establish a right to playback.',
        'The Live TV/player area contains no stream URL in this package. Configure only an embed source that you are authorized to use and update the site’s disclosures and privacy policy before publication.'
      ]
    }
  };
  const REGION = {
    BD: { label: 'Bangladesh', language: 'bn-BD', original: 'bn|hi|en' },
    IN: { label: 'India', language: 'hi-IN', original: 'hi|te|ta|ml|kn|en' },
    PK: { label: 'Pakistan', language: 'ur-PK', original: 'ur|pa|hi|en' },
    US: { label: 'United States', language: 'en-US', original: 'en' },
    GB: { label: 'United Kingdom', language: 'en-GB', original: 'en' },
    CA: { label: 'Canada', language: 'en-CA', original: 'en|fr' },
    AU: { label: 'Australia', language: 'en-AU', original: 'en' },
    JP: { label: 'Japan', language: 'ja-JP', original: 'ja' },
    DE: { label: 'Germany', language: 'de-DE', original: 'de|en' },
    FR: { label: 'France', language: 'fr-FR', original: 'fr|en' },
    BR: { label: 'Brazil', language: 'pt-BR', original: 'pt|en' },
    KR: { label: 'South Korea', language: 'ko-KR', original: 'ko' },
    NG: { label: 'Nigeria', language: 'en-NG', original: 'en' },
    ZA: { label: 'South Africa', language: 'en-ZA', original: 'en' },
    AE: { label: 'United Arab Emirates', language: 'ar-AE', original: 'ar|en|hi' },
    NZ: { label: 'New Zealand', language: 'en-NZ', original: 'en' },
    SG: { label: 'Singapore', language: 'en-SG', original: 'en|zh' }
  };
  const GENRES = {
    movie: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }, { id: 14, name: 'Fantasy' }, { id: 27, name: 'Horror' }, { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' }],
    tv: [{ id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }, { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 9648, name: 'Mystery' }, { id: 10768, name: 'War & Politics' }]
  };
  const state = {
    route: 'home', previousRoute: 'home', query: '', region: readString(STORE.region, 'GLOBAL'),
    config: { tmdbReady: false, playerConfigured: false, commentsEnabled: false },
    demo: [], items: new Map(), home: {}, results: [], page: 1, totalPages: 1,
    selectedGenre: '', sort: 'popularity.desc', detailKey: '', detail: null, detailTab: 'overview',
    saved: readArray(STORE.saved), history: readArray(STORE.history), channels: [], articleSlug: '', articleKind: 'posts',
    searchTimer: null, toastTimer: null, heroItems: [], heroIndex: 0, turnstileId: null, turnstileLoaded: false
  };

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function readString(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
  function readArray(key) { try { const x = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(x) ? x.filter(v => typeof v === 'string').slice(0, 80) : []; } catch { return []; } }
  function persist(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('Browser storage is unavailable.'); } }
  function saveItems() {
    try {
      const packed = [...state.items.values()].slice(-150);
      localStorage.setItem(STORE.items, JSON.stringify(packed));
    } catch { /* private browsing may deny storage; current page remains usable */ }
  }
  function hydrateItems() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE.items) || '[]');
      if (Array.isArray(saved)) saved.slice(-150).forEach(item => { if (item?.key) state.items.set(item.key, item); });
    } catch { /* use live or demo data */ }
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function regionConfig() { return REGION[state.region] || null; }
  function titleKey(item) { return item?.key || ''; }
  function getItem(key) { return state.items.get(key) || null; }
  function toast(message) {
    const node = byId('toast'); if (!node) return;
    node.textContent = message; node.classList.add('show');
    clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  }
  async function getJSON(path, options = {}) {
    if (String(path).startsWith('/api') && window.MOVIMOON_STATIC_ONLY && window.MOVIMOON_STATIC_API) {
      return window.MOVIMOON_STATIC_API.getJSON(path, options);
    }
    const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { accept: 'application/json', ...(options.headers || {}) } });
    let payload = {};
    try { payload = await response.json(); } catch { /* preserve useful status below */ }
    if (!response.ok) {
      const error = new Error(payload.message || payload.error || `Request failed (${response.status})`);
      error.status = response.status; error.payload = payload; throw error;
    }
    return payload;
  }
  function urlWithParams(path, params) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') query.set(k, String(v)); });
    return `${API}/${path}${query.size ? `?${query}` : ''}`;
  }
  function setConnection(text, isError = false) {
    const box = byId('connection-banner');
    if (box) { box.textContent = text; box.classList.toggle('is-error', isError); }
    const side = byId('sidebar-status-detail');
    if (side) {
      const compact = /TMDB (?:is )?not configured|TMDB is currently not configured/i.test(text) ? 'TMDB not configured · sample mode' : text;
      side.textContent = compact.length > 42 ? `${compact.slice(0, 39).trimEnd()}…` : compact;
    }
  }
  function registerItem(item) {
    if (!item?.key) return item;
    state.items.set(item.key, item); return item;
  }
  function normalizeTmdb(raw, forcedType = '') {
    const type = forcedType || raw.media_type || (raw.first_air_date !== undefined || raw.name ? 'tv' : 'movie');
    if (!raw || !raw.id || !['movie', 'tv'].includes(type)) return null;
    const releaseDate = type === 'tv' ? (raw.first_air_date || '') : (raw.release_date || '');
    const item = {
      key: `${type}:${raw.id}`, id: String(raw.id), mediaType: type,
      title: raw.title || raw.name || raw.original_title || raw.original_name || 'Untitled',
      originalTitle: raw.original_title || raw.original_name || '', overview: raw.overview || '',
      releaseDate, year: releaseDate.slice(0, 4), rating: Number(raw.vote_average || 0),
      voteCount: Number(raw.vote_count || 0), popularity: Number(raw.popularity || 0),
      poster: raw.poster_path || '', backdrop: raw.backdrop_path || '',
      genreIds: Array.isArray(raw.genre_ids) ? raw.genre_ids : [],
      genres: Array.isArray(raw.genres) ? raw.genres.map(g => typeof g === 'string' ? g : g.name).filter(Boolean) : [],
      originalLanguage: raw.original_language || '', raw
    };
    return registerItem(item);
  }
  function normalizeDemo(raw) {
    const type = raw.type === 'series' || raw.type === 'tv' ? 'tv' : 'movie';
    const item = {
      key: `demo:${raw.id}`, id: String(raw.id), mediaType: type, title: raw.title,
      originalTitle: raw.title, overview: raw.synopsis || '', releaseDate: `${raw.year || ''}-01-01`,
      year: String(raw.year || ''), rating: Number(raw.rating || 0), voteCount: 0,
      popularity: Number(raw.rating || 0) * 10, poster: '', backdrop: '', genreIds: [],
      genres: Array.isArray(raw.genres) ? raw.genres : [], section: raw.section || 'featured', accent: raw.accent || []
    };
    return registerItem(item);
  }
  function imageUrl(path, size = 'w342') {
    if (typeof path !== 'string' || !/^\/[A-Za-z0-9_./-]+$/.test(path) || path.includes('..')) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
  function hueAccent(item) {
    if (Array.isArray(item.accent) && item.accent.every(x => /^#[\da-f]{6}$/i.test(x))) return `--art-a:${item.accent[0]};--art-b:${item.accent[1] || '#26345b'};--art-c:${item.accent[2] || '#151925'}`;
    const seed = [...String(item.id)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 0);
    return `--art-a:hsl(${seed} 48% 34%);--art-b:hsl(${(seed + 58) % 360} 46% 23%);--art-c:#111927`;
  }
  function genreNames(item) {
    if (item.genres?.length) return item.genres;
    const source = GENRES[item.mediaType] || [];
    return (item.genreIds || []).map(id => source.find(g => g.id === id)?.name).filter(Boolean);
  }
  function cardMarkup(item, compact = false) {
    const saved = state.saved.includes(item.key);
    const poster = imageUrl(item.poster);
    const subtitle = `${item.year || '—'} · ${item.mediaType === 'tv' ? 'Series' : 'Film'}`;
    return `<article class="media-card${compact ? ' compact-card' : ''}" data-item="${escapeHtml(item.key)}" style="${hueAccent(item)}"><button class="card-open" type="button" data-open="${escapeHtml(item.key)}" aria-label="Open ${escapeHtml(item.title)}"></button><div class="poster">${poster ? `<img class="poster-image" src="${poster}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}<span class="poster-badge">${item.mediaType === 'tv' ? 'TV' : 'FILM'}</span><button class="save-card${saved ? ' saved' : ''}" type="button" data-save="${escapeHtml(item.key)}" aria-label="${saved ? 'Remove from' : 'Add to'} watchlist" title="${saved ? 'Remove from' : 'Add to'} watchlist">${saved ? '♥' : '♡'}</button>${!poster ? `<span class="poster-fallback"><small>${state.config.tmdbReady ? 'MOVIMOON' : 'SAMPLE CATALOGUE'}</small><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(subtitle)}</small></span>` : ''}</div><div class="media-info"><span class="media-name">${escapeHtml(item.title)}</span><span class="media-meta"><span class="media-rating">★</span> ${item.rating ? item.rating.toFixed(1) : '—'}</span></div></article>`;
  }
  function renderGrid(holder, list) { if (holder) holder.innerHTML = list.map(item => cardMarkup(item)).join(''); }
  function demoCollections() {
    const items = state.demo;
    return {
      trending: items.filter(x => x.section === 'trending').slice(0, 10),
      region: [...items].sort((a, b) => b.popularity - a.popularity).slice(2, 12),
      movies: items.filter(x => x.mediaType === 'movie').slice(0, 10),
      top: [...items].sort((a, b) => b.rating - a.rating).slice(0, 10),
      shows: items.filter(x => x.mediaType === 'tv').slice(0, 10),
      upcoming: items.filter(x => x.section === 'upcoming').slice(0, 10)
    };
  }
  function itemsFromResponse(data, type = '') { return (Array.isArray(data?.results) ? data.results : []).map(raw => normalizeTmdb(raw, type)).filter(Boolean); }
  function sectionMarkup(key, title, subtitle, list, route, tone = '') {
    if (!list?.length) return '';
    return `<section class="catalog-section" aria-labelledby="section-${key}"><div class="section-head"><div class="section-heading"><span class="section-icon ${tone}">${key === 'trending' ? '↗' : key === 'region' ? '◎' : key === 'top' ? '★' : key === 'shows' ? '▤' : key === 'upcoming' ? '◷' : '✦'}</span><div><h2 class="section-title" id="section-${key}">${escapeHtml(title)}</h2><div class="section-subtitle">${escapeHtml(subtitle)}</div></div></div><button class="section-view-all" type="button" data-route="${route}">View all <span>→</span></button></div><div class="horizontal-row">${list.map(item => cardMarkup(item, true)).join('')}</div></section>`;
  }
  function renderHome() {
    const home = state.home;
    const region = regionConfig();
    const subtitle = state.config.tmdbReady
      ? (region ? `${region.label} release-region filter · popularity order` : 'Popular movie discovery · choose a region for release-filtered results')
      : (region ? `Local sample row · ${region.label} is your saved preference only` : 'Local sample row · no location lookup');
    const rows = [
      sectionMarkup('trending', 'Trending Now', 'Global TMDB trending · day window', home.trending || [], 'trending'),
      sectionMarkup('region', region ? `Popular in ${region.label}` : 'Popular Movies', subtitle, home.region || [], 'movies', 'violet'),
      sectionMarkup('movies', 'Popular Movies', 'Popular titles from the selected catalogue source', home.movies || [], 'movies', 'gold'),
      sectionMarkup('top', 'Top Rated Films', 'Higher-rated movie picks', home.top || [], 'top-rated', 'violet'),
      sectionMarkup('shows', 'Popular TV Shows', 'Series and episodic stories', home.shows || [], 'shows', 'pink'),
      sectionMarkup('upcoming', 'Coming Soon', 'Upcoming movie releases', home.upcoming || [], 'upcoming')
    ].join('');
    byId('home-sections').innerHTML = rows || '<div class="empty-state"><h3>No catalogue rows yet</h3><p>Check the Pages Functions configuration or try again shortly.</p></div>';
    const tick = home.trending || [];
    byId('ticker-track').innerHTML = tick.slice(0, 10).map((item, i) => `<button class="ticker-item" type="button" data-open="${escapeHtml(item.key)}"><b>${String(i + 1).padStart(2, '0')}</b>${escapeHtml(item.title)} <span>★ ${item.rating ? item.rating.toFixed(1) : '—'}</span></button>`).join('');
    state.heroItems = (home.trending?.length ? home.trending : state.demo).slice(0, 5);
    renderHero();
  }
  function renderHero() {
    if (!state.heroItems.length) return;
    const item = state.heroItems[state.heroIndex % state.heroItems.length];
    const hero = byId('hero');
    hero.querySelector('.hero-image')?.remove();
    const back = imageUrl(item.backdrop, 'w1280');
    if (back) {
      const img = document.createElement('img'); img.src = back; img.alt = ''; img.className = 'hero-image'; img.loading = 'eager'; img.referrerPolicy = 'no-referrer';
      hero.querySelector('.hero-art').prepend(img);
    }
    byId('hero-title').textContent = item.title;
    byId('hero-description').textContent = item.overview || 'Explore title details, cast, trailers, and provider information.';
    byId('hero-year').textContent = item.year || 'DISCOVER';
    byId('hero-kind').textContent = item.mediaType === 'tv' ? 'FEATURED SERIES' : 'FEATURED FILM';
    byId('hero-rating').textContent = item.rating ? item.rating.toFixed(1) : '—';
    byId('hero-details').dataset.open = item.key;
    byId('hero-save').dataset.save = item.key;
    const saved = state.saved.includes(item.key);
    byId('hero-save').innerHTML = `<span>${saved ? '♥' : '＋'}</span> ${saved ? 'Saved to Watchlist' : 'Add to Watchlist'}`;
    byId('hero-pagination').innerHTML = state.heroItems.map((_, i) => `<button class="hero-dot${i === state.heroIndex ? ' active' : ''}" type="button" data-slide="${i}" aria-label="Show spotlight ${i + 1}"${i === state.heroIndex ? ' aria-current="true"' : ''}></button>`).join('');
    byId('hero-disclaimer').textContent = state.config.tmdbReady ? 'Discovery metadata only · playback requires your authorized source' : 'Fictional sample catalogue · no stream or media source';
  }
  async function loadDemo() {
    try {
      const data = await getJSON('./data/catalog-demo.json');
      state.demo = Array.isArray(data) ? data.map(normalizeDemo) : [];
    } catch { state.demo = []; }
    if (!state.config.tmdbReady) {
      state.home = demoCollections();
      setConnection('TMDB is not configured. No TMDB API call was made; the site is using its fictional local sample catalogue.');
      renderHome();
      if (state.route !== 'home') await routeChanged();
    }
  }
  function langForRegion() { return 'en-US'; }
  function regionalLanguageFilter() { const v = regionConfig()?.original || ''; return v.includes('|') ? '' : v; }
  async function tmdb(path, params = {}) {
    if (!state.config.tmdbReady) throw new Error('TMDB is not configured.');
    return getJSON(urlWithParams(`tmdb/${path}`, params));
  }
  async function loadHomeLive() {
    setConnection('Loading catalogue through the same-origin Pages Function…');
    const common = { language: langForRegion() };
    const jobs = [
      tmdb('trending/all/day', common),
      tmdb('movie/popular', { ...common, page: 1 }),
      tmdb('movie/top_rated', { ...common, page: 1 }),
      tmdb('tv/popular', { ...common, page: 1 }),
      tmdb('movie/upcoming', { ...common, page: 1 }),
      tmdb('genre/movie/list', common),
      tmdb('genre/tv/list', common)
    ];
    if (state.region !== 'GLOBAL') {
      const params = { ...common, region: state.region, sort_by: 'popularity.desc', page: 1 };
      if (regionalLanguageFilter()) params.with_original_language = regionalLanguageFilter();
      params['primary_release_date.lte'] = today();
      jobs.push(tmdb('discover/movie', params));
    }
    const results = await Promise.allSettled(jobs);
    const getList = i => results[i]?.status === 'fulfilled' ? itemsFromResponse(results[i].value) : [];
    const trending = getList(0);
    state.home = {
      trending,
      movies: getList(1),
      top: getList(2),
      shows: getList(3),
      upcoming: getList(4),
      region: state.region === 'GLOBAL' ? getList(1) : getList(7)
    };
    if (results[5]?.status === 'fulfilled') GENRES.movie = results[5].value.genres || GENRES.movie;
    if (results[6]?.status === 'fulfilled') GENRES.tv = results[6].value.genres || GENRES.tv;
    if (!trending.length && !state.home.movies.length) {
      state.home = demoCollections();
      setConnection('TMDB is configured but did not return catalogue data. Showing the local sample while the provider is unavailable.', true);
    } else {
      const failures = results.filter(r => r.status === 'rejected').length;
      setConnection(failures ? `TMDB is connected; ${failures} optional collection(s) could not be loaded. Other available rows remain usable.` : 'TMDB connected through Pages Functions. The API credential stays server-side.');
    }
    saveItems(); renderHome();
    if (state.route !== 'home') await routeChanged();
  }
  function currentGenreList() {
    const which = state.route === 'shows' ? 'tv' : 'movie';
    return GENRES[which] || [];
  }
  function renderGenreFilters() {
    const holder = byId('genre-filters'); if (!holder) return;
    const genres = currentGenreList();
    const buttons = [`<button type="button" class="filter-chip${state.selectedGenre ? '' : ' selected'}" data-genre="">All genres</button>`];
    genres.forEach(g => buttons.push(`<button type="button" class="filter-chip${String(state.selectedGenre) === String(g.id) ? ' selected' : ''}" data-genre="${escapeHtml(g.id)}">${escapeHtml(g.name)}</button>`));
    holder.innerHTML = buttons.join('');
  }
  function routeTitle() { return TITLES[state.route] || 'Discover'; }
  function filterGenre(items) {
    if (!state.selectedGenre) return items;
    const id = Number(state.selectedGenre);
    const name = currentGenreList().find(g => g.id === id)?.name;
    return items.filter(item => (item.genreIds || []).includes(id) || (name && genreNames(item).includes(name)));
  }
  function sortItems(items) {
    const out = [...items];
    if (state.sort === 'vote_average.desc') out.sort((a, b) => b.rating - a.rating || b.voteCount - a.voteCount);
    else if (state.sort === 'release_date.desc') out.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
    else if (state.sort === 'title.asc') out.sort((a, b) => a.title.localeCompare(b.title));
    else out.sort((a, b) => b.popularity - a.popularity);
    return out;
  }
  function fallbackRouteItems() {
    let list = state.demo;
    if (state.route === 'movies') list = list.filter(x => x.mediaType === 'movie');
    else if (state.route === 'shows') list = list.filter(x => x.mediaType === 'tv');
    else if (state.route === 'top-rated') list = [...list].sort((a, b) => b.rating - a.rating);
    else if (state.route === 'upcoming') list = list.filter(x => x.section === 'upcoming');
    else if (state.route === 'trending') list = list.filter(x => x.section === 'trending' || x.rating >= 8.5);
    else if (state.route === 'search') {
      const q = state.query.toLocaleLowerCase();
      list = list.filter(x => [x.title, x.overview, ...genreNames(x)].join(' ').toLocaleLowerCase().includes(q));
    }
    return sortItems(filterGenre(list));
  }
  async function loadCatalog() {
    const catalogRoutes = ['movies', 'shows', 'trending', 'top-rated', 'upcoming', 'search'];
    if (!catalogRoutes.includes(state.route)) return;
    byId('catalog-title').textContent = state.route === 'search' ? `Results for “${state.query}”` : routeTitle();
    byId('catalog-overline').textContent = state.route === 'search' ? 'SEARCH THE CATALOGUE' : `MOVIMOON · ${state.route.toUpperCase()}`;
    byId('catalog-description').textContent = state.route === 'search'
      ? (state.config.tmdbReady ? 'Search results from the catalogue served through Pages Functions.' : 'Matches from this browser’s local sample catalogue.')
      : (state.route === 'trending' ? 'Worldwide TMDB trend ranking; no region filter is applied.' : 'Browse and filter available titles.');
    renderGenreFilters();
    byId('sort-select').value = state.sort;
    byId('page-label').textContent = `Page ${state.page}`;
    let list = [];
    let pages = 1;
    let source = 'Local sample catalogue';
    if (state.config.tmdbReady) {
      try {
        const params = { language: langForRegion(), page: state.page };
        let path = 'movie/popular', forcedType = 'movie';
        if (state.route === 'movies') path = 'movie/popular';
        else if (state.route === 'shows') { path = 'tv/popular'; forcedType = 'tv'; }
        else if (state.route === 'trending') { path = 'trending/all/day'; forcedType = ''; }
        else if (state.route === 'top-rated') path = 'movie/top_rated';
        else if (state.route === 'upcoming') path = 'movie/upcoming';
        else if (state.route === 'search') { path = 'search/multi'; params.query = state.query; forcedType = ''; }
        const response = await tmdb(path, params);
        list = itemsFromResponse(response, forcedType);
        pages = Number(response.total_pages) || 1;
        source = 'TMDB via Pages Functions';
      } catch (err) {
        list = fallbackRouteItems(); source = 'Local fallback · provider unavailable';
        if (err.status === 503) setConnection('TMDB is currently not configured. Showing the fictional local sample instead.', true);
      }
    } else list = fallbackRouteItems();
    state.totalPages = pages;
    state.results = sortItems(filterGenre(list));
    byId('result-count').textContent = `${state.results.length} ${state.results.length === 1 ? 'title' : 'titles'}`;
    byId('results-source').textContent = source;
    byId('page-prev').disabled = state.page <= 1;
    byId('page-next').disabled = state.page >= state.totalPages;
    renderGrid(byId('catalog-grid'), state.results);
    byId('empty-state').hidden = state.results.length > 0;
    saveItems();
  }
  function setSaved(key) {
    if (!getItem(key)) return;
    if (state.saved.includes(key)) { state.saved = state.saved.filter(x => x !== key); toast('Removed from your watchlist.'); }
    else { state.saved = [key, ...state.saved.filter(x => x !== key)].slice(0, 80); toast('Saved in this browser.'); }
    persist(STORE.saved, state.saved); renderSaved(); renderHero();
    if (state.route === 'watchlist') renderWatchlist();
  }
  function remember(key) {
    if (!getItem(key)) return;
    state.history = [key, ...state.history.filter(x => x !== key)].slice(0, 50);
    persist(STORE.history, state.history); renderSaved();
  }
  function renderSaved() {
    byId('watchlist-count').textContent = String(state.saved.length);
    if (state.route === 'watchlist') renderWatchlist();
    if (state.route === 'history') renderHistory();
  }
  function findItems(keys) { return keys.map(getItem).filter(Boolean); }
  function renderWatchlist() {
    const list = findItems(state.saved); renderGrid(byId('watchlist-grid'), list); byId('watchlist-empty').hidden = list.length > 0;
  }
  function renderHistory() {
    const list = findItems(state.history); renderGrid(byId('history-grid'), list); byId('history-empty').hidden = list.length > 0;
  }
  function setPage(route) {
    const allowed = new Set(['home', 'movies', 'shows', 'trending', 'top-rated', 'upcoming', 'watchlist', 'history', 'live', 'blog', 'search', 'about', 'privacy', 'terms', 'disclaimer']);
    const next = allowed.has(route) ? route : 'home';
    if (location.hash !== `#${next}`) location.hash = next;
    else { state.route = next; routeChanged(); }
  }
  function setInfo(route) {
    const data = INFO[route] || INFO.about;
    byId('info-kicker').textContent = data.kicker;
    byId('info-title').textContent = data.title;
    const body = byId('info-body');
    body.innerHTML = `${data.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('')}${data.links ? data.links.map(l => `<p><a href="${escapeHtml(l.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)} ↗</a></p>`).join('') : ''}<p><strong>TMDB attribution:</strong> This product uses the TMDB API but is not endorsed or certified by TMDB.</p><img class="credit-logo" src="./assets/tmdb-logo.svg" alt="The Movie Database (TMDB)">`;
  }
  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(node => node.classList.toggle('active', node.id === pageId));
    const label = state.route === 'article' ? 'Journal article' : (TITLES[state.route] || 'Discover');
    byId('page-title').textContent = label;
    byId('breadcrumb-label').textContent = label;
    document.querySelectorAll('[data-route]').forEach(node => {
      const active = node.dataset.route === state.route || (state.route === 'search' && node.dataset.route === 'movies');
      node.classList.toggle('active', active);
    });
    document.title = `${label} · MoviMoon`;
    byId('main-content').focus({ preventScroll: true });
  }
  async function routeChanged() {
    const hash = location.hash.replace(/^#/, '');
    const [route, arg] = hash.split('/');
    state.route = route || 'home';
    if (state.route === 'search' && arg) { state.query = decodeURIComponent(arg); byId('global-search').value = state.query; }
    if (state.route === 'article' || state.route === 'page') { state.articleSlug = decodeURIComponent(arg || ''); state.articleKind = state.route === 'page' ? 'pages' : 'posts'; showPage('page-article'); await loadArticle(state.articleSlug, state.articleKind); return; }
    if (['about', 'privacy', 'terms', 'disclaimer'].includes(state.route)) { showPage('page-info'); setInfo(state.route); return; }
    if (['movies', 'shows', 'trending', 'top-rated', 'upcoming', 'search'].includes(state.route)) { showPage('page-catalog'); await loadCatalog(); return; }
    if (state.route === 'watchlist') { showPage('page-watchlist'); renderWatchlist(); return; }
    if (state.route === 'history') { showPage('page-history'); renderHistory(); return; }
    if (state.route === 'live') { showPage('page-live'); await loadChannels(); return; }
    if (state.route === 'blog') { showPage('page-blog'); await loadBlog(); return; }
    state.route = 'home'; showPage('page-home'); renderHome();
  }
  async function openDetail(key) {
    let item = getItem(key);
    if (!item) return;
    state.previousRoute = state.route; state.detailKey = key; state.detail = item; state.detailTab = 'overview';
    remember(key);
    if (state.config.tmdbReady && !key.startsWith('demo:')) {
      try { state.detail = await tmdb(`${item.mediaType}/${item.id}`, { language: langForRegion() }); }
      catch { state.detail = item.raw || item; }
    }
    const detail = state.detail || item;
    const date = detail.release_date || detail.first_air_date || item.releaseDate;
    const rating = Number(detail.vote_average || item.rating || 0);
    byId('dialog-title').textContent = detail.title || detail.name || item.title;
    byId('dialog-description').textContent = detail.overview || item.overview || 'No synopsis is available for this title.';
    byId('dialog-meta').innerHTML = `<span>${item.mediaType === 'tv' ? 'SERIES' : 'FILM'}</span><span>•</span><span>${escapeHtml(String(date || '').slice(0, 4) || '—')}</span><span>•</span><span>★ ${rating ? rating.toFixed(1) : '—'}</span>${detail.runtime ? `<span>•</span><span>${escapeHtml(detail.runtime)} min</span>` : ''}`;
    const genres = Array.isArray(detail.genres) ? detail.genres.map(g => typeof g === 'string' ? g : g.name).filter(Boolean) : genreNames(item);
    byId('dialog-genres').innerHTML = genres.map(g => `<span class="filter-chip">${escapeHtml(g)}</span>`).join('');
    const art = byId('dialog-art');
    const backdrop = imageUrl(detail.backdrop_path || item.backdrop, 'w1280');
    art.classList.toggle('has-backdrop', Boolean(backdrop));
    art.style.backgroundImage = backdrop ? `linear-gradient(90deg,rgba(8,12,20,.9),rgba(8,12,20,.05)),url("${backdrop}")` : '';
    byId('dialog-save').textContent = state.saved.includes(key) ? '♥ Saved to Watchlist' : '＋ Add to Watchlist';
    renderDetailTab();
    byId('detail-dialog').showModal();
  }
  function detailTabContent() {
    const detail = state.detail || {};
    const item = getItem(state.detailKey) || {};
    if (state.detailTab === 'cast') {
      const cast = detail.credits?.cast || [];
      return cast.length ? `<ul class="cast-list">${cast.slice(0, 16).map(c => `<li>${escapeHtml(c.name)}${c.character ? ` · ${escapeHtml(c.character)}` : ''}</li>`).join('')}</ul>` : '<p>Cast details are not available for this title.</p>';
    }
    if (state.detailTab === 'trailers') {
      const videos = (detail.videos?.results || []).filter(v => v.site === 'YouTube' && /^[A-Za-z0-9_-]{6,20}$/.test(v.key || '') && /trailer|teaser/i.test(v.type || '')).slice(0, 5);
      if (!videos.length) return '<p>No official trailer record is available from the configured catalogue.</p>';
      return videos.map((v, i) => `<div class="trailer-card"><strong>${escapeHtml(v.name || 'Official trailer')}</strong><br><button class="button button-glass" type="button" data-play-trailer="${escapeHtml(v.key)}" data-trailer-index="${i}">Play trailer</button><a class="text-button" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.key)}" target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a><div id="trailer-frame-${i}"></div></div>`).join('');
    }
    if (state.detailTab === 'providers') {
      if (!regionConfig()) return '<p>Choose a region in the top bar to request provider availability. No default region is inferred.</p>';
      const country = detail['watch/providers']?.results?.[state.region];
      if (!country) return '<p>No provider data is listed for the selected region. Availability can change; use provider links for current details.</p>';
      const providers = [...(country.flatrate || []), ...(country.rent || []), ...(country.buy || [])];
      if (!providers.length) return '<p>No streaming, rent, or purchase providers are listed for this region.</p>';
      const link = /^https:\/\/www\.themoviedb\.org\//.test(country.link || '') ? country.link : 'https://www.themoviedb.org/';
      return `<p>Availability listed by TMDB for ${escapeHtml(regionConfig().label)}. Check the provider’s current terms.</p><ul class="provider-list">${providers.map(p => `<li class="provider-chip"><a href="${link}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.provider_name)} ↗</a></li>`).join('')}</ul>`;
    }
    return `<p>${escapeHtml(detail.overview || item.overview || 'Explore the available title metadata above.')}</p><p>Catalogue metadata is descriptive only and does not confer a right to play or distribute media.</p>`;
  }
  function renderDetailTab() {
    document.querySelectorAll('.detail-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.detailTab === state.detailTab));
    byId('detail-tab-panel').innerHTML = detailTabContent();
    byId('dialog-player').hidden = !state.config.playerConfigured || !state.detailKey || state.detailKey.startsWith('demo:');
  }
  function closeDetail() {
    const dialog = byId('detail-dialog');
    if (dialog.open) dialog.close();
    const frame = byId('detail-player-embed'); if (frame) { frame.src = 'about:blank'; frame.hidden = true; }
    const playerPanel = byId('detail-player-panel'); if (playerPanel) playerPanel.hidden = true;
  }
  async function loadBlog() {
    try {
      const [data, pagesData] = await Promise.all([
        getJSON(`${API}/content?kind=posts&limit=20`),
        getJSON(`${API}/content?kind=pages&limit=20`).catch(() => ({ items: [] }))
      ]);
      const posts = Array.isArray(data.items) ? data.items : [];
      const pages = Array.isArray(pagesData.items) ? pagesData.items : [];
      byId('journal-grid').innerHTML = posts.map(p => `<article class="journal-card"><span class="overline">${escapeHtml((p.labels || []).join(' · ') || 'MOVIMOON JOURNAL')}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.excerpt || '')}</p><button class="text-button" type="button" data-article="${escapeHtml(p.slug)}">Read article →</button></article>`).join('');
      let pageList = byId('cms-page-list');
      if (!pageList) {
        const section = document.createElement('section'); section.className = 'cms-pages';
        section.innerHTML = '<div class="section-head"><div class="section-heading"><span class="section-icon violet">▤</span><div><h3 class="section-title">Site pages</h3><div class="section-subtitle">Static pages from the JSON/D1 content adapter</div></div></div></div><div class="cms-page-list" id="cms-page-list"></div>';
        byId('journal-empty').insertAdjacentElement('beforebegin', section); pageList = byId('cms-page-list');
      }
      pageList.innerHTML = pages.map(p => `<button class="button button-glass" type="button" data-content-page="${escapeHtml(p.slug)}">${escapeHtml(p.title)} →</button>`).join('') || '<p class="page-list-empty">No CMS pages configured.</p>';
      byId('journal-empty').hidden = posts.length > 0 || pages.length > 0;
    } catch { byId('journal-grid').innerHTML = ''; byId('journal-empty').hidden = false; }
  }
  async function loadArticle(slug, kind = 'posts') {
    if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug)) { setPage('blog'); return; }
    try {
      const data = await getJSON(`${API}/${kind}/${encodeURIComponent(slug)}`);
      byId('article-title').textContent = data.title || 'Article';
      byId('article-date').textContent = data.created_at ? new Date(data.created_at).toLocaleDateString() : 'MOVIMOON JOURNAL';
      byId('article-excerpt').textContent = data.excerpt || '';
      byId('article-body').textContent = data.body || '';
      const commentsPanel = document.querySelector('.comments-panel');
      commentsPanel.hidden = kind !== 'posts';
      if (kind === 'posts') await loadComments(slug);
    } catch {
      byId('article-title').textContent = 'Article not found';
      byId('article-excerpt').textContent = 'This page may have moved or the content source is not configured.';
      byId('article-body').textContent = '';
      byId('comments-status').textContent = 'No comments are available.';
    }
  }
  function loadTurnstile() {
    if (state.turnstileLoaded || !state.config.turnstileSiteKey) return;
    state.turnstileLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true; script.defer = true;
    script.onload = () => {
      if (!window.turnstile || !byId('turnstile-widget')) return;
      state.turnstileId = window.turnstile.render('#turnstile-widget', { sitekey: state.config.turnstileSiteKey, theme: 'dark' });
    };
    script.onerror = () => { byId('comments-status').textContent = 'Anti-spam challenge could not load; comments remain unavailable.'; };
    document.head.appendChild(script);
  }
  async function loadComments(slug) {
    byId('comment-list').innerHTML = '';
    const form = byId('comment-form'); form.hidden = !state.config.commentsEnabled;
    if (state.config.commentsEnabled) loadTurnstile();
    try {
      const data = await getJSON(`${API}/comments?postSlug=${encodeURIComponent(slug)}`);
      const comments = Array.isArray(data.comments) ? data.comments : [];
      byId('comment-list').innerHTML = comments.map(c => `<div class="comment-item"><strong>${escapeHtml(c.name)}</strong><span>${escapeHtml(c.body)}</span></div>`).join('');
      byId('comments-status').textContent = state.config.commentsEnabled ? 'Public comments are moderated before publication.' : 'Comments are read-only until the owner configures D1, moderation, and Turnstile.';
    } catch { byId('comments-status').textContent = 'Comments are not available.'; }
  }
  async function submitComment(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const token = window.turnstile && state.turnstileId !== null ? window.turnstile.getResponse(state.turnstileId) : '';
    const formData = new FormData(form);
    try {
      await getJSON(`${API}/comments?postSlug=${encodeURIComponent(state.articleSlug)}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: formData.get('name'), body: formData.get('body'), turnstileToken: token })
      });
      form.reset(); if (window.turnstile && state.turnstileId !== null) window.turnstile.reset(state.turnstileId);
      toast('Comment submitted for moderation.'); await loadComments(state.articleSlug);
    } catch (err) { byId('comments-status').textContent = err.message; }
  }
  async function loadChannels() {
    try {
      const result = await getJSON(`${API}/live/channels`);
      state.channels = result.channels || [];
      byId('channel-note').textContent = result.configured ? `${state.channels.length} authorized channel(s) configured` : 'No authorized player source configured';
      byId('channel-list').innerHTML = state.channels.length ? state.channels.map(c => `<button class="channel-option" type="button" data-channel="${escapeHtml(c.id)}"><span><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.category || 'Live channel')}</small></span></button>`).join('') : '<div class="channel-empty">No channels are bundled. Add only channel definitions you control, then configure an HTTPS player embed template and matching exact origin allow-list.</div>';
      const configured = result.configured && state.channels.length > 0;
      byId('player-placeholder').querySelector('strong').textContent = configured ? 'Choose a channel' : 'Player not configured';
      byId('player-placeholder').querySelector('p').textContent = configured ? 'Selecting a channel will load its allow-listed HTTPS embed.' : 'Add approved channels and an HTTPS embed template in the setup guide.';
    } catch { byId('channel-note').textContent = 'Channel configuration unavailable'; }
  }
  async function openChannel(id) {
    const placeholder = byId('player-placeholder');
    try {
      const data = await getJSON(`${API}/player-config?channel=${encodeURIComponent(id)}`);
      if (!data.enabled || !/^https:\/\//.test(data.src || '')) throw new Error(data.message || 'Player configuration is not available.');
      const iframe = byId('player-embed');
      iframe.src = data.src; iframe.title = `Authorized live player — ${data.item.title}`; iframe.hidden = false; placeholder.hidden = true;
      byId('player-caption').textContent = `Configured source for ${data.item.title}. The player is supplied by the site operator.`;
      document.querySelectorAll('.channel-option').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.channel === id)));
    } catch (err) {
      placeholder.hidden = false; placeholder.querySelector('strong').textContent = 'Player unavailable'; placeholder.querySelector('p').textContent = err.message;
      byId('player-embed').src = 'about:blank'; byId('player-embed').hidden = true;
      byId('player-caption').textContent = 'No third-party frame was loaded.';
    }
  }
  function ensureTitlePlayerPanel(item) {
    let panel = byId('detail-player-panel');
    if (!panel) {
      panel = document.createElement('section'); panel.id = 'detail-player-panel'; panel.className = 'detail-player-panel'; panel.hidden = true;
      const controls = document.createElement('div'); controls.id = 'detail-player-controls'; controls.className = 'episode-controls';
      for (const [id, labelText, max] of [['dialog-season', 'Season', '999'], ['dialog-episode', 'Episode', '9999']]) {
        const label = document.createElement('label'); label.textContent = `${labelText} `;
        const input = document.createElement('input'); input.id = id; input.type = 'number'; input.min = '1'; input.max = max; input.value = '1'; input.inputMode = 'numeric';
        label.append(input); controls.append(label);
      }
      const status = document.createElement('p'); status.id = 'detail-player-status'; status.textContent = 'Playback source is configured by the site owner.';
      const frame = document.createElement('iframe'); frame.id = 'detail-player-embed'; frame.title = 'Authorized configured player'; frame.hidden = true; frame.src = 'about:blank';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin'); frame.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture'); frame.setAttribute('allowfullscreen', '');
      panel.append(controls, status, frame);
      byId('dialog-save').parentElement.insertAdjacentElement('afterend', panel);
    }
    byId('detail-player-controls').hidden = item.mediaType !== 'tv';
    panel.hidden = false;
    return panel;
  }
  async function openConfiguredTitlePlayer() {
    const item = getItem(state.detailKey); if (!item) return;
    const panel = ensureTitlePlayerPanel(item);
    const status = byId('detail-player-status');
    status.textContent = 'Checking the configured player…';
    const season = item.mediaType === 'tv' ? (Number(byId('dialog-season').value) || 1) : '';
    const episode = item.mediaType === 'tv' ? (Number(byId('dialog-episode').value) || 1) : '';
    const params = new URLSearchParams({ mediaType: item.mediaType, mediaId: item.id });
    if (season) params.set('season', String(season)); if (episode) params.set('episode', String(episode));
    try {
      const data = await getJSON(`${API}/player-config?${params}`);
      if (!data.enabled || !/^https:\/\//.test(data.src || '')) throw new Error(data.message || 'No authorized player is configured.');
      const frame = byId('detail-player-embed'); frame.src = data.src; frame.hidden = false;
      status.textContent = 'Loaded the configured HTTPS player. Playback availability and rights are the operator’s responsibility.';
    } catch (err) {
      byId('detail-player-embed').src = 'about:blank'; byId('detail-player-embed').hidden = true;
      status.textContent = err.message;
    }
  }
  function playTrailer(button) {
    const key = button.dataset.playTrailer || '';
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(key)) return;
    const index = button.dataset.trailerIndex;
    const host = byId(`trailer-frame-${index}`); if (!host) return;
    host.innerHTML = `<iframe class="trailer-frame" title="YouTube trailer" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(key)}?autoplay=1" sandbox="allow-scripts allow-presentation" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }
  async function runSearch(query) {
    state.query = query.trim(); state.page = 1; state.selectedGenre = '';
    if (!state.query) return;
    state.route = 'search';
    const targetHash = `search/${encodeURIComponent(state.query)}`;
    if (location.hash !== `#${targetHash}`) location.hash = targetHash; else await routeChanged();
  }
  async function suggestions(query) {
    const box = byId('search-suggestions');
    if (query.trim().length < 2) { box.hidden = true; box.innerHTML = ''; return; }
    let list = [];
    if (state.config.tmdbReady) {
      try { const data = await tmdb('search/multi', { query: query.trim(), language: langForRegion(), page: 1 }); list = itemsFromResponse(data).slice(0, 5); }
      catch { list = []; }
    } else {
      const q = query.toLocaleLowerCase(); list = state.demo.filter(x => x.title.toLocaleLowerCase().includes(q)).slice(0, 5);
    }
    box.innerHTML = list.map(item => `<button type="button" class="suggestion-item" data-open="${escapeHtml(item.key)}"><span>${escapeHtml(item.title)}</span><small>${item.mediaType === 'tv' ? 'TV' : 'Movie'} · ${escapeHtml(item.year || '—')}</small></button>`).join('') || '<div class="suggestion-item suggestion-empty">No quick matches</div>';
    box.hidden = false;
  }
  function safeTrailerId(target) { return target.closest('[data-play-trailer]'); }
  function closeSidebar() { byId('sidebar').classList.remove('open'); byId('sidebar-scrim').classList.remove('show'); byId('menu-button').setAttribute('aria-expanded', 'false'); }
  function onClick(event) {
    const target = event.target;
    const route = target.closest('[data-route]');
    if (route) { event.preventDefault(); setPage(route.dataset.route); closeSidebar(); return; }
    const article = target.closest('[data-article]'); if (article) { location.hash = `article/${encodeURIComponent(article.dataset.article)}`; return; }
    const contentPage = target.closest('[data-content-page]'); if (contentPage) { location.hash = `page/${encodeURIComponent(contentPage.dataset.contentPage)}`; return; }
    const open = target.closest('[data-open]'); if (open) { byId('search-suggestions').hidden = true; openDetail(open.dataset.open); return; }
    const save = target.closest('[data-save]'); if (save) { event.stopPropagation(); setSaved(save.dataset.save); return; }
    const genre = target.closest('[data-genre]'); if (genre) { state.selectedGenre = genre.dataset.genre; state.page = 1; loadCatalog(); return; }
    const slide = target.closest('[data-slide]'); if (slide) { state.heroIndex = Number(slide.dataset.slide) || 0; renderHero(); return; }
    const tab = target.closest('[data-detail-tab]'); if (tab) { state.detailTab = tab.dataset.detailTab; renderDetailTab(); return; }
    const trailer = safeTrailerId(target); if (trailer) { playTrailer(trailer); return; }
    const channel = target.closest('[data-channel]'); if (channel) { openChannel(channel.dataset.channel); return; }
    if (target.closest('#hero-details')) { const key = byId('hero-details').dataset.open; if (key) openDetail(key); return; }
    if (target.closest('#hero-save')) { const key = byId('hero-save').dataset.save; if (key) setSaved(key); return; }
    if (target.closest('#dialog-save')) { setSaved(state.detailKey); byId('dialog-save').textContent = state.saved.includes(state.detailKey) ? '♥ Saved to Watchlist' : '＋ Add to Watchlist'; return; }
    if (target.closest('#dialog-player')) { openConfiguredTitlePlayer(); return; }
    if (target.closest('#dialog-close')) { closeDetail(); return; }
    if (target.closest('#clear-history')) { state.history = []; persist(STORE.history, []); renderHistory(); return; }
    if (target.closest('#clear-filters') || target.closest('#empty-reset')) { state.selectedGenre = ''; state.page = 1; state.query = ''; byId('global-search').value = ''; loadCatalog(); return; }
    if (target.closest('#page-prev') && state.page > 1) { state.page -= 1; loadCatalog(); return; }
    if (target.closest('#page-next') && state.page < state.totalPages) { state.page += 1; loadCatalog(); return; }
    if (target.closest('#about-shortcut')) { setPage('about'); return; }
    if (target.closest('#menu-button')) { const side = byId('sidebar'); const opened = side.classList.toggle('open'); byId('sidebar-scrim').classList.toggle('show', opened); byId('menu-button').setAttribute('aria-expanded', String(opened)); return; }
    if (target.closest('#sidebar-scrim')) { closeSidebar(); return; }
    const emptyReset = target.closest('#empty-reset'); if (emptyReset) { state.selectedGenre = ''; loadCatalog(); }
  }
  async function onSubmit(event) {
    if (event.target.id === 'search-form') {
      event.preventDefault(); byId('search-suggestions').hidden = true; await runSearch(byId('global-search').value); return;
    }
    if (event.target.id === 'comment-form') await submitComment(event);
  }
  async function onChange(event) {
    if (event.target.id === 'region-select') {
      const value = event.target.value;
      state.region = value === 'GLOBAL' || REGION[value] ? value : 'GLOBAL';
      try { localStorage.setItem(STORE.region, state.region); } catch { /* current selection still applies */ }
      if (state.config.tmdbReady) await loadHomeLive();
      else { state.home = demoCollections(); renderHome(); setConnection(`No TMDB secret configured. ${regionConfig()?.label || 'Global'} is saved locally; the fictional sample remains active.`); }
      if (['movies', 'shows', 'trending', 'top-rated', 'upcoming', 'search'].includes(state.route)) await loadCatalog();
    }
    if (event.target.id === 'sort-select') { state.sort = event.target.value; state.page = 1; loadCatalog(); }
  }
  function installEvents() {
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('change', onChange);
    window.addEventListener('hashchange', routeChanged);
    byId('global-search').addEventListener('input', () => {
      clearTimeout(state.searchTimer); const value = byId('global-search').value;
      state.searchTimer = setTimeout(() => suggestions(value), 250);
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('#search-form')) byId('search-suggestions').hidden = true;
    });
    byId('detail-dialog').addEventListener('click', event => { if (event.target === byId('detail-dialog')) closeDetail(); });
    byId('detail-dialog').addEventListener('close', () => { const f = byId('detail-player-embed'); if (f) { f.src = 'about:blank'; f.hidden = true; } });
    byId('region-select').value = REGION[state.region] ? state.region : 'GLOBAL';
  }
  async function init() {
    hydrateItems();
    byId('current-year').textContent = String(new Date().getFullYear());
    installEvents();
    await loadDemo();
    try {
      state.config = { ...state.config, ...(await getJSON(`${API}/config`)) };
    } catch { setConnection('Pages Functions configuration is unavailable. The local sample and browser-only controls remain usable.', true); }
    if (state.config.tmdbReady) await loadHomeLive();
    else {
      state.home = demoCollections(); renderHome();
      setConnection('TMDB is not configured. No TMDB API call was made; the fictional local sample catalogue is active. Add a Pages Function secret to enable live search and catalogue data.');
      await routeChanged();
    }
    renderSaved();
    if (location.hash && location.hash !== '#home') await routeChanged();
  }
  init();
})();
