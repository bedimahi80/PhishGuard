document.addEventListener("DOMContentLoaded", () => {
    const scanBtn = document.getElementById("scanBtn");
    const urlInput = document.getElementById("urlInput");
    const verdictText = document.getElementById("verdictText");
    const enrichmentDetails = document.getElementById("enrichmentDetails");

    scanBtn.addEventListener("click", () => {
        const url = urlInput.value.trim();
        if (!url) return;

        verdictText.innerText = "Analyzing URL...";
        enrichmentDetails.innerText = "";

        // Step 1: Initial call to the ML scan
        fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        })
        .then(response => response.json())
        .then(data => {
            verdictText.innerText = "Verdict: " + (data.verdict || "Complete");
            
            // Step 2: Sequential call to the enrichment API
            return fetch('/api/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });
        })
        .then(response => response.json())
        .then(data => {
            // Output the detailed forensic results
            enrichmentDetails.innerText = JSON.stringify(data, null, 2);
        })
        .catch(err => {
            verdictText.innerText = "Error analyzing URL.";
        });
    });
});
