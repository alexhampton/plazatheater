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

const formatEventTime = (dateValue) => {
  const eventDate = new Date(dateValue);
  if (Number.isNaN(eventDate.getTime())) {
    return '';
  }

  return eventDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
};

const toLocalDateKey = (dateValue) => {
  const eventDate = new Date(dateValue);
  if (Number.isNaN(eventDate.getTime())) {
    return '';
  }

  const year = eventDate.getFullYear();
  const month = String(eventDate.getMonth() + 1).padStart(2, '0');
  const day = String(eventDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateFromKey = (dateKey, options) => {
  const parsedDate = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateKey;
  }

  return parsedDate.toLocaleDateString(undefined, options);
};

const parseMonthKey = (monthKey) => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!year || !month) {
    return null;
  }

  return { year, month };
};

const getStartOfWeek = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const formatWeekRangeLabel = (weekStartDate) => {
  const weekEndDate = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate() + 6);
  const startLabel = weekStartDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
  const endLabel = weekEndDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  return `${startLabel} - ${endLabel}`;
};

const buildDayBuckets = (events) => {
  const dayMap = new Map();
  events.forEach((event) => {
    const dayKey = toLocalDateKey(event.start);
    if (!dayKey) {
      return;
    }

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, []);
    }
    dayMap.get(dayKey).push(event);
  });

  dayMap.forEach((items) => {
    items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  });

  return dayMap;
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

const buildEventSchema = (event, ticketUrl) => {
  const startDate = new Date(event.start);
  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const urlPath = window.location.pathname.endsWith('showtimes.html') ? 'showtimes' : '';
  const baseUrl = 'https://www.myplazatheatre.com/';
  const eventPageUrl = `${baseUrl}${urlPath}`;

  return {
    '@type': 'Event',
    name: event.title,
    description: event.note || 'Screening at the Historic Plaza Theatre.',
    startDate: startDate.toISOString(),
    endDate: Number.isNaN(endDate.getTime()) ? undefined : endDate.toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventCategory: event.category,
    location: {
      '@type': 'Place',
      name: 'Historic Plaza Theatre',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '33 S Main St.',
        addressLocality: 'Miamisburg',
        addressRegion: 'OH',
        postalCode: '45342',
        addressCountry: 'US'
      }
    },
    organizer: {
      '@type': 'Organization',
      name: 'Plaza Theatre',
      url: baseUrl
    },
    image: ['https://static.wixstatic.com/media/1a7a4e_16adef8651e44c68a2e4590d26233c6d~mv2.png'],
    offers: {
      '@type': 'Offer',
      url: ticketUrl,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    url: eventPageUrl
  };
};

const injectEventStructuredData = (events, ticketUrl) => {
  const structuredEvents = events
    .map((event) => buildEventSchema(event, ticketUrl))
    .filter((event) => event !== null);

  if (!structuredEvents.length) {
    return;
  }

  const graphData = {
    '@context': 'https://schema.org',
    '@graph': structuredEvents
  };

  let scriptNode = document.getElementById('event-structured-data');
  if (!scriptNode) {
    scriptNode = document.createElement('script');
    scriptNode.type = 'application/ld+json';
    scriptNode.id = 'event-structured-data';
    document.head.appendChild(scriptNode);
  }

  scriptNode.textContent = JSON.stringify(graphData);
};

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
  const currentPagePath = window.location.pathname;
  const isShowtimesPage = currentPagePath.endsWith('/showtimes.html') || currentPagePath.endsWith('/showtimes');

  if (isShowtimesPage) {
    injectEventStructuredData([...upcomingNowShowing, ...upcomingSpecialEvents], scheduleData.ticketUrl);
  } else {
    injectEventStructuredData([...upcomingNowShowing.slice(0, 3), ...upcomingSpecialEvents.slice(0, 3)], scheduleData.ticketUrl);
  }

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
            const eventDayKey = toLocalDateKey(item.start);
            const monthDivider =
              item.monthKey !== lastMonthKey
                ? `<li class="month-divider"><span>${item.monthLabel}</span></li>`
                : '';
            lastMonthKey = item.monthKey;

            return `
          ${monthDivider}
          <li class="timeline-entry" data-day-key="${eventDayKey}">
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

  if (isShowtimesPage && showtimesTimeline) {
    const showtimesViewToggle = document.getElementById('showtimes-view-toggle');
    const showtimesCalendarWrap = document.getElementById('showtimes-calendar-wrap');
    const showtimesCalendarGrid = document.getElementById('showtimes-calendar-grid');
    const showtimesDayDetails = document.getElementById('showtimes-day-details');
    const showtimesCalendarNav = document.getElementById('showtimes-calendar-nav');
    const calendarMonthLabel = document.getElementById('calendar-month-label');
    const prevMonthButton = document.getElementById('calendar-prev-month');
    const nextMonthButton = document.getElementById('calendar-next-month');

    if (
      showtimesViewToggle &&
      showtimesCalendarWrap &&
      showtimesCalendarGrid &&
      showtimesDayDetails &&
      showtimesCalendarNav &&
      calendarMonthLabel &&
      prevMonthButton &&
      nextMonthButton
    ) {
      const storageKey = 'plazaShowtimesView';
      const monthKeys = [...new Set(upcomingNowShowing.map((event) => event.monthKey).filter(Boolean))];
      const dayBuckets = buildDayBuckets(upcomingNowShowing);

      let currentMonthIndex = 0;
      let selectedDateKey = upcomingNowShowing.length ? toLocalDateKey(upcomingNowShowing[0].start) : '';

      if (selectedDateKey) {
        const selectedMonth = selectedDateKey.slice(0, 7);
        const matchingMonthIndex = monthKeys.indexOf(selectedMonth);
        if (matchingMonthIndex >= 0) {
          currentMonthIndex = matchingMonthIndex;
        }
      }

      const getIsMobile = () => window.matchMedia('(max-width: 768px)').matches;
      const firstUpcomingDate = upcomingNowShowing.length ? new Date(upcomingNowShowing[0].start) : null;
      const lastUpcomingDate = upcomingNowShowing.length ? new Date(upcomingNowShowing[upcomingNowShowing.length - 1].start) : null;
      const firstUpcomingWeekStart = firstUpcomingDate ? getStartOfWeek(firstUpcomingDate) : null;
      const lastUpcomingWeekStart = lastUpcomingDate ? getStartOfWeek(lastUpcomingDate) : null;
      let currentWeekStartDate = selectedDateKey ? getStartOfWeek(new Date(`${selectedDateKey}T12:00:00`)) : null;
      let currentView = 'list';

      const setToggleState = (nextView) => {
        const toggleButtons = showtimesViewToggle.querySelectorAll('.toggle-option');
        toggleButtons.forEach((button) => {
          const isActive = button.dataset.viewMode === nextView;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', String(isActive));
        });
      };

      const applyListDateHighlight = () => {
        const timelineEntries = showtimesTimeline.querySelectorAll('.timeline-entry[data-day-key]');
        timelineEntries.forEach((entry) => {
          const isSelected = selectedDateKey && entry.getAttribute('data-day-key') === selectedDateKey;
          entry.classList.toggle('is-selected-date', isSelected);
        });
      };

      const renderDayDetails = () => {
        if (!selectedDateKey) {
          showtimesDayDetails.innerHTML = '<p>Select a date to preview showtimes.</p>';
          return;
        }

        const dayEvents = dayBuckets.get(selectedDateKey) || [];
        const dayHeading = formatDateFromKey(selectedDateKey, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

        if (!dayEvents.length) {
          showtimesDayDetails.innerHTML = `<h3>${dayHeading}</h3><p>No feature showtimes posted for this date.</p>`;
          return;
        }

        showtimesDayDetails.innerHTML = `
          <h3>${dayHeading}</h3>
          <ul class="day-details-list">
            ${dayEvents
              .map(
                (event) => `
                  <li class="day-details-item">
                    <p class="day-details-time">${formatEventTime(event.start)}</p>
                    ${buildCategoryBadge(event.category)}
                    <h4>${event.title}</h4>
                    <p>${event.note || ''}</p>
                    <a class="button secondary" href="${scheduleData.ticketUrl}">Tickets</a>
                  </li>
                `
              )
              .join('')}
          </ul>
        `;
      };

      const selectDate = (dateKey) => {
        selectedDateKey = dateKey;
        const selectedDate = new Date(`${selectedDateKey}T12:00:00`);
        if (!Number.isNaN(selectedDate.getTime())) {
          currentWeekStartDate = getStartOfWeek(selectedDate);
        }
        renderCalendar();
        renderDayDetails();
        applyListDateHighlight();
      };

      const renderCalendar = () => {
        if (!upcomingNowShowing.length) {
          calendarMonthLabel.textContent = 'No Upcoming Dates';
          showtimesCalendarGrid.innerHTML = '<p class="empty-state">No upcoming feature showtimes are posted yet.</p>';
          prevMonthButton.disabled = true;
          nextMonthButton.disabled = true;
          return;
        }

        const isMobileMode = getIsMobile();

        if (isMobileMode) {
          showtimesCalendarGrid.classList.add('is-week-mode');
          showtimesCalendarGrid.classList.remove('is-month-mode');

          if (!currentWeekStartDate) {
            currentWeekStartDate = getStartOfWeek(new Date(upcomingNowShowing[0].start));
          }

          calendarMonthLabel.textContent = formatWeekRangeLabel(currentWeekStartDate);
          const todayKey = toLocalDateKey(new Date());
          const calendarCells = [];

          for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
            const currentDate = new Date(
              currentWeekStartDate.getFullYear(),
              currentWeekStartDate.getMonth(),
              currentWeekStartDate.getDate() + dayOffset
            );
            const dayKey = toLocalDateKey(currentDate);
            const dayEvents = dayBuckets.get(dayKey) || [];
            const hasEvents = dayEvents.length > 0;
            const isSelected = selectedDateKey === dayKey;
            const isToday = todayKey === dayKey;
            const labelDate = currentDate.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
            const countLabel = hasEvents ? `${dayEvents.length}` : '0';
            const countAria = hasEvents
              ? `${dayEvents.length} ${dayEvents.length === 1 ? 'showtime' : 'showtimes'}`
              : 'No showtimes';

            calendarCells.push(`
              <button
                type="button"
                class="calendar-cell${hasEvents ? ' has-events' : ''}${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}"
                data-day-key="${dayKey}"
                aria-label="${labelDate}. ${countAria}."
              >
                <span class="calendar-day-number">${currentDate.getDate()}</span>
                <span class="calendar-count">${countLabel}</span>
              </button>
            `);
          }

          showtimesCalendarGrid.setAttribute('aria-label', `Weekly showtimes calendar for ${calendarMonthLabel.textContent}`);
          showtimesCalendarGrid.innerHTML = calendarCells.join('');
          prevMonthButton.disabled =
            !firstUpcomingWeekStart || currentWeekStartDate.getTime() <= firstUpcomingWeekStart.getTime();
          nextMonthButton.disabled =
            !lastUpcomingWeekStart || currentWeekStartDate.getTime() >= lastUpcomingWeekStart.getTime();
          return;
        }

        showtimesCalendarGrid.classList.remove('is-week-mode');
        showtimesCalendarGrid.classList.add('is-month-mode');

        if (!monthKeys.length) {
          calendarMonthLabel.textContent = 'No Upcoming Dates';
          showtimesCalendarGrid.innerHTML = '<p class="empty-state">No upcoming feature showtimes are posted yet.</p>';
          prevMonthButton.disabled = true;
          nextMonthButton.disabled = true;
          return;
        }

        const currentMonthKey = monthKeys[currentMonthIndex];
        const parsedMonth = parseMonthKey(currentMonthKey);
        if (!parsedMonth) {
          return;
        }

        const monthStart = new Date(parsedMonth.year, parsedMonth.month - 1, 1);
        const daysInMonth = new Date(parsedMonth.year, parsedMonth.month, 0).getDate();
        const firstWeekday = monthStart.getDay();
        const todayKey = toLocalDateKey(new Date());
        calendarMonthLabel.textContent = formatDateFromKey(`${currentMonthKey}-01`, {
          month: 'long',
          year: 'numeric'
        });

        const calendarCells = [];

        for (let i = 0; i < firstWeekday; i += 1) {
          calendarCells.push('<span class="calendar-cell is-empty" aria-hidden="true"></span>');
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
          const dayKey = `${currentMonthKey}-${String(day).padStart(2, '0')}`;
          const dayEvents = dayBuckets.get(dayKey) || [];
          const hasEvents = dayEvents.length > 0;
          const isSelected = selectedDateKey === dayKey;
          const isToday = todayKey === dayKey;
          const labelDate = formatDateFromKey(dayKey, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
          const countLabel = hasEvents
            ? `${dayEvents.length} ${dayEvents.length === 1 ? 'showtime' : 'showtimes'}`
            : 'No showtimes';

          calendarCells.push(`
            <button
              type="button"
              class="calendar-cell${hasEvents ? ' has-events' : ''}${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}"
              data-day-key="${dayKey}"
              aria-label="${labelDate}. ${countLabel}."
            >
              <span class="calendar-day-number">${day}</span>
              <span class="calendar-count">${countLabel}</span>
            </button>
          `);
        }

        showtimesCalendarGrid.setAttribute('aria-label', `Showtimes calendar for ${calendarMonthLabel.textContent}`);
        showtimesCalendarGrid.innerHTML = calendarCells.join('');
        prevMonthButton.disabled = currentMonthIndex === 0;
        nextMonthButton.disabled = currentMonthIndex === monthKeys.length - 1;
      };

      const updateMonthSelection = (nextIndex) => {
        if (nextIndex < 0 || nextIndex > monthKeys.length - 1) {
          return;
        }

        currentMonthIndex = nextIndex;
        const activeMonthKey = monthKeys[currentMonthIndex];
        const eventsInMonth = upcomingNowShowing.filter((event) => event.monthKey === activeMonthKey);
        selectedDateKey = eventsInMonth.length ? toLocalDateKey(eventsInMonth[0].start) : `${activeMonthKey}-01`;
        renderCalendar();
        renderDayDetails();
        applyListDateHighlight();
      };

      const updateWeekSelection = (weekOffset) => {
        if (!currentWeekStartDate) {
          return;
        }

        const nextWeekStart = new Date(
          currentWeekStartDate.getFullYear(),
          currentWeekStartDate.getMonth(),
          currentWeekStartDate.getDate() + 7 * weekOffset
        );

        if (firstUpcomingWeekStart && nextWeekStart.getTime() < firstUpcomingWeekStart.getTime()) {
          return;
        }
        if (lastUpcomingWeekStart && nextWeekStart.getTime() > lastUpcomingWeekStart.getTime()) {
          return;
        }

        currentWeekStartDate = nextWeekStart;

        const selectedDate = new Date(`${selectedDateKey}T12:00:00`);
        const selectedInWeek =
          !Number.isNaN(selectedDate.getTime()) &&
          selectedDate.getTime() >= currentWeekStartDate.getTime() &&
          selectedDate.getTime() < currentWeekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000;

        if (!selectedInWeek) {
          let firstEventInWeekKey = '';
          for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
            const dayDate = new Date(
              currentWeekStartDate.getFullYear(),
              currentWeekStartDate.getMonth(),
              currentWeekStartDate.getDate() + dayOffset
            );
            const dayKey = toLocalDateKey(dayDate);
            if ((dayBuckets.get(dayKey) || []).length) {
              firstEventInWeekKey = dayKey;
              break;
            }
          }
          selectedDateKey = firstEventInWeekKey || toLocalDateKey(currentWeekStartDate);
        }

        renderCalendar();
        renderDayDetails();
        applyListDateHighlight();
      };

      const applyView = (requestedView, persist = true) => {
        const normalizedView = requestedView === 'calendar' ? 'calendar' : 'list';
        currentView = normalizedView;

        const showCalendar = normalizedView === 'calendar';
        showtimesCalendarWrap.classList.toggle('is-hidden', !showCalendar);
        showtimesCalendarNav.classList.toggle('is-hidden', !showCalendar);
        showtimesTimeline.classList.toggle('is-hidden', showCalendar);
        setToggleState(normalizedView);

        if (persist) {
          localStorage.setItem(storageKey, normalizedView);
        }
      };

      showtimesViewToggle.addEventListener('click', (event) => {
        const button = event.target.closest('.toggle-option');
        if (!button) {
          return;
        }
        const nextView = button.dataset.viewMode === 'calendar' ? 'calendar' : 'list';
        applyView(nextView);
      });

      prevMonthButton.addEventListener('click', () => {
        if (getIsMobile()) {
          updateWeekSelection(-1);
          return;
        }
        updateMonthSelection(currentMonthIndex - 1);
      });

      nextMonthButton.addEventListener('click', () => {
        if (getIsMobile()) {
          updateWeekSelection(1);
          return;
        }
        updateMonthSelection(currentMonthIndex + 1);
      });

      showtimesCalendarGrid.addEventListener('click', (event) => {
        const cell = event.target.closest('.calendar-cell[data-day-key]');
        if (!cell) {
          return;
        }
        selectDate(cell.getAttribute('data-day-key'));
      });

      showtimesCalendarGrid.addEventListener('keydown', (event) => {
        const activeCell = event.target.closest('.calendar-cell[data-day-key]');
        if (!activeCell) {
          return;
        }

        const dayCells = [...showtimesCalendarGrid.querySelectorAll('.calendar-cell[data-day-key]')];
        const activeIndex = dayCells.indexOf(activeCell);
        if (activeIndex < 0) {
          return;
        }

        let nextIndex = -1;
        if (event.key === 'ArrowRight') {
          nextIndex = activeIndex + 1;
        }
        if (event.key === 'ArrowLeft') {
          nextIndex = activeIndex - 1;
        }
        if (event.key === 'ArrowDown') {
          nextIndex = activeIndex + 7;
        }
        if (event.key === 'ArrowUp') {
          nextIndex = activeIndex - 7;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectDate(activeCell.getAttribute('data-day-key'));
          return;
        }

        if (nextIndex >= 0 && nextIndex < dayCells.length) {
          event.preventDefault();
          dayCells[nextIndex].focus();
        }
      });

      window.addEventListener('resize', () => {
        if (getIsMobile()) {
          const selectedDate = new Date(`${selectedDateKey}T12:00:00`);
          if (!Number.isNaN(selectedDate.getTime())) {
            currentWeekStartDate = getStartOfWeek(selectedDate);
          }
        }
        renderCalendar();
        applyView(currentView, false);
      });

      const savedView = localStorage.getItem(storageKey);
      const defaultView = 'calendar';
      const preferredView = savedView === 'list' || savedView === 'calendar' ? savedView : defaultView;

      renderCalendar();
      renderDayDetails();
      applyListDateHighlight();
      applyView(preferredView, false);
    }
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
