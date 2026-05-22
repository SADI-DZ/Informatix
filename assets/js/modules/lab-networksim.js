// Network Simulator Advanced — Canvas-based network designer
(function() {
    "use strict";
    const nsCanvas = document.getElementById('ns-canvas');
    const nsCtx = nsCanvas ? nsCanvas.getContext('2d') : null;

    const NS_DEVICE_NAMES = {
        pc: 'حاسوب', phone: 'هاتف', printer: 'طابعة',
        server: 'خادم', router: 'موجه', switch: 'محول', hub: 'مكرر', cloud: 'سحابة'
    };
    const NS_DEVICE_ICONS = {
        pc: '💻', phone: '📱', printer: '🖨️',
        server: '🖥️', router: '📡', switch: '🔀', hub: '🔲', cloud: '☁️'
    };
    const NS_DEVICE_COLORS = {
        pc: '#4fc3f7', phone: '#81c784', printer: '#ffb74d',
        server: '#ce93d8', router: '#e94560', switch: '#4dd0e1', hub: '#ffd54f', cloud: '#81d4fa'
    };

    const nsState = {
        devices: [],
        connections: [],
        selectedId: null,
        tool: 'select',
        pan: { x: 0, y: 0 },
        zoom: 1,
        isPanning: false,
        panStart: null,
        connectFirst: null,
        connectPendingSecond: null,
        deviceIdCounter: 0,
        dragDevice: null,
        dragOffset: null,
    };

    let nsEditingDevice = null;

    // Expose flag for other modules (theme listener, workshop nav)
    window.nsInitialized = false;

    function nsRandIP() {
        return `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    }

    /** إنشاء جهاز شبكة جديد وإضافته للرسم */
    function nsCreateDevice(type, x, y) {
        const id = ++nsState.deviceIdCounter;
        const d = { id, type, x, y, name: NS_DEVICE_NAMES[type] + ' ' + id, ip: nsRandIP(), ports: [] };
        if (type === 'router') d.ports = [0,1,2,3];
        else if (type === 'switch') d.ports = [0,1,2,3,4,5,6,7];
        else if (type === 'hub') d.ports = [0,1,2,3,4];
        else if (type === 'cloud') d.ports = [0,1,2,3,4,5,6,7,8,9];
        else d.ports = [0]; // 1 port for PC, Server, Printer, Phone
        nsState.devices.push(d);
        return d;
    }

    function nsGetDeviceSize(type) {
        switch(type) {
            case 'router': return 60;
            case 'switch': return 70;
            case 'hub': return 55;
            case 'server': return 50;
            case 'cloud': return 90;
            default: return 45;
        }
    }

    /** رسم جهاز على الـ Canvas مع تحديد الشكل واللون حسب النوع */
    function nsDrawDevice(d) {
        if (!nsCtx) return;
        const s = nsGetDeviceSize(d.type) * nsState.zoom;
        const x = d.x * nsState.zoom + nsState.pan.x;
        const y = d.y * nsState.zoom + nsState.pan.y;
        const isSelected = d.id === nsState.selectedId;
        const color = NS_DEVICE_COLORS[d.type];
        const ctx = nsCtx;

        ctx.shadowColor = isSelected ? '#e9456080' : '#00000040';
        ctx.shadowBlur = isSelected ? 15 : 5;

        ctx.beginPath();
        if (d.type === 'router' || d.type === 'switch' || d.type === 'cloud') {
            const r = d.type === 'cloud' ? 20 : 8;
            ctx.roundRect(x - s/2, y - s/2, s, s, r);
        } else {
            ctx.arc(x, y, s/2, 0, Math.PI * 2);
        }
        const isLightNs = document.body.classList.contains('light-mode');
        ctx.fillStyle = isLightNs ? '#f1f5f9' : '#16213e';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#e94560' : color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        if (d.type === 'cloud') {
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = isSelected ? '#e94560' : '#81d4fa';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.shadowBlur = 0;

        ctx.font = `${Math.round(s * 0.5)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(NS_DEVICE_ICONS[d.type], x, y - s * 0.05);

        ctx.font = `${Math.max(10, Math.round(11 * nsState.zoom))}px sans-serif`;
        ctx.fillStyle = isLightNs ? '#475569' : '#ccc';
        ctx.textBaseline = 'top';
        ctx.fillText(d.name, x, y + s/2 + 4);

        ctx.font = `${Math.max(8, Math.round(9 * nsState.zoom))}px sans-serif`;
        ctx.fillStyle = isLightNs ? '#94a3b8' : '#888';
        ctx.textBaseline = 'top';
        ctx.fillText(d.ip, x, y + s/2 + 18);
    }

    /** رسم خط توصيل بين جهازين مع تمييز النوع (سلكي/لاسلكي) */
    function nsDrawConnection(c) {
        if (!nsCtx) return;
        const a = nsState.devices.find(d => d.id === c.from);
        const b = nsState.devices.find(d => d.id === c.to);
        if (!a || !b) return;
        const ctx = nsCtx;

        const ax = a.x * nsState.zoom + nsState.pan.x;
        const ay = a.y * nsState.zoom + nsState.pan.y;
        const bx = b.x * nsState.zoom + nsState.pan.x;
        const by = b.y * nsState.zoom + nsState.pan.y;
        const as = nsGetDeviceSize(a.type) * nsState.zoom / 2;
        const bs = nsGetDeviceSize(b.type) * nsState.zoom / 2;

        const dx = bx - ax, dy = by - ay;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len === 0) return;
        const nx = dx/len, ny = dy/len;

        const x1 = ax + nx * as, y1 = ay + ny * as;
        const x2 = bx - nx * bs, y2 = by - ny * bs;
        const isWireless = c.type === 'wireless';
        const isActive = c.active;

        if (isWireless) {
            const midX = (x1+x2)/2, midY = (y1+y2)/2;
            const perpX = -ny, perpY = nx;
            const amp = 8 * nsState.zoom;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            const steps = Math.max(4, Math.floor(len / (20 * nsState.zoom)));
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = x1 + dx * t;
                const py = y1 + dy * t;
                if (i % 2 === 0) ctx.lineTo(px, py);
                else ctx.moveTo(px, py);
            }
            ctx.strokeStyle = isActive ? '#81c784' : '#2e7d32';
            ctx.lineWidth = isActive ? 2 : 1.5;
            ctx.stroke();

            ctx.font = `${Math.round(16 * nsState.zoom)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📶', midX + perpX * amp * 1.2, midY + perpY * amp * 1.2);
        } else {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isActive ? '#4fc3f7' : '#0f3460';
            ctx.lineWidth = isActive ? 2.5 : 1.5;
            ctx.setLineDash(isActive ? [] : [5, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            if (isActive) {
                const mx = (x1+x2)/2, my = (y1+y2)/2;
                ctx.beginPath();
                ctx.arc(mx, my, 3, 0, Math.PI*2);
                ctx.fillStyle = '#4fc3f7';
                ctx.fill();
            }
        }
    }

    function nsRender() {
        if (!nsCanvas || !nsCtx) return;
        const rect = nsCanvas.parentElement.getBoundingClientRect();
        nsCanvas.width = nsCanvas.clientWidth || rect.width;
        nsCanvas.height = nsCanvas.clientHeight || rect.height;
        const ctx = nsCtx;
        ctx.clearRect(0, 0, nsCanvas.width, nsCanvas.height);

        const isLight = document.body.classList.contains('light-mode');
        ctx.strokeStyle = isLight ? '#e2e8f0' : '#1a1a3e';
        ctx.lineWidth = 1;
        const gridSize = 40 * nsState.zoom;
        const ox = nsState.pan.x % gridSize, oy = nsState.pan.y % gridSize;
        for (let x = ox; x < nsCanvas.width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, nsCanvas.height); ctx.stroke();
        }
        for (let y = oy; y < nsCanvas.height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(nsCanvas.width, y); ctx.stroke();
        }

        nsState.connections.forEach(nsDrawConnection);
        nsState.devices.forEach(nsDrawDevice);
        
        // Draw active ping dots
        if (nsState.activePings && nsState.activePings.length > 0) {
            nsState.activePings.forEach(p => {
                const a = nsState.devices.find(d => d.id === p.from);
                const b = nsState.devices.find(d => d.id === p.to);
                if (a && b) {
                    const ax = a.x * nsState.zoom + nsState.pan.x;
                    const ay = a.y * nsState.zoom + nsState.pan.y;
                    const bx = b.x * nsState.zoom + nsState.pan.x;
                    const by = b.y * nsState.zoom + nsState.pan.y;
                    const x = ax + (bx - ax) * p.progress;
                    const y = ay + (by - ay) * p.progress;
                    ctx.beginPath();
                    ctx.arc(x, y, 6 * nsState.zoom, 0, Math.PI*2);
                    ctx.fillStyle = p.success ? '#81c784' : '#e57373';
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });
        }
    }

    // Ping Logic
    function nsHasPath(startId, endId, visited = new Set()) {
        if (startId === endId) return true;
        visited.add(startId);
        const conns = nsState.connections.filter(c => c.from === startId || c.to === startId);
        for (const c of conns) {
            const nextId = c.from === startId ? c.to : c.from;
            if (!visited.has(nextId)) {
                if (nsHasPath(nextId, endId, visited)) return true;
            }
        }
        return false;
    }

    function nsRunPing(fromId, toId) {
        const fromD = nsState.devices.find(d => d.id === fromId);
        const toD = nsState.devices.find(d => d.id === toId);
        
        const subnetRegex = /^(\d+\.\d+\.\d+)\./;
        const fromSub = fromD.ip.match(subnetRegex);
        const toSub = toD.ip.match(subnetRegex);
        
        const pathExists = nsHasPath(fromId, toId);
        // Success if path exists and either same subnet or there's a router in path (simplified: just path exists for now)
        const success = pathExists && (fromSub && toSub && fromSub[1] === toSub[1] || nsState.devices.some(d => d.type === 'router'));
        
        if (!nsState.activePings) nsState.activePings = [];
        const pingObj = { from: fromId, to: toId, progress: 0, success };
        nsState.activePings.push(pingObj);
        
        let lastTime = performance.now();
        function animatePing(time) {
            const dt = time - lastTime;
            lastTime = time;
            pingObj.progress += dt / 1000; // 1 second to reach destination
            if (pingObj.progress >= 1) {
                nsState.activePings = nsState.activePings.filter(p => p !== pingObj);
                nsRender();
                alert(success ? `✅ Ping ناجح من ${fromD.name} إلى ${toD.name}` : `❌ Ping فشل من ${fromD.name} إلى ${toD.name}`);
            } else {
                nsRender();
                requestAnimationFrame(animatePing);
            }
        }
        requestAnimationFrame(animatePing);
    }

    function nsDeviceAt(x, y) {
        for (let i = nsState.devices.length - 1; i >= 0; i--) {
            const d = nsState.devices[i];
            const s = nsGetDeviceSize(d.type) / 2;
            const dx = d.x - x, dy = d.y - y;
            if (d.type === 'router' || d.type === 'switch' || d.type === 'cloud') {
                if (Math.abs(dx) <= s && Math.abs(dy) <= s) return d;
            } else {
                if (dx*dx + dy*dy <= s*s) return d;
            }
        }
        return null;
    }

    function nsRemoveDevice(id) {
        nsState.devices = nsState.devices.filter(d => d.id !== id);
        nsState.connections = nsState.connections.filter(c => c.from !== id && c.to !== id);
        if (nsState.selectedId === id) nsState.selectedId = null;
        if (nsState.connectFirst === id) { nsState.connectFirst = null; nsState.connectPendingSecond = null; const picker = document.getElementById('ns-connTypePicker'); if (picker) picker.classList.remove('show'); }
        nsRender();
    }

    function nsUpdateZoom() {
        const zl = document.getElementById('ns-zoomLevel');
        if (zl) zl.textContent = Math.round(nsState.zoom * 100) + '%';
        nsRender();
    }

    function nsAddConnection(fromId, toId, type = 'wired') {
        const fromD = nsState.devices.find(d => d.id === fromId);
        const toD = nsState.devices.find(d => d.id === toId);
        if (!fromD || !toD) return;

        const fromConns = nsState.connections.filter(c => c.from === fromId || c.to === fromId).length;
        const toConns = nsState.connections.filter(c => c.from === toId || c.to === toId).length;

        if (fromConns >= fromD.ports.length) {
            const connMode = document.getElementById('ns-connectionMode');
            if (connMode) { connMode.textContent = `⚠️ ${fromD.name} ليس لديه منافذ شاغرة!`; setTimeout(() => { connMode.classList.remove('show'); }, 2000); }
            return;
        }
        if (toConns >= toD.ports.length) {
            const connMode = document.getElementById('ns-connectionMode');
            if (connMode) { connMode.textContent = `⚠️ ${toD.name} ليس لديه منافذ شاغرة!`; setTimeout(() => { connMode.classList.remove('show'); }, 2000); }
            return;
        }

        if (nsState.connections.some(c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId))) {
            const connMode = document.getElementById('ns-connectionMode');
            if (connMode) {
                connMode.textContent = '⚠️ يوجد اتصال مسبق';
                setTimeout(() => { connMode.classList.remove('show'); }, 1500);
            }
            return;
        }
        const c = { from: fromId, to: toId, active: true, type };
        nsState.connections.push(c);
        nsRender();
    }

    function nsOpenModal(d) {
        nsEditingDevice = d;
        const overlay = document.getElementById('ns-modalOverlay');
        if (overlay) overlay.classList.add('show');
        const nameInput = document.getElementById('ns-editName');
        const ipInput = document.getElementById('ns-editIP');
        if (nameInput) nameInput.value = d.name;
        if (ipInput) ipInput.value = d.ip;
    }

    function nsShowInfo(d) {
        const panel = document.getElementById('ns-infoPanel');
        const title = document.getElementById('ns-infoTitle');
        const body = document.getElementById('ns-infoContent');
        if (panel) panel.classList.add('show');
        if (title) title.textContent = NS_DEVICE_ICONS[d.type] + ' ' + d.name;
        if (body) body.innerHTML = `<div>النوع: ${NS_DEVICE_NAMES[d.type]}</div><div>IP: ${d.ip}</div><div>معرف: ${d.id}</div>`;
    }

    function nsLoadExample() {
        const p1 = nsCreateDevice('pc', 120, 200);
        const p2 = nsCreateDevice('pc', 250, 350);
        const phone = nsCreateDevice('phone', 100, 400);
        const printer = nsCreateDevice('printer', 350, 200);
        const server = nsCreateDevice('server', 700, 150);
        const router = nsCreateDevice('router', 500, 300);
        const sw = nsCreateDevice('switch', 400, 450);
        const hub = nsCreateDevice('hub', 600, 400);
        const cloud = nsCreateDevice('cloud', 900, 300);

        nsAddConnection(p1.id, sw.id, 'wired');
        nsAddConnection(p2.id, sw.id, 'wired');
        nsAddConnection(phone.id, hub.id, 'wireless');
        nsAddConnection(hub.id, sw.id, 'wired');
        nsAddConnection(sw.id, router.id, 'wired');
        nsAddConnection(printer.id, sw.id, 'wired');
        nsAddConnection(server.id, router.id, 'wired');
        nsAddConnection(router.id, cloud.id, 'wired');
        nsAddConnection(p2.id, router.id, 'wireless');
        nsRender();
    }

    let nsSubtabObserver = null;
    let nsResizeObserver = null;

    function nsInit() {
        if (window.nsInitialized || !nsCanvas) return;
        window.nsInitialized = true;
        nsLoadExample();
    }

    function nsDisconnectObservers() {
        if (nsSubtabObserver) { nsSubtabObserver.disconnect(); nsSubtabObserver = null; }
        if (nsResizeObserver) { nsResizeObserver.disconnect(); nsResizeObserver = null; }
    }

    // Expose globally for workshop nav + theme manager
    window.nsRender = nsRender;
    window.nsInit = nsInit;
    window.nsDisconnectObservers = nsDisconnectObservers;
    window.nsAddConnection = nsAddConnection;

    // === Set up event listeners (runs when script loads) ===
    document.addEventListener('DOMContentLoaded', () => {

        // Device creation buttons
        document.querySelectorAll('[data-ns-device]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!nsCanvas) return;
                const type = btn.dataset.nsDevice;
                const cw = nsCanvas.width || nsCanvas.clientWidth;
                const ch = nsCanvas.height || nsCanvas.clientHeight;
                const x = (50 + Math.random() * (cw - 150) - nsState.pan.x) / nsState.zoom;
                const y = (50 + Math.random() * (ch - 100) - nsState.pan.y) / nsState.zoom;
                nsCreateDevice(type, x, y);
                nsRender();
            });
        });

        // Tool buttons
        document.querySelectorAll('[data-ns-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-ns-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                nsState.tool = btn.dataset.nsTool;
                if (nsState.tool !== 'connect') {
                    nsState.connectFirst = null;
                    nsState.connectPendingSecond = null;
                    document.getElementById('ns-connectionMode').classList.remove('show');
                    document.getElementById('ns-connTypePicker').classList.remove('show');
                }
                nsRender();
            });
        });

        // Activate select tool by default
        const nsSelectBtn = document.querySelector('[data-ns-tool="select"]');
        if (nsSelectBtn) nsSelectBtn.classList.add('active');

        // Canvas event listeners
        if (nsCanvas) {
            nsCanvas.addEventListener('contextmenu', e => {
                e.preventDefault();
                const rect = nsCanvas.getBoundingClientRect();
                const x = (e.clientX - rect.left - nsState.pan.x) / nsState.zoom;
                const y = (e.clientY - rect.top - nsState.pan.y) / nsState.zoom;
                const d = nsDeviceAt(x, y);
                if (d) {
                    nsState.selectedId = d.id;
                    nsRender();
                    const menu = document.getElementById('ns-contextMenu');
                    menu.classList.add('show');
                    menu.style.left = e.clientX + 'px';
                    menu.style.top = e.clientY + 'px';
                    menu.dataset.deviceId = d.id;
                }
            });

            nsCanvas.addEventListener('mousedown', e => {
                if (e.button === 2) return;
                if (e.button === 1 || e.shiftKey) {
                    nsState.isPanning = true;
                    nsState.panStart = { x: e.clientX - nsState.pan.x, y: e.clientY - nsState.pan.y };
                    return;
                }

                const rect = nsCanvas.getBoundingClientRect();
                const x = (e.clientX - rect.left - nsState.pan.x) / nsState.zoom;
                const y = (e.clientY - rect.top - nsState.pan.y) / nsState.zoom;
                const d = nsDeviceAt(x, y);

                if (nsState.tool === 'delete') {
                    if (d) nsRemoveDevice(d.id);
                    return;
                }

                if (nsState.tool === 'connect' || nsState.tool === 'ping') {
                    if (d) {
                        if (!nsState.connectFirst) {
                            nsState.connectFirst = d.id;
                            document.getElementById('ns-connectionMode').classList.add('show');
                            document.getElementById('ns-connectionMode').textContent = nsState.tool === 'ping' ? `📡 فحص من: ${d.name} -> اختر الهدف` : `🔗 اختر الجهاز الثاني (${d.name})`;
                        } else if (d.id !== nsState.connectFirst) {
                            if (nsState.tool === 'ping') {
                                nsState.connectPendingSecond = d.id;
                                nsRunPing(nsState.connectFirst, d.id);
                                nsState.connectFirst = null;
                                nsState.connectPendingSecond = null;
                                document.getElementById('ns-connectionMode').classList.remove('show');
                            } else {
                                nsState.connectPendingSecond = d.id;
                                document.getElementById('ns-connTypePicker').classList.add('show');
                            }
                        }
                    } else {
                        nsState.connectFirst = null;
                        nsState.connectPendingSecond = null;
                        document.getElementById('ns-connectionMode').classList.remove('show');
                        document.getElementById('ns-connTypePicker').classList.remove('show');
                    }
                    return;
                }

                nsState.selectedId = d ? d.id : null;
                if (d) {
                    nsState.dragDevice = d;
                    nsState.dragOffset = { x: x - d.x, y: y - d.y };
                }
                nsRender();
            });

            nsCanvas.addEventListener('mousemove', e => {
                if (nsState.isPanning) {
                    nsState.pan.x = e.clientX - nsState.panStart.x;
                    nsState.pan.y = e.clientY - nsState.panStart.y;
                    nsRender();
                    return;
                }
                if (nsState.dragDevice) {
                    const rect = nsCanvas.getBoundingClientRect();
                    nsState.dragDevice.x = (e.clientX - rect.left - nsState.pan.x) / nsState.zoom - nsState.dragOffset.x;
                    nsState.dragDevice.y = (e.clientY - rect.top - nsState.pan.y) / nsState.zoom - nsState.dragOffset.y;
                    nsRender();
                }
            });

            nsCanvas.addEventListener('mouseup', () => {
                nsState.dragDevice = null;
                nsState.isPanning = false;
            });

            nsCanvas.addEventListener('mouseleave', () => {
                nsState.dragDevice = null;
                nsState.isPanning = false;
            });

            nsCanvas.addEventListener('wheel', e => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                nsState.zoom = Math.max(0.2, Math.min(3, nsState.zoom + delta));
                nsUpdateZoom();
            }, { passive: false });
        }

        // Context menu
        document.addEventListener('click', () => {
            const nsCtxMenu = document.getElementById('ns-contextMenu');
            if (nsCtxMenu) nsCtxMenu.classList.remove('show');
            const nsInfoPanel = document.getElementById('ns-infoPanel');
            if (nsInfoPanel) nsInfoPanel.classList.remove('show');
        });

        const nsCtxMenuEl = document.getElementById('ns-contextMenu');
        if (nsCtxMenuEl) {
            nsCtxMenuEl.addEventListener('click', e => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const ctxMenu = document.getElementById('ns-contextMenu');
                if (!ctxMenu) return;
                const id = parseInt(ctxMenu.dataset.deviceId);
                const d = nsState.devices.find(dd => dd.id === id);
                if (!d) return;

                switch(btn.dataset.nsAction) {
                    case 'edit': nsOpenModal(d); break;
                    case 'info': nsShowInfo(d); break;
                    case 'delete': nsRemoveDevice(d.id); break;
                }
                const nsCtxMenuEl2 = document.getElementById('ns-contextMenu');
                if (nsCtxMenuEl2) nsCtxMenuEl2.classList.remove('show');
            });
        }

        // Modal save
        const nsModalSave2 = document.getElementById('ns-modalSave');
        if (nsModalSave2) {
            nsModalSave2.addEventListener('click', () => {
                if (!nsEditingDevice) return;
                const newIP = document.getElementById('ns-editIP')?.value;
                if (newIP && newIP !== nsEditingDevice.ip) {
                    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                    if (!ipRegex.test(newIP)) {
                        alert('عنوان IP غير صالح. الرجاء إدخال عنوان بصيغة صحيحة (مثال: 192.168.1.1)');
                        return;
                    }
                }
                nsEditingDevice.name = (document.getElementById('ns-editName')?.value) || nsEditingDevice.name;
                nsEditingDevice.ip = newIP || nsEditingDevice.ip;
                const overlay = document.getElementById('ns-modalOverlay');
                if (overlay) overlay.classList.remove('show');
                nsEditingDevice = null;
                nsRender();
            });
        }

        // Modal cancel
        const nsModalCancel = document.getElementById('ns-modalCancel');
        if (nsModalCancel) {
            nsModalCancel.addEventListener('click', () => {
                const overlay = document.getElementById('ns-modalOverlay');
                if (overlay) overlay.classList.remove('show');
                nsEditingDevice = null;
            });
        }

        // Connection type buttons
        document.querySelectorAll('.ns-conn-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.nsConn;
                const secondId = nsState.connectPendingSecond;
                if (nsState.connectFirst && secondId) {
                    nsAddConnection(nsState.connectFirst, secondId, type);
                    nsState.connectFirst = null;
                    nsState.connectPendingSecond = null;
                    const connMode = document.getElementById('ns-connectionMode');
                    if (connMode) { connMode.classList.remove('show'); connMode.textContent = ''; }
                    const picker = document.getElementById('ns-connTypePicker');
                    if (picker) picker.classList.remove('show');
                }
            });
        });

        // Zoom buttons
        const nsZoomInBtn = document.getElementById('ns-zoomIn');
        if (nsZoomInBtn) nsZoomInBtn.addEventListener('click', () => { nsState.zoom = Math.min(3, nsState.zoom + 0.1); nsUpdateZoom(); });
        const nsZoomOutBtn = document.getElementById('ns-zoomOut');
        if (nsZoomOutBtn) nsZoomOutBtn.addEventListener('click', () => { nsState.zoom = Math.max(0.2, nsState.zoom - 0.1); nsUpdateZoom(); });
        const nsZoomResetBtn = document.getElementById('ns-zoomReset');
        if (nsZoomResetBtn) nsZoomResetBtn.addEventListener('click', () => { nsState.zoom = 1; nsState.pan = { x: 0, y: 0 }; nsUpdateZoom(); });

        // Clear all
        const nsClearAllBtn = document.getElementById('ns-clearAll');
        if (nsClearAllBtn) {
            nsClearAllBtn.addEventListener('click', () => {
                if (nsState.devices.length === 0) return;
                if (confirm('هل أنت متأكد من مسح جميع العناصر؟')) {
                    nsState.devices = [];
                    nsState.connections = [];
                    nsState.selectedId = null;
                    nsState.connectFirst = null;
                    nsState.connectPendingSecond = null;
                    const picker = document.getElementById('ns-connTypePicker');
                    if (picker) picker.classList.remove('show');
                    nsRender();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (nsState.selectedId) {
                    nsRemoveDevice(nsState.selectedId);
                    e.preventDefault();
                }
            }
            if (e.key === 'Escape') {
                nsState.connectFirst = null;
                nsState.connectPendingSecond = null;
                const connMode = document.getElementById('ns-connectionMode');
                if (connMode) { connMode.classList.remove('show'); connMode.textContent = ''; }
                const picker = document.getElementById('ns-connTypePicker');
                if (picker) picker.classList.remove('show');
                const overlay = document.getElementById('ns-modalOverlay');
                if (overlay && overlay.classList.contains('show')) {
                    overlay.classList.remove('show');
                    nsEditingDevice = null;
                }
            }
        });

        // Observer for network subtab
        const nsSubtab = document.getElementById('subtab-network');
        if (nsSubtab) {
            nsSubtabObserver = new MutationObserver(() => {
                const st = document.getElementById('subtab-network');
                if (st && st.classList.contains('active') && !window.nsInitialized) nsInit();
            });
            nsSubtabObserver.observe(nsSubtab, { attributes: true, attributeFilter: ['class'] });
            if (nsSubtab.classList.contains('active')) nsInit();
        }

        // Resize observer
        if (nsCanvas) {
            nsResizeObserver = new ResizeObserver(() => {
                if (window.nsInitialized) nsRender();
            });
            nsResizeObserver.observe(nsCanvas.parentElement);
        }

    });
})();
