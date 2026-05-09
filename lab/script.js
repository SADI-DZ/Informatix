document.addEventListener('DOMContentLoaded', () => {
    // Basic elements
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const editor = document.getElementById('editor');
    const output = document.getElementById('output');
    const themeCheckbox = document.getElementById('theme-checkbox');
    const body = document.body;

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        themeCheckbox.checked = false;
    } else {
        body.classList.add('dark-theme');
        themeCheckbox.checked = true;
    }

    // Theme toggle
    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });

    // Run code simulator
    runBtn.addEventListener('click', () => {
        // Change button state
        const originalText = runBtn.innerHTML;
        runBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> جاري التشغيل...';
        runBtn.style.opacity = '0.8';
        
        const code = editor.innerText.toLowerCase();
        
        output.innerHTML += `<div class="output-line system-msg">> Executing main.algo...</div>`;
        
        // Simulate execution delay
        setTimeout(() => {
            if (code.includes('ecrire') || code.includes('write')) {
                // Extract what is inside Ecrire("...")
                let textToPrint = "مرحباً بك في مخبر المعلوماتية!"; // Default
                const match = editor.innerText.match(/Ecrire\s*\(\s*["']([^"']*)["']\s*\)/i);
                if (match && match[1]) {
                    textToPrint = match[1];
                }
                output.innerHTML += `<div class="output-line" style="color: #f8fafc; font-family: 'Cairo', sans-serif;" dir="rtl">${textToPrint}</div>`;
                output.innerHTML += `<div class="output-line" style="color: #10b981;">> Program finished successfully.</div>`;
            } else if (code.includes('erreur') || code.includes('error')) {
                output.innerHTML += `<div class="output-line error-msg">> SyntaxError: Unexpected token at line 3.</div>`;
            } else {
                output.innerHTML += `<div class="output-line" style="color: #f59e0b;">> Program compiled, but no output statements found.</div>`;
            }
            
            output.scrollTop = output.scrollHeight;
            
            // Restore button state
            runBtn.innerHTML = originalText;
            runBtn.style.opacity = '1';
        }, 800);
    });
    
    // Clear output
    clearBtn.addEventListener('click', () => {
        output.innerHTML = '<div class="output-line system-msg">Console cleared.</div>';
    });

    // Handle Editor Tabs (Visual only for now)
    const tabs = document.querySelectorAll('.tool-list li');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Simulate loading different tool
            editor.style.opacity = '0.5';
            setTimeout(() => {
                editor.style.opacity = '1';
                if(tab.innerText.includes('الويب')) {
                    editor.innerText = '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Web Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>';
                } else if(tab.innerText.includes('الخوارزميات')) {
                    editor.innerText = 'Algorithme Exemple;\n\nVariable\n    x, y: Entier;\nDebut\n    Ecrire("مرحباً بكم");\nFin.';
                }
            }, 300);
        });
    });
});
