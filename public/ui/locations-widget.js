(function () {
  function $(sel, root = document) { return root.querySelector(sel); }
  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    children.forEach(c => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
    return res.json();
  }

  function normalizeStr(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // quita tildes/diéresis para buscar, pero NO cambia el display
  }

  function buildFinalUrl(selected, cfg) {
    const mode = cfg.redirectMode || "county";
    const bookPath = cfg.bookPath || "";
    const base =
      mode === "city"
        ? selected.cityDomain
        : selected.countyDomain;

    if (!base) return null;

    // evita doble slash
    return base.replace(/\/$/, "") + (bookPath.startsWith("/") ? bookPath : "/" + bookPath);
  }

  // Determina folder type por estado
  function getDivisionFolder(stateName) {
    const n = normalizeStr(stateName);
    if (n === "louisiana") return "parishes";
    if (n === "puerto rico") return "cities";
    return "counties";
  }

  // Convierte stateName -> slug (alabama, new-york, etc.)
  function slugifyStateName(stateName) {
    return String(stateName || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Construye índice de búsqueda desde el json del estado
  function buildSearchIndex(stateJson, stateName, divisionFolder) {
    const counties = Array.isArray(stateJson?.counties) ? stateJson.counties : [];
    const out = [];

    // Puerto Rico (divisionFolder=cities): aún viene como counties[] con 1 county “Puerto Rico”
    // pero tú quieres permitir buscar por city; esto igual funciona.
    for (const c of counties) {
      const countyName = c?.countyName || "";
      const countyDomain = c?.countyDomain || "";
      out.push({
        type: divisionFolder === "cities" ? "City Group" : (divisionFolder === "parishes" ? "Parish" : "County"),
        label: countyName,
        stateName,
        countyName,
        countyDomain,
        cityName: null,
        cityDomain: null,
      });

      const cities = Array.isArray(c?.cities) ? c.cities : [];
      for (const city of cities) {
        out.push({
          type: "City",
          label: city?.cityName || "",
          stateName,
          countyName,
          countyDomain,
          cityName: city?.cityName || "",
          cityDomain: city?.cityDomain || "",
        });
      }
    }
    return out;
  }

  async function mount(selector, userCfg) {
    const cfg = userCfg || {};
    const root = typeof selector === "string" ? document.querySelector(selector) : selector;

    if (!root) throw new Error(`MDNLocationsWidget: mount root not found: ${selector}`);
    if (!cfg.statesIndexUrl) throw new Error("MDNLocationsWidget: statesIndexUrl is required");
    if (!cfg.statesFilesBaseUrl) throw new Error("MDNLocationsWidget: statesFilesBaseUrl is required");

    root.innerHTML = "";

    const ui = el("div", {}, []);

    // UI: State select
    const stateRow = el("div", { class: "field" }, [
      el("div", { class: "label" }, ["State"]),
    ]);

    const stateSelect = el("select", { class: "select" }, [
      el("option", { value: "" }, ["Select a state…"]),
    ]);

    stateRow.appendChild(stateSelect);

    const hint = el("div", { class: "hint" }, [
      "Pick a state, then search a county/parish/city and press ",
      el("b", {}, ["Book now"]),
      "."
    ]);

    // UI: Search
    const searchRow = el("div", { class: "field" }, [
      el("div", { class: "label" }, ["Search"]),
    ]);
    const searchInput = el("input", {
      class: "input",
      type: "text",
      placeholder: cfg.placeholder || "Search county or city…",
      disabled: "true",
    });
    searchRow.appendChild(searchInput);

    // Selected + Book button
    const actions = el("div", { class: "row" }, []);
    const selectedChip = el("div", { class: "chip" }, ["Selected: ", el("b", {}, ["None"])]);
    const bookBtn = el("button", { class: "btn", disabled: "true" }, ["Book now"]);
    actions.appendChild(selectedChip);
    actions.appendChild(bookBtn);

    const resultsBox = el("div", { class: "results", style: "display:none" }, []);

    ui.appendChild(stateRow);
    ui.appendChild(hint);
    ui.appendChild(el("div", { class: "divider" }, []));
    ui.appendChild(searchRow);
    ui.appendChild(resultsBox);
    ui.appendChild(actions);

    root.appendChild(ui);

    // State data
    let statesIndex;
    try {
      statesIndex = await fetchJson(cfg.statesIndexUrl);
    } catch (e) {
      root.appendChild(el("div", { class: "hint" }, [`Failed to load states index: ${e.message}`]));
      return;
    }

    // Soportar formatos distintos:
    // - { states: [{ stateName }] }
    // - [{ stateName }]
    // - { items: [...] }
    const rawStates =
      Array.isArray(statesIndex) ? statesIndex :
      Array.isArray(statesIndex?.states) ? statesIndex.states :
      Array.isArray(statesIndex?.items) ? statesIndex.items :
      [];

    const states = rawStates
      .map(s => ({
        stateName: s.stateName || s.name || s.state || "",
        slug: s.slug || s.stateSlug || slugifyStateName(s.stateName || s.name || s.state || ""),
      }))
      .filter(s => s.stateName);

    states.sort((a, b) => a.stateName.localeCompare(b.stateName));

    for (const s of states) {
      stateSelect.appendChild(el("option", { value: s.slug }, [s.stateName]));
    }

    let currentState = null;
    let index = [];
    let selected = null;

    function renderSelected() {
      const b = selectedChip.querySelector("b");
      if (!b) return;

      if (!selected) {
        b.textContent = "None";
        bookBtn.disabled = true;
        return;
      }

      if (selected.cityName) {
        b.textContent = `${selected.cityName} — ${selected.stateName}`;
      } else {
        b.textContent = `${selected.countyName} — ${selected.stateName}`;
      }
      bookBtn.disabled = false;
    }

    function renderResults(list) {
      resultsBox.innerHTML = "";
      if (!list.length) {
        resultsBox.style.display = "none";
        return;
      }
      resultsBox.style.display = "block";

      list.slice(0, 20).forEach(item => {
        const subtitle = item.cityName
          ? `${item.countyName} • ${item.stateName}`
          : `${item.stateName}`;

        const row = el("div", {
          class: "item",
          onclick: () => {
            selected = item;
            renderSelected();
            resultsBox.style.display = "none";
          }
        }, [
          el("div", { class: "k" }, [
            item.cityName ? `🏙️ ${item.cityName}` : `🗺️ ${item.countyName}`
          ]),
          el("div", { class: "s" }, [
            `${item.cityName ? "City" : item.type} • ${subtitle}`
          ])
        ]);

        resultsBox.appendChild(row);
      });
    }

    function filterIndex(q) {
      const nq = normalizeStr(q);
      if (!nq) return [];

      // si redirectMode=county, prioriza counties; si city, prioriza cities
      const mode = cfg.redirectMode || "county";

      const scored = index
        .map(item => {
          const hay = normalizeStr(
            item.cityName
              ? `${item.cityName} ${item.countyName} ${item.stateName}`
              : `${item.countyName} ${item.stateName}`
          );
          let score = 0;
          if (hay.startsWith(nq)) score += 3;
          if (hay.includes(nq)) score += 2;
          if ((mode === "city" && item.cityName) || (mode === "county" && !item.cityName)) score += 1;
          return { item, score };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);

      return scored.map(x => x.item);
    }

    // Events
    stateSelect.addEventListener("change", async () => {
      const slug = stateSelect.value;
      const opt = stateSelect.selectedOptions?.[0];
      const stateName = opt ? opt.textContent : "";
      selected = null;
      renderSelected();

      if (!slug) {
        currentState = null;
        index = [];
        searchInput.value = "";
        searchInput.disabled = true;
        resultsBox.style.display = "none";
        return;
      }

      currentState = { slug, stateName };
      searchInput.disabled = false;
      searchInput.value = "";
      resultsBox.style.display = "none";

      const divisionFolder = getDivisionFolder(stateName);

      // ✅ cargar el json del estado desde resources/statesFiles/<slug>.json
      const stateUrl = cfg.statesFilesBaseUrl.replace(/\/$/, "") + `/${slug}.json`;

      try {
        const stateJson = await fetchJson(stateUrl);
        index = buildSearchIndex(stateJson, stateName, divisionFolder);

        // Si redirectMode=county, le damos preferencia a seleccionar counties (sin cityName)
        // Si redirectMode=city, preferimos ciudades (con cityName)
      } catch (e) {
        index = [];
        resultsBox.style.display = "none";
        alert(`Failed to load state file: ${stateUrl}\n\n${e.message}`);
      }
    });

    searchInput.addEventListener("input", () => {
      const list = filterIndex(searchInput.value);
      renderResults(list);
    });

    bookBtn.addEventListener("click", () => {
      if (!selected) return;
      const url = buildFinalUrl(selected, cfg);
      if (!url) return alert("No domain found for this selection.");

      window.location.href = url; // same window
    });
  }

  // ✅ Exponer global para que puedas llamarlo desde locations.html
  window.MDNLocationsWidget = { mount };
})();
