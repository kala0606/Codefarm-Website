// Grid settings
const GRID_SIZE = 8;
const MAX_FRAMES = 20;

// Grid state
let grid;
let nextGrid;
let livingCells = [];
let frameCount = 0;
let simulationEnded = false;
let cellSize;
let canvasSize;

// UI elements
let densitySlider;
let densityValue;
let restartBtn;
let frameCountDisplay;
let rebirthCountDisplay;

function setup() {
    // Calculate responsive canvas size
    calculateCanvasSize();
    
    // Create canvas
    let canvas = createCanvas(canvasSize, canvasSize);
    canvas.parent('canvas-container');
    
    // Get UI elements
    densitySlider = select('#densitySlider');
    densityValue = select('#densityValue');
    restartBtn = select('#restartBtn');
    frameCountDisplay = select('#frameCount');
    rebirthCountDisplay = select('#rebirthCount');
    
    // Setup event listeners
    densitySlider.input(updateDensityDisplay);
    restartBtn.mousePressed(restartSimulation);
    
    // Initialize simulation
    initializeGrid();
    
    // Set frame rate
    frameRate(8);
}

function draw() {
    background(240);
    
    // Draw grid
    // drawGrid();
    
    // Run simulation if not ended
    if (!simulationEnded && frameCount < MAX_FRAMES) {
        updateGrid();
        frameCount++;
        frameCountDisplay.html(frameCount);
        
        if (frameCount >= MAX_FRAMES) {
            simulationEnded = true;
            collectLivingCells();
            rebirthCountDisplay.html(livingCells.length);
        }
    }
    
    // If simulation ended, draw connections
    if (simulationEnded) {
        drawConnections();
    }
}

function calculateCanvasSize() {
    // Make canvas responsive - use 90% of container width or 600px, whichever is smaller
    let containerWidth = min(windowWidth * 0.85, 600);
    canvasSize = containerWidth;
    cellSize = canvasSize / GRID_SIZE;
}

function windowResized() {
    calculateCanvasSize();
    resizeCanvas(canvasSize, canvasSize);
}

function initializeGrid() {
    // Create 2D arrays
    grid = create2DArray(GRID_SIZE);
    nextGrid = create2DArray(GRID_SIZE);
    
    // Populate with random cells based on density
    let density = densitySlider.value() / 100;
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            grid[i][j] = random() < density ? 1 : 0;
        }
    }
    
    // Reset tracking variables
    livingCells = [];
    frameCount = 0;
    simulationEnded = false;
    frameCountDisplay.html(frameCount);
    rebirthCountDisplay.html(0);
}

function create2DArray(size) {
    let arr = new Array(size);
    for (let i = 0; i < size; i++) {
        arr[i] = new Array(size).fill(0);
    }
    return arr;
}

function drawGrid() {
    stroke(200);
    strokeWeight(1);
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            let x = i * cellSize;
            let y = j * cellSize;
            
            // Fill based on cell state
            if (grid[i][j] === 1) {
                fill(60, 60, 80);
            } else {
                fill(255);
            }
            
            rect(x, y, cellSize, cellSize);
        }
    }
}

function updateGrid() {
    // Calculate next generation
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            let neighbors = countNeighbors(i, j);
            let currentState = grid[i][j];
            
            // Conway's Game of Life rules
            if (currentState === 1) {
                // Cell is alive
                if (neighbors < 2 || neighbors > 3) {
                    nextGrid[i][j] = 0; // Dies
                } else {
                    nextGrid[i][j] = 1; // Survives
                }
            } else {
                // Cell is dead
                if (neighbors === 3) {
                    nextGrid[i][j] = 1; // Birth
                } else {
                    nextGrid[i][j] = 0; // Stays dead
                }
            }
        }
    }
    
    // Swap grids
    let temp = grid;
    grid = nextGrid;
    nextGrid = temp;
}

function countNeighbors(x, y) {
    let count = 0;
    
    // Check all 8 neighbors
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue; // Skip center cell
            
            let col = (x + i + GRID_SIZE) % GRID_SIZE; // Wrap around
            let row = (y + j + GRID_SIZE) % GRID_SIZE;
            
            count += grid[col][row];
        }
    }
    
    return count;
}

function collectLivingCells() {
    livingCells = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === 1) {
                livingCells.push({x: i, y: j});
            }
        }
    }
}

function drawConnections() {
    // Need at least 3 points for triangulation
    if (livingCells.length < 3) {
        // If less than 3 points, just draw lines between them
        if (livingCells.length === 2) {
            stroke(100, 150, 255, 200);
            strokeWeight(2);
            let pos1 = livingCells[0];
            let pos2 = livingCells[1];
            let x1 = pos1.x * cellSize + cellSize / 2;
            let y1 = pos1.y * cellSize + cellSize / 2;
            let x2 = pos2.x * cellSize + cellSize / 2;
            let y2 = pos2.y * cellSize + cellSize / 2;
            line(x1, y1, x2, y2);
        }
        return;
    }
    
    // Perform Delaunay triangulation
    const delaunay = Delaunator.from(livingCells.map(pos => [
        pos.x * cellSize + cellSize / 2,
        pos.y * cellSize + cellSize / 2
    ]));
    
    // Draw triangulation edges
    stroke(100, 150, 255, 200);
    strokeWeight(2);
    noFill();
    
    // Draw each triangle edge
    const triangles = delaunay.triangles;
    for (let i = 0; i < triangles.length; i += 3) {
        const p1 = livingCells[triangles[i]];
        const p2 = livingCells[triangles[i + 1]];
        const p3 = livingCells[triangles[i + 2]];
        
        const x1 = p1.x * cellSize + cellSize / 2;
        const y1 = p1.y * cellSize + cellSize / 2;
        const x2 = p2.x * cellSize + cellSize / 2;
        const y2 = p2.y * cellSize + cellSize / 2;
        const x3 = p3.x * cellSize + cellSize / 2;
        const y3 = p3.y * cellSize + cellSize / 2;
        
        line(x1, y1, x2, y2);
        line(x2, y2, x3, y3);
        line(x3, y3, x1, y1);
    }
}

function updateDensityDisplay() {
    densityValue.html(densitySlider.value() + '%');
}

function restartSimulation() {
    initializeGrid();
}
