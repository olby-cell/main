const currentUser = JSON.parse(localStorage.getItem("bankflowCurrentUser"));

if (!currentUser) {
  window.location.href = "login.html";
}

const gameStatusEl = document.getElementById("gameStatus");
const simTimeEl = document.getElementById("simTime");
const queueCountEl = document.getElementById("queueCount");
const maxQueueEl = document.getElementById("maxQueue");
const mistakesEl = document.getElementById("mistakes");
const scoreEl = document.getElementById("score");
const decisionTimerEl = document.getElementById("decisionTimer");
const serviceTimerEl = document.getElementById("serviceTimer");
const queueListEl = document.getElementById("queueList");
const clientPanelEl = document.getElementById("clientPanel");
const logListEl = document.getElementById("logList");

const arrivedCountEl = document.getElementById("arrivedCount");
const servedCountEl = document.getElementById("servedCount");
const failedCountEl = document.getElementById("failedCount");
const leftCountEl = document.getElementById("leftCount");
const avgWaitEl = document.getElementById("avgWait");
const ratingEl = document.getElementById("rating");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const logoutBtn = document.getElementById("logoutBtn");
const actionButtons = document.querySelectorAll(".action-btn");

const CLIENT_NAMES = [
  "Иван Петров",
  "Анна Соколова",
  "Дмитрий Орлов",
  "Мария Коваль",
  "Алексей Романюк",
  "Ольга Новик",
  "Сергей Мельник",
  "Елена Васильева"
];

const OPERATIONS = {
  withdraw: {
    title: "Снятие",
    request: (amount) => `Клиент хочет снять ${amount} ₽`
  },
  deposit: {
    title: "Пополнение",
    request: (amount) => `Клиент хочет пополнить счёт на ${amount} ₽`
  },
  loan: {
    title: "Кредит",
    request: (amount) => `Клиент хочет оформить кредит на ${amount} ₽`
  },
  savings: {
    title: "Вклад",
    request: (amount) => `Клиент хочет открыть вклад на ${amount} ₽`
  },
  fx: {
    title: "Обмен",
    request: (amount, currency) => `Клиент хочет обменять ${amount} ${currency}`
  },
  balance: {
    title: "Баланс",
    request: () => "Клиент хочет проверить баланс счёта"
  }
};

const CURRENCIES = ["USD", "EUR", "GBP"];

const state = {
  running: false,
  simTime: 0,
  queue: [],
  currentClient: null,
  nextId: 1,
  maxQueue: 0,
  spawnCooldown: 0,

  score: 0,
  mistakes: 0,
  arrived: 0,
  served: 0,
  failed: 0,
  left: 0,
  totalWait: 0,

  intervalId: null
};

function formatTime(time) {
  return `${time}s`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function createClient() {
  const operation = pickRandom(Object.keys(OPERATIONS));
  const status = Math.random() < 0.1 ? "VIP" : Math.random() < 0.25 ? "Премиум" : "Обычный";

  const client = {
    id: state.nextId++,
    name: pickRandom(CLIENT_NAMES),
    operation,
    status,
    createdAt: state.simTime,
    patience: status === "VIP" ? randomInt(16, 22) : randomInt(10, 18),
    decisionTime: status === "VIP" ? randomInt(8, 12) : randomInt(6, 10),
    amount: null,
    currency: null
  };

  if (operation !== "balance") {
    if (operation === "fx") {
      client.amount = randomInt(100, 3000);
      client.currency = pickRandom(CURRENCIES);
    } else if (operation === "loan") {
      client.amount = randomInt(5000, 150000);
    } else if (operation === "savings") {
      client.amount = randomInt(1000, 50000);
    } else {
      client.amount = randomInt(100, 20000);
    }
  }

  return client;
}

function getClientRequestText(client) {
  if (!client) return "";

  if (client.operation === "fx") {
    return OPERATIONS[client.operation].request(client.amount, client.currency);
  }

  if (client.operation === "balance") {
    return OPERATIONS[client.operation].request();
  }

  return OPERATIONS[client.operation].request(client.amount);
}

function addLog(text, type = "") {
  const item = document.createElement("div");
  item.className = `log-item ${type}`.trim();
  item.textContent = `[${formatTime(state.simTime)}] ${text}`;
  logListEl.prepend(item);

  while (logListEl.children.length > 40) {
    logListEl.removeChild(logListEl.lastChild);
  }
}

function updateStats() {
  gameStatusEl.textContent = state.running ? "Работа" : "Пауза";
  simTimeEl.textContent = state.simTime;
  queueCountEl.textContent = state.queue.length;
  maxQueueEl.textContent = state.maxQueue;
  mistakesEl.textContent = state.mistakes;
  scoreEl.textContent = state.score;

  arrivedCountEl.textContent = state.arrived;
  servedCountEl.textContent = state.served;
  failedCountEl.textContent = state.failed;
  leftCountEl.textContent = state.left;

  avgWaitEl.textContent = state.served === 0 ? "0.0" : (state.totalWait / state.served).toFixed(1);

  const total = state.served + state.failed + state.left;
  const rating = total === 0 ? 100 : Math.round((state.served / total) * 100);
  ratingEl.textContent = `${rating}%`;
}

function renderQueue() {
  queueListEl.innerHTML = "";

  if (state.queue.length === 0) {
    queueListEl.innerHTML = `
      <div class="queue-item">
        <div class="queue-main">
          <div class="queue-title">Очередь пуста</div>
          <div class="queue-request">Ожидание новых клиентов.</div>
        </div>
        <div class="queue-meta">—</div>
      </div>
    `;
    return;
  }

  state.queue.forEach((client, index) => {
    const badge = client.status === "VIP"
      ? `<span class="vip-badge">VIP</span>`
      : client.status === "Премиум"
      ? `<span class="vip-badge">PREMIUM</span>`
      : "";

    const item = document.createElement("div");
    item.className = "queue-item";
    item.innerHTML = `
      <div class="queue-main">
        <div class="queue-title">${index + 1}. ${client.name} ${badge}</div>
        <div class="queue-request">${getClientRequestText(client)}</div>
      </div>
      <div class="queue-meta">Терпение: ${client.patience}s</div>
    `;

    queueListEl.appendChild(item);
  });
}

function renderCurrentClient() {
  if (!state.currentClient) {
    clientPanelEl.className = "client-panel empty";
    clientPanelEl.innerHTML = `
      <div class="empty-title">Нет клиента у окна</div>
      <div class="empty-text">Нажмите «Старт», чтобы начать симуляцию.</div>
    `;

    decisionTimerEl.textContent = "—";
    serviceTimerEl.textContent = "—";
    return;
  }

  const client = state.currentClient;

  const amountText =
    client.operation === "balance"
      ? "Не требуется"
      : client.operation === "fx"
      ? `${client.amount} ${client.currency}`
      : `${client.amount} ₽`;

  clientPanelEl.className = "client-panel";
  clientPanelEl.innerHTML = `
    <div class="client-title">${client.name}</div>
    <div class="client-request">${getClientRequestText(client)}</div>

    <div class="client-data">
      <div class="data-box">
        <span>Статус</span>
        <strong>${client.status}</strong>
      </div>

      <div class="data-box">
        <span>Операция</span>
        <strong>${OPERATIONS[client.operation].title.toUpperCase()}</strong>
      </div>

      <div class="data-box">
        <span>Сумма</span>
        <strong>${amountText}</strong>
      </div>

      <div class="data-box">
        <span>Ожидание</span>
        <strong>${state.simTime - client.createdAt}s</strong>
      </div>
    </div>
  `;

  decisionTimerEl.textContent = `${client.decisionTime}s`;
  serviceTimerEl.textContent = `${client.patience}s`;
}

function renderAll() {
  renderQueue();
  renderCurrentClient();
  updateStats();
}

function spawnClientIfNeeded() {
  if (state.spawnCooldown > 0) {
    state.spawnCooldown--;
    return;
  }

  if (state.queue.length >= 5) return;

  if (Math.random() < 0.7 || state.queue.length === 0) {
    const client = createClient();
    state.queue.push(client);
    state.arrived++;
    state.maxQueue = Math.max(state.maxQueue, state.queue.length);
    state.spawnCooldown = randomInt(2, 4);
    addLog(`Пришёл клиент: ${client.name}`, "warn");
  }
}

function bringNextClient() {
  if (!state.currentClient && state.queue.length > 0) {
    state.currentClient = state.queue.shift();
    addLog(`К окну подошёл клиент: ${state.currentClient.name}`, "success");
  }
}

function processQueuePatience() {
  const updatedQueue = [];

  state.queue.forEach((client) => {
    client.patience--;

    if (client.patience <= 0) {
      state.left++;
      state.failed++;
      state.mistakes++;
      addLog(`Клиент ${client.name} ушёл из очереди`, "error");
    } else {
      updatedQueue.push(client);
    }
  });

  state.queue = updatedQueue;

  if (state.currentClient) {
    state.currentClient.decisionTime--;
    state.currentClient.patience--;

    if (state.currentClient.decisionTime <= 0 || state.currentClient.patience <= 0) {
      state.failed++;
      state.mistakes++;
      addLog(`Клиент ${state.currentClient.name} не был обслужен вовремя`, "error");
      state.currentClient = null;
    }
  }
}

function handleAction(op) {
  if (!state.running || !state.currentClient) return;

  const client = state.currentClient;
  const waitTime = state.simTime - client.createdAt;

  if (op === client.operation) {
    const bonus = client.status === "VIP" ? 15 : client.status === "Премиум" ? 12 : 10;
    state.score += bonus;
    state.served++;
    state.totalWait += waitTime;
    addLog(`Клиент ${client.name} обслужен правильно`, "success");
  } else {
    state.score = Math.max(0, state.score - 5);
    state.failed++;
    state.mistakes++;
    addLog(`Ошибка: неправильная операция для ${client.name}`, "error");
  }

  state.currentClient = null;
  bringNextClient();
  renderAll();
}

function tick() {
  if (!state.running) return;

  state.simTime++;
  spawnClientIfNeeded();
  processQueuePatience();
  bringNextClient();
  renderAll();
}

function startGame() {
  if (state.running) return;

  state.running = true;

  if (!state.intervalId) {
    state.intervalId = setInterval(tick, 1000);
  }

  if (state.queue.length === 0 && !state.currentClient) {
    spawnClientIfNeeded();
    bringNextClient();
  }

  addLog("Симуляция запущена", "success");
  renderAll();
}

function pauseGame() {
  state.running = false;
  addLog("Симуляция поставлена на паузу", "warn");
  renderAll();
}

function resetGame() {
  state.running = false;
  state.simTime = 0;
  state.queue = [];
  state.currentClient = null;
  state.nextId = 1;
  state.maxQueue = 0;
  state.spawnCooldown = 0;

  state.score = 0;
  state.mistakes = 0;
  state.arrived = 0;
  state.served = 0;
  state.failed = 0;
  state.left = 0;
  state.totalWait = 0;

  logListEl.innerHTML = "";
  addLog("Симуляция сброшена", "warn");
  renderAll();
}

function logout() {
  localStorage.removeItem("bankflowCurrentUser");
  window.location.href = "login.html";
}

function loadProducts() {
  const productsList = document.getElementById("productsList");
  if (!productsList) return;

  fetch("./data/products.json")
    .then((response) => response.json())
    .then((products) => {
      productsList.innerHTML = "";

      products.forEach((product) => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <h3>${product.title}</h3>
          <p>${product.description}</p>
        `;

        productsList.appendChild(card);
      });
    })
    .catch(() => {
      productsList.textContent = "Не удалось загрузить данные из JSON.";
    });
}

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
resetBtn.addEventListener("click", resetGame);

if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

actionButtons.forEach((btn) => {
  btn.addEventListener("click", () => handleAction(btn.dataset.op));
});

loadProducts();
renderAll();