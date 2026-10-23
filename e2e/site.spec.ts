import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, sitemapPaths, watchConsole } from "./helpers";

test.describe("every page", () => {
  test("loads without errors or sideways scrolling", async ({ page }) => {
    const console = watchConsole(page);
    const paths = [...new Set([...(await sitemapPaths(page)), "/projects/"])];
    expect(paths.length).toBeGreaterThan(15);
    for (const path of paths) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expectNoHorizontalOverflow(page);
    }
    console.expectNone();
  });

  test("returns a helpful 404 for unknown URLs", async ({ page }) => {
    const res = await page.goto("/services/not-a-real-service/");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We could not find that page.");
    await expect(page.getByRole("link", { name: "Go to the homepage" })).toBeVisible();
  });
});

test.describe("accessibility", () => {
  const pages = ["/", "/services/", "/services/legal-basement-permits/", "/permit-guides/permit-costs-and-timelines/", "/how-it-works/", "/about/", "/contact/", "/service-areas/", "/projects/", "/privacy-policy/"];
  for (const path of pages) {
    test(`has no serious axe violations on ${path}`, async ({ page }) => {
      // Check the settled page: entrance and scroll-reveal motion only fades content in on the way.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("contact form errors pass axe", async ({ page }) => {
    await page.goto("/contact/");
    await page.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.getByRole("heading", { name: /problems? with your inquiry/ })).toBeVisible();
    const results = await new AxeBuilder({ page }).include("form").analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });

  test("the skip link is the first focusable element and moves focus to main", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard test");
    await page.goto("/services/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
  });

  test("respects reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const animation = await page.locator(".hero-heading-line .split-line__inner").evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe("none");
    await page.goto("/services/");
    const inner = await page.locator(".motion-rise").first().evaluate((el) => getComputedStyle(el).animationName);
    expect(inner).toBe("none");
  });
});

test.describe("navigation", () => {
  test("the menu opens, traps focus, closes with Escape and navigates", async ({ page }) => {
    await page.goto("/");
    const wide = page.viewportSize()!.width >= 768;
    // Wide screens show the bar's links at the top of the page; the menu button comes in once the page scrolls past 80px.
    if (wide) {
      await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
      await page.evaluate(() => window.scrollTo(0, 800));
      await expect(page.locator(".site-nav")).toHaveAttribute("data-collapsed", "");
    }
    const button = page.getByRole("button", { name: "Open menu" });
    await button.click();
    await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    const menu = page.getByRole("navigation", { name: "Site menu" });
    await expect(menu.getByRole("link", { name: "Home" })).toBeFocused();
    // The links are words alone, with no numbers before them.
    await expect(menu).not.toContainText(/\d/);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    await expect(menu).toBeHidden();
    await button.click();
    await menu.getByRole("link", { name: "How it works" }).click();
    await expect(page).toHaveURL(/\/how-it-works\/$/);
    await expect(wide ? page.getByRole("navigation", { name: "Main" }) : page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });

  test("the desktop bar links to the main sections", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Desktop navigation");
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Guides" }).click();
    await expect(page).toHaveURL(/\/permit-guides\/$/);
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Guides" })).toHaveAttribute("aria-current", "page");
  });

  test("calls to action lead to real pages", async ({ page }) => {
    await page.goto("/services/deck-permits/");
    await page.getByRole("link", { name: "Discuss Your Project" }).last().click();
    await expect(page).toHaveURL(/\/contact\/\?service=deck-permits$/);
    await expect(page.getByLabel("Project type")).toHaveValue("Deck");
  });

  test("the homepage service index opens each service", async ({ page }) => {
    await page.goto("/");
    await page.locator("#services").getByRole("link", { name: /deck permit/i }).first().click();
    await expect(page).toHaveURL(/\/services\/deck-permits\/$/);
  });

  test("touch targets are at least 44px on small screens", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "Mobile only");
    await page.goto("/contact/");
    for (const target of [
      page.getByRole("button", { name: "Open menu" }),
      page.getByRole("button", { name: "Send inquiry" }),
      page.getByLabel("Your name"),
      page.getByLabel("Project type"),
      page.locator("label[for=preferredContact-phone]"),
    ]) {
      const box = await target.boundingBox();
      expect(box!.height, await target.evaluate((el) => el.outerHTML.slice(0, 80))).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("interactive pieces", () => {
  test("in-site links pass through the Ontario screen transition", async ({ page }) => {
    await page.goto("/services/");
    await page.getByRole("link", { name: /deck permit/i }).first().click();
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "cover");
    await expect(page).toHaveURL(/\/services\/deck-permits\/$/);
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "idle");
  });

  test("after a header click the next page starts at its content and the row still collapses", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Desktop navigation");
    await page.goto("/services/");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Process" }).click();
    await expect(page).toHaveURL(/\/how-it-works\/$/);
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "idle");
    await expect(page.locator("main")).toBeFocused();
    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect(page.locator(".site-nav")).toHaveAttribute("data-collapsed", "");
  });

  test("a link that only changes the query swaps the page without a cover", async ({ page }) => {
    await page.goto("/contact/?service=deck-permits");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.evaluate(() => {
      const veil = document.querySelector<HTMLElement>(".screen-veil")!;
      new MutationObserver(() => veil.dataset.phase !== "idle" && document.documentElement.setAttribute("data-test-covered", "")).observe(veil, { attributes: true });
    });
    const projectType = page.locator("select[name=projectType]");
    await expect(projectType).not.toHaveValue("");
    const preset = await projectType.inputValue();
    await page.locator("footer").getByRole("link", { name: "Contact", exact: true }).click();
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(page.locator("html")).not.toHaveAttribute("data-test-covered");
    // The form keeps the service it was opened with.
    await expect(projectType).toHaveValue(preset);
  });

  test("Back and Forward over a link that only changes the query return to each place the reader left", async ({ page }) => {
    const y = () => page.evaluate(() => Math.round(window.scrollY));
    await page.goto("/contact/?service=deck-permits");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect.poll(y).toBe(1500);
    // Clicked in place: a test click would first scroll the footer into view.
    await page.locator("footer").getByRole("link", { name: "Contact", exact: true }).evaluate((a: HTMLElement) => a.click());
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect.poll(y).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 700));
    await expect.poll(y).toBe(700);
    await page.goBack();
    await expect(page).toHaveURL(/\/contact\/\?service=deck-permits$/);
    await expect.poll(y).toBe(1500);
    await page.goForward();
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect.poll(y).toBe(700);
  });

  test("from the keyboard, a menu link to the page showing moves focus to the page's content", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard test");
    await page.goto("/services/");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(page.locator(".site-nav")).toHaveAttribute("data-collapsed", "");
    await page.locator(".site-nav__menu-btn").focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("navigation", { name: "Site menu" });
    await expect(menu.getByRole("link", { name: "Home" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(menu.getByRole("link", { name: "Services" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".site-nav__menu-btn")).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
    // Not the menu button, which wide screens put away at the top of the page (focus would fall to the body).
    await expect(page.locator("main")).toBeFocused();
  });

  test("a link button's fill leaves forwards from wherever it is, the outline label turning exactly where it is", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Pointer hover");
    await page.goto("/no-such-page/");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    const button = page.locator("main .link-button--outline").first();
    const box = (await button.boundingBox())!;
    await page.mouse.move(5, 5);
    await button.evaluate((el) => {
      const log: number[][] = [];
      (window as unknown as { band: number[][] }).band = log;
      const wipe = el.querySelector(".link-button__wipe")!;
      const over = el.querySelector(".link-button__over")!;
      const t0 = performance.now();
      const sample = () => {
        const style = getComputedStyle(el);
        log.push([parseFloat(style.getPropertyValue("--lb-a")), parseFloat(style.getPropertyValue("--lb-b")), getComputedStyle(wipe).clipPath === getComputedStyle(over).clipPath ? 1 : 0]);
        if (performance.now() - t0 < 1400) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    // A pointer that only passes over the button.
    await page.mouse.move(box.x + 30, box.y + box.height / 2);
    await page.waitForTimeout(150);
    await page.mouse.move(5, 5);
    await page.waitForTimeout(1500);
    const band = await page.evaluate(() => (window as unknown as { band: number[][] }).band);
    expect(band.every(([, , same]) => same === 1)).toBe(true);
    const peak = Math.max(...band.map(([, b]) => b));
    expect(peak).toBeGreaterThan(0);
    // Leaving: the far edge holds where it was while the near edge runs up to it (never a jump to the other end).
    const leaving = band.filter(([a]) => a > 0);
    expect(leaving.length).toBeGreaterThan(0);
    leaving.forEach(([a, b], i) => {
      expect(b).toBeCloseTo(peak, 2);
      expect(a).toBeLessThanOrEqual(b);
      if (i) expect(a).toBeGreaterThanOrEqual(leaving[i - 1][0]);
    });
    expect(band.at(-1)!.slice(0, 2)).toEqual([0, 0]);
  });

  test("link buttons print as an outlined ink label", async ({ page }) => {
    await page.goto("/no-such-page/");
    await page.emulateMedia({ media: "print" });
    for (const button of await page.locator("main .link-button").all()) {
      const print = await button.evaluate((el) => ({
        color: getComputedStyle(el).color,
        fill: getComputedStyle(el.querySelector(".link-button__label")!).getPropertyValue("-webkit-text-fill-color"),
        outline: getComputedStyle(el.querySelector(".link-button__plate")!).outlineStyle,
      }));
      expect(print.fill).toBe(print.color);
      expect(print.fill).not.toBe("rgba(0, 0, 0, 0)");
      expect(print.outline).toBe("solid");
    }
  });

  test("Back returns to the scroll position the reader left", async ({ page }) => {
    await page.goto("/services/");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(1500);
    // Clicked in place: a test click would first scroll the footer into view.
    await page.locator("footer").getByRole("link", { name: "About", exact: true }).evaluate((a: HTMLElement) => a.click());
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "idle");
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
    await page.goBack();
    await expect(page).toHaveURL(/\/services\/$/);
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "idle");
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(1500);
  });

  test("an On this page link glides to its section and moves focus there", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "The index shows on wide screens");
    await page.goto("/permit-guides/permit-costs-and-timelines/");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.getByRole("navigation", { name: "On this page" }).getByRole("link").nth(2).click();
    await expect(page).toHaveURL(/#what-helps-keep-an-application-moving$/);
    const section = page.locator("#what-helps-keep-an-application-moving");
    await expect(section).toBeFocused();
    // Level with the sticky index (8rem down), not under the header.
    await expect.poll(() => section.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(128);
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "idle");
  });

  test("a menu link to the page showing closes the menu and returns to the top", async ({ page }, info) => {
    test.skip(info.project.name === "desktop", "The menu button shows at the top on smaller screens");
    await page.goto("/services/");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.evaluate(() => window.scrollTo(0, 1500));
    const button = page.getByRole("button", { name: "Open menu" });
    await button.click();
    await page.getByRole("navigation", { name: "Site menu" }).getByRole("link", { name: "Services" }).click();
    await expect(page.locator(".site-nav__menu-btn")).toHaveAttribute("aria-expanded", "false");
    await expect(page).toHaveURL(/\/services\/$/);
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "idle");
  });

  test("on phones the collapsed header bar over Contact is ivory, not the night behind it", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "The phone header bar");
    await page.goto("/");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    await page.evaluate(() => {
      let top = 0;
      for (let n = document.querySelector<HTMLElement>("[data-contact]"); n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
      window.scrollTo(0, top + 300);
    });
    const nav = page.locator(".site-nav");
    await expect(nav).toHaveAttribute("data-collapsed", "");
    await expect(nav).toHaveAttribute("data-tone", "light");
    const ivory = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.background = "color-mix(in srgb, #f4f1eb 88%, transparent)";
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    await expect.poll(() => page.locator(".site-nav__bar").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ivory);
  });

  test("the transition and intro stay out of the way with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".screen-veil")).toBeHidden();
    await page.locator("#services").getByRole("link", { name: /deck permit/i }).first().click();
    await expect(page).toHaveURL(/\/services\/deck-permits\/$/);
    await expect(page.locator(".screen-veil")).toHaveAttribute("data-phase", "idle");
  });

  test("every picture says what it is: a rendering of a client project, or a rendered study", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[aria-labelledby=works-heading]")).toContainText("Renderings from client projects");
    await page.goto("/services/custom-home-permits/");
    await expect(page.locator("header figcaption")).toContainText("Rendering of a client project.");
    await expect(page.locator("#projects").getByRole("link", { name: "See client renderings" })).toHaveAttribute("href", "/projects/");
    await page.goto("/services/deck-permits/");
    await expect(page.locator("header figcaption")).toContainText("Rendered study for illustration, not a client project.");
    await page.goto("/projects/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Selected projects.");
    await expect(page.getByText("They show the designs, not finished buildings.")).toBeVisible();
    const projects = page.locator("article[id]");
    await expect(projects).toHaveCount(9);
    for (const project of await projects.all()) {
      await expect(project).toContainText("Client project");
      expect(await project.locator("figure").count()).toBeGreaterThanOrEqual(1);
      expect(await project.locator("figure").count()).toBeLessThanOrEqual(2);
    }
  });

  test("no picture carries a figure number", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "The text is the same at every width");
    for (const path of [...new Set([...(await sitemapPaths(page)), "/projects/"])]) {
      await page.goto(path);
      expect(await page.locator("body").textContent(), path).not.toMatch(/\bFig\.\s*\d/);
    }
  });

  test("the services caption follows the picture: what the service covers, and a client rendering for custom homes, a study elsewhere", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "The frame shows beside the list from md; one width is enough");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const caption = page.locator("[data-services-caption]");
    await expect(caption).toHaveText(/^rear, side and second-storey additions\s+rendered study for illustration, not a client project\.$/i, { useInnerText: true });
    await page.locator("#services").getByRole("link", { name: /custom home/i }).focus();
    await expect(caption).toHaveText(/^new and replacement homes on existing lots\s+rendering of a client project\.$/i, { useInnerText: true });
    await page.locator("#services").getByRole("link", { name: /deck permit/i }).focus();
    await expect(caption).toHaveText(/^new and replacement decks, raised or attached\s+rendered study for illustration, not a client project\.$/i, { useInnerText: true });
  });

  test("the services list is grouped for homes and for businesses, unnumbered, each service with a line on what it covers", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#services");
    await expect(section.getByRole("heading", { level: 3 })).toHaveText(["For homes", "For businesses"]);
    await expect(section.getByRole("list", { name: "For homes" }).getByRole("link")).toHaveCount(4);
    await expect(section.getByRole("list", { name: "For businesses" }).getByRole("link")).toHaveCount(3);
    // The name and what it covers make each link's name.
    await expect(section.getByRole("link", { name: "Deck permits New and replacement decks, raised or attached" })).toHaveAttribute("href", "/services/deck-permits/");
    await expect(section.locator("[data-services-body]")).not.toContainText(/\d/);
  });

  test("the story follows one house from idea to permit, and plays backwards on the way up", async ({ page }) => {
    await page.goto("/");
    const story = page.locator("[aria-labelledby=story-heading]");
    await expect(story.getByRole("heading", { level: 2 })).toHaveText("From idea to permit");
    await expect(story.getByRole("heading", { level: 3 })).toHaveText(["Every project starts with an idea.", "Designed around you.", "Engineered to be built.", "Ready for the building permit."]);
    await expect(story.locator("figcaption")).toHaveText("Rendering of a client project, with linework drawn over it for illustration.");
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    // e screens of scroll since the stage pinned.
    const at = async (e: number) => {
      const y = await page.evaluate((e) => {
        let top = 0;
        for (let n = document.querySelector<HTMLElement>("[data-story]"); n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
        const y = Math.round(top + e * window.innerHeight);
        window.scrollTo(0, y);
        return y;
      }, e);
      await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(y);
    };
    // The title block's drawing name, shown at every width: in place, or parked below its mask.
    const drawingName = () => story.locator(".story-block__drawing [data-story-field]").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
    // The issued sheet: the lines in ink, the title block filled in, the last chapter marked.
    await at(4.6);
    await expect(story.locator("[data-story-lines]")).toHaveAttribute("data-ink", "");
    await expect(story.locator("[data-story-toc='3']")).toHaveAttribute("data-active", "");
    await expect.poll(drawingName).toBe(0);
    // Back at the sketch: no ink, the first chapter marked, the title block empty again.
    await at(0.3);
    await expect(story.locator("[data-story-lines]")).not.toHaveAttribute("data-ink", "");
    await expect(story.locator("[data-story-toc='0']")).toHaveAttribute("data-active", "");
    await expect.poll(drawingName).toBeGreaterThan(0);
  });

  test("with reduced motion the story is a still sheet beside its four chapters", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const story = page.locator("[aria-labelledby=story-heading]");
    await story.scrollIntoViewIfNeeded();
    for (const title of await story.getByRole("heading", { level: 3 }).all()) await expect(title).toBeVisible();
    await expect(story.locator("[data-story-sheet]")).toBeVisible();
    await expect(story.locator("[data-story-toc='0']")).toBeHidden();
    expect(await story.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(3 * (page.viewportSize()?.height ?? 900));
  });

  test("contact closes on the firm's title block, drawn in as it comes up and whole at the end of the page", async ({ page }, info) => {
    await page.goto("/");
    const contact = page.locator("[aria-labelledby=contact-heading]");
    await expect(contact.getByRole("heading", { level: 2 })).toHaveText("Let’s talk about your project.");
    await expect(contact.getByRole("link", { name: "Start a project" })).toHaveAttribute("href", "/contact/");
    await expect(contact.locator("figcaption")).toHaveText("Rendering of a client project.");
    const block = contact.locator("[data-contact-block]");
    await expect(block.locator("dt")).toHaveText(["Office", "Hours", "Phone and email", "Google rating", "Credentials"]);
    // The firm's mark joins the block from 768px wide; on phones the footer's logo follows straight after.
    await expect(block.locator(".contact-block__mark")).toBeVisible({ visible: info.project.name !== "mobile" });
    await page.waitForFunction(() => "loaded" in document.documentElement.dataset);
    const clip = () => block.evaluate((el) => getComputedStyle(el).clipPath);
    // As the sheet rises, the block is not drawn yet.
    const y = await page.evaluate(() => {
      let top = 0;
      for (let n = document.querySelector<HTMLElement>("[data-contact]"); n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
      const y = Math.round(top - 0.8 * window.innerHeight);
      window.scrollTo(0, y);
      return y;
    });
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(y);
    await expect.poll(clip).not.toBe("none");
    // At the end of the page it is drawn, and every cell it shows is in place.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(clip).toBe("none");
    for (const cell of await block.locator("[data-contact-cell]").all()) {
      if (await cell.isVisible()) await expect.poll(() => cell.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    }
  });

  test("a project link on the homepage lands on that project's renderings", async ({ page }) => {
    await page.goto("/projects/#stone-house");
    const project = page.locator("#stone-house");
    await expect(project).toBeInViewport();
    await expect(project.getByRole("heading", { level: 3 })).toHaveText("Stone house with three gables");
    await page.goto("/");
    const href = await page.locator("[aria-labelledby=works-heading]").getByRole("link", { name: /view the project/i }).first().getAttribute("href");
    expect(href).toMatch(/^\/projects\/#[a-z-]+$/);
  });

  test("the map loads from Google only when asked", async ({ page }) => {
    await page.route(/^https:\/\/www\.google\.com\/maps/, (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Map</title>" }));
    await page.goto("/contact/");
    const map = page.locator('iframe[title^="Map:"]');
    await expect(map).toHaveCount(0);
    await page.getByRole("button", { name: "Show the map" }).click();
    await expect(map).toHaveCount(1);
    await expect(page.getByRole("link", { name: /Open in Google Maps/ })).toHaveAttribute("href", /google\.com\/maps\/search/);
  });
});
