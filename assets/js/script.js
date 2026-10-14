(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("js-ready");

  const ready = () => document.body.classList.add("is-ready");
  if (reduce) {
    ready();
  } else {
    window.setTimeout(ready, 850);
    window.addEventListener("load", () => window.setTimeout(ready, 420), { once: true });
  }

  const titles = document.querySelectorAll("[data-typing-title]");
  const typeTitle = (title) => {
    const full = title.querySelector(".typing-title-full");
    const typed = title.querySelector(".typing-title-typed");
    if (!full || !typed || title.dataset.typed === "true") return;
    title.dataset.typed = "true";
    const text = full.textContent;
    title.classList.add("is-typing");
    let index = 0;
    const tick = () => {
      typed.textContent = text.slice(0, index);
      index += 1;
      if (index <= text.length) window.setTimeout(tick, 58);
      else window.setTimeout(() => title.classList.remove("is-typing"), 420);
    };
    tick();
  };

  if (!reduce && "IntersectionObserver" in window) {
    const titleObserver = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          typeTitle(entry.target);
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: .7, rootMargin: "0px 0px -18%" });
    titles.forEach((title) => titleObserver.observe(title));
  }

  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  if (reduce || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-revealed"));
  } else {
    let nextReveal = 0;
    const revealNext = () => {
      const item = revealItems[nextReveal];
      if (!item || item.dataset.revealReady !== "true") return;
      item.classList.add("is-revealed");
      nextReveal += 1;
      window.setTimeout(revealNext, 170);
    };
    const revealObserver = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dataset.revealReady = "true";
          instance.unobserve(entry.target);
        }
      });
      revealNext();
    }, { threshold: .18, rootMargin: "0px 0px -8%" });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const renderInstagram = (posts) => {
    const feed = document.querySelector("[data-instagram-feed]");
    const validPosts = posts.filter((post) => post && post.url && post.image).slice(0, 5);
    if (!feed || !validPosts.length) return;

    const grid = document.createElement("div");
    grid.className = "instagram-grid";
    feed.replaceChildren(grid);
    validPosts.forEach((post, index) => {
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = post.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", "Post Instagram");
        if (index === 0) link.classList.add("instagram-grid__featured");
        const image = document.createElement("img");
        image.src = post.image;
        image.alt = post.alt || "Contenuto Instagram di Alessio Buso";
        image.loading = index === 0 ? "eager" : "lazy";
        image.width = 640;
        image.height = 640;
        link.append(image);
        grid.append(link);
      }, index * 180);
    });
  };

  const instagramFeed = document.querySelector("[data-instagram-feed]");
  const loadInstagram = () => {
    if (!instagramFeed || instagramFeed.dataset.loaded === "true") return;
    instagramFeed.dataset.loaded = "true";
    fetch("assets/data/instagram.json", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Instagram data unavailable")))
      .then((data) => renderInstagram(Array.isArray(data.posts) ? data.posts : []))
      .catch(() => {});
  };
  if (instagramFeed && "IntersectionObserver" in window) {
    const instagramObserver = new IntersectionObserver((entries, instance) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadInstagram();
        instance.disconnect();
      }
    }, { rootMargin: "0px 0px 220px" });
    instagramObserver.observe(instagramFeed);
  } else {
    loadInstagram();
  }

  const card = document.querySelector("[data-tilt-card]");
  const surface = card?.querySelector(".hero__card");
  if (!reduce && card && surface) {
    let raf = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    const render = () => {
      currentX += (targetX - currentX) * .1;
      currentY += (targetY - currentY) * .1;
      surface.style.transform = `rotateX(${currentY}deg) rotateY(${currentX}deg)`;
      if (Math.abs(targetX - currentX) > .01 || Math.abs(targetY - currentY) > .01) raf = requestAnimationFrame(render);
      else raf = 0;
    };
    const renderTilt = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const move = (event) => {
      if (event.pointerType === "touch") return;
      const bounds = card.getBoundingClientRect();
      targetX = ((event.clientX - bounds.left) / bounds.width - .5) * 8;
      targetY = ((event.clientY - bounds.top) / bounds.height - .5) * -8;
      renderTilt();
    };
    const orientation = (event) => {
      if (typeof event.gamma !== "number" || typeof event.beta !== "number") return;
      targetX = Math.max(-5, Math.min(5, event.gamma / 12));
      targetY = Math.max(-5, Math.min(5, -(event.beta - 45) / 12));
      renderTilt();
    };
    const reset = () => {
      targetX = 0;
      targetY = 0;
      if (!raf) raf = requestAnimationFrame(render);
    };
    card.addEventListener("pointermove", move, { passive: true });
    card.addEventListener("pointerleave", reset, { passive: true });
    if ("DeviceOrientationEvent" in window) {
      const enableOrientation = () => window.addEventListener("deviceorientation", orientation, { passive: true });
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        card.addEventListener("click", async () => {
          try {
            if (await DeviceOrientationEvent.requestPermission() === "granted") enableOrientation();
          } catch {}
        }, { once: true });
      } else {
        enableOrientation();
      }
    }
  }
})();
