// # ---- Главный файл приложения ---- #

document.addEventListener('DOMContentLoaded', () => {
    console.log('DNA Engine загружается...');
    
    let graphManager = null;
    let currentUser = null;
    
    try {
        // Инициализируем менеджер графа
        graphManager = new GraphManager('graph-box');
        
        // Загружаем данные из localStorage
        loadFromLocalStorage();
        
        // Настраиваем обработчики событий
        setupEventListeners();
        
        console.log('DNA Engine успешно загружен');
        
    } catch (error) {
        console.error('Ошибка при загрузке приложения:', error);
        alert('Произошла ошибка при загрузке приложения. Пожалуйста, проверьте консоль для подробностей.');
    }
    
    // # ---- Функции ---- #
    
    function setupEventListeners() {
        // Кнопки добавления/редактирования
        document.getElementById('open-card')?.addEventListener('click', showAddEventForm);
        document.getElementById('close-card')?.addEventListener('click', hideAddEventForm);
        document.getElementById('create-vertex')?.addEventListener('click', createEvent);
        document.getElementById('edit-vertex')?.addEventListener('click', showEditEventForm);
        document.getElementById('save-vertex')?.addEventListener('click', saveEvent);
        document.getElementById('close-edit')?.addEventListener('click', hideEditEventForm);
        document.getElementById('delete-vertex')?.addEventListener('click', deleteEvent);
        document.getElementById('close-info')?.addEventListener('click', hideInfoSidebar);
        
        // Рекомендации
        document.getElementById('show-recommendations')?.addEventListener('click', showRecommendations);
        document.getElementById('close-recommendations')?.addEventListener('click', hideRecommendations);
        
        // Фильтры
        document.getElementById('tag-filter')?.addEventListener('input', applyFilters);
        document.getElementById('budget-filter')?.addEventListener('change', applyFilters);
        document.getElementById('date-filter')?.addEventListener('change', applyFilters);
        document.getElementById('participants-filter')?.addEventListener('change', applyFilters);
        
        // Авторизация
        document.getElementById('open-auth')?.addEventListener('click', showAuthForm);
        document.getElementById('close-auth')?.addEventListener('click', hideAuthForm);
        document.getElementById('toggle-auth')?.addEventListener('click', toggleAuthForms);
        document.getElementById('register-btn')?.addEventListener('click', registerUser);
        document.getElementById('login-btn')?.addEventListener('click', loginUser);
        
        // Событие выбора мероприятия
        document.addEventListener('eventSelected', handleEventSelected);
    }
    
    function showAddEventForm() {
        document.getElementById('card-overlay').style.display = 'flex';
        // Устанавливаем сегодняшнюю дату по умолчанию
        document.getElementById('vertex-date').value = new Date().toISOString().split('T')[0];
    }
    
    function hideAddEventForm() {
        document.getElementById('card-overlay').style.display = 'none';
    }
    
    function createEvent() {
        const title = document.getElementById('vertex-title').value.trim();
        const tags = document.getElementById('vertex-tags').value;
        const errors = document.getElementById('vertex-errors').value;
        const contacts = document.getElementById('vertex-contacts').value.trim();
        const budget = document.getElementById('vertex-budget').value;
        const date = document.getElementById('vertex-date').value;
        const participants = document.getElementById('vertex-participants').value;
        
        if (isEmpty(title)) {
            alert('Название мероприятия не может быть пустым!');
            return;
        }
        
        const eventData = {
            title,
            tags,
            errors,
            contacts,
            budget,
            date,
            participants
        };
        
        graphManager.addEvent(eventData);
        saveToLocalStorage();
        hideAddEventForm();
        clearAddEventForm();
    }
    
    function clearAddEventForm() {
        document.getElementById('vertex-title').value = '';
        document.getElementById('vertex-tags').value = '';
        document.getElementById('vertex-errors').value = '';
        document.getElementById('vertex-contacts').value = '';
        document.getElementById('vertex-budget').value = '0';
        document.getElementById('vertex-date').value = '';
        document.getElementById('vertex-participants').value = '1';
    }
    
    function handleEventSelected(e) {
        const event = e.detail.event;
        updateEventInfo(event);
    }
    
    function updateEventInfo(event) {
        if (!event) return;
        
        const infoData = event.getInfoData();
        
        document.getElementById('info-title').textContent = infoData.title;
        document.getElementById('info-tags').textContent = infoData.tags;
        document.getElementById('info-errors').textContent = infoData.errors;
        document.getElementById('info-contacts').textContent = infoData.contacts;
        document.getElementById('info-budget').textContent = infoData.budget;
        document.getElementById('info-date').textContent = infoData.date;
        document.getElementById('info-participants').textContent = infoData.participants;
        
        // Рассчитываем среднюю схожесть с другими мероприятиями
        const allEvents = graphManager.getAllEvents();
        const otherEvents = allEvents.filter(e => e.id !== event.id);
        
        if (otherEvents.length > 0) {
            const similarities = otherEvents.map(e => event.calculateSimilarity(e));
            const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
            const similarityClass = getSimilarityClass(avgSimilarity);
            
            const similarityElement = document.getElementById('info-similarity');
            similarityElement.textContent = `${similarityClass.label} (${avgSimilarity.toFixed(2)})`;
            similarityElement.className = `similarity-indicator ${similarityClass.className}`;
        }
        
        const infoSidebar = document.getElementById('info-sidebar');
        infoSidebar.dataset.vertexId = event.id;
        infoSidebar.classList.add('open');
    }
    
    function showEditEventForm() {
        const infoSidebar = document.getElementById('info-sidebar');
        const vertexId = infoSidebar.dataset.vertexId;
        
        if (!vertexId) return;
        
        const event = graphManager.getEventById(vertexId);
        if (!event) return;
        
        document.getElementById('edit-vertex-title').value = event.title;
        document.getElementById('edit-vertex-tags').value = event.tags.join(', ');
        document.getElementById('edit-vertex-errors').value = event.errors.join(', ');
        document.getElementById('edit-vertex-contacts').value = event.contacts;
        document.getElementById('edit-vertex-budget').value = event.budget;
        document.getElementById('edit-vertex-date').value = event.date;
        document.getElementById('edit-vertex-participants').value = event.participants;
        
        document.getElementById('edit-overlay').style.display = 'flex';
    }
    
    function hideEditEventForm() {
        document.getElementById('edit-overlay').style.display = 'none';
    }
    
    function saveEvent() {
        const infoSidebar = document.getElementById('info-sidebar');
        const vertexId = infoSidebar.dataset.vertexId;
        
        if (!vertexId) return;
        
        const updateData = {
            title: document.getElementById('edit-vertex-title').value,
            tags: document.getElementById('edit-vertex-tags').value,
            errors: document.getElementById('edit-vertex-errors').value,
            contacts: document.getElementById('edit-vertex-contacts').value,
            budget: document.getElementById('edit-vertex-budget').value,
            date: document.getElementById('edit-vertex-date').value,
            participants: document.getElementById('edit-vertex-participants').value
        };
        
        if (graphManager.updateEvent(vertexId, updateData)) {
            saveToLocalStorage();
            hideEditEventForm();
            // Обновляем информацию в сайдбаре
            const event = graphManager.getEventById(vertexId);
            updateEventInfo(event);
        }
    }
    
    function deleteEvent() {
        const infoSidebar = document.getElementById('info-sidebar');
        const vertexId = infoSidebar.dataset.vertexId;
        
        if (!vertexId) return;
        
        if (confirm('Вы уверены, что хотите удалить это мероприятие?')) {
            if (graphManager.removeEvent(vertexId)) {
                saveToLocalStorage();
                hideInfoSidebar();
            }
        }
    }
    
    function hideInfoSidebar() {
        document.getElementById('info-sidebar').classList.remove('open');
    }
    
    function applyFilters() {
        const tagFilter = document.getElementById('tag-filter').value.trim();
        const budgetFilter = document.getElementById('budget-filter').value;
        const dateFilter = document.getElementById('date-filter').value;
        const participantsFilter = document.getElementById('participants-filter').value;
        
        const filter = {
            tag: tagFilter || null,
            maxBudget: budgetFilter ? parseInt(budgetFilter) : null,
            date: dateFilter || null,
            minParticipants: participantsFilter ? parseInt(participantsFilter) : null
        };
        
        graphManager.clearConnections();
        
        // Применяем фильтр к вершинам
        graphManager.events.forEach(event => {
            const matches = event.matchesFilter(filter);
            if (event.element) {
                event.element.style.display = matches ? 'block' : 'none';
            }
        });
        
        graphManager.renderAllConnections();
    }
    
    function showRecommendations() {
        const selectedEvent = graphManager.getSelectedEvent();
        const allEvents = graphManager.getAllEvents();
        
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
        
        renderRecommendations(recommendations, selectedEvent);
        document.getElementById('recommendations-sidebar').classList.add('open');
    }
    
    function renderRecommendations(recommendations, sourceEvent = null) {
        const recommendationsList = document.getElementById('recommendations-list');
        recommendationsList.innerHTML = '';
        
        if (recommendations.length === 0) {
            recommendationsList.innerHTML = '<p>Рекомендации не найдены</p>';
            return;
        }
        
        recommendations.forEach((rec, index) => {
            const card = createRecommendationCard(rec, sourceEvent, index + 1);
            recommendationsList.appendChild(card);
        });
    }
    
    function createRecommendationCard(recommendation, sourceEvent, rank) {
        const event = recommendation.event;
        const similarity = recommendation.similarity;
        const simClass = getSimilarityClass(similarity);
        
        const card = document.createElement('div');
        card.className = `recommendation-card ${simClass.className}`;
        
        // Детали схожести по каждому параметру
        const detailsHTML = `
            <div class="similarity-details">
                <small>🏷️ Теги: ${(recommendation.details.tagSimilarity).toFixed(2)}</small><br>
                <small>💰 Бюджет: ${(recommendation.details.budgetSimilarity).toFixed(2)}</small><br>
                <small>📅 Дата: ${(recommendation.details.dateSimilarity).toFixed(2)}</small><br>
                <small>👥 Участники: ${(recommendation.details.participantsSimilarity).toFixed(2)}</small>
            </div>
        `;
        
        card.innerHTML = `
            <div class="recommendation-title">${rank}. ${event.title}</div>
            <div class="recommendation-similarity ${simClass.className}">
                Общая схожесть: ${similarity.toFixed(2)}
            </div>
            <div class="recommendation-meta">
                <div>💰 Бюджет: ${formatNumber(event.budget)}</div>
                <div>📅 Дата: ${formatDate(event.date)}</div>
                <div>👥 Участники: ${formatNumber(event.participants)} чел.</div>
            </div>
            ${detailsHTML}
            <div class="recommendation-tags">
                ${event.tags.map(tag => `<span class="recommendation-tag">${tag}</span>`).join('')}
            </div>
            <button class="btn in-box select-btn">Выбрать и подсветить</button>
        `;
        
        card.querySelector('.select-btn').addEventListener('click', () => {
            graphManager.selectEvent(event);
            highlightVertex(event.id, 'recommendation');
            hideRecommendations();
        });
        
        return card;
    }

    /**
     * Подсвечивает вершину на 3-4 секунды
     * @param {string} eventId - ID мероприятия
     * @param {string} type - Тип подсветки (рекомендация, тег, ошибка и т.д.)
     */
    function highlightVertex(eventId, type = 'recommendation') {
        const event = graphManager.getEventById(eventId);
        if (!event || !event.element) return;
        
        const vertex = event.element;
        
        // Удаляем предыдущую подсветку если есть
        vertex.classList.remove('highlighted', 'tag', 'error', 'recommendation');
        
        // Добавляем классы подсветки
        vertex.classList.add('highlighted', type);
        vertex.style.zIndex = '100';
        
        // Убираем подсветку через 3.5 секунды
        setTimeout(() => {
            vertex.classList.remove('highlighted', type);
            vertex.style.zIndex = '1';
        }, 3500);
    }
    
    function hideRecommendations() {
        document.getElementById('recommendations-sidebar').classList.remove('open');
    }
    
    function showAuthForm() {
        document.getElementById('auth-overlay').style.display = 'flex';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('auth-title').querySelector('span').textContent = 'Войти';
        document.getElementById('toggle-auth').textContent = '→';
    }
    
    function hideAuthForm() {
        document.getElementById('auth-overlay').style.display = 'none';
    }
    
    function toggleAuthForms() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authTitleText = document.getElementById('auth-title').querySelector('span');
        const toggleAuthBtn = document.getElementById('toggle-auth');
        
        if (loginForm.style.display !== 'none') {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            authTitleText.textContent = 'Регистрация';
            toggleAuthBtn.textContent = '←';
        } else {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            authTitleText.textContent = 'Войти';
            toggleAuthBtn.textContent = '→';
        }
    }
    
    function registerUser() {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const passwordConfirm = document.getElementById('reg-password-confirm').value;
        
        if (isEmpty(username) || isEmpty(password)) {
            alert('Введите имя пользователя и пароль');
            return;
        }
        
        if (password !== passwordConfirm) {
            alert('Пароли не совпадают');
            return;
        }
        
        // Получаем текущих пользователей из localStorage
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        
        if (users[username]) {
            alert('Пользователь уже существует!');
            return;
        }
        
        // Добавляем нового пользователя
        users[username] = { 
            password: password,
            events: []
        };
        
        // Сохраняем обратно
        localStorage.setItem('users', JSON.stringify(users));
        
        alert('Регистрация успешна!');
        
        // Переключаемся на Login
        toggleAuthForms();
    }
    
    function loginUser() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        
        if (!users[username]) {
            alert('Пользователь не найден');
            return;
        }
        
        if (users[username].password !== password) {
            alert('Неверный пароль');
            return;
        }
        
        currentUser = username;
        alert('Вход выполнен успешно!');
        
        // Загружаем мероприятия пользователя
        loadUserEvents(username);
        
        hideAuthForm();
    }
    
    function saveToLocalStorage() {
        if (!currentUser) return;
        
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        
        if (users[currentUser]) {
            const eventsData = graphManager.getAllEvents().map(event => ({
                id: event.id,
                title: event.title,
                tags: event.tags,
                errors: event.errors,
                contacts: event.contacts,
                budget: event.budget,
                date: event.date,
                participants: event.participants,
                x: event.x,
                y: event.y
            }));
            
            users[currentUser].events = eventsData;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    function loadFromLocalStorage() {
        // Проверяем, есть ли сохраненные данные
        const savedEvents = localStorage.getItem('events');
        if (savedEvents) {
            try {
                const eventsData = JSON.parse(savedEvents);
                eventsData.forEach(eventData => {
                    graphManager.addEvent(eventData);
                });
                console.log('События загружены из localStorage');
            } catch (e) {
                console.error('Ошибка при загрузке событий:', e);
            }
        }
    }
    
    function loadUserEvents(username) {
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        
        if (users[username] && users[username].events) {
            // Очищаем текущие мероприятия
            graphManager.getAllEvents().forEach(event => {
                if (event.element) event.element.remove();
            });
            graphManager.events = [];
            
            // Загружаем мероприятия пользователя
            users[username].events.forEach(eventData => {
                graphManager.addEvent(eventData);
            });
        }
    }
});