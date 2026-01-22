import { SimilarityCalculator } from './SimilarityCalculator.js';
import { getSimilarityClass } from './utils.js';

// # ---- Система рекомендаций ---- #

export class RecommendationSystem {
    constructor(graphManager) {
        this.graphManager = graphManager;
        this.recommendationsSidebar = document.getElementById('recommendations-sidebar');
        this.recommendationsList = document.getElementById('recommendations-list');
        this.init();
    }

    /**
     * Инициализирует систему рекомендаций
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Настраивает обработчики событий
     */
    setupEventListeners() {
        // Кнопка показа рекомендаций
        document.getElementById('show-recommendations')?.addEventListener('click', () => {
            this.showRecommendations();
        });

        // Кнопка закрытия сайдбара рекомендаций
        document.getElementById('close-recommendations')?.addEventListener('click', () => {
            this.hideRecommendations();
        });

        // Событие выбора мероприятия
        document.addEventListener('eventSelected', (e) => {
            this.updateEventInfo(e.detail.event);
        });
    }

    /**
     * Показывает рекомендации
     */
    showRecommendations() {
        const selectedEvent = this.graphManager.getSelectedEvent();
        const allEvents = this.graphManager.getAllEvents();
        
        if (allEvents.length < 2) {
            alert('Добавьте хотя бы два мероприятия для получения рекомендаций');
            return;
        }
        
        let recommendations;
        
        if (selectedEvent) {
            // Рекомендации для выбранного мероприятия
            recommendations = SimilarityCalculator.getRecommendations(selectedEvent, allEvents);
        } else {
            // Общие рекомендации (все пары)
            const similarities = SimilarityCalculator.calculateAllSimilarities(allEvents);
            recommendations = similarities.slice(0, 5).map(sim => ({
                event: sim.event2,
                similarity: sim.similarity,
                details: {
                    tagSimilarity: sim.event1.calculateTagSimilarity(sim.event2),
                    budgetSimilarity: sim.event1.calculateBudgetSimilarity(sim.event2),
                    dateSimilarity: sim.event1.calculateDateSimilarity(sim.event2),
                    participantsSimilarity: sim.event1.calculateParticipantsSimilarity(sim.event2)
                }
            }));
        }
        
        this.renderRecommendations(recommendations, selectedEvent);
        this.recommendationsSidebar.classList.add('open');
    }

    /**
     * Скрывает рекомендации
     */
    hideRecommendations() {
        this.recommendationsSidebar.classList.remove('open');
    }

    /**
     * Обновляет информацию о мероприятии в сайдбаре
     */
    updateEventInfo(event) {
        if (!event) return;
        
        const infoSidebar = document.getElementById('info-sidebar');
        if (!infoSidebar) return;
        
        const infoData = event.getInfoData();
        
        document.getElementById('info-title').textContent = infoData.title;
        document.getElementById('info-tags').textContent = infoData.tags;
        document.getElementById('info-errors').textContent = infoData.errors;
        document.getElementById('info-contacts').textContent = infoData.contacts;
        document.getElementById('info-budget').textContent = infoData.budget;
        document.getElementById('info-date').textContent = infoData.date;
        document.getElementById('info-participants').textContent = infoData.participants;
        
        // Рассчитываем схожесть с другими мероприятиями
        const allEvents = this.graphManager.getAllEvents();
        const otherEvents = allEvents.filter(e => e.id !== event.id);
        
        if (otherEvents.length > 0) {
            const similarities = otherEvents.map(e => event.calculateSimilarity(e));
            const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
            const similarityClass = getSimilarityClass(avgSimilarity);
            
            document.getElementById('info-similarity').textContent = 
                `${similarityClass.label} (${avgSimilarity.toFixed(2)})`;
            document.getElementById('info-similarity').className = `similarity-indicator ${similarityClass.className}`;
        }
        
        infoSidebar.dataset.vertexId = event.id;
        infoSidebar.classList.add('open');
    }

    /**
     * Отображает рекомендации
     */
    renderRecommendations(recommendations, sourceEvent = null) {
        this.recommendationsList.innerHTML = '';
        
        if (recommendations.length === 0) {
            this.recommendationsList.innerHTML = '<p>Рекомендации не найдены</p>';
            return;
        }
        
        recommendations.forEach((rec, index) => {
            const card = this.createRecommendationCard(rec, sourceEvent, index + 1);
            this.recommendationsList.appendChild(card);
        });
    }

    /**
     * Создает карточку рекомендации
     */
    createRecommendationCard(recommendation, sourceEvent, rank) {
        const event = recommendation.event;
        const similarity = recommendation.similarity;
        const simClass = getSimilarityClass(similarity);
        
        const card = document.createElement('div');
        card.className = `recommendation-card ${simClass.className}`;
        
        // Заголовок с рейтингом
        const title = document.createElement('div');
        title.className = 'recommendation-title';
        title.textContent = `${rank}. ${event.title}`;
        
        // Индикатор схожести
        const similarityBadge = document.createElement('div');
        similarityBadge.className = `recommendation-similarity ${simClass.className}`;
        similarityBadge.textContent = `Схожесть: ${similarity.toFixed(2)}`;
        
        // Детали мероприятия
        const meta = document.createElement('div');
        meta.className = 'recommendation-meta';
        meta.innerHTML = `
            <div>💰 Бюджет: ${event.budget.toLocaleString()} ₽</div>
            <div>📅 Дата: ${event.date ? new Date(event.date).toLocaleDateString('ru-RU') : 'Не указана'}</div>
            <div>👥 Участники: ${event.participants} чел.</div>
        `;
        
        // Детали схожести
        const details = document.createElement('div');
        details.className = 'recommendation-details';
        details.innerHTML = `
            <div>🏷️ Теги: ${recommendation.details.tagSimilarity.toFixed(2)}</div>
            <div>💰 Бюджет: ${recommendation.details.budgetSimilarity.toFixed(2)}</div>
            <div>📅 Дата: ${recommendation.details.dateSimilarity.toFixed(2)}</div>
            <div>👥 Участники: ${recommendation.details.participantsSimilarity.toFixed(2)}</div>
        `;
        
        // Теги
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'recommendation-tags';
        event.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'recommendation-tag';
            tagEl.textContent = tag;
            tagsContainer.appendChild(tagEl);
        });
        
        // Кнопка выбора
        const selectBtn = document.createElement('button');
        selectBtn.className = 'btn in-box';
        selectBtn.textContent = 'Выбрать';
        selectBtn.addEventListener('click', () => {
            this.graphManager.selectEvent(event);
            this.hideRecommendations();
        });
        
        // Собираем карточку
        card.appendChild(title);
        card.appendChild(similarityBadge);
        card.appendChild(meta);
        card.appendChild(details);
        card.appendChild(tagsContainer);
        card.appendChild(selectBtn);
        
        return card;
    }

    /**
     * Показывает группировку мероприятий
     */
    showEventGroups() {
        const allEvents = this.graphManager.getAllEvents();
        const groups = SimilarityCalculator.groupBySimilarity(allEvents);
        
        this.recommendationsList.innerHTML = '<h4>Группы схожих мероприятий</h4>';
        
        groups.forEach((group, groupIndex) => {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            groupCard.innerHTML = `
                <h5>Группа ${groupIndex + 1} (схожесть: ${group.avgSimilarity.toFixed(2)})</h5>
            `;
            
            group.events.forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = 'group-event';
                eventEl.textContent = event.title;
                eventEl.addEventListener('click', () => {
                    this.graphManager.selectEvent(event);
                });
                groupCard.appendChild(eventEl);
            });
            
            this.recommendationsList.appendChild(groupCard);
        });
        
        this.recommendationsSidebar.classList.add('open');
    }
}