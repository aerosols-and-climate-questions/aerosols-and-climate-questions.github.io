/*
  scripts/questions.js

  Enhances chapter pages by loading question data (JSON) and rendering
  interactive question cards into the DOM. Supports multiple question
  types (multiple-choice and numeric), nested question parts, optional
  media, hints and revealable answers, and MathJax typesetting.

  This file intentionally uses a self-invoking function to avoid
  leaking variables into the global scope. Public configuration can be
  supplied via `window.chapterConfig` or the page's `data-chapter` /
  `?chapter=` query parameter which selects a JSON file under
  `data/chapters`.
*/

(function () {
  const titleNode = document.getElementById("chapter-title");
  const root = document.getElementById("question-root");
  const inlineChapterConfig = window.chapterConfig;

  // If the current page doesn't include the expected DOM anchors,
  // abort quietly (script is safe to include on other pages).
  if (!titleNode || !root) {
    return;
  }

  // Start the async bootstrap flow; `void` silences promise warnings.
  void bootstrap();

  /**
   * Bootstrap the page by obtaining the chapter config (either from a
   * global `window.chapterConfig` or by fetching the JSON file),
   * validating it, and rendering the chapter.
   */
  async function bootstrap() {
    const chapterConfig = inlineChapterConfig || (await loadChapterConfig());

    if (!chapterConfig) {
      renderLoadError("No chapter data was found for this page.");
      return;
    }

    // Basic validation: we require a title and an array of categories.
    if (!chapterConfig.chapterTitle || !Array.isArray(chapterConfig.categories)) {
      renderLoadError("Chapter data is missing a title or categories array.");
      return;
    }

    renderChapter(chapterConfig);
  }

  /**
   * Determine the chapter id and fetch the corresponding JSON file.
   * - Chapter id can come from `data-chapter` on <body> or `?chapter=`.
   * - Chooses the relative `data/chapters` path depending on the URL.
   * Returns the parsed JSON or null on any failure.
   */
  async function loadChapterConfig() {
    const chapterId =
      document.body?.dataset.chapter ||
      new URLSearchParams(window.location.search).get("chapter");

    if (!chapterId) {
      return null;
    }

    // When the page is under `/chapters/` the JSON sits one level up.
    const dataBasePath = window.location.pathname.includes("/chapters/")
      ? "../data/chapters"
      : "data/chapters";
    const configUrl = new URL(`${dataBasePath}/${chapterId}.json`, window.location.href);

    try {
      const response = await fetch(configUrl);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (_error) {
      // Network or parse error -> treat as missing config.
      return null;
    }
  }

  /**
   * Render the chapter: set the page title and create a section for each
   * category. Each question is rendered into an article with class
   * `question-card`.
   */
  function renderChapter(chapterConfig) {
    titleNode.textContent = chapterConfig.chapterTitle + " Questions";

    chapterConfig.categories.forEach((category) => {
      const section = document.createElement("section");
      section.className = "category-section";

      const heading = document.createElement("h2");
      heading.textContent = category.name;
      section.appendChild(heading);

      category.questions.forEach((question, index) => {
        const card = document.createElement("article");
        card.className = "question-card";

        // Label questions Q1, Q2, ... and pass into the renderer.
        renderQuestionContent(card, question, `Q${index + 1}`);

        section.appendChild(card);
      });

      root.appendChild(section);
    });

    // Typeset any math if MathJax is present.
    renderMath();
  }

  /**
   * Render a friendly load error into the root container.
   * This replaces any previously rendered content.
   */
  function renderLoadError(message) {
    titleNode.textContent = "Questions unavailable";
    root.innerHTML = "";

    const errorBox = document.createElement("section");
    errorBox.className = "category-section";

    const heading = document.createElement("h2");
    heading.textContent = "Load error";

    const body = document.createElement("p");
    body.textContent = message;

    errorBox.appendChild(heading);
    errorBox.appendChild(body);
    root.appendChild(errorBox);
  }

  /**
   * Create a hidden toggleable `<div>` with provided HTML content. The
   * `is-hidden` class is used to control visibility via CSS.
   */
  function createToggleBox(className, content) {
    const box = document.createElement("div");
    box.className = `${className} is-hidden`;
    box.innerHTML = content;
    return box;
  }

  /**
   * Render the content of a single question into the supplied DOM
   * `container`. The `label` is the human-facing question label (e.g.
   * "Q1" or "Q2(a)"). This function handles the prompt, optional
   * media, parts vs standalone interactions, and optional hint/answer
   * toggle UI.
   */
  function renderQuestionContent(container, question, label) {
    const prompt = document.createElement("p");
    prompt.className = "question-prompt";
    // `prompt` may contain HTML (e.g. <em>, <strong>, or math markup).
    prompt.innerHTML = `<strong>${label}.</strong> ${question.prompt}`;
    container.appendChild(prompt);

    if (question.image) {
      container.appendChild(createQuestionMedia(question.image));
    }

    // If the question has explicit parts (a, b, c...) render them as
    // an ordered list, otherwise render a single interaction block.
    if (Array.isArray(question.parts) && question.parts.length > 0) {
      container.appendChild(createQuestionParts(question.parts, label));
    } else {
      const interaction = createQuestionInteraction(question);
      if (interaction) {
        container.appendChild(interaction);
      }
    }

    // Add a toggleable hint panel when present.
    if (question.hint) {
      const hintButton = document.createElement("button");
      hintButton.className = "question-button";
      hintButton.type = "button";
      hintButton.textContent = "Show hint";

      const hintBox = createToggleBox("hint-box", question.hint);
      hintButton.addEventListener("click", () => {
        toggleBox(hintBox, hintButton, "Show hint", "Hide hint");
      });

      container.appendChild(hintButton);
      container.appendChild(hintBox);
    }

    // Add a toggleable answer panel when an answer is available.
    if (question.answer) {
      const answerButton = document.createElement("button");
      answerButton.className = "question-button";
      answerButton.type = "button";
      answerButton.textContent = "Show full answer";

      const answerBox = createToggleBox("answer-box", renderAnswerContent(question));
      answerButton.addEventListener("click", () => {
        toggleBox(answerBox, answerButton, "Show full answer", "Hide full answer");
      });

      container.appendChild(answerButton);
      container.appendChild(answerBox);
    }
  }

  /**
   * Render an array of `parts` as an ordered list. Each part is a
   * standalone mini-question and receives a sublabel like `(a)`,
   * `(b)` unless `part.label` is provided.
   */
  function createQuestionParts(parts, parentLabel) {
    const list = document.createElement("ol");
    list.className = "question-parts";

    parts.forEach((part, index) => {
      const item = document.createElement("li");
      item.className = "question-part";
      const partLabel = part.label || `(${String.fromCharCode(97 + index)})`;
      renderQuestionContent(item, part, `${parentLabel}${partLabel}`);
      list.appendChild(item);
    });

    return list;
  }

  /**
   * Create a `<figure>` element containing an `<img>` and optional
   * `<figcaption>` for question media. `media` is expected to contain
   * `src`, and optionally `alt` and `caption`.
   */
  function createQuestionMedia(media) {
    const figure = document.createElement("figure");
    figure.className = "question-media";

    const image = document.createElement("img");
    image.className = "question-image";
    image.src = media.src;
    image.alt = media.alt || "";

    figure.appendChild(image);

    if (media.caption) {
      const caption = document.createElement("figcaption");
      caption.textContent = media.caption;
      figure.appendChild(caption);
    }

    return figure;
  }

  /**
   * Factory for question-specific interaction blocks. Returns a DOM
   * element (or null if the type is unsupported).
   */
  function createQuestionInteraction(question) {
    if (question.type === "multiple-choice") {
      return createMultipleChoice(question);
    }

    if (question.type === "numeric") {
      return createNumeric(question);
    }

    return null;
  }

  /**
   * Toggle visibility for a box created by `createToggleBox` and swap
   * the button text. Also triggers math retypesetting since new
   * content may include math markup.
   */
  function toggleBox(box, button, closedText, openText) {
    const isHidden = box.classList.toggle("is-hidden");
    button.textContent = isHidden ? closedText : openText;
    renderMath();
  }

  /**
   * Build a multiple-choice UI block. `question.options` is expected to
   * be an array of HTML strings for each option and
   * `question.correctIndex` indicates the correct option index.
   * The UI supports selecting an option and submitting to receive
   * feedback. Selection visually highlights the chosen button.
   */
  function createMultipleChoice(question) {
    const wrapper = document.createElement("div");
    wrapper.className = "mcq";

    const optionList = document.createElement("div");
    optionList.className = "mcq-options";

    let selectedIndex = -1;

    question.options.forEach((option, idx) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-button";
      // Option may contain simple HTML (e.g. markup or math).
      button.innerHTML = option;
      button.addEventListener("click", () => {
        selectedIndex = idx;
        // Remove selected class from all siblings then add it to the
        // clicked button.
        optionList.querySelectorAll("button").forEach((node) => {
          node.classList.remove("selected");
        });
        button.classList.add("selected");
      });
      optionList.appendChild(button);
    });

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.className = "question-button";
    submitButton.textContent = "Submit choice";

    const result = document.createElement("p");
    result.className = "mcq-result";

    submitButton.addEventListener("click", () => {
      if (selectedIndex === -1) {
        result.textContent = "Choose an option first.";
      } else if (selectedIndex === question.correctIndex) {
        result.textContent = "Correct.";
      } else {
        result.textContent = "Incorrect. Try again or reveal the answer.";
      }
    });

    wrapper.appendChild(optionList);
    wrapper.appendChild(submitButton);
    wrapper.appendChild(result);
    return wrapper;
  }

  /**
   * Create a numeric input interaction. `question.answer` should be a
   * numeric string/number and `question.tolerance` (optional) is used
   * to accept values within ±tolerance. If `question.units` is
   * provided a units label is displayed beside the input.
   */
  function createNumeric(question) {
    const wrapper = document.createElement("div");
    wrapper.className = "numeric-question";

    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.className = "numeric-input";
    input.setAttribute("aria-label", "Numeric answer");

    wrapper.appendChild(input);

    if (question.units) {
      const units = document.createElement("span");
      units.className = "numeric-units";
      units.textContent = question.units;
      wrapper.appendChild(units);
    }

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.className = "question-button";
    submitButton.textContent = "Submit number";

    const result = document.createElement("p");
    result.className = "numeric-result";

    submitButton.addEventListener("click", () => {
      const rawAnswer = Number.parseFloat(question.answer);
      const tolerance = Number.isFinite(question.tolerance) ? question.tolerance : 0;
      const typed = Number.parseFloat(input.value);

      if (!Number.isFinite(typed)) {
        result.textContent = "Enter a number first.";
        return;
      }

      // Compare against the canonical answer using the supplied
      // tolerance. If none is supplied, exact numeric equality is
      // required (which is typical for simple integer answers).
      if (Math.abs(typed - rawAnswer) <= tolerance) {
        result.innerHTML = "Correct.";
        renderMath();
      } else {
        result.textContent = "Incorrect. Try again or reveal the answer.";
      }
    });

    wrapper.appendChild(submitButton);
    wrapper.appendChild(result);
    return wrapper;
  }

  /**
   * Returns HTML content for the answer panel. For numeric questions we
   * render the canonical numeric feedback; for other types we simply
   * return the stored answer (which may contain HTML).
   */
  function renderAnswerContent(question) {
    if (question.type === "numeric") {
      return renderNumericFeedback(question);
    }

    return question.answer;
  }

  /**
   * Produce HTML showing the numeric answer value and optional
   * `answerInfo` string. The optional `prefix` is used for short
   * feedback such as "Correct.".
   * Currently, the prefix option is not used by numeric, it was
   * a historic feature.
   */
  function renderNumericFeedback(question, prefix = "") {
    const info = question.answerInfo
      ? `<span class="numeric-answer-info">${question.answerInfo}</span>`
      : "";
    return `${prefix ? `${prefix} ` : ""}${info}`;
  }

  /**
   * Helper to typeset math using MathJax if it is loaded. Uses the
   * promise-based `typesetPromise` API when available and silently
   * ignores errors (we don't want typesetting failures to break the
   * page).
   */
  function renderMath() {
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      window.MathJax.typesetPromise().catch(function () {});
    }
  }
})();
