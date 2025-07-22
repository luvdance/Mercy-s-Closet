// --- Global Variables (Declared at the top for broad accessibility) ---
const body = document.body;
const header = document.getElementById('mainHeader'); // Ensure this ID matches your main header
const navLinks = document.querySelectorAll('#navLinks .nav-link, #navLinksMobile .nav-link');
const label = document.querySelector('.form-check-label');
const title = document.getElementById('siteTitle');
const modeToggle = document.getElementById('modeToggle');
const hamburgerIcon = document.getElementById('hamburgerIcon');
const mobileMenu = document.getElementById('mobileMenu');
const heroCarousel = document.querySelector('#heroCarousel'); // Ensure this ID matches your hero section carousel

// --- Global Variables for Main Shopping Cart ---
const cartToggleBtn = document.getElementById('cartToggleBtn'); // Button in the header
const shoppingCart = document.getElementById('shoppingCart'); // The main cart dropdown
const closeCartBtn = document.getElementById('closeCartBtn'); // Close button for the main cart
const cartCount = document.getElementById('cartCount'); // Badge for main cart count
const cartItemsList = document.getElementById('cartItemsList'); // UL for cart items
const cartTotal = document.getElementById('cartTotal'); // Span for total items in cart

// --- Global Variables for Floating Cart (Wrapper and Button Only) ---
const floatingCartWrapper = document.getElementById('floatingCartWrapper'); // The wrapper for the floating button
const floatingCartToggleBtn = document.getElementById('floatingCartToggleBtn'); // The floating button itself
const floatingCartCount = document.getElementById('floatingCartCount'); // Badge for floating cart count

// --- Global Variables for Product Modal ---
const productModalElement = document.getElementById('productModal');
let productModal; // Will hold the Bootstrap Modal instance
if (productModalElement) {
    productModal = new bootstrap.Modal(productModalElement);
}
const modalProductImage = document.getElementById('modalProductImage');
const modalProductName = document.getElementById('modalProductName');
const modalPrevBtn = document.getElementById('modalPrevBtn');
const modalNextBtn = document.getElementById('modalNextBtn');
const modalAddToCartBtn = document.getElementById('modalAddToCartBtn'); // THIS IS THE KEY ELEMENT
const modalBody = document.querySelector('#productModal .modal-body'); // ⭐ NEW: Select the modal body for flashing


// --- Cart and Product Data Storage ---
let cart = []; // Stores items currently in the cart
let currentProducts = []; // Stores products for the currently viewed collection in the modal
let currentProductIndex = 0; // Current index in currentProducts array for modal navigation


// ---------------------------------------------------------------------

// --- Helper Functions ---

/**
 * Checks if a specific element (like header or hero) has scrolled completely out of the viewport.
 * The floating cart will show when this element is out of view.
 * @param {HTMLElement} elementToMonitor The element whose visibility determines the floating cart.
 * @returns {boolean} True if the element's bottom edge is above the viewport's top edge, false otherwise.
 */
function isElementOutOfView(elementToMonitor) {
    if (!elementToMonitor) {
        return true;
    }
    const rect = elementToMonitor.getBoundingClientRect();
    return rect.bottom < 0;
}


/**
 * Updates the display of items, total count, and quantity badges in both the main and floating carts.
 */
function updateCartDisplay() {
    if (!cartItemsList) {
        console.warn("Element with ID 'cartItemsList' not found. Cart items cannot be displayed.");
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
                <button class="btn btn-danger btn-sm remove-from-cart-btn" data-product-name="${name}" aria-label="Remove ${name} from cart">Remove</button>
            `;
            cartItemsList.appendChild(listItem);
        }
    }

    if (cartCount) {
        cartCount.textContent = cart.length;
    } else {
        console.warn("Element with ID 'cartCount' not found.");
    }

    if (cartTotal) {
        cartTotal.textContent = cart.length;
    } else {
        console.warn("Element with ID 'cartTotal' not found.");
    }

    if (floatingCartCount) {
        floatingCartCount.textContent = cart.length;
    } else {
        console.warn("Element with ID 'floatingCartCount' not found.");
    }
}

/**
 * Adds a product to the global cart array and updates the display.
 * @param {string} productName The name of the product to add.
 */
function addToCart(productName) {
    cart.push({ name: productName });
    updateCartDisplay();
    console.log(`Added "${productName}" to cart. Current cart:`, cart);
}

/**
 * Removes a specific instance of a product from the cart array and updates the display.
 * @param {string} productNameToRemove The name of the product to remove.
 */
function removeFromCart(productNameToRemove) {
    const indexToRemove = cart.findIndex(item => item.name === productNameToRemove);
    if (indexToRemove > -1) {
        cart.splice(indexToRemove, 1);
    }
    updateCartDisplay();
    console.log(`Removed "${productNameToRemove}" from cart. Current cart:`, cart);
}

/**
 * Updates the content (image, name, add-to-cart button data) of the product modal
 * based on the current product index.
 */
function updateModalContent() {
    if (currentProducts.length > 0 && modalProductImage && modalProductName && modalAddToCartBtn) {
        const product = currentProducts[currentProductIndex];
        modalProductImage.src = product.img;
        modalProductName.textContent = product.name;
        modalAddToCartBtn.dataset.productName = product.name;
        console.log(`Modal updated for: ${product.name}. Add to Cart button data-product-name set to: ${modalAddToCartBtn.dataset.productName}`);
    } else {
        console.warn("Modal elements or currentProducts array not ready for updateModalContent. Check IDs and product data.");
        if (!modalProductImage) console.warn("modalProductImage not found.");
        if (!modalProductName) console.warn("modalProductName not found.");
        if (!modalAddToCartBtn) console.warn("modalAddToCartBtn not found.");
        if (currentProducts.length === 0) console.warn("currentProducts is empty.");
    }
}

/**
 * ⭐ NEW FUNCTION: Triggers a green flash on the modal body.
 * This provides visual feedback when an item is added to the cart from the modal.
 */
function flashModalBody() {
    if (modalBody) {
        modalBody.classList.add('flash-success');
        // Remove the class after a short delay to create the "flash" effect
        setTimeout(() => {
            modalBody.classList.remove('flash-success');
        }, 500); // Flash for 0.5 seconds
    } else {
        console.warn("Modal body element not found for flash effect.");
    }
}


/**
 * Applies or removes mobile display limits for product collections based on screen width.
 * Also manages the "Show More/Less" buttons.
 */
function applyMobileLimits() {
    const isMobile = window.innerWidth <= 767.98; // Bootstrap's 'md' breakpoint

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
                    if (index >= mobileLimit) {
                        productCard.classList.add('d-none');
                    } else {
                        productCard.classList.remove('d-none');
                    }
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

// ---------------------------------------------------------------------

// =====================================================================
// ALL JAVASCRIPT CODE IS EXECUTED INSIDE THIS SINGLE `DOMContentLoaded` LISTENER
// This ensures the DOM is fully loaded before trying to access elements.
// =====================================================================
document.addEventListener('DOMContentLoaded', function() {

    // --- Dark Mode Toggle ---
    if (modeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            modeToggle.checked = true;
        } else {
            modeToggle.checked = false;
        }

        modeToggle.addEventListener('change', () => {
            body.classList.toggle('dark-mode');
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    } else {
        console.warn("Dark mode toggle element with ID 'modeToggle' not found.");
    }

    // --- Header Scroll Color Adjustment ---
    window.addEventListener('scroll', () => {
        if (header) {
            header.classList.toggle('fixed-top-scroll', window.scrollY > 50);
        } else {
            console.warn("Main header element with ID 'mainHeader' not found.");
        }
    });

    // --- Close Mobile Menu on Outside Click ---
    window.addEventListener('click', function (e) {
        if (mobileMenu && !mobileMenu.contains(e.target) && !e.target.closest('#menuToggleBtn')) {
            const bsCollapse = bootstrap.Collapse.getInstance(mobileMenu);
            if (bsCollapse && mobileMenu.classList.contains('show')) {
                bsCollapse.hide();
            }
        }
    });

    // --- Hero Carousel Setup and Subtitle Animation Reset ---
    let heroBsCarousel;
    function animateSubtitles() {
        document.querySelectorAll('#heroCarousel .hero-subtitle').forEach(p => {
            const textContentLength = p.textContent.length;
            p.style.animation = 'none';
            p.style.width = '0';
            void p.offsetWidth;
            p.style.animation = `typing 3s steps(${textContentLength}, end) infinite, blink 0.7s step-end infinite`;
        });
    }

    if (heroCarousel) {
        heroBsCarousel = new bootstrap.Carousel(heroCarousel, {
            interval: 20000,
            ride: 'carousel',
            pause: false,
            wrap: true
        });

        let touchStartX = 0;
        let touchEndX = 0;

        heroCarousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        heroCarousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, {passive: true});

        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                heroBsCarousel.next();
            } else if (touchEndX > touchStartX + swipeThreshold) {
                heroBsCarousel.prev();
            }
        }

        setTimeout(() => {
            animateSubtitles();
            heroBsCarousel.cycle();
        }, 10000);

        heroCarousel.addEventListener('slid.bs.carousel', animateSubtitles);
    } else {
        console.warn("Hero Carousel element with ID 'heroCarousel' not found.");
    }

    // Hero Carousel Navigation Buttons
    const heroNavButtons = document.querySelectorAll('.carousel-nav-buttons .btn');
    if (heroNavButtons.length > 0) {
        heroNavButtons.forEach(button => {
            const action = button.dataset.bsSlide;
            button.addEventListener('click', () => {
                if (!heroBsCarousel) return;
                if (action === 'next') heroBsCarousel.next();
                if (action === 'prev') heroBsCarousel.prev();
            });
        });
    } else {
        console.warn("Hero Carousel navigation buttons not found.");
    }

    // --- Collections Carousel Setup ---
    const collectionsCarouselElement = document.getElementById('collectionsCarousel');
    let collectionsBsCarousel;

    if (collectionsCarouselElement) {
        collectionsBsCarousel = new bootstrap.Carousel(collectionsCarouselElement, {
            interval: false,
            wrap: true
        });
    } else {
        console.warn("Collections Carousel element with ID 'collectionsCarousel' not found.");
    }

    // Collections Carousel Navigation Buttons
    const collectionsNavButtons = document.querySelectorAll('.collections-nav-buttons .btn');
    if (collectionsNavButtons.length > 0) {
        collectionsNavButtons.forEach(button => {
            const action = button.dataset.bsSlide;
            button.addEventListener('click', () => {
                if (!collectionsBsCarousel) return;
                if (action === 'next') collectionsBsCarousel.next();
                if (action === 'prev') collectionsBsCarousel.prev();
            });
        });
    } else {
        console.warn("Collections Carousel navigation buttons not found.");
    }

    // --- Main Shopping Cart Functionality Event Listeners ---
    if (cartToggleBtn && shoppingCart && closeCartBtn) {
        cartToggleBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            shoppingCart.classList.toggle('show-cart');

            shoppingCart.style.removeProperty('top');
            shoppingCart.style.removeProperty('left');
            shoppingCart.style.removeProperty('right');
            shoppingCart.style.removeProperty('position');
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
    } else {
        console.warn("Main cart elements (cartToggleBtn, shoppingCart, closeCartBtn) not found. Main cart functionality might be impaired.");
    }

    // --- Universal Add/Remove to Cart Buttons (Event Delegation) ---
    document.addEventListener('click', (e) => {
        // Handle "Add to Cart" clicks
        if (e.target.classList.contains('add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
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
                // ⭐ ADDITION HERE: Call flashModalBody only if the modal is currently open
                if (productModalElement && productModalElement.classList.contains('show')) {
                    flashModalBody(); // Trigger the green flash
                }
            } else {
                console.warn("Could not determine product name for 'add to cart' action. Data attribute missing.");
            }
        }

        // Handle "Remove from Cart" clicks
        if (e.target.classList.contains('remove-from-cart-btn')) {
            const productNameToRemove = e.target.dataset.productName;
            if (productNameToRemove) {
                removeFromCart(productNameToRemove);
            } else {
                console.warn("Could not determine product name for 'remove from cart' action.");
            }
        }
    });

    // --- Checkout Button - WhatsApp Integration ---
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
    } else {
        console.warn("Checkout button with ID 'checkoutBtn' not found.");
    }

    // --- Product Modal Functionality Event Listeners ---
    if (productModalElement && productModal) {
        document.querySelectorAll('.extend-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                const collectionRow = e.target.closest('.collection-images');

                if (productCard && collectionRow) {
                    currentProducts = Array.from(collectionRow.querySelectorAll('.product-card')).map(card => ({
                        id: card.dataset.productId,
                        name: card.dataset.productName,
                        img: card.dataset.productImg
                    }));

                    currentProductIndex = currentProducts.findIndex(p => p.id === productCard.dataset.productId);

                    updateModalContent();
                    productModal.show();
                } else {
                    console.warn("Could not find productCard or collectionRow for extend-btn click. Check HTML structure.");
                }
            });
        });

        if (modalPrevBtn) {
            modalPrevBtn.addEventListener('click', () => {
                currentProductIndex = (currentProductIndex - 1 + currentProducts.length) % currentProducts.length;
                updateModalContent();
            });
        }
        if (modalNextBtn) {
            modalNextBtn.addEventListener('click', () => {
                currentProductIndex = (currentProductIndex + 1) % currentProducts.length;
                updateModalContent();
            });
        }
    } else {
        console.warn("Product modal elements (productModalElement, modalProductImage, etc.) not found. Product modal functionality might be impaired.");
    }

    // --- "Show More/Less" Functionality for Product Collections (Mobile Only) ---
    document.querySelectorAll('.show-more-toggle-btn').forEach(button => {
        button.addEventListener('click', function() {
            const collectionContainer = this.previousElementSibling;

            if (!collectionContainer || !collectionContainer.classList.contains('collection-images')) {
                console.warn("Corresponding '.collection-images' container not found for Show More/Less button. Check HTML structure.");
                return;
            }

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
        });
    });

    applyMobileLimits();
    window.addEventListener('resize', applyMobileLimits);

    updateCartDisplay();

    // --- Scroll to Top Button Functionality ---
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const scrollThreshold = 300;

    function toggleScrollToTopButton() {
        if (scrollToTopBtn) {
            if (window.scrollY > scrollThreshold) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        }
    }

    if (scrollToTopBtn) {
        window.addEventListener('scroll', toggleScrollToTopButton);
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        toggleScrollToTopButton();
    } else {
        console.warn("Scroll to Top button with ID 'scrollToTopBtn' not found.");
    }

    // --- Footer Functionality ---
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    document.querySelectorAll('.footer-link[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    document.querySelectorAll('.toggleMapBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mapPreview = this.nextElementSibling;
            if (mapPreview && mapPreview.classList.contains('map-preview')) {
                mapPreview.classList.toggle('d-none');
            }
        });
    });

    // --- Collection Filter and Carousel Synchronization ---
    const collectionFilter = document.getElementById('collectionFilter');
    const mainCollectionsCarouselElement = document.getElementById('collectionsCarousel');
    const mainCarouselItems = document.querySelectorAll('#collectionsCarousel .carousel-item');

    let mainCollectionsBsCarousel;
    if (mainCollectionsCarouselElement) {
        mainCollectionsBsCarousel = new bootstrap.Carousel(mainCollectionsCarouselElement, {
            interval: false
        });
    }

    if (collectionFilter && mainCollectionsBsCarousel) {
        collectionFilter.addEventListener('change', function() {
            const selectedCollection = this.value;
            if (selectedCollection === 'all') {
                mainCollectionsBsCarousel.to(0);
            } else {
                let foundIndex = -1;
                mainCarouselItems.forEach((item, index) => {
                    if (item.getAttribute('data-collection-name') === selectedCollection) {
                        foundIndex = index;
                    }
                });
                if (foundIndex !== -1) {
                    mainCollectionsBsCarousel.to(foundIndex);
                } else {
                    mainCollectionsBsCarousel.to(0);
                    console.warn(`Collection "${selectedCollection}" not found in carousel. Defaulting to first slide.`);
                }
            }
            applyMobileLimits();
        });
    } else {
        console.warn("Collection filter or carousel elements not found. Collection filtering might be impaired.");
    }

    // --- Floating Cart Wrapper Scroll and Button Logic ---
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
            if (isElementOutOfView(elementToMonitor)) {
                 floatingCartWrapper.style.display = 'flex';
            } else {
                 floatingCartWrapper.style.display = 'none';
            }
        }

    } else {
        console.warn("Floating cart elements or main shopping cart not found. Floating cart functionality might be impaired. Check IDs: 'floatingCartWrapper', 'floatingCartToggleBtn', 'shoppingCart', 'mainHeader', 'heroCarousel'.");
    }

}); // End of the ONE and ONLY DOMContentLoaded listener

