# aerosols-and-climate-questions.github.io
A prototype website for questions associated with the topics discussed in the book "Aerosols and Climate".

## Structure
- `/index.html`: homepage linking to chapter pages.
- `/credit.html`: credits page.
- `/chapters/chapter-01.html`: sample chapter page shell.
- `/chapters/chapter-template.html`: copy this to create additional chapter shells.
- `/data/chapters/*.json`: canonical chapter data loaded by the page script.
- `/data/source/*.yml`: authoring input files for the conversion script.
- `/scripts/questions.js`: reusable question rendering, data loading, and interactions.
- `/scripts/build_question_db.py`: YAML-to-JSON converter and validator.

## Supported question templates
- `basic`: prompt with optional hint and revealable answer.
- `multiple-choice`: option buttons + submit check + revealable answer.
- `numeric`: numeric input + optional units label + submit check + revealable answer + optional answer info.

LaTeX in prompts/answers is rendered via MathJax using `\\(...\\)`/`\\[...\\]` syntax.

## Data model
Each chapter JSON file contains a `chapterTitle` and an ordered `categories` array.
Each category has an `id`, `name`, and ordered `questions` array.

Each question should include a stable `id`. `prompt` is required unless the question is only a multipart container (it has `parts` and no standalone interaction). Supported fields are:
- `type`: optional for `basic`, required for `multiple-choice` and `numeric`.
- `answer`: revealable answer text. If your answer is a number, surround this with ""
- `hint`: revealable hint text.
- `image`: object with `src`, optional `alt`, and optional `caption`.
- `parts`: nested list of subquestions, each following the same rules (`prompt` is optional for any item that itself has `parts`).
- `options` and `correctIndex`: required for `multiple-choice`.
- `tolerance`: optional for `numeric`.
- `answerInfo`: numeric-only; optional extra text appended after the numeric answer when it is revealed or when a correct answer is submitted.
- `units`: numeric-only; optional static label shown between the numeric answer box and the submit button.

### Metadata
- `lastUpdated`: The date that the question was last updated on. Ideally, give this in YYYY-MM-DD form, but be careful, anything that could be interpreted as a number (such as this) needs wrapping in ""..
- `author`: The question author. If there is more than one author, format this as a YAML list.
- `reviewer`: The question reviewer. If there is more than one author, format this as a YAML list.
- `reference`: References used in the question. Please format these like so: `Author list (Surname, I. N. I. T.): Title, Journal, Issue(Vol), Pages, doi. Because these contain colons, you'll need to format this like so:
```
reference: >-
  Reference, M. Y. etc...
```
If you need more than one reference, use:
```
reference:
  - >-
    Reference, M. Y. ...
  - >-
    Extra-Source, A. N. ...
```
## Creating new questions
1. Copy `data/source/chapter-template.yml` to a new file such as `data/source/chapter-02.yml`.
2. Fill in the chapter title, category metadata, and questions.
3. Run either (paths shown from root)
    * `py scripts/build_question_db.py --input data/source/chapter-NN.yml --output data/chapters` to build a JSON database from a single chapter's YAML
    * `py scripts/build_question_db.py --input data/source --output data/chapters` to build a JSON database for every chapter's YAML.
4. Notes on (3)
    1. You will need a python environment with pyyaml to run this.
    2. To convert more than one YAML file at once, but safely ignore some files, temporarily move YAML files that shouldn't be touched to a new folder called `source_temp` (this name is git-ignored), while you run the python script. Don't forget to move them back when you're done!
    3. This might fail if you have something not compatible with the JSON. That's good! Hopefully it will tell you where you're doing something wrong, e.g. colons.
    4. You may need to modify your JSON after production, particularly when backslashes are involved.
4. Open the matching chapter page shell and verify the rendered questions before you submit a pull request.

## Manual editing workflow
You can also edit the JSON files directly in `data/chapters/` if you prefer.
The minimal requirements are stable IDs, category grouping, and valid type-specific fields.

## Question template details
All questions can be split into multiple parts which can also adhere to one of these styles. All the metadata fields can be added to each question type.
### `basic`
- These are basic question and answers with no input from the user.
- Required: `prompt` unless this is used only as a multipart container.
- Optional: `hint`, `image`, `parts`.

### `multiple-choice`
- These are questions where only one answer is correct from as many potential answers as wanted.
- Required: `prompt`, `options`, `correctIndex`.
- Optional: `answer`, `hint`, `image`, `parts`.
- `options` must contain at least two strings.
- `correctIndex` is the index of the correct answer. It is zero-based, so 0 corresponds to option (a), 1 to option (b), etc.

### `numeric`
- These are questions with a numerical answer.
- Required: `prompt`, `answer`.
- Optional: `hint`, `image`, `parts`, `tolerance`, `answerInfo`, `units`.
- `answer` must parse as a number.
- `tolerance` defaults to `0` if omitted.
- `answerInfo` is shown after the numeric value in the reveal box and in the positive submit feedback.
- `units` is a noninteractive label rendered between the answer box and the submit button.

### `select-multiple`
- Required: `prompt`, `options`, `correctIndex`.
- Optional: `answer`, `hint`, `image`, `parts`.
- `options` must contain at least two strings.
- `correctIndex` is a list of the indices of the correct answers. It is zero-based, so 0 corresponds to option (a), 1 to option (b), etc.
- `correctIndex` should be formatted as a short list, e.g. `[0, 1, 3]` would correspond to all of (a), (b) and (d) being correct.

For multipart containers, parent `prompt` and `answer` are optional, and the same applies to any nested part that itself only groups further `parts`.

## Images
If a question uses an image, put the asset in `imgs/` and reference it from the question file.
The `src` value should be a relative path that works from the chapter page shell.

## Chapter loading
Chapter pages set `data-chapter` on the `<body>` element and load the matching JSON file from `data/chapters/`.
The renderer also still accepts `window.chapterConfig` for migration compatibility.

## Testing
Using Firefox, local testing requires making sure your permissions allow you to run js in local files. In the search bar, type `about:config` and enter. Accept the risk of changing advanced settings, then search for `security.fileuri.strict_origin_policy`. Double click this to toggle to `false`. Close the browser and reopen. Please add method for Chrome if you know how to.