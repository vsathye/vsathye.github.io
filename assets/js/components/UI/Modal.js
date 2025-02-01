class Modal {
    constructor() {
        // Keep track of active modals
        this.activeModals = new Set();
        // Store templates for different content types
        this.templates = new Map();
        this.modalCount = 0;
        this.init();
    }

    init() {
        // Initialize templates
        this.registerDefaultTemplates();
        // Setup global event listeners
        this.setupGlobalListeners();
    }

    registerDefaultTemplates() {
        // Template for government details
        this.templates.set('government', (data) => `
            <div class="modal-header">
                <h2>${data.name} (${data.type})</h2>
                <span class="modal-dates">${data.startYear} - ${data.endYear}</span>
            </div>
            <div class="modal-body">
                <div class="modal-section">
                    <h3>Overview</h3>
                    <p>${data.description}</p>
                </div>
                <div class="modal-section">
                    <h3>Key Features</h3>
                    <ul>
                        ${data.features?.map(f => `<li>${f}</li>`).join('') || ''}
                    </ul>
                </div>
                ${data.rulers ? `
                    <div class="modal-section">
                        <h3>Notable Rulers</h3>
                        <ul>
                            ${data.rulers.map(r => `
                                <li>${r.name} (${r.period})${r.achievements ? `: ${r.achievements}` : ''}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `);

        // Template for interaction details
        this.templates.set('interaction', (data) => `
            <div class="modal-header">
                <h2>${data.type} Interaction</h2>
                <span class="modal-dates">${data.startYear} - ${data.endYear}</span>
            </div>
            <div class="modal-body">
                <div class="modal-section">
                    <h3>Participants</h3>
                    <ul>
                        ${data.participants.map(p => `
                            <li>${p.name} - ${p.role}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="modal-section">
                    <h3>Details</h3>
                    <p>${data.description}</p>
                </div>
                ${data.outcomes ? `
                    <div class="modal-section">
                        <h3>Outcomes</h3>
                        <ul>
                            ${data.outcomes.map(o => `<li>${o}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `);
    }

    /**
     * Creates and shows a new modal
     * @param {Object} options Modal configuration options
     * @param {string} options.type Content type ('government' or 'interaction')
     * @param {Object} options.data Content data
     * @param {Object} options.position Position override (optional)
     * @returns {string} Modal ID
     */
    show(options) {
        const modalId = `modal-${++this.modalCount}`;
        const modal = this.createModalElement(modalId, options);
        
        // Add to DOM
        document.body.appendChild(modal);
        
        // Setup focus trap
        this.setupFocusTrap(modal);
        
        // Add to active modals set
        this.activeModals.add(modalId);
        
        // Trigger open animation
        requestAnimationFrame(() => {
            modal.classList.add('modal-visible');
            if (this.activeModals.size === 1) {
                document.body.style.overflow = 'hidden';
            }
        });

        // Position modal
        this.position(modal, options.position);
        
        return modalId;
    }

    createModalElement(id, options) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `${id}-title`);
        
        // Create modal structure
        const template = this.templates.get(options.type);
        if (!template) {
            throw new Error(`Unknown modal type: ${options.type}`);
        }

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = template(options.data);

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close modal');
        closeButton.onclick = () => this.hide(id);

        modalContent.insertBefore(closeButton, modalContent.firstChild);
        modal.appendChild(modalContent);

        // Add backdrop if this is the first modal
        if (this.activeModals.size === 0) {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            modal.appendChild(backdrop);
        }

        return modal;
    }

    position(modal, positionOverride = null) {
        const content = modal.querySelector('.modal-content');
        
        if (positionOverride) {
            // Position relative to a specific point (e.g., for edge connections)
            content.style.position = 'absolute';
            content.style.left = `${positionOverride.x}px`;
            content.style.top = `${positionOverride.y}px`;
            
            // Ensure modal stays within viewport
            this.adjustPosition(content);
        } else {
            // Center modal by default
            content.style.position = 'relative';
            content.style.left = 'auto';
            content.style.top = 'auto';
        }
    }

    adjustPosition(modalContent) {
        const rect = modalContent.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Adjust horizontal position if needed
        if (rect.right > viewport.width) {
            modalContent.style.left = `${viewport.width - rect.width - 20}px`;
        }
        if (rect.left < 0) {
            modalContent.style.left = '20px';
        }

        // Adjust vertical position if needed
        if (rect.bottom > viewport.height) {
            modalContent.style.top = `${viewport.height - rect.height - 20}px`;
        }
        if (rect.top < 0) {
            modalContent.style.top = '20px';
        }
    }

    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Trigger close animation
        modal.classList.remove('modal-visible');

        // Remove modal after animation
        modal.addEventListener('transitionend', () => {
            modal.remove();
            this.activeModals.delete(modalId);
            
            // Restore scrolling if no more modals
            if (this.activeModals.size === 0) {
                document.body.style.overflow = '';
            }
        }, { once: true });
    }

    hideAll() {
        [...this.activeModals].forEach(modalId => this.hide(modalId));
    }

    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // Focus first element when modal opens
        firstFocusable.focus();

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    setupGlobalListeners() {
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.size > 0) {
                const lastModalId = Array.from(this.activeModals).pop();
                this.hide(lastModalId);
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.activeModals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal) {
                    this.position(modal);
                }
            });
        });

        // Close modals when clicking backdrop
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                const modalId = e.target.parentElement.id;
                this.hide(modalId);
            }
        });
    }

    /**
     * Updates content of an existing modal
     * @param {string} modalId Modal ID to update
     * @param {Object} options New content options
     */
    update(modalId, options) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const content = modal.querySelector('.modal-content');
        const template = this.templates.get(options.type);
        
        if (template) {
            const closeButton = content.querySelector('.modal-close');
            content.innerHTML = template(options.data);
            content.insertBefore(closeButton, content.firstChild);
        }
    }

    /**
     * Registers a new content template
     * @param {string} type Template type identifier
     * @param {Function} templateFn Template function
     */
    registerTemplate(type, templateFn) {
        this.templates.set(type, templateFn);
    }
}

window.Modal = Modal;