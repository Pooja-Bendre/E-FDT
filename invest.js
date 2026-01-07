// Investment Marketplace JavaScript

// Casper Connection
const Casper_CONNECTION = new window.CasperWeb3.Connection(
    window.CasperWeb3.clusterApiUrl('devnet'),
    'confirmed'
);

let connectedWallet = null;
let currentProject = null;
let investmentHistory = [];

// Sample Projects Data (In production, load from your analysis results)
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

// Load Investment History
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

// Save Investment to History
function saveInvestmentToHistory(signature, projectData, amount, investorName) {
    const investment = {
        signature: signature,
        projectId: projectData.id,
        projectName: projectData.name,
        city: projectData.city,
        amount: amount,
        investor: investorName,
        wallet: connectedWallet,
        timestamp: new Date().toISOString(),
        explorerUrl: `https://explorer.Casper.com/tx/${signature}?cluster=devnet`
    };
    
    investmentHistory.push(investment);
    localStorage.setItem('efdt_investments', JSON.stringify(investmentHistory));
}

// Wallet Connection
function setupWalletConnection() {
    const btn = document.getElementById('connectWalletBtn');
    const display = document.getElementById('walletDisplay');
    const addrText = document.getElementById('userWalletAddr');
    
    if (!btn) return;
    
    btn.addEventListener('click', async function() {
        try {
            if (window.Casper && window.Casper.isPhantom) {
                const resp = await window.Casper.connect();
                connectedWallet = resp.publicKey.toString();
                
                // Update UI
                if (display && addrText) {
                    display.style.display = 'inline-flex';
                    addrText.textContent = `${connectedWallet.substring(0, 6)}...${connectedWallet.substring(connectedWallet.length - 4)}`;
                }
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Wallet Connected';
                btn.style.background = '#10b981';
                btn.disabled = true;
                
                showNotification('✅ Wallet connected successfully! You can now invest in projects.', 'success');
            } else {
                showNotification('⚠️ Please install Phantom Wallet to invest!', 'warning');
                window.open('https://phantom.app/', '_blank');
            }
        } catch (err) {
            console.error('Connection failed:', err);
            showNotification('❌ Wallet connection failed. Please try again.', 'error');
        }
    });
}

// Load Projects
function loadProjects(filter = 'all', city = 'all') {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    let filteredProjects = projects;
    
    // Apply filters
    if (filter !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.status === filter);
    }
    if (city !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.city === city);
    }
    
    // Update stats
    const totalProjectsEl = document.getElementById('totalProjects');
    const totalInvestmentEl = document.getElementById('totalInvestment');
    
    if (totalProjectsEl) {
        totalProjectsEl.textContent = filteredProjects.length;
    }
    if (totalInvestmentEl) {
        const totalInvestment = filteredProjects.reduce((sum, p) => sum + p.raisedAmount, 0);
        totalInvestmentEl.textContent = `₹${(totalInvestment / 10000000).toFixed(1)}Cr`;
    }
    
    // Generate HTML
    grid.innerHTML = filteredProjects.map(project => {
        const fundingPercent = (project.raisedAmount / project.targetAmount) * 100;
        const statusClass = project.status === 'government_approved' ? 'approved' : 
                           project.status === 'pending_approval' ? 'pending' : 'funded';
        const statusText = project.status === 'government_approved' ? '✓ Government Approved' :
                          project.status === 'pending_approval' ? '⏳ Pending Approval' : '✓ Fully Funded';
        
        return `
            <div class="project-card">
                <div class="project-header">
                    <span class="project-status ${statusClass}">${statusText}</span>
                    <h3>${project.name}</h3>
                    <p class="project-location"><i class="fas fa-map-marker-alt"></i> ${project.city}</p>
                </div>
                
                <div class="project-body">
                    <div class="project-metric">
                        <span class="metric-label">Target Amount</span>
                        <span class="metric-value">₹${(project.targetAmount / 10000000).toFixed(1)} Cr</span>
                    </div>
                    
                    <div class="funding-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${fundingPercent}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>₹${(project.raisedAmount / 10000000).toFixed(2)} Cr raised</span>
                            <span>${fundingPercent.toFixed(0)}%</span>
                        </div>
                    </div>
                    
                    <div class="project-metric">
                        <span class="metric-label">Carbon Credits</span>
                        <span class="metric-value highlight">${project.carbonCredits.toLocaleString()} tons</span>
                    </div>
                    
                    <div class="project-metric">
                        <span class="metric-label">Compliance Grade</span>
                        <span class="metric-value">${project.complianceGrade}</span>
                    </div>
                    
                    <div class="project-metric">
                        <span class="metric-label">Expected ROI</span>
                        <span class="metric-value highlight">${project.roi}%</span>
                    </div>
                    
                    <div class="project-metric">
                        <span class="metric-label">Jobs Created</span>
                        <span class="metric-value">${project.jobs}</span>
                    </div>
                    
                    <button class="btn-invest-card" onclick="openInvestModal('${project.id}')" ${project.status === 'funded' ? 'disabled' : ''}>
                        <i class="fas fa-hand-holding-usd"></i> ${project.status === 'funded' ? 'Fully Funded' : 'Invest Now'}
                    </button>
                    
                    <div class="blockchain-badge">
                        <i class="fas fa-shield-alt"></i> Verified on Casper
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Setup Filters
function setupFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const cityFilter = document.getElementById('cityFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            const city = cityFilter ? cityFilter.value : 'all';
            loadProjects(this.value, city);
        });
    }
    
    if (cityFilter) {
        cityFilter.addEventListener('change', function() {
            const status = statusFilter ? statusFilter.value : 'all';
            loadProjects(status, this.value);
        });
    }
}

// Modal Functions
function setupModal() {
    const modal = document.getElementById('investModal');
    const closeBtn = document.querySelector('.modal-close');
    const confirmBtn = document.getElementById('confirmInvestBtn');
    
    if (closeBtn) {
        closeBtn.onclick = function() {
            if (modal) modal.style.display = 'none';
        };
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
    
    if (confirmBtn) {
        confirmBtn.onclick = processInvestment;
    }
}

function openInvestModal(projectId) {
    if (!connectedWallet) {
        showNotification('⚠️ Please connect your wallet first!', 'warning');
        return;
    }
    
    currentProject = projects.find(p => p.id === projectId);
    const modal = document.getElementById('investModal');
    const details = document.getElementById('modalProjectDetails');
    
    if (!modal || !details || !currentProject) return;
    
    details.innerHTML = `
        <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #10b981;">
            <h3 style="color: #065f46; margin-bottom: 10px;">${currentProject.name}</h3>
            <p style="color: #047857;"><i class="fas fa-map-marker-alt"></i> ${currentProject.city}</p>
            <p style="color: #047857; margin-top: 10px;"><strong>Government Approval:</strong> ${currentProject.governmentApproval}</p>
            <p style="color: #047857;"><strong>Expected ROI:</strong> ${currentProject.roi}%</p>
        </div>
    `;
    
    modal.style.display = 'block';
}

async function processInvestment() {
    const amountInput = document.getElementById('investAmount');
    const investorNameInput = document.getElementById('investorName');
    
    if (!amountInput) return;
    
    const amount = parseInt(amountInput.value);
    const investorName = investorNameInput ? investorNameInput.value || 'Anonymous' : 'Anonymous';
    
    if (!amount || amount < 10000) {
        showNotification('⚠️ Minimum investment is ₹10,000', 'warning');
        return;
    }
    
    if (!connectedWallet) {
        showNotification('⚠️ Please connect wallet first!', 'error');
        return;
    }
    
    if (!currentProject) {
        showNotification('⚠️ No project selected!', 'error');
        return;
    }
    
    try {
        showNotification('⏳ Processing investment on Casper blockchain...', 'info');
        
        // Create transaction
        const transaction = new window.CasperWeb3.Transaction().add(
            window.CasperWeb3.SystemProgram.transfer({
                fromPubkey: window.Casper.publicKey,
                toPubkey: window.Casper.publicKey,
                lamports: 5000
            })
        );
        
        // Add memo with investment data
        const metadata = JSON.stringify({
            platform: 'E-FDT',
            action: 'INVESTMENT_RECORDED',
            projectId: currentProject.id,
            projectName: currentProject.name,
            city: currentProject.city,
            amount: amount,
            currency: 'INR',
            investor: investorName,
            investorWallet: connectedWallet,
            governmentApproval: currentProject.governmentApproval,
            carbonCredits: currentProject.carbonCredits,
            complianceGrade: currentProject.complianceGrade,
            timestamp: new Date().toISOString()
        });
        
        const memoInstruction = new window.CasperWeb3.TransactionInstruction({
            keys: [{ pubkey: window.Casper.publicKey, isSigner: true, isWritable: true }],
            programId: new window.CasperWeb3.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
            data: new TextEncoder().encode(metadata)
        });
        transaction.add(memoInstruction);
        
        // Get recent blockhash
        const { blockhash } = await Casper_CONNECTION.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = window.Casper.publicKey;
        
        console.log('Requesting signature...');
        const signed = await window.Casper.signTransaction(transaction);
        
        console.log('Sending transaction...');
        const signature = await Casper_CONNECTION.sendRawTransaction(signed.serialize());
        
        console.log('Confirming transaction...');
        await Casper_CONNECTION.confirmTransaction(signature, 'confirmed');
        
        console.log('✅ Investment recorded on blockchain:', signature);
        
        // Save to history
        saveInvestmentToHistory(signature, currentProject, amount, investorName);
        
        // Close invest modal
        const modal = document.getElementById('investModal');
        if (modal) modal.style.display = 'none';
        
        // Show success modal
        showSuccessModal(signature, currentProject, amount);
        
        // Update project (in production, update via API)
        currentProject.raisedAmount += amount;
        loadProjects();
        
        // Clear form
        if (amountInput) amountInput.value = '';
        if (investorNameInput) investorNameInput.value = '';
        
    } catch (error) {
        console.error('Investment failed:', error);
        showNotification('❌ Investment failed: ' + error.message, 'error');
    }
}

function showSuccessModal(signature, project, amount) {
    // Remove any existing success modal
    const existing = document.getElementById('successModal');
    if (existing) existing.remove();
    
    // Create modal HTML
    const modalHTML = `
        <div id="successModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        ">
            <div style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                border-radius: 24px;
                padding: 50px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 30px 90px rgba(0,0,0,0.5);
                border: 2px solid #334155;
                animation: slideUp 0.4s ease;
            ">
                <!-- Success Icon -->
                <div style="
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 25px auto;
                    box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
                ">
                    <i class="fas fa-check" style="font-size: 40px; color: white;"></i>
                </div>
                
                <!-- Title -->
                <h2 style="
                    color: white;
                    text-align: center;
                    margin-bottom: 15px;
                    font-size: 32px;
                    font-weight: 900;
                ">Investment Successful! 🎉</h2>
                
                <p style="
                    color: #94a3b8;
                    text-align: center;
                    margin-bottom: 30px;
                    font-size: 16px;
                ">Your investment has been recorded on Casper blockchain</p>
                
                <!-- Investment Details Box -->
                <div style="
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 25px;
                    margin-bottom: 30px;
                ">
                    <div style="margin-bottom: 15px;">
                        <span style="color: #94a3b8; font-size: 13px; font-weight: 600;">PROJECT</span>
                        <p style="color: white; font-size: 18px; font-weight: 700; margin: 5px 0 0 0;">${project.name}</p>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <span style="color: #94a3b8; font-size: 13px; font-weight: 600;">AMOUNT INVESTED</span>
                        <p style="color: #10b981; font-size: 28px; font-weight: 900; margin: 5px 0 0 0;">₹${amount.toLocaleString()}</p>
                    </div>
                    <div>
                        <span style="color: #94a3b8; font-size: 13px; font-weight: 600;">WALLET</span>
                        <p style="color: white; font-size: 14px; font-family: monospace; margin: 5px 0 0 0; word-break: break-all;">${connectedWallet.substring(0, 20)}...${connectedWallet.substring(connectedWallet.length - 10)}</p>
                    </div>
                </div>
                
                <!-- Transaction Signature -->
                <div style="
                    background: rgba(16, 185, 129, 0.1);
                    border: 2px solid #10b981;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 25px;
                ">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <i class="fas fa-shield-alt" style="color: #10b981; font-size: 18px;"></i>
                        <span style="color: #10b981; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Blockchain Verified</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 11px; margin-bottom: 10px;">TRANSACTION SIGNATURE</p>
                    <p style="
                        color: white;
                        font-family: monospace;
                        font-size: 12px;
                        word-break: break-all;
                        background: rgba(0,0,0,0.3);
                        padding: 12px;
                        border-radius: 8px;
                        margin: 0;
                    ">${signature}</p>
                </div>
                
                <!-- Action Buttons -->
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                    <a href="https://explorer.Casper.com/tx/${signature}?cluster=devnet" 
                       target="_blank" 
                       style="
                        flex: 1;
                        padding: 18px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 15px;
                        text-align: center;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                    " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 35px rgba(102, 126, 234, 0.6)';" 
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(102, 126, 234, 0.4)';">
                        <i class="fas fa-external-link-alt"></i>
                        View on Casper Explorer
                    </a>
                </div>
                
                <button onclick="document.getElementById('successModal').remove()" style="
                    width: 100%;
                    padding: 15px;
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.borderColor='rgba(255,255,255,0.3)';" 
                   onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)';">
                    Close
                </button>
            </div>
        </div>
        
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(50px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    `;
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showNotification(message, type = 'info') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        z-index: 10001;
        font-weight: 600;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
