// public/ui/locations-widget.js
(function () {
    function el(tag, attrs = {}, children = []) {
        const node = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => {
            if (k === "class") node.className = v;
            else if (k === "style") node.setAttribute("style", v);
            else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
            else node.setAttribute(k, v);
        });
        (Array.isArray(children) ? children : [children]).forEach((c) => {
            if (c == null) return;
            node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
        });
        return node;
    }

    function normalize(str) {
        return (str || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // diacríticos
            .toLowerCase()
            .trim();
    }

    async function fetchJson(url) {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
        return await res.json();
    }

    function findCityInState(stateJson, cityName) {
        const target = normalize(cityName);
        for (const county of stateJson.counties || []) {
            for (const city of county.cities || []) {
                if (normalize(city.cityName) === target) {
                    return { county, city };
                }
            }
        }
        return null;
    }

    function makeResults(cities) {
        // cities: [{ cityName, countyName }]
        const ul = el("div", { class: "mdn-loc-results" });
        cities.forEach((item) => {
            const row = el("div", { class: "mdn-loc-row", "data-city": item.cityName }, [
                el("div", { class: "mdn-loc-city" }, item.cityName),
                el("div", { class: "mdn-loc-county" }, item.countyName),
            ]);
            ul.appendChild(row);
        });
        return ul;
    }

    function injectStyles() {
        const css = `
      .mdn-loc-wrap{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;width:100%;}
      .mdn-loc-bar{display:flex;gap:10px;align-items:center;max-width:900px;margin:0 auto;}
      .mdn-loc-select,.mdn-loc-input{width:100%;padding:14px 14px;border:1px solid rgba(0,0,0,.15);border-radius:12px;font-size:16px;outline:none;}
      .mdn-loc-input:focus,.mdn-loc-select:focus{border-color: rgba(0,0,0,.35);}
      .mdn-loc-btn{padding:14px 16px;border-radius:12px;border:none;cursor:pointer;font-weight:600;}
      .mdn-loc-btn-primary{background:#0b5961;color:#fff;}
      .mdn-loc-meta{max-width:900px;margin:10px auto 0;color:rgba(0,0,0,.6);font-size:13px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;}
      .mdn-loc-panel{position:relative;max-width:900px;margin:10px auto 0;}
      .mdn-loc-results{border:1px solid rgba(0,0,0,.12);border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.07);}
      .mdn-loc-row{padding:12px 14px;display:flex;justify-content:space-between;gap:10px;cursor:pointer;}
      .mdn-loc-row:hover{background:rgba(0,0,0,.04);}
      .mdn-loc-city{font-weight:650;}
      .mdn-loc-county{color:rgba(0,0,0,.6);font-size:13px;align-self:center;}
      .mdn-loc-hidden{display:none;}
      .mdn-loc-sticky{position:fixed;right:18px;bottom:18px;z-index:99999;}
      .mdn-loc-sticky a{display:inline-block;padding:14px 16px;border-radius:999px;background:#0b5961;color:#fff;text-decoration:none;font-weight:700;box-shadow:0 10px 25px rgba(0,0,0,.18);}
    `;
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    }

    async function init(rootEl, opts) {
        injectStyles();

        const config = {
            statesIndexUrl: opts.statesIndexUrl,
            redirectMode: opts.redirectMode || "county", // "county" | "city"
            bookPath: opts.bookPath || "/book-service",
            stickyBook: opts.stickyBook !== false,
            placeholder: opts.placeholder || "Choose your City, State, or Country",
        };

        let statesIndex = null;
        let selectedState = null;
        let selectedStateJson = null;

        const stateSelect = el("select", { class: "mdn-loc-select" });
        stateSelect.appendChild(el("option", { value: "" }, "Select a State"));

        const input = el("input", {
            class: "mdn-loc-input",
            type: "text",
            placeholder: config.placeholder,
            disabled: true,
        });

        const bookBtn = el("button", { class: "mdn-loc-btn mdn-loc-btn-primary", type: "button" }, "Book");
        const resultsHost = el("div", { class: "mdn-loc-panel mdn-loc-hidden" });

        const meta = el("div", { class: "mdn-loc-meta" }, [
            el("div", {}, "Tip: Select a state first, then search for a city."),
            el("div", { id: "mdn-loc-selected" }, ""),
        ]);

        const bar = el("div", { class: "mdn-loc-bar" }, [stateSelect, input, bookBtn]);
        const wrap = el("div", { class: "mdn-loc-wrap" }, [bar, meta, resultsHost]);
        rootEl.appendChild(wrap);

        function setSelectedLabel(text) {
            const elSel = wrap.querySelector("#mdn-loc-selected");
            if (elSel) elSel.textContent = text || "";
        }

        function setSticky(linkUrl, label) {
            const existing = document.getElementById("mdn-loc-sticky");
            if (!config.stickyBook) return;

            if (!existing) {
                const div = el("div", { class: "mdn-loc-sticky", id: "mdn-loc-sticky" }, [
                    el("a", { href: linkUrl || "#", id: "mdn-loc-sticky-a" }, label || "Book"),
                ]);
                document.body.appendChild(div);
            } else {
                const a = existing.querySelector("#mdn-loc-sticky-a");
                if (a) {
                    a.href = linkUrl || "#";
                    a.textContent = label || "Book";
                }
            }
        }

        function computeBookUrl(selection) {
            // selection: { county, city, stateSlug }
            const targetDomain = config.redirectMode === "city" ? selection.city.cityDomain : selection.county.countyDomain;
            // Si quieres que el book vaya a una ruta específica dentro del county:
            // Ej: https://coffee-county-al.mydripnurse.com/book-service
            return `${targetDomain}${config.bookPath}`;
        }

        function saveSelection(sel) {
            localStorage.setItem(
                "mdn_location_selection",
                JSON.stringify({
                    stateName: selectedState.stateName,
                    stateSlug: selectedState.stateSlug,
                    redirectMode: config.redirectMode,
                    cityName: sel.city.cityName,
                    countyName: sel.county.countyName,
                    bookUrl: computeBookUrl({ ...sel, stateSlug: selectedState.stateSlug }),
                    ts: Date.now(),
                })
            );
        }

        function loadSelection() {
            try {
                const raw = localStorage.getItem("mdn_location_selection");
                if (!raw) return null;
                return JSON.parse(raw);
            } catch {
                return null;
            }
        }

        function hideResults() {
            resultsHost.classList.add("mdn-loc-hidden");
            resultsHost.innerHTML = "";
        }

        function showResults(list) {
            resultsHost.classList.remove("mdn-loc-hidden");
            resultsHost.innerHTML = "";
            resultsHost.appendChild(list);
        }

        // Load states index
        try {
            statesIndex = await fetchJson(config.statesIndexUrl);
            (statesIndex.states || []).forEach((s) => {
                stateSelect.appendChild(el("option", { value: s.stateSlug }, s.stateName));
            });
        } catch (e) {
            setSelectedLabel("Error loading states index.");
            console.error(e);
            return;
        }

        // Restore previous selection (optional)
        const prev = loadSelection();
        if (prev?.stateSlug) {
            stateSelect.value = prev.stateSlug;
            // trigger loading
            stateSelect.dispatchEvent(new Event("change"));
        } else {
            setSticky("#", "Book");
        }

        stateSelect.addEventListener("change", async () => {
            hideResults();
            input.value = "";
            input.disabled = true;

            const slug = stateSelect.value;
            if (!slug) {
                selectedState = null;
                selectedStateJson = null;
                setSelectedLabel("");
                setSticky("#", "Book");
                return;
            }

            selectedState = (statesIndex.states || []).find((s) => s.stateSlug === slug);
            if (!selectedState) return;

            setSelectedLabel(`Loading ${selectedState.stateName}...`);
            try {
                selectedStateJson = await fetchJson(selectedState.stateJsonUrl);
                input.disabled = false;
                setSelectedLabel(`Selected: ${selectedState.stateName}`);
            } catch (e) {
                console.error(e);
                setSelectedLabel(`Failed loading ${selectedState.stateName}`);
            }
        });

        input.addEventListener("input", () => {
            hideResults();
            if (!selectedStateJson) return;

            const q = normalize(input.value);
            if (!q || q.length < 2) return;

            const matches = [];
            for (const county of selectedStateJson.counties || []) {
                for (const city of county.cities || []) {
                    const name = normalize(city.cityName);
                    if (name.includes(q)) {
                        matches.push({ cityName: city.cityName, countyName: county.countyName });
                        if (matches.length >= 12) break;
                    }
                }
                if (matches.length >= 12) break;
            }

            if (!matches.length) return;

            const list = makeResults(matches);
            showResults(list);

            list.addEventListener("click", (ev) => {
                const row = ev.target.closest(".mdn-loc-row");
                if (!row) return;

                const cityName = row.getAttribute("data-city");
                const found = findCityInState(selectedStateJson, cityName);
                if (!found) return;

                input.value = found.city.cityName;
                hideResults();

                const bookUrl = computeBookUrl({ ...found, stateSlug: selectedState.stateSlug });
                saveSelection(found);

                setSelectedLabel(`Selected: ${found.city.cityName} • ${found.county.countyName} County`);
                setSticky(bookUrl, `Book in ${found.county.countyName}`);

                // Botón Book también redirige
                bookBtn.onclick = () => (window.location.href = bookUrl);
            });
        });

        // Book button default
        bookBtn.addEventListener("click", () => {
            const prev = loadSelection();
            if (prev?.bookUrl) window.location.href = prev.bookUrl;
            else alert("Select a state and city first.");
        });

        // Close results on outside click
        document.addEventListener("click", (e) => {
            if (!wrap.contains(e.target)) hideResults();
        });
    }

    // Public init
    window.MDNLocationsWidget = {
        mount: function (selector, opts) {
            const root = typeof selector === "string" ? document.querySelector(selector) : selector;
            if (!root) throw new Error("MDNLocationsWidget: root not found");
            return init(root, opts);
        },
    };
})();
