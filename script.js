document.addEventListener('DOMContentLoaded', function() {

    // Typed.js Effect for Hero Section
    const options = {
        strings: ["Senior Back End Engineer", "Go Specialist", "Problem Solver"],
        typeSpeed: 50,
        backSpeed: 30,
        loop: true
    };
    const typed = new Typed('#typed-text', options);

    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('.nav-menu a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Scroll Animation for Content Sections
    const sections = document.querySelectorAll('.content-section');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });

});