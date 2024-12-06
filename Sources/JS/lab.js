const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');
const generateBtn = document.getElementById('generate');
const widthSelector = document.getElementById('width');
const heightSelector = document.getElementById('height');
const solveBtn = document.getElementById('solve');

let rows = 10, cols = 10, grid = [], stack = [], cellSize, solving = false;

generateBtn.addEventListener('click', () => {
    rows = parseInt(heightSelector.value);
    cols = parseInt(widthSelector.value);
    solveBtn.disabled = true;
    solving = false;
    initializeCanvas();
    initializeGrid();
    generateMaze(() => {
        drawStartAndEnd();
        solveBtn.disabled = false;
    });
});

solveBtn.addEventListener('click', () => {
    if (!solving) {
        solveBtn.disabled = true;
        solveMaze(() => solveBtn.disabled = false);
    }
});

function initializeCanvas() {
    const maxCanvasWidth = window.innerWidth * 0.8;
    const maxCanvasHeight = window.innerHeight * 0.8;

    cellSize = Math.min(maxCanvasWidth / cols, maxCanvasHeight / rows);

    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    ctx.fillStyle = "#000000"; // Fond noir
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    grid = [];
    stack = [];
}

function initializeGrid() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            grid.push(new Cell(x, y));
        }
    }
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = [true, true, true, true]; // top, right, bottom, left
        this.visited = false;
    }

    show() {
        const x = this.x * cellSize, y = this.y * cellSize;
        ctx.strokeStyle = "#FF8C00"; // Couleur orange pour les murs
        ctx.lineWidth = 2;

        if (this.walls[0]) drawLine(x, y, x + cellSize, y);
        if (this.walls[1]) drawLine(x + cellSize, y, x + cellSize, y + cellSize);
        if (this.walls[2]) drawLine(x, y + cellSize, x + cellSize, y + cellSize);
        if (this.walls[3]) drawLine(x, y, x, y + cellSize);

        if (this.visited) {
            ctx.fillStyle = "#1E1E2E"; // Couleur sombre pour les cases visitées
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }

    checkNeighbors() {
        const neighbors = [];
        const top = grid[index(this.x, this.y - 1)];
        const right = grid[index(this.x + 1, this.y)];
        const bottom = grid[index(this.x, this.y + 1)];
        const left = grid[index(this.x - 1, this.y)];

        if (top && !top.visited) neighbors.push(top);
        if (right && !right.visited) neighbors.push(right);
        if (bottom && !bottom.visited) neighbors.push(bottom);
        if (left && !left.visited) neighbors.push(left);

        return neighbors.length > 0
            ? neighbors[Math.floor(Math.random() * neighbors.length)]
            : undefined;
    }
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function index(x, y) {
    return x < 0 || y < 0 || x >= cols || y >= rows ? -1 : x + y * cols;
}

function removeWalls(a, b) {
    const x = a.x - b.x, y = a.y - b.y;
    if (x === 1) { a.walls[3] = false; b.walls[1] = false; }
    if (x === -1) { a.walls[1] = false; b.walls[3] = false; }
    if (y === 1) { a.walls[0] = false; b.walls[2] = false; }
    if (y === -1) { a.walls[2] = false; b.walls[0] = false; }
}

function generateMaze(callback) {
    let current = grid[0];
    function step() {
        current.visited = true;
        const next = current.checkNeighbors();

        if (next) {
            next.visited = true;
            stack.push(current);
            removeWalls(current, next);
            current = next;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            if (callback) callback();
            return;
        }
        drawGrid();
        requestAnimationFrame(step);
    }
    step();
}
function solveMaze(callback) {
    solving = true;
    const start = grid[0], end = grid[grid.length - 1];
    const path = [], visited = new Set();

    function step(current) {
        if (!solving || current === end) {
            if (current === end) drawFinalPath(path);
            solving = false;
            if (callback) callback();
            return;
        }

        visited.add(current);
        path.push(current);

        if (current !== start) {
            ctx.fillStyle = "rgba(0, 191, 255, 0.3)"; // Bleu transparent pour la recherche
            ctx.fillRect(current.x * cellSize, current.y * cellSize, cellSize, cellSize);
        }

        const neighbors = [];
        const top = grid[index(current.x, current.y - 1)];
        const right = grid[index(current.x + 1, current.y)];
        const bottom = grid[index(current.x, current.y + 1)];
        const left = grid[index(current.x - 1, current.y)];

        if (top && !current.walls[0] && !visited.has(top)) neighbors.push(top);
        if (right && !current.walls[1] && !visited.has(right)) neighbors.push(right);
        if (bottom && !current.walls[2] && !visited.has(bottom)) neighbors.push(bottom);
        if (left && !current.walls[3] && !visited.has(left)) neighbors.push(left);

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            setTimeout(() => step(next), 50); // Vitesse ajustée
        } else {
            path.pop();
            setTimeout(() => step(path.pop()), 50);
        }
    }

    step(start);
}

function drawFinalPath(path) {
    // Assurez-vous que la flèche atteint la dernière case
    path.push(grid[grid.length - 1]);

    for (let i = 0; i < path.length - 1; i++) {
        const from = path[i], to = path[i + 1];
        drawArrow(from, to, "#FF0000"); // Rouge vif pour la solution
    }
}

function drawArrow(from, to, color) {
    const x1 = from.x * cellSize + cellSize / 2, y1 = from.y * cellSize + cellSize / 2;
    const x2 = to.x * cellSize + cellSize / 2, y2 = to.y * cellSize + cellSize / 2;

    const headlen = 10, angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headlen * Math.cos(angle - Math.PI / 6),
        y2 - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x2 - headlen * Math.cos(angle + Math.PI / 6),
        y2 - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawStartAndEnd() {
    const start = grid[0], end = grid[grid.length - 1];
    ctx.font = `${cellSize * 0.8}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("🚪", start.x * cellSize + cellSize / 2, start.y * cellSize + cellSize / 2);
    ctx.fillText("🪙", end.x * cellSize + cellSize / 2, end.y * cellSize + cellSize / 2);
}

function drawGrid() {
    ctx.fillStyle = "#000000"; // Fond noir
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    grid.forEach(cell => cell.show());
}
