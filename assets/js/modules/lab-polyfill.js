// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (r == null) r = [];
        else if (typeof r === 'number') r = [r];
        const radii = (r || []).map(v => Math.min(v, Math.min(Math.abs(w), Math.abs(h)) / 2));
        const tl = radii[0] || 0;
        this.moveTo(x + tl, y);
        this.lineTo(x + w - tl, y);
        this.quadraticCurveTo(x + w, y, x + w, y + tl);
        this.lineTo(x + w, y + h - tl);
        this.quadraticCurveTo(x + w, y + h, x + w - tl, y + h);
        this.lineTo(x + tl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - tl);
        this.lineTo(x, y + tl);
        this.quadraticCurveTo(x, y, x + tl, y);
        this.closePath();
    };
}
