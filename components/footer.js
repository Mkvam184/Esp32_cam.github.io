document.addEventListener("DOMContentLoaded", () => {
    // Tìm thẻ chứa footer (thử tìm thẻ <div id="footer"> hoặc <footer>)
    const footerContainer = document.getElementById("footer") || document.querySelector("footer");

    if (!footerContainer) {
        console.warn("Không tìm thấy thẻ <div id='footer'></div> hoặc <footer> trên trang này.");
        return;
    }

    // Dynamic Year (Tự động cập nhật năm hiện tại)
    const currentYear = new Date().getFullYear();

    const footerHTML = `
    <footer class="bg-slate-950/60 backdrop-blur-md border-t border-slate-800/80 w-full py-8 text-slate-400 text-xs mt-auto shadow-lg shadow-black/40">
        <div class="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            <!-- Cột 1: Thông tin hệ thống -->
            <div class="text-center md:text-left">
                <h4 class="font-bold text-slate-200 text-sm mb-1.5 flex items-center justify-center md:justify-start gap-2">
                    <span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                    Hệ thống ESP32 Controller
                </h4>
                <p class="text-slate-500 leading-relaxed">
                    Nền tảng giao diện web nhẹ, tối ưu hóa để vận hành các thiết bị IoT và các mô-đun ESP32-CAM cục bộ tốc độ cao.
                </p>
            </div>

            <!-- Cột 2: Các liên kết nhanh -->
            <div class="flex justify-center gap-6">
                <a href="https://github.com" target="_blank" class="hover:text-cyan-400 transition-colors flex items-center gap-1">
                    <span>GitHub Dự Án</span>
                </a>
                <a href="./Scanner.html" class="hover:text-cyan-400 transition-colors">Tài Liệu Hướng Dẫn</a>
                <a href="javascript:void(0)" class="hover:text-cyan-400 transition-colors" onclick="alert('Phiên bản v1.2.0-Alpha (${currentYear})')">Phiên bản</a>
            </div>

            <!-- Cột 3: Bản quyền & Ghi chú -->
            <div class="text-center md:text-right text-slate-500">
                <p>ESP32 WiFi Local Controller System &copy; ${currentYear}</p>
                <p class="mt-1 text-[10px] text-slate-600">Tối ưu hóa hiển thị trên di động & máy tính.</p>
            </div>
        </div>
    </footer>
    `;

    // Thay thế/Chèn HTML vào trang
    footerContainer.outerHTML = footerHTML;
});