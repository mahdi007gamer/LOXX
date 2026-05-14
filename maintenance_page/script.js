document.addEventListener('DOMContentLoaded', () => {
    const progressFill = document.getElementById('progress-fill');
    const percentageText = document.getElementById('percentage');
    const starsContainer = document.querySelector('.stars-container');

    // 1. Cyber Stars Background
    function createCyberStars() {
        if (!starsContainer) return;
        const count = 80;
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
                animation: `float-star ${Math.random() * 10 + 10}s linear infinite`
            });

            starsContainer.appendChild(star);
        }
    }

    // Dynamic Animation Injection
    const styleSheet = document.styleSheets[0];
    const animations = [
        `@keyframes float-star {
            from { transform: translateY(0) translateX(0); }
            to { transform: translateY(-100vh) translateX(${Math.random() * 50}px); }
        }`,
        `@keyframes progress-drift {
            0% { transform: skewX(-20deg) translateX(-100%); }
            100% { transform: skewX(-20deg) translateX(200%); }
        }`
    ];
    animations.forEach(anim => styleSheet.insertRule(anim, styleSheet.cssRules.length));

    createCyberStars();

    // 2. Controlled Async Progress Simulation
    let currentProgress = 0;
    const targetCap = 99.4; // Technical limit feel
    
    function animateProgress() {
        // Human-like non-linear loading
        const jump = Math.random() * 0.8;
        currentProgress += jump;

        if (currentProgress > targetCap) {
            currentProgress = targetCap - (Math.random() * 0.2);
        }

        if (progressFill) progressFill.style.width = `${currentProgress}%`;
        if (percentageText) percentageText.innerText = `${currentProgress.toFixed(1)}%`;

        const nextTick = Math.random() * 800 + 400;
        setTimeout(animateProgress, nextTick);
    }

    // Initiation
    setTimeout(animateProgress, 500);

    // 3. Subtle Perspective Tilt (Desktop Only)
    const card = document.querySelector('.glass-container');
    if (window.innerWidth > 1024 && card) {
        document.addEventListener('mousemove', (e) => {
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX - innerWidth / 2) / 100;
            const y = (e.clientY - innerHeight / 2) / 100;
            
            card.style.transform = `rotateX(${-y}deg) rotateY(${x}deg)`;
        });
    }

    // Log for debugging
    console.log("Maintenance Protocol Active: v2.0.1 ALPHA");
});
