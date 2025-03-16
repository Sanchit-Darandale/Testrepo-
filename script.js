// Register Service Worker for Push Notifications
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

// Show/hide password toggle
document.getElementById("showPassword").addEventListener("change", function () {
    let passwordField = document.getElementById("password");
    passwordField.type = this.checked ? "text" : "password";
});

// User Login
function login() {
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    let storedUser = localStorage.getItem(username);

    if (storedUser && JSON.parse(storedUser).password === password) {
        localStorage.setItem("currentUser", username);
        showApp(username);
    } else {
        alert("Invalid login credentials!");
    }
}

// User Registration
function register() {
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Username and Password are required!");
        return;
    }

    if (localStorage.getItem(username)) {
        alert("Username already exists!");
        return;
    }

    localStorage.setItem(username, JSON.stringify({
        password: password,
        points: 0,
        completedTasks: 0,
        premiumUnlocked: false,
        tasks: []
    }));

    alert("Registration successful! Please login.");
}

// Show App UI
function showApp(username) {
    document.getElementById("loginContainer").classList.add("hidden");
    document.getElementById("appContainer").classList.remove("hidden");
    document.getElementById("displayUser").innerText = username;

    loadUserData(username);
}

// User Logout
function logout() {
    localStorage.removeItem("currentUser");
    location.reload();
}

// Add Task
function addTask() {
    let taskInput = document.getElementById("taskInput");
    let taskTime = document.getElementById("taskTime");

    let taskText = taskInput.value.trim();
    let timeValue = taskTime.value.trim();

    if (!taskText) {
        alert("Task cannot be empty!");
        return;
    }

    let username = localStorage.getItem("currentUser");
    let userData = JSON.parse(localStorage.getItem(username));

    if (!userData) {
        alert("User data not found! Please log in again.");
        return;
    }

    // Restrict non-premium users from adding time
    if (!userData.premiumUnlocked && timeValue) {
        alert("You need to complete 10 tasks to unlock the time feature!");
        return;
    }

    let newTask = { text: taskText, time: userData.premiumUnlocked ? timeValue : "" };
    userData.tasks.push(newTask);
    localStorage.setItem(username, JSON.stringify(userData));

    taskInput.value = "";
    taskTime.value = "";

    displayTasks();
}

// Display Tasks
function displayTasks() {
    let username = localStorage.getItem("currentUser");
    let userData = JSON.parse(localStorage.getItem(username));

    let taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    userData.tasks.forEach((task, index) => {
        let li = document.createElement("li");

        // Show time only if premium is unlocked
        let taskDetails = userData.premiumUnlocked ? `${task.text} (${task.time})` : task.text;

        li.innerHTML = `${taskDetails} <button onclick="completeTask(${index})">Complete</button>`;
        taskList.appendChild(li);

        // Schedule notifications if premium is unlocked
        if (userData.premiumUnlocked && task.time) {
            scheduleNotification(task.text, task.time);
        }
    });
}

// Complete Task
function completeTask(index) {
    let username = localStorage.getItem("currentUser");
    let userData = JSON.parse(localStorage.getItem(username));

    // Remove completed task
    userData.tasks.splice(index, 1);

    // Increase points
    userData.points += 2;

    // Track number of completed tasks
    if (!userData.completedTasks) {
        userData.completedTasks = 0;
    }
    userData.completedTasks += 1;

    // Unlock premium feature if user completes 10 tasks
    if (userData.completedTasks >= 10) {
        userData.premiumUnlocked = true;
    }

    localStorage.setItem(username, JSON.stringify(userData));
    loadUserData(username);
}

// Load User Data
function loadUserData(username) {
    let userData = JSON.parse(localStorage.getItem(username));
    document.getElementById("points").innerText = userData.points;

    if (userData.premiumUnlocked) {
        document.getElementById("premiumFeature").classList.remove("hidden");
    } else {
        document.getElementById("premiumFeature").classList.add("hidden");
    }

    displayTasks();
}

// Schedule Notifications for Task Start & 5 Minutes Before
function scheduleNotification(taskName, taskTime) {
    if (Notification.permission !== "granted") {
        console.log("Notifications are blocked by the user.");
        return;
    }

    let now = new Date();
    let [hours, minutes] = taskTime.split(":").map(Number);

    let taskStartTime = new Date();
    taskStartTime.setHours(hours);
    taskStartTime.setMinutes(minutes);
    taskStartTime.setSeconds(0);

    let taskReminderTime = new Date(taskStartTime);
    taskReminderTime.setMinutes(taskReminderTime.getMinutes() - 5); // Notify 5 minutes before

    let timeDiffReminder = taskReminderTime - now;
    let timeDiffStart = taskStartTime - now;

    if (timeDiffReminder > 0) {
        console.log(`Reminder set for task: ${taskName}`);
        setTimeout(() => {
            notifyUser(`Reminder: Your task "${taskName}" starts in 5 minutes!`);
        }, timeDiffReminder);
    }

    if (timeDiffStart > 0) {
        console.log(`Task start notification set for: ${taskName}`);
        setTimeout(() => {
            notifyUser(`Your task "${taskName}" is starting now!`);
        }, timeDiffStart);
    }
}

// Send Notification
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

// Request Notification Permission on Page Load
document.addEventListener("DOMContentLoaded", function () {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            console.log("Notification Permission:", permission);
        });
    }
});
