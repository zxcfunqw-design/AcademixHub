import { GraphManager } from './GraphManager.js';
import { RecommendationSystem } from './RecommendationSystem.js';
import { isEmpty } from './utils.js';

// # ---- Обработчики пользовательского интерфейса ---- #

export class UIHandlers {
    constructor() {
        this.graphManager = new GraphManager('graph-box');
        this.recommendationSystem = new RecommendationSystem(this.graphManager);
        this.currentUser = null;
        this.init();
    }

    /**
     * Инициализирует все обработчики
     */
    init() {
        this.setupEventListeners();
        this.setupAuthHandlers();
        this.loadEvents();
    }

    /**
     * Настраивает обработчики событий
     */
    setupEventListeners() {
        // # ---- Кнопки добавления/редактирования ---- #
        document.getElementById('open-card')?.addEventListener('click', () => {
            this.showAddEventForm();
        });

        document.getElementById('close-card')?.addEventListener('click', () => {
            this.hideAddEventForm();
        });

        document.getElementById('create-vertex')?.addEventListener('click', () => {
            this.createEvent();
        });

        document.getElementById('edit-vertex')?.addEventListener('click', () => {
            this.showEditEventForm();
        });

        document.getElementById('save-vertex')?.addEventListener('click', () => {
            this.saveEvent();
        });

        document.getElementById('close-edit')?.addEventListener('click', () => {
            this.hideEditEventForm();
        });

        document.getElementById('delete-vertex')?.addEventListener('click', () => {
            this.deleteEvent();
        });

        document.getElementById('close-info')?.addEventListener('click', () => {
            this.hideInfoSidebar();
        });

        // # ---- Фильтры ---- #
        const filterInput = document.getElementById('tag-filter');
        const budgetFilter = document.getElementById('budget-filter');
        const dateFilter = document.getElementById('date-filter');
        const participantsFilter = document.getElementById('participants-filter');

        if (filterInput) {
            filterInput.addEventListener('input', () => {
                this.applyFilters();
            });
        }

        if (budgetFilter) {
            budgetFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        if (participantsFilter) {
            participantsFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // # ---- Обработчики клавиш ---- #
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllOverlays();
            }
        });
    }

    /**
     * Настраивает обработчики авторизации
     */
    setupAuthHandlers() {
        const authOverlay = document.getElementById('auth-overlay');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authTitleText = document.getElementById('auth-title').querySelector('span');
        const toggleAuthBtn = document.getElementById('toggle-auth');
        const openAuthBtn = document.getElementById('open-auth');
        const closeAuthBtn = document.getElementById('close-auth');

        // Открытие оверлея
        openAuthBtn?.addEventListener('click', () => {
            authOverlay.style.display = 'flex';
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            authTitleText.textContent = 'Войти';
            toggleAuthBtn.textContent = '→';
        });

        // Переключение между логином и регистрацией
        toggleAuthBtn?.addEventListener('click', () => {
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
        });

        // Регистрация
        document.getElementById('register-btn').addEventListener('click', () => {
            this.registerUser();
        });

        // Логин
        document.getElementById('login-btn').addEventListener('click', () => {
            this.loginUser();
        });

        // Закрытие оверлея
        closeAuthBtn?.addEventListener('click', () => {
            authOverlay.style.display = 'none';
        });
    }

    /**
     * Показывает форму добавления мероприятия
     */
    showAddEventForm() {
        document.getElementById('card-overlay').style.display = 'flex';
        this.clearAddEventForm();
    }

    /**
     * Скрывает форму добавления мероприятия
     */
    hideAddEventForm() {
        document.getElementById('card-overlay').style.display = 'none';
    }

    /**
     * Очищает форму добавления мероприятия
     */
    clearAddEventForm() {
        document.getElementById('vertex-title').value = '';
        document.getElementById('vertex-tags').value = '';
        document.getElementById('vertex-errors').value = '';
        document.getElementById('vertex-contacts').value = '';
        document.getElementById('vertex-budget').value = '';
        document.getElementById('vertex-date').value = '';
        document.getElementById('vertex-participants').value = '1';
    }

    /**
     * Создает новое мероприятие
     */
    createEvent() {
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

        this.graphManager.addEvent(eventData);
        this.saveEvents();
        this.hideAddEventForm();
    }

    /**
     * Показывает форму редактирования мероприятия
     */
    showEditEventForm() {
        const infoSidebar = document.getElementById('info-sidebar');
        const vertexId = infoSidebar.dataset.vertexId;
        
        if (!vertexId) return;
        
        const event = this.graphManager.getEventById(vertexId);
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

    /**
     * Скрывает форму редактирования
     */
    hideEditEventForm() {
        document.getElementById('edit-overlay').style.display = 'none';
    }

    /**
     * Сохраняет изменения мероприятия
     */
    saveEvent() {
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
        
        this.graphManager.updateEvent(vertexId, updateData);
        this.saveEvents();
        this.hideEditEventForm();
    }

    /**
     * Удаляет мероприятие
     */
    deleteEvent() {
        const infoSidebar = document.getElementById('info-sidebar');
        const vertexId = infoSidebar.dataset.vertexId;
        
        if (!vertexId) return;
        
        if (confirm('Вы уверены, что хотите удалить это мероприятие?')) {
            this.graphManager.removeEvent(vertexId);
            this.saveEvents();
            this.hideInfoSidebar();
        }
    }

    /**
     * Скрывает информационный сайдбар
     */
    hideInfoSidebar() {
        document.getElementById('info-sidebar').classList.remove('open');
    }

    /**
     * Применяет фильтры
     */
    applyFilters() {
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
        
        this.graphManager.filterEvents(filter);
    }

    /**
     * Регистрирует пользователя
     */
    registerUser() {
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
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authTitleText = document.getElementById('auth-title').querySelector('span');
        const toggleAuthBtn = document.getElementById('toggle-auth');
        
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authTitleText.textContent = 'Войти';
        toggleAuthBtn.textContent = '→';
    }

    /**
     * Авторизует пользователя
     */
    loginUser() {
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

        this.currentUser = username;
        alert('Вход выполнен успешно!');
        
        // Загружаем мероприятия пользователя
        this.loadUserEvents(username);
        
        document.getElementById('auth-overlay').style.display = 'none';
    }

    /**
     * Сохраняет мероприятия
     */
    saveEvents() {
        if (!this.currentUser) return;
        
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        
        if (users[this.currentUser]) {
            const eventsData = this.graphManager.getAllEvents().map(event => ({
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
            
            users[this.currentUser].events = eventsData;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    /**
     * Загружает мероприятия
     */
    loadEvents() {
        // Показываем форму авторизации если нет текущего пользователя
        if (!this.currentUser) {
            document.getElementById('auth-overlay').style.display = 'flex';
        }
    }

    /**
     * Загружает мероприятия пользователя
     */
    loadUserEvents(username) {
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        
        if (users[username] && users[username].events) {
            // Очищаем текущие мероприятия
            this.graphManager.getAllEvents().forEach(event => {
                if (event.element) event.element.remove();
            });
            
            // Загружаем мероприятия пользователя
            users[username].events.forEach(eventData => {
                this.graphManager.addEvent(eventData);
            });
        }
    }

    /**
     * Скрывает все оверлеи
     */
    hideAllOverlays() {
        document.getElementById('card-overlay').style.display = 'none';
        document.getElementById('edit-overlay').style.display = 'none';
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('info-sidebar').classList.remove('open');
        document.getElementById('recommendations-sidebar').classList.remove('open');
    }
}