/***********************
 * 1. Quotes Data & DOM References
 ***********************/
const quotes = [
  { text: "Success is not final, failure is not fatal.", category: "Motivation" },
  { text: "Learning never exhausts the mind.", category: "Education" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const formContainer = document.getElementById("formContainer");
const exportBtn = document.getElementById("exportJson");
const importFileInput = document.getElementById("importFile");
const categoryFilter = document.getElementById("categoryFilter");

/***********************
 * 2. Local Storage & Session Storage
 ***********************/
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes.splice(0, quotes.length, ...JSON.parse(storedQuotes));
  }
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function saveLastViewedQuote(quote) {
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

function loadLastViewedQuote() {
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const quote = JSON.parse(lastQuote);
    quoteDisplay.innerHTML = `
      <p>"${quote.text}"</p>
      <small>Category: ${quote.category}</small>
    `;
  }
}

/***********************
 * 3. Show Random / Filtered Quote
 ***********************/
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("selectedCategory", selected);

  let filteredQuotes = quotes;
  if (selected !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selected);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes found for this category.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <small>Category: ${quote.category}</small>
  `;

  saveLastViewedQuote(quote);
}

/***********************
 * 4. POST to Mock Server
 ***********************/
async function postQuoteToServer(quote) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });

    if (!response.ok) throw new Error("Failed to post quote");

    const data = await response.json();
    console.log("Quote posted to server:", data);

  } catch (error) {
    console.error("Error posting quote to server:", error);
  }
}

/***********************
 * 5. Add Quote Function
 ***********************/
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert("Please enter both quote and category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();

  // Post new quote to server
  postQuoteToServer(newQuote);

  textInput.value = "";
  categoryInput.value = "";

  populateCategories();
  filterQuotes();
}

/***********************
 * 6. Create Add Quote Form
 ***********************/
function createAddQuoteForm() {
  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);
}

/***********************
 * 7. Populate Categories
 ***********************/
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];

  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory) {
    categoryFilter.value = savedCategory;
    filterQuotes();
  }
}

/***********************
 * 8. JSON Export
 ***********************/
exportBtn.addEventListener("click", function () {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
});

/***********************
 * 9. JSON Import
 ***********************/
importFileInput.addEventListener("change", function (event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid JSON format");
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      filterQuotes();
      alert("Quotes imported successfully!");
    } catch (error) {
      alert("Error importing JSON: " + error.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
});

/***********************
 * 10. GET Server Sync
 ***********************/
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const serverData = await response.json();

    const serverQuotes = serverData.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));

    let newQuotesAdded = false;
    serverQuotes.forEach(serverQuote => {
      const exists = quotes.some(q => q.text === serverQuote.text);
      if (!exists) {
        quotes.push(serverQuote);
        newQuotesAdded = true;
      }
    });

    if (newQuotesAdded) {
      saveQuotes();
      populateCategories();
      filterQuotes();
      notify("Quotes synced with server!"); // exact ALX message
    }

  } catch (error) {
    console.error("Error fetching server data:", error);
  }
}

/***********************
 * 11. syncQuotes Function (ALX Required)
 ***********************/
async function syncQuotes() {
  await fetchQuotesFromServer();
  quotes.forEach(q => postQuoteToServer(q));
  // Optional: show notification here too if desired
  // notify("Quotes synced with server!");
}

// Sync automatically every 60 seconds
setInterval(syncQuotes, 60000);

/***********************
 * 12. Notification Helper
 ***********************/
function notify(message) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.background = "#fffa65";
  notification.style.padding = "10px";
  notification.style.margin = "10px 0";
  notification.style.border = "1px solid #ccc";

  document.body.insertBefore(notification, document.body.firstChild);

  setTimeout(() => notification.remove(), 5000);
}

/***********************
 * 13. Initialize Page
 ***********************/
loadQuotes();
populateCategories();
createAddQuoteForm();
loadLastViewedQuote();
if (!sessionStorage.getItem("lastQuote")) filterQuotes();

newQuoteBtn.addEventListener("click", filterQuotes);
