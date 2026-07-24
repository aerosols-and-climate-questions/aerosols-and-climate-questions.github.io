(function () {
  const contributorsBody = document.getElementById("credits-contributors");
  if (!contributorsBody) {
    return;
  }

  void renderCredits();

  async function renderCredits() {
    const chapters = await loadChapterLinks();
    if (!chapters.length) {
      renderError("No chapter links were found.");
      return;
    }

    const chapterData = await Promise.all(
      chapters.map(async (chapter) => {
        try {
          const response = await fetch(`data/chapters/${chapter.id}.json`);
          if (!response.ok) {
            return null;
          }
          return { chapter, config: await response.json() };
        } catch (_error) {
          return null;
        }
      })
    );

    const contributorMap = new Map();

    chapterData.forEach((entry) => {
      if (!entry || !entry.config || !Array.isArray(entry.config.categories)) {
        return;
      }

      entry.config.categories.forEach((category) => {
        if (!Array.isArray(category.questions)) {
          return;
        }

        category.questions.forEach((question, index) => {
          const questionLabel = `${category.name}-${String(index + 1).padStart(2, "0")}`;
          addContributions(contributorMap, question.author, "authored", entry.chapter, questionLabel);
          addContributions(contributorMap, question.reviewer, "reviewed", entry.chapter, questionLabel);
        });
      });
    });

    const contributors = Array.from(contributorMap.values()).sort((a, b) => {
      const totalDiff = b.authored.length + b.reviewed.length - (a.authored.length + a.reviewed.length);
      if (totalDiff !== 0) {
        return totalDiff;
      }
      return a.name.localeCompare(b.name);
    });

    if (!contributors.length) {
      renderError("No contributor metadata found in chapters.");
      return;
    }

    contributorsBody.innerHTML = "";
    contributors.forEach((contributor, index) => {
      const summaryRow = document.createElement("tr");

      const contributorCell = document.createElement("th");
      contributorCell.scope = "row";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "credits-toggle";
      button.textContent = contributor.name;
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", `contributor-details-${index}`);
      contributorCell.appendChild(button);

      const authoredCell = document.createElement("td");
      authoredCell.textContent = String(contributor.authored.length);

      const reviewedCell = document.createElement("td");
      reviewedCell.textContent = String(contributor.reviewed.length);

      summaryRow.appendChild(contributorCell);
      summaryRow.appendChild(authoredCell);
      summaryRow.appendChild(reviewedCell);
      contributorsBody.appendChild(summaryRow);

      const detailsRow = document.createElement("tr");
      detailsRow.id = `contributor-details-${index}`;
      detailsRow.className = "credits-details is-hidden";

      const detailsCell = document.createElement("td");
      detailsCell.colSpan = 3;
      detailsCell.innerHTML = renderContributorDetails(contributor);
      detailsRow.appendChild(detailsCell);
      contributorsBody.appendChild(detailsRow);

      button.addEventListener("click", () => {
        const isHidden = detailsRow.classList.toggle("is-hidden");
        button.setAttribute("aria-expanded", String(!isHidden));
      });
    });
  }

  async function loadChapterLinks() {
    try {
      const response = await fetch("index.html");
      if (!response.ok) {
        return [];
      }
      const indexHtml = await response.text();
      const parser = new DOMParser();
      const documentRoot = parser.parseFromString(indexHtml, "text/html");
      return Array.from(documentRoot.querySelectorAll('a[href^="chapters/chapter-"]'))
        .map((anchor) => {
          const href = anchor.getAttribute("href") || "";
          const match = href.match(/chapter-([a-z0-9-]+)\.html$/i);
          if (!match) {
            return null;
          }
          return {
            id: `chapter-${match[1]}`,
            title: anchor.textContent?.trim() || href,
          };
        })
        .filter((chapter, index, list) => chapter && list.findIndex((item) => item.id === chapter.id) === index);
    } catch (_error) {
      return [];
    }
  }

  function addContributions(contributorMap, people, type, chapter, questionLabel) {
    if (!Array.isArray(people)) {
      return;
    }

    people.forEach((person) => {
      if (typeof person !== "string" || !person.trim()) {
        return;
      }
      const name = person.trim();
      if (!contributorMap.has(name)) {
        contributorMap.set(name, { name, authored: [], reviewed: [] });
      }

      contributorMap.get(name)[type].push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questionLabel,
      });
    });
  }

  function renderContributorDetails(contributor) {
    const byChapter = new Map();
    contributor.authored.forEach((entry) => addByChapter(byChapter, entry, "authored"));
    contributor.reviewed.forEach((entry) => addByChapter(byChapter, entry, "reviewed"));

    const lines = Array.from(byChapter.values()).map((entry) => {
      const authored = entry.authored.length ? `Authored: ${entry.authored.join(", ")}` : "";
      const reviewed = entry.reviewed.length ? `Reviewed: ${entry.reviewed.join(", ")}` : "";
      const details = [authored, reviewed].filter(Boolean).join(". ");
      return `<li><strong>${escapeHtml(entry.chapterTitle)}</strong>. ${escapeHtml(details)}.</li>`;
    });

    return `<ul class="credits-contribution-list">${lines.join("")}</ul>`;
  }

  function addByChapter(byChapter, contribution, type) {
    if (!byChapter.has(contribution.chapterId)) {
      byChapter.set(contribution.chapterId, {
        chapterTitle: contribution.chapterTitle,
        authored: [],
        reviewed: [],
      });
    }
    byChapter.get(contribution.chapterId)[type].push(contribution.questionLabel);
  }

  function renderError(message) {
    contributorsBody.innerHTML = `<tr><td colspan="3">${escapeHtml(message)}</td></tr>`;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
})();
