const app = {
    state: {
        products: [
            { id: 1, name: 'Imidacloprid 25WP', brand: 'Bayer', price: 1500, stock: 50 },
            { id: 2, name: 'Glyphosate 48% SL', brand: 'Syngenta', price: 2200, stock: 5 },
            { id: 3, name: 'Lambda-Cyhalothrin', brand: 'Local', price: 800, stock: 120 },
            { id: 4, name: 'Urea Fertilizer', brand: 'Engro', price: 3400, stock: 200 },
            { id: 5, name: 'Emamectin Benzoate', brand: 'Suncrop', price: 1200, stock: 45 },
            { id: 6, name: 'Acetamiprid', brand: 'Target', price: 950, stock: 15 }
        ],
        cart: [],
        users: { role: 'admin' }
    },

    init: function () {
        console.log('App Initialized');
        this.renderInventory();
        this.renderBillingProducts(); // Initial list
    },

    navigate: function (viewId) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active', 'hidden'));
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));

        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }

        // Highlight Nav
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        // (Simple active state mock)
    },

    // --- Global Search ---
    handleGlobalSearch: function (query) {
        const resultsEl = document.getElementById('searchResults');
        if (!query) {
            resultsEl.classList.add('hidden');
            return;
        }
        const matches = this.state.products.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase())
        );
        if (matches.length > 0) {
            resultsEl.innerHTML = matches.map(p => `
                <div class="search-item" onclick="app.quickAddFromSearch(${p.id})">
                    <strong>${p.name}</strong> (${p.brand})<br>
                    <span style="color:green">Rs. ${p.price}</span> | Stock: ${p.stock}
                </div>
            `).join('');
            resultsEl.classList.remove('hidden');
        } else {
            resultsEl.classList.add('hidden');
        }
    },

    quickAddFromSearch: function (id) {
        this.navigate('billing');
        this.addToCart(id);
        document.getElementById('searchResults').classList.add('hidden');
        document.getElementById('globalSearch').value = '';
    },

    // --- Billing Module ---
    billingSearch: function (query) {
        this.renderBillingProducts(query);
    },

    renderBillingProducts: function (query = '') {
        const container = document.getElementById('billingProductList');
        if (!container) return;

        const filtered = this.state.products.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase())
        );

        container.innerHTML = filtered.map(p => `
            <div class="product-card" onclick="app.addToCart(${p.id})">
                <h4>${p.name}</h4>
                <div class="stock">${p.brand} (Qty: ${p.stock})</div>
                <div class="price">Rs. ${p.price}</div>
            </div>
        `).join('');
    },

    addToCart: function (productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) return;

        if (product.stock <= 0) {
            alert('Out of Stock!');
            return;
        }

        const existingItem = this.state.cart.find(item => item.id === productId);
        if (existingItem) {
            if (existingItem.qty < product.stock) {
                existingItem.qty++;
            } else {
                alert('Not enough stock!');
            }
        } else {
            this.state.cart.push({ ...product, qty: 1 });
        }
        this.renderCart();
    },

    removeFromCart: function (index) {
        this.state.cart.splice(index, 1);
        this.renderCart();
    },

    updateCartItem: function (index, newQty) {
        newQty = parseInt(newQty);
        if (newQty > 0) {
            // Basic stock check
            const item = this.state.cart[index];
            if (newQty <= item.stock) {
                this.state.cart[index].qty = newQty;
            } else {
                alert('Exceeds stock!');
                this.state.cart[index].qty = item.stock;
            }
        }
        this.renderCart();
    },

    clearCart: function () {
        if (confirm('Clear current invoice?')) {
            this.state.cart = [];
            this.renderCart();
        }
    },

    renderCart: function () {
        const tbody = document.getElementById('cartTableBody');
        let subtotal = 0;

        tbody.innerHTML = this.state.cart.map((item, index) => {
            const total = item.price * item.qty;
            subtotal += total;
            return `
                <tr>
                    <td>${item.name} <br><small>${item.brand}</small></td>
                    <td><input type="number" value="${item.qty}" min="1" style="width:50px" onchange="app.updateCartItem(${index}, this.value)"></td>
                    <td>${item.price}</td>
                    <td>${total}</td>
                    <td><button class="btn-sm" style="color:red;border:none;background:none" onclick="app.removeFromCart(${index})">X</button></td>
                </tr>
            `;
        }).join('');

        // Totals
        const discInput = document.getElementById('invDiscount');
        const discount = discInput ? (parseFloat(discInput.value) || 0) : 0;

        document.getElementById('invSubtotal').innerText = 'Rs. ' + subtotal;
        document.getElementById('invTotal').innerText = 'Rs. ' + (subtotal - discount);
    },

    updateCartTotals: function () {
        this.renderCart(); // Re-calculates totals
    },

    checkout: function () {
        if (this.state.cart.length === 0) return alert('Cart is empty!');
        const cust = document.getElementById('custName').value || 'Walk-in Customer';

        // Deduct Stock
        this.state.cart.forEach(cartItem => {
            const product = this.state.products.find(p => p.id === cartItem.id);
            if (product) product.stock -= cartItem.qty;
        });

        alert(`Invoice Generated for ${cust}!\nStock Updated.`);
        this.state.cart = [];
        this.renderCart();
        this.renderInventory(); // Update inventory view
        this.renderBillingProducts(); // Update billing list
        // In real app, window.print() would trigger a print view
    },

    // --- Inventory ---
    renderInventory: function () {
        const tbody = document.querySelector('#inventoryTable tbody');
        if (tbody) {
            tbody.innerHTML = this.state.products.map(p => `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.brand}</td>
                    <td>Local</td>
                    <td style="color:${p.stock < 10 ? 'red' : 'inherit'}; font-weight:${p.stock < 10 ? 'bold' : 'normal'}">
                        ${p.stock} ${p.stock < 10 ? '(!)' : ''}
                    </td>
                    <td>Rs. ${p.price}</td>
                    <td><button onclick="alert('Edit logic here')">Edit</button></td>
                </tr>
            `).join('');
        }
    }
};

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
    app.init();
    lucide.createIcons();
});
