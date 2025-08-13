/**
 * Enhanced Pagination Module
 * Handles post listing and pagination functionality with responsive numbered style
 */
class Pagination {
    constructor(containerId, posts, postsPerPage = 10, options = {}) {
        this.container = document.getElementById(containerId);
        this.posts = posts;
        this.postsPerPage = postsPerPage;
        this.currentPage = 1;
        this.totalPages = Math.ceil(this.posts.length / this.postsPerPage);
        
        // Pagination options with responsive defaults
        this.options = {
            style: 'numbered',
            showPageInfo: true,
            showPageNumbers: true,
            maxPageNumbers: this.getResponsiveMaxPageNumbers(),
            ...options
        };
        
        this.init();
    }

    getResponsiveMaxPageNumbers() {
        const width = window.innerWidth;
        if (width >= 1200) return 5;      // Desktop
        if (width >= 768) return 4;       // Tablet
        if (width >= 480) return 3;       // Mobile large
        return 2;                         // Mobile small
    }

    init() {
        this.renderPosts();
        this.renderPagination();
        this.updatePaginationButtons();
        
        // Listen for window resize to adjust pagination
        window.addEventListener('resize', this.debounce(() => {
            this.options.maxPageNumbers = this.getResponsiveMaxPageNumbers();
            this.renderPagination();
            this.updatePaginationButtons();
        }, 250));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    renderPosts() {
        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        const currentPosts = this.posts.slice(startIndex, endIndex);

        this.container.innerHTML = '';
        
        currentPosts.forEach(post => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = post.link;
            a.textContent = post.title;
            li.appendChild(a);
            this.container.appendChild(li);
        });
    }

    renderPagination() {
        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) return;

        // Clear existing content
        paginationContainer.innerHTML = '';

        // Always use numbered style with responsive adjustments
        this.renderNumberedPagination(paginationContainer);
    }

    renderNumberedPagination(container) {
        // Previous button
        const prevBtn = this.createButton('←', () => this.previousPage());
        prevBtn.id = 'prevBtn';
        prevBtn.className = 'pagination-btn prev-btn';
        prevBtn.setAttribute('aria-label', 'Previous page');
        container.appendChild(prevBtn);

        // Page numbers
        if (this.options.showPageNumbers && this.totalPages > 1) {
            const pageNumbers = this.createPageNumbers();
            container.appendChild(pageNumbers);
        }

        // Next button
        const nextBtn = this.createButton('→', () => this.nextPage());
        nextBtn.id = 'nextBtn';
        nextBtn.className = 'pagination-btn next-btn';
        nextBtn.setAttribute('aria-label', 'Next page');
        container.appendChild(nextBtn);
    }

    createPageNumbers() {
        const pageNumbersContainer = document.createElement('div');
        pageNumbersContainer.className = 'page-numbers';

        const maxPageNumbers = this.options.maxPageNumbers;
        const totalPages = this.totalPages;
        const currentPage = this.currentPage;

        // Calculate which page numbers to show
        let startPage, endPage;

        if (totalPages <= maxPageNumbers) {
            // Show all pages if total is less than or equal to max
            startPage = 1;
            endPage = totalPages;
        } else {
            // Calculate range around current page
            const halfMax = Math.floor(maxPageNumbers / 2);
            startPage = Math.max(1, currentPage - halfMax);
            endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

            // Adjust if we're near the end
            if (endPage - startPage + 1 < maxPageNumbers) {
                startPage = Math.max(1, endPage - maxPageNumbers + 1);
            }
        }

        // First page and ellipsis
        if (startPage > 1) {
            const firstBtn = this.createPageButton(1);
            pageNumbersContainer.appendChild(firstBtn);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                ellipsis.setAttribute('aria-hidden', 'true');
                pageNumbersContainer.appendChild(ellipsis);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = this.createPageButton(i);
            if (i === currentPage) {
                pageBtn.classList.add('active');
                pageBtn.setAttribute('aria-current', 'page');
            }
            pageNumbersContainer.appendChild(pageBtn);
        }

        // Last page and ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                ellipsis.setAttribute('aria-hidden', 'true');
                pageNumbersContainer.appendChild(ellipsis);
            }
            const lastBtn = this.createPageButton(totalPages);
            pageNumbersContainer.appendChild(lastBtn);
        }

        return pageNumbersContainer;
    }

    createPageButton(pageNumber) {
        const button = document.createElement('button');
        button.className = 'page-number-btn';
        button.textContent = pageNumber;
        button.setAttribute('aria-label', `Page ${pageNumber}`);
        button.addEventListener('click', () => this.goToPage(pageNumber));
        return button;
    }

    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    updatePaginationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === this.totalPages;
        }

        // Update active page number
        const activeBtn = document.querySelector('.page-number-btn.active');
        if (activeBtn) {
            activeBtn.classList.remove('active');
            activeBtn.removeAttribute('aria-current');
        }
        const currentPageBtn = document.querySelector(`.page-number-btn[aria-label="Page ${this.currentPage}"]`);
        if (currentPageBtn) {
            currentPageBtn.classList.add('active');
            currentPageBtn.setAttribute('aria-current', 'page');
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPosts();
            this.updatePaginationButtons();
            this.scrollToTop();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderPosts();
            this.updatePaginationButtons();
            this.scrollToTop();
        }
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderPosts();
            this.updatePaginationButtons();
            this.scrollToTop();
        }
    }

    scrollToTop() {
        // Smooth scroll to top of the post list
        const container = this.container.closest('.category-container') || this.container.closest('main');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Method to change pagination style dynamically (kept for compatibility)
    changeStyle(newStyle) {
        // Always use numbered style for consistency
        this.options.style = 'numbered';
        this.renderPagination();
        this.updatePaginationButtons();
    }
}

// Export for use in other modules
window.Pagination = Pagination;
