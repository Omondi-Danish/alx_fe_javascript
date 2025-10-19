const showQuoteButton = document.getElementById("newQuote");
const display = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const syncNotification = document.getElementById("syncNotification");

const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Simulated server

const defaultQuotes = [
  { text: "Be yourself; everyone else is already taken.", category: "Inspiration" },
  { text: "So many books, so little time.", category: "Books" },
  { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", category: "Humor" },
  { text: "A room without books is like a body without a soul.", category: "Books" },
  { text: "Be who you are and say what you feel, because those who mind don't matter, and those who matter don't mind.", category: "Confidence" },
  { text: "You only live once, but if you do it right, once is enough.", category: "Life" },
  { text: "Be the change that you wish to see in the world.", category: "Motivation" },
  { text: "If you want to know what a man's like, take a good look at how he treats his inferiors, not his equals.", category: "Character" },
  { text: "If you tell the truth, you don't have to remember anything.", category: "Wisdom" },
  { text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", category: "Empathy" }
];

let randomQuotes = JSON.parse(localStorage.getItem("quotes")) || [...defaultQuotes];
let remainingQuotes = [...randomQuotes];

function createAddQuoteForm() {
  const newQuoteInput = document.getElementById("newQuoteText");
  const quoteCategory = document.getElementById("newQuoteCategory");

  return {
    getText: () => newQuoteInput.value.trim(),
    getCategory: () => quoteCategory.value.trim(),
    clear: () => {
      newQuoteInput.value = "";
      quoteCategory.value = "";
    }
  };
}

function populateCategories() {
  const categories = [...new Set(randomQuotes.map(q => q.category?.trim()).filter(Boolean))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const lastFilter = localStorage.getItem("selectedCategory");
  if (lastFilter && categoryFilter.querySelector(`option[value="${lastFilter}"]`)) {
    categoryFilter.value = lastFilter;
    filterQuotes();
  }
}

function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("selectedCategory", selected);

  const filtered = selected === "all"
    ? randomQuotes
    : randomQuotes.filter(q => q.category === selected);

  remainingQuotes = [...filtered];
  display.textContent = `Quotes filtered by "${selected}". Click 'Show New Quote' to view.`;
}

function showRandomQuote() {
  if (!display) return;

  if (remainingQuotes.length === 0) {
    display.textContent = "All quotes shown. Resetting...";
    filterQuotes();
    return;
  }

  const index = Math.floor(Math.random() * remainingQuotes.length);
  const quote = remainingQuotes.splice(index, 1)[0];
  display.innerHTML = `“${quote.text}”<br><em>(${quote.category || "Uncategorized"})</em>`;
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

showQuoteButton.addEventListener("click", showRandomQuote);

async function addQuote() {
  const form = createAddQuoteForm();
  const text = form.getText();
  const category = form.getCategory();

  if (!text) {
    display.textContent = "Please enter a non-empty quote.";
    return;
  }

  const lower = text.toLowerCase();
  const duplicate = randomQuotes.some((q) => q.text.toLowerCase() === lower);
  if (duplicate) {
    display.textContent = "This quote already exists.";
    form.clear();
    return;
  }

  const newQuote = { text, category };
  randomQuotes.push(newQuote);
  remainingQuotes.push(newQuote);
  localStorage.setItem("quotes", JSON.stringify(randomQuotes));
  populateCategories();
  display.textContent = "Quote added and saved.";
  form.clear();

  // Send to server (simulated POST)
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newQuote)
    });
    if (response.ok) {
      console.log("Quote sent to server:", await response.json());
    } else {
      console.warn("Server rejected quote:", response.status);
    }
  } catch (err) {
    console.error("Failed to send quote to server:", err);
  }
}

function exportQuotesToJson() {
  const blob = new Blob([JSON.stringify(randomQuotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");

      const cleaned = imported
        .map(q => ({
          text: String(q.text || "").trim(),
          category: String(q.category || "").trim()
        }))
        .filter(q => q.text && !randomQuotes.some(r => r.text.toLowerCase() === q.text.toLowerCase()));

      randomQuotes.push(...cleaned);
      remainingQuotes.push(...cleaned);
      localStorage.setItem("quotes", JSON.stringify(randomQuotes));
      populateCategories();
      alert(`Imported ${cleaned.length} new quotes successfully!`);
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();

    const serverQuotes = serverData
      .map(item => ({
        text: String(item.title || "").trim(),
        category: "Server"
      }))
      .filter(q => q.text && !randomQuotes.some(r => r.text.toLowerCase() === q.text.toLowerCase()));

    if (serverQuotes.length > 0) {
      randomQuotes.push(...serverQuotes);
      remainingQuotes.push(...serverQuotes);
      localStorage.setItem("quotes", JSON.stringify(randomQuotes));
      populateCategories();
      syncNotification.textContent = `✅ Synced ${serverQuotes.length} new quotes from server.`;
      setTimeout(() => (syncNotification.textContent = ""), 5000);
    }
  } catch (err) {
    console.error("Sync failed:", err);
    syncNotification.textContent = "⚠️ Server sync failed.";
    setTimeout(() => (syncNotification.textContent = ""), 5000);
  }
}

window.onload = () => {
  populateCategories();
  fetchQuotesFromServer();
  setInterval(fetchQuotesFromServer, 60000); // Sync every 60 seconds
};
