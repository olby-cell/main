function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}
const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", () => {
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirmPassword").value;

    if (!email || !password || !confirm) {
      document.getElementById("registerMessage").textContent = "Заполни все поля";
      return;
    }

    if (password !== confirm) {
      document.getElementById("registerMessage").textContent = "Пароли не совпадают";
      return;
    }

    const users = getUsers();
    users.push({ email, password });
    saveUsers(users);

    document.getElementById("registerMessage").textContent = "Готово";
  });
}