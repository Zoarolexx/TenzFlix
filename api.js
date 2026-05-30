// ==================== API CONFIGURATION ====================
const API_KEY = "5a61a8e1df2f614dc83609925720c35d";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";
const BACKDROP = "https://image.tmdb.org/t/p/original";
const FALLBACK = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500";

const SERVERS = {
    peachify: { movie: id => `https://peachify.top/embed/movie/${id}`, tv: (id, s, e) => `https://peachify.top/embed/tv/${id}/${s}/${e}` },
    vidplays: { movie: id => `https://vidplays.fun/embed/movie/${id}`, tv: (id, s, e) => `https://vidplays.fun/embed/tv/${id}/${s}/${e}` },
    xpass: { movie: id => `https://play.xpass.top/e/movie/${id}`, tv: (id, s, e) => `https://play.xpass.top/e/tv/${id}/${s}/${e}` },
    vidsrc: { movie: id => `https://vidsrc.to/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
    embedsu: { movie: id => `https://embed.su/embed/movie/${id}`, tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}` },
    vidlink: { movie: id => `https://vidlink.pro/movie/${id}`, tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` }
};

// Global Variables
let currentItem = null;
let currentServer = "peachify";
let currentSeason = 1;
let currentEpisode = 1;
let searchAbortController = null;
let detailAbortController = null;
const itemMemoryCache = new Map();

// Storage Keys
const CACHE_PREFIX = "tenzflix_cache_";
const CACHE_TTL = 24 * 60 * 60 * 1000;
const FAV_KEY = "tenzflix_favs";
const HIST_KEY = "tenzflix_history";

// Cache Functions
function setCache(key, data) {
    if(itemMemoryCache.size > 200) itemMemoryCache.clear();
    const cachePayload = JSON.stringify({ timestamp: Date.now(), payload: data });
    try { localStorage.setItem(CACHE_PREFIX + key, cachePayload); } catch(e) { console.warn("Cache error"); }
}

function getCache(key) {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if(!cached) return null;
        const cacheObj = JSON.parse(cached);
        if(Date.now() - cacheObj.timestamp > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + key); return null; }
        return cacheObj.payload;
    } catch(e) { return null; }
}

function clearAppCache() {
    if(confirm("Hapus semua cache?")) {
        for(let i=0; i<localStorage.length; i++) {
            const k = localStorage.key(i);
            if(k && k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
        }
        itemMemoryCache.clear();
        alert("Cache dibersihkan!");
        window.location.href = "/home";
    }
}

// Favorites Functions
function getFavs(){ return JSON.parse(localStorage.getItem(FAV_KEY)||"[]"); }
function saveFavs(data){ localStorage.setItem(FAV_KEY,JSON.stringify(data)); }
function isFav(id, mediaType){ return getFavs().some(x => x.id == id && (x.media_type || "movie") === (mediaType || "movie")); }

// History Functions
function getHistory(){ return JSON.parse(localStorage.getItem(HIST_KEY)||"[]"); }
function saveHistory(data){ localStorage.setItem(HIST_KEY,JSON.stringify(data)); }

function addToHistory(item, season = null, episode = null){
    let hist = getHistory();
    const type = item.type || item.media_type || "movie";
    hist = hist.filter(x => !(x.id == item.id && (x.media_type || "movie") === type));
    hist.unshift({
        id: item.id, media_type: type, title: item.title || item.name, poster_path: item.poster_path,
        vote_average: item.vote_average, lastSeason: season, lastEpisode: episode,
        trackTime: new Date().toLocaleDateString('id-ID', {day:'numeric', month:'short'})
    });
    if(hist.length > 30) hist.pop();
    saveHistory(hist);
}

// TMDB API Functions
async function fetchTMDB(endpoint, signal = null) {
    const localData = getCache(endpoint);
    if(localData) return localData;
    const url = `${BASE_URL}${endpoint}${endpoint.includes("?")?"&":"?"}api_key=${API_KEY}`;
    const options = signal ? { signal } : {};
    const res = await fetch(url, options);
    if(!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    setCache(endpoint, data);
    return data;
}

// Helper Functions
function img(path){ return path ? IMG + path : FALLBACK; }
function backdrop(path){ return path ? BACKDROP + path : FALLBACK; }
function esc(text){ return text ? String(text).replace(/</g,"&lt;").replace(/>/g,"&gt;") : ""; }

// Render Helpers
function renderCard(item) {
    const type = item.media_type || item.type || "movie";
    const memoryKey = `${type}-${item.id}`;
    itemMemoryCache.set(memoryKey, item);
    const title = item.title || item.name;
    const date = (item.release_date || item.first_air_date || "----").slice(0,4);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : "0";
    const fav = isFav(item.id, type);
    return `
        <div class="card" onclick="router.navigate('/${type}/${item.id}')">
            <div class="poster-wrap">
                <button class="fav-btn ${fav ? 'active' : ''}" data-fav-trigger="${memoryKey}" onclick="quickFav(event, '${memoryKey}')"><i class="fa-${fav ? 'solid' : 'regular'} fa-heart"></i></button>
                <div class="badge ${type}">${type.toUpperCase()}</div>
                <img class="poster" src="${img(item.poster_path)}" onerror="this.onerror=null; this.src='${FALLBACK}';" loading="lazy">
            </div>
            <div class="card-body">
                <div class="card-title">${esc(title)}</div>
                <div class="card-date">${date}</div>
                <div class="card-rating"><i class="fas fa-star"></i> ${rating}</div>
            </div>
        </div>
    `;
}

function renderSkeletonGrid(count = 8) {
    let html = '';
    for(let i=0;i<count;i++) html += `<div class="card"><div class="poster-wrap"><div class="sk-item sk-card"></div></div><div class="card-body"><div class="sk-text"></div><div class="sk-text" style="width:60%"></div></div></div>`;
    return html;
}

function quickFav(e, memoryKey) {
    e.stopPropagation();
    const item = itemMemoryCache.get(memoryKey);
    if(!item) return;
    let favs = getFavs();
    const type = item.media_type || "movie";
    if(isFav(item.id, type)) favs = favs.filter(x => !(x.id == item.id && (x.media_type || "movie") === type));
    else favs.unshift({ id: item.id, media_type: type, title: item.title || item.name, poster_path: item.poster_path });
    saveFavs(favs);
    const btns = document.querySelectorAll(`[data-fav-trigger="${memoryKey}"]`);
    const active = isFav(item.id, type);
    btns.forEach(btn => {
        btn.classList.toggle("active", active);
        btn.innerHTML = `<i class="fa-${active ? 'solid' : 'regular'} fa-heart"></i>`;
    });
}