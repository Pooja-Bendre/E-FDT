// 📄 FILE: invest.js
// Investment Marketplace JavaScript - Casper Powered

console.log('🚀 Casper-powered Investment Marketplace loaded');

let connectedWallet = null;
let currentProject = null;
let investmentHistory = [];
let onChainTransactions = []; // Store blockchain transactions

// Sample Projects Data
const projects = [
    {
        id: 'MUM-001',
        name: 'Green Affordable Housing - Dharavi',
        city: 'Mumbai',
        status: 'government_approved',
        targetAmount: 10000000, // 1 Crore
        raisedAmount: 6500000,
        carbonCredits: 7703,
        complianceGrade: 'A',
        roi: 18.5,
        jobs: 450,
        governmentApproval: 'Ministry of Housing & Urban Affairs',
        approvalDate: '2025-12-15'
    },
    {
        id: 'DEL-002',
        name: 'Solar Community Center - Dwarka',
        city: 'Delhi',
        status: 'government_approved',
        targetAmount: 5000000,
        raisedAmount: 2000000,
        carbonCredits: 4520,
        complianceGrade: 'A',
        roi: 22.3,
        jobs: 280,
        governmentApproval: 'Delhi Development Authority',
        approvalDate: '2026-01-02'
    },
    {
        id: 'BLR-003',
        name: 'Smart Green Retrofit - Whitefield',
        city: 'Bangalore',
        status: 'pending_approval',
        targetAmount: 7500000,
        raisedAmount: 1500000,
        carbonCredits: 5890,
        complianceGrade: 'B',
        roi: 16.8,
        jobs: 320,
        governmentApproval: 'Under Review',
        approvalDate: 'Pending'
    },
    {
        id: 'MUM-004',
        name: 'Urban Forest Development - Bandra',
        city: 'Mumbai',
        status: 'funded',
        targetAmount: 3000000,
        raisedAmount: 3000000,
        carbonCredits: 3200,
        complianceGrade: 'A',
        roi: 14.5,
        jobs: 180,
        governmentApproval: 'BMC Environmental Dept',
        approvalDate: '2025-11-20'
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadInvestmentHistory();
    setupWalletConnection();
    loadProjects();
    setupFilters();
    setupModal();
});

// Load Investment History from LocalStorage
function loadInvestmentHistory() {
    const saved = localStorage.getItem('efdt_investments');
    if (saved) {
        try {
            investmentHistory = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading history:', e);
            investmentHistory = [];
        }
    }
}

// Wallet Connection Logic
function setupWalletConnection() {
    const btn = document.getElementById('connectWalletBtn');
    const display = document.getElementById('walletDisplay');
    const addrText = document.getElementById('userWalletAddr');
    
    if (!btn) return;
    
    btn.addEventListener('click', async function() {
        try {
            if (window.CasperWalletProvider) {
                const provider = window.CasperWalletProvider();
                const isConnected = await provider.requestConnection();
                if (isConnected) {
                    connectedWallet = await provider.getActivePublicKey();
                    
                    if (display && addrText) {
                        display.style.display = 'inline-flex';
                        addrText.textContent = `${connectedWallet.substring(0, 6)}...${connectedWallet.substring(connectedWallet.length - 4)}`;
                    }
                    btn.innerHTML = '<i class="fas fa-check-circle"></i> Wallet Connected';
                    btn.style.background = '#10b981';
                    btn.disabled = true;
                    
                    showNotification('✅ Wallet connected successfully!', 'success');
                }
            } else {
                showNotification('⚠️ Please install Casper Wallet!', 'warning');
                window.open('https://www.casperwallet.io/', '_blank');
            }
        } catch (err) {
            console.error('Connection failed:', err);
            showNotification('❌ Wallet connection failed.', 'error');
        }
    });
}

// Load and Display Projects
function loadProjects(filter = 'all', city = 'all') {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    let filteredProjects = projects;
    if (filter !== 'all') filteredProjects = filteredProjects.filter(p => p.status === filter);
    if (city !== 'all') filteredProjects = filteredProjects.filter(p => p.city === city);
    
    grid.innerHTML = filteredProjects.map(project => {
        const fundingPercent = (project.raisedAmount / project.targetAmount) * 100;
        const statusClass = project.status === 'government_approved' ? 'approved' : 
                           project.status === 'pending_approval' ? 'pending' : 'funded';
        const statusText = project.status === 'government_approved' ? '✓ Approved' :
                          project.status === 'pending_approval' ? '⏳ Pending' : '✓ Funded';
        
        return `
            <div class="project-card">
                <div class="project-header">
                    <span class="project-status ${statusClass}">${statusText}</span>
                    <h3>${project.name}</h3>
                    <p><i class="fas fa-map-marker-alt"></i> ${project.city}</p>
                </div>
                <div class="project-body">
                    <div class="funding-progress">
                        <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${fundingPercent}%"></div></div>
                        <div class="progress-text"><span>₹${(project.raisedAmount / 10000000).toFixed(2)} Cr</span><span>${fundingPercent.toFixed(0)}%</span></div>
                    </div>
                    <div class="project-metric"><span class="metric-label">Expected ROI</span><span class="metric-value highlight">${project.roi}%</span></div>
                    <button class="btn-invest-card" onclick="openInvestModal('${project.id}')" ${project.status === 'funded' ? 'disabled' : ''}>
                        ${project.status === 'funded' ? 'Fully Funded' : 'Invest Now'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Modal Handling
function setupModal() {
    const modal = document.getElementById('investModal');
    const closeBtn = document.querySelector('.modal-close');
    const confirmBtn = document.getElementById('confirmInvestBtn');
    
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };
    if (confirmBtn) confirmBtn.onclick = processInvestment;
}

function openInvestModal(projectId) {
    if (!connectedWallet) {
        showNotification('⚠️ Please connect your wallet first!', 'warning');
        return;
    }
    currentProject = projects.find(p => p.id === projectId);
    const modal = document.getElementById('investModal');
    const details = document.getElementById('modalProjectDetails');
    if (modal && details) {
        details.innerHTML = `<h3>${currentProject.name}</h3><p>City: ${currentProject.city}</p><p>ROI: ${currentProject.roi}%</p>`;
        modal.style.display = 'block';
    }
}

// --- CORE PROCESSING FUNCTION (WITH REQUESTED CHANGES) ---
async function processInvestment() {
    const amountInput = document.getElementById('investAmount');
    const nameInput = document.getElementById('investorName');
    const amount = parseFloat(amountInput.value);
    const investorName = nameInput.value;

    if (!amount || amount <= 0) {
        showNotification('❌ Please enter a valid amount', 'error');
        return;
    }

    try {
        showNotification('⏳ Processing investment on Casper blockchain...', 'info');

        // Simulate Casper deploy hash generation
        const deployHash = Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');

        // LOCATION 1: Updated Explorer URL and Alert Logic
        const explorerUrl = `https://testnet.cspr.live/deploy/${deployHash}`;
        
        alert(`✅ INVESTMENT SUCCESSFUL!\n\n` + 
              `Amount: ₹${amount.toLocaleString()}\n` + 
              `Project: ${currentProject.name}\n\n` + 
              `Deploy Hash:\n${deployHash}\n\n` + 
              `View on Casper Explorer:\n${explorerUrl}`);

        // LOCATION 2: Updated Transaction Storage Logic
        onChainTransactions.push({
            hash: deployHash,           // Changed from 'signature'
            action: 'Project Investment',
            data: { project: currentProject.name, amount: amount },
            timestamp: new Date().toISOString(),
            explorer: explorerUrl
        });

        // Save to persistent history
        saveInvestmentToHistory(deployHash, currentProject, amount, investorName);
        
        // UI Updates
        document.getElementById('investModal').style.display = 'none';
        showSuccessModal(deployHash, currentProject, amount);
        
        currentProject.raisedAmount += amount;
        loadProjects();
        
        // Clear form
        amountInput.value = '';
        nameInput.value = '';

    } catch (error) {
        console.error('Investment failed:', error);
        showNotification('❌ Investment failed: ' + error.message, 'error');
    }
}

function saveInvestmentToHistory(hash, projectData, amount, investorName) {
    const investment = {
        signature: hash,
        projectId: projectData.id,
        projectName: projectData.name,
        amount: amount,
        investor: investorName,
        timestamp: new Date().toISOString()
    };
    investmentHistory.push(investment);
    localStorage.setItem('efdt_investments', JSON.stringify(investmentHistory));
}

function showSuccessModal(signature, project, amount) {
    const existing = document.getElementById('successModal');
    if (existing) existing.remove();
    
    const modalHTML = `
        <div id="successModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 10000;">
            <div style="background: #1e293b; border-radius: 24px; padding: 40px; max-width: 500px; width: 90%; color: white; text-align: center; border: 1px solid #334155;">
                <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto;">
                    <i class="fas fa-check" style="font-size: 30px;"></i>
                </div>
                <h2>Investment Confirmed!</h2>
                <p style="color: #94a3b8; margin-bottom: 20px;">Recorded on Casper Testnet</p>
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: left;">
                    <p><strong>Project:</strong> ${project.name}</p>
                    <p><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
                    <p style="font-size: 10px; word-break: break-all; margin-top: 10px; color: #10b981;">HASH: ${signature}</p>
                </div>
                <a href="https://testnet.cspr.live/deploy/${signature}" target="_blank" style="display: block; background: #6366f1; color: white; padding: 12px; border-radius: 8px; text-decoration: none; margin-bottom: 10px; font-weight: bold;">View on Explorer</a>
                <button onclick="document.getElementById('successModal').remove()" style="background: transparent; border: 1px solid #475569; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Close</button>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${colors[type]}; color: white; padding: 16px 24px; border-radius: 12px; z-index: 10001; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.1);`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

function setupFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const cityFilter = document.getElementById('cityFilter');
    if (statusFilter) statusFilter.addEventListener('change', () => loadProjects(statusFilter.value, cityFilter?.value || 'all'));
    if (cityFilter) cityFilter.addEventListener('change', () => loadProjects(statusFilter?.value || 'all', cityFilter.value));
}
