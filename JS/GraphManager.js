// # ---- Менеджер графа ---- #

class GraphManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.events = [];
        this.vertexWidth = 80;
        this.vertexHeight = 80;
        this.selectedEvent = null;
        this.connections = [];
        this.initContainer();
    }

    /**
     * Инициализирует контейнер графа
     */
    initContainer() {
        if (!this.container) {
            console.error('Контейнер графа не найден');
            return;
        }
        
        // Обработчики для drag & drop
        this.setupDragAndDrop();
    }

    /**
     * Добавляет мероприятие
     */
    addEvent(eventData) {
        const event = new Event(eventData);
        
        // Генерируем случайные координаты если не указаны
        if (!event.x || !event.y) {
            const rect = this.container.getBoundingClientRect();
            event.x = Math.random() * (rect.width - this.vertexWidth);
            event.y = Math.random() * (rect.height - this.vertexHeight);
        }
        
        this.events.push(event);
        this.renderEvent(event);
        this.renderAllConnections();
        
        return event;
    }

    /**
     * Удаляет мероприятие
     */
    removeEvent(eventId) {
        const index = this.events.findIndex(e => e.id == eventId);
        if (index === -1) return false;
        
        // Удаляем DOM-элемент
        const event = this.events[index];
        if (event.element) {
            event.element.remove();
        }
        
        // Удаляем из массива
        this.events.splice(index, 1);
        
        // Обновляем связи
        this.renderAllConnections();
        
        return true;
    }

    /**
     * Обновляет мероприятие
     */
    updateEvent(eventId, data) {
        const event = this.events.find(e => e.id == eventId);
        if (!event) return false;
        
        event.update(data);
        this.renderAllConnections();
        
        return true;
    }

    /**
     * Отображает мероприятие на графе
     */
    renderEvent(event) {
        const element = event.createElement();
        
        // Обработчик клика для выбора
        element.addEventListener('click', (e) => {
            // ПРОВЕРЯЕМ, НЕ ПОДСВЕЧЕНА ЛИ ВЕРШИНА
            if (element.classList.contains('highlighted')) {
                e.stopPropagation();
                return;
            }
            
            e.stopPropagation();
            this.selectEvent(event);
        });
        
        // Добавляем в контейнер
        this.container.appendChild(element);
        
        // Настраиваем перетаскивание
        this.setupEventDragging(event, element);
    }

    /**
     * Настраивает перетаскивание для мероприятия
     */
    setupEventDragging(event, element) {
        let isDragging = false;
        let offsetX, offsetY;
        
        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.offsetX;
            offsetY = e.offsetY;
            element.style.zIndex = '10';
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const containerRect = this.container.getBoundingClientRect();
            const x = e.clientX - containerRect.left - offsetX;
            const y = e.clientY - containerRect.top - offsetY;
            
            event.moveTo(x, y, {
                width: containerRect.width,
                height: containerRect.height
            });
            
            this.renderAllConnections();
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            element.style.zIndex = '1';
        });
    }

    /**
     * Отображает все связи между ВИДИМЫМИ мероприятиями
     */
    renderAllConnections() {
        this.clearConnections();
        
        // Получаем только видимые мероприятия
        const visibleEvents = this.events.filter(event => 
            event.element && event.element.style.display !== 'none'
        );
        
        // Рисуем связи только между видимыми мероприятиями
        for (let i = 0; i < visibleEvents.length; i++) {
            for (let j = i + 1; j < visibleEvents.length; j++) {
                this.drawConnection(visibleEvents[i], visibleEvents[j]);
            }
        }
    }

    /**
     * Рисует связь между двумя мероприятиями
     */
    drawConnection(event1, event2) {
        // ПРОВЕРЯЕМ, ВИДИМЫ ЛИ ОБЕ ВЕРШИНЫ
        if (!event1.element || !event2.element) return;
        if (event1.element.style.display === 'none' || event2.element.style.display === 'none') {
            return;
        }
        
        const connectionType = this.getConnectionType(event1, event2);
        if (!connectionType) return;
        
        const line = this.createConnectionLine(event1, event2, connectionType);
        this.container.appendChild(line);
        this.connections.push(line);
    }

    /**
     * Определяет тип связи
     */
    getConnectionType(event1, event2) {
        if (hasCommon(event1.tags, event2.tags)) {
            return 'tag';
        } else if (hasCommon(event1.errors, event2.errors)) {
            return 'error';
        }
        return null;
    }

    /**
     * Создает линию связи
     */
    createConnectionLine(event1, event2, type) {
        const rect1 = event1.element.getBoundingClientRect();
        const rect2 = event2.element.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const x1 = rect1.left - containerRect.left + rect1.width / 2;
        const y1 = rect1.top - containerRect.top + rect1.height / 2;
        const x2 = rect2.left - containerRect.left + rect2.width / 2;
        const y2 = rect2.top - containerRect.top + rect2.height / 2;
        
        const line = document.createElement('div');
        line.className = `line-connection ${type}`;
        
        const length = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        line.style.width = length + 'px';
        line.style.left = x1 + 'px';
        line.style.top = y1 + 'px';
        line.style.transform = `rotate(${angle}deg)`;
        
        // Добавляем подсказку со схожестью
        line.title = `Схожесть: ${event1.calculateSimilarity(event2).toFixed(2)}`;
        
        return line;
    }

    /**
     * Очищает все связи
     */
    clearConnections() {
        this.connections.forEach(line => line.remove());
        this.connections = [];
    }

    /**
     * Выбирает мероприятие
     */
    selectEvent(event) {
        this.selectedEvent = event;
        
        // Генерируем событие выбора
        const selectEvent = new CustomEvent('eventSelected', {
            detail: { event }
        });
        document.dispatchEvent(selectEvent);
    }

    /**
     * Получает выбранное мероприятие
     */
    getSelectedEvent() {
        return this.selectedEvent;
    }

    /**
     * Фильтрует мероприятия
     */
    filterEvents(filter) {
        this.events.forEach(event => {
            const matches = event.matchesFilter(filter);
            if (event.element) {
                event.element.style.display = matches ? 'block' : 'none';
            }
        });
        
        // Перерисовываем связи с учетом фильтра
        this.renderFilteredConnections(filter);
    }

    /**
     * Отображает только связи между видимыми мероприятиями
     */
    renderFilteredConnections(filter) {
        this.clearConnections();
        
        // Получаем только видимые мероприятия
        const visibleEvents = this.events.filter(event => {
            if (!event.element) return false;
            return event.element.style.display !== 'none';
        });
        
        // Рисуем связи только между видимыми мероприятиями
        for (let i = 0; i < visibleEvents.length; i++) {
            for (let j = i + 1; j < visibleEvents.length; j++) {
                const event1 = visibleEvents[i];
                const event2 = visibleEvents[j];
                
                // Проверяем, должны ли быть связаны эти мероприятия
                const connectionType = this.getConnectionType(event1, event2);
                if (connectionType) {
                    this.drawConnection(event1, event2);
                }
            }
        }
    }

    /**
     * Получает все мероприятия
     */
    getAllEvents() {
        return this.events;
    }

    /**
     * Находит мероприятие по ID
     */
    getEventById(id) {
        return this.events.find(e => e.id == id);
    }

    /**
     * Настройка обработчиков для контейнера
     */
    setupDragAndDrop() {
        // Клик по пустому месту сбрасывает выбор
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.selectedEvent = null;
                const deselectEvent = new CustomEvent('eventDeselected');
                document.dispatchEvent(deselectEvent);
            }
        });
    }
}