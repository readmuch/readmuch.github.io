/**
 * Pagination Module
 * Handles post listing and pagination functionality
 */
class Pagination {
    constructor(containerId, posts, postsPerPage = 10) {
        this.container = document.getElementById(containerId);
        this.posts = posts;
        this.postsPerPage = postsPerPage;
        this.currentPage = 1;
        this.totalPages = Math.ceil(this.posts.length / this.postsPerPage);
        
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

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
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
}

// Export for use in other modules
window.Pagination = Pagination;
