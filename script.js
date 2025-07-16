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
        // If the element doesn't exist (e.g., heroCarousel is null), assume it's "out of view"
        // so the floating cart can still appear after scrolling a bit.
        return true;
    }
    const rect = elementToMonitor.getBoundingClientRect();
    // Returns true if the element's bottom edge has crossed the top of the viewport
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

    cartItemsList.innerHTML = ''; // Clear current items

    if (cart.length === 0) {
        cartItemsList.innerHTML = `
            <li class="list-group-item d-flex justify-content-between align-items-center text-muted">
                No items in cart.
            </li>
        `;
    } else {
        // Group items to show quantity if multiple of the same product are added
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

    // Update main cart count badge
    if (cartCount) {
        cartCount.textContent = cart.length;
    } else {
        console.warn("Element with ID 'cartCount' not found.");
    }

    // Update total items text in the main cart dropdown
    if (cartTotal) {
        cartTotal.textContent = cart.length;
    } else {
        console.warn("Element with ID 'cartTotal' not found.");
    }

    // Update floating cart count badge
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
    } else {
        console.warn("Modal elements or currentProducts array not ready for updateModalContent.");
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
        // The toggle button is expected to be the next sibling element
        const toggleButton = collectionContainer.nextElementSibling;

        if (!toggleButton || !toggleButton.classList.contains('show-more-toggle-btn')) {
            console.warn('Show More Toggle Button not found for collection:', collectionContainer.dataset.collectionName || 'Unnamed Collection');
            return;
        }

        if (products.length > mobileLimit) {
            if (isMobile) {
                products.forEach((productCard, index) => {
                    if (index >= mobileLimit) {
                        productCard.classList.add('d-none'); // Hide products beyond the limit
                    } else {
                        productCard.classList.remove('d-none'); // Ensure products within limit are visible
                    }
                });
                toggleButton.style.display = 'block'; // Show the toggle button
                toggleButton.innerHTML = 'Show More <i class="fas fa-chevron-down"></i>';
                toggleButton.classList.remove('active'); // Reset active state
            } else {
                products.forEach(productCard => {
                    productCard.classList.remove('d-none'); // Show all products on larger screens
                });
                toggleButton.style.display = 'none'; // Hide the toggle button
            }
        } else {
            products.forEach(productCard => {
                productCard.classList.remove('d-none'); // Show all products if count is less than limit
            });
            toggleButton.style.display = 'none'; // Hide button if no "more" to show
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
            modeToggle.checked = false; // Default to light mode if no preference or 'light'
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
            // Add 'fixed-top-scroll' class when scrolled down more than 50px
            header.classList.toggle('fixed-top-scroll', window.scrollY > 50);
        } else {
            console.warn("Main header element with ID 'mainHeader' not found.");
        }
    });

    // --- Close Mobile Menu on Outside Click ---
    // This allows clicking anywhere outside the menu and its toggle button to close it.
    window.addEventListener('click', function (e) {
        if (mobileMenu && !mobileMenu.contains(e.target) && !e.target.closest('#menuToggleBtn')) {
            const bsCollapse = bootstrap.Collapse.getInstance(mobileMenu);
            if (bsCollapse && mobileMenu.classList.contains('show')) {
                bsCollapse.hide(); // Hide the Bootstrap collapse menu
            }
        }
    });

    // --- Hero Carousel Setup and Subtitle Animation Reset ---
    let heroBsCarousel; // Declare carousel instance
    /**
     * Resets and restarts the typing animation for hero subtitles.
     */
    function animateSubtitles() {
        document.querySelectorAll('#heroCarousel .hero-subtitle').forEach(p => {
            const textContentLength = p.textContent.length;
            // Reset animation by removing properties and triggering reflow
            p.style.animation = 'none';
            p.style.width = '0';
            void p.offsetWidth; // Force reflow
            // Apply animation again
            p.style.animation = `typing 3s steps(${textContentLength}, end) infinite, blink 0.7s step-end infinite`;
        });
    }

    if (heroCarousel) {
        heroBsCarousel = new bootstrap.Carousel(heroCarousel, {
            interval: 20000, // Longer interval for reading
            ride: 'carousel',
            pause: false, // Don't pause on hover
            wrap: true
        });

        // Touch swipe functionality for hero carousel
        let touchStartX = 0;
        let touchEndX = 0;

        heroCarousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true}); // Use passive listener for better scroll performance

        heroCarousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, {passive: true});

        function handleSwipe() {
            const swipeThreshold = 50; // Minimum pixel distance for a swipe
            if (touchEndX < touchStartX - swipeThreshold) {
                heroBsCarousel.next();
            } else if (touchEndX > touchStartX + swipeThreshold) {
                heroBsCarousel.prev();
            }
        }

        // Initial animation and cycling after a delay
        setTimeout(() => {
            animateSubtitles();
            heroBsCarousel.cycle();
        }, 10000); // Start animation after 10 seconds

        // Re-animate subtitles on carousel slide transition
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
                if (!heroBsCarousel) return; // Ensure carousel is initialized
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
            interval: false, // Manual control, not auto-cycling
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
                if (!collectionsBsCarousel) return; // Ensure carousel is initialized
                if (action === 'next') collectionsBsCarousel.next();
                if (action === 'prev') collectionsBsCarousel.prev();
            });
        });
    } else {
        console.warn("Collections Carousel navigation buttons not found.");
    }


    // --- Main Shopping Cart Functionality Event Listeners ---
    if (cartToggleBtn && shoppingCart && closeCartBtn) {
        // Toggle main cart visibility when its button is clicked
        cartToggleBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the document click listener from immediately closing it
            shoppingCart.classList.toggle('show-cart'); // Toggles visibility for the main cart

            // Reset cart position to default (relative to header) when opened from main button
            shoppingCart.style.removeProperty('top');
            shoppingCart.style.removeProperty('left');
            shoppingCart.style.removeProperty('right'); // Ensure right is also reset for proper positioning
            shoppingCart.style.removeProperty('transform'); // In case you had transforms for positioning
        });

        // Close main cart when its close button is clicked
        closeCartBtn.addEventListener('click', () => {
            shoppingCart.classList.remove('show-cart');
        });

        // Close main cart when clicking outside of it or its toggle buttons
        document.addEventListener('click', (event) => {
            const isClickInsideMainCart = shoppingCart.contains(event.target);
            const isClickOnMainCartToggle = cartToggleBtn.contains(event.target);
            const isClickOnFloatingCartToggle = floatingCartToggleBtn ? floatingCartToggleBtn.contains(event.target) : false; // Check if floating button exists

            // If the click is not inside the cart AND not on either toggle button, then close the cart
            if (!isClickInsideMainCart && !isClickOnMainCartToggle && !isClickOnFloatingCartToggle) {
                shoppingCart.classList.remove('show-cart');
            }
        });
    } else {
        console.warn("Main cart elements (cartToggleBtn, shoppingCart, closeCartBtn) not found. Main cart functionality might be impaired.");
    }

    // --- Universal Add/Remove to Cart Buttons ---
    // Uses event delegation for efficiency and to handle dynamically added elements
    document.addEventListener('click', (e) => {
        // Handle "Add to Cart" clicks
        if (e.target.classList.contains('add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
            const targetButton = e.target.closest('.add-to-cart-btn');
            let productName = targetButton.dataset.productName; // Get product name from data-product-name attribute

            // Fallback for product card if data-product-name is directly on card
            if (!productName) {
                const productCard = targetButton.closest('.product-card');
                if (productCard) {
                    productName = productCard.dataset.productName;
                }
            }

            if (productName) {
                addToCart(productName);
            } else {
                console.warn("Could not determine product name for 'add to cart' action.");
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
                alert('Your cart is empty!'); // Simple alert for empty cart
                return;
            }

            // Group cart items by name and count
            const groupedCart = cart.reduce((acc, item) => {
                acc[item.name] = (acc[item.name] || 0) + 1;
                return acc;
            }, {});

            let message = "Hello, I'd like to inquire about the following items from Mercy's Closet Luxe:\n\n";
            for (const name in groupedCart) {
                message += `${groupedCart[name]} x ${name}\n`;
            }
            message += "\nPlease let me know about their prices and availability. Thank you!";

            const phoneNumber = "2349015414195"; // Your WhatsApp number
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

            window.open(whatsappUrl, '_blank'); // Open WhatsApp in a new tab

            cart = []; // Clear the cart after checkout
            updateCartDisplay(); // Update cart display to reflect empty cart
            if (shoppingCart) {
                shoppingCart.classList.remove('show-cart'); // Close the cart dropdown
            }
        });
    } else {
        console.warn("Checkout button with ID 'checkoutBtn' not found.");
    }


    // --- Product Modal Functionality Event Listeners ---
    if (productModalElement && productModal) {
        // Open modal when an "Extend" button is clicked
        document.querySelectorAll('.extend-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card'); // Get the parent product card
                const collectionRow = e.target.closest('.collection-images'); // Get the parent collection container

                if (productCard && collectionRow) {
                    // Populate currentProducts array with all products in the same collection
                    currentProducts = Array.from(collectionRow.querySelectorAll('.product-card')).map(card => ({
                        id: card.dataset.productId,
                        name: card.dataset.productName,
                        img: card.dataset.productImg
                    }));

                    // Find the index of the clicked product
                    currentProductIndex = currentProducts.findIndex(p => p.id === productCard.dataset.productId);

                    updateModalContent(); // Load content for the current product
                    productModal.show(); // Show the modal
                } else {
                    console.warn("Could not find productCard or collectionRow for extend-btn click. Check HTML structure.");
                }
            });
        });

        // Modal navigation buttons (Previous/Next Product)
        if (modalPrevBtn) {
            modalPrevBtn.addEventListener('click', () => {
                // Cycle backward through products, wrapping around
                currentProductIndex = (currentProductIndex - 1 + currentProducts.length) % currentProducts.length;
                updateModalContent();
            });
        }
        if (modalNextBtn) {
            modalNextBtn.addEventListener('click', () => {
                // Cycle forward through products, wrapping around
                currentProductIndex = (currentProductIndex + 1) % currentProducts.length;
                updateModalContent();
            });
        }
    } else {
        console.warn("Product modal elements (productModalElement, modalProductImage, etc.) not found. Product modal functionality might be impaired.");
    }


    // --- "Show More/Less" Functionality for Product Collections (Mobile Only) ---
    // Event listener for all "Show More/Less" toggle buttons
    document.querySelectorAll('.show-more-toggle-btn').forEach(button => {
        button.addEventListener('click', function() {
            // The collection container is assumed to be the immediate previous sibling
            const collectionContainer = this.previousElementSibling;

            if (!collectionContainer || !collectionContainer.classList.contains('collection-images')) {
                console.warn("Corresponding '.collection-images' container not found for Show More/Less button. Check HTML structure.");
                return;
            }

            const products = Array.from(collectionContainer.querySelectorAll('.product-card'));
            const mobileLimit = parseInt(collectionContainer.dataset.mobileLimit || 8); // Get limit from data attribute

            // Check if products beyond the limit are currently hidden (meaning it's in "Show More" state)
            const isShowingAll = products.length > mobileLimit && !products[mobileLimit].classList.contains('d-none');

            if (isShowingAll) {
                // If currently showing all, hide products beyond the limit
                for (let i = mobileLimit; i < products.length; i++) {
                    products[i].classList.add('d-none');
                }
                this.innerHTML = 'Show More <i class="fas fa-chevron-down"></i>';
                this.classList.remove('active');
            } else {
                // If currently showing limited, show all products
                for (let i = mobileLimit; i < products.length; i++) {
                    products[i].classList.remove('d-none');
                }
                this.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
                this.classList.add('active');
            }
        });
    });

    // Apply mobile limits initially on page load
    applyMobileLimits();
    // Re-apply mobile limits on window resize (e.g., orientation change, device switch)
    window.addEventListener('resize', applyMobileLimits);

    // Initialize cart display on page load to set initial counts
    updateCartDisplay();


    // --- Scroll to Top Button Functionality ---
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const scrollThreshold = 300; // Pixels to scroll down before button appears

    /**
     * Toggles the visibility of the "Scroll to Top" button based on scroll position.
     */
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
        window.addEventListener('scroll', toggleScrollToTopButton); // Listen for scroll events
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth scroll to top
        });
        toggleScrollToTopButton(); // Initial check on load
    } else {
        console.warn("Scroll to Top button with ID 'scrollToTopBtn' not found.");
    }


    // --- Footer Functionality ---
    // Update current year in footer
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // Add smooth scrolling for footer links that point to sections on the same page
    document.querySelectorAll('.footer-link[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default jump behavior
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' }); // Smooth scroll to target
            }
        });
    });

    // Add Map Toggle button functionality (for inline maps/previews)
    document.querySelectorAll('.toggleMapBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mapPreview = this.nextElementSibling; // Assumes map preview is the next sibling
            if (mapPreview && mapPreview.classList.contains('map-preview')) {
                mapPreview.classList.toggle('d-none'); // Toggle Bootstrap's 'display: none' utility class
            }
        });
    });


    // --- Collection Filter and Carousel Synchronization ---
    const collectionFilter = document.getElementById('collectionFilter');
    // Re-select carousel elements as the global one was already defined
    const mainCollectionsCarouselElement = document.getElementById('collectionsCarousel');
    const mainCarouselItems = document.querySelectorAll('#collectionsCarousel .carousel-item');

    // Re-initialize Bootstrap carousel for the filter functionality if not already done
    let mainCollectionsBsCarousel;
    if (mainCollectionsCarouselElement) {
        mainCollectionsBsCarousel = new bootstrap.Carousel(mainCollectionsCarouselElement, {
            interval: false // Control manually
        });
    }

    if (collectionFilter && mainCollectionsBsCarousel) {
        collectionFilter.addEventListener('change', function() {
            const selectedCollection = this.value;
            if (selectedCollection === 'all') {
                mainCollectionsBsCarousel.to(0); // Go to the first slide (usually "All" or default)
            } else {
                let foundIndex = -1;
                // Find the index of the carousel item corresponding to the selected collection
                mainCarouselItems.forEach((item, index) => {
                    if (item.getAttribute('data-collection-name') === selectedCollection) {
                        foundIndex = index;
                    }
                });
                if (foundIndex !== -1) {
                    mainCollectionsBsCarousel.to(foundIndex); // Go to the specific collection slide
                } else {
                    mainCollectionsBsCarousel.to(0); // Fallback to first slide if not found
                    console.warn(`Collection "${selectedCollection}" not found in carousel. Defaulting to first slide.`);
                }
            }
            applyMobileLimits(); // Re-apply limits as collection view changes
        });
    } else {
        console.warn("Collection filter or carousel elements not found. Collection filtering might be impaired.");
    }


    // --- Floating Cart Wrapper Scroll and Button Logic ---
    // Determine which element to monitor for scroll: hero section first, then header.
    // The floating cart wrapper will appear when the bottom of this element scrolls out of view.
    const elementToMonitor = heroCarousel || header; // Prioritize hero if it exists

    // Ensure floating cart wrapper and toggle button exist before attaching listeners
    if (floatingCartWrapper && floatingCartToggleBtn && shoppingCart) { // Ensure shoppingCart exists to apply styles

        // 🎯 Scroll Event Listener: Controls when the floating cart wrapper appears/disappears
        window.addEventListener('scroll', function() {
            if (isElementOutOfView(elementToMonitor)) {
                // Monitored element (header/hero) is out of view, show floating cart wrapper
                floatingCartWrapper.style.display = 'flex'; // Use 'flex' (or 'block'/'grid') based on your CSS for the wrapper
            } else {
                // Monitored element is in view, hide floating cart wrapper
                floatingCartWrapper.style.display = 'none';
                // Crucially, ensure the main cart dropdown is hidden when the floating cart disappears
                shoppingCart.classList.remove('show-cart');
            }
        });

        // 🎯 Click Event Listener for Floating Cart Button: Toggles the visibility of the *main* shopping cart dropdown
        floatingCartToggleBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevents clicks inside the button from closing the cart immediately

            // Toggle the visibility first
            shoppingCart.classList.toggle('show-cart');

            // If the cart is now shown, position it relative to the floating button
            if (shoppingCart.classList.contains('show-cart')) {
                const floatingBtnRect = floatingCartToggleBtn.getBoundingClientRect();

                // Position the cart relative to the viewport
                // Adjust these values based on your desired offset from the button
                // For example, if you want it to appear slightly to the left and below the button:
                shoppingCart.style.position = 'fixed'; // Must be fixed or absolute
                shoppingCart.style.top = `${floatingBtnRect.bottom + 10}px`; // 10px below the button
                // This positions the right edge of the cart with the right edge of the button
                shoppingCart.style.left = 'auto'; // Clear any left property
                shoppingCart.style.right = `${window.innerWidth - floatingBtnRect.right}px`;
                // Alternatively, to align its left edge with the button's left edge:
                // shoppingCart.style.left = `${floatingBtnRect.left}px`;
                // shoppingCart.style.right = 'auto';
            } else {
                // When closing the cart, clear the inline styles to allow CSS to control it
                shoppingCart.style.removeProperty('top');
                shoppingCart.style.removeProperty('left');
                shoppingCart.style.removeProperty('right');
                shoppingCart.style.removeProperty('position'); // Remove fixed/absolute position
            }
        });


        // 🎯 Initial check on page load to set floating cart wrapper visibility correctly
        // This ensures it's hidden if the page loads scrolled to the top.
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
