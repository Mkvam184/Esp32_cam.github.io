// ==================== QUẢN LÝ CẤU HÌNH 1 IP DUY NHẤT ====================
let currentIP = "192.168.1.15"; // Mặc định địa chỉ IP của ESP32-CAM

function loadIP() {
    const savedIP = localStorage.getItem('esp32IP');
    if (savedIP) currentIP = savedIP;
    
    if (document.getElementById('ipInput')) {
        document.getElementById('ipInput').value = currentIP;
    }
    updateIPTextDisplay();
}

function updateIPTextDisplay() {
    if (document.getElementById('currentIP')) {
        document.getElementById('currentIP').textContent = `IP Kết Nối: ${currentIP}`;
    }
}

function saveIP() {
    const ipInput = document.getElementById('ipInput') ? document.getElementById('ipInput').value.trim() : currentIP;
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (ipRegex.test(ipInput)) {
        currentIP = ipInput;
        localStorage.setItem('esp32IP', currentIP);
        
        updateIPTextDisplay();
        
        const msg = document.getElementById('ipSavedMsg');
        if (msg) {
            msg.classList.remove('hidden');
            setTimeout(() => msg.classList.add('hidden'), 2000);
        }
        
        updateStatus();
    } else {
        alert("Vui lòng nhập đúng định dạng IP (Ví dụ: 192.168.1.15)");
    }
}

// URL gốc gửi đến ESP32-CAM
function getBaseURL() {
    return `http://${currentIP}`;
}

// ==================== TRUYỀN LỆNH ĐIỀU KHIỂN & TRẠNG THÁI ====================
// Gửi lệnh điều khiển bánh xe (/forward, /backward, /left, /right, /stop) tới ESP32-CAM
function sendCommand(command) {
    fetch(`${getBaseURL()}/${command}`, { 
        method: 'GET',
        cache: 'no-cache'
    }).catch(() => {});
}

// Kiểm tra trạng thái kết nối bằng API /status trong wifiConfig.h
function updateStatus() {
    const statusEl = document.getElementById("status");
    if (!statusEl) return;
    
    fetch(`${getBaseURL()}/status`, { 
        method: 'GET',
        cache: 'no-cache'
    })
    .then(res => res.json())
    .then(data => {
        statusEl.innerHTML = `Trạng thái: <span class='text-emerald-400'>Đã kết nối (${data.status || 'OK'})</span>`;
        statusEl.className = "text-emerald-400 font-medium text-xs";
    })
    .catch(() => {
        statusEl.innerHTML = "Trạng thái: <span class='text-rose-400'>Mất kết nối</span>";
        statusEl.className = "text-rose-400 font-medium text-xs";
    });
}

// ==================== ĐIỀU KHIỂN SERVO ====================
function controlServo(action) {
    fetch(`${getBaseURL()}/servo/${action}`)
        .then(res => res.text())
        .then(data => console.log("Servo response:", data))
        .catch(err => console.error("Lỗi điều khiển Servo:", err));
}

function setServoAngle(angleValue) {
    fetch(`${getBaseURL()}/servo/set?angle=${angleValue}`)
        .then(res => res.text())
        .catch(err => console.error("Lỗi set góc Servo:", err));
}

// ==================== CAMERA STREAM & CHỤP ẢNH ====================
let isStreaming = false;
let currentCapturedUrl = "";

function toggleVideoStream() {
    const img = document.getElementById("cameraImage");
    const placeholder = document.getElementById("placeholderImage");
    const btn = document.getElementById("btnStream");

    if (!isStreaming) {
        // Mở luồng Video Stream trực tiếp từ ESP32-CAM
        img.src = `${getBaseURL()}:81/stream`;

        img.classList.remove("hidden");
        if (placeholder) placeholder.classList.add("hidden");

        if (btn) btn.innerHTML = "⏹ Dừng video";

        isStreaming = true;
    } else {
        img.src = "";
        
        img.classList.add("hidden");
        if (placeholder) placeholder.classList.remove("hidden");

        if (btn) {
            btn.innerHTML = "🎥 Quay video";
            btn.className = "px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all rounded-xl font-semibold text-xs md:text-sm shadow-lg shadow-emerald-900/30 flex items-center gap-2 text-white";
        }
        
        isStreaming = false;
    }
}

function captureImage() {
    if (isStreaming) {
        toggleVideoStream();
        setTimeout(doCapture, 200);
    } else {
        doCapture();
    }
}

function doCapture() {
    const imgElement = document.getElementById("cameraImage");
    const placeholder = document.getElementById("placeholderImage");

    const imageUrl = `${getBaseURL()}:81/capture?t=` + new Date().getTime();

    imgElement.crossOrigin = "anonymous"; 
    imgElement.src = imageUrl;

    console.log("Đang tải ảnh từ:", imageUrl);

    imgElement.onload = function() {
        if (placeholder) placeholder.classList.add("hidden");
        imgElement.classList.remove("hidden");
        console.log("Chụp ảnh thành công!");
    };
    
    imgElement.onerror = function() {
        console.log("Không chụp được ảnh! Có thể camera đang bận.");
    };
}

// Chụp ảnh riêng lẻ lưu dạng Blob
function takeSnapshot() {
    const captureUrl = `${getBaseURL()}:81/capture?time=${new Date().getTime()}`;

    fetch(captureUrl)
        .then(response => {
            if (!response.ok) throw new Error("Chụp ảnh thất bại");
            return response.blob();
        })
        .then(blob => {
            if (currentCapturedUrl) URL.revokeObjectURL(currentCapturedUrl);
            currentCapturedUrl = URL.createObjectURL(blob);

            const imgElem = document.getElementById("capturedImage");
            if (imgElem) {
                imgElem.src = currentCapturedUrl;
                imgElem.classList.remove("hidden");
            }

            const downloadBtn = document.getElementById("downloadBtn");
            if (downloadBtn) downloadBtn.classList.remove("hidden");
        })
        .catch(err => {
            console.error("Lỗi chụp ảnh:", err);
            alert("Không thể kết nối đến ESP32-CAM để chụp ảnh!");
        });
}

function downloadCapturedImage() {
    const imgElem = document.getElementById("cameraImage");

    if (!imgElem || !imgElem.src || imgElem.classList.contains("hidden")) {
        alert("Chưa có ảnh nào trên màn hình để tải về!");
        return;
    }

    let photoCount = parseInt(localStorage.getItem('photoCounter')) || 1;
    const fileName = `Robot_Photo_${photoCount}.jpg`;

    try {
        const canvas = document.createElement("canvas");
        canvas.width = imgElem.naturalWidth || imgElem.width || 640;
        canvas.height = imgElem.naturalHeight || imgElem.height || 480;

        const ctx = canvas.getContext("2d");
        imgElem.crossOrigin = "anonymous";
        ctx.drawImage(imgElem, 0, 0, canvas.width, canvas.height);

        const imageBase64 = canvas.toDataURL("image/jpeg", 0.95);

        const link = document.createElement("a");
        link.href = imageBase64;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        localStorage.setItem('photoCounter', photoCount + 1);

    } catch (err) {
        console.warn("Canvas bị chặn CORS, chuyển sang phương án tải bằng Fetch Blob...", err);

        const fetchUrl = isStreaming 
            ? `${getBaseURL()}:81/capture?t=${new Date().getTime()}` 
            : imgElem.src;

        fetch(fetchUrl)
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(blobUrl);
                localStorage.setItem('photoCounter', photoCount + 1);
            })
            .catch(fetchErr => {
                console.error("Không thể tải ảnh:", fetchErr);
                alert("Lỗi: Không thể tải ảnh từ ESP32-CAM. Vui lòng thử lại!");
            });
    }
}

// Trình lắng nghe thuộc tính ẩn/hiện placeholder của thẻ ảnh
const cameraImage = document.getElementById('cameraImage');
const placeholderImage = document.getElementById('placeholderImage');

if (cameraImage && placeholderImage) {
    cameraImage.onload = function() {
        placeholderImage.style.display = 'none';
    };
    cameraImage.onerror = function() {
        cameraImage.classList.add('hidden');
        placeholderImage.style.display = 'flex';
    };

    const observer = new MutationObserver(() => {
        if (cameraImage.src && cameraImage.src !== "" && !cameraImage.classList.contains('hidden')) {
            placeholderImage.style.display = 'none';
        } else {
            placeholderImage.style.display = 'flex';
        }
    });
    observer.observe(cameraImage, { attributes: true, attributeFilter: ['src', 'class'] });
}

// ==================== ĐIỀU KHIỂN PHÍM TẮT BÀN PHÍM (WASD & SPACE) ====================
const keyMap = {
    'w': { id: 'btn-forward', cmd: 'forward' },
    'a': { id: 'btn-left', cmd: 'left' },
    's': { id: 'btn-backward', cmd: 'backward' },
    'd': { id: 'btn-right', cmd: 'right' },
    ' ': { id: 'btn-stop', cmd: 'stop' }
};

let activeKeys = new Set();

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // Bỏ qua phím tắt khi người dùng đang nhập dữ liệu trong ô cấu hình IP
    if (document.activeElement === document.getElementById('ipInput')) return;

    if (keyMap[key] && !activeKeys.has(key)) {
        e.preventDefault(); // Tránh cuộn trang khi nhấn phím Space
        activeKeys.add(key);
        
        const btn = document.getElementById(keyMap[key].id);
        if (btn) {
            if (key === ' ') {
                btn.classList.add('bg-red-500', 'scale-95');
            } else {
                btn.classList.add('bg-blue-600', 'scale-95', 'border-blue-500');
            }
        }
        
        sendCommand(keyMap[key].cmd);
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keyMap[key]) {
        activeKeys.delete(key);
        const btn = document.getElementById(keyMap[key].id);
        if (btn) {
            if (key === ' ') {
                btn.classList.remove('bg-red-500', 'scale-95');
            } else {
                btn.classList.remove('bg-blue-600', 'scale-95', 'border-blue-500');
            }
        }
    }
});

// ==================== KHỞI CHẠY TRANG WEB ====================
window.onload = () => {
    loadIP();
    updateStatus();
    setInterval(updateStatus, 1500);
};