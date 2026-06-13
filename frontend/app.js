// ─── THEME TOGGLE ─────────────────────────────────────────

function toggleTheme() {
    const body = document.body
    const btn = document.getElementById("theme-btn")
    if (body.classList.contains("light")) {
        body.classList.remove("light")
        btn.textContent = "☀️"
        localStorage.setItem("theme", "dark")
    } else {
        body.classList.add("light")
        btn.textContent = "🌙"
        localStorage.setItem("theme", "light")
    }
}

function loadTheme() {
    const saved = localStorage.getItem("theme")
    if (saved === "light") {
        document.body.classList.add("light")
        document.getElementById("theme-btn").textContent = "🌙"
    }
}

loadTheme()

const API = "https://default-granite-driveway.ngrok-free.dev"

// Why: ngrok free tier intercepts browser requests without this header
const HEADERS = { "ngrok-skip-browser-warning": "true" }

// ─── PANTRY ITEMS ───────────────────────────────────────────

async function getItems() {
    const response = await fetch(`${API}/items`, { headers: HEADERS })
    const items = await response.json()
    renderItems(items)
}

async function addItem() {
    const name = document.getElementById("name").value.trim()
    const quantity = document.getElementById("quantity").value
    const unit = document.getElementById("unit").value.trim()
    const expiry_date = document.getElementById("expiry_date").value
    const category = document.getElementById("category").value.trim()
    const is_fridge = document.getElementById("is_fridge").checked
    const min_quantity = document.getElementById("min_quantity").value || 1

    if (!name || !quantity || !unit || !category) {
        alert("Please fill all fields except expiry date and min quantity")
        return
    }

    const body = {
        name,
        quantity: parseInt(quantity),
        unit,
        category,
        expiry_date: expiry_date || null,
        is_fridge,
        min_quantity: parseInt(min_quantity)
    }

    await fetch(`${API}/items`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })

    document.getElementById("name").value = ""
    document.getElementById("quantity").value = ""
    document.getElementById("unit").value = ""
    document.getElementById("expiry_date").value = ""
    document.getElementById("category").value = ""
    document.getElementById("min_quantity").value = ""
    document.getElementById("is_fridge").checked = false

    getItems()
    getShoppingList()
}

async function deleteItem(id) {
    await fetch(`${API}/items/${id}`, { method: "DELETE", headers: HEADERS })
    getItems()
    getShoppingList()
}

// ─── EDIT ITEM MODAL ─────────────────────────────────────────

let currentEditId = null  // Why: store which item is being edited

function editItem(id, currentQuantity, currentExpiry) {
    currentEditId = id
    document.getElementById("edit-quantity").value = currentQuantity
    document.getElementById("edit-expiry").value = currentExpiry !== "null" ? currentExpiry : ""
    document.getElementById("edit-modal").classList.add("active")
    document.getElementById("edit-overlay").classList.add("active")
}

async function submitEdit() {
    const newQuantity = document.getElementById("edit-quantity").value
    const newExpiry = document.getElementById("edit-expiry").value

    if (!newQuantity) {
        alert("Quantity cannot be empty")
        return
    }

    await fetch(`${API}/items/${currentEditId}`, {
        method: "PUT",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({
            quantity: parseInt(newQuantity),
            expiry_date: newExpiry || null
        })
    })

    closeEditModal()
    getItems()
    getShoppingList()
}

function closeEditModal() {
    document.getElementById("edit-modal").classList.remove("active")
    document.getElementById("edit-overlay").classList.remove("active")
    currentEditId = null
}

function getExpiryStatus(expiry_date) {
    if (!expiry_date) return { label: "No expiry", cls: "no-expiry" }

    const today = new Date()
    const expiry = new Date(expiry_date)
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { label: `Expired ${Math.abs(diffDays)} days ago`, cls: "red" }
    if (diffDays <= 3) return { label: `Expires in ${diffDays} day(s) ⚠️`, cls: "red" }
    if (diffDays <= 7) return { label: `Expires in ${diffDays} days`, cls: "yellow" }
    return { label: `Expires in ${diffDays} days`, cls: "green" }
}

function renderItems(items) {
    const list = document.getElementById("items-list")

    if (items.length === 0) {
        list.innerHTML = `<div class="empty-state">No items in pantry yet.<br>Add something above!</div>`
        return
    }

    // sort items so red (expired/expiring soon) appear first, then yellow, then green
    const sorted = [...items].sort((a, b) => {
        const order = { red: 0, yellow: 1, green: 2, "no-expiry": 3 }
        const statusA = getExpiryStatus(a.expiry_date).cls
        const statusB = getExpiryStatus(b.expiry_date).cls
        return order[statusA] - order[statusB]
    })

    list.innerHTML = sorted.map(item => {
        const status = getExpiryStatus(item.expiry_date)
        return `
        <div class="item-card ${status.cls}">
            <div class="item-info">
                <h3>${item.name} ${item.is_fridge ? "❄️" : ""}</h3>
                <p>${item.quantity} ${item.unit} · ${item.category}</p>
                <p class="expiry-tag ${status.cls}">${status.label}</p>
            </div>
            <div class="action-btns">
                <button class="edit-btn" onclick="editItem(${item.id}, ${item.quantity}, '${item.expiry_date}')">✏️</button>
                <button class="delete-btn" onclick="deleteItem(${item.id})">🗑️</button>
            </div>
        </div>`
    }).join("")
}

// ─── SHOPPING LIST ───────────────────────────────────────────

async function getShoppingList() {
    const response = await fetch(`${API}/items/shopping`, { headers: HEADERS })
    const items = await response.json()
    const list = document.getElementById("shopping-list")

    if (items.length === 0) {
        list.innerHTML = `<div class="empty-state">Nothing to buy right now 👍</div>`
        return
    }

    list.innerHTML = items.map(item => `
        <div class="shopping-card">
            <div>
                <h3>${item.name}</h3>
                <p>${item.quantity} ${item.unit} · ${item.category}</p>
            </div>
            <span class="reason-tag">${item.reason}</span>
        </div>
    `).join("")
}

// ─── DRAWER ──────────────────────────────────────────────────

function openDrawer() {
    getShoppingList()
    document.getElementById("drawer").classList.add("active")
    document.getElementById("overlay").classList.add("active")
}

function closeDrawer() {
    document.getElementById("drawer").classList.remove("active")
    document.getElementById("overlay").classList.remove("active")
}

// ─── HOME RECIPES ────────────────────────────────────────────

async function addRecipe() {
    const name = document.getElementById("recipe-name").value.trim()
    const ingredients = document.getElementById("recipe-ingredients").value.trim()

    if (!name || !ingredients) {
        alert("Please fill both recipe name and ingredients")
        return
    }

    await fetch(`${API}/recipes`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ name, ingredients })
    })

    document.getElementById("recipe-name").value = ""
    document.getElementById("recipe-ingredients").value = ""

    alert(`Recipe "${name}" saved!`)
}

async function openCookModal() {
    document.getElementById("cook-modal").classList.add("active")
    document.getElementById("modal-overlay").classList.add("active")
    document.getElementById("suggestions-list").innerHTML = `<div class="empty-state">Loading your recipes... 🍳</div>`

    const [itemsRes, recipesRes] = await Promise.all([
        fetch(`${API}/items`, { headers: HEADERS }),
        fetch(`${API}/recipes`, { headers: HEADERS })
    ])

    const pantryItems = await itemsRes.json()
    const recipes = await recipesRes.json()

    if (recipes.length === 0) {
        document.getElementById("suggestions-list").innerHTML = `<div class="empty-state">No home recipes yet.<br>Add some from the drawer! 📖</div>`
        return
    }

    const pantryNames = pantryItems.map(i => i.name.toLowerCase().trim())

    document.getElementById("suggestions-list").innerHTML = recipes.map(recipe => {
        const ingredients = recipe.ingredients.split(",").map(i => i.trim())
        const available = ingredients.filter(i => pantryNames.includes(i.toLowerCase()))
        const missing = ingredients.filter(i => !pantryNames.includes(i.toLowerCase()))

        return `
        <div class="dish-card">
            <div class="dish-card-header">
                <h3>${recipe.name}</h3>
                <div class="recipe-actions">
                    <button class="edit-recipe-btn" onclick="editRecipe(${recipe.id}, '${recipe.name}', '${recipe.ingredients}')">✏️</button>
                    <button class="delete-recipe-btn" onclick="deleteRecipe(${recipe.id})">🗑️</button>
                </div>
            </div>
            <div>
                ${available.map(i => `<span class="ingredient-tag available">✓ ${i}</span>`).join("")}
                ${missing.map(i => `<span class="ingredient-tag missing">✗ ${i}</span>`).join("")}
            </div>
        </div>`
    }).join("")
}

async function deleteRecipe(id) {
    await fetch(`${API}/recipes/${id}`, { method: "DELETE", headers: HEADERS })
    openCookModal()
}

// ─── EDIT RECIPE MODAL ────────────────────────────────────────

let currentRecipeId = null  // Why: store which recipe is being edited

function editRecipe(id, currentName, currentIngredients) {
    currentRecipeId = id
    // prefill with current values
    document.getElementById("edit-recipe-name").value = currentName
    document.getElementById("edit-recipe-ingredients").value = currentIngredients
    // open modal
    document.getElementById("recipe-edit-modal").classList.add("active")
    document.getElementById("recipe-edit-overlay").classList.add("active")
}

async function submitRecipeEdit() {
    const newName = document.getElementById("edit-recipe-name").value.trim()
    const newIngredients = document.getElementById("edit-recipe-ingredients").value.trim()

    if (!newName || !newIngredients) {
        alert("Both fields are required")
        return
    }

    await fetch(`${API}/recipes/${currentRecipeId}`, {
        method: "PUT",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, ingredients: newIngredients })
    })

    closeRecipeEditModal()
    openCookModal()
}

function closeRecipeEditModal() {
    document.getElementById("recipe-edit-modal").classList.remove("active")
    document.getElementById("recipe-edit-overlay").classList.remove("active")
    currentRecipeId = null
}

function closeModal() {
    document.getElementById("cook-modal").classList.remove("active")
    document.getElementById("modal-overlay").classList.remove("active")
}

// ─── AI SUGGESTIONS ──────────────────────────────────────────

async function getSuggestions() {
    const container = document.getElementById("ai-suggestions-list")
    container.innerHTML = `<div class="empty-state">Asking AI... 🤔</div>`

    const response = await fetch(`${API}/suggest`, { headers: HEADERS })
    const dishes = await response.json()

    if (dishes.error) {
        container.innerHTML = `<div class="empty-state">Error: ${dishes.error}</div>`
        return
    }

    container.innerHTML = dishes.map(dish => `
        <div class="dish-card">
            <h3>${dish.dish}</h3>
            <div>
                ${dish.available.map(i => `<span class="ingredient-tag available">✓ ${i}</span>`).join("")}
                ${dish.missing.map(i => `<span class="ingredient-tag missing">✗ ${i}</span>`).join("")}
            </div>
        </div>
    `).join("")
}

// ─── INIT ────────────────────────────────────────────────────

getItems()
getShoppingList()

// Why: register service worker to enable PWA installation
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js")
            .then(() => console.log("Service worker registered"))
            .catch(err => console.log("Service worker failed:", err))
    })
}