(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let previousScrollY = window.scrollY;
  let scrollTicking = false;
  const updateHeader = () => {
    const currentY = window.scrollY;
    header.classList.toggle("scrolled", currentY > 24);
    if (window.innerWidth > 850) {
      if (currentY < 24) {
        header.classList.remove("header-hidden");
      } else if (currentY > previousScrollY + 4) {
        header.classList.remove("header-hidden");
      } else if (currentY < previousScrollY - 4) {
        header.classList.add("header-hidden");
      }
    } else {
      header.classList.remove("header-hidden");
    }
    previousScrollY = currentY;
    scrollTicking = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateHeader);
    }
  }, { passive: true });
  updateHeader();

  function closeMenu() {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
  }
  menuToggle.addEventListener("click", () => {
    const opening = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(opening));
    menuToggle.setAttribute("aria-label", opening ? "Закрыть меню" : "Открыть меню");
    mobileMenu.classList.toggle("open", opening);
    mobileMenu.setAttribute("aria-hidden", String(!opening));
    document.body.classList.toggle("menu-open", opening);
  });
  
  mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 850) closeMenu(); });

  document.querySelectorAll('a[href^="#"]:not([data-modal])').forEach(link => {
    link.addEventListener("click", event => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  const revealElements = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach(element => revealObserver.observe(element));

  const numberObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      const target = Number(node.dataset.count || 0);
      const duration = reduceMotion ? 1 : 1100;
      const start = performance.now();
      const tick = now => {
        const progress = Math.min((now - start) / duration, 1);
        node.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))).toLocaleString("ru-RU");
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      numberObserver.unobserve(node);
    });
  }, { threshold: 0.7 });
  document.querySelectorAll("[data-count]").forEach(node => numberObserver.observe(node));

  const filterButtons = document.querySelectorAll(".filter-button");
  const eventCards = document.querySelectorAll(".event-card");
  filterButtons.forEach(button => button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    eventCards.forEach(card => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  }));

  const backdrop = document.getElementById("modal-backdrop");
  const modal = backdrop.querySelector(".modal");
  const modalTitle = document.getElementById("modal-title");
  const modalContent = document.getElementById("modal-content");
  const modalClose = backdrop.querySelector(".modal-close");
  const modalAction = modal.querySelector(".modal-action");
  const modalTemplate = document.getElementById("modal-copy");
  let previousFocus = null;

  const modalTitles = {
    "event-wedding": "Свадьба", "event-anniversary": "Юбилей",
    "event-corporate": "Корпоратив", "event-birthday": "День рождения",
    "event-graduation": "Выпускной", "event-buffet": "Фуршет",
    "menu-request": "Запрос меню", "privacy": "Политика конфиденциальности", "booking": "Проверим, свободна ли дата"
  };

  function openModal(key) {
    const source = modalTemplate.content.querySelector(`[data-modal-content="${key}"]`);
    if (!source) return;
    previousFocus = document.activeElement;
    modalTitle.textContent = modalTitles[key] || "Подробнее";
    modal.classList.toggle("is-booking", key === "booking");
    if (modalAction) {
      modalAction.style.display = key === "privacy" ? "none" : "";
    }
    modalContent.replaceChildren(source.cloneNode(true));
    modal.scrollTop = 0;
    backdrop.hidden = false;
    document.body.classList.add("modal-open");
    modalClose.focus();
  }

  function closeModal() {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    modal.classList.remove("is-booking");
    document.body.classList.remove("modal-open");
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }

  document.querySelectorAll("[data-modal]").forEach(trigger => {
    trigger.addEventListener("click", event => {
      event.preventDefault();
      closeMenu();
      openModal(trigger.dataset.modal);
    });
  });

  modalClose.addEventListener("click", closeModal);
  backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModal(); });
  document.addEventListener("keydown", event => {
    if (backdrop.hidden) return;
    if (event.key === "Escape") { closeModal(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(element => element.offsetParent !== null);
    if (!focusable.length) { event.preventDefault(); modal.focus(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  if (modalAction) {
    modalAction.addEventListener("click", closeModal);
  }

  const BOOKING_CHAT_LINKS = {
    max: "",
    whatsapp: ""
  };
  
  function buildBookingMessage(formElement) {
    const data = new FormData(formElement);
    const lines = [
      "Здравствуйте! Хочу уточнить возможность бронирования в банкетном пространстве «Кристалл».",
      "",
      `Повод: ${data.get("occasion") || "не указан"}`,
      `Дата: ${data.get("dateIn") || "не указана"}`,
      `Гостей: ${data.get("guests") || "не указано"}`,
      `Детей: ${data.get("children") || "0"}`,
      `Имя: ${data.get("guestName") || "не указано"}`,
      `Комментарий: ${data.get("comment") || "нет"}`
    ];
    return lines.join("\n");
  }

  async function copyBookingMessage(message) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message);
      return;
    }
    const temporary = document.createElement("textarea");
    temporary.value = message;
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";
    document.body.appendChild(temporary);
    temporary.select();
    document.execCommand("copy");
    temporary.remove();
  }

  modalContent.addEventListener("click", async event => {
    const button = event.target.closest("[data-chat]");
    if (!button) return;
    const bookingModalForm = button.closest("#booking-modal-form");
    if (!bookingModalForm) return;
    
    if (!bookingModalForm.reportValidity()) {
      const invalidField = bookingModalForm.querySelector(':invalid');
      if (invalidField) invalidField.focus();
      return;
    }
    const status = bookingModalForm.querySelector(".booking-send-status");
    const messenger = button.dataset.chat;
    const message = buildBookingMessage(bookingModalForm);
    try {
      await copyBookingMessage(message);
      const target = BOOKING_CHAT_LINKS[messenger];
      if (target) {
        window.open(target, "_blank", "noopener,noreferrer");
        status.textContent = "Заявка скопирована. Вставьте её в открывшийся чат и отправьте.";
      } else {
        status.textContent = "Заявка скопирована в буфер обмена. Укажите ссылку на чат в BOOKING_CHAT_LINKS в script.js.";
      }
    } catch (error) {
      status.textContent = "Не удалось автоматически скопировать текст. Проверьте разрешение на буфер обмена.";
    }
  });

  const form = document.getElementById("booking-form");
  const status = document.getElementById("form-status");
  const submitButton = form.querySelector('button[type="submit"]');
  let lastSubmitAt = 0;
  const phoneDigits = value => value.replace(/\D/g, "");

  form.addEventListener("submit", async event => {
    event.preventDefault();
    status.textContent = "";
    status.classList.remove("error");

    const data = new FormData(form);
    if (String(data.get("website") || "").trim()) {
      status.textContent = "Не удалось обработать заявку.";
      status.classList.add("error");
      return;
    }

    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const digits = phoneDigits(phone);
    
    if (name.length < 2) {
      status.textContent = "Пожалуйста, укажите имя (не менее двух символов).";
      status.classList.add("error");
      form.elements.name.focus();
      return;
    }
    if (digits.length < 10 || digits.length > 15) {
      status.textContent = "Проверьте номер телефона — в нём должно быть от 10 до 15 цифр.";
      status.classList.add("error");
      form.elements.phone.focus();
      return;
    }
    if (!form.elements.consent.checked) {
      status.textContent = "Для продолжения необходимо согласие на обработку персональных данных.";
      status.classList.add("error");
      form.elements.consent.focus();
      return;
    }

    const remaining = 30000 - (Date.now() - lastSubmitAt);
    if (lastSubmitAt && remaining > 0) {
      status.textContent = `Повторную заявку можно отправить через ${Math.ceil(remaining / 1000)} сек.`;
      status.classList.add("error");
      return;
    }

    lastSubmitAt = Date.now();
    submitButton.disabled = true;
    submitButton.textContent = "Отправка…";
    try {
      await new Promise(resolve => window.setTimeout(resolve, 550));
      status.textContent = "Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.";
      form.reset();
    } catch (error) {
      console.error("Booking error:", error);
      status.textContent = "Не удалось обработать заявку. Попробуйте ещё раз позднее.";
      status.classList.add("error");
    } finally {
      submitButton.disabled = false;
     submitButton.innerHTML = 'Отправить заявку <svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>';
    }
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();