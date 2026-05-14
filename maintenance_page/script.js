document.addEventListener('DOMContentLoaded', () => {
    const progressFill = document.getElementById('progress-fill');
    const percentageText = document.getElementById('percentage');
    const starsContainer = document.querySelector('.stars-container');
    const card = document.querySelector('.glass-container');

    // 1. Safe Animation Injection (Prevents null stylesheet errors)
    const styleTag = document.createElement('style');
    document.head.appendChild(styleTag);
    const styleSheet = styleTag.sheet;

    if (styleSheet) {
        const animations = [
            `@keyframes float-star {
                from { transform: translateY(0) translateX(0); }
                to { transform: translateY(-100vh) translateX(15px); }
            }`,
            `@keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }`
        ];
        animations.forEach(anim => {
            try {
                styleSheet.insertRule(anim, styleSheet.cssRules.length);
            } catch (e) {
                console.warn("Could not inject animation:", e);
            }
        });
    }

    // 2. Cyber Stars Background
    function createCyberStars() {
        if (!starsContainer) return;
        const count = 60;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            const size = Math.random() * 2 + 1;
            
            Object.assign(star.style, {
                position: 'absolute',
                width: `${size}px`,
                height: `${size}px`,
                background: Math.random() > 0.8 ? '#00f2ff' : '#ffffff',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.1,
                boxShadow: `0 0 ${Math.random() * 8}px currentColor`,
                animation: `float-star ${Math.random() * 15 + 15}s linear infinite`
            });

            starsContainer.appendChild(star);
        }
    }
    createCyberStars();

    // 3. Controlled Async Progress Simulation
    let currentProgress = 0;
    const targetCap = 99.4;
    
    function animateProgress() {
        if (!progressFill || !percentageText) return;

        const jump = Math.random() * 0.4;
        currentProgress += jump;

        if (currentProgress > targetCap) {
            currentProgress = targetCap - (Math.random() * 0.2);
        }

        progressFill.style.width = `${currentProgress}%`;
        percentageText.innerText = `${currentProgress.toFixed(1)}%`;

        setTimeout(animateProgress, Math.random() * 1000 + 500);
    }
    setTimeout(animateProgress, 500);

    // 4. Subtle Perspective Tilt (Desktop Only)
    if (window.innerWidth > 1024 && card) {
        document.addEventListener('mousemove', (e) => {
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX - innerWidth / 2) / 100;
            const y = (e.clientY - innerHeight / 2) / 100;
            
            if (card) {
                card.style.transform = `rotateX(${-y}deg) rotateY(${x}deg)`;
            }
        });
    }

    console.log("Maintenance Protocol Active: v2.0.2");
});
