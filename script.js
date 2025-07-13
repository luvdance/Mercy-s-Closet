const body = document.body;
const header = document.getElementById('mainHeader');
const navLinks = document.querySelectorAll('#navLinks .nav-link, #navLinksMobile .nav-link');
const label = document.querySelector('.form-check-label');
const title = document.getElementById('siteTitle');
const modeToggle = document.getElementById('modeToggle');
const hamburgerIcon = document.getElementById('hamburgerIcon');
const mobileMenu = document.getElementById('mobileMenu');
const heroCarousel = document.querySelector('#heroCarousel');

// --- Global Variables for Cart (Moved to top for clarity and single definition) ---
const cartToggleBtn = document.getElementById('cartToggleBtn');
const shoppingCart = document.getElementById('shoppingCart');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartCount = document.getElementById('cartCount');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotal = document.getElementById('cartTotal');
const modalAddToCartBtn = document.getElementById('modalAddToCartBtn'); // For modal

let cart = []; // Initialize cart array globally

// --- Global Variables for Product Modal (Moved to top for clarity and single definition) ---
const productModalElement = document.getElementById('productModal');
// Check if productModalElement exists before initializing Bootstrap Modal
let productModal;
if (productModalElement) {
    productModal = new bootstrap.Modal(productModalElement);
}
const modalProductImage = document.getElementById('modalProductImage');
const modalProductName = document.getElementById('modalProductName');
const modalPrevBtn = document.getElementById('modalPrevBtn');
const modalNextBtn = document.getElementById('modalNextBtn');

let currentProducts = []; // Stores products for the current collection
let currentProductIndex = 0; // Current index in currentProducts array


// --- Functions for Cart Functionality (Defined once) ---
function updateCartDisplay() {
    if (!cartItemsList) { // Added null check
        console.warn("cartItemsList element not found.");
        return;
    }
    cartItemsList.innerHTML = ''; // Clear current items

    if (cart.length === 0) {
        cartItemsList.innerHTML = '<li class="list-group-item d-flex justify-content-between align-items-center">No items in cart.</li>';
    } else {
        // Group items by name and count quantities
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
    if (cartCount) cartCount.textContent = cart.length; // Added null check
    if (cartTotal) cartTotal.textContent = cart.length; // Update total items count (Added null check)
}

function addToCart(productName) {
    cart.push({ name: productName });
    updateCartDisplay();
}

function removeFromCart(productNameToRemove) {
    const indexToRemove = cart.findIndex(item => item.name === productNameToRemove);
    if (indexToRemove > -1) {
        cart.splice(indexToRemove, 1);
    }
    updateCartDisplay();
}

// --- Function for Product Modal Content ---
function updateModalContent() {
    if (currentProducts.length > 0 && modalProductImage && modalProductName && modalAddToCartBtn) { // Added null checks
        const product = currentProducts[currentProductIndex];
        modalProductImage.src = product.img;
        modalProductName.textContent = product.name;
        // Set data attributes on the add to cart button in the modal
        modalAddToCartBtn.dataset.productName = product.name;
    }
}

// --- "Show More" Functionality for All Collections (Mobile Only) ---
function applyMobileLimits() {
    const isMobile = window.innerWidth <= 767.98; // Bootstrap's 'md' breakpoint

    document.querySelectorAll('.collection-images').forEach(collectionContainer => {
        const products = Array.from(collectionContainer.querySelectorAll('.product-card'));
        const mobileLimit = parseInt(collectionContainer.dataset.mobileLimit || 8);
        const toggleButton = collectionContainer.nextElementSibling; // Assuming button is the next sibling

        // Basic validation for the toggle button
        if (!toggleButton || !toggleButton.classList.contains('show-more-toggle-btn')) {
            console.warn('Show More Toggle Button not found for collection:', collectionContainer.dataset.collectionName || 'Unnamed Collection');
            return;
        }

        if (products.length > mobileLimit) {
            if (isMobile) {
                products.forEach((productCard, index) => {
                    if (index >= mobileLimit) {
                        productCard.classList.add('d-none'); // Hide
                    } else {
                        productCard.classList.remove('d-none'); // Ensure visible
                    }
                });
                toggleButton.style.display = 'block'; // Make button visible
                toggleButton.innerHTML = 'Show More <i class="fas fa-chevron-down"></i>';
                toggleButton.classList.remove('active');
            } else {
                // Not mobile, show all products and hide the button
                products.forEach(productCard => {
                    productCard.classList.remove('d-none');
                });
                toggleButton.style.display = 'none';
            }
        } else {
            // Fewer products than limit, show all and hide the button
            products.forEach(productCard => {
                productCard.classList.remove('d-none');
            });
            toggleButton.style.display = 'none';
        }
    });
}

// =====================================================================================================
// EVERYTHING BELOW THIS LINE IS NOW INSIDE A SINGLE `DOMContentLoaded` LISTENER OR ATTACHED GLOBALLY
// =====================================================================================================

document.addEventListener('DOMContentLoaded', function() {
    // ===== Dark Mode Toggle =====
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

    // ===== Header Scroll Color Adjustment =====
    // This can stay here or be outside, it doesn't conflict.
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (header) { // Added null check for header
            header.classList.toggle('fixed-top-scroll', scrollY > 50);
        }
    });

    // ===== Close Mobile Menu on Outside Click =====
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
    function animateSubtitles() { // Moved inside DOMContentLoaded or defined globally
        document.querySelectorAll('#heroCarousel .hero-subtitle').forEach(p => {
            const textContentLength = p.textContent.length;

            p.style.animation = 'none';
            p.style.width = '0';
            void p.offsetWidth; // Trigger reflow

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

        setTimeout(() => {
            animateSubtitles();
            heroBsCarousel.cycle();
        }, 10000);

        heroCarousel.addEventListener('slid.bs.carousel', animateSubtitles);

        // --- Swipe Functionality for Hero Carousel ---
        let touchstartX = 0;
        let touchendX = 0;
        const minSwipeDistance = 50; // Minimum pixels for a recognized swipe

        heroCarousel.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        });

        heroCarousel.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            if (!heroBsCarousel) return; // Ensure carousel instance exists

            if (touchendX < touchstartX - minSwipeDistance) {
                // Swiped left (move to next slide)
                heroBsCarousel.next();
            }

            if (touchendX > touchstartX + minSwipeDistance) {
                // Swiped right (move to previous slide)
                heroBsCarousel.prev();
            }
        }

    }

    // Hero Carousel Buttons
    const heroNavButtons = document.querySelectorAll('.carousel-nav-buttons .btn');
    heroNavButtons.forEach(button => {
        const action = button.dataset.bsSlide;
        button.addEventListener('click', () => {
            if (!heroBsCarousel) return;
            if (action === 'next') heroBsCarousel.next();
            if (action === 'prev') heroBsCarousel.prev();
        });
    });

    // --- Collections Carousel Setup ---
    const collectionsCarouselElement = document.getElementById('collectionsCarousel');
    let collectionsBsCarousel;

    if (collectionsCarouselElement) {
        collectionsBsCarousel = new bootstrap.Carousel(collectionsCarouselElement, {
            interval: false,
            wrap: true
        });
    }

    // Collections Carousel Navigation Buttons
    const collectionsNavButtons = document.querySelectorAll('.collections-nav-buttons .btn');
    collectionsNavButtons.forEach(button => {
        const action = button.dataset.bsSlide;
        button.addEventListener('click', () => {
            if (!collectionsBsCarousel) return;
            if (action === 'next') collectionsBsCarousel.next();
            if (action === 'prev') collectionsBsCarousel.prev();
        });
    });


    // --- Shopping Cart Functionality Event Listeners (FIXED) ---
    if (cartToggleBtn && shoppingCart && closeCartBtn) { // Ensure elements exist
        cartToggleBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent document click from immediately closing
            shoppingCart.classList.toggle('show-cart');
        });

        closeCartBtn.addEventListener('click', () => {
            shoppingCart.classList.remove('show-cart');
        });

        // Close cart when clicking outside of it
        document.addEventListener('click', (event) => {
            if (!shoppingCart.contains(event.target) && !cartToggleBtn.contains(event.target)) {
                shoppingCart.classList.remove('show-cart');
            }
        });
    } else {
        console.warn("Cart elements (cartToggleBtn, shoppingCart, closeCartBtn) not found. Cart functionality might be impaired.");
    }


    // Universal click listener for add/remove buttons (FIXED: Placed inside DOMContentLoaded)
    // This now correctly captures clicks on buttons dynamically added to the DOM (like within modals)
    document.addEventListener('click', (e) => {
        // --- ADD TO CART from Product Card or Modal ---
        if (e.target.classList.contains('add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
            const targetButton = e.target.closest('.add-to-cart-btn');
            // If from modal, it will have product-name directly
            let productName = targetButton.dataset.productName;

            // If it's from a product card (not modal), then find the parent product-card
            if (!productName) {
                const productCard = targetButton.closest('.product-card');
                if (productCard) {
                    productName = productCard.dataset.productName;
                }
            }

            if (productName) {
                addToCart(productName);
            } else {
                console.warn("Could not determine product name for add to cart.");
            }
        }

        // --- REMOVE FROM CART ---
        if (e.target.classList.contains('remove-from-cart-btn')) {
            const productNameToRemove = e.target.dataset.productName;
            if (productNameToRemove) {
                removeFromCart(productNameToRemove);
            } else {
                console.warn("Could not determine product name for remove from cart.");
            }
        }
    });

    // Checkout Button - WhatsApp Integration
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) { // Added null check
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

            const phoneNumber = "2349015414195"; // Nigerian number with country code
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

            window.open(whatsappUrl, '_blank');

            // Optionally clear cart after sending message
            cart = [];
            updateCartDisplay();
            if (shoppingCart) shoppingCart.classList.remove('show-cart');
        });
    }


    // --- Product Modal Functionality Event Listeners (FIXED: Ensure modal exists first) ---
    if (productModalElement && productModal) { // Check if modal and its Bootstrap instance exist
        document.querySelectorAll('.extend-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                const collectionRow = e.target.closest('.collection-images');

                if (productCard && collectionRow) { // Ensure elements are found
                    currentProducts = Array.from(collectionRow.querySelectorAll('.product-card')).map(card => ({
                        id: card.dataset.productId,
                        name: card.dataset.productName,
                        img: card.dataset.productImg
                    }));

                    currentProductIndex = currentProducts.findIndex(p => p.id === productCard.dataset.productId);

                    updateModalContent();
                    productModal.show();
                } else {
                    console.warn("Could not find productCard or collectionRow for extend-btn click.");
                }
            });
        });

        // Modal navigation buttons
        if (modalPrevBtn) { // Added null check
            modalPrevBtn.addEventListener('click', () => {
                currentProductIndex = (currentProductIndex - 1 + currentProducts.length) % currentProducts.length;
                updateModalContent();
            });
        }

        if (modalNextBtn) { // Added null check
            modalNextBtn.addEventListener('click', () => {
                currentProductIndex = (currentProductIndex + 1) % currentProducts.length;
                updateModalContent();
            });
        }
    }


    // --- "Show More" Functionality for All Collections (Mobile Only) ---
    // Event listener for all "Show More/Less" buttons (FIXED: Consolidated logic)
    document.querySelectorAll('.show-more-toggle-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Find the corresponding collection container (previous sibling)
            const collectionContainer = this.previousElementSibling;

            // Ensure collectionContainer exists and has the correct class
            if (!collectionContainer || !collectionContainer.classList.contains('collection-images')) {
                console.warn("Corresponding .collection-images container not found for Show More/Less button.");
                return;
            }

            const products = Array.from(collectionContainer.querySelectorAll('.product-card'));
            const mobileLimit = parseInt(collectionContainer.dataset.mobileLimit || 8); // Use default if not set

            // Determine if currently showing all hidden items or if some are still hidden
            // Check the visibility of an item *beyond* the initial limit
            // This logic assumes `d-none` is used for hiding
            const isShowingAll = products.length > mobileLimit && !products[mobileLimit].classList.contains('d-none');


            if (isShowingAll) {
                // If currently showing all, hide items beyond the limit
                for (let i = mobileLimit; i < products.length; i++) {
                    products[i].classList.add('d-none');
                }
                button.innerHTML = 'Show More <i class="fas fa-chevron-down"></i>';
                button.classList.remove('active');
            } else {
                // If some are hidden, show them all
                for (let i = mobileLimit; i < products.length; i++) {
                    products[i].classList.remove('d-none');
                }
                button.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
                button.classList.add('active');
            }
        });
    });

    // Initial application of mobile limits and re-apply on resize
    applyMobileLimits(); // Call on DOMContentLoaded
    window.addEventListener('resize', applyMobileLimits);

    // Initialize cart display on load
    updateCartDisplay();

    ---

    // Scroll to Top Button functionality (consolidated)
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const scrollThreshold = 300;

    function toggleScrollToTopButton() {
        if (scrollToTopBtn) { // Added null check
            if (window.scrollY > scrollThreshold) {
                scrollToTopBtn.classList.add('show');
            } else {
                // FIX: Corrected typo from 'scrollToToTopBtn' to 'scrollToTopBtn'
                scrollToTopBtn.classList.remove('show');
            }
        }
    }

    if (scrollToTopBtn) { // Added null check
        window.addEventListener('scroll', toggleScrollToTopButton);
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        toggleScrollToTopButton(); // Initial check
    }

    ---

    // Update current year in footer
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) { // Added null check
        currentYearElement.textContent = new Date().getFullYear();
    }

    // Add smooth scrolling for footer links (consolidated)
    document.querySelectorAll('.footer-link[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) { // Added null check
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Add Map Toggle button functionality (assuming you want this)
    document.querySelectorAll('.toggleMapBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mapPreview = this.nextElementSibling; // Map preview should be the next sibling
            if (mapPreview && mapPreview.classList.contains('map-preview')) {
                mapPreview.classList.toggle('d-none');
                // You might want to remove the iframe src when hidden and add it back when shown
                // to prevent unnecessary loading, but that's more advanced.
            }
        });
    });

    // Initialize the main collections carousel once (as already done)
    // The collection filter logic is already correctly inside this DOMContentLoaded
    const collectionFilter = document.getElementById('collectionFilter');
    const carouselElement = document.getElementById('collectionsCarousel');
    const carouselItems = document.querySelectorAll('#collectionsCarousel .carousel-item');

    // Make sure collectionsCarousel is defined here if needed by collectionFilter
    const collectionsCarousel = new bootstrap.Carousel(carouselElement, {
        interval: false
    });

    if (collectionFilter) {
        collectionFilter.addEventListener('change', function() {
            const selectedCollection = this.value;
            if (selectedCollection === 'all') {
                collectionsCarousel.to(0);
            } else {
                let foundIndex = -1;
                carouselItems.forEach((item, index) => {
                    if (item.getAttribute('data-collection-name') === selectedCollection) {
                        foundIndex = index;
                    }
                });
                if (foundIndex !== -1) {
                    collectionsCarousel.to(foundIndex);
                } else {
                    collectionsCarousel.to(0);
                    console.warn(`Collection "${selectedCollection}" not found. Defaulting to first slide.`);
                }
            }
            // After changing collection, re-apply mobile limits to ensure correct "Show More" state
            applyMobileLimits();
        });
    }
}); // End of single DOMContentLoaded listener
