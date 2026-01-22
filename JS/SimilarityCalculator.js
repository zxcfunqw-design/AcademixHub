// # ---- Калькулятор схожести мероприятий ---- #

class SimilarityCalculator {
    /**
     * Рассчитывает схожесть между всеми парами мероприятий
     */
    static calculateAllSimilarities(events) {
        const similarities = [];
        
        for (let i = 0; i < events.length; i++) {
            for (let j = i + 1; j < events.length; j++) {
                const similarity = events[i].calculateSimilarity(events[j]);
                similarities.push({
                    event1: events[i],
                    event2: events[j],
                    similarity: similarity,
                    type: this.getConnectionType(events[i], events[j])
                });
            }
        }
        
        return similarities.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Получает рекомендации для конкретного мероприятия
     */
    static getRecommendations(targetEvent, allEvents, limit = null) {
        const otherEvents = allEvents.filter(event => event.id !== targetEvent.id);
        
        const recommendations = otherEvents.map(event => {
            const similarity = targetEvent.calculateSimilarity(event);
            return {
                event: event,
                similarity: similarity,
                details: {
                    tagSimilarity: targetEvent.calculateTagSimilarity(event),
                    budgetSimilarity: targetEvent.calculateBudgetSimilarity(event),
                    dateSimilarity: targetEvent.calculateDateSimilarity(event),
                    participantsSimilarity: targetEvent.calculateParticipantsSimilarity(event)
                }
            };
        });
        
        const sorted = recommendations.sort((a, b) => b.similarity - a.similarity);
        
        return limit ? sorted.slice(0, limit) : sorted;
    }

    /**
     * Определяет тип связи между мероприятиями
     */
    static getConnectionType(event1, event2) {
        // Используем глобальную функцию hasCommon из utils.js
        if (window.hasCommon && window.hasCommon(event1.tags, event2.tags)) {
            return 'tag';
        } else if (window.hasCommon && window.hasCommon(event1.errors, event2.errors)) {
            return 'error';
        }
        return null;
    }

    /**
     * Группирует мероприятия по схожести
     */
    static groupBySimilarity(events, threshold = 1.0) {
        const groups = [];
        const visited = new Set();
        
        events.forEach((event, index) => {
            if (visited.has(event.id)) return;
            
            const group = [event];
            visited.add(event.id);
            
            // Ищем похожие мероприятия
            events.forEach((otherEvent, otherIndex) => {
                if (index === otherIndex || visited.has(otherEvent.id)) return;
                
                const similarity = event.calculateSimilarity(otherEvent);
                if (similarity >= threshold) {
                    group.push(otherEvent);
                    visited.add(otherEvent.id);
                }
            });
            
            if (group.length > 0) {
                groups.push({
                    events: group,
                    avgSimilarity: this.calculateGroupSimilarity(group)
                });
            }
        });
        
        return groups.sort((a, b) => b.avgSimilarity - a.avgSimilarity);
    }

    /**
     * Рассчитывает среднюю схожесть в группе
     */
    static calculateGroupSimilarity(group) {
        if (group.length < 2) return 2;
        
        let totalSimilarity = 0;
        let pairCount = 0;
        
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                totalSimilarity += group[i].calculateSimilarity(group[j]);
                pairCount++;
            }
        }
        
        return totalSimilarity / pairCount;
    }

    /**
     * Рассчитывает топ N самых похожих мероприятий
     */
    static getTopSimilarEvents(events, topN = 3) {
        if (events.length < 2) return [];
        
        const allSimilarities = this.calculateAllSimilarities(events);
        
        // Собираем схожесть для каждого события
        const eventSimilarities = new Map();
        
        allSimilarities.forEach(sim => {
            // Для event1
            if (!eventSimilarities.has(sim.event1.id)) {
                eventSimilarities.set(sim.event1.id, {
                    event: sim.event1,
                    similarities: []
                });
            }
            eventSimilarities.get(sim.event1.id).similarities.push(sim.similarity);
            
            // Для event2
            if (!eventSimilarities.has(sim.event2.id)) {
                eventSimilarities.set(sim.event2.id, {
                    event: sim.event2,
                    similarities: []
                });
            }
            eventSimilarities.get(sim.event2.id).similarities.push(sim.similarity);
        });
        
        // Рассчитываем среднюю схожесть для каждого
        const results = Array.from(eventSimilarities.values()).map(item => {
            const avgSimilarity = item.similarities.reduce((a, b) => a + b, 0) / item.similarities.length;
            return {
                event: item.event,
                avgSimilarity: avgSimilarity
            };
        });
        
        // Сортируем и возвращаем топ N
        return results
            .sort((a, b) => b.avgSimilarity - a.avgSimilarity)
            .slice(0, topN);
    }
}