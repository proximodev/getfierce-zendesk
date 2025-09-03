(function () {
  'use strict';

  // Key map
  const ENTER = 13;
  const ESCAPE = 27;

  function toggleNavigation(toggle, menu) {
    const isExpanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", !isExpanded);
    toggle.setAttribute("aria-expanded", !isExpanded);
  }

  function closeNavigation(toggle, menu) {
    menu.setAttribute("aria-expanded", false);
    toggle.setAttribute("aria-expanded", false);
    toggle.focus();
  }

  // Navigation

  window.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".header .menu-button-mobile");
    const menuList = document.querySelector("#user-nav-mobile");

    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNavigation(menuButton, menuList);
    });

    menuList.addEventListener("keyup", (event) => {
      if (event.keyCode === ESCAPE) {
        event.stopPropagation();
        closeNavigation(menuButton, menuList);
      }
    });

    // Toggles expanded aria to collapsible elements
    const collapsible = document.querySelectorAll(
      ".collapsible-nav, .collapsible-sidebar"
    );

    collapsible.forEach((element) => {
      const toggle = element.querySelector(
        ".collapsible-nav-toggle, .collapsible-sidebar-toggle"
      );

      element.addEventListener("click", () => {
        toggleNavigation(toggle, element);
      });

      element.addEventListener("keyup", (event) => {
        console.log("escape");
        if (event.keyCode === ESCAPE) {
          closeNavigation(toggle, element);
        }
      });
    });

    // If multibrand search has more than 5 help centers or categories collapse the list
    const multibrandFilterLists = document.querySelectorAll(
      ".multibrand-filter-list"
    );
    multibrandFilterLists.forEach((filter) => {
      if (filter.children.length > 6) {
        // Display the show more button
        const trigger = filter.querySelector(".see-all-filters");
        trigger.setAttribute("aria-hidden", false);

        // Add event handler for click
        trigger.addEventListener("click", (event) => {
          event.stopPropagation();
          trigger.parentNode.removeChild(trigger);
          filter.classList.remove("multibrand-filter-list--collapsed");
        });
      }
    });
  });

  const isPrintableChar = (str) => {
    return str.length === 1 && str.match(/^\S$/);
  };

  function Dropdown(toggle, menu) {
    this.toggle = toggle;
    this.menu = menu;

    this.menuPlacement = {
      top: menu.classList.contains("dropdown-menu-top"),
      end: menu.classList.contains("dropdown-menu-end"),
    };

    this.toggle.addEventListener("click", this.clickHandler.bind(this));
    this.toggle.addEventListener("keydown", this.toggleKeyHandler.bind(this));
    this.menu.addEventListener("keydown", this.menuKeyHandler.bind(this));
    document.body.addEventListener("click", this.outsideClickHandler.bind(this));

    const toggleId = this.toggle.getAttribute("id") || crypto.randomUUID();
    const menuId = this.menu.getAttribute("id") || crypto.randomUUID();

    this.toggle.setAttribute("id", toggleId);
    this.menu.setAttribute("id", menuId);

    this.toggle.setAttribute("aria-controls", menuId);
    this.menu.setAttribute("aria-labelledby", toggleId);

    this.menu.setAttribute("tabindex", -1);
    this.menuItems.forEach((menuItem) => {
      menuItem.tabIndex = -1;
    });

    this.focusedIndex = -1;
  }

  Dropdown.prototype = {
    get isExpanded() {
      return this.toggle.getAttribute("aria-expanded") === "true";
    },

    get menuItems() {
      return Array.prototype.slice.call(
        this.menu.querySelectorAll("[role='menuitem'], [role='menuitemradio']")
      );
    },

    dismiss: function () {
      if (!this.isExpanded) return;

      this.toggle.removeAttribute("aria-expanded");
      this.menu.classList.remove("dropdown-menu-end", "dropdown-menu-top");
      this.focusedIndex = -1;
    },

    open: function () {
      if (this.isExpanded) return;

      this.toggle.setAttribute("aria-expanded", true);
      this.handleOverflow();
    },

    handleOverflow: function () {
      var rect = this.menu.getBoundingClientRect();

      var overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight,
      };

      if (overflow.right || this.menuPlacement.end) {
        this.menu.classList.add("dropdown-menu-end");
      }

      if (overflow.bottom || this.menuPlacement.top) {
        this.menu.classList.add("dropdown-menu-top");
      }

      if (this.menu.getBoundingClientRect().top < 0) {
        this.menu.classList.remove("dropdown-menu-top");
      }
    },

    focusByIndex: function (index) {
      if (!this.menuItems.length) return;

      this.menuItems.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.tabIndex = 0;
          item.focus();
        } else {
          item.tabIndex = -1;
        }
      });

      this.focusedIndex = index;
    },

    focusFirstMenuItem: function () {
      this.focusByIndex(0);
    },

    focusLastMenuItem: function () {
      this.focusByIndex(this.menuItems.length - 1);
    },

    focusNextMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const nextIndex = (currentIndex + 1) % this.menuItems.length;

      this.focusByIndex(nextIndex);
    },

    focusPreviousMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const previousIndex =
        currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;

      this.focusByIndex(previousIndex);
    },

    focusByChar: function (currentItem, char) {
      char = char.toLowerCase();

      const itemChars = this.menuItems.map((menuItem) =>
        menuItem.textContent.trim()[0].toLowerCase()
      );

      const startIndex =
        (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;

      // look up starting from current index
      let index = itemChars.indexOf(char, startIndex);

      // if not found, start from start
      if (index === -1) {
        index = itemChars.indexOf(char, 0);
      }

      if (index > -1) {
        this.focusByIndex(index);
      }
    },

    outsideClickHandler: function (e) {
      if (
        this.isExpanded &&
        !this.toggle.contains(e.target) &&
        !e.composedPath().includes(this.menu)
      ) {
        this.dismiss();
        this.toggle.focus();
      }
    },

    clickHandler: function (event) {
      event.stopPropagation();
      event.preventDefault();

      if (this.isExpanded) {
        this.dismiss();
        this.toggle.focus();
      } else {
        this.open();
        this.focusFirstMenuItem();
      }
    },

    toggleKeyHandler: function (e) {
      const key = e.key;

      switch (key) {
        case "Enter":
        case " ":
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusFirstMenuItem();
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusLastMenuItem();
          break;
        }
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
      }
    },

    menuKeyHandler: function (e) {
      const key = e.key;
      const currentElement = this.menuItems[this.focusedIndex];

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      switch (key) {
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.focusNextMenuItem(currentElement);
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();
          this.focusPreviousMenuItem(currentElement);
          break;
        }
        case "Home":
        case "PageUp": {
          e.stopPropagation();
          e.preventDefault();
          this.focusFirstMenuItem();
          break;
        }
        case "End":
        case "PageDown": {
          e.stopPropagation();
          e.preventDefault();
          this.focusLastMenuItem();
          break;
        }
        case "Tab": {
          if (e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            this.dismiss();
            this.toggle.focus();
          } else {
            this.dismiss();
          }
          break;
        }
        default: {
          if (isPrintableChar(key)) {
            e.stopPropagation();
            e.preventDefault();
            this.focusByChar(currentElement, key);
          }
        }
      }
    },
  };

  // Drodowns

  window.addEventListener("DOMContentLoaded", () => {
    const dropdowns = [];
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
      const menu = toggle.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        dropdowns.push(new Dropdown(toggle, menu));
      }
    });
  });

  // Share

  window.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".share a");
    links.forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.open(anchor.href, "", "height = 500, width = 500");
      });
    });
  });

  // Vanilla JS debounce function, by Josh W. Comeau:
  // https://www.joshwcomeau.com/snippets/javascript/debounce/
  function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }

  // Define variables for search field
  let searchFormFilledClassName = "search-has-value";
  let searchFormSelector = "form[role='search']";

  // Clear the search input, and then return focus to it
  function clearSearchInput(event) {
    event.target
      .closest(searchFormSelector)
      .classList.remove(searchFormFilledClassName);

    let input;
    if (event.target.tagName === "INPUT") {
      input = event.target;
    } else if (event.target.tagName === "BUTTON") {
      input = event.target.previousElementSibling;
    } else {
      input = event.target.closest("button").previousElementSibling;
    }
    input.value = "";
    input.focus();
  }

  // Have the search input and clear button respond
  // when someone presses the escape key, per:
  // https://twitter.com/adambsilver/status/1152452833234554880
  function clearSearchInputOnKeypress(event) {
    const searchInputDeleteKeys = ["Delete", "Escape"];
    if (searchInputDeleteKeys.includes(event.key)) {
      clearSearchInput(event);
    }
  }

  // Create an HTML button that all users -- especially keyboard users --
  // can interact with, to clear the search input.
  // To learn more about this, see:
  // https://adrianroselli.com/2019/07/ignore-typesearch.html#Delete
  // https://www.scottohara.me/blog/2022/02/19/custom-clear-buttons.html
  function buildClearSearchButton(inputId) {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-controls", inputId);
    button.classList.add("clear-button");
    const buttonLabel = window.searchClearButtonLabelLocalized;
    const icon = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${buttonLabel}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;
    button.innerHTML = icon;
    button.addEventListener("click", clearSearchInput);
    button.addEventListener("keyup", clearSearchInputOnKeypress);
    return button;
  }

  // Append the clear button to the search form
  function appendClearSearchButton(input, form) {
    const searchClearButton = buildClearSearchButton(input.id);
    form.append(searchClearButton);
    if (input.value.length > 0) {
      form.classList.add(searchFormFilledClassName);
    }
  }

  // Add a class to the search form when the input has a value;
  // Remove that class from the search form when the input doesn't have a value.
  // Do this on a delay, rather than on every keystroke.
  const toggleClearSearchButtonAvailability = debounce((event) => {
    const form = event.target.closest(searchFormSelector);
    form.classList.toggle(
      searchFormFilledClassName,
      event.target.value.length > 0
    );
  }, 200);

  // Search

  window.addEventListener("DOMContentLoaded", () => {
    // Set up clear functionality for the search field
    const searchForms = [...document.querySelectorAll(searchFormSelector)];
    const searchInputs = searchForms.map((form) =>
      form.querySelector("input[type='search']")
    );
    searchInputs.forEach((input) => {
      appendClearSearchButton(input, input.closest(searchFormSelector));
      input.addEventListener("keyup", clearSearchInputOnKeypress);
      input.addEventListener("keyup", toggleClearSearchButtonAvailability);
    });
  });

  const key = "returnFocusTo";

  function saveFocus() {
    const activeElementId = document.activeElement.getAttribute("id");
    sessionStorage.setItem(key, "#" + activeElementId);
  }

  function returnFocus() {
    const returnFocusTo = sessionStorage.getItem(key);
    if (returnFocusTo) {
      sessionStorage.removeItem("returnFocusTo");
      const returnFocusToEl = document.querySelector(returnFocusTo);
      returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
    }
  }

  // Forms
  window.addEventListener("DOMContentLoaded", () => {
    // In some cases we should preserve focus after page reload
    returnFocus();

    // show form controls when the textarea receives focus or back button is used and value exists
    const commentContainerTextarea = document.querySelector(
      ".comment-container textarea"
    );
    const commentContainerFormControls = document.querySelector(
      ".comment-form-controls, .comment-ccs"
    );

    if (commentContainerTextarea) {
      commentContainerTextarea.addEventListener(
        "focus",
        function focusCommentContainerTextarea() {
          commentContainerFormControls.style.display = "block";
          commentContainerTextarea.removeEventListener(
            "focus",
            focusCommentContainerTextarea
          );
        }
      );

      if (commentContainerTextarea.value !== "") {
        commentContainerFormControls.style.display = "block";
      }
    }

    // Expand Request comment form when Add to conversation is clicked
    const showRequestCommentContainerTrigger = document.querySelector(
      ".request-container .comment-container .comment-show-container"
    );
    const requestCommentFields = document.querySelectorAll(
      ".request-container .comment-container .comment-fields"
    );
    const requestCommentSubmit = document.querySelector(
      ".request-container .comment-container .request-submit-comment"
    );

    if (showRequestCommentContainerTrigger) {
      showRequestCommentContainerTrigger.addEventListener("click", () => {
        showRequestCommentContainerTrigger.style.display = "none";
        Array.prototype.forEach.call(requestCommentFields, (element) => {
          element.style.display = "block";
        });
        requestCommentSubmit.style.display = "inline-block";

        if (commentContainerTextarea) {
          commentContainerTextarea.focus();
        }
      });
    }

    // Mark as solved button
    const requestMarkAsSolvedButton = document.querySelector(
      ".request-container .mark-as-solved:not([data-disabled])"
    );
    const requestMarkAsSolvedCheckbox = document.querySelector(
      ".request-container .comment-container input[type=checkbox]"
    );
    const requestCommentSubmitButton = document.querySelector(
      ".request-container .comment-container input[type=submit]"
    );

    if (requestMarkAsSolvedButton) {
      requestMarkAsSolvedButton.addEventListener("click", () => {
        requestMarkAsSolvedCheckbox.setAttribute("checked", true);
        requestCommentSubmitButton.disabled = true;
        requestMarkAsSolvedButton.setAttribute("data-disabled", true);
        requestMarkAsSolvedButton.form.submit();
      });
    }

    // Change Mark as solved text according to whether comment is filled
    const requestCommentTextarea = document.querySelector(
      ".request-container .comment-container textarea"
    );

    const usesWysiwyg =
      requestCommentTextarea &&
      requestCommentTextarea.dataset.helper === "wysiwyg";

    function isEmptyPlaintext(s) {
      return s.trim() === "";
    }

    function isEmptyHtml(xml) {
      const doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
      const img = doc.querySelector("img");
      return img === null && isEmptyPlaintext(doc.children[0].textContent);
    }

    const isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

    if (requestCommentTextarea) {
      requestCommentTextarea.addEventListener("input", () => {
        if (isEmpty(requestCommentTextarea.value)) {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute("data-solve-translation");
          }
        } else {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute(
                "data-solve-and-submit-translation"
              );
          }
        }
      });
    }

    const selects = document.querySelectorAll(
      "#request-status-select, #request-organization-select"
    );

    selects.forEach((element) => {
      element.addEventListener("change", (event) => {
        event.stopPropagation();
        saveFocus();
        element.form.submit();
      });
    });

    // Submit requests filter form on search in the request list page
    const quickSearch = document.querySelector("#quick-search");
    if (quickSearch) {
      quickSearch.addEventListener("keyup", (event) => {
        if (event.keyCode === ENTER) {
          event.stopPropagation();
          saveFocus();
          quickSearch.form.submit();
        }
      });
    }

    // Submit organization form in the request page
    const requestOrganisationSelect = document.querySelector(
      "#request-organization select"
    );

    if (requestOrganisationSelect) {
      requestOrganisationSelect.addEventListener("change", () => {
        requestOrganisationSelect.form.submit();
      });

      requestOrganisationSelect.addEventListener("click", (e) => {
        // Prevents Ticket details collapsible-sidebar to close on mobile
        e.stopPropagation();
      });
    }

    // If there are any error notifications below an input field, focus that field
    const notificationElm = document.querySelector(".notification-error");
    if (
      notificationElm &&
      notificationElm.previousElementSibling &&
      typeof notificationElm.previousElementSibling.focus === "function"
    ) {
      notificationElm.previousElementSibling.focus();
    }
  });

  (function () {
    // Copenhagen defaults: category tiles (home), page titles, etc.
    const selectors = [
      '.blocks-item-title',   // home_page.hbs category tiles
      '.page-title',          // category/section page <h1>
    ].join(',');

    // Remove leading emoji(s) + optional space
    const stripEmojiPrefix = (s) =>
        s.replace(/^\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*\s*/u, '');

    function clean() {
      document.querySelectorAll(selectors).forEach((el) => {
        const original = el.textContent || '';
        const cleaned = stripEmojiPrefix(original);
        if (cleaned !== original) el.textContent = cleaned;
      });
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', clean)
        : clean();
  })();

})();


// Inject category breadcrumb on article and section pages
document.addEventListener("DOMContentLoaded", async () => {
  const catBreadcrumb = document.getElementById("category-breadcrumb");
  if (!catBreadcrumb) return;

  const path = window.location.pathname.replace(/\/+$/, "");
  const locale = (path.match(/\/hc\/([a-z-]+)\//i)?.[1] || document.documentElement.lang || "en-us").toLowerCase();

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status + " " + url);
    return res.json();
  }

  async function getCategoryForCurrentPage() {
    // /sections/12345-...
    const secMatch = path.match(/\/sections\/(\d+)/);
    if (secMatch) {
      const { section } = await fetchJSON(`/api/v2/help_center/${locale}/sections/${secMatch[1]}.json`);
      const { category } = await fetchJSON(`/api/v2/help_center/${locale}/categories/${section.category_id}.json`);
      return category;
    }

    // /articles/67890-...
    const artMatch = path.match(/\/articles\/(\d+)/);
    if (artMatch) {
      const { article } = await fetchJSON(`/api/v2/help_center/${locale}/articles/${artMatch[1]}.json`);
      const { section } = await fetchJSON(`/api/v2/help_center/${locale}/sections/${article.section_id}.json`);
      const { category } = await fetchJSON(`/api/v2/help_center/${locale}/categories/${section.category_id}.json`);
      return category;
    }

    return null;
  }

  try {
    const category = await getCategoryForCurrentPage();
    if (category) {
      catBreadcrumb.innerHTML = `<a href="${category.html_url}">${category.name}</a>`;
    }
  } catch (e) {
    console.error("Breadcrumb build failed:", e);
  }
});

(function () {
  const selectors = [
    '.blocks-item-title',
    '.toc-item span',
    '.toc-item a span',
    '.toc-title a',
    '.breadcrumbs li',
    '.breadcrumbs li a',
    '.page-title',
    '.category-list .category-list-title',
    '.section-list .section-list-title',
    '.article-list .article-list-link'
  ].join(',');

  // 2) Robust stripper: tries Unicode first; falls back if unsupported
  const unicodeRe = (() => {
    try {
      return new RegExp('^[\\p{Extended_Pictographic}\\p{S}\\p{P}\\s]+', 'u'); // emoji/symbol/punct/space
    } catch (_) {
      return null;
    }
  })();
  const fallbackRe = /^[^\w]+/; // broad fallback

  const strip = (s) => {
    if (!s) return s;
    let out = s;
    if (unicodeRe) out = out.replace(unicodeRe, '');
    else out = out.replace(fallbackRe, '');
    return out.trim();
  };

  function cleanOnce(root = document) {
    root.querySelectorAll(selectors).forEach((el) => {
      const orig = el.textContent || '';
      const cleaned = strip(orig);
      if (cleaned && cleaned !== orig) {
        el.textContent = cleaned;
      }
    });
  }

  // Run immediately + on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => cleanOnce());
  } else {
    cleanOnce();
  }

  // 3) Handle SPA-ish nav / async loads
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.addedNodes && m.addedNodes.length) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) cleanOnce(n);
        });
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

})();

//Output TOC with articles
document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("all-categories-list"); if (!list) return;

  const locale = (location.pathname.match(/\/hc\/([a-z-]+)\//i)?.[1] || document.documentElement.lang || "en-us").toLowerCase();
  const curPath = new URL(location.href).pathname.replace(/\/+$/,"");

  const getAll = async (url) => {
    const out = [];
    for (let next = url; next;) {
      const r = await fetch(next);
      if (!r.ok) throw new Error(`${r.status} ${next}`);
      const j = await r.json();
      const key = Object.keys(j).find(k => Array.isArray(j[k]));
      if (key) out.push(...j[key]);
      next = j.next_page;
    }
    return out;
  };

  const getCurrentCategoryId = async () => {
    const cat = curPath.match(/\/categories\/(\d+)/)?.[1];
    if (cat) return cat;
    const sec = curPath.match(/\/sections\/(\d+)/)?.[1];
    if (sec) {
      const { section } = await (await fetch(`/api/v2/help_center/${locale}/sections/${sec}.json`)).json();
      return String(section.category_id);
    }
    const art = curPath.match(/\/articles\/(\d+)/)?.[1];
    if (art) {
      const { article } = await (await fetch(`/api/v2/help_center/${locale}/articles/${art}.json`)).json();
      const { section } = await (await fetch(`/api/v2/help_center/${locale}/sections/${article.section_id}.json`)).json();
      return String(section.category_id);
    }
    return null;
  };

  const renderCats = (cats, currentId) => {
    list.innerHTML = cats.map(c => {
      if (String(c.id) === String(currentId)) {
        return `<li class="toc-item is-active" data-cat-id="${c.id}" aria-current="page">
                  <span class="toc-title">${c.name}</span>
                  <ul class="toc-articles"></ul>
                </li>`;
      }
      return `<li class="toc-item"><a href="${c.html_url}" class="toc-item-link"><span class="toc-title">${c.name}</span></a></li>`;
    }).join("");
  };

  const expandCurrent = async (catId) => {
    if (!catId) return;
    const mount = list.querySelector(`li[data-cat-id="${catId}"] ul.toc-articles`); if (!mount) return;

    // Gather all articles in the category (flattened)
    const sections = await getAll(`/api/v2/help_center/${locale}/categories/${catId}/sections.json?per_page=100`);
    const articles = (await Promise.all(sections.map(s =>
        getAll(`/api/v2/help_center/${locale}/sections/${s.id}/articles.json?per_page=100`)
    ))).flat();

    // Render, mark current as active and omit link
    mount.innerHTML = articles.map(a => {
      const path = new URL(a.html_url, location.origin).pathname.replace(/\/+$/,"");
      const isCurrent = path === curPath;
      return `<li class="toc-article">` +
          (isCurrent
              ? `<span class="is-active" aria-current="page">${a.title}</span>`
              : `<a href="${a.html_url}">${a.title}</a>`) +
          `</li>`;
    }).join("");
  };

  (async () => {
    try {
      const [cats, currentId] = await Promise.all([
        getAll(`/api/v2/help_center/${locale}/categories.json?per_page=100&sort_by=position`),
        getCurrentCategoryId()
      ]);
      renderCats(cats, currentId);
      await expandCurrent(currentId);
    } catch (e) {
      console.error("[TOC] build failed:", e);
      list.innerHTML = '<li class="toc-error">Unable to load categories/articles.</li>';
    }
  })();
});
