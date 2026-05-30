// ==================== MAIN INITIALIZATION ====================

function initNavbar() {
    window.addEventListener("scroll", () => {
        const navbar = document.getElementById("navbar");
        if(window.scrollY > 100) navbar.classList.add("scrolled");
        else navbar.classList.remove("scrolled");
    });
    function updateActiveNav() {
        const currentPath = window.location.pathname;
        document.querySelectorAll(".nav-btn").forEach(btn => {
            const link = btn.getAttribute("data-link");
            if(link === currentPath || (currentPath === "/" && link === "/home")) btn.classList.add("active");
            else btn.classList.remove("active");
        });
    }
    window.addEventListener("popstate", updateActiveNav);
    setTimeout(updateActiveNav, 100);
}

function initModals() {
    document.getElementById("infoBtn").onclick = () => document.getElementById("devModal").classList.add("active");
    document.getElementById("closeModalBtn").onclick = () => document.getElementById("devModal").classList.remove("active");
    document.getElementById("clearCacheBtn").onclick = () => clearAppCache();
    window.onclick = (event) => { if(event.target === document.getElementById("devModal")) document.getElementById("devModal").classList.remove("active"); };
}

function initSplash() { setTimeout(() => { const splash = document.getElementById("splash-screen"); if(splash) splash.classList.add("hidden"); }, 1500); }

// Register Routes
router.addRoute("/home", loadHome);
router.addRoute("/movies", loadMovies);
router.addRoute("/tv", loadSeries);
router.addRoute("/favorites", loadFavorites);
router.addRoute("/history", loadHistory);
router.addRoute("/search", loadSearchPage);
router.addRoute("/movie/:id", loadMovieDetail);
router.addRoute("/tv/:id", loadTvDetail);
router.addRoute("/watch/movie/:id", loadWatchMovie);
router.addRoute("/watch/tv/:id", loadWatchTv);
router.addRoute("/", loadHome);

// Start App
async function startApp() {
    initNavbar();
    initModals();
    initSplash();
    const path = window.location.pathname;
    await router.navigate(path || "/home", false);
}

startApp();