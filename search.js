// ==================== SEARCH PAGE ====================

async function loadSearchPage(params) {
    const query = params.query || "";
    const app = document.getElementById("app");
    app.innerHTML = `
        <div style="padding: 100px 4% 20px;">
            <div style="max-width:600px; margin:0 auto; position:relative;">
                <input type="text" id="searchInput" placeholder="Cari film atau series..." value="${esc(query)}" style="width:100%; padding:15px 20px; border:none; border-radius:30px; background:#1a1a1a; color:white; font-size:16px; outline:none;">
                <div id="suggestionBox" style="position:absolute; top:100%; left:0; right:0; background:#1a1a1a; border-radius:12px; margin-top:8px; display:none; z-index:100;"></div>
            </div>
            <div id="searchStatus" style="margin:20px 0; color:#666;"></div>
            <div class="grid" id="searchResults"></div>
        </div>
    `;
    
    const searchInput = document.getElementById("searchInput");
    if(searchInput) {
        searchInput.addEventListener("input", debounceSearch);
        searchInput.addEventListener("keydown", (e) => { if(e.key === "Enter") performSearch(); });
    }
    if(query) await performSearch();
}

let searchDebounceTimer;
function debounceSearch() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => performSearch(), 500);
}

async function performSearch() {
    const searchInput = document.getElementById("searchInput");
    const query = searchInput?.value.trim();
    if(!query) return;
    const status = document.getElementById("searchStatus");
    const results = document.getElementById("searchResults");
    if(status) status.innerHTML = "Mencari...";
    if(results) results.innerHTML = renderSkeletonGrid(8);
    try {
        if(searchAbortController) searchAbortController.abort();
        searchAbortController = new AbortController();
        const data = await fetchTMDB(`/search/multi?query=${encodeURIComponent(query)}&page=1`, searchAbortController.signal);
        const filtered = data.results.filter(x => x.media_type === "movie" || x.media_type === "tv");
        if(status) status.innerHTML = `${data.total_results || filtered.length} hasil ditemukan untuk "${esc(query)}"`;
        if(results) results.innerHTML = filtered.length ? filtered.map(x => renderCard(x)).join("") : `<div class="loading">Tidak ada hasil</div>`;
        window.history.pushState({}, "", `/search?q=${encodeURIComponent(query)}`);
    } catch(err) { if(status) status.innerHTML = "Gagal memuat data"; }
}