/**
 * Pagination Component
 * Handles pagination for the cards grid
 */
class Pagination {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalItems = 0;
        this.itemsPerPage = options.itemsPerPage || 12;
        this.onPageChange = options.onPageChange || null;
        
        if (!this.container) {
            console.error(`Pagination container with id "${containerId}" not found`);
            return;
        }
    }

    update(currentPage, totalPages, totalItems) {
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalItems = totalItems;
        
        this.render();
    }

    render() {
        if (!this.container) return;

        if (this.totalPages <= 1) {
            this.container.innerHTML = '';
            return;
        }

        const paginationHTML = this.generatePaginationHTML();
        this.container.innerHTML = paginationHTML;
        
        this.attachEventListeners();
    }

    generatePaginationHTML() {
        let html = '';
        
        // Previous button
        const prevDisabled = this.currentPage === 1 ? 'disabled' : '';
        html += `<button class="pagination-btn" data-page="prev" ${prevDisabled}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
        </button>`;

        // Page numbers
        const pageNumbers = this.getPageNumbers();
        pageNumbers.forEach(pageNum => {
            if (pageNum === '...') {
                html += '<span class="pagination-ellipsis">...</span>';
            } else {
                const active = pageNum === this.currentPage ? 'active' : '';
                html += `<button class="pagination-btn ${active}" data-page="${pageNum}">${pageNum}</button>`;
            }
        });

        // Next button
        const nextDisabled = this.currentPage === this.totalPages ? 'disabled' : '';
        html += `<button class="pagination-btn" data-page="next" ${nextDisabled}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
        </button>`;

        // Info text
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        html += `<span class="pagination-info">Showing ${startItem}-${endItem} of ${this.totalItems}</span>`;

        return html;
    }

    getPageNumbers() {
        const pages = [];
        const maxVisible = 7;
        
        if (this.totalPages <= maxVisible) {
            // Show all pages
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show first page
            pages.push(1);
            
            if (this.currentPage <= 4) {
                // Show pages 2-5
                for (let i = 2; i <= 5; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(this.totalPages);
            } else if (this.currentPage >= this.totalPages - 3) {
                // Show ellipsis and last pages
                pages.push('...');
                for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // Show ellipsis, current page, and neighbors
                pages.push('...');
                for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(this.totalPages);
            }
        }
        
        return pages;
    }

    attachEventListeners() {
        const buttons = this.container.querySelectorAll('.pagination-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.handlePageClick(page);
            });
        });
    }

    handlePageClick(page) {
        let newPage = this.currentPage;
        
        switch (page) {
            case 'prev':
                newPage = Math.max(1, this.currentPage - 1);
                break;
            case 'next':
                newPage = Math.min(this.totalPages, this.currentPage + 1);
                break;
            default:
                newPage = parseInt(page, 10);
                break;
        }

        if (newPage !== this.currentPage && newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            
            if (this.onPageChange) {
                this.onPageChange(this.currentPage);
            }
            
            // Re-render to update active state
            this.render();
        }
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.render();
            
            if (this.onPageChange) {
                this.onPageChange(this.currentPage);
            }
        }
    }

    reset() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalItems = 0;
        this.render();
    }

    setItemsPerPage(itemsPerPage) {
        this.itemsPerPage = itemsPerPage;
        // Recalculate current page if necessary
        const maxPage = Math.ceil(this.totalItems / this.itemsPerPage);
        if (this.currentPage > maxPage) {
            this.currentPage = maxPage || 1;
        }
        this.render();
    }

    getCurrentPage() {
        return this.currentPage;
    }

    getTotalPages() {
        return this.totalPages;
    }

    getTotalItems() {
        return this.totalItems;
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.onPageChange = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pagination;
}