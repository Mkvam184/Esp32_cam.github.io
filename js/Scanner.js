let isScanning = false;
let detectedSubnet = "192.168.1"; // Mặc định dự phòng nếu không tự tìm thấy

/**
 * Tự động tìm IP nội bộ (Local IP) của máy tính/điện thoại bằng WebRTC
 */
function getLocalSubnet() {
    return new Promise((resolve) => {
        // 1. Nếu mở trang web từ chính ESP32-CAM (domain/IP trên thanh địa chỉ)
        let baseIP = window.location.hostname;
        if (baseIP && baseIP !== "localhost" && baseIP !== "127.0.0.1" && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(baseIP)) {
            const subnet = baseIP.substring(0, baseIP.lastIndexOf("."));
            return resolve(subnet);
        }

        // 2. Dùng WebRTC để lấy IP thực tế của Wi-Fi/LAN mà điện thoại/máy tính đang kết nối
        const rtc = new RTCPeerConnection({ iceServers: [] });
        rtc.createDataChannel("");
        
        rtc.createOffer().then(offer => rtc.setLocalDescription(offer)).catch(() => {});
        
        let found = false;
        rtc.onicecandidate = (event) => {
            if (!event || !event.candidate || found) return;
            
            const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
            const match = ipRegex.exec(event.candidate.candidate);
            
            if (match) {
                const myLocalIP = match[1];
                // Bỏ qua IP loopback
                if (!myLocalIP.startsWith("127.")) {
                    found = true;
                    rtc.close();
                    const subnet = myLocalIP.substring(0, myLocalIP.lastIndexOf("."));
                    resolve(subnet);
                }
            }
        };

        // Timeout 1 giây nếu trình duyệt chặn WebRTC, fallback về dải mặc định
        setTimeout(() => {
            if (!found) {
                rtc.close();
                resolve("192.168.1"); // Dải IP phổ biến nhất của các Router Wi-Fi
            }
        }, 1000);
    });
}

// Cập nhật giao diện ngay khi mở trang
document.addEventListener("DOMContentLoaded", async () => {
    detectedSubnet = await getLocalSubnet();
    updateIPRangeUI(detectedSubnet);
});

function updateIPRangeUI(subnet) {
    const ipRangeElem = document.getElementById("ipRangeText");
    if (ipRangeElem) {
        ipRangeElem.textContent = `${subnet}.1 -> ${subnet}.254`;
    }
}

async function startScanLAN() {
    if (isScanning) return;
    
    isScanning = true;
    const scanBtn = document.getElementById("scanBtn");
    const scanBtnText = document.getElementById("scanBtnText");
    const scanIcon = document.getElementById("scanIcon");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const scanStatusText = document.getElementById("scanStatusText");
    const scanPercentText = document.getElementById("scanPercentText");
    const robotList = document.getElementById("robotList");
    const emptyState = document.getElementById("emptyState");

    // Reset UI
    scanBtn.disabled = true;
    scanBtn.classList.add("opacity-50", "cursor-not-allowed");
    scanBtnText.textContent = "Đang Tìm Dải Mạng...";
    scanIcon.classList.add("animate-spin");
    progressContainer.classList.remove("hidden");
    
    robotList.innerHTML = "";
    let foundCount = 0;

    // Tự động kiểm tra và cập nhật dải IP mới nhất trước khi quét
    detectedSubnet = await getLocalSubnet();
    updateIPRangeUI(detectedSubnet);

    scanBtnText.textContent = "Đang Quét...";

    const totalIPs = 254;
    const batchSize = 20; // Quét 20 IP song song giúp quét nhanh hơn

    for (let i = 1; i <= totalIPs; i += batchSize) {
        if (!isScanning) break;

        const batchPromises = [];
        for (let j = i; j < i + batchSize && j <= totalIPs; j++) {
            const targetIP = `${detectedSubnet}.${j}`;
            batchPromises.push(checkRobotIP(targetIP));
        }

        const currentProgress = Math.min(Math.round((i / totalIPs) * 100), 100);
        progressBar.style.width = `${currentProgress}%`;
        scanPercentText.textContent = `${currentProgress}%`;
        scanStatusText.textContent = `Đang quét: ${detectedSubnet}.${i}...`;

        const results = await Promise.all(batchPromises);
        
        results.forEach(res => {
            if (res.found) {
                foundCount++;
                // Lưu 1 IP duy nhất của ESP32-CAM vào bộ nhớ trình duyệt
                localStorage.setItem('esp32IP', res.esp32IP);

                // Thêm thẻ Robot tìm thấy vào giao diện
                addRobotCard(res.esp32IP);
            }
        });

    }

    progressBar.style.width = "100%";
    scanPercentText.textContent = "100%";
    scanStatusText.textContent = `Quét hoàn tất! Tìm thấy ${foundCount} Robot.`;
    
    if (foundCount === 0 && emptyState) {
        robotList.appendChild(emptyState);
        emptyState.querySelector("p").textContent = `Không tìm thấy Robot trong dải ${detectedSubnet}.x.`;
    }

    isScanning = false;
    scanBtn.disabled = false;
    scanBtn.classList.remove("opacity-50", "cursor-not-allowed");
    scanBtnText.textContent = "Thực Hiện Quét Lại";
    scanIcon.classList.remove("animate-spin");
}

// Kiểm tra IP thiết bị ESP32-CAM qua endpoint /status
function checkRobotIP(ip) {
    return new Promise((resolve) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        fetch(`http://${ip}/status`, { 
            method: 'GET',
            signal: controller.signal,
            cache: 'no-cache',
            referrerPolicy: 'no-referrer'
        })
        .then((response) => {
            clearTimeout(timeoutId);
            if (response.ok) {
                resolve({ 
                    found: true, 
                    esp32IP: ip
                });
            } else {
                resolve({ found: false });
            }
        })
        .catch(() => {
            clearTimeout(timeoutId);
            resolve({ found: false });
        });
    });
}

// Hiển thị thẻ Robot tìm thấy trên màn hình
function addRobotCard(esp32IP) {
    const robotList = document.getElementById("robotList");
    if (!robotList) return;
    
    const card = document.createElement("div");
    card.className = "bg-slate-900 border border-cyan-500/30 p-4 rounded-xl shadow-lg flex items-center justify-between gap-3 hover:border-cyan-400 transition-all";
    
    card.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">🤖</div>
            <div>
                <p class="text-xs text-slate-300">ESP32-CAM IP: <b class="text-cyan-400 font-mono text-sm">${esp32IP}</b></p>
                <p class="text-[11px] text-emerald-400 mt-0.5">● Sẵn sàng điều khiển</p>
            </div>
        </div>
        <button onclick="connectToRobot('${esp32IP}')" class="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all rounded-xl font-bold text-xs text-white shadow-lg shadow-cyan-900/20">
            Kết Nối ➔
        </button>
    `;
    robotList.appendChild(card);
}

function connectToRobot(ip) {
    localStorage.setItem('esp32IP', ip);
    window.location.href = `index.html`;
}