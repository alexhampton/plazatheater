const menuButton = document.querySelector('.menu-button');
const primaryNav = document.querySelector('.primary-nav');

const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const navLinks = document.querySelectorAll('.primary-nav > a[href]');

navLinks.forEach((link) => {
  const href = link.getAttribute('href');
  if (href && href === currentPage) {
    link.classList.add('active');
  }
});

if (menuButton && primaryNav) {
  menuButton.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

const newsletterForm = document.querySelector('.newsletter-card form');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const submitButton = newsletterForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = 'Thanks!';
      submitButton.disabled = true;
    }
  });
}

const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && revealItems.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -30px 0px'
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('in-view'));
}

const scheduleData = window.plazaSchedule;

const buildCategoryBadge = (category) => {
  if (!category) {
    return '';
  }

  return `<span class="tag">${category}</span>`;
};

if (scheduleData) {
  const homeNowShowing = document.getElementById('home-now-showing');

  if (homeNowShowing) {
    const featuredItems = scheduleData.nowShowing.slice(0, 3);
    homeNowShowing.innerHTML = featuredItems
      .map(
        (item) => `
          <article class="show-card" role="listitem">
            <p class="event-slot">${item.day} | ${item.time}</p>
            ${buildCategoryBadge(item.category)}
            <h3>${item.title}</h3>
            <p>${item.note}</p>
            <a class="button secondary" href="${scheduleData.ticketUrl}">Tickets</a>
          </article>
        `
      )
      .join('');
  }

  const showtimesTimeline = document.getElementById('showtimes-timeline');

  if (showtimesTimeline) {
    showtimesTimeline.innerHTML = scheduleData.nowShowing
      .map(
        (item) => `
          <li>
            <span class="slot">${item.day} | ${item.time}</span>
            <div>
              ${buildCategoryBadge(item.category)}
              <h3>${item.title}</h3>
              <p>${item.note}</p>
            </div>
          </li>
        `
      )
      .join('');
  }

  const specialEventsCards = document.getElementById('special-events-cards');

  if (specialEventsCards) {
    specialEventsCards.innerHTML = scheduleData.specialEvents
      .map(
        (item) => `
          <article class="show-card">
            <p class="event-slot">${item.day} | ${item.time}</p>
            ${buildCategoryBadge(item.category)}
            <h3>${item.title}</h3>
            <p>${item.note}</p>
          </article>
        `
      )
      .join('');
  }
}
