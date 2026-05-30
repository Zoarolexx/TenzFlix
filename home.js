// ==================== HOME PAGE ====================

async function loadHome() {
    const app = document.getElementById("app");
    app.innerHTML = `<div id="heroContainer"></div><div id="homeSections"></div>`;
    await renderHomeContent();
}

async function renderHomeContent() {
    const homeDiv = document.getElementById("homeSections");
    if(!homeDiv) return;
    homeDiv.innerHTML = `<div class="row">${renderSkeletonGrid(8)}</div>`;
    try {
        const trendAll = await fetchTMDB('/trending/all/day?page=1');
        const heroItem = trendAll.results.find(x => (x.media_type === "movie" || x.media_type === "tv") && x.backdrop_path);
        if(heroItem) renderHero(heroItem);
        
        const sections = [
            { title: "Trending Movies", endpoint: "/trending/movie/week?page=1", type: "movie" },
            { title: "Trending TV Shows", endpoint: "/trending/tv/week?page=1", type: "tv" },
            { title: "Top Rated Movies", endpoint: "/movie/top_rated?page=1", type: "movie" },
            { title: "Top Rated TV Shows", endpoint: "/tv/top_rated?page=1", type: "tv" }
        ];
        
        let finalHtml = "";
        const hist = getHistory();
        if(hist.length > 0) {
            finalHtml += `<div class="section"><div class="sec-head"><div class="sec-title"><i class="fas fa-play-circle" style="color:var(--primary);"></i> Lanjutkan Menonton</div></div><div class="row">${hist.slice(0,10).map(x => {
                const memoryKey = `${x.media_type || 'movie'}-${x.id}`;
                itemMemoryCache.set(memoryKey, x);
                const statusTrack = x.lastSeason ? `S${x.lastSeason} EP${x.lastEpisode}` : (x.media_type === 'tv' ? 'Series' : 'Film');
                return `<div class="card" onclick="resumeWatch('${memoryKey}', ${x.lastSeason || null}, ${x.lastEpisode || null})">
                    <div class="poster-wrap"><button class="trash-btn" onclick="event.stopPropagation(); deleteHistoryItem(${x.id}, '${x.media_type || 'movie'}')"><i class="fas fa-trash-alt"></i></button>
                    <div class="badge" style="background:var(--primary);">${statusTrack}</div>
                    <img class="poster" src="${img(x.poster_path)}" onerror="this.src='${FALLBACK}';" loading="lazy"></div>
                    <div class="card-body"><div class="card-title">${esc(x.title)}</div><div class="card-date">${x.trackTime || 'Baru saja'}</div></div>
                </div>`;
            }).join("")}</div></div>`;
        }
        
        for(const sec of sections) {
            const data = await fetchTMDB(sec.endpoint);
            const results = data.results.filter(x => x.poster_path).slice(0,20);
            finalHtml += `<div class="section"><div class="sec-head"><div class="sec-title">${sec.title}</div></div><div class="row">${results.map(x => renderCard({ ...x, media_type: sec.type })).join("")}</div></div>`;
        }
        homeDiv.innerHTML = finalHtml;
    } catch(err) { homeDiv.innerHTML = `<div class="loading">Gagal memuat konten</div>`; }
}

function renderHero(item) {
    const type = item.media_type || (item.first_air_date ? "tv" : "movie");
    const title = item.title || item.name;
    const date = (item.release_date || item.first_air_date || "----").slice(0,4);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : "0";
    const heroContainer = document.getElementById("heroContainer");
    if(heroContainer) {
        heroContainer.innerHTML = `<div class="hero-banner"><img class="hero-bg" src="${backdrop(item.backdrop_path)}" onerror="this.src='${FALLBACK}'"><div class="hero-overlay"></div><div class="hero-content"><div class="hero-badge">${type === 'tv' ? 'TV SERIES' : 'MOVIE'}</div><div class="hero-title">${esc(title)}</div><div class="hero-meta"><span class="hero-rating"><i class="fas fa-star"></i> ${rating}</span><span>${date}</span></div><div class="hero-desc">${esc(item.overview ? item.overview.substring(0,150) + '...' : 'Tidak ada sinopsis')}</div><button class="hero-btn" onclick="router.navigate('/${type}/${item.id}')"><i class="fas fa-play"></i> Tonton Sekarang</button></div></div>`;
    }
}

async function loadMovies() {
    const app = document.getElementById("app");
    app.innerHTML = `<div class="grid" id="moviesGrid">${renderSkeletonGrid(20)}</div>`;
    try {
        const data = await fetchTMDB("/movie/popular?page=1");
        const grid = document.getElementById("moviesGrid");
        if(grid) grid.innerHTML = data.results.filter(x => x.poster_path).map(x => renderCard({ ...x, media_type: "movie" })).join("");
    } catch(err) { console.error(err); }
}

async function loadSeries() {
    const app = document.getElementById("app");
    app.innerHTML = `<div class="grid" id="seriesGrid">${renderSkeletonGrid(20)}</div>`;
    try {
        const data = await fetchTMDB("/tv/popular?page=1");
        const grid = document.getElementById("seriesGrid");
        if(grid) grid.innerHTML = data.results.filter(x => x.poster_path).map(x => renderCard({ ...x, media_type: "tv" })).join("");
    } catch(err) { console.error(err); }
}

function deleteHistoryItem(id, mediaType) {
    let hist = getHistory();
    hist = hist.filter(x => !(x.id == id && (x.media_type || "movie") === mediaType));
    saveHistory(hist);
    if(window.location.pathname === "/home") loadHome();
    else if(window.location.pathname === "/history") loadHistory();
}

function resumeWatch(memoryKey, season, episode) {
    const item = itemMemoryCache.get(memoryKey);
    if(!item) return;
    if(season && episode) router.navigate(`/watch/${item.media_type || 'tv'}/${item.id}/season/${season}/episode/${episode}`);
    else router.navigate(`/watch/${item.media_type || 'movie'}/${item.id}`);
}