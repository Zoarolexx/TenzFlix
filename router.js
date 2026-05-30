// ==================== ROUTER ====================
class Router {
    constructor() {
        this.routes = new Map();
        this.currentPath = "/home";
        this.params = {};
        window.addEventListener("popstate", () => this.handlePopState());
        document.addEventListener("click", (e) => this.handleLinkClick(e));
    }

    addRoute(path, handler) { this.routes.set(path, handler); }

    async navigate(path, pushState = true) {
        const [basePath, ...paramParts] = path.split("/").filter(Boolean);
        const fullPath = `/${basePath}${paramParts.length ? `/${paramParts.join("/")}` : ""}`;
        this.currentPath = fullPath;
        this.params = this.parseParams(fullPath);
        if(pushState) window.history.pushState({ path: fullPath }, "", fullPath);
        await this.loadRoute(fullPath);
    }

    parseParams(path) {
        const parts = path.split("/").filter(Boolean);
        const params = {};
        if(parts[0] === "movie" && parts[1]) { params.id = parts[1]; params.type = "movie"; }
        else if(parts[0] === "tv" && parts[1]) { params.id = parts[1]; params.type = "tv"; }
        else if(parts[0] === "watch" && parts[1] === "movie" && parts[2]) { params.id = parts[2]; params.type = "movie"; params.watch = true; }
        else if(parts[0] === "watch" && parts[1] === "tv" && parts[2]) {
            params.id = parts[2]; params.type = "tv"; params.watch = true;
            const seasonIdx = parts.indexOf("season");
            const episodeIdx = parts.indexOf("episode");
            if(seasonIdx !== -1 && parts[seasonIdx + 1]) params.season = parseInt(parts[seasonIdx + 1]);
            if(episodeIdx !== -1 && parts[episodeIdx + 1]) params.episode = parseInt(parts[episodeIdx + 1]);
        }
        else if(parts[0] === "search" && window.location.search) {
            const urlParams = new URLSearchParams(window.location.search);
            params.query = urlParams.get("q") || "";
        }
        return params;
    }

    async loadRoute(path) {
        const app = document.getElementById("app");
        if(!app) return;
        let handler = null;
        for(let [route, h] of this.routes) {
            if(route === path) { handler = h; break; }
            if(route.includes(":id")) {
                const pattern = route.replace(/:id/g, "([^/]+)").replace(/:type/g, "([^/]+)");
                if(new RegExp(`^${pattern}$`).test(path)) { handler = h; break; }
            }
        }
        if(handler) await handler(this.params);
        else app.innerHTML = `<div style="text-align:center; padding:100px;">404 - Halaman tidak ditemukan</div>`;
    }

    handlePopState() { this.navigate(window.location.pathname, false); }
    handleLinkClick(e) {
        const target = e.target.closest("[data-link]");
        if(target) { e.preventDefault(); this.navigate(target.getAttribute("data-link")); }
    }
}

const router = new Router();
window.router = router;