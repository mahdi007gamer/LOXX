document.addEventListener('DOMContentLoaded', () => {
    const progressFill = document.getElementById('progress-fill');
    const percentageText = document.getElementById('percentage');
    const starsContainer = document.querySelector('.stars-container');

    // 1. Generate Binary/Star Background
    function createStars() {
        const count = 100;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.style.position = 'absolute';
            star.style.width = Math.random() * 2 + 'px';
            star.style.height = star.style.width;
            star.style.background = 'white';
            star.style.borderRadius = '50%';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.opacity = Math.random();
            star.style.boxShadow = `0 0 ${Math.random() * 5}px white`;
            
            // Animation
            const duration = Math.random() * 3 + 2;
            star.style.animation = `twinkle ${duration}s infinite ease-in-out`;
            
            starsContainer.appendChild(star);
        }
    }

    // Add twinkle keyframes to stylesheet
    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule(`
        @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 0.8; transform: scale(1.1); }
        }
    `, styleSheet.cssRules.length);

    createStars();

    // 2. Fake Progress Animation
    let progress = 0;
    const updateProgress = () => {
        // Randomly increment progress to feel like real loading
        const increment = Math.random() * 0.5 + 0.1;
        progress += increment;

        if (progress > 98) {
            // Stay at 99.x% to indicate "almost done"
            progress = 98 + Math.random();
        }

        progressFill.style.width = `${progress}%`;
        percentageText.innerText = `${Math.floor(progress)}%`;

        requestAnimationFrame(updateProgress);
    };

    // Start with a small delay for dramatic effect
    setTimeout(() => {
        updateProgress();
    }, 1000);

    // 3. Mouse Parallax Effect on Glass Card
    const card = document.querySelector('.glass-card');
    document.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 40;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 40;
        card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });

    document.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
    });

    document.addEventListener('mouseleave', () => {
        card.style.transition = 'all 0.5s ease';
        card.style.transform = `rotateY(0deg) rotateX(0deg)`;
    });
});
