// ==================== DETAIL PAGE ====================

async function loadMovieDetail(params) { await loadDetail(params.id, "movie"); }
async function loadTvDetail(params) { await loadDetail(params.id, "tv"); }

async function loadDetail(id, type) {
    const app = document.getElementById("app");
    app.innerHTML = `<div class="detail-backdrop"><img id="detailBackdrop" alt="Backdrop"></div>
        <div class="detail-content"><img id="detailPoster" class="detail-poster"><div id="detailBadges"></div>
        <h1 id="detailTitle" style="font-size:28px; font-weight:700; margin-bottom:15px;"></h1>
        <p id="detailOverview" style="color:#ccc; line-height:1.6; margin-bottom:20px;"></p>
        <button id="detailFavBtn" class="hero-btn" style="background:#333; margin-right:10px;"><i class="far fa-heart"></i> Simpan</button>
        <button id="watchNowBtn" class="hero-btn"><i class="fas fa-play"></i> Tonton</button>
        <div id="detailCast" style="margin-top: 30px;"></div><div id="detailEpisodes" style="margin-top: 30px;"></div></div>`;
    
    try {
        if(detailAbortController) detailAbortController.abort();
        detailAbortController = new AbortController();
        const signal = detailAbortController.signal;
        const data = await fetchTMDB(`/${type}/${id}`, signal);
        currentItem = { ...data, type, title: data.title || data.name };
        
        document.getElementById("detailBackdrop").src = backdrop(data.backdrop_path);
        document.getElementById("detailPoster").src = img(data.poster_path);
        document.getElementById("detailTitle").innerHTML = esc(data.title || data.name);
        document.getElementById("detailOverview").innerHTML = esc(data.overview || "Tidak ada sinopsis resmi.");
        
        let badges = `<div class="dbadge">⭐ ${data.vote_average?.toFixed(1) || "0"}</div><div class="dbadge">${type.toUpperCase()}</div><div class="dbadge">${(data.release_date || data.first_air_date || "----").slice(0,4)}</div>`;
        if(type === "tv") badges += `<div class="dbadge">${data.number_of_seasons} Season</div><div class="dbadge">${data.number_of_episodes} Ep</div>`;
        document.getElementById("detailBadges").innerHTML = badges;
        
        const credits = await fetchTMDB(`/${type}/${id}/credits`, signal);
        if(credits && credits.cast && credits.cast.length > 0) {
            let castHtml = `<div class="sec-title" style="font-size:18px; margin-bottom:12px;">Pemeran Utama</div><div class="cast-row">`;
            credits.cast.slice(0,15).forEach(c => {
                castHtml += `<div class="cast-item"><img class="cast-img" src="${img(c.profile_path)}" onerror="this.src='${FALLBACK}';" loading="lazy"><div class="cast-name">${esc(c.name)}</div><div class="cast-char">${esc(c.character)}</div></div>`;
            });
            document.getElementById("detailCast").innerHTML = castHtml + `</div>`;
        }
        
        if(type === "tv" && data.seasons && data.seasons.length > 0) {
            let seasonHtml = `<div class="sec-title" style="font-size:18px; margin-bottom:12px;">Daftar Season:</div><select class="ep-select" id="seasonSelect" style="margin-bottom:20px;">`;
            data.seasons.filter(s => s.season_number > 0).forEach(s => seasonHtml += `<option value="${s.season_number}">Season ${s.season_number}</option>`);
            seasonHtml += `</select><div id="detailEpList"></div>`;
            document.getElementById("detailEpisodes").innerHTML = seasonHtml;
            const seasonSelect = document.getElementById("seasonSelect");
            if(seasonSelect) {
                seasonSelect.onchange = () => loadDetailEpisodes(id, seasonSelect.value);
                const firstSeason = data.seasons.find(s => s.season_number > 0)?.season_number || 1;
                await loadDetailEpisodes(id, firstSeason);
            }
        }
        
        updateDetailFavBtn();
        document.getElementById("watchNowBtn").onclick = () => router.navigate(`/watch/${type}/${id}`);
        document.getElementById("detailFavBtn").onclick = () => toggleDetailFav();
    } catch(err) { console.error(err); }
}

async function loadDetailEpisodes(id, season) {
    const wrap = document.getElementById("detailEpList");
    if(!wrap) return;
    wrap.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Memuat episode...</div>`;
    try {
        const data = await fetchTMDB(`/tv/${id}/season/${season}`);
        const epsList = data.episodes || [];
        wrap.innerHTML = `<div class="ep-grid">${epsList.map(ep => `
            <div class="ep-card" onclick="router.navigate('/watch/tv/${id}/season/${season}/episode/${ep.episode_number}')">
                <div class="ep-thumb-wrap"><img class="ep-thumb" src="${img(ep.still_path)}" onerror="this.src='${FALLBACK}';" loading="lazy"><div class="ep-play-overlay"><i class="fas fa-play"></i></div></div>
                <div class="ep-body"><div class="ep-num">EPISODE ${ep.episode_number}</div><div class="ep-name">${esc(ep.name)}</div><div class="ep-desc">${esc(ep.overview?.substring(0,100) || 'Tidak ada deskripsi')}</div></div>
            </div>
        `).join('')}</div>`;
    } catch(err) { wrap.innerHTML = `<div class="loading">Gagal memuat episode</div>`; }
}

function toggleDetailFav() {
    if(!currentItem) return;
    let favs = getFavs();
    const type = currentItem.type;
    if(isFav(currentItem.id, type)) favs = favs.filter(x => !(x.id == currentItem.id && (x.media_type || "movie") === type));
    else favs.unshift({ id: currentItem.id, media_type: type, title: currentItem.title, poster_path: currentItem.poster_path });
    saveFavs(favs);
    updateDetailFavBtn();
}

function updateDetailFavBtn() {
    const btn = document.getElementById("detailFavBtn");
    if(!btn || !currentItem) return;
    const active = isFav(currentItem.id, currentItem.type);
    btn.classList.toggle("active", active);
    btn.innerHTML = `<i class="fa-${active ? "solid" : "regular"} fa-heart"></i> ${active ? "Di Daftar Saya" : "Simpan"}`;
}