/**
 * Enhanced Pagination Module
 * Handles post listing and pagination functionality with multiple styles
 */
class Pagination {
    constructor(containerId, posts, postsPerPage = 10, options = {}) {
        this.container = document.getElementById(containerId);
        this.posts = posts;
        this.postsPerPage = postsPerPage;
        this.currentPage = 1;
        this.totalPages = Math.ceil(this.posts.length / this.postsPerPage);
        
        // Pagination options
        this.options = {
            style: options.style || 'simple', // 'simple', 'numbered', 'compact'
            showPageInfo: options.showPageInfo !== false,
            showPageNumbers: options.showPageNumbers !== false,
            maxPageNumbers: options.maxPageNumbers || 5,
            ...options
        };
        
        this.init();
    }

    init() {
        this.renderPosts();
        this.renderPagination();
        this.updatePaginationButtons();
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

        switch (this.options.style) {
            case 'numbered':
                this.renderNumberedPagination(paginationContainer);
                break;
            case 'compact':
                this.renderCompactPagination(paginationContainer);
                break;
            default:
                this.renderSimplePagination(paginationContainer);
        }
    }

    renderSimplePagination(container) {
        // Previous button
        const prevBtn = this.createButton('Previous', () => this.previousPage());
        prevBtn.id = 'prevBtn';
        container.appendChild(prevBtn);

        // Page info (optional)
        if (this.options.showPageInfo) {
            const pageInfo = document.createElement('span');
            pageInfo.className = 'page-info';
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
            container.appendChild(pageInfo);
        }

        // Next button
        const nextBtn = this.createButton('Next', () => this.nextPage());
        nextBtn.id = 'nextBtn';
        container.appendChild(nextBtn);
    }

    renderNumberedPagination(container) {
        // Previous button
        const prevBtn = this.createButton('←', () => this.previousPage());
        prevBtn.id = 'prevBtn';
        prevBtn.className = 'pagination-btn prev-btn';
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
        container.appendChild(nextBtn);
    }

    renderCompactPagination(container) {
        // Previous button
        const prevBtn = this.createButton('‹', () => this.previousPage());
        prevBtn.id = 'prevBtn';
        prevBtn.className = 'pagination-btn compact';
        container.appendChild(prevBtn);

        // Page indicator
        const pageIndicator = document.createElement('span');
        pageIndicator.className = 'page-indicator';
        pageIndicator.textContent = `${this.currentPage}/${this.totalPages}`;
        container.appendChild(pageIndicator);

        // Next button
        const nextBtn = this.createButton('›', () => this.nextPage());
        nextBtn.id = 'nextBtn';
        nextBtn.className = 'pagination-btn compact';
        container.appendChild(nextBtn);
    }

    createPageNumbers() {
        const pageNumbersContainer = document.createElement('div');
        pageNumbersContainer.className = 'page-numbers';

        const startPage = Math.max(1, this.currentPage - Math.floor(this.options.maxPageNumbers / 2));
        const endPage = Math.min(this.totalPages, startPage + this.options.maxPageNumbers - 1);

        // First page
        if (startPage > 1) {
            const firstBtn = this.createPageButton(1);
            pageNumbersContainer.appendChild(firstBtn);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbersContainer.appendChild(ellipsis);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = this.createPageButton(i);
            if (i === this.currentPage) {
                pageBtn.classList.add('active');
            }
            pageNumbersContainer.appendChild(pageBtn);
        }

        // Last page
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbersContainer.appendChild(ellipsis);
            }
            const lastBtn = this.createPageButton(this.totalPages);
            pageNumbersContainer.appendChild(lastBtn);
        }

        return pageNumbersContainer;
    }

    createPageButton(pageNumber) {
        const button = document.createElement('button');
        button.className = 'page-number-btn';
        button.textContent = pageNumber;
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
        }
        const currentPageBtn = document.querySelector(`.page-number-btn[data-page="${this.currentPage}"]`);
        if (currentPageBtn) {
            currentPageBtn.classList.add('active');
        }

        // Update page indicator
        const pageIndicator = document.querySelector('.page-indicator');
        if (pageIndicator) {
            pageIndicator.textContent = `${this.currentPage}/${this.totalPages}`;
        }

        // Update page info
        const pageInfo = document.querySelector('.page-info');
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPosts();
            this.updatePaginationButtons();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderPosts();
            this.updatePaginationButtons();
        }
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderPosts();
            this.updatePaginationButtons();
        }
    }

    // Method to change pagination style dynamically
    changeStyle(newStyle) {
        this.options.style = newStyle;
        this.renderPagination();
        this.updatePaginationButtons();
    }
}

// Export for use in other modules
window.Pagination = Pagination;
