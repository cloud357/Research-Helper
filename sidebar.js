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
  
  const store = await browser.storage.local.get({ snippets: [] });
  
  if (store.snippets.length === 0) {
    container.innerHTML = "<p style='color:#888; font-size:14px; text-align:center; margin-top:40px;'>Select text on the site and choose the option to add it to the menu to create your first quote.</p>";
    return;
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
}

function buildAcademicCitation(item) {
  const s = item.source;
  switch (item.type) {
    case "article":
      let artDetails = s.volume ? ` Т. ${s.volume},` : "";
      artDetails += s.issue ? ` № ${s.issue}.` : "";
      artDetails += s.pages ? ` С. ${s.pages}.` : "";
      return `${s.authors} ${s.title}. ${s.journal}. ${s.year}.${artDetails} URL: ${s.url} (date of inquiry: ${s.accessDate}).`;
    
    case "book":
      let pub = s.publisher ? ` ${s.publisher},` : "";
      return `${s.authors} ${s.title}.${pub} ${s.year}. URL: ${s.url} (date of inquiry: ${s.accessDate}).`;
    
    case "webpage":
    default:
      return `${s.title}. ${s.siteName}. ${s.year}. URL: ${s.url} (date of inquiry: ${s.accessDate}).`;
  }
}

async function copyAllToClipboard() {
  const store = await browser.storage.local.get({ snippets: [] });
  if (store.snippets.length === 0) return;

  let markdownText = "# Research results (Research Helper Export)\n\n";

  store.snippets.forEach((item, index) => {
    markdownText += `### Quote №${index + 1}\n`;
    markdownText += `> ${item.text}\n\n`;
    markdownText += `**Source:** ${buildAcademicCitation(item)}\n\n`;
    markdownText += `---\n\n`;
  });

  await navigator.clipboard.writeText(markdownText);
  alert("All materials have been copied to the clipboard in the format Markdown!");
}

async function clearStorage() {
  if (confirm("Clear all collected quotes from this session?")) {
    await browser.storage.local.set({ snippets: [] });
    renderSnippets();
  }
}