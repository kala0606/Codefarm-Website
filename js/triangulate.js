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
        this.maxFrames = 18;
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
        this.hueSpeed = 2;
        
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
    initializeFromPoint(x, y, density = 0.4) {
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
                const probability = density * Math.max(0, 1 - (dist / radius) * 0.5);
                this.grid[i][j] = Math.random() < probability ? 1 : 0;
            }
        }
        
        this.livingCells = [];
        this.currentFrame = 0;
        this.triangles = [];
        this.animatedTriangles = [];
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
        
        // Draw triangles with animation
        if (showTriangles && this.triangles.length > 0) {
            this.triangles.forEach((tri, index) => {
                if (tri.progress <= 0) return;
                
                const { points } = tri;
                const progress = Math.min(1, tri.progress);
                
                // Interpolate from centroid to full triangle
                const cx = tri.centroid.x;
                const cy = tri.centroid.y;
                
                const p1 = this.lerp(cx, cy, points[0].x, points[0].y, progress);
                const p2 = this.lerp(cx, cy, points[1].x, points[1].y, progress);
                const p3 = this.lerp(cx, cy, points[2].x, points[2].y, progress);
                
                // Draw triangle edges
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.lineTo(p3.x, p3.y);
                this.ctx.closePath();
                
                // Alternate between white and colored strokes
                if (index % 7 === 0) {
                    this.ctx.strokeStyle = `hsl(${(this.hue + index * 10) % 360}, 100%, 50%)`;
                    this.ctx.lineWidth = 2;
                } else {
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                    this.ctx.lineWidth = 1;
                }
                
                this.ctx.stroke();
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
        if (this.isRunning) {
            this.stop();
        }
        
        this.targetSection = targetSection;
        this.onComplete = onComplete;
        this.isRunning = true;
        this.isTriangulating = false;
        
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
        
        // Run simulation frames
        while (this.currentFrame < targetFrame && this.currentFrame < this.maxFrames) {
            this.updateGrid();
            this.currentFrame++;
        }
        
        this.draw(true, false);
        
        if (this.currentFrame >= this.maxFrames) {
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
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Hero Logo Animation - Continuous generative display
class HeroLogoAnimation {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'hero-logo-canvas';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.gridSize = 8;
        this.maxFrames = 20;
        this.frameDelay = 100;
        
        this.grid = null;
        this.nextGrid = null;
        this.livingCells = [];
        this.triangles = [];
        this.hue = 0;
        
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
        
        // Random initialization
        const density = 0.35;
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = Math.random() < density ? 1 : 0;
            }
        }
        
        this.currentFrame = 0;
        this.startSimulation();
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
        this.livingCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 1) {
                    this.livingCells.push({
                        x: i * this.cellSize + this.cellSize / 2,
                        y: j * this.cellSize + this.cellSize / 2
                    });
                }
            }
        }
    }
    
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
            this.triangles.push([
                this.livingCells[triangleIndices[i]],
                this.livingCells[triangleIndices[i + 1]],
                this.livingCells[triangleIndices[i + 2]]
            ]);
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw triangles
        this.triangles.forEach((tri, index) => {
            this.ctx.beginPath();
            this.ctx.moveTo(tri[0].x, tri[0].y);
            this.ctx.lineTo(tri[1].x, tri[1].y);
            this.ctx.lineTo(tri[2].x, tri[2].y);
            this.ctx.closePath();
            
            // Occasional RGB accent
            if (index % 5 === 0) {
                this.ctx.strokeStyle = `hsl(${(this.hue + index * 20) % 360}, 100%, 50%)`;
                this.ctx.lineWidth = 2;
            } else {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.lineWidth = 1.5;
            }
            
            this.ctx.stroke();
        });
        
        this.hue = (this.hue + 1) % 360;
    }
    
    startSimulation() {
        const simulate = () => {
            if (this.currentFrame < this.maxFrames) {
                this.updateGrid();
                this.currentFrame++;
                setTimeout(simulate, this.frameDelay);
            } else {
                this.collectLivingCells();
                this.triangulate();
                this.startDrawLoop();
                
                // Restart after a pause
                setTimeout(() => {
                    this.init();
                }, 4000);
            }
        };
        
        simulate();
    }
    
    startDrawLoop() {
        const animate = () => {
            this.draw();
            if (this.triangles.length > 0) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
}

// Export for use
window.TriangulationEngine = TriangulationEngine;
window.HeroLogoAnimation = HeroLogoAnimation;
