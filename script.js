const body = document.body;
const header = document.getElementById('mainHeader');
const navLinks = document.querySelectorAll('#navLinks .nav-link, #navLinksMobile .nav-link');
const label = document.querySelector('.form-check-label');
const title = document.getElementById('siteTitle');
const modeToggle = document.getElementById('modeToggle');
const hamburgerIcon = document.getElementById('hamburgerIcon');
const mobileMenu = document.getElementById('mobileMenu');
const heroCarousel = document.querySelector('#heroCarousel');


// ===== Dark Mode Toggle =====
if (modeToggle) { 
    // Apply saved theme on page load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        modeToggle.checked = true; // Set the toggle state if dark mode is active
    } else {
        modeToggle.checked = false; // Ensure toggle is unchecked if light mode
    }

    modeToggle.addEventListener('change', () => {
        body.classList.toggle('dark-mode');

        // Save preference to localStorage
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
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    header.classList.toggle('fixed-top-scroll', scrollY > 50);
});

// ===== Close Mobile Menu on Outside Click =====
window.addEventListener('click', function (e) {
    if (!mobileMenu.contains(e.target) && !e.target.closest('#menuToggleBtn')) {
        const bsCollapse = bootstrap.Collapse.getInstance(mobileMenu);
        if (bsCollapse && mobileMenu.classList.contains('show')) {
            bsCollapse.hide();
        }
    }
});

// Hero Carousel Setup and Subtitle Animation Reset
let heroBsCarousel; 
function animateSubtitles() {
    document.querySelectorAll('#heroCarousel .hero-subtitle').forEach(p => {
        const textContentLength = p.textContent.length;
        
        // Reset animation
        p.style.animation = 'none';
        p.style.width = '0'; 
        void p.offsetWidth; 

        // Apply typing and blinking animation
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

    // Delay the animation by 10 seconds
    setTimeout(() => {
        // Run typing animation after delay
        animateSubtitles();

        // Start the carousel after delay
        heroBsCarousel.cycle();
    }, 10000);

    // Re-run typing animation on carousel slide
    heroCarousel.addEventListener('slid.bs.carousel', animateSubtitles);
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
        interval: false, // Ensures NO AUTOPLAY
        wrap: true // Allow wrapping from last to first slide
    });
}

// Collections Carousel Navigation Buttons
const collectionsNavButtons = document.querySelectorAll('.collections-nav-buttons .btn');
collectionsNavButtons.forEach(button => {
    // Correctly read data-bs-slide attribute
    const action = button.dataset.bsSlide; 
    button.addEventListener('click', () => {
        if (!collectionsBsCarousel) return;
        if (action === 'next') collectionsBsCarousel.next();
        if (action === 'prev') collectionsBsCarousel.prev();
    });
});

// --- Shopping Cart Functionality ---
const cartToggleBtn = document.getElementById('cartToggleBtn');
const shoppingCart = document.getElementById('shoppingCart');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartCount = document.getElementById('cartCount');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotal = document.getElementById('cartTotal'); // Now represents total item count
const modalAddToCartBtn = document.getElementById('modalAddToCartBtn'); // For modal

let cart = [];

function updateCartDisplay() {
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
    cartCount.textContent = cart.length;
    cartTotal.textContent = cart.length; // Update total items count
}

function addToCart(productName) { // Removed productPrice parameter
    cart.push({ name: productName }); // Store only name
    updateCartDisplay();
}

function removeFromCart(productNameToRemove) {
    const indexToRemove = cart.findIndex(item => item.name === productNameToRemove);
    if (indexToRemove > -1) {
        cart.splice(indexToRemove, 1);
    }
    updateCartDisplay();
}

// Event Listeners for Cart
cartToggleBtn.addEventListener('click', () => {
    shoppingCart.classList.toggle('show-cart');
});

closeCartBtn.addEventListener('click', () => {
    shoppingCart.classList.remove('show-cart');
});

// Universal click listener for add/remove buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
        const targetButton = e.target.closest('.add-to-cart-btn');
        const productCard = targetButton.closest('.product-card');
        const productName = productCard.dataset.productName;
        // Price is no longer passed to addToCart
        addToCart(productName);
    }
    if (e.target.classList.contains('remove-from-cart-btn')) {
        const productNameToRemove = e.target.dataset.productName;
        removeFromCart(productNameToRemove);
    }
});

// Checkout Button - WhatsApp Integration
document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Group items by name and count quantities for the WhatsApp message
    const groupedCart = cart.reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + 1;
        return acc;
    }, {});

    let message = "Hello, I'd like to inquire about the following items from Mercy's Closet Luxe:\n\n";
    for (const name in groupedCart) {
        message += `${groupedCart[name]} x ${name}\n`;
    }
    message += "\nPlease let me know about their prices and availability. Thank you!";

    const phoneNumber = "2347064265426"; // Nigerian number with country code
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank'); // Open WhatsApp in a new tab

    // Optionally clear cart after sending message
    cart = [];
    updateCartDisplay();
    shoppingCart.classList.remove('show-cart');
});

// --- Product Modal Functionality ---
const productModalElement = document.getElementById('productModal');
const productModal = new bootstrap.Modal(productModalElement);
const modalProductImage = document.getElementById('modalProductImage');
const modalProductName = document.getElementById('modalProductName');
// const modalProductPrice = document.getElementById('modalProductPrice'); // Removed price display
const modalPrevBtn = document.getElementById('modalPrevBtn');
const modalNextBtn = document.getElementById('modalNextBtn');

let currentProducts = []; // Stores products for the current collection
let currentProductIndex = 0; // Current index in currentProducts array

document.querySelectorAll('.extend-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        const collectionRow = e.target.closest('.collection-images'); // Get the row of current collection
        
        // Populate currentProducts with all *visible* items in the current collection row
        currentProducts = Array.from(collectionRow.querySelectorAll('.product-card')).map(card => ({
            id: card.dataset.productId,
            name: card.dataset.productName,
            img: card.dataset.productImg
        }));

        // Find the index of the clicked product
        currentProductIndex = currentProducts.findIndex(p => p.id === productCard.dataset.productId);
        
        updateModalContent();
        productModal.show();
    });
});

function updateModalContent() {
    if (currentProducts.length > 0) {
        const product = currentProducts[currentProductIndex];
        modalProductImage.src = product.img;
        modalProductName.textContent = product.name;
        // modalProductPrice.textContent = formatCurrency(product.price); // Price removed
        
        // Set data attributes on the add to cart button in the modal
        modalAddToCartBtn.dataset.productName = product.name;
        // modalAddToCartBtn.dataset.productPrice = product.price; // Price removed
    }
}

modalPrevBtn.addEventListener('click', () => {
    currentProductIndex = (currentProductIndex - 1 + currentProducts.length) % currentProducts.length;
    updateModalContent();
});

modalNextBtn.addEventListener('click', () => {
    currentProductIndex = (currentProductIndex + 1) % currentProducts.length;
    updateModalContent();
});

// Add to cart from modal button
modalAddToCartBtn.addEventListener('click', (e) => {
    const productName = e.target.dataset.productName;
    // Price is no longer passed to addToCart
    addToCart(productName);
});

// --- "Show More" Functionality for All Collections (Mobile Only) ---
function applyMobileLimits() {
    // Determine if it's a mobile viewport based on Bootstrap's 'md' breakpoint
    const isMobile = window.innerWidth <= 767.98;

    document.querySelectorAll('.collection-images').forEach(collectionContainer => {
        const products = Array.from(collectionContainer.querySelectorAll('.product-card'));
        // Default to 8 items, or use the data-mobile-limit attribute if set
        const mobileLimit = parseInt(collectionContainer.dataset.mobileLimit || 8);
        // Assuming the toggle button is the next sibling
        const toggleButton = collectionContainer.nextElementSibling;

        // Basic validation to ensure the toggle button exists and is the correct one
        if (!toggleButton || !toggleButton.classList.contains('show-more-toggle-btn')) {
            console.warn('Show More Toggle Button not found for collection:', collectionContainer.dataset.collectionName || 'Unnamed Collection');
            return; // Skip this collection if button is missing
        }

        // Check if there are more products than the mobile limit
        if (products.length > mobileLimit) {
            // If on mobile, hide items beyond the limit and show the toggle button
            if (isMobile) {
                products.forEach((productCard, index) => {
                    if (index >= mobileLimit) {
                        productCard.classList.add('d-none'); // Hide with Bootstrap utility class
                    } else {
                        productCard.classList.remove('d-none'); // Ensure visible
                    }
                });
                toggleButton.style.display = 'block'; // Make the toggle button visible
                // Reset button to 'Show More' state with correct icon when limits are initially applied
                toggleButton.innerHTML = 'Show More <i class="fas fa-chevron-down"></i>';
                toggleButton.classList.remove('active'); // Ensure 'active' class is removed
            } else {
                // If not mobile, show all products and hide the toggle button (it's not needed)
                products.forEach(productCard => {
                    productCard.classList.remove('d-none');
                });
                toggleButton.style.display = 'none'; // Hide the toggle button on desktop
            }
        } else {
            // If there are fewer products than the mobile limit, show all and hide the button
            products.forEach(productCard => {
                productCard.classList.remove('d-none');
            });
            toggleButton.style.display = 'none'; // Hide the toggle button
        }
    });
}

// Event listener for all "Show More/Less" buttons
document.querySelectorAll('.show-more-toggle-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Find the corresponding collection container (previous sibling)
        const collectionContainer = button.previousElementSibling;
        const products = Array.from(collectionContainer.querySelectorAll('.product-card'));
        const mobileLimit = parseInt(collectionContainer.dataset.mobileLimit || 8);

        // Determine if currently showing all hidden items or if some are still hidden
        // We check the first hidden item (at mobileLimit index) to see its current state
        const isShowingAll = !products[mobileLimit].classList.contains('d-none');

        if (isShowingAll) {
            // If currently showing all, hide items beyond the limit
            for (let i = mobileLimit; i < products.length; i++) {
                products[i].classList.add('d-none');
            }
            // Change button text and icon to "Show More" and down arrow
            button.innerHTML = 'Show More <i class="fas fa-chevron-down"></i>';
            button.classList.remove('active'); // Remove 'active' class to rotate icon back
        } else {
            // If some are hidden, show them all
            for (let i = mobileLimit; i < products.length; i++) {
                products[i].classList.remove('d-none');
            }
            // Change button text and icon to "Show Less" and up arrow
            button.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
            button.classList.add('active'); // Add 'active' class to trigger icon rotation via CSS
        }
    });
});

// Initial application of mobile limits and re-apply on resize
window.addEventListener('load', applyMobileLimits);
window.addEventListener('resize', applyMobileLimits);

// Initialize cart display on load
updateCartDisplay();

document.addEventListener('DOMContentLoaded', function() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const scrollThreshold = 300; // Distance in pixels from the top to show the button

    // Function to show/hide the button
    function toggleScrollToTopButton() {
        if (window.scrollY > scrollThreshold) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    }

    // Function to scroll to the top smoothly
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Smooth scroll animation
        });
    }

    // Event listeners
    window.addEventListener('scroll', toggleScrollToTopButton);
    scrollToTopBtn.addEventListener('click', scrollToTop);

    // Initial check in case the page loads already scrolled down
    toggleScrollToTopButton();
});

document.getElementById('current-year').textContent = new Date().getFullYear();
    
// Add smooth scrolling for footer links
document.querySelectorAll('.footer-link[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const collectionFilter = document.getElementById('collectionFilter');
    const carouselElement = document.getElementById('collectionsCarousel');
    const carouselItems = document.querySelectorAll('#collectionsCarousel .carousel-item');

    // 1. Initialize the Bootstrap Carousel ONCE
    // data-bs-interval="false" is already on your HTML, which is good
    // as it prevents auto-sliding.
    const collectionsCarousel = new bootstrap.Carousel(carouselElement, {
        interval: false // Ensure no automatic sliding
    });

    collectionFilter.addEventListener('change', function() {
        const selectedCollection = this.value;

        if (selectedCollection === 'all') {
            // When 'All Collections' is selected, navigate to the first slide.
            // All carousel items are already part of the carousel.
            // We just need to make sure the first one is shown.
            collectionsCarousel.to(0);
        } else {
            // Find the index of the selected collection's carousel item
            let foundIndex = -1;
            carouselItems.forEach((item, index) => {
                if (item.getAttribute('data-collection-name') === selectedCollection) {
                    foundIndex = index;
                }
                // Important: Do NOT manually add/remove 'active' classes here.
                // Bootstrap's carousel.to() method handles that internally.
            });

            if (foundIndex !== -1) {
                // Navigate the carousel to the found index
                collectionsCarousel.to(foundIndex);
            } else {
                // Fallback: If for some reason the collection isn't found, go to the first slide.
                collectionsCarousel.to(0);
                console.warn(`Collection "${selectedCollection}" not found in carousel items. Defaulting to first slide.`);
            }
        }
    });

    // Optional: If you want to initially set the carousel to a specific slide
    // based on a default selected option, you can call collectionsCarousel.to() here.
    // Since 'All Collections' is selected by default, and it goes to index 0,
    // this is effectively handled by your initial HTML (`active` on the first item).

    // --- Potential solution for "Show More" functionality within each collection ---
    // This part is separate from the main filter but important for your layout.
    document.querySelectorAll('.collection-images').forEach(collectionDiv => {
        const products = collectionDiv.querySelectorAll('.col');
        const mobileLimit = parseInt(collectionDiv.getAttribute('data-mobile-limit'));
        const showMoreBtn = collectionDiv.nextElementSibling; // Assuming button is next sibling

        if (products.length > mobileLimit) {
            // Hide excess items
            for (let i = mobileLimit; i < products.length; i++) {
                products[i].style.display = 'none';
            }
            // Show the "Show More" button if there are hidden items
            if (showMoreBtn && showMoreBtn.classList.contains('show-more-toggle-btn')) {
                showMoreBtn.style.display = 'block';
            }
        } else {
            // Hide "Show More" button if all items are visible or less than limit
            if (showMoreBtn && showMoreBtn.classList.contains('show-more-toggle-btn')) {
                showMoreBtn.style.display = 'none';
            }
        }
    });

    document.querySelectorAll('.show-more-toggle-btn').forEach(button => {
        button.addEventListener('click', function() {
            const collectionTarget = this.getAttribute('data-collection-target');
            const targetCollectionDiv = document.querySelector(`.collection-images[data-collection-name="${collectionTarget}"]`);
            const products = targetCollectionDiv.querySelectorAll('.col');
            const mobileLimit = parseInt(targetCollectionDiv.getAttribute('data-mobile-limit'));

            if (this.textContent.includes('Show More')) {
                // Show all hidden items
                for (let i = mobileLimit; i < products.length; i++) {
                    products[i].style.display = 'block'; // Or 'flex', 'grid' depending on your CSS
                }
                this.textContent = 'Show Less';
            } else {
                // Hide items beyond the limit
                for (let i = mobileLimit; i < products.length; i++) {
                    products[i].style.display = 'none';
                }
                this.textContent = 'Show More';
            }
        });
    });

    // --- Cart Toggle Functionality ---
    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const shoppingCart = document.getElementById('shoppingCart');
    const closeCartBtn = document.getElementById('closeCartBtn');

    if (cartToggleBtn && shoppingCart && closeCartBtn) {
        cartToggleBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent clicks inside the cart from closing it
            shoppingCart.classList.toggle('show-cart'); // Assuming you have a CSS class 'show-cart'
        });

        closeCartBtn.addEventListener('click', function() {
            shoppingCart.classList.remove('show-cart');
        });

        // Close cart when clicking outside of it
        document.addEventListener('click', function(event) {
            if (!shoppingCart.contains(event.target) && !cartToggleBtn.contains(event.target)) {
                shoppingCart.classList.remove('show-cart');
            }
        });
    }

});