/**
 * CODEFARM Main Application
 * Navigation, interactions, and section reveals
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    const app = new CodefarmApp();
    app.init();
});

class CodefarmApp {
    constructor() {
        this.canvas = document.getElementById('triangleCanvas');
        this.nav = document.getElementById('nav');
        this.navToggle = document.getElementById('navToggle');
        this.navLinks = document.querySelector('.nav-links');
        this.heroLogo = document.getElementById('heroLogo');
        
        this.sections = document.querySelectorAll('.section');
        this.navLinkElements = document.querySelectorAll('.nav-link');
        
        this.triangleEngine = null;
        this.heroAnimation = null;
        this.currentSection = 'hero';
        this.isNavigating = false;
    }
    
    init() {
        // Initialize triangulation engine
        this.triangleEngine = new TriangulationEngine(this.canvas);
        
        // Initialize hero logo animation
        if (this.heroLogo) {
            this.heroAnimation = new HeroLogoAnimation(this.heroLogo);
        }
        
        // Setup event listeners
        this.setupNavigation();
        this.setupMobileNav();
        this.setupScrollObserver();
        this.setupSectionAnimations();
        
        // Initial state
        this.updateActiveNav('hero');
    }
    
    /**
     * Setup navigation click handlers
     */
    setupNavigation() {
        this.navLinkElements.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (this.isNavigating) return;
                
                const targetId = link.getAttribute('data-section');
                const targetSection = document.getElementById(targetId);
                
                if (!targetSection || targetId === this.currentSection) {
                    // Just scroll if same section
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    return;
                }
                
                // Get click position for animation origin
                const rect = link.getBoundingClientRect();
                const clickX = rect.left + rect.width / 2;
                const clickY = rect.bottom;
                
                this.navigateToSection(targetId, clickX, clickY);
            });
        });
        
        // CTA buttons
        document.querySelectorAll('.btn[href^="#"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    const rect = btn.getBoundingClientRect();
                    const clickX = rect.left + rect.width / 2;
                    const clickY = rect.top + rect.height / 2;
                    
                    this.navigateToSection(targetId, clickX, clickY);
                }
            });
        });
    }
    
    /**
     * Navigate to section with triangulation animation
     */
    navigateToSection(targetId, clickX, clickY) {
        // Prevent multiple simultaneous navigations
        if (this.isNavigating) {
            return;
        }
        
        this.isNavigating = true;
        
        // Close mobile nav if open
        if (this.navLinks.classList.contains('open')) {
            this.toggleMobileNav();
        }
        
        // Update active state
        this.updateActiveNav(targetId);
        
        // Run triangulation animation
        this.triangleEngine.runFromClick(clickX, clickY, targetId, () => {
            // Reset navigation flag when animation completes
            this.isNavigating = false;
        });
        
        // Scroll to section (slightly delayed for effect)
        setTimeout(() => {
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
                this.currentSection = targetId;
            }
        }, 300);
    }
    
    /**
     * Setup mobile navigation toggle
     */
    setupMobileNav() {
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => {
                this.toggleMobileNav();
            });
        }
    }
    
    toggleMobileNav() {
        this.navToggle.classList.toggle('active');
        this.navLinks.classList.toggle('open');
    }
    
    /**
     * Update active navigation state
     */
    updateActiveNav(sectionId) {
        this.navLinkElements.forEach(link => {
            const linkSection = link.getAttribute('data-section');
            link.classList.toggle('active', linkSection === sectionId);
        });
    }
    
    /**
     * Setup Intersection Observer for scroll-based navigation updates
     */
    setupScrollObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isNavigating) {
                    const sectionId = entry.target.id;
                    this.updateActiveNav(sectionId);
                    this.currentSection = sectionId;
                }
            });
        }, observerOptions);
        
        this.sections.forEach(section => {
            observer.observe(section);
        });
    }
    
    /**
     * Setup scroll-triggered section animations
     */
    setupSectionAnimations() {
        const animateOptions = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };
        
        const animateObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Animate stagger elements
                    const staggerElements = entry.target.querySelectorAll('.stagger-in');
                    staggerElements.forEach(el => el.classList.add('visible'));
                }
            });
        }, animateOptions);
        
        // Add animation classes to elements
        this.sections.forEach(section => {
            // Add stagger-in class to grids
            const grids = section.querySelectorAll('.curriculum-grid, .details-grid, .experience-breakdown');
            grids.forEach(grid => grid.classList.add('stagger-in'));
            
            animateObserver.observe(section);
        });
    }
}

// Add subtle parallax effect to hero (throttled for performance)
let lastScrollTime = 0;
const scrollThrottle = 16; // ~60fps

window.addEventListener('scroll', () => {
    const now = performance.now();
    if (now - lastScrollTime < scrollThrottle) return;
    lastScrollTime = now;
    
    const hero = document.getElementById('hero');
    if (hero) {
        const scrollY = window.scrollY;
        const heroContent = hero.querySelector('.hero-content');
        if (heroContent && scrollY < window.innerHeight) {
            heroContent.style.transform = `translate3d(0, ${scrollY * 0.3}px, 0)`;
            heroContent.style.opacity = 1 - (scrollY / window.innerHeight) * 0.5;
        }
    }
}, { passive: true });

// Smooth scroll polyfill for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}
