/**
 * Admin Card Component
 * Renders website cards with edit and delete functionality
 */
class AdminCard {
    constructor(data) {
        this.data = data;
        this.element = null;
    }

    render() {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.dataset.serial = this.data.serial;
        card.dataset.category = this.data.category;
        card.dataset.sheetName = this.data.sheetName;

        const imageUrl = this.data.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%23999" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${this.data.name}" class="admin-card-image" loading="lazy">
            <div class="admin-card-content">
                <div class="admin-card-header">
                    <h3 class="admin-card-title">${this.escapeHtml(this.data.name)}</h3>
                    <div class="admin-card-meta">
                        <span class="admin-card-category">${this.escapeHtml(this.data.category)}</span>
                        <span class="admin-card-date">${this.formatDate(this.data.date, this.data.time)}</span>
                    </div>
                </div>
                <p class="admin-card-description">${this.escapeHtml(this.data.description)}</p>
                <div class="admin-card-actions">
                    <a href="${this.data.url}" target="_blank" class="admin-card-url" onclick="event.stopPropagation()">
                        Visit Site
                    </a>
                    <button class="admin-card-edit" onclick="event.stopPropagation(); window.adminApp.handleEditEntry('${this.data.sheetName}', ${this.data.serial})">
                        Edit
                    </button>
                    <button class="admin-card-delete" onclick="event.stopPropagation(); window.adminApp.handleDeleteEntry('${this.data.sheetName}', ${this.data.serial}, '${this.data.imageFileId || ''}')">
                        Delete
                    </button>
                </div>
            </div>
        `;

        // Add click event for opening detail modal (optional)
        card.addEventListener('click', () => this.onClick());

        this.element = card;
        return card;
    }

    onClick() {
        // Emit custom event for the app to handle
        const event = new CustomEvent('adminCardClick', {
            detail: this.data
        });
        document.dispatchEvent(event);
    }

    formatDate(date, time) {
        if (!date) return '';
        
        try {
            const dateObj = new Date(date + ' ' + (time || ''));
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return date;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    update(data) {
        this.data = data;
        if (this.element) {
            const newCard = this.render();
            this.element.replaceWith(newCard);
            this.element = newCard;
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Admin Card Factory
class AdminCardFactory {
    static createCards(dataArray) {
        return dataArray.map(data => new AdminCard(data));
    }

    static renderCards(container, cards) {
        container.innerHTML = '';
        cards.forEach(card => {
            container.appendChild(card.render());
        });
    }

    static updateCards(container, cards) {
        const existingCards = Array.from(container.children);
        
        // Remove excess cards
        if (existingCards.length > cards.length) {
            for (let i = cards.length; i < existingCards.length; i++) {
                existingCards[i].remove();
            }
        }
        
        // Update or add cards
        cards.forEach((card, index) => {
            if (existingCards[index]) {
                // Update existing card
                const newCard = card.render();
                existingCards[index].replaceWith(newCard);
            } else {
                // Add new card
                container.appendChild(card.render());
            }
        });
    }
}

// Category Item Component
class CategoryItem {
    constructor(data) {
        this.data = data;
        this.element = null;
    }

    render() {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.dataset.name = this.data.name;

        item.innerHTML = `
            <div class="category-info">
                <span class="category-name">${this.escapeHtml(this.data.name)}</span>
                <span class="category-date">${this.formatDate(this.data.date, this.data.time)}</span>
            </div>
            <div class="category-actions">
                <button class="btn btn-secondary btn-sm" onclick="window.adminApp.handleEditCategory('${this.escapeHtml(this.data.name)}')">
                    Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="window.adminApp.handleDeleteCategory('${this.escapeHtml(this.data.name)}')">
                    Delete
                </button>
            </div>
        `;

        this.element = item;
        return item;
    }

    formatDate(date, time) {
        if (!date) return '';
        
        try {
            const dateObj = new Date(date + ' ' + (time || ''));
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return date;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    update(data) {
        this.data = data;
        if (this.element) {
            const newItem = this.render();
            this.element.replaceWith(newItem);
            this.element = newItem;
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Category Item Factory
class CategoryItemFactory {
    static createCategoryItems(dataArray) {
        return dataArray.map(data => new CategoryItem(data));
    }

    static renderCategoryItems(container, items) {
        container.innerHTML = '';
        items.forEach(item => {
            container.appendChild(item.render());
        });
    }

    static updateCategoryItems(container, items) {
        const existingItems = Array.from(container.children);
        
        // Remove excess items
        if (existingItems.length > items.length) {
            for (let i = items.length; i < existingItems.length; i++) {
                existingItems[i].remove();
            }
        }
        
        // Update or add items
        items.forEach((item, index) => {
            if (existingItems[index]) {
                // Update existing item
                const newItem = item.render();
                existingItems[index].replaceWith(newItem);
            } else {
                // Add new item
                container.appendChild(item.render());
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminCard, AdminCardFactory, CategoryItem, CategoryItemFactory };
}