// ==================== FAVORITES PAGE ====================

async function loadFavorites() {
    const app = document.getElementById("app");
    const favs = getFavs();
    app.innerHTML = `<div class="grid" id="favGrid"></div><div id="favEmpty" class="loading" style="display:${favs.length ? 'none' : 'flex'};"><i class="fas fa-heart"></i><p>Belum ada film di Daftar Saya</p></div>`;
    const grid = document.getElementById("favGrid");
    if(grid && favs.length) grid.innerHTML = favs.map(x => renderCard(x)).join("");
}