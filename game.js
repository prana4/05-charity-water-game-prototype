// Game State
let gameState = {
    currentFlow: 30,
    sunriseProgress: 0,
    path: [0], // Pool IDs in order
    flowChain: [30], // Flow values at each step
    pools: [],
    gameStatus: 'playing', // 'playing', 'won', 'lost'
    sunriseInterval: null
};

// Facts array
const facts = [
    "703 million people lack clean water nearby",
    "Women and girls spend 6 hours a day collecting water",
    "1 in 10 people lack access to clean water",
    "Clean water changes everything for a community"
];

// Initialize game
function initGame() {
    gameState.pools = [
        { id: 0, x: 15, y: 65, value: 30, type: 'spring', state: 'tapped', label: 'START:30' },
        { id: 1, x: 35, y: 50, value: 25, type: 'add', state: 'clickable' },
        { id: 2, x: 55, y: 55, value: 18, type: 'add', state: 'locked' },
        { id: 3, x: 72, y: 48, value: 8, type: 'add', state: 'locked' },
        { id: 4, x: 45, y: 70, value: -12, type: 'drain', state: 'clickable' },
        { id: 5, x: 25, y: 52, value: -8, type: 'drain', state: 'clickable' },
        { id: 6, x: 62, y: 62, value: 29, type: 'add', state: 'clickable' }
    ];
    
    renderPools();
    updateUI();
    startSunriseTimer();
}

// Render pools
function renderPools() {
    const container = document.getElementById('pool-container');
    container.innerHTML = '';
    
    gameState.pools.forEach(pool => {
        const poolEl = document.createElement('div');
        poolEl.className = `pool ${pool.state} ${pool.type}`;
        poolEl.style.left = pool.x + '%';
        poolEl.style.top = pool.y + '%';
        poolEl.dataset.id = pool.id;
        
        // Pool overlay (for locked state)
        const overlay = document.createElement('div');
        overlay.className = 'pool-overlay';
        poolEl.appendChild(overlay);
        
        // Pool ring
        const ring = document.createElement('div');
        ring.className = 'pool-ring';
        poolEl.appendChild(ring);
        
        // Checkmark for tapped pools
        if (pool.state === 'tapped' && pool.type !== 'spring') {
            const checkmark = document.createElement('div');
            checkmark.className = 'pool-checkmark';
            checkmark.innerHTML = `
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
            `;
            poolEl.appendChild(checkmark);
        }
        
        // Value label
        const valueLabel = document.createElement('div');
        valueLabel.className = 'pool-value';
        
        if (pool.type === 'spring') {
            valueLabel.className += ' spring';
            valueLabel.textContent = pool.label;
        } else {
            valueLabel.className += pool.value > 0 ? ' positive' : ' negative';
            valueLabel.textContent = pool.value > 0 ? `+${pool.value}` : pool.value;
        }
        
        poolEl.appendChild(valueLabel);
        
        // Click handler
        if (pool.state === 'clickable') {
            poolEl.addEventListener('click', () => tapPool(pool.id));
        }
        
        container.appendChild(poolEl);
    });
    
    drawConnectionLines();
}

// Draw connection lines between tapped pools
function drawConnectionLines() {
    const svg = document.getElementById('connection-lines');
    svg.innerHTML = '';
    
    for (let i = 0; i < gameState.path.length - 1; i++) {
        const pool1 = gameState.pools.find(p => p.id === gameState.path[i]);
        const pool2 = gameState.pools.find(p => p.id === gameState.path[i + 1]);
        
        if (pool1 && pool2) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', pool1.x + '%');
            line.setAttribute('y1', pool1.y + '%');
            line.setAttribute('x2', pool2.x + '%');
            line.setAttribute('y2', pool2.y + '%');
            line.setAttribute('stroke', 'rgba(34, 211, 238, 0.6)');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-dasharray', '8,8');
            svg.appendChild(line);
        }
    }
}

// Tap a pool
function tapPool(poolId) {
    if (gameState.gameStatus !== 'playing') return;
    
    const pool = gameState.pools.find(p => p.id === poolId);
    if (!pool || pool.state !== 'clickable') return;
    
    // Update flow
    const newFlow = gameState.currentFlow + pool.value;
    gameState.currentFlow = newFlow;
    
    // Update path and chain
    gameState.path.push(poolId);
    gameState.flowChain.push(newFlow);
    
    // Update pool state
    pool.state = 'tapped';
    
    // Increase sunrise progress
    gameState.sunriseProgress = Math.min(gameState.sunriseProgress + 15, 100);
    
    // Unlock pools based on path length
    if (gameState.path.length >= 3) {
        gameState.pools.forEach(p => {
            if (p.state === 'locked') {
                p.state = 'clickable';
            }
        });
    }
    
    // Check win/lose conditions
    checkGameEnd();
    
    // Re-render
    renderPools();
    updateUI();
}

// Update UI elements
function updateUI() {
    // Sunrise progress
    const progressBar = document.getElementById('sunrise-progress');
    const progressPercent = document.getElementById('sunrise-percent');
    progressBar.style.width = gameState.sunriseProgress + '%';
    progressPercent.textContent = Math.round(gameState.sunriseProgress) + '%';
    
    // Flow value
    document.getElementById('flow-value').textContent = gameState.currentFlow;
    
    // Flow chain
    const chainDisplay = document.getElementById('chain-display');
    let chainText = '';
    
    gameState.flowChain.forEach((val, idx) => {
        if (idx > 0) {
            chainText += ' › ';
            const poolValue = gameState.pools[gameState.path[idx]].value;
            chainText += (poolValue > 0 ? '+' : '') + poolValue;
        } else {
            chainText += val;
        }
    });
    
    if (gameState.flowChain.length > 1) {
        chainText += ' › ' + gameState.currentFlow;
    }
    
    chainDisplay.textContent = chainText;
    
    // Fact ticker (update based on progress)
    const factIndex = Math.min(Math.floor((gameState.sunriseProgress / 100) * facts.length), facts.length - 1);
    document.getElementById('fact-text').textContent = facts[factIndex];
}

// Start sunrise timer
function startSunriseTimer() {
    if (gameState.sunriseInterval) {
        clearInterval(gameState.sunriseInterval);
    }
    
    gameState.sunriseInterval = setInterval(() => {
        if (gameState.gameStatus !== 'playing') {
            clearInterval(gameState.sunriseInterval);
            return;
        }
        
        gameState.sunriseProgress = Math.min(gameState.sunriseProgress + 2, 100);
        updateUI();
        
        if (gameState.sunriseProgress >= 100) {
            checkGameEnd();
        }
    }, 1000);
}

// Check if game has ended
function checkGameEnd() {
    if (gameState.sunriseProgress >= 100) {
        gameState.gameStatus = gameState.currentFlow >= 80 ? 'won' : 'lost';
        clearInterval(gameState.sunriseInterval);
        showEndModal();
    } else if (gameState.currentFlow >= 80) {
        gameState.gameStatus = 'won';
        clearInterval(gameState.sunriseInterval);
        showEndModal();
    }
}

// Show end modal
function showEndModal() {
    if (gameState.gameStatus === 'won') {
        // Update win modal content
        document.getElementById('final-flow-win').textContent = gameState.currentFlow;
        
        let chainText = '';
        gameState.flowChain.forEach((val, idx) => {
            if (idx > 0) {
                chainText += ' › ';
                const poolValue = gameState.pools[gameState.path[idx]].value;
                chainText += (poolValue > 0 ? '+' : '') + poolValue;
            } else {
                chainText += val;
            }
        });
        chainText += ' › ' + gameState.currentFlow + ' ✓';
        document.getElementById('final-chain-win').textContent = chainText;
        
        document.getElementById('win-modal').classList.add('active');
        createConfetti(); // Add confetti effect for win
    } else {
        // Update lose modal content
        document.getElementById('final-flow-lose').textContent = gameState.currentFlow;
        document.getElementById('lose-modal').classList.add('active');
    }
}

// Create confetti effect
function createConfetti() {
    const colors = ['#FFC907', '#2E9DF7', '#4FCB53', '#FF902A', '#F5402C'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 5000);
    }
}

// Reset game
function resetGame() {
    // Hide modals
    document.getElementById('win-modal').classList.remove('active');
    document.getElementById('lose-modal').classList.remove('active');
    
    // Reset state
    gameState = {
        currentFlow: 30,
        sunriseProgress: 0,
        path: [0],
        flowChain: [30],
        pools: [],
        gameStatus: 'playing',
        sunriseInterval: null
    };
    
    // Reinitialize
    initGame();
}

// Share game
function shareGame() {
    const text = `I guided water to the village with a flow of ${gameState.currentFlow}! Can you do better?`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Echoes Before Dawn',
            text: text,
            url: window.location.origin + '/game.html'
        }).catch(() => {
            // Fallback to clipboard
            copyToClipboard();
        });
    } else {
        copyToClipboard();
    }
}

function copyToClipboard() {
    const url = window.location.origin + '/game.html';
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
    }).catch(() => {
        alert('Visit: ' + url);
    });
}

// Initialize game when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
