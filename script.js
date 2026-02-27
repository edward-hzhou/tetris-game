// 游戏配置
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// 方块类型和形状
const TETROMINOS = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

// 颜色映射
const COLORS = {
    I: 'I',
    J: 'J',
    L: 'L',
    O: 'O',
    S: 'S',
    T: 'T',
    Z: 'Z'
};

// 游戏状态
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece = null;
let currentPosition = { x: 0, y: 0 };
let nextPiece = null;
let score = 0;
let level = 1;
let linesCleared = 0;
let gameOver = false;
let gamePaused = false;
let dropInterval = 1000;
let dropTimer = null;

// DOM 元素
const boardElement = document.getElementById('tetris-board');
const nextPieceElement = document.getElementById('next-piece');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');

// 初始化游戏
function initGame() {
    createBoard();
    createNextPieceBoard();
    resetGame();
    setupEventListeners();
}

// 创建游戏板
function createBoard() {
    boardElement.innerHTML = '';
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.x = x;
            cell.dataset.y = y;
            boardElement.appendChild(cell);
        }
    }
}

// 创建下一个方块显示区
function createNextPieceBoard() {
    const nextPieceBoard = document.createElement('div');
    nextPieceBoard.id = 'next-piece-board';
    nextPieceBoard.style.display = 'grid';
    nextPieceBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
    nextPieceBoard.style.gridTemplateRows = 'repeat(4, 1fr)';
    nextPieceBoard.style.width = '100%';
    nextPieceBoard.style.height = '100%';
    
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.x = x;
            cell.dataset.y = y;
            nextPieceBoard.appendChild(cell);
        }
    }
    
    nextPieceElement.innerHTML = '下一个:';
    nextPieceElement.appendChild(nextPieceBoard);
}

// 重置游戏
function resetGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    level = 1;
    linesCleared = 0;
    gameOver = false;
    gamePaused = false;
    dropInterval = 1000;
    
    updateScore();
    updateLevel();
    
    currentPiece = generateRandomPiece();
    currentPosition = { x: Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2), y: 0 };
    nextPiece = generateRandomPiece();
    
    drawBoard();
    drawNextPiece();
    
    if (dropTimer) clearInterval(dropTimer);
    
    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = false;
}

// 生成随机方块
function generateRandomPiece() {
    const keys = Object.keys(TETROMINOS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return {
        shape: TETROMINOS[randomKey],
        color: COLORS[randomKey]
    };
}

// 绘制游戏板
function drawBoard() {
    const cells = boardElement.querySelectorAll('.cell');
    cells.forEach(cell => {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        cell.className = 'cell';
        if (board[y][x]) {
            cell.classList.add(board[y][x]);
        }
    });
    
    // 绘制当前方块
    if (currentPiece) {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    const boardX = currentPosition.x + x;
                    const boardY = currentPosition.y + y;
                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        const cellIndex = boardY * COLS + boardX;
                        if (cells[cellIndex]) {
                            cells[cellIndex].className = 'cell';
                            cells[cellIndex].classList.add(currentPiece.color);
                        }
                    }
                }
            }
        }
    }
}

// 绘制下一个方块
function drawNextPiece() {
    const nextPieceBoard = document.getElementById('next-piece-board');
    const cells = nextPieceBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.className = 'cell';
    });
    
    if (nextPiece) {
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    const cellIndex = y * 4 + x;
                    if (cells[cellIndex]) {
                        cells[cellIndex].className = 'cell';
                        cells[cellIndex].classList.add(nextPiece.color);
                    }
                }
            }
        }
    }
}

// 检查碰撞
function checkCollision(piece, position) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = position.x + x;
                const boardY = position.y + y;
                if (boardY < 0) continue;
                if (boardY >= ROWS || boardX < 0 || boardX >= COLS || board[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 旋转方块
function rotatePiece(piece) {
    const rotated = piece.shape[0].map((_, index) => 
        piece.shape.map(row => row[index]).reverse()
    );
    return { ...piece, shape: rotated };
}

// 移动方块
function movePiece(dx, dy) {
    const newPosition = { x: currentPosition.x + dx, y: currentPosition.y + dy };
    if (!checkCollision(currentPiece, newPosition)) {
        currentPosition = newPosition;
        drawBoard();
        return true;
    }
    return false;
}

// 锁定方块到游戏板
function lockPiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const boardX = currentPosition.x + x;
                const boardY = currentPosition.y + y;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
    
    // 检查是否有完整的行
    checkLines();
    
    // 生成新方块
    currentPiece = nextPiece;
    currentPosition = { x: Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2), y: 0 };
    nextPiece = generateRandomPiece();
    
    // 检查游戏是否结束
    if (checkCollision(currentPiece, currentPosition)) {
        gameOver = true;
        clearInterval(dropTimer);
        startButton.disabled = false;
        pauseButton.disabled = true;
        alert('游戏结束!');
    }
    
    drawBoard();
    drawNextPiece();
}

// 检查并清除完整的行
function checkLines() {
    let linesRemoved = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesRemoved++;
            y++;
        }
    }
    
    if (linesRemoved > 0) {
        // 计算分数
        const linePoints = [0, 100, 300, 500, 800];
        score += linePoints[linesRemoved] * level;
        linesCleared += linesRemoved;
        
        // 检查是否升级
        if (linesCleared >= level * 10) {
            level++;
            dropInterval = Math.max(100, dropInterval - 100);
            if (dropTimer) {
                clearInterval(dropTimer);
                dropTimer = setInterval(dropPiece, dropInterval);
            }
            updateLevel();
        }
        
        updateScore();
    }
}

// 方块下落
function dropPiece() {
    if (!movePiece(0, 1)) {
        lockPiece();
    }
}

// 快速下落
function hardDrop() {
    while (movePiece(0, 1));
    lockPiece();
}

// 更新分数
function updateScore() {
    scoreElement.textContent = score;
}

// 更新级别
function updateLevel() {
    levelElement.textContent = level;
}

// 设置事件监听器
function setupEventListeners() {
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (gameOver || gamePaused) return;
        
        switch (e.key) {
            case 'ArrowLeft':
                movePiece(-1, 0);
                break;
            case 'ArrowRight':
                movePiece(1, 0);
                break;
            case 'ArrowDown':
                movePiece(0, 1);
                break;
            case 'ArrowUp':
                const rotatedPiece = rotatePiece(currentPiece);
                if (!checkCollision(rotatedPiece, currentPosition)) {
                    currentPiece = rotatedPiece;
                    drawBoard();
                }
                break;
            case ' ': // 空格键
                hardDrop();
                break;
        }
    });
    
    // 按钮控制
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    resetButton.addEventListener('click', resetGame);
}

// 开始游戏
function startGame() {
    if (gameOver) {
        resetGame();
    }
    
    gamePaused = false;
    startButton.disabled = true;
    pauseButton.disabled = false;
    
    if (dropTimer) clearInterval(dropTimer);
    dropTimer = setInterval(dropPiece, dropInterval);
}

// 暂停/继续游戏
function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        clearInterval(dropTimer);
        pauseButton.textContent = '继续';
    } else {
        dropTimer = setInterval(dropPiece, dropInterval);
        pauseButton.textContent = '暂停';
    }
}

// 初始化游戏
initGame();
