// AI Orb Console interactions
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const panel = document.getElementById('ai-orb-console');
        const form = document.getElementById('ai-orb-form');
        const log = document.getElementById('ai-orb-log');
        const textarea = document.getElementById('ai-orb-question');
        const providerSelect = document.getElementById('ai-orb-provider');
        if (!panel || !form || !log) return;

        const closeBtn = panel.querySelector('[data-ai-console-close]');
        const positionPanel = () => {
            const eyeButton = document.getElementById('teal-orb-eye');
            if (!eyeButton) return;
            const eyeRect = eyeButton.getBoundingClientRect();
            const panelWidth = panel.offsetWidth || 320;
            const panelHeight = panel.offsetHeight || 240;
            const top = Math.max(40, eyeRect.top - panelHeight - 24);
            const left = Math.min(
                window.innerWidth - panelWidth - 40,
                Math.max(40, eyeRect.left + eyeRect.width / 2 - panelWidth / 2)
            );
            panel.style.top = `${top}px`;
            panel.style.left = `${left}px`;
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
        };

        const openPanel = () => {
            panel.classList.add('open');
            positionPanel();
            if (log) {
                log.textContent = 'What miner data do we want to pull first?';
            }
            setTimeout(() => textarea && textarea.focus(), 150);
        };
        const closePanel = () => {
            panel.classList.remove('open');
            document.dispatchEvent(new CustomEvent('tealOrbEye:close'));
        };

        document.addEventListener('tealOrbEye:open', openPanel);
        closeBtn?.addEventListener('click', closePanel);
        document.addEventListener('keydown', (evt) => {
            if (evt.key === 'Escape') closePanel();
        });
        window.addEventListener('resize', () => {
            if (panel.classList.contains('open')) positionPanel();
        });

        form.addEventListener('submit', async (evt) => {
            evt.preventDefault();
            const question = textarea.value.trim();
            const provider = providerSelect.value;
            if (!question) {
                log.textContent = 'Please enter a prompt for the GPT engine.';
                return;
            }
            if (provider === 'smart') {
                log.textContent = 'Forming GPT quorum (GPT-5 + GPT-4 + Claude) and prepping regression checks…';
            } else {
                const label = providerSelect.options[providerSelect.selectedIndex]?.text || provider;
                log.textContent = `Routing prompt via ${label} with safety + bug checks…`;
            }
            try {
                const res = await fetch('/ai-assist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider, question }),
                    credentials: 'include'
                });
                if (!res.ok) {
                    throw new Error(`AI endpoint returned ${res.status}`);
                }
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.error || data.message || 'Relay failed');
                }
                log.textContent = data.response;
            } catch (err) {
                log.textContent = `⚠️ ${err.message || err}`;
            }
        });
    });
})();
