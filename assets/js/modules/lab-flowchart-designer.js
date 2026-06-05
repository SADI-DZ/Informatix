// Flowchart Interactive Designer Engine
(function () {
    "use strict";

    // ==================== CONFIGURATION ====================
    const SHAPE_DEFAULTS = {
        start: { w: 140, h: 56, label: 'بداية / نهاية', cls: 'fc-shape-terminal' },
        process: { w: 160, h: 56, label: 'عملية', cls: 'fc-shape-process' },
        decision: { w: 140, h: 80, label: 'قرار', cls: 'fc-shape-decision' },
        io: { w: 160, h: 56, label: 'إدخال / إخراج', cls: 'fc-shape-io' },
        connector: { w: 48, h: 48, label: 'رابط', cls: 'fc-shape-connector' }
    };
    const HANDLE_SIZE = 10;
    const COLORS = {
        default: { bg: '#3b82f6', text: '#fff', border: '#2563eb' },
        success: { bg: '#10b981', text: '#fff', border: '#059669' },
        warning: { bg: '#f59e0b', text: '#fff', border: '#d97706' },
        danger: { bg: '#ef4444', text: '#fff', border: '#dc2626' }
    };
    const MAX_HISTORY = 50;
    const ZOOM_MIN = 0.25;
    const ZOOM_MAX = 3;
    const ZOOM_STEP = 0.1;
    const STORAGE_KEY = 'informatix_fc_save';
    const STORAGE_AUTO_KEY = 'informatix_fc_autosave';
    const MAX_LOOP_ITER = 10000;

    // ==================== STATE ====================
    let state = {
        shapes: [],
        connections: [],
        selectedId: null,
        nextId: 1,
        mode: 'select', // 'select' | 'connect'
        connectFrom: null, // { shapeId, handle }
        isDragging: false,
        dragTarget: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
        zoom: 1,
        panX: 0,
        panY: 0,
        isPanning: false,
        panStartX: 0,
        panStartY: 0,
        panStartPanX: 0,
        panStartPanY: 0,
        history: [],
        historyIdx: -1,
        running: false,
        halted: true,
        execStep: -1,
        execPath: [],
        execVars: {},
        execOutput: [],
        _connCounters: {},
        _lastSaveHash: ''
    };

    // ==================== DOM REFS ====================
    let dom = {};

    function cacheDom() {
        dom.canvas = document.getElementById('canvas');
        dom.shapeText = document.getElementById('shapeText');
        dom.shapeColor = document.getElementById('shapeColor');
        dom.flowVarsBody = document.getElementById('flowVarsBody');
        dom.flowOutput = document.getElementById('flowOutput');
        dom.flowGeneratedCode = document.getElementById('flowGeneratedCode');
        dom.flowRunBtn = document.getElementById('flowRunBtn');
        dom.flowStepBtn = document.getElementById('flowStepBtn');
        dom.flowResetBtn = document.getElementById('flowResetBtn');
        dom.workspace = document.querySelector('.flowchart-workspace');
        dom.shapeItems = document.querySelectorAll('.shape-item');
        dom.exportBtn = document.getElementById('exportCodeBtn');
        dom.clearBtn = document.getElementById('clearAllBtn');
        dom.zoomLabel = document.getElementById('fcZoomLabel');
        dom.shapeRole = document.getElementById('shapeRole');
        dom.shapeRoleField = document.getElementById('shapeRoleField');
    }

    // ==================== UTILITY ====================
    function genId() { return 'fc_' + (state.nextId++); }

    function cloneShapes() { return JSON.parse(JSON.stringify(state.shapes)); }

    function cloneConnections() { return JSON.parse(JSON.stringify(state.connections)); }

    function shapeAt(x, y) {
        for (let i = state.shapes.length - 1; i >= 0; i--) {
            const s = state.shapes[i];
            const sx = s.x * state.zoom + state.panX;
            const sy = s.y * state.zoom + state.panY;
            const sw = s.w * state.zoom;
            const sh = s.h * state.zoom;
            if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) return s;
        }
        return null;
    }

    function getShapeById(id) { return state.shapes.find(s => s.id === id); }

    function getConnectionsFrom(id) { return state.connections.filter(c => c.fromId === id); }

    function getConnectionsTo(id) { return state.connections.filter(c => c.toId === id); }

    function getShapeHandles(s) {
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        return {
            top: { x: cx, y: s.y },
            bottom: { x: cx, y: s.y + s.h },
            left: { x: s.x, y: cy },
            right: { x: s.x + s.w, y: cy }
        };
    }

    function handleAt(x, y) {
        for (const s of state.shapes) {
            const handles = getShapeHandles(s);
            const zoom = state.zoom;
            for (const [pos, h] of Object.entries(handles)) {
                const hx = h.x * zoom + state.panX;
                const hy = h.y * zoom + state.panY;
                if (Math.abs(x - hx) < HANDLE_SIZE && Math.abs(y - hy) < HANDLE_SIZE) {
                    return { shapeId: s.id, position: pos };
                }
            }
        }
        return null;
    }

    function distance(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }

    // ==================== PUSH HISTORY ====================
    function pushHistory() {
        // If we're not at the tip, truncate future
        if (state.historyIdx < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIdx + 1);
        }
        state.history.push({
            shapes: cloneShapes(),
            connections: cloneConnections()
        });
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIdx = state.history.length - 1;
    }

    function undo() {
        if (state.historyIdx <= 0) return;
        state.historyIdx--;
        const entry = state.history[state.historyIdx];
        state.shapes = JSON.parse(JSON.stringify(entry.shapes));
        state.connections = JSON.parse(JSON.stringify(entry.connections));
        state.selectedId = null;
        fullRender();
    }

    function redo() {
        if (state.historyIdx >= state.history.length - 1) return;
        state.historyIdx++;
        const entry = state.history[state.historyIdx];
        state.shapes = JSON.parse(JSON.stringify(entry.shapes));
        state.connections = JSON.parse(JSON.stringify(entry.connections));
        state.selectedId = null;
        fullRender();
    }

    // ==================== SHAPE DIMENSIONS ====================
    function getShapeDimensions(type, text) {
        const def = SHAPE_DEFAULTS[type] || SHAPE_DEFAULTS.process;
        let w = def.w;
        let h = def.h;
        if (text && text.length > 10) {
            w = Math.max(w, text.length * 10 + 40);
            h = Math.max(h, type === 'decision' ? 80 : 56);
        }
        return { w, h };
    }

    // ==================== ADD / REMOVE SHAPES ====================
    function addShape(type, x, y) {
        const dims = getShapeDimensions(type, '');
        const snap = 20;
        const sx = Math.round((x - dims.w / 2) / snap) * snap;
        const sy = Math.round((y - dims.h / 2) / snap) * snap;
        const id = genId();
        const role = type === 'start' ? 'start' : type === 'io' ? 'input' : null;
        const shape = {
            id,
            type,
            x: sx,
            y: sy,
            w: dims.w,
            h: dims.h,
            text: getDefaultText(type, role),
            color: 'default',
            role: role,
            handles: {}
        };
        state.shapes.push(shape);
        pushHistory();
        selectShape(id);
        fullRender();
        return shape;
    }

    function getDefaultText(type, role) {
        switch (type) {
            case 'start': return '';
            case 'process': return 'عملية';
            case 'decision': return 'شرط؟';
            case 'io': return role === 'output' ? 'أظهر النتيجة' : 'أدخل قيمة';
            case 'connector': return '';
            default: return '';
        }
    }

    function removeShape(id) {
        const idx = state.shapes.findIndex(s => s.id === id);
        if (idx === -1) return;
        // Remove connections referencing this shape
        state.connections = state.connections.filter(c => c.fromId !== id && c.toId !== id);
        state.shapes.splice(idx, 1);
        if (state.selectedId === id) state.selectedId = null;
        pushHistory();
        fullRender();
    }

    function removeAllShapes() {
        state.shapes = [];
        state.connections = [];
        state.selectedId = null;
        state.mode = 'select';
        state.connectFrom = null;
        pushHistory();
        fullRender();
    }

    // ==================== SELECTION ====================
    function selectShape(id) {
        state.selectedId = id;
        updatePropertiesPanel();
        fullRender();
    }

    // ==================== PROPERTIES PANEL ====================
    function updatePropertiesPanel() {
        const sel = getShapeById(state.selectedId);
        if (dom.shapeText) dom.shapeText.value = sel ? sel.text : '';
        if (dom.shapeColor) dom.shapeColor.value = sel ? sel.color : 'default';
        if (dom.shapeText) dom.shapeText.disabled = !sel;
        if (dom.shapeColor) dom.shapeColor.disabled = !sel;

        // Role dropdown: show for start and io shapes, with dynamic options
        if (dom.shapeRoleField && dom.shapeRole) {
            if (sel && (sel.type === 'start' || sel.type === 'io')) {
                dom.shapeRoleField.style.display = '';
                dom.shapeRole.disabled = false;
                // Populate options based on type
                const opts = sel.type === 'start'
                    ? [['start', 'بداية'], ['end', 'نهاية']]
                    : [['input', 'إدخال'], ['output', 'إخراج']];
                if (dom.shapeRole.options.length !== opts.length ||
                    dom.shapeRole.options[0]?.value !== opts[0][0]) {
                    dom.shapeRole.innerHTML = opts.map(([v, l]) =>
                        '<option value="' + v + '">' + l + '</option>'
                    ).join('');
                }
                dom.shapeRole.value = sel.role || opts[0][0];
            } else {
                dom.shapeRoleField.style.display = 'none';
                dom.shapeRole.disabled = true;
            }
        }
    }

    function updateShapeText(id, text) {
        const s = getShapeById(id);
        if (!s) return;
        s.text = text;
        pushHistory();
        fullRender();
    }

    function updateShapeColor(id, color) {
        const s = getShapeById(id);
        if (!s) return;
        s.color = color;
        pushHistory();
        fullRender();
    }

    function updateShapeRole(id, role) {
        const s = getShapeById(id);
        if (!s) return;
        s.role = role;
        if (s.type === 'start') {
            if (role === 'end') {
                if (!s.text || s.text === 'بداية') s.text = 'نهاية';
            } else if (role === 'start') {
                if (!s.text || s.text === 'نهاية') s.text = '';
            }
        } else if (s.type === 'io') {
            if (role === 'output') {
                if (!s.text || s.text === 'أدخل قيمة') s.text = 'أظهر النتيجة';
            } else if (role === 'input') {
                if (!s.text || s.text === 'أظهر النتيجة') s.text = 'أدخل قيمة';
            }
        }
        pushHistory();
        fullRender();
    }

    // ==================== CONNECTIONS ====================
    function addConnection(fromId, fromHandle, toId, toHandle) {
        if (fromId === toId) return;
        // Prevent duplicate connections
        const exists = state.connections.some(c =>
            c.fromId === fromId && c.toId === toId
        );
        if (exists) return;
        state.connections.push({
            id: genId(),
            fromId,
            fromHandle,
            toId,
            toHandle,
            label: ''
        });
        // Set default labels for decision branches
        const fromShape = getShapeById(fromId);
        if (fromShape && fromShape.type === 'decision') {
            const existing = getConnectionsFrom(fromId);
            if (existing.length === 1) {
                existing[0].label = 'نعم';
            } else if (existing.length > 1) {
                existing[1].label = 'لا';
            }
        }
        pushHistory();
        fullRender();
    }

    function removeConnection(id) {
        state.connections = state.connections.filter(c => c.id !== id);
        pushHistory();
        fullRender();
    }

    // ==================== RENDER ====================
    function fullRender() {
        renderShapes();
        renderConnections();
        renderExecutionState();
        renderVariables();
        renderOutput();
        renderCode();
        updatePropertiesPanel();
    }

    function renderShapes() {
        if (!dom.canvas) return;
        // Remove old shape elements (keep SVG overlay)
        dom.canvas.querySelectorAll('.fc-shape-el').forEach(el => el.remove());
        // Remove old temporary highlight
        dom.canvas.querySelectorAll('.fc-temp-line').forEach(el => el.remove());

        const zoom = state.zoom;
        const panX = state.panX;
        const panY = state.panY;

        for (const s of state.shapes) {
            const el = document.createElement('div');
            el.className = `fc-shape-el ${SHAPE_DEFAULTS[s.type].cls}`;
            el.dataset.id = s.id;
            el.style.position = 'absolute';
            el.style.left = (s.x * zoom + panX) + 'px';
            el.style.top = (s.y * zoom + panY) + 'px';
            el.style.width = (s.w * zoom) + 'px';
            el.style.height = (s.h * zoom) + 'px';
            el.style.cursor = 'pointer';
            el.style.userSelect = 'none';

            // Color
            const color = COLORS[s.color] || COLORS.default;
            el.style.background = color.bg;
            el.style.color = color.text;
            el.style.borderColor = color.border;

            // Shape-specific clip-path
            if (s.type === 'decision') {
                el.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
                el.style.borderRadius = '0';
            } else if (s.type === 'io') {
                el.style.clipPath = 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)';
                el.style.borderRadius = '0';
            } else if (s.type === 'start') {
                el.style.borderRadius = '999px';
            } else if (s.type === 'connector') {
                el.style.borderRadius = '50%';
            } else {
                el.style.borderRadius = '8px';
                el.style.clipPath = 'none';
            }

            if (s.type !== 'decision' && s.type !== 'io') {
                el.style.display = 'flex';
            } else {
                el.style.display = 'flex';
            }
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.fontSize = Math.max(10, Math.round(14 * zoom)) + 'px';
            el.style.fontWeight = '700';
            el.style.textAlign = 'center';
            el.style.padding = '4px 8px';
            el.style.boxSizing = 'border-box';
            el.style.overflow = 'hidden';
            el.style.border = '2px solid ' + color.border;
            if (s.type === 'decision') {
                el.style.border = 'none';
                // Inner text wrapper for clipped shapes
            }

            // Text content
            if (s.type === 'decision') {
                // For clipped shapes, add inner wrapper that inverts the clip
                const inner = document.createElement('span');
                inner.textContent = s.text || '';
                inner.style.display = 'block';
                inner.style.textAlign = 'center';
                inner.style.lineHeight = '1.3';
                inner.style.fontSize = Math.max(10, Math.round(13 * zoom)) + 'px';
                inner.style.fontWeight = '700';
                el.appendChild(inner);
            } else {
                el.textContent = s.text || '';
            }

            // Selection highlight
            if (s.id === state.selectedId) {
                el.style.boxShadow = '0 0 0 3px #fbbf24, 0 0 16px rgba(251, 191, 36, 0.5)';
                if (s.type === 'decision') {
                    el.style.filter = 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.7))';
                }
            } else if (state.execPath.includes(s.id) && !state.halted) {
                el.style.boxShadow = '0 0 0 3px #34d399, 0 0 16px rgba(52, 211, 153, 0.4)';
                if (s.type === 'decision') {
                    el.style.filter = 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.6))';
                }
            } else {
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
            }

            // Execution highlight (current step)
            if (s.id === state.execShapeHighlight && !state.halted) {
                el.style.boxShadow = '0 0 0 4px #f59e0b, 0 0 24px rgba(245, 158, 11, 0.7)';
            }

            // Handles (visible when selected or in connect mode)
            if ((s.id === state.selectedId || state.mode === 'connect') && s.type !== 'connector') {
                const handles = getShapeHandles(s);
                for (const [pos, h] of Object.entries(handles)) {
                    const handleEl = document.createElement('div');
                    handleEl.className = 'fc-handle';
                    handleEl.dataset.shapeId = s.id;
                    handleEl.dataset.handlePos = pos;
                    handleEl.style.position = 'absolute';
                    handleEl.style.width = (HANDLE_SIZE * 2 / zoom) + 'px';
                    handleEl.style.height = (HANDLE_SIZE * 2 / zoom) + 'px';
                    handleEl.style.background = '#fff';
                    handleEl.style.border = '2px solid #3b82f6';
                    handleEl.style.borderRadius = '50%';
                    handleEl.style.cursor = 'crosshair';
                    handleEl.style.zIndex = '15';
                    handleEl.style.transform = 'translate(-50%, -50%)';
                    handleEl.style.left = ((h.x - s.x) / s.w * 100) + '%';
                    handleEl.style.top = ((h.y - s.y) / s.h * 100) + '%';
                    handleEl.title = pos;
                    el.appendChild(handleEl);
                }
            }

            dom.canvas.appendChild(el);
        }
    }

    function renderConnections() {
        if (!dom.canvas) return;
        // Remove old SVG overlay
        const oldSvg = dom.canvas.querySelector('.fc-connections-svg');
        if (oldSvg) oldSvg.remove();

        if (!state.connections.length && !state.connectFrom) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'fc-connections-svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';
        svg.style.zIndex = '5';

        // Arrow marker
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'fc-arrow-' + (dom.canvas.id || 'main'));
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', '0 0, 10 3.5, 0 7');
        poly.setAttribute('fill', '#64748b');
        marker.appendChild(poly);
        defs.appendChild(marker);
        svg.appendChild(defs);

        const zoom = state.zoom;
        const panX = state.panX;
        const panY = state.panY;

        // Render connections
        for (const conn of state.connections) {
            const fromShape = getShapeById(conn.fromId);
            const toShape = getShapeById(conn.toId);
            if (!fromShape || !toShape) continue;

            const fromHandles = getShapeHandles(fromShape);
            const toHandles = getShapeHandles(toShape);
            const fromPt = fromHandles[conn.fromHandle] || fromHandles.bottom;
            const toPt = toHandles[conn.toHandle] || toHandles.top;

            const x1 = fromPt.x * zoom + panX;
            const y1 = fromPt.y * zoom + panY;
            const x2 = toPt.x * zoom + panX;
            const y2 = toPt.y * zoom + panY;

            // Smart bezier routing based on handle directions
            const fromH = conn.fromHandle || 'bottom';
            const toH = conn.toHandle || 'top';
            const dx = Math.abs(x2 - x1);
            const dy = Math.abs(y2 - y1);
            let cx1, cy1, cx2, cy2;
            // Vertical connections (top↔bottom)
            if ((fromH === 'bottom' && toH === 'top') || (fromH === 'top' && toH === 'bottom')) {
                const midY = (y1 + y2) / 2;
                cx1 = x1; cy1 = midY;
                cx2 = x2; cy2 = midY;
            }
            // Horizontal connections (left↔right)
            else if ((fromH === 'left' && toH === 'right') || (fromH === 'right' && toH === 'left')) {
                const midX = (x1 + x2) / 2;
                cx1 = midX; cy1 = y1;
                cx2 = midX; cy2 = y2;
            }
            // From bottom/side to something else
            else if (fromH === 'bottom') {
                const stretch = Math.max(dy * 0.4, 40);
                cx1 = x1; cy1 = y1 + stretch;
                cx2 = x2; cy2 = y2 - Math.max(dy * 0.2, 20);
            }
            else if (fromH === 'top') {
                const stretch = Math.max(dy * 0.4, 40);
                cx1 = x1; cy1 = y1 - stretch;
                cx2 = x2; cy2 = y2 + Math.max(dy * 0.2, 20);
            }
            else if (fromH === 'left') {
                const stretch = Math.max(dx * 0.4, 40);
                cx1 = x1 - stretch; cy1 = y1;
                cx2 = x2 + Math.max(dx * 0.2, 20); cy2 = y2;
            }
            else if (fromH === 'right') {
                const stretch = Math.max(dx * 0.4, 40);
                cx1 = x1 + stretch; cy1 = y1;
                cx2 = x2 - Math.max(dx * 0.2, 20); cy2 = y2;
            }
            // Fallback
            else {
                cx1 = x1; cy1 = y1 + Math.max(dy * 0.3, 30);
                cx2 = x2; cy2 = y2 - Math.max(dy * 0.3, 30);
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', conn.label === 'لا' ? '#ef4444' : '#64748b');
            path.setAttribute('stroke-width', '2.5');
            path.setAttribute('stroke-dasharray', conn.label === 'لا' ? '6,3' : 'none');
            path.setAttribute('marker-end', 'url(#fc-arrow-' + (dom.canvas.id || 'main') + ')');
            svg.appendChild(path);

            // Connection label (positioned at midpoint of bezier, offset from curve)
            if (conn.label) {
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2 - 14;
                // Background pill for label
                const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                const tw = conn.label.length * 8 + 12;
                bg.setAttribute('x', midX - tw / 2);
                bg.setAttribute('y', midY - 11);
                bg.setAttribute('width', tw);
                bg.setAttribute('height', '20');
                bg.setAttribute('rx', '10');
                bg.setAttribute('fill', conn.label === 'لا' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)');
                bg.setAttribute('stroke', conn.label === 'لا' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)');
                bg.setAttribute('stroke-width', '1');
                svg.appendChild(bg);
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', midX);
                label.setAttribute('y', midY + 3);
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('fill', conn.label === 'لا' ? '#ef4444' : '#22c55e');
                label.setAttribute('font-size', '11');
                label.setAttribute('font-weight', 'bold');
                label.setAttribute('style', 'pointer-events: none; user-select: none;');
                label.textContent = conn.label;
                svg.appendChild(label);
            }
        }

        // Temp line while connecting
        if (state.connectFrom && state.connectFrom.shapeId) {
            const fromShape = getShapeById(state.connectFrom.shapeId);
            if (fromShape) {
                const handles = getShapeHandles(fromShape);
                const pt = handles[state.connectFrom.handle] || handles.bottom;
                const x1 = pt.x * zoom + panX;
                const y1 = pt.y * zoom + panY;

                const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                tempLine.setAttribute('class', 'fc-temp-line');
                tempLine.setAttribute('x1', x1);
                tempLine.setAttribute('y1', y1);
                tempLine.setAttribute('x2', x1);
                tempLine.setAttribute('y2', y1 + 40);
                tempLine.setAttribute('stroke', '#3b82f6');
                tempLine.setAttribute('stroke-width', '2');
                tempLine.setAttribute('stroke-dasharray', '5,3');
                tempLine.setAttribute('style', 'pointer-events: none;');
                svg.appendChild(tempLine);
            }
        }

        dom.canvas.appendChild(svg);
    }

    // Update temp line on mousemove during connection
    function updateTempLine(mx, my) {
        const line = dom.canvas ? dom.canvas.querySelector('.fc-temp-line') : null;
        if (!line) return;
        line.setAttribute('x2', mx);
        line.setAttribute('y2', my);
    }

    // ==================== EXECUTION ENGINE ====================
    function findStartShape() {
        return state.shapes.find(s => s.type === 'start' && s.role === 'start');
    }

    function findEndShape() {
        return state.shapes.find(s => s.type === 'start' && s.role === 'end');
    }

    function resetExecution() {
        state.execStep = -1;
        state.execPath = [];
        state.execShapeHighlight = null;
        state.execVars = {};
        state.execOutput = [];
        state._connCounters = {};
        state.halted = true;
        state.running = false;
        fullRender();
    }

    function getNextConnectedShape(shapeId, condition) {
        const conns = getConnectionsFrom(shapeId);
        if (conns.length === 0) return null;
        // For decision shapes, pick based on condition
        if (condition !== undefined) {
            const label = condition ? 'نعم' : 'لا';
            const c = conns.find(co => co.label === label);
            return c ? getShapeById(c.toId) : null;
        }
        // For other shapes, take the first connection
        const c = conns[0];
        return c ? getShapeById(c.toId) : null;
    }

    function stepExecution() {
        if (state.running) return; // Don't step during auto-run
        if (state.halted && state.execStep === -1) {
            // Start execution
            const start = findStartShape();
            if (!start) {
                state.execOutput.push('خطأ: لا توجد نقطة بداية');
                state.halted = true;
                fullRender();
                return;
            }
            state.execStep = 0;
            state.execPath = [start.id];
            state.execShapeHighlight = start.id;
            state.execVars = {};
            state.execOutput = [];
            state.halted = false;
            fullRender();
            return;
        }

        if (state.halted) return;

        const currentId = state.execShapeHighlight;
        if (!currentId) { state.halted = true; fullRender(); return; }

        const currentShape = getShapeById(currentId);
        if (!currentShape) { state.halted = true; fullRender(); return; }

        // Execute current shape logic
        executeShapeLogic(currentShape);

        // Find next shape
        let nextShape = null;
        if (currentShape.type === 'decision') {
            // Evaluate condition
            const cond = evaluateCondition(currentShape.text);
            nextShape = getNextConnectedShape(currentId, cond);
            state.execOutput.push('← ' + currentShape.text + ' → ' + (cond ? 'نعم' : 'لا'));
        } else {
            nextShape = getNextConnectedShape(currentId);
        }

        if (!nextShape) {
            const end = findEndShape();
            if (end) {
                state.execShapeHighlight = end.id;
                state.execPath.push(end.id);
                state.execOutput.push('✓ انتهى التنفيذ');
            } else {
                if (currentShape.type === 'start' && currentShape.role === 'end') {
                    state.execOutput.push('✓ انتهى التنفيذ');
                } else {
                    state.execOutput.push('✓ انتهى التنفيذ');
                }
            }
            state.halted = true;
            fullRender();
            return;
        }

        // Loop detection: count back-edge traversals
        state._connCounters = state._connCounters || {};
        const connKey = currentId + '->' + nextShape.id;
        state._connCounters[connKey] = (state._connCounters[connKey] || 0) + 1;
        if (state._connCounters[connKey] > MAX_LOOP_ITER) {
            state.execOutput.push('⚠ الحلقة لا تتوقف! تجاوزت ' + MAX_LOOP_ITER.toLocaleString() + ' تكرار.');
            state.halted = true;
            fullRender();
            return;
        }
        // Show loop iteration count when revisiting
        if (state._connCounters[connKey] > 1 && state._connCounters[connKey] % 100 === 0) {
            state.execOutput.push('↻ تكرار الحلقة: ' + state._connCounters[connKey]);
        }

        state.execShapeHighlight = nextShape.id;
        state.execPath.push(nextShape.id);
        state.execStep++;
        fullRender();
    }

    function runAllExecution() {
        if (!state.running) {
            state.running = true;
            resetExecution();
            stepExecution();
            runContinuation();
        }
    }

    function runContinuation() {
        if (state.halted || !state.running) { state.running = false; return; }
        // Check total steps across all connections
        const totalSteps = Object.values(state._connCounters || {}).reduce((a, b) => a + b, 0);
        if (totalSteps > MAX_LOOP_ITER * 2) {
            state.execOutput.push('⚠ توقف التنفيذ: تجاوز الحد الأقصى للخطوات');
            state.halted = true;
            state.running = false;
            fullRender();
            return;
        }
        stepExecution();
        if (!state.halted) {
            setTimeout(() => runContinuation(), 400);
        } else {
            state.running = false;
        }
    }

    function executeShapeLogic(shape) {
        if (!shape) return;
        const text = shape.text || '';
        const lower = text.toLowerCase();

        // I/O - Read: "أدخل X" or "read X" or "lire X"
        const readMatch = text.match(/^(أدخل|اقرأ|read|lire|input)\s+(\w+)/i);
        if (readMatch) {
            const varName = readMatch[2];
            const rawVal = prompt('أدخل قيمة ' + varName + ':') || '';
            const num = Number(rawVal);
            state.execVars[varName] = Number.isFinite(num) && rawVal.trim() !== '' ? num : rawVal;
            state.execOutput.push('> أدخل: ' + varName + ' = ' + state.execVars[varName]);
            return;
        }

        // I/O - Write: "أظهر X" or "write X" or "print X"
        const writeMatch = text.match(/^(أظهر|اطبع|write|print|ecrire|output|display)\s+(.+)/i);
        if (writeMatch) {
            let expr = writeMatch[2].trim();
            const val = evaluateSimpleExpr(expr);
            state.execOutput.push(String(val));
            return;
        }

        // Assignment: "X ← Y" or "X = Y" (including multi-char variable names)
        const assignMatch = text.match(/^([A-Za-z_]\w*)\s*(?:←|=)\s*(.+)/);
        if (assignMatch) {
            const varName = assignMatch[1];
            const expr = assignMatch[2].trim();
            const val = evaluateSimpleExpr(expr);
            state.execVars[varName] = val;
            state.execOutput.push('← ' + varName + ' = ' + val);
            return;
        }

        // Multi-assignment: "X ← Y, Z ← W" or "X=1, Y=2"
        const multiAssign = text.match(/^([A-Za-z_]\w*)\s*(?:←|=)\s*(.+?)\s*,\s*([A-Za-z_]\w*)\s*(?:←|=)\s*(.+)/);
        if (multiAssign) {
            const v1 = multiAssign[1], e1 = multiAssign[2].trim();
            const v2 = multiAssign[3], e2 = multiAssign[4].trim();
            state.execVars[v1] = evaluateSimpleExpr(e1);
            state.execVars[v2] = evaluateSimpleExpr(e2);
            state.execOutput.push('← ' + v1 + '=' + state.execVars[v1] + ', ' + v2 + '=' + state.execVars[v2]);
            return;
        }

        // Process - show as comment/action
        if (shape.type === 'process') {
            state.execOutput.push('⚙ ' + text);
        }
    }

    function evaluateCondition(text) {
        // Simple condition evaluation
        const match = text.match(/^(هل|if|si)\s+(.+)/i);
        const cond = match ? match[2].trim() : text;
        try {
            return Boolean(evaluateSimpleExpr(cond));
        } catch (e) {
            return false;
        }
    }

    function evaluateSimpleExpr(expr) {
        try {
            const result = fcSafeEval(expr, state.execVars);
            return result;
        } catch (e) {
            // Fallback: try as literal string
            return expr;
        }
    }

    // ==================== CODE GENERATION ====================
    function generateCode() {
        const lines = ['// الكود المولد من المخطط الانسيابي', ''];
        const start = findStartShape();
        if (!start) {
            lines.push('// لا توجد نقطة بداية');
            return lines.join('\n');
        }

        let indent = 0;
        const visited = new Set();
        const visiting = new Set(); // For cycle detection

        // Detect loop headers: decision shapes that have a back-edge (cycle)
        function findLoopHeaders() {
            const loopHeaders = new Set();
            function dfs(id, path) {
                if (path.includes(id)) {
                    // Found a cycle. The node being revisited is the loop header.
                    const cycleStart = path.indexOf(id);
                    loopHeaders.add(path[cycleStart]);
                    return;
                }
                if (visited.has(id)) return;
                visited.add(id);
                path.push(id);
                const conns = getConnectionsFrom(id);
                for (const c of conns) {
                    const next = getShapeById(c.toId);
                    if (next) dfs(next.id, [...path]);
                }
            }
            visited.clear();
            if (start) dfs(start.id, []);
            visited.clear();
            return loopHeaders;
        }

        const loopHeaders = findLoopHeaders();

        const backEdgeHeaders = findBackEdges();

        function visit(shape) {
            if (!shape) return;
            if (visited.has(shape.id)) {
                return;
            }
            visited.add(shape.id);

            const text = shape.text || '';
            const pfx = ' '.repeat(indent);

            switch (shape.type) {
                case 'start': {
                    if (shape.role !== 'end') {
                        lines.push(pfx + 'Begin');
                    } else {
                        lines.push(pfx + 'End');
                    }
                    break;
                }
                case 'io': {
                    const readMatch = text.match(/^(أدخل|اقرأ|read|lire|input)\s+(\w+)/i);
                    const writeMatch = text.match(/^(أظهر|اطبع|write|print|ecrire|output|display)\s+(.+)/i);
                    if (readMatch) {
                        lines.push(pfx + 'Read(' + readMatch[2] + ');');
                    } else if (writeMatch) {
                        lines.push(pfx + 'Write(' + writeMatch[2].trim() + ');');
                    } else {
                        lines.push(pfx + text + ';');
                    }
                    break;
                }
                case 'process': {
                    const assignMatch = text.match(/^([A-Za-z_]\w*)\s*(?:←|=)\s*(.+)/);
                    if (assignMatch) {
                        lines.push(pfx + assignMatch[1] + ' ← ' + assignMatch[2].trim() + ';');
                    } else {
                        const multiMatch = text.match(/^([A-Za-z_]\w*)\s*(?:←|=)\s*(.+?)\s*,\s*([A-Za-z_]\w*)\s*(?:←|=)\s*(.+)/);
                        if (multiMatch) {
                            lines.push(pfx + multiMatch[1] + ' ← ' + multiMatch[2].trim() + ';');
                            lines.push(pfx + multiMatch[3] + ' ← ' + multiMatch[4].trim() + ';');
                        } else {
                            lines.push(pfx + text + ';');
                        }
                    }
                    break;
                }
                case 'decision': {
                    const isLoopHeader = loopHeaders.has(shape.id);
                    const condMatch = text.replace(/^(هل|if|si)\s+/i, '');
                    const yesConn = state.connections.find(c =>
                        c.fromId === shape.id && c.label === 'نعم'
                    );
                    const noConn = state.connections.find(c =>
                        c.fromId === shape.id && c.label === 'لا'
                    );
                    // Check if branches go back (loop)
                    const noGoesBack = noConn && loopHeaders.has(shape.id);
                    const yesGoesBack = yesConn && loopHeaders.has(shape.id);

                    if (noGoesBack) {
                        // While loop: condition + body (yes branch)
                        lines.push(pfx + 'While (' + condMatch + ') Do');
                        indent += 4;
                        if (yesConn) {
                            const nextShape = getShapeById(yesConn.toId);
                            visit(nextShape);
                        }
                        indent -= 4;
                        lines.push(pfx + 'EndWhile');
                        return;
                    } else if (yesGoesBack) {
                        // Repeat-until: body (no branch) + condition
                        lines.push(pfx + 'Repeat');
                        indent += 4;
                        if (noConn) {
                            const nextShape = getShapeById(noConn.toId);
                            visit(nextShape);
                        }
                        indent -= 4;
                        lines.push(pfx + 'Until (' + condMatch + ')');
                        return;
                    } else {
                        // Standard if/else
                        lines.push(pfx + 'If (' + condMatch + ') Then');
                        if (yesConn) {
                            indent += 4;
                            const nextShape = getShapeById(yesConn.toId);
                            visit(nextShape);
                            indent -= 4;
                        }
                        if (noConn) {
                            lines.push(pfx + 'Else');
                            indent += 4;
                            const nextShape = getShapeById(noConn.toId);
                            visit(nextShape);
                            indent -= 4;
                        }
                        lines.push(pfx + 'EndIf');
                        return;
                    }
                }
                case 'connector': {
                    lines.push(pfx + '// نقطة ربط');
                    break;
                }
            }

            // Follow connection (for non-decision shapes)
            if (shape.type !== 'decision') {
                const conns = getConnectionsFrom(shape.id);
                if (conns.length > 0) {
                    const next = getShapeById(conns[0].toId);
                    visit(next);
                }
            }
        }

        visit(start);
        return lines.join('\n');
    }

    // ==================== RENDER EXECUTION STATE ====================
    function renderExecutionState() {
        // Update variables table
        if (dom.flowVarsBody) {
            const entries = Object.entries(state.execVars).filter(([k]) => !k.startsWith('__'));
            if (!entries.length) {
                dom.flowVarsBody.innerHTML = '<tr><td colspan="2" style="padding:1rem;text-align:center;color:var(--text-secondary);">لا توجد متغيرات نشطة</td></tr>';
            } else {
                dom.flowVarsBody.innerHTML = entries.map(([k, v]) => {
                    const val = typeof v === 'string' ? (v.startsWith('"') ? v : '"' + v + '"') : String(v);
                    return '<tr><td style="padding:0.4rem 0.5rem;font-weight:700;">' + escapeHtml(k) + '</td><td style="padding:0.4rem 0.5rem;direction:ltr;text-align:left;font-family:monospace;">' + escapeHtml(val) + '</td></tr>';
                }).join('');
            }
        }
    }

    function renderVariables() {
        renderExecutionState();
    }

    function renderOutput() {
        if (dom.flowOutput) {
            dom.flowOutput.textContent = state.execOutput.join('\n');
        }
    }

    function renderCode() {
        if (dom.flowGeneratedCode) {
            dom.flowGeneratedCode.textContent = generateCode();
        }
    }

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // ==================== DRAG & DROP ====================
    function setupDragDrop() {
        if (!dom.workspace || !dom.canvas) return;

        // Drag from sidebar
        dom.shapeItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.shape);
                e.dataTransfer.effectAllowed = 'copy';
                item.style.opacity = '0.5';
            });
            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
            });
        });

        // Drop on workspace
        dom.workspace.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        dom.workspace.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('text/plain');
            if (!type || !SHAPE_DEFAULTS[type]) return;
            const rect = dom.workspace.getBoundingClientRect();
            const x = (e.clientX - rect.left - state.panX) / state.zoom;
            const y = (e.clientY - rect.top - state.panY) / state.zoom;
            addShape(type, x, y);
            if (dom.workspace) dom.workspace.focus();
        });

        // Click on sidebar items to select shape type, then click on canvas to place
        let pendingShapeType = null;
        dom.shapeItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = item.dataset.shape;
                if (!type || !SHAPE_DEFAULTS[type]) return;
                if (type === 'connector') {
                    // Toggle connect mode
                    state.mode = state.mode === 'connect' ? 'select' : 'connect';
                    dom.shapeItems.forEach(it => it.style.borderColor = '');
                    if (state.mode === 'connect') {
                        item.style.borderColor = '#22c55e';
                        item.style.background = 'rgba(34, 197, 94, 0.15)';
                    }
                    fullRender();
                    return;
                }
                // For other shapes: switch to click-to-place mode
                pendingShapeType = type;
                dom.shapeItems.forEach(it => it.style.borderColor = '');
                item.style.borderColor = '#f59e0b';
                item.style.background = 'rgba(245, 158, 11, 0.15)';
                dom.workspace.style.cursor = 'cell';

                // One-time click handler on workspace
                const placeHandler = (ev) => {
                    if (ev.target.closest('.fc-shape-el') || ev.target.closest('.fc-handle')) return;
                    if (ev.target.closest('.fc-connections-svg')) return;
                    if (ev.target.closest('.fc-zoom-btn') || ev.target.closest('.fc-zoom-bar')) return;
                    const rect = dom.workspace.getBoundingClientRect();
                    const x = (ev.clientX - rect.left - state.panX) / state.zoom;
                    const y = (ev.clientY - rect.top - state.panY) / state.zoom;
                    addShape(pendingShapeType, x, y);
                    pendingShapeType = null;
                    dom.shapeItems.forEach(it => { it.style.borderColor = ''; it.style.background = ''; });
                    dom.workspace.style.cursor = state.mode === 'connect' ? 'crosshair' : 'default';
                    dom.workspace.removeEventListener('click', placeHandler);
                };
                dom.workspace.addEventListener('click', placeHandler);
            });
        });
    }

    // ==================== SHAPE MANIPULATION ====================
    function setupShapeManipulation() {
        if (!dom.canvas) return;

        // Mouse down on canvas (for shape selection, drag, connect)
        dom.canvas.addEventListener('mousedown', (e) => {
            const target = e.target;

            // Handle click on connection handles
            if (target.classList.contains('fc-handle')) {
                if (state.mode === 'connect') {
                    const shapeId = target.dataset.shapeId;
                    const pos = target.dataset.handlePos;
                    if (!state.connectFrom) {
                        state.connectFrom = { shapeId, handle: pos };
                    } else if (state.connectFrom.shapeId !== shapeId) {
                        addConnection(state.connectFrom.shapeId, state.connectFrom.handle, shapeId, pos);
                        state.connectFrom = null;
                    } else {
                        state.connectFrom = null;
                    }
                    fullRender();
                    return;
                }
                return;
            }

            // Find clicked shape
            const shapeEl = target.closest('.fc-shape-el');
            if (shapeEl) {
                const id = shapeEl.dataset.id;
                const shape = getShapeById(id);
                if (!shape) return;

                if (state.mode === 'connect') {
                    // Click on shape in connect mode - select handle mode
                    // Click again to place connection
                    if (!state.connectFrom) {
                        // Auto-select bottom handle
                        state.connectFrom = { shapeId: id, handle: 'bottom' };
                        fullRender();
                    } else if (state.connectFrom.shapeId !== id) {
                        addConnection(state.connectFrom.shapeId, state.connectFrom.handle, id, 'top');
                        state.connectFrom = null;
                        fullRender();
                    } else {
                        state.connectFrom = null;
                        fullRender();
                    }
                    return;
                }

                // Select shape
                selectShape(id);

                // Start drag
                state.isDragging = true;
                state.dragTarget = id;
                const rect = dom.canvas.getBoundingClientRect();
                state.dragOffsetX = (e.clientX - rect.left - state.panX) / state.zoom - shape.x;
                state.dragOffsetY = (e.clientY - rect.top - state.panY) / state.zoom - shape.y;
                e.preventDefault();
                return;
            }

            // Click on empty canvas - deselect
            selectShape(null);

            // Middle-click panning
            if (e.button === 1 || e.shiftKey) {
                state.isPanning = true;
                state.panStartX = e.clientX;
                state.panStartY = e.clientY;
                state.panStartPanX = state.panX;
                state.panStartPanY = state.panY;
                dom.canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        // Mouse move for drag and pan
        document.addEventListener('mousemove', (e) => {
            if (state.isPanning) {
                state.panX = state.panStartPanX + (e.clientX - state.panStartX);
                state.panY = state.panStartPanY + (e.clientY - state.panStartY);
                fullRender();
                return;
            }

            if (state.isDragging && state.dragTarget) {
                const shape = getShapeById(state.dragTarget);
                if (!shape) return;
                const rect = dom.canvas.getBoundingClientRect();
                const snap = 20;
                let nx = Math.round(((e.clientX - rect.left - state.panX) / state.zoom - state.dragOffsetX) / snap) * snap;
                let ny = Math.round(((e.clientY - rect.top - state.panY) / state.zoom - state.dragOffsetY) / snap) * snap;
                nx = Math.max(0, nx);
                ny = Math.max(0, ny);
                shape.x = nx;
                shape.y = ny;
                updateTempLine(
                    (e.clientX - rect.left),
                    (e.clientY - rect.top)
                );
                fullRender();
                return;
            }

            // Update temp connection line
            if (state.connectFrom) {
                const rect = dom.canvas.getBoundingClientRect();
                updateTempLine(
                    (e.clientX - rect.left),
                    (e.clientY - rect.top)
                );
            }
        });

        // Mouse up
        document.addEventListener('mouseup', (e) => {
            if (state.isDragging && state.dragTarget) {
                pushHistory();
            }
            state.isDragging = false;
            state.dragTarget = null;
            state.isPanning = false;
            if (dom.canvas) dom.canvas.style.cursor = state.mode === 'connect' ? 'crosshair' : '';
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Delete shape
            if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId) {
                // Don't delete if editing an input or selecting from dropdown
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
                removeShape(state.selectedId);
                e.preventDefault();
            }
            // Undo
            if (e.ctrlKey && e.key === 'z') {
                undo();
                e.preventDefault();
            }
            // Redo
            if (e.ctrlKey && e.key === 'y') {
                redo();
                e.preventDefault();
            }
            // Escape - cancel connect mode
            if (e.key === 'Escape') {
                state.mode = 'select';
                state.connectFrom = null;
                dom.shapeItems.forEach(it => { it.style.borderColor = ''; it.style.background = ''; });
                fullRender();
            }
        });
    }

    // ==================== ZOOM ====================
    function zoomIn() {
        state.zoom = Math.min(ZOOM_MAX, state.zoom + ZOOM_STEP);
        updateZoomLabel();
        fullRender();
    }

    function zoomOut() {
        state.zoom = Math.max(ZOOM_MIN, state.zoom - ZOOM_STEP);
        updateZoomLabel();
        fullRender();
    }

    function zoomReset() {
        state.zoom = 1;
        state.panX = 0;
        state.panY = 0;
        updateZoomLabel();
        fullRender();
    }

    function updateZoomLabel() {
        if (dom.zoomLabel) dom.zoomLabel.textContent = Math.round(state.zoom * 100) + '%';
    }

    function setupZoom() {
        if (!dom.workspace) return;

        dom.workspace.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) zoomIn();
                else zoomOut();
            }
        }, { passive: false });

        // Touch pinch zoom
        let lastTouchDist = 0;
        dom.workspace.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDist = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: true });

        dom.workspace.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (lastTouchDist > 0) {
                    if (dist > lastTouchDist) zoomIn();
                    else if (dist < lastTouchDist) zoomOut();
                }
                lastTouchDist = dist;
            }
        }, { passive: false });
    }

    // ==================== TOUCH SUPPORT ====================
    function setupTouch() {
        if (!dom.canvas) return;
        let touchDragId = null;
        let touchOffsetX = 0;
        let touchOffsetY = 0;

        dom.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            const rect = dom.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            const shape = shapeAt(x, y);
            if (shape) {
                touchDragId = shape.id;
                touchOffsetX = (x - state.panX) / state.zoom - shape.x;
                touchOffsetY = (y - state.panY) / state.zoom - shape.y;
                selectShape(shape.id);
                e.preventDefault();
            }
        }, { passive: false });

        dom.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1 || !touchDragId) return;
            const touch = e.touches[0];
            const rect = dom.canvas.getBoundingClientRect();
            const shape = getShapeById(touchDragId);
            if (!shape) return;
            const snap = 20;
            shape.x = Math.max(0, Math.round(((touch.clientX - rect.left - state.panX) / state.zoom - touchOffsetX) / snap) * snap);
            shape.y = Math.max(0, Math.round(((touch.clientY - rect.top - state.panY) / state.zoom - touchOffsetY) / snap) * snap);
            fullRender();
            e.preventDefault();
        }, { passive: false });

        dom.canvas.addEventListener('touchend', () => {
            if (touchDragId) pushHistory();
            touchDragId = null;
        }, { passive: true });
    }

    // ==================== SETUP EVENTS ====================
    function setupEvents() {
        // Properties panel
        if (dom.shapeText) {
            dom.shapeText.addEventListener('input', () => {
                if (state.selectedId) {
                    updateShapeText(state.selectedId, dom.shapeText.value);
                }
            });
        }
        if (dom.shapeColor) {
            dom.shapeColor.addEventListener('change', () => {
                if (state.selectedId) {
                    updateShapeColor(state.selectedId, dom.shapeColor.value);
                }
            });
        }
        if (dom.shapeRole) {
            dom.shapeRole.addEventListener('change', () => {
                if (state.selectedId) {
                    updateShapeRole(state.selectedId, dom.shapeRole.value);
                }
            });
        }

        // Execute buttons
        if (dom.flowRunBtn) {
            dom.flowRunBtn.addEventListener('click', () => {
                runAllExecution();
            });
        }
        if (dom.flowStepBtn) {
            dom.flowStepBtn.addEventListener('click', () => {
                stepExecution();
            });
        }
        if (dom.flowResetBtn) {
            dom.flowResetBtn.addEventListener('click', () => {
                resetExecution();
            });
        }

        // Export code button
        if (dom.exportBtn) {
            dom.exportBtn.addEventListener('click', () => {
                const code = generateCode();
                // Copy to clipboard
                navigator.clipboard.writeText(code).then(() => {
                    const original = dom.exportBtn.innerHTML;
                    dom.exportBtn.innerHTML = '<i class="ph ph-check"></i> تم النسخ';
                    setTimeout(() => { dom.exportBtn.innerHTML = original; }, 2000);
                }).catch(() => {
                    alert(code);
                });
            });
        }

        // Clear all button
        if (dom.clearBtn) {
            dom.clearBtn.addEventListener('click', () => {
                if (state.shapes.length === 0) return;
                if (confirm('هل تريد مسح جميع العناصر من اللوحة؟')) {
                    removeAllShapes();
                }
            });
        }

        // Zoom buttons (if exist)
        const zoomInBtn = document.querySelector('.fc-zoom-in');
        const zoomOutBtn = document.querySelector('.fc-zoom-out');
        const zoomResetBtn = document.querySelector('.fc-zoom-reset');
        const zoomFitBtn = document.querySelector('.fc-zoom-fit');
        if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', zoomReset);
        if (zoomFitBtn) zoomFitBtn.addEventListener('click', zoomToFit);

        // Save / Load buttons
        const saveBtn = document.getElementById('fcSaveBtn');
        const loadBtn = document.getElementById('fcLoadBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const name = prompt('اسم المخطط للحفظ:', '');
                if (name) saveChart(name);
            });
        }
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                const saves = listSaves();
                if (saves.length === 0) { showToast('❌ لا توجد مخططات محفوظة'); return; }
                const list = saves.map(([k, v]) => k).join('\n');
                const name = prompt('اختر اسماً للتحميل:\n' + list);
                if (name) loadChart(name);
            });
        }

        // Auto Layout button
        const layoutBtn = document.getElementById('fcAutoLayoutBtn');
        if (layoutBtn) layoutBtn.addEventListener('click', autoLayout);

        // Example selector
        const exampleSelect = document.getElementById('fcExampleSelect');
        if (exampleSelect) {
            exampleSelect.addEventListener('change', () => {
                const val = exampleSelect.value;
                if (val && examples[val]) {
                    loadExample(val);
                }
                exampleSelect.value = '';
            });
        }

        // Auto-save on pushHistory via intercepting shapes changes
        var _origPushHistory = pushHistory;
        pushHistory = function() {
            _origPushHistory();
            autoSave();
        };
    }

    // ==================== SAVE / LOAD ====================
    function getStateHash() {
        return JSON.stringify({ shapes: state.shapes, connections: state.connections });
    }

    function autoSave() {
        try {
            localStorage.setItem(STORAGE_AUTO_KEY, JSON.stringify({
                shapes: state.shapes,
                connections: state.connections,
                execVars: state.execVars,
                execOutput: state.execOutput,
                nextId: state.nextId
            }));
            state._lastSaveHash = getStateHash();
        } catch (e) { /* storage full - ignore */ }
    }

    function saveChart(name) {
        const label = name || prompt('اسم المخطط:', '') || 'مخطط_' + new Date().toLocaleDateString('ar-SA');
        if (!label) return;
        try {
            const saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            saves[label] = {
                shapes: cloneShapes(),
                connections: cloneConnections(),
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
            showToast('✅ تم حفظ المخطط "' + label + '"');
            return label;
        } catch (e) {
            showToast('❌ فشل الحفظ: ' + e.message);
            return null;
        }
    }

    function listSaves() {
        try {
            return Object.entries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
        } catch (e) { return []; }
    }

    function loadChart(name) {
        try {
            const saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            const entry = saves[name];
            if (!entry) { showToast('❌ لم يتم العثور على "' + name + '"'); return false; }
            state.shapes = JSON.parse(JSON.stringify(entry.shapes));
            state.connections = JSON.parse(JSON.stringify(entry.connections));
            state.selectedId = null;
            resetExecution();
            pushHistory();
            fullRender();
            showToast('✅ تم تحميل "' + name + '"');
            return true;
        } catch (e) {
            showToast('❌ فشل التحميل: ' + e.message);
            return false;
        }
    }

    function deleteChart(name) {
        try {
            const saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            delete saves[name];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
            showToast('🗑 تم حذف "' + name + '"');
        } catch (e) { /* ignore */ }
    }

    function showToast(msg) {
        let toast = document.getElementById('fcToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'fcToast';
            toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#e2e8f0;padding:0.75rem 1.5rem;border-radius:12px;font-weight:700;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.4);transition:all 0.3s ease;opacity:0;font-family:inherit;direction:rtl;';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 2500);
    }

    // ==================== ZOOM TO FIT ====================
    function zoomToFit() {
        if (state.shapes.length === 0) { zoomReset(); return; }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        state.shapes.forEach(s => {
            if (s.x < minX) minX = s.x;
            if (s.y < minY) minY = s.y;
            if (s.x + s.w > maxX) maxX = s.x + s.w;
            if (s.y + s.h > maxY) maxY = s.y + s.h;
        });
        const padding = 60;
        const contentW = maxX - minX + padding * 2;
        const contentH = maxY - minY + padding * 2;
        const canvasEl = dom.canvas;
        if (!canvasEl) return;
        const availW = canvasEl.clientWidth - 40;
        const availH = canvasEl.clientHeight - 40;
        const zoomX = availW / contentW;
        const zoomY = availH / contentH;
        state.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.min(zoomX, zoomY)));
        // Center in viewport
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        state.panX = (canvasEl.clientWidth / 2) - (centerX * state.zoom);
        state.panY = (canvasEl.clientHeight / 2) - (centerY * state.zoom);
        updateZoomLabel();
        fullRender();
    }

    // ==================== AUTO LAYOUT ====================
    function autoLayout() {
        if (state.shapes.length === 0) return;
        const start = findStartShape();
        if (!start) { showToast('❌ لا توجد نقطة بداية لترتيب المخطط'); return; }
        // BFS to assign levels
        const levels = {};
        const visited = new Set();
        const queue = [{ id: start.id, level: 0 }];
        visited.add(start.id);
        while (queue.length > 0) {
            const { id, level } = queue.shift();
            if (!levels[level]) levels[level] = [];
            levels[level].push(id);
            const conns = getConnectionsFrom(id);
            for (const c of conns) {
                if (!visited.has(c.toId)) {
                    visited.add(c.toId);
                    queue.push({ id: c.toId, level: level + 1 });
                }
            }
        }
        const spacingX = 220, spacingY = 130, startX = 60, startY = 40;
        const levelIds = Object.keys(levels).sort((a, b) => Number(a) - Number(b));
        for (const lv of levelIds) {
            const ids = levels[lv];
            const totalW = (ids.length - 1) * spacingX;
            ids.forEach((id, i) => {
                const shape = getShapeById(id);
                if (shape) {
                    shape.x = startX + i * spacingX - totalW / 2 - shape.w / 2;
                    shape.y = startY + Number(lv) * spacingY;
                    if (shape.x < 0) shape.x = 20;
                    if (shape.y < 0) shape.y = 20;
                }
            });
        }
        pushHistory();
        fullRender();
        zoomToFit();
        showToast('✅ تم ترتيب المخطط تلقائياً');
    }

    // ==================== SAFE EXPRESSION EVALUATOR ====================
    function fcSafeEval(expr, vars) {
        let pos = 0;
        const s = String(expr ?? '').trim();
        function peek() { return pos < s.length ? s[pos] : null; }
        function consume() { return pos < s.length ? s[pos++] : null; }
        function skipWS() { while (pos < s.length && s[pos] === ' ') pos++; }
        function parseExpr() { skipWS(); return parseOr(); }
        function parseOr() {
            let left = parseAnd(); skipWS();
            while (peek() === '|' && s[pos + 1] === '|') { pos += 2; const right = parseAnd(); left = Boolean(left) || Boolean(right); skipWS(); }
            return left;
        }
        function parseAnd() {
            let left = parseComparison(); skipWS();
            while (peek() === '&' && s[pos + 1] === '&') { pos += 2; const right = parseComparison(); left = Boolean(left) && Boolean(right); skipWS(); }
            return left;
        }
        function parseComparison() {
            let left = parseAddSub(); skipWS();
            const op = peek();
            if (op === '<' || op === '>' || op === '=' || op === '!') {
                let fullOp = consume();
                if ((fullOp === '<' || fullOp === '>') && peek() === '=') { fullOp += consume(); }
                if (fullOp === '<' && peek() === '>') { fullOp += consume(); }
                if (fullOp === '=' && peek() === '=') { fullOp += consume(); }
                if (fullOp === '!' && peek() === '=') { fullOp += consume(); }
                const right = parseAddSub();
                if (fullOp === '==') return left == right;
                if (fullOp === '!=' || fullOp === '<>') return left != right;
                if (fullOp === '<') return left < right;
                if (fullOp === '>') return left > right;
                if (fullOp === '<=') return left <= right;
                if (fullOp === '>=') return left >= right;
            }
            return left;
        }
        function parseAddSub() {
            let left = parseMulDiv(); skipWS();
            while (peek() === '+' || peek() === '-') {
                const op = consume(); const right = parseMulDiv(); skipWS();
                if (op === '+') left = (typeof left === 'number' && typeof right === 'number') ? left + right : String(left) + String(right);
                else left = left - right;
            }
            return left;
        }
        function parseMulDiv() {
            let left = parseUnary(); skipWS();
            while (true) {
                skipWS();
                if (peek() === '*') { consume(); const right = parseUnary(); skipWS(); left = left * right; }
                else if (peek() === '/') { consume(); const right = parseUnary(); skipWS(); if (right === 0) throw new Error('Division by zero'); left = left / right; }
                else if (peek() === '%') { consume(); const right = parseUnary(); skipWS(); if (right === 0) throw new Error('Mod by zero'); left = left % right; }
                else break;
            }
            return left;
        }
        function parseUnary() {
            skipWS();
            if (peek() === '!') { consume(); return !Boolean(parseUnary()); }
            if (peek() === '-') { consume(); return -parseUnary(); }
            return parsePrimary();
        }
        function parsePrimary() {
            skipWS();
            if (peek() === '(') { consume(); const val = parseExpr(); skipWS(); if (peek() === ')') consume(); return val; }
            if (peek() === '"' || peek() === "'") {
                const quote = consume(); let str = '';
                while (pos < s.length && peek() !== quote) str += consume();
                if (peek() === quote) consume();
                return str;
            }
            let word = '';
            while (pos < s.length && /[a-zA-Z0-9_\u0600-\u06FF]/.test(peek())) word += consume();
            if (!word) throw new Error('Empty expression');
            if (word === 'true' || word === 'True' || word === 'TRUE') return true;
            if (word === 'false' || word === 'False' || word === 'FALSE') return false;
            if (word in vars) return vars[word];
            const num = Number(word);
            if (!isNaN(num) && word !== '') return num;
            return word;
        }
        return parseExpr();
    }

    // ==================== PRE-BUILT EXAMPLES ====================
    const examples = {
        max: {
            shapes: [
                { id: 'ex_s1', type: 'start', x: 200, y: 20, text: 'بداية', color: 'default', role: 'start' },
                { id: 'ex_s2', type: 'io', x: 185, y: 110, text: 'أدخل A, B', color: 'default', role: null },
                { id: 'ex_s3', type: 'process', x: 185, y: 200, text: 'Max ← A', color: 'default', role: null },
                { id: 'ex_s4', type: 'decision', x: 185, y: 300, text: 'B > Max؟', color: 'default', role: null },
                { id: 'ex_s5', type: 'process', x: 280, y: 400, text: 'Max ← B', color: 'success', role: null },
                { id: 'ex_s6', type: 'io', x: 80, y: 500, text: 'أظهر Max', color: 'default', role: null },
                { id: 'ex_s7', type: 'start', x: 200, y: 600, text: 'نهاية', color: 'default', role: 'end' }
            ],
            connections: [
                { fromId: 'ex_s1', fromHandle: 'bottom', toId: 'ex_s2', toHandle: 'top', label: '' },
                { fromId: 'ex_s2', fromHandle: 'bottom', toId: 'ex_s3', toHandle: 'top', label: '' },
                { fromId: 'ex_s3', fromHandle: 'bottom', toId: 'ex_s4', toHandle: 'top', label: '' },
                { fromId: 'ex_s4', fromHandle: 'right', toId: 'ex_s5', toHandle: 'top', label: 'نعم' },
                { fromId: 'ex_s4', fromHandle: 'left', toId: 'ex_s6', toHandle: 'top', label: 'لا' },
                { fromId: 'ex_s5', fromHandle: 'bottom', toId: 'ex_s6', toHandle: 'top', label: '' },
                { fromId: 'ex_s6', fromHandle: 'bottom', toId: 'ex_s7', toHandle: 'top', label: '' }
            ]
        },
        fact: {
            shapes: [
                { id: 'ex_f1', type: 'start', x: 200, y: 20, text: 'بداية', color: 'default', role: 'start' },
                { id: 'ex_f2', type: 'io', x: 185, y: 110, text: 'أدخل N', color: 'default', role: null },
                { id: 'ex_f3', type: 'process', x: 160, y: 200, text: 'F ← 1, I ← 1', color: 'default', role: null },
                { id: 'ex_f4', type: 'decision', x: 175, y: 300, text: 'I ≤ N؟', color: 'default', role: null },
                { id: 'ex_f5', type: 'process', x: 270, y: 400, text: 'F ← F × I', color: 'default', role: null },
                { id: 'ex_f6', type: 'process', x: 270, y: 490, text: 'I ← I + 1', color: 'default', role: null },
                { id: 'ex_f7', type: 'io', x: 80, y: 580, text: 'أظهر F', color: 'default', role: null },
                { id: 'ex_f8', type: 'start', x: 200, y: 680, text: 'نهاية', color: 'default', role: 'end' }
            ],
            connections: [
                { fromId: 'ex_f1', fromHandle: 'bottom', toId: 'ex_f2', toHandle: 'top', label: '' },
                { fromId: 'ex_f2', fromHandle: 'bottom', toId: 'ex_f3', toHandle: 'top', label: '' },
                { fromId: 'ex_f3', fromHandle: 'bottom', toId: 'ex_f4', toHandle: 'top', label: '' },
                { fromId: 'ex_f4', fromHandle: 'right', toId: 'ex_f5', toHandle: 'top', label: 'نعم' },
                { fromId: 'ex_f5', fromHandle: 'bottom', toId: 'ex_f6', toHandle: 'top', label: '' },
                { fromId: 'ex_f6', fromHandle: 'bottom', toId: 'ex_f4', toHandle: 'right', label: '' },
                { fromId: 'ex_f4', fromHandle: 'left', toId: 'ex_f7', toHandle: 'top', label: 'لا' },
                { fromId: 'ex_f7', fromHandle: 'bottom', toId: 'ex_f8', toHandle: 'top', label: '' }
            ]
        },
        sumNumbers: {
            shapes: [
                { id: 'ex_sn1', type: 'start', x: 200, y: 20, text: 'بداية', color: 'default', role: 'start' },
                { id: 'ex_sn2', type: 'io', x: 185, y: 110, text: 'أدخل N', color: 'default', role: null },
                { id: 'ex_sn3', type: 'process', x: 150, y: 200, text: 'Sum ← 0, I ← 1', color: 'default', role: null },
                { id: 'ex_sn4', type: 'decision', x: 175, y: 300, text: 'I ≤ N؟', color: 'default', role: null },
                { id: 'ex_sn5', type: 'process', x: 280, y: 400, text: 'Sum ← Sum + I', color: 'default', role: null },
                { id: 'ex_sn6', type: 'process', x: 280, y: 490, text: 'I ← I + 1', color: 'default', role: null },
                { id: 'ex_sn7', type: 'io', x: 80, y: 580, text: 'أظهر Sum', color: 'default', role: null },
                { id: 'ex_sn8', type: 'start', x: 200, y: 680, text: 'نهاية', color: 'default', role: 'end' }
            ],
            connections: [
                { fromId: 'ex_sn1', fromHandle: 'bottom', toId: 'ex_sn2', toHandle: 'top', label: '' },
                { fromId: 'ex_sn2', fromHandle: 'bottom', toId: 'ex_sn3', toHandle: 'top', label: '' },
                { fromId: 'ex_sn3', fromHandle: 'bottom', toId: 'ex_sn4', toHandle: 'top', label: '' },
                { fromId: 'ex_sn4', fromHandle: 'right', toId: 'ex_sn5', toHandle: 'top', label: 'نعم' },
                { fromId: 'ex_sn5', fromHandle: 'bottom', toId: 'ex_sn6', toHandle: 'top', label: '' },
                { fromId: 'ex_sn6', fromHandle: 'bottom', toId: 'ex_sn4', toHandle: 'right', label: '' },
                { fromId: 'ex_sn4', fromHandle: 'left', toId: 'ex_sn7', toHandle: 'top', label: 'لا' },
                { fromId: 'ex_sn7', fromHandle: 'bottom', toId: 'ex_sn8', toHandle: 'top', label: '' }
            ]
        },
        evenOdd: {
            shapes: [
                { id: 'ex_eo1', type: 'start', x: 200, y: 20, text: 'بداية', color: 'default', role: 'start' },
                { id: 'ex_eo2', type: 'io', x: 185, y: 110, text: 'أدخل X', color: 'default', role: null },
                { id: 'ex_eo3', type: 'process', x: 175, y: 200, text: 'R ← X % 2', color: 'default', role: null },
                { id: 'ex_eo4', type: 'decision', x: 140, y: 300, text: 'R = 0؟', color: 'default', role: null },
                { id: 'ex_eo5', type: 'io', x: 70, y: 420, text: 'أظهر "زوجي"', color: 'success', role: null },
                { id: 'ex_eo6', type: 'io', x: 250, y: 420, text: 'أظهر "فردي"', color: 'warning', role: null },
                { id: 'ex_eo7', type: 'start', x: 200, y: 540, text: 'نهاية', color: 'default', role: 'end' }
            ],
            connections: [
                { fromId: 'ex_eo1', fromHandle: 'bottom', toId: 'ex_eo2', toHandle: 'top', label: '' },
                { fromId: 'ex_eo2', fromHandle: 'bottom', toId: 'ex_eo3', toHandle: 'top', label: '' },
                { fromId: 'ex_eo3', fromHandle: 'bottom', toId: 'ex_eo4', toHandle: 'top', label: '' },
                { fromId: 'ex_eo4', fromHandle: 'left', toId: 'ex_eo5', toHandle: 'top', label: 'نعم' },
                { fromId: 'ex_eo4', fromHandle: 'right', toId: 'ex_eo6', toHandle: 'top', label: 'لا' },
                { fromId: 'ex_eo5', fromHandle: 'bottom', toId: 'ex_eo7', toHandle: 'top', label: '' },
                { fromId: 'ex_eo6', fromHandle: 'bottom', toId: 'ex_eo7', toHandle: 'top', label: '' }
            ]
        },
        calc: {
            shapes: [
                { id: 'ex_c1', type: 'start', x: 200, y: 20, text: 'بداية', color: 'default', role: 'start' },
                { id: 'ex_c2', type: 'io', x: 170, y: 110, text: 'أدخل A', color: 'default', role: null },
                { id: 'ex_c3', type: 'io', x: 170, y: 200, text: 'أدخل B', color: 'default', role: null },
                { id: 'ex_c4', type: 'process', x: 170, y: 290, text: 'C ← A + B', color: 'default', role: null },
                { id: 'ex_c5', type: 'process', x: 170, y: 380, text: 'D ← A - B', color: 'default', role: null },
                { id: 'ex_c6', type: 'process', x: 170, y: 470, text: 'E ← A × B', color: 'default', role: null },
                { id: 'ex_c7', type: 'process', x: 170, y: 560, text: 'F ← A / B', color: 'warning', role: null },
                { id: 'ex_c8', type: 'io', x: 90, y: 660, text: 'أظهر C, D', color: 'default', role: null },
                { id: 'ex_c9', type: 'io', x: 260, y: 660, text: 'أظهر E, F', color: 'default', role: null },
                { id: 'ex_c10', type: 'start', x: 200, y: 770, text: 'نهاية', color: 'default', role: 'end' }
            ],
            connections: [
                { fromId: 'ex_c1', fromHandle: 'bottom', toId: 'ex_c2', toHandle: 'top', label: '' },
                { fromId: 'ex_c2', fromHandle: 'bottom', toId: 'ex_c3', toHandle: 'top', label: '' },
                { fromId: 'ex_c3', fromHandle: 'bottom', toId: 'ex_c4', toHandle: 'top', label: '' },
                { fromId: 'ex_c4', fromHandle: 'bottom', toId: 'ex_c5', toHandle: 'top', label: '' },
                { fromId: 'ex_c5', fromHandle: 'bottom', toId: 'ex_c6', toHandle: 'top', label: '' },
                { fromId: 'ex_c6', fromHandle: 'bottom', toId: 'ex_c7', toHandle: 'top', label: '' },
                { fromId: 'ex_c7', fromHandle: 'bottom', toId: 'ex_c8', toHandle: 'top', label: '' },
                { fromId: 'ex_c7', fromHandle: 'right', toId: 'ex_c9', toHandle: 'top', label: '' },
                { fromId: 'ex_c8', fromHandle: 'bottom', toId: 'ex_c10', toHandle: 'top', label: '' },
                { fromId: 'ex_c9', fromHandle: 'bottom', toId: 'ex_c10', toHandle: 'top', label: '' }
            ]
        },
        tempConv: {
            shapes: [
                { id: 'ex_t1', type: 'start', x: 200, y: 20, text: 'بداية', color: 'default', role: 'start' },
                { id: 'ex_t2', type: 'io', x: 170, y: 110, text: 'أدخل C', color: 'default', role: null },
                { id: 'ex_t3', type: 'process', x: 170, y: 200, text: 'F ← (C × 9/5) + 32', color: 'default', role: null },
                { id: 'ex_t4', type: 'io', x: 100, y: 300, text: 'أظهر C + "°C"', color: 'default', role: null },
                { id: 'ex_t5', type: 'io', x: 260, y: 300, text: 'أظهر F + "°F"', color: 'warning', role: null },
                { id: 'ex_t6', type: 'start', x: 200, y: 420, text: 'نهاية', color: 'default', role: 'end' }
            ],
            connections: [
                { fromId: 'ex_t1', fromHandle: 'bottom', toId: 'ex_t2', toHandle: 'top', label: '' },
                { fromId: 'ex_t2', fromHandle: 'bottom', toId: 'ex_t3', toHandle: 'top', label: '' },
                { fromId: 'ex_t3', fromHandle: 'bottom', toId: 'ex_t4', toHandle: 'top', label: '' },
                { fromId: 'ex_t3', fromHandle: 'right', toId: 'ex_t5', toHandle: 'top', label: '' },
                { fromId: 'ex_t4', fromHandle: 'bottom', toId: 'ex_t6', toHandle: 'top', label: '' },
                { fromId: 'ex_t5', fromHandle: 'bottom', toId: 'ex_t6', toHandle: 'top', label: '' }
            ]
        }
    };

    function loadExample(name) {
        const ex = examples[name];
        if (!ex) return;
        state.shapes = JSON.parse(JSON.stringify(ex.shapes));
        state.connections = JSON.parse(JSON.stringify(ex.connections));
        state.selectedId = null;
        state.nextId = 1000;
        // Auto-fit canvas
        let maxX = 0,
            maxY = 0;
        state.shapes.forEach(s => {
            if (s.x + s.w > maxX) maxX = s.x + s.w;
            if (s.y + s.h > maxY) maxY = s.y + s.h;
        });
        pushHistory();
        fullRender();
    }

    // ==================== INIT ====================
    function init() {
        cacheDom();
        if (!dom.canvas) return; // Not on a flowchart page

        setupDragDrop();
        setupShapeManipulation();
        setupZoom();
        setupTouch();
        setupEvents();

        // Try to load auto-saved state
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_AUTO_KEY));
            if (saved && saved.shapes && saved.shapes.length > 0) {
                state.shapes = saved.shapes;
                state.connections = saved.connections || [];
                state.execVars = saved.execVars || {};
                state.execOutput = saved.execOutput || [];
                state.nextId = saved.nextId || 1000;
            }
        } catch (e) { /* ignore corrupt saves */ }

        pushHistory();
        fullRender();
        updateZoomLabel();
        zoomToFit();

        // Check for URL param to load example
        const params = new URLSearchParams(window.location.search);
        const exParam = params.get('example');
        if (exParam && examples[exParam]) {
            setTimeout(() => loadExample(exParam), 200);
        }
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.fcDesigner = {
        state,
        addShape,
        removeShape,
        loadExample,
        undo,
        redo,
        zoomIn,
        zoomOut,
        zoomReset,
        zoomToFit,
        autoLayout,
        saveChart,
        loadChart,
        listSaves,
        deleteChart,
        resetExecution,
        stepExecution,
        runAllExecution,
        generateCode,
        updateShapeRole,
        examples
    };
})();
