document.addEventListener("DOMContentLoaded", () => {
    const navContainer = document.getElementById("nav");
    
    if (!navContainer) {
        console.warn("Không tìm thấy thẻ <div id='nav'></div> trên trang này.");
        return;
    }

    // Xác định trang hiện tại để Highlight Menu
    const currentPath = window.location.pathname;
    const isScannerPage = currentPath.includes("Scanner.html");
    const isModePage = currentPath.includes("Mode.html");

    // Đoạn HTML Navigation Bar hỗ trợ Mobile Menu
    const navHTML = `
    <nav class="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 px-4 py-3 shadow-lg shadow-cyan-500/10">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
            <!-- Logo -->
            <a href="index.html" class="flex items-center gap-2.5 group">
                <div class="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                    </svg>
                </div>
                <span class="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    ESP32 IOT
                </span>
            </a>

            <!-- Menu trên Laptop/PC -->
            <div class="hidden md:flex items-center gap-6">
                <a href="index.html" class="text-sm font-semibold transition-colors py-1 ${(!isScannerPage && !isModePage) ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-300 hover:text-cyan-400'}">
                    Bảng Điều Khiển
                </a>
                <a href="index.html#camera-section" class="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors py-1">
                    Live Camera
                </a>
                <a href="Mode.html" class="text-sm font-semibold transition-colors py-1 ${isModePage ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-300 hover:text-cyan-400'}">
                    Chế độ
                </a>
                <a href="Scanner.html" class="text-sm font-semibold transition-colors py-1 ${isScannerPage ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-300 hover:text-cyan-400'}">
                    Dò Tìm Robot
                </a>
            </div>

            <div class="flex items-center gap-3">
                <!-- Status Wi-Fi -->
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hidden sm:flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> Chế độ Wi-Fi
                </span>

                <!-- Nút Hamburger Menu dành cho Mobile -->
                <button id="mobileMenuBtn" class="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white focus:outline-none">
                    <svg id="menuOpenIcon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                    <svg id="menuCloseIcon" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Menu thả xuống dành riêng cho Mobile -->
        <div id="mobileMenu" class="hidden md:hidden mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-3 pb-2">
            <a href="index.html" class="px-3 py-2 rounded-lg text-sm font-semibold transition-all ${(!isScannerPage && !isModePage) ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-300 hover:bg-slate-900'}">
                🖥️ Bảng Điều Khiển
            </a>
            <a href="index.html#camera-section" class="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900 transition-all">
                🎥 Live Camera
            </a>
            <a href="Mode.html" class="px-3 py-2 rounded-lg text-sm font-semibold transition-all ${isModePage ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-300 hover:bg-slate-900'}">
                ⚙️ Chế độ
            </a>
            <a href="Scanner.html" class="px-3 py-2 rounded-lg text-sm font-semibold transition-all ${isScannerPage ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-300 hover:bg-slate-900'}">
                🔍 Dò Tìm Robot
            </a>
        </div>
    </nav>
    `;

    // Chèn HTML vào thẻ #nav
    navContainer.innerHTML = navHTML;

    // Bắt sự kiện Toggle Mobile Menu
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    const menuOpenIcon = document.getElementById("menuOpenIcon");
    const menuCloseIcon = document.getElementById("menuCloseIcon");

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            const isHidden = mobileMenu.classList.contains("hidden");
            if (isHidden) {
                mobileMenu.classList.remove("hidden");
                menuOpenIcon.classList.add("hidden");
                menuCloseIcon.classList.remove("hidden");
            } else {
                mobileMenu.classList.add("hidden");
                menuOpenIcon.classList.remove("hidden");
                menuCloseIcon.classList.add("hidden");
            }
        });
    }
});
