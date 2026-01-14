/**
 * CODEFARM Triangulation Engine
 * Game of Life + Delaunay Triangulation for organic reveals
 * Adapted from logo/sketch.js
 */

class TriangulationEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        
        // Simulation parameters
        this.gridSize = 12;
        this.maxFrames = 12; // Reduced for more survivors
        this.minCells = 10; // Stop early if below this
        this.frameDelay = 40; // ms between frames
        
        // State
        this.grid = null;
        this.nextGrid = null;
        this.livingCells = [];
        this.currentFrame = 0;
        this.isRunning = false;
        this.animationId = null;
        
        // Animation state
        this.triangles = [];
        this.animatedTriangles = [];
        this.targetSection = null;
        this.onComplete = null;
        
        // RGB hue for accent
        this.hue = 0;
        this.hueSpeed = 0.3; // Slower for smoother animation
        
        // Bind methods
        this.update = this.update.bind(this);
        this.animate = this.animate.bind(this);
        
        // Start hue animation
        this.animateHue();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cellWidth = this.canvas.width / this.gridSize;
        this.cellHeight = this.canvas.height / this.gridSize;
    }
    
    animateHue() {
        this.hue = (this.hue + this.hueSpeed) % 360;
        document.documentElement.style.setProperty('--accent-hue', this.hue);
        requestAnimationFrame(() => this.animateHue());
    }
    
    /**
     * Create a 2D array filled with zeros
     */
    create2DArray(size) {
        return Array(size).fill(null).map(() => Array(size).fill(0));
    }
    
    /**
     * Initialize the grid with cells seeded from a point
     */
    initializeFromPoint(x, y, density = 0.5) {
        this.grid = this.create2DArray(this.gridSize);
        this.nextGrid = this.create2DArray(this.gridSize);
        
        // Convert click position to grid coordinates
        const centerCol = Math.floor(x / this.cellWidth);
        const centerRow = Math.floor(y / this.cellHeight);
        
        // Seed cells in a radius around the click point
        const radius = Math.floor(this.gridSize / 2);
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const distX = Math.abs(i - centerCol);
                const distY = Math.abs(j - centerRow);
                const dist = Math.sqrt(distX * distX + distY * distY);
                
                // Higher probability near center, decreasing with distance
                const probability = density * Math.max(0, 1 - (dist / radius) * 0.4);
                this.grid[i][j] = Math.random() < probability ? 1 : 0;
            }
        }
        
        this.livingCells = [];
        this.currentFrame = 0;
        this.triangles = [];
        this.animatedTriangles = [];
    }
    
    /**
     * Count living cells in grid
     */
    countLivingCells() {
        let count = 0;
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 1) count++;
            }
        }
        return count;
    }
    
    /**
     * Add random cells to reach minimum
     */
    ensureMinimumCells(minimum) {
        const current = this.countLivingCells();
        if (current >= minimum) return;
        
        const emptyCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({ i, j });
                }
            }
        }
        
        // Shuffle
        for (let i = emptyCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
        }
        
        const needed = minimum - current;
        for (let k = 0; k < Math.min(needed, emptyCells.length); k++) {
            const { i, j } = emptyCells[k];
            this.grid[i][j] = 1;
        }
    }
    
    /**
     * Count living neighbors for a cell (Game of Life rules)
     */
    countNeighbors(x, y) {
        let count = 0;
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                
                // Wrap around edges
                const col = (x + i + this.gridSize) % this.gridSize;
                const row = (y + j + this.gridSize) % this.gridSize;
                
                count += this.grid[col][row];
            }
        }
        
        return count;
    }
    
    /**
     * Update grid using Conway's Game of Life rules
     */
    updateGrid() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const neighbors = this.countNeighbors(i, j);
                const currentState = this.grid[i][j];
                
                if (currentState === 1) {
                    // Cell is alive
                    this.nextGrid[i][j] = (neighbors < 2 || neighbors > 3) ? 0 : 1;
                } else {
                    // Cell is dead
                    this.nextGrid[i][j] = (neighbors === 3) ? 1 : 0;
                }
            }
        }
        
        // Swap grids
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
    }
    
    /**
     * Collect positions of all living cells
     */
    collectLivingCells() {
        this.livingCells = [];
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 1) {
                    this.livingCells.push({
                        x: i * this.cellWidth + this.cellWidth / 2,
                        y: j * this.cellHeight + this.cellHeight / 2,
                        gridX: i,
                        gridY: j
                    });
                }
            }
        }
    }
    
    /**
     * Perform Delaunay triangulation on living cells
     */
    triangulate() {
        if (this.livingCells.length < 3) {
            this.triangles = [];
            return;
        }
        
        const points = this.livingCells.map(c => [c.x, c.y]);
        const delaunay = Delaunator.from(points);
        
        this.triangles = [];
        const triangleIndices = delaunay.triangles;
        
        for (let i = 0; i < triangleIndices.length; i += 3) {
            const p1 = this.livingCells[triangleIndices[i]];
            const p2 = this.livingCells[triangleIndices[i + 1]];
            const p3 = this.livingCells[triangleIndices[i + 2]];
            
            // Calculate centroid for animation ordering
            const centroidX = (p1.x + p2.x + p3.x) / 3;
            const centroidY = (p1.y + p2.y + p3.y) / 3;
            
            this.triangles.push({
                points: [p1, p2, p3],
                centroid: { x: centroidX, y: centroidY },
                progress: 0,
                delay: 0
            });
        }
        
        // Sort triangles by distance from center for radial animation
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.triangles.forEach(tri => {
            const dx = tri.centroid.x - centerX;
            const dy = tri.centroid.y - centerY;
            tri.distFromCenter = Math.sqrt(dx * dx + dy * dy);
        });
        
        this.triangles.sort((a, b) => a.distFromCenter - b.distFromCenter);
        
        // Assign animation delays based on distance
        const maxDist = Math.max(...this.triangles.map(t => t.distFromCenter));
        this.triangles.forEach((tri, i) => {
            tri.delay = (tri.distFromCenter / maxDist) * 500;
            tri.index = i;
        });
    }
    
    /**
     * Draw the current state
     */
    draw(showCells = true, showTriangles = true) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw living cells as dots during simulation
        if (showCells && !this.isTriangulating) {
            this.ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
            
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    if (this.grid && this.grid[i][j] === 1) {
                        const x = i * this.cellWidth + this.cellWidth / 2;
                        const y = j * this.cellHeight + this.cellHeight / 2;
                        
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            }
        }
        
        // Draw triangles with RGB gradient glow animation
        if (showTriangles && this.triangles.length > 0) {
            this.triangles.forEach((tri, index) => {
                if (tri.progress <= 0) return;
                
                const { points } = tri;
                
                // Validate points array
                if (!points || points.length < 3) return;
                if (!points[0] || !points[1] || !points[2]) return;
                if (typeof points[0].x === 'undefined' || typeof points[0].y === 'undefined') return;
                if (typeof points[1].x === 'undefined' || typeof points[1].y === 'undefined') return;
                if (typeof points[2].x === 'undefined' || typeof points[2].y === 'undefined') return;
                
                const progress = Math.min(1, tri.progress);
                
                // Interpolate from centroid to full triangle
                const cx = tri.centroid.x;
                const cy = tri.centroid.y;
                
                const p1 = this.lerp(cx, cy, points[0].x, points[0].y, progress);
                const p2 = this.lerp(cx, cy, points[1].x, points[1].y, progress);
                const p3 = this.lerp(cx, cy, points[2].x, points[2].y, progress);
                
                // Validate interpolated points
                if (!p1 || !p2 || !p3 || typeof p1.x === 'undefined' || typeof p2.x === 'undefined' || typeof p3.x === 'undefined') {
                    return;
                }
                
                // Draw each edge with RGB gradient and glow
                const edges = [
                    { p1, p2 },
                    { p2, p3 },
                    { p3, p1 }
                ];
                
                edges.forEach((edge, edgeIndex) => {
                    // Validate edge points
                    if (!edge.p1 || !edge.p2 || typeof edge.p1.x === 'undefined' || typeof edge.p2.x === 'undefined') {
                        return;
                    }
                    
                    const globalIndex = index * 3 + edgeIndex;
                    
                    // Create gradient for this edge - stable offsets
                    const gradient = this.ctx.createLinearGradient(
                        edge.p1.x, edge.p1.y,
                        edge.p2.x, edge.p2.y
                    );
                    
                    // RGB gradient with stable offsets per edge
                    const baseHue = this.hue;
                    const hue1 = (baseHue + globalIndex * 25) % 360;
                    const hue2 = (baseHue + globalIndex * 25 + 60) % 360;
                    const hue3 = (baseHue + globalIndex * 25 + 120) % 360;
                    
                    gradient.addColorStop(0, `hsla(${hue1}, 100%, 60%, ${0.9 * progress})`);
                    gradient.addColorStop(0.5, `hsla(${hue2}, 100%, 60%, ${0.9 * progress})`);
                    gradient.addColorStop(1, `hsla(${hue3}, 100%, 60%, ${0.9 * progress})`);
                    
                    this.ctx.save();
                    
                    // Outer glow - use average hue for smoother shadow
                    const avgHue = (hue1 + hue2 + hue3) / 3;
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = `hsl(${avgHue}, 100%, 50%)`;
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = 3.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(edge.p1.x, edge.p1.y);
                    this.ctx.lineTo(edge.p2.x, edge.p2.y);
                    this.ctx.stroke();
                    
                    // Inner bright line
                    this.ctx.shadowBlur = 5;
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = 2.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(edge.p1.x, edge.p1.y);
                    this.ctx.lineTo(edge.p2.x, edge.p2.y);
                    this.ctx.stroke();
                    
                    // Core bright line
                    this.ctx.shadowBlur = 0;
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(edge.p1.x, edge.p1.y);
                    this.ctx.lineTo(edge.p2.x, edge.p2.y);
                    this.ctx.stroke();
                    
                    this.ctx.restore();
                });
            });
        }
    }
    
    /**
     * Linear interpolation between two points
     */
    lerp(x1, y1, x2, y2, t) {
        return {
            x: x1 + (x2 - x1) * t,
            y: y1 + (y2 - y1) * t
        };
    }
    
    /**
     * Easing function for smooth animation
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    /**
     * Run the simulation from a click point
     */
    runFromClick(x, y, targetSection, onComplete) {
        // Stop any existing animation
        if (this.isRunning) {
            this.stop();
        }
        
        // Reset state
        this.targetSection = targetSection;
        this.onComplete = onComplete;
        this.isRunning = true;
        this.isTriangulating = false;
        this.triangles = [];
        this.currentFrame = 0;
        
        this.initializeFromPoint(x, y);
        this.simulationStartTime = performance.now();
        
        this.update();
    }
    
    /**
     * Update loop for Game of Life simulation
     */
    update() {
        if (!this.isRunning) return;
        
        const elapsed = performance.now() - this.simulationStartTime;
        const targetFrame = Math.floor(elapsed / this.frameDelay);
        
        // Run simulation frames with early stopping check
        while (this.currentFrame < targetFrame && this.currentFrame < this.maxFrames) {
            this.updateGrid();
            this.currentFrame++;
            
            // Stop early if cells drop too low
            if (this.countLivingCells() <= this.minCells) {
                this.currentFrame = this.maxFrames; // Force end
                break;
            }
        }
        
        this.draw(true, false);
        
        if (this.currentFrame >= this.maxFrames) {
            // Ensure minimum cells before triangulation
            this.ensureMinimumCells(15);
            
            // Simulation complete, start triangulation animation
            this.collectLivingCells();
            this.triangulate();
            this.isTriangulating = true;
            this.triangulationStartTime = performance.now();
            this.animate();
        } else {
            requestAnimationFrame(this.update);
        }
    }
    
    /**
     * Animate triangles appearing
     */
    animate() {
        if (!this.isRunning) return;
        
        const elapsed = performance.now() - this.triangulationStartTime;
        const duration = 800;
        
        let allComplete = true;
        
        this.triangles.forEach(tri => {
            const adjustedElapsed = elapsed - tri.delay;
            if (adjustedElapsed > 0) {
                tri.progress = this.easeOutCubic(Math.min(1, adjustedElapsed / duration));
                if (tri.progress < 1) allComplete = false;
            } else {
                allComplete = false;
            }
        });
        
        this.draw(false, true);
        
        if (allComplete) {
            // Hold for a moment then fade
            setTimeout(() => {
                this.fadeOut();
            }, 500);
        } else {
            requestAnimationFrame(this.animate);
        }
    }
    
    /**
     * Fade out the triangles
     */
    fadeOut() {
        const startTime = performance.now();
        const duration = 600;
        
        const fade = () => {
            if (!this.isRunning) return; // Stop if animation was cancelled
            
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1 - this.easeOutCubic(progress);
            this.draw(false, true);
            this.ctx.globalAlpha = 1;
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                this.isRunning = false;
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        };
        
        fade();
    }
    
    /**
     * Stop current animation
     */
    stop() {
        this.isRunning = false;
        this.isTriangulating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Call onComplete if it exists to reset navigation state
        if (this.onComplete) {
            const callback = this.onComplete;
            this.onComplete = null;
            callback();
        }
    }
    
    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Hero Logo Animation - Continuous generative display with smooth morphing
class HeroLogoAnimation {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'hero-logo-canvas';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.gridSize = 8;
        this.maxFrames = 12; // Reduced frames - more cells survive
        this.frameDelay = 80;
        
        // Cell count thresholds
        this.minCells = 8;  // Stop simulation if we drop below this
        this.targetCells = 12; // Ideal number of cells for nice triangulation
        
        this.grid = null;
        this.nextGrid = null;
        
        // Current and target points for morphing
        this.currentPoints = [];
        this.targetPoints = [];
        this.morphProgress = 0;
        this.morphDuration = 1500; // ms for morph transition
        this.morphStartTime = 0;
        
        // Edges for drawing (interpolated)
        this.edges = [];
        
        this.hue = 0;
        this.hueSpeed = 0.3; // Slower hue change for smoother animation
        this.isAnimating = false;
        
        this.resize();
        this.init();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const size = Math.min(this.container.clientWidth, this.container.clientHeight, 300);
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / this.gridSize;
    }
    
    create2DArray(size) {
        return Array(size).fill(null).map(() => Array(size).fill(0));
    }
    
    init() {
        this.grid = this.create2DArray(this.gridSize);
        this.nextGrid = this.create2DArray(this.gridSize);
        
        // Random initialization with higher density for more survivors
        const density = 0.45;
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = Math.random() < density ? 1 : 0;
            }
        }
        
        this.currentFrame = 0;
        this.runSimulation();
    }
    
    // Count current living cells in grid
    countLivingCells() {
        let count = 0;
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 1) count++;
            }
        }
        return count;
    }
    
    // Add random cells to reach target count
    addRandomCells(targetCount) {
        const emptyCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({ i, j });
                }
            }
        }
        
        // Shuffle and pick cells to fill
        for (let i = emptyCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
        }
        
        const currentCount = this.countLivingCells();
        const needed = targetCount - currentCount;
        
        for (let k = 0; k < Math.min(needed, emptyCells.length); k++) {
            const { i, j } = emptyCells[k];
            this.grid[i][j] = 1;
        }
    }
    
    countNeighbors(x, y) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const col = (x + i + this.gridSize) % this.gridSize;
                const row = (y + j + this.gridSize) % this.gridSize;
                count += this.grid[col][row];
            }
        }
        return count;
    }
    
    updateGrid() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const neighbors = this.countNeighbors(i, j);
                const currentState = this.grid[i][j];
                
                if (currentState === 1) {
                    this.nextGrid[i][j] = (neighbors < 2 || neighbors > 3) ? 0 : 1;
                } else {
                    this.nextGrid[i][j] = (neighbors === 3) ? 1 : 0;
                }
            }
        }
        
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
    }
    
    collectLivingCells() {
        const cells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 1) {
                    cells.push({
                        x: i * this.cellSize + this.cellSize / 2,
                        y: j * this.cellSize + this.cellSize / 2,
                        gridX: i,
                        gridY: j
                    });
                }
            }
        }
        return cells;
    }
    
    getEdgesFromPoints(points) {
        if (points.length < 3) return [];
        
        const coords = points.map(p => [p.x, p.y]);
        const delaunay = Delaunator.from(coords);
        const edges = [];
        const triangles = delaunay.triangles;
        
        // Extract unique edges from triangles
        const edgeSet = new Set();
        for (let i = 0; i < triangles.length; i += 3) {
            const pairs = [
                [triangles[i], triangles[i + 1]],
                [triangles[i + 1], triangles[i + 2]],
                [triangles[i + 2], triangles[i]]
            ];
            
            for (const [a, b] of pairs) {
                const key = a < b ? `${a}-${b}` : `${b}-${a}`;
                if (!edgeSet.has(key)) {
                    edgeSet.add(key);
                    edges.push({
                        p1: points[a],
                        p2: points[b],
                        index: edges.length
                    });
                }
            }
        }
        
        return edges;
    }
    
    // Match points between formations for smooth morphing
    matchPoints(current, target) {
        // If we have more current points, some will fade out
        // If we have more target points, some will fade in
        const matched = [];
        const usedTargets = new Set();
        
        // For each current point, find nearest target
        for (const cp of current) {
            let bestDist = Infinity;
            let bestTarget = null;
            let bestIdx = -1;
            
            for (let i = 0; i < target.length; i++) {
                if (usedTargets.has(i)) continue;
                const tp = target[i];
                const dist = Math.hypot(cp.x - tp.x, cp.y - tp.y);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestTarget = tp;
                    bestIdx = i;
                }
            }
            
            if (bestTarget && bestDist < this.canvas.width * 0.6) {
                usedTargets.add(bestIdx);
                matched.push({
                    from: cp,
                    to: bestTarget,
                    fadeIn: false,
                    fadeOut: false
                });
            } else {
                // This point fades out (moves to center and disappears)
                matched.push({
                    from: cp,
                    to: { x: this.canvas.width / 2, y: this.canvas.height / 2 },
                    fadeIn: false,
                    fadeOut: true
                });
            }
        }
        
        // Any unmatched targets fade in
        for (let i = 0; i < target.length; i++) {
            if (!usedTargets.has(i)) {
                matched.push({
                    from: { x: this.canvas.width / 2, y: this.canvas.height / 2 },
                    to: target[i],
                    fadeIn: true,
                    fadeOut: false
                });
            }
        }
        
        return matched;
    }
    
    // Easing function for smooth animation
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Get interpolated points at current morph progress
    getInterpolatedPoints(progress) {
        const eased = this.easeInOutCubic(progress);
        const points = [];
        
        for (const match of this.morphData) {
            // Skip fading out points at end, skip fading in points at start
            if (match.fadeOut && eased > 0.9) continue;
            if (match.fadeIn && eased < 0.1) continue;
            
            const x = match.from.x + (match.to.x - match.from.x) * eased;
            const y = match.from.y + (match.to.y - match.from.y) * eased;
            
            // Calculate opacity for fading points
            let opacity = 1;
            if (match.fadeOut) {
                opacity = 1 - eased;
            } else if (match.fadeIn) {
                opacity = eased;
            }
            
            points.push({ x, y, opacity });
        }
        
        return points;
    }
    
    runSimulation() {
        // Run Game of Life simulation with early stopping
        for (let f = 0; f < this.maxFrames; f++) {
            this.updateGrid();
            
            // Check cell count - stop early if dropping too low
            const cellCount = this.countLivingCells();
            if (cellCount <= this.minCells) {
                // Stop simulation early to preserve cells
                break;
            }
        }
        
        // Ensure we have enough cells for nice triangulation
        const cellCount = this.countLivingCells();
        if (cellCount < this.targetCells) {
            this.addRandomCells(this.targetCells);
        }
        
        // Get new target points
        const newPoints = this.collectLivingCells();
        
        if (this.currentPoints.length === 0) {
            // First run - no morphing needed
            this.currentPoints = newPoints;
            this.edges = this.getEdgesFromPoints(this.currentPoints);
            this.startDrawLoop();
            
            // Schedule next evolution
            setTimeout(() => this.evolveToNextFormation(), 3000);
        } else {
            // Setup morph from current to new
            this.targetPoints = newPoints;
            this.morphData = this.matchPoints(this.currentPoints, this.targetPoints);
            this.morphStartTime = performance.now();
            this.isMorphing = true;
        }
    }
    
    evolveToNextFormation() {
        // Reinitialize grid with some randomness influenced by current state
        const density = 0.42;
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                // Mix of random and pattern-based seeding
                // Higher chance to keep existing cells for continuity
                const keepOld = this.grid[i][j] === 1 && Math.random() < 0.4;
                this.grid[i][j] = keepOld || Math.random() < density ? 1 : 0;
            }
        }
        
        this.currentFrame = 0;
        this.runSimulation();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let pointsToDraw = this.currentPoints;
        
        // Handle morphing
        if (this.isMorphing) {
            const elapsed = performance.now() - this.morphStartTime;
            const progress = Math.min(1, elapsed / this.morphDuration);
            
            pointsToDraw = this.getInterpolatedPoints(progress);
            
            if (progress >= 1) {
                // Morph complete
                this.isMorphing = false;
                this.currentPoints = this.targetPoints;
                pointsToDraw = this.currentPoints;
                
                // Schedule next evolution
                setTimeout(() => this.evolveToNextFormation(), 2500);
            }
        }
        
        // Get edges for current points
        const edges = this.getEdgesFromPoints(pointsToDraw);
        
        // Draw edges with RGB gradient and glow
        edges.forEach((edge, index) => {
            const opacity = Math.min(edge.p1.opacity || 1, edge.p2.opacity || 1);
            
            // Create gradient for this line - use stable hue offsets per edge
            const gradient = this.ctx.createLinearGradient(
                edge.p1.x, edge.p1.y,
                edge.p2.x, edge.p2.y
            );
            
            // RGB gradient with stable offsets - slower hue change
            const baseHue = this.hue;
            const hue1 = (baseHue + index * 20) % 360;
            const hue2 = (baseHue + index * 20 + 60) % 360;
            const hue3 = (baseHue + index * 20 + 120) % 360;
            
            gradient.addColorStop(0, `hsla(${hue1}, 100%, 60%, ${opacity})`);
            gradient.addColorStop(0.5, `hsla(${hue2}, 100%, 60%, ${opacity})`);
            gradient.addColorStop(1, `hsla(${hue3}, 100%, 60%, ${opacity})`);
            
            // Draw glow effect (multiple strokes with increasing blur)
            this.ctx.save();
            
            // Outer glow - use average hue for shadow
            const avgHue = (hue1 + hue2 + hue3) / 3;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = `hsl(${avgHue}, 100%, 50%)`;
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(edge.p1.x, edge.p1.y);
            this.ctx.lineTo(edge.p2.x, edge.p2.y);
            this.ctx.stroke();
            
            // Inner bright line
            this.ctx.shadowBlur = 4;
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(edge.p1.x, edge.p1.y);
            this.ctx.lineTo(edge.p2.x, edge.p2.y);
            this.ctx.stroke();
            
            // Core bright line
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(edge.p1.x, edge.p1.y);
            this.ctx.lineTo(edge.p2.x, edge.p2.y);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
        
        // Draw subtle vertex dots with glow
        pointsToDraw.forEach((p, index) => {
            const opacity = p.opacity || 1;
            if (opacity > 0.3) {
                const hue = (this.hue + index * 25) % 360;
                
                this.ctx.save();
                this.ctx.shadowBlur = 6;
                this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
                
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                this.ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${0.6 * opacity})`;
                this.ctx.fill();
                
                this.ctx.restore();
            }
        });
        
        // Slower, smoother hue change
        this.hue = (this.hue + this.hueSpeed) % 360;
    }
    
    startDrawLoop() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const animate = () => {
            this.draw();
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// Export for use
window.TriangulationEngine = TriangulationEngine;
window.HeroLogoAnimation = HeroLogoAnimation;
