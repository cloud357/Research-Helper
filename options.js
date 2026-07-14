document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("citation-style").addEventListener("change", saveOptions);

async function saveOptions() {
    const style = document.getElementById("citation-style").value;
    await browser.storage.local.set({citationStyle: style});
    const status = document.getElementById("status");
    status.style.display = "block";
    setTimeout(() => {
        status.style.display = "none";
    }, 1500);

    browser.runtime.sendMessage({action: "REFRESH_SIDEBAR"});
}
async function restoreOptions() {
    const res = await browser.storage.local.get({citationStyle: "APA"});
    document.getElementById("citation-style").value = res.citationStyle;
}