browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "send-to-research-helper",
    title: "Add to Research Helper with source",
    contexts: ["selection"]
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "send-to-research-helper") {
    try {
      const results = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageData,
        args: [info.selectionText]
      });

      if (results && results[0] && results[0].result) {
        const payload = results[0].result;
        const store = await browser.storage.local.get({ snippets: [] });
        store.snippets.push(payload);
        await browser.storage.local.set({ snippets: store.snippets });
        browser.runtime.sendMessage({ action: "REFRESH_SIDEBAR" });
      }
    } catch (err) {
      console.error("Data capture error", err);
    }
  }
});

function extractPageData(selectedText) {
  const currentUrl = window.location.href;
  const meta = {
    title: document.title || "Untitled",
    url: currentUrl,
    accessDate: new Date().toLocaleDateString('en-US'),
    year: new Date().getFullYear().toString()
  };

  const isPdf = currentUrl.toLowerCase().endsWith('.pdf') || 
                document.contentType === 'application/pdf' ||
                document.getElementById('viewerContainer') !== null;
                
if (isPdf) {
    let cleanTitle = meta.title.replace(/\.[^/.]+$/, ""); 
    cleanTitle = cleanTitle.replace(/_+/g, " ");

    return {
      text: selectedText,
      type: "article", // Mark as article to display the appropriate badge
      source: {
        ...meta,
        title: cleanTitle,
        journal: "PDF Document Materials", // Default source description for PDFs
        authors: "Document Authors", 
        volume: "",
        issue: "",
        pages: ""
      }
    };
  }

  const isArticle = document.querySelector('meta[name="citation_journal_title"]') || 
                    document.querySelector('meta[name="citation_doi"]');
  if (isArticle) {
    const scholarAuthors = document.querySelectorAll('meta[name="citation_author"]');
    const authorsArray = Array.from(scholarAuthors).map(el => el.content);
    
    return {
      text: selectedText,
      type: "article",
      source: {
        ...meta,
        journal: document.querySelector('meta[name="citation_journal_title"]')?.content || "Scientific journal",
        authors: authorsArray.length ? authorsArray.join(", ") : "Authors not listed",
        volume: document.querySelector('meta[name="citation_volume"]')?.content || "",
        issue: document.querySelector('meta[name="citation_issue"]')?.content || "",
        pages: document.querySelector('meta[name="citation_firstpage"]')?.content 
          ? `${document.querySelector('meta[name="citation_firstpage"]')?.content}-${document.querySelector('meta[name="citation_lastpage"]')?.content}`
          : ""
      }
    };
  }

  const isBook = document.querySelector('meta[property="og:type"]')?.content === 'book' || 
                 window.location.href.includes('books.google');
  if (isBook) {
    return {
      text: selectedText,
      type: "book",
      source: {
        ...meta,
        authors: document.querySelector('meta[property="book:author"]')?.content || 
                 document.querySelector('meta[name="author"]')?.content || "Authors not listed",
        publisher: document.querySelector('meta[property="book:publisher"]')?.content || ""
      }
    };
  }

  const siteName = document.querySelector('meta[property="og:site_name"]')?.content || window.location.hostname;
  return {
    text: selectedText,
    type: "webpage",
    source: {
      ...meta,
      siteName: siteName,
      author: document.querySelector('meta[name="author"]')?.content || siteName
    }
  };
}