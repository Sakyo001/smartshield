
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const views = {
        login: document.getElementById('login-view'),
        signup: document.getElementById('signup-view'),
        dashboard: document.getElementById('dashboard-view')
    };
    
    // Auth Buttons / Forms
    const googleLoginBtn = document.getElementById('google-login-btn');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const gotoSignupBtn = document.getElementById('goto-signup');
    const backToLoginBtn = document.getElementById('back-to-login');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Dashboard Elements
    const scanBtn = document.getElementById('scan-btn');
    const userDisplay = document.getElementById('user-display');
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusDesc = document.getElementById('status-desc');
    const scanWarnings = document.getElementById('scan-warnings');
    const warningList = document.getElementById('warning-list');
    const loadingOverlay = document.getElementById('loading-overlay');

    // State
    const AUTH_KEY = 'smartshield_auth';
    
    // Initialize
    checkAuthStatus();

    // Event Listeners
    googleLoginBtn.addEventListener('click', handleGoogleLogin);

    gotoSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('signup');
    });

    backToLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('login');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        await handleEmailLogin(email, password);
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (password !== confirmPassword) {
            showError('signup-error', 'Passwords do not match');
            return;
        }

        await handleSignup(email, password);
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

    scanBtn.addEventListener('click', () => {
        scanCurrentPage();
    });

    // --- Authentication Functions ---

    function checkAuthStatus() {
        chrome.storage.local.get([AUTH_KEY], (result) => {
            const auth = result[AUTH_KEY];
            if (auth && auth.token) {
                userDisplay.textContent = auth.email;
                switchView('dashboard');
                loadCurrentStatus();
            } else {
                switchView('login');
            }
        });
    }

    async function handleGoogleLogin() {
        showLoading(true);
        console.log("Initiating Google Login...");
        
        try {
            // Attempt real Google Auth
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError) {
                    console.warn("Google Auth failed (expected without valid Client ID):", chrome.runtime.lastError);
                    
                    // FALLBACK FOR DEV: Mock success so user can see UI
                    console.log("Rolling back to mock auth for demo.");
                    setTimeout(() => {
                        saveAuth('google-user@gmail.com', 'mock-google-token');
                        showLoading(false);
                    }, 1500);
                } else {
                    // Success (Real)
                    // In a real app, you'd send this token to your backend to verify
                    console.log("Google Token received:", token);
                    saveAuth('google-user@verified.com', token); // Placeholder email
                    showLoading(false);
                }
            });
        } catch (e) {
            console.error(e);
            showLoading(false);
        }
    }

    async function handleEmailLogin(email, password) {
        showLoading(true);
        document.getElementById('login-error').classList.add('hidden');

        setTimeout(() => {
            showLoading(false);
            if (email && password.length >= 6) {
                saveAuth(email, 'mock-email-token-' + Date.now());
            } else {
                showError('login-error', 'Invalid credentials');
            }
        }, 1000);
    }

    async function handleSignup(email, password) {
        showLoading(true);
        document.getElementById('signup-error').classList.add('hidden');

        setTimeout(() => {
            showLoading(false);
            if (email && password.length >= 6) {
                saveAuth(email, 'mock-signup-token-' + Date.now());
            } else {
                showError('signup-error', 'Could not create account');
            }
        }, 1000);
    }

    function saveAuth(email, token) {
        chrome.storage.local.set({
            [AUTH_KEY]: { email, token, timestamp: Date.now() }
        }, () => {
            userDisplay.textContent = email;
            switchView('dashboard');
            loadCurrentStatus();
        });
    }

    function handleLogout() {
        chrome.storage.local.remove([AUTH_KEY], () => {
            // Also revoke Google token if exists (optional)
            switchView('login');
        });
    }

    // --- UI Functions ---

    function switchView(viewName) {
        Object.values(views).forEach(el => el.classList.add('hidden'));
        views[viewName].classList.remove('hidden');
    }

    function showLoading(show) {
        if (show) loadingOverlay.classList.remove('hidden');
        else loadingOverlay.classList.add('hidden');
    }

    function showError(elementId, message) {
        const el = document.getElementById(elementId);
        el.textContent = message;
        el.classList.remove('hidden');
    }

    // --- Scanning Logic ---

    async function loadCurrentStatus() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const currentTab = tabs[0];
            
            if (currentTab && currentTab.id) {
                chrome.storage.local.get([`result_${currentTab.id}`], function(data) {
                    const result = data[`result_${currentTab.id}`];
                    if (result) {
                        displayResult(result);
                    } else {
                        resetStatus();
                    }
                });
            }
        } catch (error) {
            console.error('Error loading status:', error);
        }
    }

    async function scanCurrentPage() {
        showLoading(true);
        const originalText = scanBtn.innerHTML;
        scanBtn.textContent = 'Scanning...';
        scanBtn.disabled = true;
        
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const currentTab = tabs[0];
            
            if (currentTab && currentTab.url) {
                chrome.runtime.sendMessage({
                    action: 'checkURL',
                    url: currentTab.url
                }, function(result) {
                    showLoading(false);
                    scanBtn.innerHTML = originalText;
                    scanBtn.disabled = false;
                    
                    if (chrome.runtime.lastError) {
                         console.error("Runtime error:", chrome.runtime.lastError);
                         displayError("Service unavailable.");
                    } else {
                        displayResult(result);
                    }
                });
            } else {
                 showLoading(false);
                 scanBtn.disabled = false;
                 scanBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Error scanning page:', error);
            showLoading(false);
            scanBtn.disabled = false;
            scanBtn.innerHTML = originalText;
            displayError("Error initializing scan.");
        }
    }

    function displayResult(result) {
        if (!result) return;
        
        statusIcon.classList.remove('safe', 'warning', 'danger');
        
        if (result.isSuspicious) {
            if (result.riskLevel === 'high') {
                statusIcon.textContent = '🚨';
                statusTitle.textContent = 'High Risk Detected';
                statusTitle.style.color = '#ef4444';
                statusDesc.textContent = 'This site shows strong signs of phishing.';
            } else {
                statusIcon.textContent = '⚠️';
                statusTitle.textContent = 'Suspicious Activity';
                statusTitle.style.color = '#eab308';
                statusDesc.textContent = 'Proceed with caution.';
            }
            
            if (result.warnings && result.warnings.length > 0) {
                scanWarnings.classList.remove('hidden');
                warningList.innerHTML = result.warnings.map(w => `• ${w}`).join('<br>');
            } else {
                scanWarnings.classList.add('hidden');
            }

        } else {
            statusIcon.textContent = '🛡️';
            statusTitle.textContent = 'Protected';
            statusTitle.style.color = '#22c55e';
            statusDesc.textContent = 'This website appears safe.';
            scanWarnings.classList.add('hidden');
        }
    }
    
    function resetStatus() {
        statusIcon.textContent = '🛡️';
        statusTitle.textContent = 'Ready to Scan';
        statusTitle.style.color = '#ededed';
        statusDesc.textContent = 'Click below to check this page.';
        scanWarnings.classList.add('hidden');
    }
    
    function displayError(msg) {
        statusIcon.textContent = '❌';
        statusTitle.textContent = 'Error';
        statusDesc.textContent = msg;
    }
});
