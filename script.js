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

const formatEventSlot = (dateValue) => {
  const eventDate = new Date(dateValue);
  if (Number.isNaN(eventDate.getTime())) {
    return '';
  }

  const dayLabel = eventDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const timeLabel = eventDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  return `${dayLabel} | ${timeLabel}`;
};

const flattenSchedule = (months) => {
  if (!Array.isArray(months)) {
    return [];
  }

  return months
    .flatMap((month) => {
      const monthEvents = Array.isArray(month.events) ? month.events : [];
      return monthEvents
        .filter((event) => event && event.start)
        .map((event) => ({
          ...event,
          monthKey: month.key || '',
          monthLabel: month.label || ''
        }));
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

const getUpcomingEvents = (events) => {
  const now = Date.now();
  return events.filter((event) => {
    const startTime = new Date(event.start).getTime();
    return !Number.isNaN(startTime) && startTime >= now;
  });
};

const getUpcomingByKind = (events, kind) => events.filter((event) => event.kind === kind);

const isSameLocalDate = (firstDate, secondDate) => {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
};

if (scheduleData) {
  const allEvents = flattenSchedule(scheduleData.months);
  const upcomingEvents = getUpcomingEvents(allEvents);
  const upcomingNowShowing = getUpcomingByKind(upcomingEvents, 'now-showing');
  const upcomingSpecialEvents = getUpcomingByKind(upcomingEvents, 'special-event');

  const heroFeatureHeading = document.getElementById('hero-feature-heading');
  const heroFeatureTitle = document.getElementById('hero-feature-title');
  const heroFeatureTime = document.getElementById('hero-feature-time');
  const heroFeatureNote = document.getElementById('hero-feature-note');
  const heroFeatureCta = document.getElementById('hero-feature-cta');

  if (heroFeatureHeading && heroFeatureTitle && heroFeatureTime && heroFeatureNote && heroFeatureCta) {
    const flaggedFeaturedEvent = upcomingEvents.find((event) => event.featured === true);
    const fallbackEvent = upcomingNowShowing[0] || upcomingSpecialEvents[0] || upcomingEvents[0];
    const heroEvent = flaggedFeaturedEvent || fallbackEvent;

    if (heroEvent) {
      const heroEventDate = new Date(heroEvent.start);
      const now = new Date();
      const isTonight = !Number.isNaN(heroEventDate.getTime()) && isSameLocalDate(heroEventDate, now);

      heroFeatureHeading.textContent = isTonight ? 'Tonight At The Plaza' : 'Featured At The Plaza';
      heroFeatureTitle.textContent = heroEvent.title;
      heroFeatureTime.textContent = formatEventSlot(heroEvent.start);
      heroFeatureNote.textContent = heroEvent.note || 'Doors open 30 minutes before showtime.';
      heroFeatureCta.href = scheduleData.ticketUrl;
    }
  }

  const homeNowShowing = document.getElementById('home-now-showing');

  if (homeNowShowing) {
    const featuredItems = upcomingNowShowing.slice(0, 3);
    homeNowShowing.innerHTML = featuredItems.length
      ? featuredItems
          .map(
            (item) => `
          <article class="show-card" role="listitem">
            <p class="event-slot">${formatEventSlot(item.start)}</p>
            ${buildCategoryBadge(item.category)}
            <h3>${item.title}</h3>
            <p>${item.note}</p>
            <a class="button secondary" href="${scheduleData.ticketUrl}">Tickets</a>
          </article>
        `
          )
          .join('')
      : '<article class="show-card" role="listitem"><h3>New showtimes coming soon</h3><p>Check back soon for the next round of screenings.</p></article>';
  }

  const showtimesTimeline = document.getElementById('showtimes-timeline');

  if (showtimesTimeline) {
    let lastMonthKey = '';
    showtimesTimeline.innerHTML = upcomingNowShowing.length
      ? upcomingNowShowing
          .map((item) => {
            const monthDivider =
              item.monthKey !== lastMonthKey
                ? `<li class="month-divider"><span>${item.monthLabel}</span></li>`
                : '';
            lastMonthKey = item.monthKey;

            return `
          ${monthDivider}
          <li>
            <span class="slot">${formatEventSlot(item.start)}</span>
            <div>
              ${buildCategoryBadge(item.category)}
              <h3>${item.title}</h3>
              <p>${item.note}</p>
            </div>
          </li>
        `;
          })
          .join('')
      : '<li class="empty-state">No upcoming feature showtimes are posted yet.</li>';
  }

  const specialEventsCards = document.getElementById('special-events-cards');

  if (specialEventsCards) {
    specialEventsCards.innerHTML = upcomingSpecialEvents.length
      ? upcomingSpecialEvents
          .map(
            (item) => `
          <article class="show-card">
            <p class="event-slot">${formatEventSlot(item.start)}</p>
            ${buildCategoryBadge(item.category)}
            <h3>${item.title}</h3>
            <p>${item.note}</p>
          </article>
        `
          )
          .join('')
      : '<article class="show-card"><h3>No upcoming special events right now</h3><p>More one-night programs will be announced soon.</p></article>';
  }
}
