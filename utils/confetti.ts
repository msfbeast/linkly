export const triggerConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: any[] = [];
    const colors = ['#FFC700', '#FF0000', '#2E3192', '#41BBC7'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: width / 2,
            y: height / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20 - 5, // Upward bias
            life: 100 + Math.random() * 50,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 2
        });
    }

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        let active = false;

        particles.forEach(p => {
            if (p.life > 0) {
                active = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // Gravity
                p.life -= 1;

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Spin
                // ctx.save();
                // ctx.translate(p.x, p.y);
                // ctx.rotate(p.life * 0.1);
                // ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                // ctx.restore();
            }
        });

        if (active) {
            requestAnimationFrame(animate);
        } else {
            document.body.removeChild(canvas);
        }
    };

    animate();
};
