// ==================== HISTORY PAGE ====================

async function loadHistory() {
    const app = document.getElementById("app");
    const hist = getHistory();
    app.innerHTML = `<div class="grid" id="historyGrid"></div><div id="historyEmpty" class="loading" style="display:${hist.length ? 'none' : 'flex'};"><i class="fas fa-history"></i><p>Belum ada riwayat</p></div><div style="text-align:center; margin:20px 0;"><button class="hero-btn" onclick="clearAllHistory()" style="background:#444;"><i class="fas fa-trash-alt"></i> Hapus Semua Riwayat</button></div>`;
    const grid = document.getElementById("historyGrid");
    if(grid && hist.length) {
        grid.innerHTML = hist.map(x => {
            const memoryKey = `${x.media_type || 'movie'}-${x.id}`;
            itemMemoryCache.set(memoryKey, x);
            const statusTrack = x.lastSeason ? `S${x.lastSeason} • E${x.lastEpisode}` : (x.media_type === 'tv' ? 'Series' : 'Film');
            return `<div class="card" onclick="resumeWatch('${memoryKey}', ${x.lastSeason || null}, ${x.lastEpisode || null})">
                <div class="poster-wrap"><button class="trash-btn" onclick="event.stopPropagation(); deleteHistoryItem(${x.id}, '${x.media_type || 'movie'}')"><i class="fas fa-trash-alt"></i></button>
                <div class="badge" style="background:var(--primary);">${statusTrack}</div>
                <img class="poster" src="${img(x.poster_path)}" onerror="this.src='${FALLBACK}';" loading="lazy"></div>
                <div class="card-body"><div class="card-title">${esc(x.title)}</div><div class="card-date">Dilihat: ${x.trackTime || 'Baru saja'}</div><div class="card-rating"><i class="fas fa-star"></i> ${x.vote_average ? x.vote_average.toFixed(1) : '?'}</div></div>
            </div>`;
        }).join("");
    }
}

function clearAllHistory() {
    if(getHistory().length === 0) return;
    if(confirm("Hapus semua riwayat?")) { saveHistory([]); loadHistory(); if(window.location.pathname === "/home") loadHome(); }
}