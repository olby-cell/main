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

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const actionButtons = document.querySelectorAll(".action-btn");

const names = ["Иван", "Анна", "Сергей", "Мария", "Олег", "Елена", "Максим", "Виктория"];
const operations = {
  withdraw: "Снятие",
  deposit: "Пополнение",
  loan: "Кредит",
  savings: "Вклад",
  fx: "Обмен",
  balance: "Баланс"
};

let gameRunning = false;
let simTime = 0;
let timerId = null;

let queue = [];
let currentClient = null;
let maxQueue = 0;
let nextId = 1;

let score = 0;
let mistakes = 0;

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomOperation() {
  return randomItem(Object.keys(operations));
}

function createClient() {
  const operation = randomOperation();

  return {
    id: nextId++,
    name: randomItem(names),
    operation,
    amount: Math.floor(Math.random() * 9000) + 1000,
    status: "Обычный",
    patience: Math.floor(Math.random() * 8) + 8,
    decisionTime: Math.floor(Math.random() * 5) + 5
  };
}

function getRequestText(client) {
  switch (client.operation) {
    case "withdraw":
      return `Хочет снять ${client.amount} ₽`;
    case "deposit":
      return `Хочет пополнить счёт на ${client.amount} ₽`;
    case "loan":
      return `Хочет оформить кредит на ${client.amount} ₽`;
    case "savings":
      return `Хочет открыть вклад на ${client.amount} ₽`;
    case "fx":
      return `Хочет обменять ${client.amount} USD`;
    case "balance":
      return "Хочет проверить баланс";
    default:
      return "Неизвестный запрос";
  }
}

function addLog(text, type = "") {
  const item = document.createElement("div");
  item.className = `log-item ${type}`.trim();
  item.textContent = `[${simTime}s] ${text}`;
  logListEl.prepend(item);
}

function updateStats() {
  gameStatusEl.textContent = gameRunning ? "Работа" : "Пауза";
  simTimeEl.textContent = simTime;
  queueCountEl.textContent = queue.length;
  maxQueueEl.textContent = maxQueue;
  mistakesEl.textContent = mistakes;
  scoreEl.textContent = score;
}

function renderQueue() {
  queueListEl.innerHTML = "";

  if (queue.length === 0) {
    queueListEl.innerHTML = `
      <div class="queue-item">
        <div class="queue-main">
          <div class="queue-title">Очередь пуста</div>
          <div class="queue-request">Новые клиенты скоро появятся.</div>
        </div>
        <div class="queue-meta">—</div>
      </div>
    `;
    return;
  }

  queue.forEach((client, index) => {
    const item = document.createElement("div");
    item.className = "queue-item";
    item.innerHTML = `
      <div class="queue-main">
        <div class="queue-title">${index + 1}. ${client.name}</div>
        <div class="queue-request">${getRequestText(client)}</div>
      </div>
      <div class="queue-meta">Терпение: ${client.patience}s</div>
    `;
    queueListEl.appendChild(item);
  });
}

function renderClient() {
  if (!currentClient) {
    clientPanelEl.className = "client-panel empty";
    clientPanelEl.innerHTML = `
      <div class="empty-title">Нет клиента у окна</div>
      <div class="empty-text">Ожидание следующего клиента.</div>
    `;
    decisionTimerEl.textContent = "—";
    serviceTimerEl.textContent = "—";
    return;
  }

  clientPanelEl.className = "client-panel";
  clientPanelEl.innerHTML = `
    <div class="client-title">${currentClient.name}</div>
    <div class="client-request">${getRequestText(currentClient)}</div>

    <div class="client-data">
      <div class="data-box">
        <span>Статус</span>
        <strong>${currentClient.status}</strong>
      </div>

      <div class="data-box">
        <span>Операция</span>
        <strong>${operations[currentClient.operation]}</strong>
      </div>

      <div class="data-box">
        <span>Сумма</span>
        <strong>${currentClient.amount} ₽</strong>
      </div>

      <div class="data-box">
        <span>ID клиента</span>
        <strong>#${currentClient.id}</strong>
      </div>
    </div>
  `;

  decisionTimerEl.textContent = `${currentClient.decisionTime}s`;
  serviceTimerEl.textContent = `${currentClient.patience}s`;
}

function renderAll() {
  renderQueue();
  renderClient();
  updateStats();
}

function addClientToQueue() {
  const client = createClient();
  queue.push(client);
  if (queue.length > maxQueue) maxQueue = queue.length;
  addLog(`В очередь добавлен клиент ${client.name}`, "warn");
}

function bringNextClient() {
  if (!currentClient && queue.length > 0) {
    currentClient = queue.shift();
    addLog(`Клиент ${currentClient.name} подошёл к окну`, "success");
  }
}

function processQueue() {
  const newQueue = [];

  queue.forEach((client) => {
    client.patience--;

    if (client.patience <= 0) {
      mistakes++;
      addLog(`Клиент ${client.name} не дождался и ушёл`, "error");
    } else {
      newQueue.push(client);
    }
  });

  queue = newQueue;
}

function processCurrentClient() {
  if (!currentClient) return;

  currentClient.decisionTime--;
  currentClient.patience--;

  if (currentClient.decisionTime <= 0 || currentClient.patience <= 0) {
    mistakes++;
    addLog(`Время клиента ${currentClient.name} истекло`, "error");
    currentClient = null;
  }
}

function tick() {
  if (!gameRunning) return;

  simTime++;

  if (Math.random() < 0.7 && queue.length < 5) {
    addClientToQueue();
  }

  processQueue();
  processCurrentClient();
  bringNextClient();
  renderAll();
}

function handleAction(op) {
  if (!gameRunning || !currentClient) return;

  if (op === currentClient.operation) {
    score += 10;
    addLog(`Клиент ${currentClient.name} обслужен правильно`, "success");
  } else {
    mistakes++;
    score = Math.max(0, score - 5);
    addLog(`Неверная операция для клиента ${currentClient.name}`, "error");
  }

  currentClient = null;
  bringNextClient();
  renderAll();
}

function startGame() {
  if (gameRunning) return;
  gameRunning = true;

  if (!timerId) {
    timerId = setInterval(tick, 1000);
  }

  if (queue.length === 0 && !currentClient) {
    addClientToQueue();
    bringNextClient();
  }

  addLog("Симуляция запущена", "success");
  renderAll();
}

function pauseGame() {
  gameRunning = false;
  addLog("Симуляция на паузе", "warn");
  renderAll();
}

function resetGame() {
  gameRunning = false;
  simTime = 0;
  queue = [];
  currentClient = null;
  maxQueue = 0;
  nextId = 1;
  score = 0;
  mistakes = 0;
  logListEl.innerHTML = "";
  addLog("Симуляция сброшена", "warn");
  renderAll();
}

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
resetBtn.addEventListener("click", resetGame);

actionButtons.forEach((btn) => {
  btn.addEventListener("click", () => handleAction(btn.dataset.op));
});

renderAll();