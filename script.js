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

const COLORS = {
    I: 'I',
    J: 'J',
    L: 'L',
    O: 'O',
    S: 'S',
    T: 'T',
    Z: 'Z'
};

// 游戏模式
let gameMode = 'single';
let gameRunning = false;

// 单人游戏状态
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
let autoPlay = false;
let autoPlayTimer = null;

// 对战游戏状态
let playerGame = null;
let aiGame = null;

// 游戏类
class TetrisGame {
    constructor(boardId, nextPieceId, scoreId, levelId, isAI = false, linesId = null) {
        this.boardElement = document.getElementById(boardId);
        this.nextPieceElement = document.getElementById(nextPieceId);
        this.scoreElement = document.getElementById(scoreId);
        this.levelElement = document.getElementById(levelId);
        this.linesElement = linesId ? document.getElementById(linesId) : null;
        this.isAI = isAI;
        
        this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.currentPiece = null;
        this.currentPosition = { x: 0, y: 0 };
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.gameOver = false;
        this.dropInterval = 1000;
        this.dropTimer = null;
        this.autoPlay = isAI;
        
        this.createBoard();
        this.createNextPieceBoard();
    }
    
    createBoard() {
        this.boardElement.innerHTML = '';
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    createNextPieceBoard() {
        const nextPieceBoard = document.createElement('div');
        nextPieceBoard.id = this.nextPieceElement.id + '-board';
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
        
        this.nextPieceElement.innerHTML = this.isAI ? 'AI下一个:' : '下一个:';
        this.nextPieceElement.appendChild(nextPieceBoard);
    }
    
    reset() {
        this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.gameOver = false;
        this.dropInterval = 1000;
        
        if (this.dropTimer) clearInterval(this.dropTimer);
        
        this.updateScore();
        this.updateLevel();
        
        this.currentPiece = this.generateRandomPiece();
        this.currentPosition = { x: Math.floor(COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2), y: 0 };
        this.nextPiece = this.generateRandomPiece();
        
        this.drawBoard();
        this.drawNextPiece();
    }
    
    generateRandomPiece() {
        const keys = Object.keys(TETROMINOS);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return {
            shape: TETROMINOS[randomKey],
            color: COLORS[randomKey]
        };
    }
    
    drawBoard() {
        const cells = this.boardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            cell.className = 'cell';
            cell.innerHTML = '';
            if (this.board[y][x]) {
                cell.classList.add(this.board[y][x]);
                this.addEggFeatures(cell);
            }
        });
        
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const boardX = this.currentPosition.x + x;
                        const boardY = this.currentPosition.y + y;
                        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                            const cellIndex = boardY * COLS + boardX;
                            if (cells[cellIndex]) {
                                cells[cellIndex].className = 'cell';
                                cells[cellIndex].classList.add(this.currentPiece.color);
                                cells[cellIndex].innerHTML = '';
                                this.addEggFeatures(cells[cellIndex]);
                            }
                        }
                    }
                }
            }
        }
    }
    
    addEggFeatures(cell) {
        const antenna = document.createElement('div');
        antenna.className = 'antenna';
        cell.appendChild(antenna);
        
        const eyeLeft = document.createElement('div');
        eyeLeft.className = 'eye-left';
        cell.appendChild(eyeLeft);
        
        const eyeRight = document.createElement('div');
        eyeRight.className = 'eye-right';
        cell.appendChild(eyeRight);
        
        const cheekLeft = document.createElement('div');
        cheekLeft.className = 'cheek-left';
        cell.appendChild(cheekLeft);
        
        const cheekRight = document.createElement('div');
        cheekRight.className = 'cheek-right';
        cell.appendChild(cheekRight);
        
        const mouth = document.createElement('div');
        mouth.className = 'mouth';
        cell.appendChild(mouth);
    }
    
    drawNextPiece() {
        const nextPieceBoard = document.getElementById(this.nextPieceElement.id + '-board');
        if (!nextPieceBoard) return;
        
        const cells = nextPieceBoard.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell';
            cell.innerHTML = '';
        });
        
        if (this.nextPiece) {
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        const cellIndex = y * 4 + x;
                        if (cells[cellIndex]) {
                            cells[cellIndex].className = 'cell';
                            cells[cellIndex].classList.add(this.nextPiece.color);
                            cells[cellIndex].innerHTML = '';
                            this.addEggFeatures(cells[cellIndex]);
                        }
                    }
                }
            }
        }
    }
    
    checkCollision(piece, position) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = position.x + x;
                    const boardY = position.y + y;
                    if (boardY < 0) continue;
                    if (boardY >= ROWS || boardX < 0 || boardX >= COLS || this.board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    rotatePiece(piece) {
        const rotated = piece.shape[0].map((_, index) => 
            piece.shape.map(row => row[index]).reverse()
        );
        return { ...piece, shape: rotated };
    }
    
    movePiece(dx, dy) {
        const newPosition = { x: this.currentPosition.x + dx, y: this.currentPosition.y + dy };
        if (!this.checkCollision(this.currentPiece, newPosition)) {
            this.currentPosition = newPosition;
            this.drawBoard();
            return true;
        }
        return false;
    }
    
    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPosition.x + x;
                    const boardY = this.currentPosition.y + y;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.checkLines();
        
        this.currentPiece = this.nextPiece;
        this.currentPosition = { x: Math.floor(COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2), y: 0 };
        this.nextPiece = this.generateRandomPiece();
        
        if (this.checkCollision(this.currentPiece, this.currentPosition)) {
            this.gameOver = true;
            if (this.dropTimer) clearInterval(this.dropTimer);
            if (gameMode === 'battle') {
                checkBattleEnd();
            }
        }
        
        this.drawBoard();
        this.drawNextPiece();
    }
    
    checkLines() {
        let linesRemoved = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesRemoved++;
                y++;
            }
        }
        
        if (linesRemoved > 0) {
            const linePoints = [0, 100, 300, 500, 800];
            this.score += linePoints[linesRemoved] * this.level;
            this.linesCleared += linesRemoved;
            
            if (this.linesCleared >= this.level * 10) {
                this.level++;
                this.dropInterval = Math.max(100, this.dropInterval - 100);
                this.updateLevel();
            }
            
            this.updateScore();
            this.updateLines();
        }
    }
    
    updateScore() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
    }
    
    updateLevel() {
        if (this.levelElement) {
            this.levelElement.textContent = this.level;
        }
    }
    
    updateLines() {
        if (this.linesElement) {
            this.linesElement.textContent = this.linesCleared;
        }
    }
    
    dropPiece() {
        if (!this.movePiece(0, 1)) {
            this.lockPiece();
        }
    }
    
    start() {
        this.gameOver = false;
        this.reset();
        if (this.dropTimer) clearInterval(this.dropTimer);
        this.dropTimer = setInterval(() => this.dropPiece(), this.dropInterval);
        
        if (this.isAI) {
            this.startAutoPlay();
        }
    }
    
    startAutoPlay() {
        if (this.dropTimer) clearInterval(this.dropTimer);
        this.dropTimer = setInterval(() => this.dropPiece(), this.dropInterval);
        
        const autoTimer = setInterval(() => {
            if (this.gameOver) {
                clearInterval(autoTimer);
                return;
            }
            
            const bestMove = this.findBestMove();
            
            if (bestMove.rotations > 0) {
                for (let i = 0; i < bestMove.rotations; i++) {
                    const rotatedPiece = this.rotatePiece(this.currentPiece);
                    if (!this.checkCollision(rotatedPiece, this.currentPosition)) {
                        this.currentPiece = rotatedPiece;
                        this.drawBoard();
                    }
                }
            }
            
            const targetX = bestMove.x - this.currentPosition.x;
            if (targetX > 0) {
                for (let i = 0; i < targetX; i++) {
                    this.movePiece(1, 0);
                }
            } else if (targetX < 0) {
                for (let i = 0; i < Math.abs(targetX); i++) {
                    this.movePiece(-1, 0);
                }
            }
        }, 100);
    }
    
    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = { x: this.currentPosition.x, rotations: 0 };
        
        const piece = this.currentPiece;
        
        for (let rotations = 0; rotations < 4; rotations++) {
            const rotatedPiece = { ...piece, shape: this.getRotatedShape(piece.shape, rotations) };
            
            for (let x = -2; x < COLS + 2; x++) {
                const position = { x: x, y: this.currentPosition.y };
                
                if (!this.checkCollision(rotatedPiece, position)) {
                    const landingY = this.getLandingPosition(rotatedPiece, position);
                    const score = this.evaluatePosition(rotatedPiece, { x: x, y: landingY });
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { x: x, rotations: rotations };
                    }
                }
            }
        }
        
        return bestMove;
    }
    
    getRotatedShape(shape, times) {
        let result = shape;
        for (let i = 0; i < times; i++) {
            result = result[0].map((_, index) => 
                result.map(row => row[index]).reverse()
            );
        }
        return result;
    }
    
    getLandingPosition(piece, position) {
        let y = position.y;
        while (!this.checkCollision(piece, { x: position.x, y: y + 1 })) {
            y++;
        }
        return y;
    }
    
    evaluatePosition(piece, position) {
        let score = 0;
        
        const testBoard = this.board.map(row => [...row]);
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = position.x + x;
                    const boardY = position.y + y;
                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        testBoard[boardY][boardX] = piece.color;
                    }
                }
            }
        }
        
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (testBoard[y].every(cell => cell !== 0)) {
                linesCleared++;
            }
        }
        score += linesCleared * 1000;
        
        let maxHeight = 0;
        for (let x = 0; x < COLS; x++) {
            for (let y = 0; y < ROWS; y++) {
                if (testBoard[y][x]) {
                    maxHeight = Math.max(maxHeight, ROWS - y);
                    break;
                }
            }
        }
        score -= maxHeight * 10;
        
        let holes = 0;
        for (let x = 0; x < COLS; x++) {
            let foundBlock = false;
            for (let y = 0; y < ROWS; y++) {
                if (testBoard[y][x]) {
                    foundBlock = true;
                } else if (foundBlock && !testBoard[y][x]) {
                    holes++;
                }
            }
        }
        score -= holes * 50;
        
        const pieceCenterX = position.x + piece.shape[0].length / 2;
        const boardCenterX = COLS / 2;
        score -= Math.abs(pieceCenterX - boardCenterX) * 2;
        
        return score;
    }
}

// DOM 元素
const boardElement = document.getElementById('tetris-board');
const nextPieceElement = document.getElementById('next-piece');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
const autoButton = document.getElementById('auto-button');
const singleBtn = document.getElementById('single-btn');
const battleBtn = document.getElementById('battle-btn');
const pvpBtn = document.getElementById('pvp-btn');
const singleMode = document.getElementById('single-mode');
const battleMode = document.getElementById('battle-mode');
const pvpMode = document.getElementById('pvp-mode');

// 对战游戏状态
let player1Game = null;
let player2Game = null;

// 初始化游戏
function initGame() {
    createBoard();
    createNextPieceBoard();
    resetGame();
    setupEventListeners();
    setupModeSelect();
    updateInstructions();
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
    
    if (dropTimer) clearInterval(dropTimer);
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlay = false;
    
    updateScore();
    updateLevel();
    
    currentPiece = generateRandomPiece();
    currentPosition = { x: Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2), y: 0 };
    nextPiece = generateRandomPiece();
    
    drawBoard();
    drawNextPiece();
    
    startButton.disabled = false;
    pauseButton.disabled = true;
    autoButton.disabled = true;
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
        cell.innerHTML = '';
        if (board[y][x]) {
            cell.classList.add(board[y][x]);
            addEggFeatures(cell);
        }
    });
    
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
                            cells[cellIndex].innerHTML = '';
                            addEggFeatures(cells[cellIndex]);
                        }
                    }
                }
            }
        }
    }
}

// 添加蛋仔特征
function addEggFeatures(cell) {
    const antenna = document.createElement('div');
    antenna.className = 'antenna';
    cell.appendChild(antenna);
    
    const eyeLeft = document.createElement('div');
    eyeLeft.className = 'eye-left';
    cell.appendChild(eyeLeft);
    
    const eyeRight = document.createElement('div');
    eyeRight.className = 'eye-right';
    cell.appendChild(eyeRight);
    
    const cheekLeft = document.createElement('div');
    cheekLeft.className = 'cheek-left';
    cell.appendChild(cheekLeft);
    
    const cheekRight = document.createElement('div');
    cheekRight.className = 'cheek-right';
    cell.appendChild(cheekRight);
    
    const mouth = document.createElement('div');
    mouth.className = 'mouth';
    cell.appendChild(mouth);
}

// 绘制下一个方块
function drawNextPiece() {
    const nextPieceBoard = document.getElementById('next-piece-board');
    if (!nextPieceBoard) return;
    
    const cells = nextPieceBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.className = 'cell';
        cell.innerHTML = '';
    });
    
    if (nextPiece) {
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    const cellIndex = y * 4 + x;
                    if (cells[cellIndex]) {
                        cells[cellIndex].className = 'cell';
                        cells[cellIndex].classList.add(nextPiece.color);
                        cells[cellIndex].innerHTML = '';
                        addEggFeatures(cells[cellIndex]);
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
    
    checkLines();
    
    currentPiece = nextPiece;
    currentPosition = { x: Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2), y: 0 };
    nextPiece = generateRandomPiece();
    
    if (checkCollision(currentPiece, currentPosition)) {
        gameOver = true;
        clearInterval(dropTimer);
        clearInterval(autoPlayTimer);
        autoPlay = false;
        startButton.disabled = false;
        pauseButton.disabled = true;
        autoButton.disabled = true;
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
        const linePoints = [0, 100, 300, 500, 800];
        score += linePoints[linesRemoved] * level;
        linesCleared += linesRemoved;
        
        if (linesCleared >= level * 10) {
            level++;
            dropInterval = Math.max(100, dropInterval - 100);
            if (dropTimer) {
                clearInterval(dropTimer);
                dropTimer = setInterval(dropPiece, dropInterval);
            }
            updateLevel();
        }
        
        updateLines();
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

// 更新行数
function updateLines() {
    const linesElement = document.getElementById('lines');
    if (linesElement) {
        linesElement.textContent = linesCleared;
    }
}

// 更新操作说明
function updateInstructions() {
    const instructionsList = document.getElementById('instructions-list');
    if (!instructionsList) return;
    
    if (gameMode === 'pvp') {
        instructionsList.innerHTML = `
            <li><span>A D</span> 玩家1左右移动</li>
            <li><span>S</span> 玩家1下落</li>
            <li><span>Q</span> 玩家1旋转</li>
            <li><span>← →</span> 玩家2左右移动</li>
            <li><span>↓</span> 玩家2下落</li>
            <li><span>空格</span> 玩家2旋转</li>
        `;
    } else if (gameMode === 'battle') {
        instructionsList.innerHTML = `
            <li><span>← →</span> 左右移动</li>
            <li><span>↓</span> 加速下落</li>
            <li><span>↑</span> 旋转方块</li>
            <li><span>空格</span> 快速落地</li>
        `;
    } else {
        instructionsList.innerHTML = `
            <li><span>← →</span> 左右移动</li>
            <li><span>↓</span> 加速下落</li>
            <li><span>↑</span> 旋转方块</li>
            <li><span>空格</span> 快速落地</li>
        `;
    }
}

// 设置模式选择
function setupModeSelect() {
    singleBtn.addEventListener('click', () => {
        gameMode = 'single';
        singleBtn.classList.add('active');
        battleBtn.classList.remove('active');
        pvpBtn.classList.remove('active');
        singleMode.classList.remove('hidden');
        battleMode.classList.add('hidden');
        pvpMode.classList.add('hidden');
        resetGame();
        updateInstructions();
    });
    
    battleBtn.addEventListener('click', () => {
        gameMode = 'battle';
        battleBtn.classList.add('active');
        singleBtn.classList.remove('active');
        pvpBtn.classList.remove('active');
        singleMode.classList.add('hidden');
        battleMode.classList.remove('hidden');
        pvpMode.classList.add('hidden');
        initBattleGame();
        updateInstructions();
    });
    
    pvpBtn.addEventListener('click', () => {
        gameMode = 'pvp';
        pvpBtn.classList.add('active');
        singleBtn.classList.remove('active');
        battleBtn.classList.remove('active');
        singleMode.classList.add('hidden');
        battleMode.classList.add('hidden');
        pvpMode.classList.remove('hidden');
        initPvpGame();
        updateInstructions();
    });
}

// 初始化对战游戏
function initBattleGame() {
    playerGame = new TetrisGame('player-board', 'player-next', 'player-score', 'player-level', false, 'player-lines');
    aiGame = new TetrisGame('ai-board', 'ai-next', 'ai-score', 'ai-level', true, 'ai-lines');
    
    playerGame.reset();
    aiGame.reset();
}

// 初始化双人对战游戏
function initPvpGame() {
    player1Game = new TetrisGame('p1-board', 'p1-next', 'p1-score', 'p1-level', false, 'p1-lines');
    player2Game = new TetrisGame('p2-board', 'p2-next', 'p2-score', 'p2-level', false, 'p2-lines');
    
    player1Game.reset();
    player2Game.reset();
}

// 检查对战结束
function checkBattleEnd() {
    if (playerGame && aiGame) {
        if (playerGame.gameOver) {
            alert('AI获胜！');
        } else if (aiGame.gameOver) {
            alert('玩家获胜！');
        }
    }
    
    if (player1Game && player2Game) {
        if (player1Game.gameOver) {
            alert('玩家2获胜！');
        } else if (player2Game.gameOver) {
            alert('玩家1获胜！');
        }
    }
}

// 设置事件监听器
function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (gameMode === 'battle') {
            handleBattleControls(e);
        } else if (gameMode === 'pvp') {
            handlePvpControls(e);
        } else {
            handleSingleControls(e);
        }
    });
    
    startButton.addEventListener('click', startGame);
    autoButton.addEventListener('click', toggleAutoPlay);
    pauseButton.addEventListener('click', togglePause);
    resetButton.addEventListener('click', resetGame);
}

// 单人模式控制
function handleSingleControls(e) {
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
        case ' ':
            hardDrop();
            break;
    }
}

// 对战模式控制
function handleBattleControls(e) {
    if (!playerGame || playerGame.gameOver || gamePaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            playerGame.movePiece(-1, 0);
            break;
        case 'ArrowRight':
            playerGame.movePiece(1, 0);
            break;
        case 'ArrowDown':
            playerGame.movePiece(0, 1);
            break;
        case 'ArrowUp':
            const rotatedPiece = playerGame.rotatePiece(playerGame.currentPiece);
            if (!playerGame.checkCollision(rotatedPiece, playerGame.currentPosition)) {
                playerGame.currentPiece = rotatedPiece;
                playerGame.drawBoard();
            }
            break;
        case ' ':
            while (playerGame.movePiece(0, 1));
            playerGame.lockPiece();
            break;
    }
}

// 双人对战模式控制
// 玩家1: WASD + Q旋转, 玩家2: 方向键 + 空格旋转
function handlePvpControls(e) {
    if (!player1Game || !player2Game || gamePaused) return;
    
    // 玩家1: WASD控制, Q旋转
    if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        player1Game.movePiece(-1, 0);
    } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        player1Game.movePiece(1, 0);
    } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        player1Game.movePiece(0, 1);
    } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        const rotated1 = player1Game.rotatePiece(player1Game.currentPiece);
        if (!player1Game.checkCollision(rotated1, player1Game.currentPosition)) {
            player1Game.currentPiece = rotated1;
            player1Game.drawBoard();
        }
    }
    
    // 玩家2: 方向键控制, 空格旋转
    if (e.key === 'ArrowLeft' && !e.ctrlKey) {
        e.preventDefault();
        player2Game.movePiece(-1, 0);
    } else if (e.key === 'ArrowRight' && !e.ctrlKey) {
        e.preventDefault();
        player2Game.movePiece(1, 0);
    } else if (e.key === 'ArrowDown' && !e.ctrlKey) {
        e.preventDefault();
        player2Game.movePiece(0, 1);
    } else if (e.key === ' ') {
        e.preventDefault();
        const rotated2 = player2Game.rotatePiece(player2Game.currentPiece);
        if (!player2Game.checkCollision(rotated2, player2Game.currentPosition)) {
            player2Game.currentPiece = rotated2;
            player2Game.drawBoard();
        }
    }
}

// 开始游戏
function startGame() {
    if (gameMode === 'battle') {
        startBattleGame();
    } else if (gameMode === 'pvp') {
        startPvpGame();
    } else {
        startSingleGame();
    }
}

// 开始单人游戏
function startSingleGame() {
    if (gameOver) {
        resetGame();
    }
    
    gamePaused = false;
    startButton.disabled = true;
    pauseButton.disabled = false;
    autoButton.disabled = false;
    
    if (dropTimer) clearInterval(dropTimer);
    dropTimer = setInterval(dropPiece, dropInterval);
}

// 开始对战游戏
function startBattleGame() {
    if (!playerGame || !aiGame) {
        initBattleGame();
    }
    
    gamePaused = false;
    startButton.disabled = true;
    pauseButton.disabled = false;
    autoButton.disabled = true;
    
    playerGame.start();
    aiGame.start();
}

// 开始双人对战游戏
function startPvpGame() {
    if (!player1Game || !player2Game) {
        initPvpGame();
    }
    
    gamePaused = false;
    startButton.disabled = true;
    pauseButton.disabled = false;
    autoButton.disabled = true;
    
    player1Game.start();
    player2Game.start();
}

// 暂停/继续游戏
function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        clearInterval(dropTimer);
        clearInterval(autoPlayTimer);
        if (playerGame && playerGame.dropTimer) clearInterval(playerGame.dropTimer);
        if (aiGame && aiGame.dropTimer) clearInterval(aiGame.dropTimer);
        pauseButton.textContent = '继续';
    } else {
        if (gameMode === 'battle') {
            if (playerGame && !playerGame.gameOver) {
                playerGame.dropTimer = setInterval(() => playerGame.dropPiece(), playerGame.dropInterval);
            }
            if (aiGame && !aiGame.gameOver) {
                aiGame.startAutoPlay();
            }
        } else {
            dropTimer = setInterval(dropPiece, dropInterval);
            if (autoPlay) {
                startAutoPlay();
            }
        }
        pauseButton.textContent = '暂停';
    }
}

// 自动游戏
function toggleAutoPlay() {
    if (gameOver || gameMode === 'battle') return;
    
    autoPlay = !autoPlay;
    
    if (autoPlay) {
        if (gamePaused) {
            gamePaused = false;
            pauseButton.textContent = '暂停';
        }
        
        startButton.disabled = true;
        autoButton.textContent = '停止自动';
        
        if (dropTimer) clearInterval(dropTimer);
        dropTimer = setInterval(dropPiece, dropInterval);
        
        startAutoPlay();
    } else {
        startButton.disabled = false;
        autoButton.textContent = '自动游戏';
        clearInterval(autoPlayTimer);
    }
}

// 自动移动逻辑
function startAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    
    autoPlayTimer = setInterval(() => {
        if (gameOver || gamePaused || !autoPlay) return;
        
        const bestMove = findBestMove();
        
        if (bestMove.rotations > 0) {
            for (let i = 0; i < bestMove.rotations; i++) {
                rotateCurrentPiece();
            }
        }
        
        const targetX = bestMove.x - currentPosition.x;
        if (targetX > 0) {
            for (let i = 0; i < targetX; i++) {
                movePiece(1, 0);
            }
        } else if (targetX < 0) {
            for (let i = 0; i < Math.abs(targetX); i++) {
                movePiece(-1, 0);
            }
        }
        
    }, 100);
}

// 旋转当前方块
function rotateCurrentPiece() {
    const rotatedPiece = rotatePiece(currentPiece);
    if (!checkCollision(rotatedPiece, currentPosition)) {
        currentPiece = rotatedPiece;
        drawBoard();
    }
}

// 找到最佳移动位置
function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = { x: currentPosition.x, rotations: 0 };
    
    const piece = currentPiece;
    
    for (let rotations = 0; rotations < 4; rotations++) {
        const rotatedPiece = { ...piece, shape: getRotatedShape(piece.shape, rotations) };
        
        for (let x = -2; x < COLS + 2; x++) {
            const position = { x: x, y: currentPosition.y };
            
            if (!checkCollision(rotatedPiece, position)) {
                const landingY = getLandingPosition(rotatedPiece, position);
                const score = evaluatePosition(rotatedPiece, { x: x, y: landingY });
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { x: x, rotations: rotations };
                }
            }
        }
    }
    
    return bestMove;
}

// 获取旋转后的形状
function getRotatedShape(shape, times) {
    let result = shape;
    for (let i = 0; i < times; i++) {
        result = result[0].map((_, index) => 
            result.map(row => row[index]).reverse()
        );
    }
    return result;
}

// 获取方块落地位置
function getLandingPosition(piece, position) {
    let y = position.y;
    while (!checkCollision(piece, { x: position.x, y: y + 1 })) {
        y++;
    }
    return y;
}

// 评估位置分数
function evaluatePosition(piece, position) {
    let score = 0;
    
    const testBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = position.x + x;
                const boardY = position.y + y;
                if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                    testBoard[boardY][boardX] = piece.color;
                }
            }
        }
    }
    
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (testBoard[y].every(cell => cell !== 0)) {
            linesCleared++;
        }
    }
    score += linesCleared * 1000;
    
    let maxHeight = 0;
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            if (testBoard[y][x]) {
                maxHeight = Math.max(maxHeight, ROWS - y);
                break;
            }
        }
    }
    score -= maxHeight * 10;
    
    let holes = 0;
    for (let x = 0; x < COLS; x++) {
        let foundBlock = false;
        for (let y = 0; y < ROWS; y++) {
            if (testBoard[y][x]) {
                foundBlock = true;
            } else if (foundBlock && !testBoard[y][x]) {
                holes++;
            }
        }
    }
    score -= holes * 50;
    
    const pieceCenterX = position.x + piece.shape[0].length / 2;
    const boardCenterX = COLS / 2;
    score -= Math.abs(pieceCenterX - boardCenterX) * 2;
    
    return score;
}

// 确保DOM加载完成后再初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    try {
        initGame();
        console.log('游戏初始化成功');
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏加载失败，请刷新页面重试');
    }
});
