/*
  Project: SubTracker Pro
  Author: N H Padma Priya
  Year: 2025
*/
// Global variables
let currentUser = null;
let subscriptions = [];
let users = JSON.parse(localStorage.getItem('subtracker_users')) || {};
let notificationInterval;
let editingSubscriptionId = null;
let chartView = 'monthly'; // 'monthly' or 'yearly'
let chartInstance = null;

// Global variables for new features
let currentTheme = 'light';
let budgets = {};
let paymentMethods = [];
let customCategories = [];
let activeFilters = {};
let currentCalendarDate = new Date();

// DOM Elements
const welcomePage = document.getElementById('welcomePage');
const loginPage = document.getElementById('loginPage');
const signupPage = document.getElementById('signupPage');
const dashboard = document.getElementById('dashboard');
const subscriptionModal = document.getElementById('subscriptionModal');
const noSubscriptions = document.getElementById('noSubscriptions');
const subscriptionsTable = document.getElementById('subscriptionsTable');
const subscriptionsList = document.getElementById('subscriptionsList');
const userName = document.getElementById('userName');
const totalSubscriptions = document.getElementById('totalSubscriptions');
const monthlyCost = document.getElementById('monthlyCost');
const upcomingRenewals = document.getElementById('upcomingRenewals');
const categoryCount = document.getElementById('categoryCount');
const notification = document.getElementById('notification');
const notificationContent = document.getElementById('notificationContent');
const notificationBadge = document.getElementById('notificationBadge');
const modalTitle = document.getElementById('modalTitle');
const submitButtonText = document.getElementById('submitButtonText');
const subscriptionForm = document.getElementById('subscriptionForm');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const monthlyBtn = document.getElementById('monthlyBtn');
const yearlyBtn = document.getElementById('yearlyBtn');
const chartCenter = document.getElementById('chartCenter');

// Feature Pages
const exportFeaturePage = document.getElementById('exportFeaturePage');
const paymentFeaturePage = document.getElementById('paymentFeaturePage');
const shareFeaturePage = document.getElementById('shareFeaturePage');
const customFeaturePage = document.getElementById('customFeaturePage');

// Show Login Page
function showLoginPage() {
    welcomePage.classList.add('hidden');
    loginPage.classList.remove('hidden');
}

// Show Signup Page
function showSignupPage() {
    loginPage.classList.add('hidden');
    signupPage.classList.remove('hidden');
}

// Show Dashboard
function showDashboard() {
    loginPage.classList.add('hidden');
    signupPage.classList.add('hidden');
    hideFeaturePage();
    dashboard.classList.remove('hidden');
    updateDashboard();
    startNotificationChecker();
    initEnhancedFeatures();
}

// Hide Subscription Modal
function hideSubscriptionModal() {
    subscriptionModal.classList.remove('active');
    subscriptionForm.reset();
    editingSubscriptionId = null;
    modalTitle.textContent = 'Add New Subscription';
    submitButtonText.textContent = 'Add Subscription';
}

// Show Add Subscription Modal
function showAddSubscriptionModal() {
    editingSubscriptionId = null;
    modalTitle.textContent = 'Add New Subscription';
    submitButtonText.textContent = 'Add Subscription';
    document.getElementById('subscriptionId').value = '';
    subscriptionForm.reset();
    // Set today's date as default for renewal date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('renewalDate').value = today;
    document.getElementById('startDate').value = today;
    subscriptionModal.classList.add('active');
}

// Show Edit Subscription Modal
function showEditSubscriptionModal(index) {
    const subscription = subscriptions[index];
    editingSubscriptionId = index;
    modalTitle.textContent = 'Edit Subscription';
    submitButtonText.textContent = 'Update Subscription';
    
    document.getElementById('subscriptionId').value = subscription.id;
    document.getElementById('subscriptionName').value = subscription.name;
    document.getElementById('companyName').value = subscription.company || '';
    document.getElementById('subscriptionPrice').value = subscription.price;
    document.getElementById('currency').value = subscription.currency;
    document.getElementById('paymentFrequency').value = subscription.frequency;
    document.getElementById('startDate').value = subscription.startDate || '';
    document.getElementById('renewalDate').value = subscription.renewalDate;
    document.getElementById('category').value = subscription.category;
    document.getElementById('notes').value = subscription.notes || '';
    
    subscriptionModal.classList.add('active');
}

// Close Notification
function closeNotification() {
    notification.classList.remove('show');
}

// Show Notification
function showNotification(message) {
    notificationContent.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Logout
function logout() {
    currentUser = null;
    subscriptions = [];
    clearInterval(notificationInterval);
    if (chartInstance) {
        chartInstance.destroy();
    }
    hideFeaturePage();
    dashboard.classList.add('hidden');
    welcomePage.classList.remove('hidden');
    hideSubscriptionModal();
}

// Show Feature Page
function showFeaturePage(feature) {
    dashboard.classList.add('hidden');
    switch(feature) {
        case 'export':
            exportFeaturePage.classList.remove('hidden');
            break;
        case 'payment':
            paymentFeaturePage.classList.remove('hidden');
            break;
        case 'share':
            shareFeaturePage.classList.remove('hidden');
            break;
        case 'custom':
            customFeaturePage.classList.remove('hidden');
            break;
    }
}

// Hide Feature Page
function hideFeaturePage() {
    exportFeaturePage.classList.add('hidden');
    paymentFeaturePage.classList.add('hidden');
    shareFeaturePage.classList.add('hidden');
    customFeaturePage.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

// Feature Page Functions
function exportFeatureData(format) {
    if (format && format.toLowerCase() === 'csv') {
        exportSubscriptionsToCSV();
    } else if (format && format.toLowerCase() === 'pdf') {
        exportSubscriptionsToPDF();
    } else {
        exportSubscriptionsToCSV();
    }
}

function showPaymentHistory() {
    // If the modal isn't in the DOM yet, at least navigate to the Payment feature page
    const modal = document.getElementById('paymentHistoryModal');
    if (!modal) {
        showFeaturePage('payment');
        return;
    }

    const rangeSelect = document.getElementById('paymentHistoryRange');
    if (rangeSelect) {
        // Set default range if not set
        if (!rangeSelect.value) rangeSelect.value = '6';
        renderPaymentHistory(parseInt(rangeSelect.value, 10) || 6);
        // Bind change handler (overwrite to avoid duplicates if reopened)
        rangeSelect.onchange = function() {
            renderPaymentHistory(parseInt(this.value, 10) || 6);
        };
    } else {
        // Fallback render with default range
        renderPaymentHistory(6);
    }

    modal.classList.add('active');
}

function hidePaymentHistoryModal() {
    const modal = document.getElementById('paymentHistoryModal');
    if (modal) modal.classList.remove('active');
}

function generatePaymentHistory(limitMonths) {
    const now = new Date();
    const from = new Date(now);
    from.setMonth(from.getMonth() - (limitMonths - 1));
    const history = [];

    subscriptions.forEach(sub => {
        const currency = sub.currency || '₹';
        const amount = Number(sub.price || 0);
        let start = sub.startDate ? new Date(sub.startDate) : (sub.renewalDate ? new Date(sub.renewalDate) : null);
        if (!start || isNaN(start.getTime())) return;

        if (sub.frequency === 'monthly') {
            // Move to first occurrence within the range
            let cur = new Date(start);
            while (cur < from) {
                cur.setMonth(cur.getMonth() + 1);
            }
            while (cur <= now) {
                history.push({ date: new Date(cur), name: sub.name, amount, currency, status: 'Completed' });
                cur.setMonth(cur.getMonth() + 1);
            }
        } else if (sub.frequency === 'yearly') {
            let cur = new Date(start);
            while (cur <= now) {
                if (cur >= from) {
                    history.push({ date: new Date(cur), name: sub.name, amount, currency, status: 'Completed' });
                }
                cur.setFullYear(cur.getFullYear() + 1);
            }
        }
    });

    // Sort by date desc
    history.sort((a, b) => b.date - a.date);
    return history;
}

function renderPaymentHistory(limitMonths) {
    const tbody = document.getElementById('paymentHistoryList');
    if (!tbody) return;
    const rows = generatePaymentHistory(limitMonths);

    if (rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; padding: 20px; color: #64748b;">
                    No payments found for the selected range.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = rows.map(item => `
        <tr>
            <td>${new Date(item.date).toLocaleDateString()}</td>
            <td>${escapeHtml(item.name || '')}</td>
            <td>${escapeHtml(item.currency)}${Number(item.amount || 0).toFixed(2)}</td>
            <td>${escapeHtml(item.status)}</td>
        </tr>
    `).join('');
}

function shareReport() {
    // Open the Share modal to present options (Email, Link, Print)
    showShareModal();
    // Optionally pre-generate a share link for convenience. Uncomment if desired.
    // generateShareLink();
}

function manageCategories() {
    // Open the category management modal
    showCategoryModal();
}

// Calculate category spending
function calculateCategorySpending() {
    const categorySpending = {};
    subscriptions.forEach(sub => {
        if (!categorySpending[sub.category]) {
            categorySpending[sub.category] = 0;
        }
        if (chartView === 'monthly') {
            if (sub.frequency === 'monthly') {
                categorySpending[sub.category] += sub.price;
            } else if (sub.frequency === 'yearly') {
                categorySpending[sub.category] += sub.price / 12;
            }
        } else {
            if (sub.frequency === 'monthly') {
                categorySpending[sub.category] += sub.price * 12;
            } else if (sub.frequency === 'yearly') {
                categorySpending[sub.category] += sub.price;
            }
        }
    });
    return categorySpending;
}

// Render pie chart
function renderPieChart() {
    const categorySpending = calculateCategorySpending();
    const canvas = document.getElementById('categoryChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate total
    const total = Object.values(categorySpending).reduce((sum, val) => sum + val, 0);
    chartCenter.textContent = `₹${total.toFixed(0)}`;
    
    if (total === 0) {
        // Draw empty chart
        ctx.beginPath();
        ctx.arc(125, 125, 100, 0, 2 * Math.PI);
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
    }
    
    // Color resolver for categories (supports custom categories)
    const getColor = getCategoryColor;
    
    let currentAngle = -Math.PI / 2; // Start from top
    
    Object.entries(categorySpending).forEach(([category, amount]) => {
        const percentage = (amount / total) * 100;
        const angle = (percentage / 100) * 2 * Math.PI;
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(125, 125);
        ctx.arc(125, 125, 100, currentAngle, currentAngle + angle);
        ctx.closePath();
        ctx.fillStyle = getColor(category);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += angle;
    });
}

// Render category breakdown
function renderCategoryBreakdown() {
    const categorySpending = calculateCategorySpending();
    const breakdownContainer = document.getElementById('categoryBreakdown');
    breakdownContainer.innerHTML = '';
    
    Object.entries(categorySpending).forEach(([category, amount]) => {
        const color = getCategoryColor(category);
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <div class="category-info">
                <div class="category-color" style="background: ${color};"></div>
                <span class="category-name">${category}</span>
            </div>
            <span class="category-amount">₹${amount.toFixed(2)}</span>
        `;
        breakdownContainer.appendChild(item);
    });
}

// Filter and sort subscriptions
function filterAndSortSubscriptions() {
    let filteredSubscriptions = [...subscriptions];
    
    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredSubscriptions = filteredSubscriptions.filter(sub => 
            sub.name.toLowerCase().includes(searchTerm) ||
            (sub.company && sub.company.toLowerCase().includes(searchTerm)) ||
            sub.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    const categoryFilterValue = categoryFilter.value;
    if (categoryFilterValue) {
        filteredSubscriptions = filteredSubscriptions.filter(sub => 
            sub.category === categoryFilterValue
        );
    }
    
    // Apply advanced filters
    if (activeFilters.price) {
        filteredSubscriptions = filteredSubscriptions.filter(sub => {
            return activeFilters.price.some(priceRange => {
                if (priceRange === '0-500') return sub.price <= 500;
                if (priceRange === '500-1000') return sub.price > 500 && sub.price <= 1000;
                if (priceRange === '1000+') return sub.price > 1000;
                return true;
            });
        });
    }
    
    if (activeFilters.renewal) {
        const today = new Date();
        filteredSubscriptions = filteredSubscriptions.filter(sub => {
            const renewalDate = new Date(sub.renewalDate);
            const diffTime = renewalDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return activeFilters.renewal.some(renewalFilter => {
                if (renewalFilter === '7') return diffDays <= 7 && diffDays >= 0;
                if (renewalFilter === '30') return diffDays <= 30 && diffDays >= 0;
                if (renewalFilter === 'expired') return diffDays < 0;
                return true;
            });
        });
    }
    
    if (activeFilters.frequency) {
        filteredSubscriptions = filteredSubscriptions.filter(sub => {
            return activeFilters.frequency.includes(sub.frequency);
        });
    }
    
    // Apply sorting
    const sortFilterValue = sortFilter.value;
    filteredSubscriptions.sort((a, b) => {
        switch (sortFilterValue) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'renewal':
                return new Date(a.renewalDate) - new Date(b.renewalDate);
            case 'cost':
                return b.price - a.price;
            default:
                return 0;
        }
    });
    
    return filteredSubscriptions;
}

// Update Dashboard
function updateDashboard() {
    if (currentUser) {
        userName.textContent = currentUser.username;
        // Load user subscriptions
        subscriptions = JSON.parse(localStorage.getItem(`subtracker_subscriptions_${currentUser.email}`)) || [];
    }

    // Update stats
    totalSubscriptions.textContent = subscriptions.length;
    
    // Calculate monthly cost
    let monthlyTotal = 0;
    subscriptions.forEach(sub => {
        if (sub.frequency === 'monthly') {
            monthlyTotal += sub.price;
        } else if (sub.frequency === 'yearly') {
            monthlyTotal += sub.price / 12;
        }
    });
    monthlyCost.textContent = `₹${monthlyTotal.toFixed(2)}`;

    // Calculate upcoming renewals
    const upcomingItems = listUpcomingRenewals(30);
    const upcomingCount = upcomingItems.length;
    upcomingRenewals.textContent = upcomingCount;
    notificationBadge.textContent = upcomingCount;

    // Calculate unique categories
    const categories = [...new Set(subscriptions.map(sub => sub.category))];
    categoryCount.textContent = categories.length;

    // Render charts
    renderPieChart();
    renderCategoryBreakdown();

    // Update subscriptions list
    if (subscriptions.length === 0) {
        noSubscriptions.classList.remove('hidden');
        subscriptionsTable.classList.add('hidden');
    } else {
        noSubscriptions.classList.add('hidden');
        subscriptionsTable.classList.remove('hidden');
        renderSubscriptions();
    }
    
    // Update budget display
    updateBudgetDisplay();
    
    // Render calendar
    renderCalendar();
}

// Render Subscriptions
function renderSubscriptions() {
    const filteredSubscriptions = filterAndSortSubscriptions();
    subscriptionsList.innerHTML = '';
    
    if (filteredSubscriptions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 40px; color: #64748b;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <h3>No subscriptions found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </td>
        `;
        subscriptionsList.appendChild(row);
        return;
    }
    
    filteredSubscriptions.forEach((sub, index) => {
        const originalIndex = subscriptions.indexOf(sub);
        const startDate = sub.startDate ? new Date(sub.startDate) : null;
        const renewalDate = new Date(sub.renewalDate);
        const today = new Date();
        const diffTime = renewalDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let daysLeftClass = 'days-left-safe';
        if (diffDays <= 7) {
            daysLeftClass = 'days-left-urgent';
        } else if (diffDays <= 30) {
            daysLeftClass = 'days-left-warning';
        }

        let categoryClass = `category-tag category-${sub.category.toLowerCase()}`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="subscription-name">${sub.name}</div>
                <div class="subscription-company">${sub.company || '-'}</div>
            </td>
            <td class="subscription-cost">${sub.currency}${sub.price}/${sub.frequency.slice(0,1)}</td>
            <td class="date-info">
                ${startDate ? `<div><span class="date-label">Start:</span> ${startDate.toLocaleDateString()}</div>` : ''}
                <div><span class="date-label">Renewal:</span> <span class="renewal-date">${renewalDate.toLocaleDateString()}</span></div>
                <div class="days-left ${daysLeftClass}">
                    ${diffDays > 0 ? `${diffDays} days left` : 'Renewal due'}
                </div>
            </td>
            <td><span class="${categoryClass}">${sub.category}</span></td>
            <td>
                <button class="action-btn edit-btn" onclick="showEditSubscriptionModal(${originalIndex})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteSubscription(${originalIndex})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        subscriptionsList.appendChild(row);
    });
}

// Delete Subscription
function deleteSubscription(index) {
    if (confirm('Are you sure you want to delete this subscription?')) {
        subscriptions.splice(index, 1);
        // Save to localStorage
        localStorage.setItem(`subtracker_subscriptions_${currentUser.email}`, JSON.stringify(subscriptions));
        updateDashboard();
        showNotification('Subscription deleted successfully!');
    }
}

// Date helpers for accurate local date comparisons
function parseLocalDate(value) {
    if (!value) return null;
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    if (typeof value === 'string') {
        const m = value.match(/^\d{4}-\d{2}-\d{2}$/);
        if (m) {
            const [y, mo, d] = value.split('-').map(Number);
            return new Date(y, (mo || 1) - 1, d || 1);
        }
    }
    const d = new Date(value);
    if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return null;
}
function daysDiffFromToday(targetDate) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = parseLocalDate(targetDate);
    if (!d) return NaN;
    return Math.round((d.getTime() - today.getTime()) / (1000*60*60*24));
}
function listUpcomingRenewals(withinDays = 30) {
    const items = [];
    subscriptions.forEach(sub => {
        const diffDays = daysDiffFromToday(sub.renewalDate);
        if (!isNaN(diffDays) && diffDays >= 0 && diffDays <= withinDays) {
            items.push({
                id: sub.id,
                name: sub.name,
                price: sub.price,
                currency: sub.currency || '₹',
                renewalDate: parseLocalDate(sub.renewalDate),
                diffDays
            });
        }
    });
    items.sort((a, b) => a.diffDays - b.diffDays || a.name.localeCompare(b.name));
    return items;
}

// Check for upcoming renewals
function checkUpcomingRenewals() {
    // Time-based reminders: 3 days before, 1 day before, and on the day
    let reminderCount = 0;
    subscriptions.forEach(sub => {
        const diffDays = daysDiffFromToday(sub.renewalDate);
        if (isNaN(diffDays)) return;
        if (diffDays === 3) {
            showNotification(`🔔 Reminder: Your ${sub.name} subscription renews in 3 days!`);
            reminderCount++;
        } else if (diffDays === 1) {
            showNotification(`🔔 Reminder: Your ${sub.name} subscription renews tomorrow!`);
            reminderCount++;
        } else if (diffDays === 0) {
            showNotification(`🔔 Reminder: Your ${sub.name} subscription renews today!`);
            reminderCount++;
        }
    });
    return reminderCount;
}

// Check all reminders manually
function checkAllReminders() {
    // Show a concise list of upcoming renewals within 30 days
    const upcoming = listUpcomingRenewals(30);
    if (upcoming.length === 0) {
        showNotification('No upcoming renewals found. All subscriptions are up to date!');
        return;
    }
    const summary = upcoming.slice(0, 5).map(item => {
        const dayStr = item.diffDays === 0 ? 'today' : (item.diffDays === 1 ? 'tomorrow' : `in ${item.diffDays} days`);
        return `${item.name} ${dayStr} (${item.renewalDate.toLocaleDateString()})`;
    }).join(' • ');
    const more = upcoming.length > 5 ? ` • +${upcoming.length - 5} more` : '';
    showNotification(`Upcoming renewals: ${summary}${more}`);
}

// Switch chart view
function switchChartView(view) {
    chartView = view;
    if (view === 'monthly') {
        monthlyBtn.classList.add('active');
        yearlyBtn.classList.remove('active');
    } else {
        monthlyBtn.classList.remove('active');
        yearlyBtn.classList.add('active');
    }
    updateDashboard();
}

// Start notification checker
function startNotificationChecker() {
    // Check immediately
    checkUpcomingRenewals();
    // Check every hour
    notificationInterval = setInterval(checkUpcomingRenewals, 3600000);
}

// Event Listeners
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginButton = document.getElementById('loginButtonText');
    
    // Show loading state
    loginButton.innerHTML = '<span class="loading"></span> Signing In...';
    
    // Simulate API call delay
    setTimeout(() => {
        // Check if user exists
        if (users[email] && users[email].password === password) {
            currentUser = {
                email: email,
                username: users[email].username
            };
            showDashboard();
            showNotification(`Welcome back, ${currentUser.username}!`);
        } else {
            alert('Invalid email or password');
        }
        loginButton.textContent = 'Sign In';
    }, 1000);
});

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const signupButton = document.getElementById('signupButtonText');
    
    // Show loading state
    signupButton.innerHTML = '<span class="loading"></span> Creating Account...';
    
    // Simulate API call delay
    setTimeout(() => {
        // Check if user already exists
        if (users[email]) {
            alert('User already exists. Please login.');
            showLoginPage();
            signupButton.textContent = 'Create Account';
            return;
        }
        
        // Create new user
        users[email] = {
            username: username,
            password: password
        };
        
        // Save to localStorage
        localStorage.setItem('subtracker_users', JSON.stringify(users));
        
        currentUser = {
            email: email,
            username: username
        };
        showDashboard();
        showNotification(`Welcome to SubTracker Pro, ${username}!`);
        signupButton.textContent = 'Create Account';
    }, 1000);
});

document.getElementById('subscriptionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const submitButton = document.querySelector('.btn-submit');
    const originalText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.innerHTML = '<span class="loading"></span> Saving...';
    
    setTimeout(() => {
        const subscription = {
            id: editingSubscriptionId !== null ? subscriptions[editingSubscriptionId].id : Date.now(),
            name: document.getElementById('subscriptionName').value,
            company: document.getElementById('companyName').value,
            price: parseFloat(document.getElementById('subscriptionPrice').value),
            currency: document.getElementById('currency').value,
            frequency: document.getElementById('paymentFrequency').value,
            startDate: document.getElementById('startDate').value,
            renewalDate: document.getElementById('renewalDate').value,
            category: document.getElementById('category').value,
            notes: document.getElementById('notes').value
        };

        if (editingSubscriptionId !== null) {
            // Update existing subscription
            subscriptions[editingSubscriptionId] = subscription;
            showNotification('Subscription updated successfully!');
        } else {
            // Add new subscription
            subscriptions.push(subscription);
            showNotification('Subscription added successfully!');
        }
        
        // Save to localStorage
        localStorage.setItem(`subtracker_subscriptions_${currentUser.email}`, JSON.stringify(subscriptions));
        updateDashboard();
        hideSubscriptionModal();
        submitButton.innerHTML = originalText;
    }, 800);
});

// Chart view buttons
monthlyBtn.addEventListener('click', () => switchChartView('monthly'));
yearlyBtn.addEventListener('click', () => switchChartView('yearly'));

// Search and filter event listeners
searchInput.addEventListener('input', updateDashboard);
categoryFilter.addEventListener('change', updateDashboard);
sortFilter.addEventListener('change', updateDashboard);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Apply persisted theme early (even before login)
    loadGlobalThemePreference();

    // Set today's date as default for renewal date
    const today = new Date().toISOString().split('T')[0];
    const renewalInput = document.getElementById('renewalDate');
    const startInput = document.getElementById('startDate');
    if (renewalInput) renewalInput.value = today;
    if (startInput) startInput.value = today;
    
    // Add keyboard shortcut for modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && subscriptionModal.classList.contains('active')) {
            hideSubscriptionModal();
        }
    });

    // Load shared data from URL if present
    try {
        const hash = window.location.hash || '';
        if (hash.startsWith('#share=')) {
            const encoded = hash.slice(7);
            const json = decodeURIComponent(escape(atob(encoded)));
            const payload = JSON.parse(json);
            if (payload && payload.data && Array.isArray(payload.data.subscriptions)) {
                const proceed = confirm('A shared subscription report was detected in the link. Do you want to load it into the app (it will not overwrite your existing data unless you save)?');
                if (proceed) {
                    subscriptions = payload.data.subscriptions;
                    updateDashboard();
                    showNotification('Shared report loaded into the app (not yet saved).');
                }
            }
        }
    } catch (_) {}
});

// Enhanced JavaScript for new features

// Initialize enhanced features
function initEnhancedFeatures() {
    loadUserPreferences();
    loadBudgets();
    loadPaymentMethods();
    loadCustomCategories();
    updateCategorySelectOptions();
    renderCalendar();
    setupFilterListeners();
}

// Theme Toggle Functionality
function applyTheme(theme) {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle ? themeToggle.querySelector('i') : null;
    if (theme === 'dark') {
        body.classList.add('dark-theme');
        if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
        currentTheme = 'dark';
    } else {
        body.classList.remove('dark-theme');
        if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
        currentTheme = 'light';
    }
}

function toggleTheme() {
    const next = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    // Save theme preference globally and per-user
    try { localStorage.setItem('subtracker_global_theme', next); } catch (_) {}
    if (currentUser) {
        const userPrefs = JSON.parse(localStorage.getItem(`subtracker_prefs_${currentUser.email}`)) || {};
        userPrefs.theme = next;
        localStorage.setItem(`subtracker_prefs_${currentUser.email}`, JSON.stringify(userPrefs));
    }
}

// Load user preferences
function loadUserPreferences() {
    if (currentUser) {
        const userPrefs = JSON.parse(localStorage.getItem(`subtracker_prefs_${currentUser.email}`)) || {};
        // Apply theme preference if set for user; otherwise keep global setting
        if (userPrefs.theme) {
            applyTheme(userPrefs.theme);
        }
    }
}

// Budget Management
function loadBudgets() {
    if (currentUser) {
        budgets = JSON.parse(localStorage.getItem(`subtracker_budgets_${currentUser.email}`)) || {};
        updateBudgetDisplay();
    }
}

function saveBudgets() {
    if (currentUser) {
        localStorage.setItem(`subtracker_budgets_${currentUser.email}`, JSON.stringify(budgets));
        updateBudgetDisplay();
    }
}

function updateBudgetDisplay() {
    // Calculate current spending by category
    const categorySpending = calculateCategorySpending();
    
    // Update progress bars and values
    const categories = ['Entertainment', 'Productivity', 'Education', 'Health', 'Utilities', 'Other'];
    
    categories.forEach(category => {
        const budget = budgets[category] || 0;
        const spending = categorySpending[category] || 0;
        const percentage = budget > 0 ? Math.min(100, (spending / budget) * 100) : 0;
        
        // Update progress bar
        const fillElement = document.getElementById(`${category.toLowerCase()}Fill`);
        if (fillElement) {
            fillElement.style.width = `${percentage}%`;
            
            // Update color based on percentage
            if (percentage < 60) {
                fillElement.className = 'progress-fill progress-safe';
            } else if (percentage < 90) {
                fillElement.className = 'progress-fill progress-warning';
            } else {
                fillElement.className = 'progress-fill progress-danger';
            }
        }
        
        // Update progress text
        const progressElement = document.getElementById(`${category.toLowerCase()}Progress`);
        if (progressElement) {
            progressElement.textContent = `₹${spending.toFixed(2)}/₹${budget.toFixed(2)}`;
        }
    });
    
    // Update budget stats
    const totalBudget = Object.values(budgets).reduce((sum, val) => sum + val, 0);
    const currentSpending = Object.values(categorySpending).reduce((sum, val) => sum + val, 0);
    const remainingBudget = totalBudget - currentSpending;
    
    document.getElementById('totalBudget').textContent = `₹${totalBudget.toFixed(2)}`;
    document.getElementById('currentSpending').textContent = `₹${currentSpending.toFixed(2)}`;
    document.getElementById('remainingBudget').textContent = `₹${remainingBudget.toFixed(2)}`;
    
    // Check for budget alerts
    checkBudgetAlerts();
}

function checkBudgetAlerts() {
    const categorySpending = calculateCategorySpending();
    
    Object.entries(budgets).forEach(([category, budget]) => {
        const spending = categorySpending[category] || 0;
        const percentage = budget > 0 ? (spending / budget) * 100 : 0;
        
        if (percentage >= 90 && percentage < 100) {
            showNotification(`⚠️ You've used ${percentage.toFixed(0)}% of your ${category} budget!`);
        } else if (percentage >= 100) {
            showNotification(`🚨 You've exceeded your ${category} budget by ${(percentage - 100).toFixed(0)}%!`);
        }
    });
}

// Payment Methods Management
function loadPaymentMethods() {
    if (currentUser) {
        paymentMethods = JSON.parse(localStorage.getItem(`subtracker_payment_methods_${currentUser.email}`)) || [];
        renderPaymentMethods();
    }
}

function savePaymentMethods() {
    if (currentUser) {
        localStorage.setItem(`subtracker_payment_methods_${currentUser.email}`, JSON.stringify(paymentMethods));
        renderPaymentMethods();
    }
}

function renderPaymentMethods() {
    const container = document.getElementById('paymentMethodsList');
    container.innerHTML = '';
    
    if (paymentMethods.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; width: 100%; color: #64748b;">
                <i class="fas fa-credit-card" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3>No payment methods added</h3>
                <p>Add your first payment method to get started</p>
            </div>
        `;
        return;
    }
    
    paymentMethods.forEach((method, index) => {
        const methodElement = document.createElement('div');
        methodElement.className = 'payment-method';
        
        let icon = 'fa-credit-card';
        if (method.type === 'paypal') icon = 'fa-paypal';
        if (method.type === 'bankTransfer') icon = 'fa-university';
        if (method.type === 'upi') icon = 'fa-mobile-alt';
        
        methodElement.innerHTML = `
            <div class="payment-method-header">
                <div class="payment-method-icon">
                    <i class="fab ${icon}"></i>
                </div>
                <h3 class="payment-method-name">${method.name}</h3>
            </div>
            <div class="payment-method-details">
                ${method.lastFour ? `•••• •••• •••• ${method.lastFour}` : ''}
                ${method.expiry ? ` | Expires ${method.expiry}` : ''}
            </div>
            <div class="payment-method-actions">
                <button class="action-btn edit-btn" onclick="editPaymentMethod(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deletePaymentMethod(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(methodElement);
    });
}

function editPaymentMethod(index) {
    const method = paymentMethods[index];
    document.getElementById('paymentType').value = method.type;
    document.getElementById('paymentName').value = method.name;
    document.getElementById('paymentLastFour').value = method.lastFour || '';
    document.getElementById('paymentExpiry').value = method.expiry || '';
    
    // Show modal and set up save handler
    const modal = document.getElementById('paymentMethodModal');
    modal.classList.add('active');
    
    // Update form submit handler
    const form = document.getElementById('paymentMethodForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        
        paymentMethods[index] = {
            type: document.getElementById('paymentType').value,
            name: document.getElementById('paymentName').value,
            lastFour: document.getElementById('paymentLastFour').value,
            expiry: document.getElementById('paymentExpiry').value
        };
        
        savePaymentMethods();
        hidePaymentMethodModal();
        showNotification('Payment method updated successfully!');
    };
}

function deletePaymentMethod(index) {
    if (confirm('Are you sure you want to delete this payment method?')) {
        paymentMethods.splice(index, 1);
        savePaymentMethods();
        showNotification('Payment method deleted successfully!');
    }
}

// Custom Categories Management
function getCategoryColor(categoryName) {
    const defaults = {
        'Entertainment': '#3b82f6',
        'Productivity': '#22c55e',
        'Education': '#a855f7',
        'Health': '#f43f5e',
        'Utilities': '#f59e0b',
        'Other': '#64748b'
    };
    const custom = customCategories.find(c => c.name === categoryName);
    return (custom && custom.color) || defaults[categoryName] || '#64748b';
}

function loadCustomCategories() {
    if (currentUser) {
        customCategories = JSON.parse(localStorage.getItem(`subtracker_custom_categories_${currentUser.email}`)) || [];
        renderCustomCategoriesList();
    }
}

function saveCustomCategories() {
    if (currentUser) {
        localStorage.setItem(`subtracker_custom_categories_${currentUser.email}`, JSON.stringify(customCategories));
        renderCustomCategoriesList();
        updateCategorySelectOptions();
        updateDashboard();
    }
}

function updateCategorySelectOptions() {
    const defaultCategories = ['Entertainment','Productivity','Education','Health','Utilities','Other'];

    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        const existing = new Set();
        // Rebuild options: defaults first
        categorySelect.innerHTML = '';
        defaultCategories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
            existing.add(cat);
        });
        // Add custom categories
        customCategories.forEach(cat => {
            if (!existing.has(cat.name)) {
                const opt = document.createElement('option');
                opt.value = cat.name;
                opt.textContent = cat.name;
                categorySelect.appendChild(opt);
            }
        });
    }

    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        // Preserve the first option "All Categories"
        const selected = categoryFilter.value;
        const first = categoryFilter.querySelector('option[value=""]');
        categoryFilter.innerHTML = '';
        if (first) categoryFilter.appendChild(first);
        else {
            const allOpt = document.createElement('option');
            allOpt.value = '';
            allOpt.textContent = 'All Categories';
            categoryFilter.appendChild(allOpt);
        }
        const existing = new Set();
        // Defaults
        defaultCategories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categoryFilter.appendChild(opt);
            existing.add(cat);
        });
        // Custom
        customCategories.forEach(cat => {
            if (!existing.has(cat.name)) {
                const opt = document.createElement('option');
                opt.value = cat.name;
                opt.textContent = cat.name;
                categoryFilter.appendChild(opt);
            }
        });
        // Restore selection if possible
        if ([...categoryFilter.options].some(o => o.value === selected)) categoryFilter.value = selected;
    }
}

function renderCustomCategoriesList() {
    const list = document.getElementById('customCategoriesList');
    if (!list) return;
    if (customCategories.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; color:#64748b; padding: 10px;">No custom categories yet.</div>
        `;
        return;
    }
    list.innerHTML = '';
    customCategories.forEach((cat, index) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.padding = '8px 0';
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="display:inline-block; width:16px; height:16px; border-radius:4px; background:${cat.color}; border:1px solid #e5e7eb;"></span>
                <strong>${escapeHtml(cat.name)}</strong>
            </div>
            <button class="action-btn delete-btn" title="Delete" onclick="deleteCustomCategory(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        list.appendChild(row);
    });
}

function deleteCustomCategory(index) {
    customCategories.splice(index, 1);
    saveCustomCategories();
    showNotification('Category deleted');
}

function showCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (!modal) return;
    renderCustomCategoriesList();
    modal.classList.add('active');
}

function hideCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (!modal) return;
    modal.classList.remove('active');
}

// Calendar View
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarTitle = document.getElementById('calendarTitle');
    
    // Set calendar title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    calendarTitle.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    
    // Clear previous calendar
    calendarGrid.innerHTML = '';
    
    // Add weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-weekday';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyElement);
    }
    
    // Add cells for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i;
        dayElement.appendChild(dayNumber);
        
        // Check for subscriptions renewing on this day
        const currentDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), i);
        const renewals = getRenewalsForDate(currentDate);
        
        // Add renewal events
        renewals.forEach(renewal => {
            const eventElement = document.createElement('div');
            eventElement.className = 'calendar-event';
            eventElement.textContent = renewal.name;
            eventElement.title = `${renewal.name} - ₹${renewal.price}`;
            eventElement.onclick = () => showSubscriptionDetails(renewal.id);
            dayElement.appendChild(eventElement);
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

function getRenewalsForDate(date) {
    return subscriptions.filter(sub => {
        const renewalDate = new Date(sub.renewalDate);
        return renewalDate.getDate() === date.getDate() && 
               renewalDate.getMonth() === date.getMonth() && 
               renewalDate.getFullYear() === date.getFullYear();
    });
}

function changeCalendarMonth(change) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + change);
    renderCalendar();
}

function showSubscriptionDetails(id) {
    const subscription = subscriptions.find(sub => sub.id === id);
    if (subscription) {
        // In a real app, you might show a detailed view modal
        alert(`Subscription: ${subscription.name}\nPrice: ${subscription.currency}${subscription.price}\nRenewal: ${new Date(subscription.renewalDate).toLocaleDateString()}`);
    }
}

// Filtering System
function setupFilterListeners() {
    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('active');
            
            const filterType = this.getAttribute('data-filter');
            const filterValue = this.getAttribute('data-value');
            
            if (this.classList.contains('active')) {
                if (!activeFilters[filterType]) {
                    activeFilters[filterType] = [];
                }
                activeFilters[filterType].push(filterValue);
            } else {
                if (activeFilters[filterType]) {
                    const index = activeFilters[filterType].indexOf(filterValue);
                    if (index > -1) {
                        activeFilters[filterType].splice(index, 1);
                    }
                }
            }
            
            applyFilters();
        });
    });
}

function applyFilters() {
    updateDashboard();
}

function clearAllFilters() {
    const activeOptions = document.querySelectorAll('.filter-option.active');
    activeOptions.forEach(option => option.classList.remove('active'));
    activeFilters = {};
    applyFilters();
}

// Import/Export Functions
function showImportModal() {
    document.getElementById('importModal').classList.add('active');
}

function hideImportModal() {
    document.getElementById('importModal').classList.remove('active');
}

function processImport() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file to import');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            const importOption = document.querySelector('input[name="importOption"]:checked').value;
            
            if (importOption === 'replace') {
                subscriptions = importData.subscriptions || [];
                budgets = importData.budgets || {};
                paymentMethods = importData.paymentMethods || [];
            } else {
                // Merge data
                subscriptions = [...subscriptions, ...(importData.subscriptions || [])];
                budgets = {...budgets, ...(importData.budgets || {})};
                paymentMethods = [...paymentMethods, ...(importData.paymentMethods || [])];
            }
            
            // Save imported data
            if (currentUser) {
                localStorage.setItem(`subtracker_subscriptions_${currentUser.email}`, JSON.stringify(subscriptions));
                localStorage.setItem(`subtracker_budgets_${currentUser.email}`, JSON.stringify(budgets));
                localStorage.setItem(`subtracker_payment_methods_${currentUser.email}`, JSON.stringify(paymentMethods));
            }
            
            updateDashboard();
            hideImportModal();
            showNotification('Data imported successfully!');
        } catch (error) {
            alert('Error parsing import file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function showExportModal() {
    // In a real app, this would show options for export format
    exportData();
}

function exportData(format) {
    const fmt = (format || '').toLowerCase();
    if (fmt === 'csv') {
        exportSubscriptionsToCSV();
        return;
    }
    if (fmt === 'pdf') {
        exportSubscriptionsToPDF();
        return;
    }
    // Default to JSON export for backups
    const exportDataObj = {
        subscriptions: subscriptions,
        budgets: budgets,
        paymentMethods: paymentMethods,
        exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(exportDataObj, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `subtracker_export_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showNotification('Backup exported successfully!');
}

// Backup Functions
function createBackup() {
    exportBackup();
}

function exportBackup() {
    exportData(); // Reuse the export function for local backup
}

function showSyncOptions() {
    try { localStorage.setItem('autoSyncEnabled', 'true'); } catch (e) {}
    showNotification('Auto-sync enabled.');
}

// Share Functions
function showShareModal() {
    document.getElementById('shareModal').classList.add('active');
}

function hideShareModal() {
    document.getElementById('shareModal').classList.remove('active');
    document.getElementById('shareLinkContainer').style.display = 'none';
}

function shareViaEmail() {
    const subs = getSubscriptionsForExport();
    const subject = 'SubTracker Pro: Subscription Report';
    const lines = [];
    lines.push('Here is my subscription report:');
    lines.push('');
    lines.push(`Total subscriptions: ${subs.length}`);
    let monthly = 0;
    subs.forEach(s => {
        monthly += s.frequency === 'yearly' ? Number(s.price||0)/12 : Number(s.price||0);
    });
    lines.push(`Estimated monthly cost: ₹${monthly.toFixed(2)}`);
    lines.push('');
    lines.push('Details:');
    const max = Math.min(50, subs.length);
    for (let i=0; i<max; i++) {
        const s = subs[i];
        lines.push(`- ${s.name || 'Unnamed'} • ${s.currency || ''}${Number(s.price||0).toFixed(2)} / ${s.frequency || ''} • Renewal: ${s.renewalDate || ''} • Category: ${s.category || ''}`);
    }
    if (subs.length > max) lines.push(`... and ${subs.length - max} more.`);
    const body = lines.join('\n');
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function generateShareLink() {
    const payload = {
        v: 1,
        generatedAt: new Date().toISOString(),
        data: {
            subscriptions: getSubscriptionsForExport()
        }
    };
    const json = JSON.stringify(payload);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    const base = window.location.origin + window.location.pathname;
    const shareLink = `${base}#share=${encoded}`;
    const input = document.getElementById('shareLinkInput');
    input.value = shareLink;
    document.getElementById('shareLinkContainer').style.display = 'block';
}

function copyShareLink() {
    const shareLinkInput = document.getElementById('shareLinkInput');
    const text = shareLinkInput.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copied to clipboard!');
        }).catch(() => {
            shareLinkInput.select();
            document.execCommand('copy');
            showNotification('Link copied to clipboard!');
        });
    } else {
        shareLinkInput.select();
        document.execCommand('copy');
        showNotification('Link copied to clipboard!');
    }
}

function printReport() {
    const subs = getSubscriptionsForExport();
    const html = buildReportHtml(subs, { title: 'Subscriptions Report (Printable)', includeSummary: true });
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { try { win.print(); } catch (e) {} }, 300);
}

// Modal Show/Hide Functions
function showBudgetModal() {
    // Pre-fill form with existing budget values
    Object.entries(budgets).forEach(([category, amount]) => {
        const input = document.getElementById(`${category.toLowerCase()}Budget`);
        if (input) input.value = amount;
    });
    
    document.getElementById('budgetModal').classList.add('active');
}

function hideBudgetModal() {
    document.getElementById('budgetModal').classList.remove('active');
}

function showPaymentMethodModal() {
    // Reset form
    document.getElementById('paymentMethodForm').reset();
    
    // Set up submit handler for new payment method
    const form = document.getElementById('paymentMethodForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        
        paymentMethods.push({
            type: document.getElementById('paymentType').value,
            name: document.getElementById('paymentName').value,
            lastFour: document.getElementById('paymentLastFour').value,
            expiry: document.getElementById('paymentExpiry').value
        });
        
        savePaymentMethods();
        hidePaymentMethodModal();
        showNotification('Payment method added successfully!');
    };
    
    document.getElementById('paymentMethodModal').classList.add('active');
}

function hidePaymentMethodModal() {
    document.getElementById('paymentMethodModal').classList.remove('active');
}

// Budget form submission
document.getElementById('budgetForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const categories = ['entertainment', 'productivity', 'education', 'health', 'utilities', 'other'];
    categories.forEach(category => {
        const value = parseFloat(document.getElementById(`${category}Budget`).value) || 0;
        budgets[category.charAt(0).toUpperCase() + category.slice(1)] = value;
    });
    
    saveBudgets();
    hideBudgetModal();
    showNotification('Budget settings saved successfully!');
});

// Category form submission
(function(){
    const form = document.getElementById('categoryForm');
    if (!form) return;
    form.addEventListener('submit', function(e){
        e.preventDefault();
        const nameInput = document.getElementById('categoryNameInput');
        const colorInput = document.getElementById('categoryColorInput');
        const name = (nameInput.value || '').trim();
        const color = colorInput.value || '#64748b';
        if (!name) { alert('Please enter a category name'); return; }
        if (['Entertainment','Productivity','Education','Health','Utilities','Other'].includes(name)) {
            alert('This default category already exists. Choose a different name.');
            return;
        }
        if (customCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            alert('Category already exists');
            return;
        }
        customCategories.push({ name, color });
        saveCustomCategories();
        nameInput.value = '';
        colorInput.value = '#64748b';
        showNotification('Category added');
    });
})();

// Add event listeners
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Helpers for Export
function getSubscriptionsForExport() {
    try {
        if (Array.isArray(subscriptions) && subscriptions.length) return subscriptions;
    } catch (_) {}
    try {
        if (currentUser) {
            const ls = localStorage.getItem(`subtracker_subscriptions_${currentUser.email}`);
            if (ls) return JSON.parse(ls);
        }
    } catch (_) {}
    return [];
}

function exportSubscriptionsToCSV() {
    const subs = getSubscriptionsForExport();
    const headers = ['Subscription','Company','Price','Currency','Frequency','Start Date','Renewal Date','Category','Notes'];
    const rows = subs.map(s => [
        s.name || '',
        s.company || '',
        s.price != null ? s.price : '',
        s.currency || '',
        s.frequency || '',
        s.startDate || '',
        s.renewalDate || '',
        s.category || '',
        (s.notes || '').toString().replace(/\n/g, ' ')
    ]);
    const csv = [headers].concat(rows)
        .map(r => r.map(field => {
            const f = (field == null ? '' : String(field));
            return /[",\n]/.test(f) ? '"' + f.replace(/"/g, '""') + '"' : f;
        }).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscriptions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function buildReportHtml(subs, opts = {}) {
    const title = (opts.title || 'Subscriptions Report');
    const generatedAt = new Date().toLocaleString();
    let monthlyTotal = 0;
    subs.forEach(s => {
        if (s.frequency === 'monthly') monthlyTotal += Number(s.price || 0);
        else if (s.frequency === 'yearly') monthlyTotal += Number(s.price || 0) / 12;
    });
    const style = `
        <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin-bottom: 4px; font-size: 22px; }
            .meta { margin-bottom: 16px; color: #374151; font-size: 12px; }
            .summary { margin: 12px 0 20px; padding: 10px 12px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; vertical-align: top; }
            th { background: #f3f4f6; text-align: left; }
        </style>`;
    const rows = subs.map(s => `
        <tr>
            <td>${escapeHtml(s.name || '')}</td>
            <td>${escapeHtml(s.company || '')}</td>
            <td>${escapeHtml(s.currency || '')} ${Number(s.price || 0).toFixed(2)}</td>
            <td>${escapeHtml(s.frequency || '')}</td>
            <td>${escapeHtml(s.startDate || '')}</td>
            <td>${escapeHtml(s.renewalDate || '')}</td>
            <td>${escapeHtml(s.category || '')}</td>
            <td>${escapeHtml((s.notes || '').toString())}</td>
        </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:#6b7280;padding:16px;">No subscriptions available.</td></tr>';
    return `
        <html><head><title>${escapeHtml(title)}</title>${style}</head><body>
            <h1>${escapeHtml(title)}</h1>
            <div class="meta">Generated at: ${escapeHtml(generatedAt)} • Total subscriptions: ${subs.length} • Monthly cost: ₹${monthlyTotal.toFixed(2)}</div>
            ${opts.includeSummary ? '' : ''}
            <table>
                <thead>
                    <tr>
                        <th>Subscription</th>
                        <th>Company</th>
                        <th>Price</th>
                        <th>Frequency</th>
                        <th>Start Date</th>
                        <th>Renewal Date</th>
                        <th>Category</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </body></html>`;
}

function exportSubscriptionsToPDF() {
    const subs = getSubscriptionsForExport();
    const html = buildReportHtml(subs, { title: 'Subscriptions Report', includeSummary: true });
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { try { win.print(); } catch (e) {} }, 300);
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
// Load user preferences
function loadGlobalThemePreference() {
    let theme = 'light';
    try {
        theme = localStorage.getItem('subtracker_global_theme') || 'light';
    } catch (_) {}
    applyTheme(theme);
}

// Initialize feature modules for Export, Payment History, Share Reports, and Custom Categories
if (typeof initializeFeatureModules === 'function') { try { initializeFeatureModules(); } catch (e) { console.warn('initializeFeatureModules error:', e); } }