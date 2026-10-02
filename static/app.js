document.addEventListener("DOMContentLoaded", () => {
    const urlInput = document.getElementById("urlInput");
    const scanBtn = document.getElementById("scanBtn");
    const pasteBtn = document.getElementById("pasteBtn");
    const copyBtn = document.getElementById("copyReportBtn");
    const chips = document.querySelectorAll(".chip");
    
    const loadingIndicator = document.getElementById("loadingIndicator");
    const resultsView = document.getElementById("resultsView");
    const verdictBanner = document.getElementById("verdictBanner");
    const verdictText = document.getElementById("verdictText");
    const rawOutput = document.getElementById("rawOutput");

    // UI Metric Elements
    const riskScoreVal = document.getElementById("riskScoreVal");
    const mlScoreVal = document.getElementById("mlScoreVal");
    const vtVal = document.getElementById("vtVal");
    const ageVal = document.getElementById("ageVal");

    // 1. One-click paste
    pasteBtn.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            urlInput.value = text.trim();
            urlInput.focus();
        } catch (err) {
            alert("Clipboard access denied. Please paste manually.");
        }
    });

    // 2. Clickable sample pills
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            urlInput.value = chip.getAttribute("data-url");
            runScan();
        });
    });

    // 3. Keyboard shortcuts (Enter to scan, Esc to clear)
    urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") runScan();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            urlInput.value = "";
            urlInput.focus();
            resultsView.classList.add("hidden");
        }
    });

    scanBtn.addEventListener("click", runScan);

    // Main Scan Function
    async function runScan() {
        const url = urlInput.value.trim();
        if (!url) return;

        // Reset UI
        resultsView.classList.add("hidden");
        loadingIndicator.classList.remove("hidden");
        
        try {
            // Make API call to your Flask backend
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                updateDashboard(data, url);
            } else {
                showError(data.error || "An error occurred during analysis.");
            }
        } catch (err) {
            showError("Failed to connect to the backend server.");
        } finally {
            loadingIndicator.classList.add("hidden");
        }
    }

    function updateDashboard(data, targetUrl) {
        resultsView.classList.remove("hidden");
        
        // Update Verdict Banner
        const verdict = data.verdict || "Unknown";
        verdictText.innerText = verdict;
        verdictBanner.className = "verdict-banner"; // Reset classes
        
        if (verdict.toLowerCase().includes("phishing") || verdict.toLowerCase().includes("malicious")) {
            verdictBanner.classList.add("verdict-danger");
        } else if (verdict.toLowerCase().includes("suspicious")) {
            verdictBanner.classList.add("verdict-warning");
        } else {
            verdictBanner.classList.add("verdict-safe");
        }

        // Parse metrics safely (adapt keys based on your actual backend JSON structure)
        const holistic = data.holistic_score ? (data.holistic_score * 100).toFixed(1) + "%" : "--%";
        const mlProb = data.ml_probability ? (data.ml_probability * 100).toFixed(1) + "%" : "--%";
        
        let vtString = "--/--";
        if (data.virustotal) {
             const malicious = data.virustotal.malicious || 0;
             const total = data.virustotal.total || 0;
             vtString = `${malicious}/${total}`;
        }
        
        let ageString = "--";
        if (data.whois_info && data.whois_info.domain_age_days !== undefined) {
             ageString = data.whois_info.domain_age_days;
        }

        riskScoreVal.innerText = holistic;
        mlScoreVal.innerText = mlProb;
        vtVal.innerText = vtString;
        ageVal.innerText = ageString + " days";

        // Dump full JSON to the forensics tab
        rawOutput.innerText = JSON.stringify(data, null, 2);
    }

    function showError(msg) {
        alert("Error: " + msg);
    }

    // 4. One-click report copy
    copyBtn.addEventListener("click", () => {
        const url = urlInput.value;
        const verdict = verdictText.innerText;
        const score = riskScoreVal.innerText;
        const summary = `[PhishGuard Report]\nTarget: ${url}\nVerdict: ${verdict}\nHolistic Risk: ${score}\nTimestamp: ${new Date().toISOString()}`;
        
        navigator.clipboard.writeText(summary).then(() => {
            copyBtn.innerText = "Copied!";
            setTimeout(() => (copyBtn.innerText = "Copy Report"), 2000);
        });
    });
});
