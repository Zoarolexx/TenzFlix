// ==================== WATCH PAGE ====================

async function loadWatchMovie(params) {
    try {
        const data = await fetchTMDB(`/movie/${params.id}`);
        currentItem = { ...data, type: "movie", title: data.title };
        currentSeason = 1;
        currentEpisode = 1;
        renderWatchPage();
    } catch(err) { console.error(err); }
}

async function loadWatchTv(params) {
    currentSeason = params.season || 1;
    currentEpisode = params.episode || 1;
    try {
        const data = await fetchTMDB(`/tv/${params.id}`);
        currentItem = { ...data, type: "tv", title: data.name };
        if(!currentItem.seasons) currentItem.seasons = data.seasons;
        renderWatchPage();
    } catch(err) { console.error(err); }
}

function renderWatchPage() {
    const app = document.getElementById("app");
    if(!currentItem) { app.innerHTML = `<div class="loading">Memuat...</div>`; return; }
    
    const isMovie = currentItem.type === "movie";
    const serversHtml = Object.keys(SERVERS).map(s => `<button class="srv-btn ${currentServer === s ? 'active' : ''}" onclick="changeServer('${s}', this)">${s.toUpperCase()}</button>`).join("");
    
    app.innerHTML = `
        <div class="watch-container" id="watchContainer">
            <div class="player-wrapper" id="playerWrap">
                <iframe id="player" class="player-frame" allowfullscreen></iframe>
            </div>
            <div class="watch-controls">
                <div class="watch-back" onclick="router.navigate('/home')"><i class="fas fa-arrow-left"></i></div>
                <div class="server-selector">${serversHtml}</div>
            </div>
            <button class="sidebar-toggle" onclick="toggleSidebar()"><i class="fas fa-list"></i></button>
            <div class="watch-sidebar" id="watchSidebar">
                <div style="margin-bottom:20px;"><select id="watchSeasonSelect" class="ep-select" style="width:100%;" onchange="changeWatchSeason(this.value)">${isMovie ? '' : getSeasonOptions()}</select></div>
                <div id="watchEpList"></div>
            </div>
            <div id="playerLoader" style="position:fixed; bottom:20px; left:20px; background:rgba(0,0,0,0.8); padding:8px 16px; border-radius:30px; display:none; z-index:15;"><span id="loaderTxt">Menghubungkan ke server...</span></div>
        </div>
        <div style="padding:20px 4%; background:var(--dark);"><h2>${esc(currentItem.title)}${!isMovie ? ` — S${currentSeason} E${currentEpisode}` : ''}</h2><p style="color:#aaa;">${esc(currentItem.overview || '')}</p></div>
    `;
    updatePlayer();
    if(!isMovie) { addToHistory(currentItem, currentSeason, currentEpisode); loadWatchEpisodes(currentSeason); }
    else addToHistory(currentItem);
}

function getSeasonOptions() {
    let html = '';
    if(currentItem.seasons) {
        currentItem.seasons.filter(s => s.season_number > 0).forEach(s => html += `<option value="${s.season_number}" ${currentSeason === s.season_number ? 'selected' : ''}>Season ${s.season_number}</option>`);
    } else {
        for(let i=1; i<=(currentItem.number_of_seasons||1); i++) html += `<option value="${i}" ${currentSeason === i ? 'selected' : ''}>Season ${i}</option>`;
    }
    return html;
}

async function loadWatchEpisodes(season) {
    const wrap = document.getElementById("watchEpList");
    if(!wrap) return;
    wrap.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>`;
    try {
        const data = await fetchTMDB(`/tv/${currentItem.id}/season/${season}`);
        const epsList = data.episodes || [];
        wrap.innerHTML = `<div class="ep-grid">${epsList.map(ep => `
            <div class="ep-card ${currentEpisode === ep.episode_number ? 'active-playing' : ''}" onclick="playEpisode(${ep.episode_number})">
                <div class="ep-thumb-wrap"><img class="ep-thumb" src="${img(ep.still_path)}" onerror="this.src='${FALLBACK}';" loading="lazy"><div class="ep-play-overlay"><i class="fas fa-play"></i></div></div>
                <div class="ep-body"><div class="ep-num">EPISODE ${ep.episode_number}</div><div class="ep-name">${esc(ep.name)}</div></div>
            </div>
        `).join('')}</div>`;
    } catch(err) { wrap.innerHTML = `<div class="loading">Gagal memuat episode</div>`; }
}

function playEpisode(ep) {
    currentEpisode = parseInt(ep);
    updatePlayer();
    document.querySelectorAll("#watchEpList .ep-card").forEach(c => c.classList.remove("active-playing"));
    document.querySelector(`#watchEpList .ep-card[onclick*="${ep}"]`)?.classList.add("active-playing");
}

function changeWatchSeason(season) {
    currentSeason = parseInt(season);
    currentEpisode = 1;
    loadWatchEpisodes(currentSeason);
    updatePlayer();
}

function updatePlayer() {
    const loader = document.getElementById("playerLoader");
    if(loader) loader.style.display = "flex";
    const loaderTxt = document.getElementById("loaderTxt");
    if(loaderTxt) loaderTxt.innerText = `Menghubungkan ke server [${currentServer.toUpperCase()}]...`;
    const player = document.getElementById("player");
    if(player) {
        const src = currentItem.type === "movie" ? SERVERS[currentServer].movie(currentItem.id) : SERVERS[currentServer].tv(currentItem.id, currentSeason, currentEpisode);
        player.src = src;
        player.onload = () => { if(loader) loader.style.display = "none"; };
    }
}

function changeServer(server, el) {
    currentServer = server;
    document.querySelectorAll(".srv-btn").forEach(b => b.classList.remove("active"));
    if(el) el.classList.add("active");
    updatePlayer();
}

function toggleSidebar() {
    document.getElementById("watchContainer").classList.toggle("sidebar-open");
}