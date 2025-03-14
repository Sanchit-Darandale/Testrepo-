// Check if user is logged in
window.onload = function () {
    let currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
        showApp(currentUser);
    }
};

// Show/hide password
document.getElementById("showPassword").addEventListener("change", function () {
    let passwordField = document.getElementById("password");
    passwordField.type = this.checked ? "text" : "password";
});

// Login function
function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    let storedUser = localStorage.getItem(username);

    if (storedUser && JSON.parse(storedUser).password === password) {
        localStorage.setItem("currentUser", username);
        showApp(username);
    } else {
        alert("Invalid login credentials!");
    }
}

// Register function
function register() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (localStorage.getItem(username)) {
        alert("Username already exists!");
        return;
    }

    localStorage.setItem(username, JSON.stringify({ password: password, points: 0, tasks: [] }));
    alert("Registration successful! Please login.");
}

// Show the to-do list app
function showApp(username) {
    document.getElementById("loginContainer").classList.add("hidden");
    document.getElementById("appContainer").classList.remove("hidden");
    document.getElementById("displayUser").innerText = username;

    loadUserData(username);
}

// Logout function
function logout() {
    localStorage.removeItem("currentUser");
    location.reload();
}

// Add Task function
function addTask() {
    let taskInput = document.getElementById("taskInput");
    let taskTime = document.getElementById("taskTime");
    if (taskInput.value === "") return;

    let username = localStorage.getItem("currentUser");
    let userData = JSON.parse(localStorage.getItem(username));

    let newTask = { text: taskInput.value, time: taskTime.value };
    userData.tasks.push(newTask);
    localStorage.setItem(username, JSON.stringify(userData));

    taskInput.value = "";
    taskTime.value = "";
    displayTasks();
}

// Display tasks
function displayTasks() {
    let username = localStorage.getItem("currentUser");
    let userData = JSON.parse(localStorage.getItem(username));

    let taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    userData.tasks.forEach((task, index) => {
        let li = document.createElement("li");
        li.innerHTML = `${task.text} (${task.time}) <button onclick="completeTask(${index})">Complete</button>`;
        taskList.appendChild(li);

        if (task.time) {
            scheduleNotification(task.text, task.time);
        }
    });
}

// Complete task and add points
function completeTask(index) {
    let username = localStorage.getItem("currentUser");
    let userData = JSON.parse(localStorage.getItem(username));

    userData.tasks.splice(index, 1);
    userData.points += 2;

    localStorage.setItem(username, JSON.stringify(userData));
    loadUserData(username);
}

// Load user data
function loadUserData(username) {
    let userData = JSON.parse(localStorage.getItem(username));
    document.getElementById("points").innerText = userData.points;

    if (userData.points >= 100) {
        document.getElementById("premiumFeature").classList.remove("hidden");
    }

    displayTasks();
}

// Schedule notification 5 minutes before task time
function scheduleNotification(taskName, taskTime) {
    let now = new Date();
    let [hours, minutes] = taskTime.split(":").map(Number);
    let taskDate = new Date();
    taskDate.setHours(hours);
    taskDate.setMinutes(minutes - 5); // Notify 5 minutes before
    taskDate.setSeconds(0);

    let timeDiff = taskDate - now;
    if (timeDiff > 0) {
        setTimeout(() => {
            notifyUser(`Reminder: Your task "${taskName}" starts in 5 minutes!`);
        }, timeDiff);
    }
}

// Notification function
function notifyUser(message) {
    if (Notification.permission === "granted") {
        new Notification(message);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(message);
            }
        });
    }
}
