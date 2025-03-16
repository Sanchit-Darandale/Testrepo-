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

// Login function
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

// Register function
function register() {
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Username and password cannot be empty!");
        return;
    }

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

    let taskText = taskInput.value.trim();
    let timeValue = taskTime.value.trim();

    if (!taskText) {
        alert("Task cannot be empty!");
        return;
    }

    if (!timeValue.match(/^\d{2}:\d{2}$/)) {
        alert("Please enter a valid time (HH:MM)!");
        return;
    }

    let username = localStorage.getItem("currentUser");
    let userData = JSON.parse(localStorage.getItem(username));

    let newTask = { text: taskText, time: timeValue };
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
        li.innerHTML = `${task.text} (${task.time}) 
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
    userData.points += 2; // Reward for task completion

    localStorage.setItem(username, JSON.stringify(userData));
    loadUserData(username);
}

// Load user data
function loadUserData(username) {
    let userData = JSON.parse(localStorage.getItem(username));
    document.getElementById("points").innerText = userData.points;

    if (userData.points >= 10) {
        document.getElementById("premiumFeature").classList.remove("hidden");
    } else {
        document.getElementById("premiumFeature").classList.add("hidden");
    }

    displayTasks();
}

// Schedule notification 5 minutes before task time
function scheduleNotification(taskName, taskTime) {
    if (Notification.permission !== "granted") {
        console.log("Notifications are blocked by the user.");
        return;
    }

    let now = new Date();
    let [hours, minutes] = taskTime.split(":").map(Number);
    
    let taskDate = new Date();
    taskDate.setHours(hours);
    taskDate.setMinutes(minutes - 5); // Notify 5 minutes before
    taskDate.setSeconds(0);

    let timeDiff = taskDate - now;

    if (timeDiff > 0) {
        console.log(`Notification scheduled for task "${taskName}" at ${taskDate}`);
        setTimeout(() => {
            notifyUser(`Reminder: Your task "${taskName}" starts in 5 minutes!`);
        }, timeDiff);
    } else {
        console.log("Task time has already passed or is invalid.");
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
