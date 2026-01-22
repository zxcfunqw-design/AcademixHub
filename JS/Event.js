// # ---- Класс мероприятия ---- #

class Event {
    constructor(data) {
        this.id = data.id || Date.now() + Math.random();
        this.title = data.title || 'Новое мероприятие';
        this.tags = Array.isArray(data.tags) ? data.tags : parseTags(data.tags || '');
        this.errors = Array.isArray(data.errors) ? data.errors : parseTags(data.errors || '');
        this.contacts = data.contacts || '';
        
        // # ---- Новые метаданные ---- #
        this.budget = parseInt(data.budget) || 0;
        this.date = data.date || '';
        this.participants = parseInt(data.participants) || 1;
        
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.element = null;
        this.connections = [];
    }

    /**
     * Обновляет данные мероприятия
     */
    update(data) {
        if (data.title !== undefined) this.title = data.title;
        if (data.tags !== undefined) {
            this.tags = Array.isArray(data.tags) ? data.tags : parseTags(data.tags || '');
        }
        if (data.errors !== undefined) {
            this.errors = Array.isArray(data.errors) ? data.errors : parseTags(data.errors || '');
        }
        if (data.contacts !== undefined) this.contacts = data.contacts;
        if (data.budget !== undefined) this.budget = parseInt(data.budget) || 0;
        if (data.date !== undefined) this.date = data.date;
        if (data.participants !== undefined) this.participants = parseInt(data.participants) || 1;
        
        if (this.element) {
            this.element.textContent = this.title;
        }
    }

    /**
     * Рассчитывает схожесть с другим мероприятием
     */
    calculateSimilarity(otherEvent) {
        // Схожесть по тегам
        const tagSimilarity = this.calculateTagSimilarity(otherEvent);
        
        // Схожесть по бюджету
        const budgetSimilarity = this.calculateBudgetSimilarity(otherEvent);
        
        // Схожесть по датам
        const dateSimilarity = this.calculateDateSimilarity(otherEvent);
        
        // Схожесть по количеству участников
        const participantsSimilarity = this.calculateParticipantsSimilarity(otherEvent);
        
        // Используем среднеквадратичное среднее для лучшего баланса
        const similarities = [tagSimilarity, budgetSimilarity, dateSimilarity, participantsSimilarity];
        const sumOfSquares = similarities.reduce((sum, val) => sum + val * val, 0);
        
        return Math.sqrt(sumOfSquares / similarities.length);
    }

    /**
     * Схожесть по тегам (на основе общих тегов)
     */
    calculateTagSimilarity(otherEvent) {
        const commonTags = this.tags.filter(tag => otherEvent.tags.includes(tag)).length;
        const totalTags = new Set([...this.tags, ...otherEvent.tags]).size;
        
        if (totalTags === 0) return 1; // нейтральное значение если нет тегов
        
        return (commonTags / totalTags) * 2;
    }

// В Event.js замените методы:

    /**
     * Схожесть по бюджету
     */
    calculateBudgetSimilarity(otherEvent) {
        return calculateSimilarityValue(this.budget, otherEvent.budget);
    }

    /**
     * Схожесть по датам
     */
    calculateDateSimilarity(otherEvent) {
        return calculateDateSimilarity(this.date, otherEvent.date);
    }

    /**
     * Схожесть по количеству участников
     */
    calculateParticipantsSimilarity(otherEvent) {
        return calculateSimilarityValue(this.participants, otherEvent.participants);
    }

    /**
     * Возвращает данные для отображения в сайдбаре
     */
    getInfoData() {
        return {
            title: this.title,
            tags: this.tags.join(', '),
            errors: this.errors.join(', '),
            contacts: this.contacts,
            budget: `${formatNumber(this.budget, 'KZT')}`, // Изменено с ₽ на ₸
            date: formatDate(this.date),
            participants: `${formatNumber(this.participants)} чел.`
        };
    }

    /**
     * Проверяет, соответствует ли мероприятие фильтру
     */
    matchesFilter(filter) {
        if (!filter) return true;
        
        // Фильтр по тегу
        if (filter.tag) {
            const normTag = normalizeTag(filter.tag);
            if (!this.tags.some(tag => tag.toLowerCase().includes(normTag.toLowerCase()))) {
                return false;
            }
        }
        
        // Фильтр по бюджету
        if (filter.maxBudget && this.budget > filter.maxBudget) {
            return false;
        }
        
        // Фильтр по дате
        if (filter.date) {
            const filterDate = new Date(filter.date);
            const eventDate = new Date(this.date);
            if (this.date && eventDate < filterDate) {
                return false;
            }
        }
        
        // Фильтр по участникам
        if (filter.minParticipants && this.participants < filter.minParticipants) {
            return false;
        }
        
        return true;
    }

    /**
     * Создает DOM-элемент для мероприятия
     */
    createElement() {
        const div = document.createElement('div');
        div.classList.add('vertex');
        div.style.left = this.x + 'px';
        div.style.top = this.y + 'px';
        div.textContent = this.title;
        div.dataset.eventId = this.id;
        
        this.element = div;
        return div;
    }

    /**
     * Перемещает мероприятие
     */
    moveTo(x, y, container) {
        this.x = Math.max(0, Math.min(x, container.width - 80));
        this.y = Math.max(0, Math.min(y, container.height - 80));
        
        if (this.element) {
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
        }
    }
}