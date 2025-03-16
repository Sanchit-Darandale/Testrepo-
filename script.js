// Unlock premium feature after 10 completed tasks instead of 100
const PREMIUM_TASK_LIMIT = 10;

// Register service worker for notifications
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
        .then(() => console.log("Service Worker Registered"))
        .catch((error) => console.log("Service Worker Registration Failed", error));
}

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

    localStorage.setItem(username, JSON.stringify({
        password: password, 
        points: 0, 
        tasksCompleted: 0, 
        tasks: []
    }));

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
    
    if (taskInput.value.trim() === "") return;

    let username = localStorage.getItem("currentUser");
    let userData = JSON.parse(localStorage.getItem(username));

    // Allow setting task time only if 10+ tasks are completed
    let taskDetails = { 
        text: taskInput.value, 
        time: userData.tasksCompleted >= PREMIUM_TASK_LIMIT ? taskTime.value : null 
    };

    userData.tasks.push(taskDetails);
    localStorage.setItem(username, JSON.stringify(userData));

    taskInput.value = "";
    if (userData.tasksCompleted >= PREMIUM_TASK_LIMIT) taskTime.value = "";

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
        li.innerHTML = `${task.text} ${task.time ? `(${task.time})` : ""} 
                        <button onclick="completeTask(${index})">Complete</button>`;
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
    userData.tasksCompleted += 1;  // 🔥 Properly increment task count

    localStorage.setItem(username, JSON.stringify(userData));
    loadUserData(username);
}

// Load user data
function loadUserData(username) {
    let userData = JSON.parse(localStorage.getItem(username));
    document.getElementById("points").innerText = userData.points;

    // Unlock premium feature after 10 tasks
    if (userData.tasksCompleted >= PREMIUM_TASK_LIMIT) {
        document.getElementById("premiumFeature").classList.remove("hidden");
        document.getElementById("taskTime").removeAttribute("disabled");
    } else {
        document.getElementById("premiumFeature").classList.add("hidden");
        document.getElementById("taskTime").setAttribute("disabled", "true");
    }

    displayTasks();
}

// Schedule notification when task starts
function scheduleNotification(taskName, taskTime) {
    if (!taskTime) return; // Only schedule if time is set

    let now = new Date();
    let [hours, minutes] = taskTime.split(":").map(Number);
    let taskDate = new Date();
    taskDate.setHours(hours);
    taskDate.setMinutes(minutes);
    taskDate.setSeconds(0);

    let timeDiff = taskDate - now;
    if (timeDiff > 0) {
        setTimeout(() => {
            notifyUser(`Your task "${taskName}" is starting now!`);
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

// Request notification permission on page load
document.addEventListener("DOMContentLoaded", function () {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            console.log("Notification Permission:", permission);
        });
    }
});
