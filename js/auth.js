function getUsers() {
  const users = localStorage.getItem("bankflowUsers");
  return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
  localStorage.setItem("bankflowUsers", JSON.stringify(users));
}

function showMessage(id, text, type) {
  const message = document.getElementById(id);
  if (!message) return;

  message.textContent = text;
  message.className = type;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", () => {
    const name = document.getElementById("regName").value.trim();
    const surname = document.getElementById("regSurname").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (!name || !surname || !email || !phone || !password || !confirmPassword) {
      showMessage("registerMessage", "Заполните все поля", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("registerMessage", "Введите правильный email", "error");
      return;
    }

    if (!/^\d+$/.test(phone)) {
      showMessage("registerMessage", "Телефон должен содержать только цифры", "error");
      return;
    }

    if (password.length < 8) {
      showMessage("registerMessage", "Пароль должен содержать минимум 8 символов", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("registerMessage", "Пароли не совпадают", "error");
      return;
    }

    const users = getUsers();

    if (users.some(user => user.email === email)) {
      showMessage("registerMessage", "Пользователь с таким email уже существует", "error");
      return;
    }

    const newUser = {
      name,
      surname,
      email,
      phone,
      password
    };

    users.push(newUser);
    saveUsers(users);

    showMessage("registerMessage", "Регистрация выполнена успешно", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  });
}

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      showMessage("loginMessage", "Введите email и пароль", "error");
      return;
    }

    const users = getUsers();
    const user = users.find(item => item.email === email && item.password === password);

    if (!user) {
      showMessage("loginMessage", "Неверный email или пароль", "error");
      return;
    }

    localStorage.setItem("bankflowCurrentUser", JSON.stringify(user));
    showMessage("loginMessage", "Вход выполнен успешно", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  });
}