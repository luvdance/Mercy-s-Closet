// --- Firebase Integration ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js"; // Import Firebase Storage

const firebaseConfig = {
    apiKey: "AIzaSyA3tUEHVe_y8BQ_3_16YsKlokc10qDox-8",
    authDomain: "mercy-s-closet-ceo-app.firebaseapp.com",
    projectId: "mercy-s-closet-ceo-app",
    storageBucket: "mercy-s-closet-ceo-app.appspot.com",
    messagingSenderId: "102114420195",
    appId: "1:102114420195:web:af33297eab51e9c0032cd6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

// --- Global Variables ---
const body = document.body;
const header = document.getElementById('mainHeader');
const navLinks = document.querySelectorAll('#navLinks .nav-link, #navLinksMobile .nav-link');
const label = document.querySelector('.form-check-label');
const title = document.getElementById('siteTitle');
const modeToggle = document.getElementById('modeToggle');
const hamburgerIcon = document.getElementById('hamburgerIcon');
const mobileMenu = document.getElementById('mobileMenu');
const heroCarousel = document.querySelector('#heroCarousel');
const cartToggleBtn = document.getElementById('cartToggleBtn');
const shoppingCart = document.getElementById('shoppingCart');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartCount = document.getElementById('cartCount');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotal = document.getElementById('cartTotal');
const floatingCartWrapper = document.getElementById('floatingCartWrapper');
const floatingCartToggleBtn = document.getElementById('floatingCartToggleBtn');
const floatingCartCount = document.getElementById('floatingCartCount');
const productModalElement = document.getElementById('productModal');
const modalProductImage = document.getElementById('modalProductImage');
const modalProductName = document.getElementById('modalProductName');
const modalPrevBtn = document.getElementById('modalPrevBtn');
const modalNextBtn = document.getElementById('modalNextBtn');
const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
const modalBody = document.querySelector('#productModal .modal-body');
const collectionFilter = document.getElementById('collectionFilter'); // ADDED: Global reference for the filter

let productModal;
if (productModalElement) {
    productModal = new bootstrap.Modal(productModalElement);
}

let cart = [];
let currentProducts = []; // Stores products for the currently viewed collection (for modal navigation)
let currentProductIndex = 0; // Index for modal navigation
let collectionsBsCarousel; // Bootstrap Carousel instance
const collectionsCarouselElement = document.getElementById('collectionsCarousel');

// --- Firebase Functions --
async function fetchProducts() {
    try {
        const appId = firebaseConfig.appId; // CORRECTED: Now always uses the correct appId from firebaseConfig

        console.log("Client-side appId being used (CORRECTED):", appId); 

        const productsCollectionPath = `artifacts/${appId}/public/data/products`;

        console.log("Client-side Firestore collection path (CORRECTED):", productsCollectionPath); 

        const q = query(collection(db, productsCollectionPath), orderBy("timestamp", "desc")); 

        const querySnapshot = await getDocs(q);
        
        console.log("Number of documents fetched from Firestore:", querySnapshot.docs.length); 
        if (querySnapshot.empty) {
            console.warn("No documents found in the specified Firestore collection path.");
        }

        const products = [];

        for (const doc of querySnapshot.docs) {
            const productData = doc.data();
            let imageUrl = productData.imageUrl; 

            products.push({
                id: doc.id,
                ...productData,
                imageUrl: imageUrl || 'https://via.placeholder.com/300x200?text=Image+Not+Found',
                collection: productData.category // ASSUMPTION: 'category' field in Firestore holds the collection name
            });
        }
        
        products.sort((a, b) => {
            if (a.timestamp && b.timestamp) {
                return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
            }
            return 0;
        });

        return groupByCollection(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        const carouselInner = document.querySelector('#collectionsCarousel .carousel-inner');
        if (carouselInner) {
            carouselInner.innerHTML = `
                <div class="carousel-item active">
                    <div class="row justify-content-center align-items-center py-4">
                        <div class="col-12 text-center">
                            <p class="mt-3 text-danger">Failed to load collections. Please try again later.</p>
                            <p class="text-muted small">Check your console for more details.</p>
                        </div>
                    </div>
                </div>
            `;
        }
        return {};
    }
}

function groupByCollection(products) {
    const collections = {};

    products.forEach(product => {
        // Use the 'collection' property (which we mapped from 'category' in fetchProducts)
        const collectionKey = product.collection || 'Uncategorized'; // Fallback if collection/category is missing
        if (!collections[collectionKey]) {
            collections[collectionKey] = [];
        }
        collections[collectionKey].push(product);
    });

    return collections;
}

// NEW: Function to populate the dropdown filter
function populateCollectionFilter(collections) {
    if (!collectionFilter) return;

    collectionFilter.innerHTML = '<option value="all">All Collections</option>'; 

    const collectionNames = Object.keys(collections).sort(); 

    collectionNames.forEach(name => {
        if (name !== 'Uncategorized') { 
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            collectionFilter.appendChild(option);
        }
    });
}


// ... (rest of your script.js code above renderProducts remains the same)

async function renderProducts() {
    const productsByCollection = await fetchProducts();
    const carouselInner = document.querySelector('#collectionsCarousel .carousel-inner');

    carouselInner.innerHTML = ''; // Clear existing content

    populateCollectionFilter(productsByCollection); // Populates the dropdown

    const collectionNames = Object.keys(productsByCollection);

    if (collectionNames.length === 0) { // If no collections found at all
        carouselInner.innerHTML = `
            <div class="carousel-item active">
                <div class="row justify-content-center align-items-center py-4">
                    <div class="col-12 text-center">
                        <p class="mt-3">No collections available currently.</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Step 1: Create a single array of ALL products for the "All Collections" view
        let allProducts = [];
        for (const collectionName in productsByCollection) {
            allProducts = allProducts.concat(productsByCollection[collectionName]);
        }
        // Ensure allProducts are sorted consistently (e.g., by timestamp)
        allProducts.sort((a, b) => {
            if (a.timestamp && b.timestamp) {
                return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
            }
            return 0;
        });

        // Step 2: Create the "All Collections" carousel item first
        const allCollectionsCarouselItem = document.createElement('div');
        allCollectionsCarouselItem.className = `carousel-item active`; // Make it active by default
        allCollectionsCarouselItem.dataset.collectionName = "all"; // Identifier for this "all" view

        allCollectionsCarouselItem.innerHTML = `
            <div class="row justify-content-center align-items-center py-4">
                <div class="col-12 mb-4 text-start">
                    <h3 class="collection-title-sub fw-bold text-dark">
                        <span class="collection-dash">-</span> 
                        <i class="fas fa-boxes me-2 purple-icon"></i> All Collections 
                        <span class="collection-dash">-</span>
                    </h3>
                </div>
                <div class="col-12">
                    <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4 collection-images" 
                        data-collection-name="all" data-mobile-limit="8">
                        ${allProducts.map(product => createProductCard(product)).join('')} 
                    </div>
                    ${allProducts.length > 8 ?
                        `<button class="btn btn-secondary mt-3 show-more-toggle-btn" 
                                data-collection-target="all" style="display: none;">
                            Show More <i class="fas fa-chevron-down"></i>
                        </button>` : ''}
                </div>
            </div>
        `;
        carouselInner.appendChild(allCollectionsCarouselItem);

        // Step 3: Now iterate through individual collections (start from the second item)
        let isFirst = false; // "All Collections" is now the first
        for (const [collectionName, products] of Object.entries(productsByCollection)) {
            // Skip 'Uncategorized' if you don't want a dedicated slide for it
            if (collectionName === 'Uncategorized' && products.length === 0) continue; 

            const carouselItem = document.createElement('div');
            carouselItem.className = `carousel-item`; // No 'active' class here
            carouselItem.dataset.collectionName = collectionName; 

            let productsHtml = '';
            if (products.length === 0) { 
                productsHtml = `<p class="text-center text-muted mt-3">No items available in ${collectionName} currently.</p>`;
            } else {
                productsHtml = products.map(product => createProductCard(product)).join('');
            }

            carouselItem.innerHTML = `
                <div class="row justify-content-center align-items-center py-4">
                    <div class="col-12 mb-4 text-start">
                        <h3 class="collection-title-sub fw-bold text-dark">
                            <span class="collection-dash">-</span> 
                            <i class="fas ${getCollectionIcon(collectionName)} me-2 purple-icon"></i>
                            ${collectionName} 
                            <span class="collection-dash">-</span>
                        </h3>
                    </div>
                    <div class="col-12">
                        <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4 collection-images" 
                            data-collection-name="${collectionName}" data-mobile-limit="8">
                            ${productsHtml} 
                        </div>
                        ${products.length > 8 ?
                            `<button class="btn btn-secondary mt-3 show-more-toggle-btn" 
                                    data-collection-target="${collectionName}" style="display: none;">
                                Show More <i class="fas fa-chevron-down"></i>
                            </button>` : ''}
                    </div>
                </div>
            `;

            carouselInner.appendChild(carouselItem);
        }
    }

    // Re-initialize Bootstrap Carousel after content is loaded
    if (collectionsBsCarousel) {
        collectionsBsCarousel.dispose(); 
    }
    if (collectionsCarouselElement) {
        collectionsBsCarousel = new bootstrap.Carousel(collectionsCarouselElement, {
            interval: false 
        });
        // Ensure the "All Collections" slide is shown initially
        collectionsBsCarousel.to(0);
    }

    applyMobileLimits(); 
    attachProductCardListeners(); 
}

function getCollectionIcon(collectionName) {
    const icons = {
        "Shoes": "fa-shoe-prints",
        "Bags": "fa-shopping-bag",
        "Luxury Pants": "fa-male",
        "Wristwatches": "fa-watch"
    };
    return icons[collectionName] || "fa-box";
}

function createProductCard(product) {
    console.log("Product data received by createProductCard:", product); 
    console.log("imageUrl for this product:", product.imageUrl); 
    return `
        <div class="col">
            <div class="card h-100 product-card" 
                data-product-id="${product.id}" 
                data-product-name="${product.name}" 
                data-product-img="${product.imageUrl}">
                <img src="${product.imageUrl}" 
                     class="card-img-top img-fluid rounded shadow-sm" 
                     alt="${product.name}"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Load+Error';">
                <div class="product-overlay">
                    <p class="product-name">${product.name}</p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-teal extend-btn" 
                                data-bs-toggle="modal" 
                                data-bs-target="#productModal">
                            <i class="fas fa-expand-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-teal add-to-cart-btn">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- Helper Functions ---
function isElementOutOfView(elementToMonitor) {
    if (!elementToMonitor) return true;
    const rect = elementToMonitor.getBoundingClientRect();
    return rect.bottom < 0;
}

function updateCartDisplay() {
    if (!cartItemsList) {
        console.warn("Element with ID 'cartItemsList' not found.");
        return;
    }

    cartItemsList.innerHTML = '';

    if (cart.length === 0) {
        cartItemsList.innerHTML = `
            <li class="list-group-item d-flex justify-content-between align-items-center text-muted">
                No items in cart.
            </li>
        `;
    } else {
        const groupedCart = cart.reduce((acc, item) => {
            acc[item.name] = (acc[item.name] || 0) + 1;
            return acc;
        }, {});

        for (const name in groupedCart) {
            const quantity = groupedCart[name];
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            listItem.innerHTML = `
                ${quantity} x ${name}
                <button class="btn btn-danger btn-sm remove-from-cart-btn" data-product-name="${name}">Remove</button>
            `;
            cartItemsList.appendChild(listItem);
        }
    }

    if (cartCount) cartCount.textContent = cart.length;
    if (cartTotal) cartTotal.textContent = cart.length;
    if (floatingCartCount) floatingCartCount.textContent = cart.length;
}

function addToCart(productName) {
    cart.push({ name: productName });
    updateCartDisplay();
    flashModalBody();
}

function removeFromCart(productNameToRemove) {
    const indexToRemove = cart.findIndex(item => item.name === productNameToRemove);
    if (indexToRemove > -1) {
        cart.splice(indexToRemove, 1);
    }
    updateCartDisplay();
}

function updateModalContent() {
    if (currentProducts.length > 0 && modalProductImage && modalProductName && modalAddToCartBtn) {
        const product = currentProducts[currentProductIndex];
        modalProductImage.src = product.imageUrl;
        modalProductName.textContent = product.name;
        modalAddToCartBtn.dataset.productName = product.name;
    }
}

function flashModalBody() {
    if (modalBody) {
        modalBody.classList.add('flash-success');
        setTimeout(() => {
            modalBody.classList.remove('flash-success');
        }, 500);
    }
}

function applyMobileLimits() {
    const isMobile = window.innerWidth <= 767.98;

    document.querySelectorAll('.collection-images').forEach(collectionContainer => {
        const products = Array.from(collectionContainer.querySelectorAll('.product-card'));
        const mobileLimit = parseInt(collectionContainer.dataset.mobileLimit || 8);
        const toggleButton = collectionContainer.nextElementSibling;

        if (!toggleButton || !toggleButton.classList.contains('show-more-toggle-btn')) {
            return;
        }

        if (products.length > mobileLimit) {
            if (isMobile) {
                products.forEach((productCard, index) => {
                    productCard.classList.toggle('d-none', index >= mobileLimit);
                });
                toggleButton.style.display = 'block';
                toggleButton.innerHTML = 'Show More <i class="fas fa-chevron-down"></i>';
                toggleButton.classList.remove('active');
            } else {
                products.forEach(productCard => {
                    productCard.classList.remove('d-none');
                });
                toggleButton.style.display = 'none';
            }
        } else {
            products.forEach(productCard => {
                productCard.classList.remove('d-none');
            });
            toggleButton.style.display = 'none';
        }
    });
}

// Function to attach event listeners to dynamically created product cards
function attachProductCardListeners() {
    if (productModalElement && productModal) {
        document.querySelectorAll('.extend-btn').forEach(button => {
            button.removeEventListener('click', handleExtendButtonClick); 
            button.addEventListener('click', handleExtendButtonClick);
        });
    }

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.removeEventListener('click', handleAddToCartButtonClick); 
        button.addEventListener('click', handleAddToCartButtonClick);
    });

    document.querySelectorAll('.show-more-toggle-btn').forEach(button => {
        button.removeEventListener('click', handleShowMoreToggleClick); 
        button.addEventListener('click', handleShowMoreToggleClick);
    });
}

// Handlers for event delegation on dynamically created elements
function handleExtendButtonClick(e) {
    const productCard = e.target.closest('.product-card');
    const collectionRow = e.target.closest('.collection-images');

    if (productCard && collectionRow) {
        currentProducts = Array.from(collectionRow.querySelectorAll('.product-card')).map(card => ({
            id: card.dataset.productId,
            name: card.dataset.productName,
            imageUrl: card.dataset.productImg
        }));

        currentProductIndex = currentProducts.findIndex(p => p.id === productCard.dataset.productId);
        updateModalContent();
        productModal.show();
    }
}

function handleAddToCartButtonClick(e) {
    const targetButton = e.target.closest('.add-to-cart-btn');
    let productName = targetButton.dataset.productName;

    if (!productName) {
        const productCard = targetButton.closest('.product-card');
        if (productCard) {
            productName = productCard.dataset.productName;
        }
    }

    if (productName) {
        addToCart(productName);
    }
}

function handleShowMoreToggleClick() {
    const collectionContainer = this.previousElementSibling;
    if (!collectionContainer || !collectionContainer.classList.contains('collection-images')) return;

    const products = Array.from(collectionContainer.querySelectorAll('.product-card'));
    const mobileLimit = parseInt(collectionContainer.dataset.mobileLimit || 8);
    const isShowingAll = products.length > mobileLimit && !products[mobileLimit].classList.contains('d-none');

    if (isShowingAll) {
        for (let i = mobileLimit; i < products.length; i++) {
            products[i].classList.add('d-none');
        }
        this.innerHTML = 'Show More <i class="fas fa-chevron-down"></i>';
        this.classList.remove('active');
    } else {
        for (let i = mobileLimit; i < products.length; i++) {
            products[i].classList.remove('d-none');
        }
        this.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
        this.classList.add('active');
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize products
    await renderProducts();

    // Dark Mode Toggle
    if (modeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            modeToggle.checked = true;
        }

        modeToggle.addEventListener('change', () => {
            body.classList.toggle('dark-mode');
            localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    }

    // Header Scroll Effect
    window.addEventListener('scroll', () => {
        if (header) {
            header.classList.toggle('fixed-top-scroll', window.scrollY > 50);
        }
    });

    // Mobile Menu Close on Outside Click
    window.addEventListener('click', function(e) {
        if (mobileMenu && !mobileMenu.contains(e.target) && !e.target.closest('#menuToggleBtn')) {
            const bsCollapse = bootstrap.Collapse.getInstance(mobileMenu);
            if (bsCollapse && mobileMenu.classList.contains('show')) {
                bsCollapse.hide();
            }
        }
    });

    // Hero Carousel
    let heroBsCarousel;
    if (heroCarousel) {
        heroBsCarousel = new bootstrap.Carousel(heroCarousel, {
            interval: 20000,
            ride: 'carousel',
            pause: false,
            wrap: true
        });

        // Hero carousel touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        heroCarousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        heroCarousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                heroBsCarousel.next();
            } else if (touchEndX > touchStartX + swipeThreshold) {
                heroBsCarousel.prev();
            }
        }
    }

    // Shopping Cart Functionality
    if (cartToggleBtn && shoppingCart && closeCartBtn) {
        cartToggleBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            shoppingCart.classList.toggle('show-cart');
        });

        closeCartBtn.addEventListener('click', () => {
            shoppingCart.classList.remove('show-cart');
        });

        document.addEventListener('click', (event) => {
            const isClickInsideMainCart = shoppingCart.contains(event.target);
            const isClickOnMainCartToggle = cartToggleBtn.contains(event.target);
            const isClickOnFloatingCartToggle = floatingCartToggleBtn ? floatingCartToggleBtn.contains(event.target) : false;

            if (!isClickInsideMainCart && !isClickOnMainCartToggle && !isClickOnFloatingCartToggle) {
                shoppingCart.classList.remove('show-cart');
            }
        });
    }

    // Remove from Cart - this is better handled by event delegation on a static parent
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-from-cart-btn')) {
            const productNameToRemove = e.target.dataset.productName;
            if (productNameToRemove) {
                removeFromCart(productNameToRemove);
            }
        }
    });

    // Checkout Button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            const groupedCart = cart.reduce((acc, item) => {
                acc[item.name] = (acc[item.name] || 0) + 1;
                return acc;
            }, {});

            let message = "Hello, I'd like to inquire about the following items from Mercy's Closet Luxe:\n\n";
            for (const name in groupedCart) {
                message += `${groupedCart[name]} x ${name}\n`;
            }
            message += "\nPlease let me know about their prices and availability. Thank you!";

            const phoneNumber = "2349015414195";
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

            window.open(whatsappUrl, '_blank');

            cart = [];
            updateCartDisplay();
            if (shoppingCart) {
                shoppingCart.classList.remove('show-cart');
            }
        });
    }

    // Modal navigation
    if (modalPrevBtn) {
        modalPrevBtn.addEventListener('click', () => {
            currentProductIndex = (currentProductIndex - 1 + currentProducts.length) % currentProducts.length;
            updateModalContent();
        });
    }

    if (modalNextBtn) {
        modalNextBtn.addEventListener('click', () => {
            // REMOVED: modalNextIndex = (currentProductIndex + 1) % currentProducts.length; // This line was a duplicate/error
            currentProductIndex = (currentProductIndex + 1) % currentProducts.length;
            updateModalContent();
        });
    }


    // Collection Filter
    if (collectionFilter) { // Check if filter exists
        collectionFilter.addEventListener('change', function() {
            const selectedCollection = this.value;
            if (collectionsBsCarousel) { // Ensure carousel is initialized
                if (selectedCollection === 'all') {
                    collectionsBsCarousel.to(0);
                } else {
                    const carouselItems = document.querySelectorAll('#collectionsCarousel .carousel-item');
                    let foundIndex = -1;

                    carouselItems.forEach((item, index) => {
                        if (item.getAttribute('data-collection-name') === selectedCollection) {
                            foundIndex = index;
                        }
                    });

                    if (foundIndex !== -1) {
                        collectionsBsCarousel.to(foundIndex);
                    } else {
                        // If selected collection not found (e.g., no items in it), default to showing all or first slide
                        collectionsBsCarousel.to(0); // Go to the first item (e.g., "All Collections" if you add one)
                    }
                }
            }
        });
    }


    // Floating Cart
    const elementToMonitor = heroCarousel || header;
    if (floatingCartWrapper && floatingCartToggleBtn && shoppingCart) {
        window.addEventListener('scroll', function() {
            if (isElementOutOfView(elementToMonitor)) {
                floatingCartWrapper.style.display = 'flex';
            } else {
                floatingCartWrapper.style.display = 'none';
                shoppingCart.classList.remove('show-cart');
            }
        });

        floatingCartToggleBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            shoppingCart.classList.toggle('show-cart');

            if (shoppingCart.classList.contains('show-cart')) {
                const floatingBtnRect = floatingCartToggleBtn.getBoundingClientRect();
                shoppingCart.style.position = 'fixed';
                shoppingCart.style.top = `${floatingBtnRect.bottom + 10}px`;
                shoppingCart.style.left = 'auto';
                shoppingCart.style.right = `${window.innerWidth - floatingBtnRect.right}px`;
            } else {
                shoppingCart.style.removeProperty('top');
                shoppingCart.style.removeProperty('left');
                shoppingCart.style.removeProperty('right');
                shoppingCart.style.removeProperty('position');
            }
        });

        if (elementToMonitor) {
            floatingCartWrapper.style.display = isElementOutOfView(elementToMonitor) ? 'flex' : 'none';
        }
    }

    // Scroll to Top Button
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const scrollThreshold = 300;

    function toggleScrollToTopButton() {
        if (scrollToTopBtn) {
            scrollToTopBtn.classList.toggle('show', window.scrollY > scrollThreshold);
        }
    }

    if (scrollToTopBtn) {
        window.addEventListener('scroll', toggleScrollToTopButton);
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        toggleScrollToTopButton();
    }

    // Footer Year
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // Map Toggle
    document.querySelectorAll('.toggleMapBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mapPreview = this.nextElementSibling;
            if (mapPreview && mapPreview.classList.contains('map-preview')) {
                mapPreview.classList.toggle('d-none');
            }
        });
    });

    // Initialize cart display
    updateCartDisplay();
});

// Window Resize Handler
window.addEventListener('resize', applyMobileLimits);
