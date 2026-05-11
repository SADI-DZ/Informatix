// Flowchart designer
(function() {
    "use strict";
    document.addEventListener('DOMContentLoaded', () => {
        const flowData = {
            max: {
                steps: [
                    { icon: 'terminal', text: 'بداية' },
                    { icon: 'io', text: 'أدخل العددين A, B' },
                    { icon: 'process', text: 'Max ← A' },
                    { icon: 'decision', text: 'هل B > Max؟' },
                    { icon: 'process', text: 'Max ← B' },
                    { icon: 'io', text: 'أظهر Max' },
                    { icon: 'terminal', text: 'نهاية' }
                ],
                code: `بداية\n  اقرأ A, B\n  Max ← A\n  إذا B > Max:\n      Max ← B\n  اطبع Max\nنهاية`
            },
            fact: {
                steps: [
                    { icon: 'terminal', text: 'بداية' },
                    { icon: 'io', text: 'أدخل N' },
                    { icon: 'process', text: 'F ← 1, I ← 1' },
                    { icon: 'decision', text: 'I ≤ N؟' },
                    { icon: 'process', text: 'F ← F × I' },
                    { icon: 'process', text: 'I ← I + 1' },
                    { icon: 'io', text: 'أظهر F' },
                    { icon: 'terminal', text: 'نهاية' }
                ],
                code: `بداية\n  اقرأ N\n  F ← 1, I ← 1\n  طالما I ≤ N:\n      F ← F × I\n      I ← I + 1\n  اطبع F\nنهاية`
            },
            prime: {
                steps: [
                    { icon: 'terminal', text: 'بداية' },
                    { icon: 'io', text: 'أدخل N' },
                    { icon: 'process', text: 'P ← "أولي", I ← 2' },
                    { icon: 'decision', text: 'I < N؟' },
                    { icon: 'decision', text: 'N % I = 0؟' },
                    { icon: 'process', text: 'P ← "غير أولي"' },
                    { icon: 'process', text: 'I ← I + 1' },
                    { icon: 'io', text: 'أظهر P' },
                    { icon: 'terminal', text: 'نهاية' }
                ],
                code: `بداية\n  اقرأ N\n  P ← "أولي"\n  I ← 2\n  طالما I < N:\n      إذا N % I = 0:\n          P ← "غير أولي"\n      I ← I + 1\n  اطبع P\nنهاية`
            }
        };

        let curAlgo = 'max';
        let curStep = 0;

        const algoPills = document.querySelectorAll('.algo-pill');
        const flowTrack = document.getElementById('flowchart-steps');
        const flowPrev = document.getElementById('flowchart-prev');
        const flowNext = document.getElementById('flowchart-next');
        const flowInd = document.getElementById('flowchart-step-indicator');
        const flowCode = document.getElementById('flowchart-code-display');

        function renderFlow() {
            if (!flowTrack) return;
            const data = flowData[curAlgo];
            if (!data) return;
            flowTrack.innerHTML = '';
            data.steps.forEach((step, i) => {
                if (i > curStep) return;

                if (i > 0) {
                    const arrow = document.createElement('div');
                    arrow.className = 'fc-line';
                    flowTrack.appendChild(arrow);
                }

                const div = document.createElement('div');
                div.className = `fc-node fc-${step.icon}${i === curStep ? ' active' : ''}`;
                div.innerHTML = step.icon === 'io' ? `<span class="unskew">${step.text}</span>` : step.text;
                flowTrack.appendChild(div);
            });

            if (flowCode) {
                const lines = data.code.split('\n');
                flowCode.innerHTML = lines.map((line, i) =>
                    `<span class="${i === curStep ? 'code-line-active' : ''}">${line}</span>`
                ).join('\n');
            }

            if (flowInd) flowInd.textContent = `${curStep + 1} / ${data.steps.length}`;
            if (flowPrev) flowPrev.disabled = curStep <= 0;
            if (flowNext) flowNext.disabled = curStep >= data.steps.length - 1;
        }

        if (flowNext) flowNext.addEventListener('click', () => {
            if (curStep < flowData[curAlgo].steps.length - 1) { curStep++; renderFlow(); }
        });
        if (flowPrev) flowPrev.addEventListener('click', () => {
            if (curStep > 0) { curStep--; renderFlow(); }
        });

        algoPills.forEach(btn => {
            btn.addEventListener('click', () => {
                algoPills.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                curAlgo = btn.dataset.algo;
                curStep = 0;
                renderFlow();
            });
        });

        if (algoPills.length) renderFlow();
    });
})();
