/**
 * Card Component
 * Renders individual website cards in the showcase
 */
class Card {
    constructor(data) {
        this.data = data;
        this.element = null;
    }

    render() {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.serial = this.data.serial;
        card.dataset.category = this.data.category;

        const imageUrl = this.data.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%23999" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
        
        card.innerHTML = `
            <div class="card-image-container">
                <img src="${imageUrl}" alt="${this.data.name}" class="card-image" loading="lazy">
            </div>
            <div class="card-content">
                <div class="card-header">
                    <h3 class="card-title">${this.escapeHtml(this.data.name)}</h3>
                    <span class="card-category">${this.escapeHtml(this.data.category)}</span>
                </div>
                <p class="card-description">${this.escapeHtml(this.data.description)}</p>
                <div class="card-footer">
                    <span class="card-date">${this.formatDate(this.data.date, this.data.time)}</span>
                    <a href="${this.data.url}" target="_blank" class="card-visit-btn" onclick="event.stopPropagation()">
                        Visit
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15,3 21,3 21,9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                </div>
            </div>
        `;

        // Add click event for opening detail modal
        card.addEventListener('click', () => this.onClick());

        this.element = card;
        return card;
    }

    onClick() {
        // Emit custom event for the app to handle
        const event = new CustomEvent('cardClick', {
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

// Card Factory for creating multiple cards
class CardFactory {
    static createCards(dataArray) {
        return dataArray.map(data => new Card(data));
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Card, CardFactory };
}