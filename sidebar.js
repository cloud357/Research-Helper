document.addEventListener("DOMContentLoaded", initSidebar);

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "REFRESH_SIDEBAR") {
    renderSnippets();
  }
});

function initSidebar() {
  renderSnippets();
  document.getElementById("clear-all").addEventListener("click", clearStorage);
  document.getElementById("copy-all").addEventListener("click", copyAllToClipboard);
}

async function renderSnippets() {
  const container = document.getElementById("container");
  container.innerHTML = "";
  const store = await browser.storage.local.get({ snippets: [], citationStyle: "dstu" });
  
  if (store.snippets.length === 0) {
    container.innerHTML = "<p style='color:#888; font-size:14px; text-align:center; margin-top:40px;'>Виділіть текст на сайті та оберіть додавання в меню, щоб створити першу цитату.</p>";
    return;
  }

  store.snippets.slice().reverse().forEach((item) => {
    const card = document.createElement("div");
    card.className = "snippet";

    const badge = document.createElement("span");
    badge.className = `badge ${item.type}`;
    badge.innerText = item.type === "article" ? "Стаття" : item.type === "book" ? "Книга" : "Сайт";

    const quoteDiv = document.createElement("div");
    quoteDiv.className = "quote";
    quoteDiv.innerText = `«${item.text}»`;

    const citationDiv = document.createElement("div");
    citationDiv.className = "citation";
    citationDiv.innerText = buildAcademicCitation(item, store.citationStyle);

    card.appendChild(badge);
    card.appendChild(quoteDiv);
    card.appendChild(citationDiv);
    container.appendChild(card);
  });
}

  store.snippets.slice().reverse().forEach((item) => {
    const card = document.createElement("div");
    card.className = "snippet";

    const badge = document.createElement("span");
    badge.className = `badge ${item.type}`;
    badge.innerText = item.type === "article" ? "Article" : item.type === "book" ? "Book" : "Site";

    const quoteDiv = document.createElement("div");
    quoteDiv.className = "quote";
    quoteDiv.innerText = `«${item.text}»`;

    const citationDiv = document.createElement("div");
    citationDiv.className = "citation";
    citationDiv.innerText = buildAcademicCitation(item);

    card.appendChild(badge);
    card.appendChild(quoteDiv);
    card.appendChild(citationDiv);
    container.appendChild(card);
  });

function buildAcademicCitation(item, style = "APA") {
  const s = item.source;
  if (style === "markdown") {
    return `Source: [${s.title}](${s.url}) (Accessed: ${s.accessDate})`;
  }

  if (style === "apa") {
    switch (item.type) {
      case "article":
        const artVol = s.volume ? ` ${s.volume}` : "";
        const artIssue = s.issue ? `(${s.issue})` : "";
        const artPages = s.pages ? `, ${s.pages}` : "";
        return `${s.authors}. (${s.year}). ${s.title}. ${s.journal},${artVol}${artIssue}${artPages}. Retrieved from ${s.url}`;
      
      case "book":
        const pub = s.publisher ? `. ${s.publisher}` : "";
        return `${s.authors}. (${s.year}). ${s.title}${pub}. Retrieved from ${s.url}`;
      
      case "webpage":
      default:
        return `${s.author}. (${s.year}). ${s.title}. ${s.siteName}. Retrieved ${s.accessDate}, from ${s.url}`;
    }
  }
  switch (item.type) {
    case "article":
      let artDetails = s.volume ? ` Т. ${s.volume},` : "";
      artDetails += s.issue ? ` № ${s.issue}.` : "";
      artDetails += s.pages ? ` С. ${s.pages}.` : "";
      return `${s.authors} ${s.title}. ${s.journal}. ${s.year}.${artDetails} URL: ${s.url} (дата звернення: ${s.accessDate}).`;
    
    case "book":
      let pub = s.publisher ? ` ${s.publisher},` : "";
      return `${s.authors} ${s.title}.${pub} ${s.year}. URL: ${s.url} (дата звернення: ${s.accessDate}).`;
    
    case "webpage":
    default:
      return `${s.title}. ${s.siteName}. ${s.year}. URL: ${s.url} (дата звернення: ${s.accessDate}).`;
  }
}

async function copyAllToClipboard() {
  const store = await browser.storage.local.get({ snippets: [], citationStyle: "apa" });
  if (store.snippets.length === 0) return;

  let markdownText = "# Результати дослідження (Research Helper Export)\n\n";

  store.snippets.forEach((item, index) => {
    markdownText += `### Quote №${index + 1}\n`;
    markdownText += `> ${item.text}\n\n`;
    markdownText += `**Source:** ${buildAcademicCitation(item, store.citationStyle)}\n\n`;
    markdownText += `---\n\n`;
  });
}

async function clearStorage() {
  if (confirm("Clear all collected quotes from this session?")) {
    await browser.storage.local.set({ snippets: [] });
    renderSnippets();
  }
}