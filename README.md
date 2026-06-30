# aerosols-and-climate-questions.github.io
A prototype website for questions about topics discussed in the book "Aerosols and Climate". This is a collaborative project led by Ken Carslaw and Erin Raif and contributions are welcome.

__Contents__
1. [About the project](#about-the-project)
2. [I want to contribute a question](#how-to-contribute)
3. [I want to suggest a correction](#suggest-a-fix)
4. [Syntax for writing questions](#question-syntax)
5. [Layout of the YAML files (where questions are written)](#yaml-layout)
6. [Future plans](#future-plans)
7. [Other project documentation](#other-project-documentation)

## About the project
Inspired by the textbook _Aerosols and Climate_ (Ken Carslaw, 2022, Elsevier), we wanted to produce an open-source bank of questions which test understanding and tackle problems in aerosols and climate. Structurally, these questions follow the book, with topics arranged in the order of the chapters of the book, allowing this to form a companion to students and researchers following the text as part of their studies. However, some questions expand beyond upon the scope of the book text.
For each topic, we've categorised our questions into three types:
* __Review__ questions test core knowledge and are aimed at students who have read the corresponding book chapter. 
* __Application__ questions ask readers to apply concepts described in the book to everyday challenges in aerosol science. These are aimed at students developing understanding of the subject and are approximately at the level of a first-year PhD candidate.
* __Mastery__ questions require readers to think deeply about the science to either apply one or more concepts to a real challenge in research or require mathematical abstraction. They are deep and akin to the level of a question asked in a PhD viva. Some go beyond the scope of the content of _Aerosols and Climate_.

Eventually, we would like to links to Jupyter notebooks which contain interactive learning tools plotting real-world problems in aerosols and climate. But that's probably a project for next summer.

### A word on the site code
Neither Ken nor Erin are web devs, and so AI was used to create the structure of the website and the initial scripts that create the questions/handle the data. We're pretty sure nothing nasty is lurking beneath the surface, but the website and code is provided without warranty.

## How to contribute
As we develop the site, we will welcome contributions of questions. At the moment, we are building the site structure and initial question bank, so contribution is not open to the public and pull requests will be closed without acceptance. Please contact [Ken](https://environment.leeds.ac.uk/see/staff/1196/professor-ken-carslaw-frs) directly if you want to contribute at this stage.

If you've spoken to Ken and have been invited to contribute, then continue to read the following instructions. Apologies if you've very familiar with Git.
1. Create a new branch of the project. If you are not a member of the project, you will need to fork the repository first. You can see instructions on how to do this [here](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project).
2. Add your questions to the YAML file which corresponds to the topic you're writing about. Ideally, work on only one topic at a time to help us out. Remember to add the appropriate metadata to make sure you get credit and anyone who you cite gets credit! __Read about the question syntax [below](#question-syntax).__
3. Run `build_question_db.py` ([see details here](#converting-yaml-data-to-json)) to convert your YAML file to a JSON which can be read by the uestion script. You will need a python environment with the `pyyaml` package installed to do this.
4. Check that (a) your question renders/behaves correctly and (b) you haven't broken anything else by accessing the relevant website html pages on your local machine. We recommend using Firefox to test it. Note that using Firefox, local testing requires making sure your permissions allow you to run js in local files. To do this:
    1. In the search bar, type `about:config` and enter.
    2. Accept the risk of changing advanced settings, then search for `security.fileuri.strict_origin_policy`.
    3. Double click this to toggle to `false`.
    4. Close the browser and reopen.
    5. Don't forget to change it back once you're done testing for maximum security.
5. If you're happy, make a [pull request](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project). We'll review your question and add it to the site.

## Suggest a correction
Noticed an error in a question or a bug on the website? The best way to let us know is to raise a Github issue [here](https://github.com/aerosols-and-climate-questions/aerosols-and-climate-questions.github.io/issues). Please _label_ your issue with `q_and_a` if your issue is about the content of a question and `bug` if you've come across a web bug. 

## Question syntax
First you need to choose your question `type`. There are four types of questions you can choose from:
- [`basic`](#basic): Questions that don't take input. For example, Q: "What is the most abundant gas in the atmosphere?". A: Nitrogen.
- [`multiple-choice`](#multiple-choice): Questions where the user chooses the only correct answer from multiple options. For example, Q: "What is the most abundant gas in the atmosphere?". (a) Nitrogen, (b) Oxygen, (c) Carbon Dioxide.
- [`numeric`](#numeric): Questions which can be answered with a number. For example, Q: "To the nearest 1%, what mole fraction of dry air is nitrogen?". A: 78. Questions like these can optionally display the units and have a tolerance built in.
- [`select-multiple`](#select-multiple): Similar to multiple choice, except at least one answer is correct and all correct answers must be selected by the user. For example, Q: "Choose the two greenhouse gases in this list". (a) Nitrogen, (b) Oxygen, (c) Carbon Dioxide, (d) Methane.

Your question needs to be added to the YAML file. It's probably easiest to look at the template questions to get to grips with the syntax you need but a summary is below. Don't forget to add metadata! If you want to use LaTeX in questions or answers, you can render this by surrounding your LaTeX with `\\(...\\)` or `\\[...\\]`.

All questions require a unique ID. Our preference is to call these e.g. `c02-r01` for Chapter 2's first review question.

### `basic`
__Required__ fields are `prompt` and `answer`.
__Optional__ fields are `hint` and `image`. Metadata is optional but preferred. See details [below](#metadata).

- `answer` - a text field for the answer. Include any supplementary information in this field.
- `hint` - a text field for an optional hint which is hidden at first.
- `image` - data structure for the inclusion of images. See [below](#images)
- `prompt` - a text field for the question.

Example:
```
- id: question-01
  type: basic
  prompt: What colour is the sky?
  answer: Blue.
  hint: Look up! (Unless you're doing this at night, in which case go to bed.)
```

### `multiple-choice`
__Required__ fields are `prompt`, `options` and `correctIndex`.
__Optional__ fields are `answer`, `hint` and `image`. Metadata is optional but preferred. See details [below](#metadata).

- `answer` - a text field for the answer. Include any supplementary information in this field.
- `correctIndex` - the index of the correct answer. It is zero-based, so 0 corresponds to option (a), 1 to option (b), etc.
- `hint` - a text field for an optional hint which is hidden at first.
- `image` - data structure for the inclusion of images. See [below](#images)
- `options` - an array with at least two strings. Exactly one must be correct. Include as many as needed. For aesthetic reasons, it's generally better to keep possible answers short.
- `prompt` - a text field for the question.

Example:
```
- id: question-02
  type: multiple-choice
  prompt: What is the third letter of the Greek alphabet?
  options:
    - \(\alpha\)
    - \(\beta\)
    - \(\gamma\)
  correctIndex: 2
  answer: It's \(\gamma\), which is the third letter of the Greek alphabet.
```

### `numeric`
__Required__ fields are `prompt` and `answer`.
__Optional__  fields are `hint`, `image`, `tolerance`, `answerInfo` and `units`.
- `answer` - a field containing a number representing the correct answer.
- `answerInfo` - a text field for supplemntary information to the answer. This can be revealed by the user for more information about how the answer was calculated.
- `hint` - a text field for an optional hint which is hidden at first.
- `image` - data structure for the inclusion of images. See [below](#images)
- `prompt` - a text field for the question.
- `tolerance` - a field containing a number which denotes the size of the tolerance you will permit around the answer, e.g. `0.005`. For some reason, you don't need to surround this in quotes - we'll investigate. Defaults to `0` if omitted.
- `units` - a text field for a label rendered between the answer box and the submit button.

Example:
```
- id: question-03
  type: numeric
  prompt: What is the value of π (pi)?
  answer: 3.14
  answerInfo: Pi is the ratio of a circle's circumference to its diameter, so it is dimensionless.
  tolerance: 0.01
  hint: Optional hint for numeric questions.
```

### `select-multiple`
__Required__ fields are `prompt`, `options` and `correctIndex`.
__Optional__ fields are `answer`, `hint` and `image`. Metadata is optional but preferred. See details [below](#metadata).

- `answer` - a text field for the answer. Include any supplementary information in this field.
- `correctIndex` is a list of the indices of the correct answers. It is zero-based, so 0 corresponds to option (a), 1 to option (b), etc. Formatted as a short list, e.g. `[0, 1, 3]` would correspond to all of (a), (b) and (d) being correct.
- `hint` - a text field for an optional hint which is hidden at first.
- `image` - data structure for the inclusion of images. See [below](#images)
- `options` - an array with at least two strings. At least one must be correct. Include as many as needed. For aesthetic reasons, it's generally better to keep possible answers short.
- `prompt` - a text field for the question.

Example:
```
- id: question-07
  type: select-multiple
  prompt: Which of the following are greenhouse gases?
  options:
    - Carbon dioxide (\(\mathrm{CO}_2\))
    - Methane (\(\mathrm{CH}_4\))
    - Oxygen (\(\mathrm{O}_2\))
    - Water vapor (\(\mathrm{H}_2\mathrm{O}\))
  correctIndex: [0, 1, 3]
  answer: The greenhouse gases are carbon dioxide, methane, and water vapor. Oxygen is not a greenhouse gas.
```

### Multi-part questions
Questions can also be split into multiple parts using the `parts` keyword. See the template for an implementation.

Example:
```
- id: question-05
  parts:
    - label: (a)
      prompt: Write one short sentence explaining what makes a question multi-part.
      answer: A multi-part question has two or more subquestions that are answered separately.
    - label: (b)
      type: numeric
      prompt: Evaluate \(\ 2^3 + 1 \).
      answer: 9
      tolerance: 0
```

### Images
If a question uses an image, put the asset in `imgs/` and reference it from the question file. Please consider accessibility and add alt text. 
***VERY IMPORTANT***: DO NOT ADD IMAGES that you do not have permission to use. We will only accept images which you have authored and give permission to publish, or have Creative Commons licences. Please point to such details in your pull request or we will deny it.
**Slightly less important, but still important**: Please keep image size to a minimum. Use jpg where possible, lower resolution/image size as much as you can.
__Required__ fields: `src`
__Optional__ fields: `alt` and `caption`.
- `alt` - alt text for screen readers.
- `caption` - a caption displayed below the image.
- `src` - a relative path to the image which works from the chapter page shell. e.g. `../imgs/my_image.jpg`

Example:
```
- id: question-04
  type: multiple-choice
  prompt: Is this chart about radiative forcings or climate feedbacks?
  image:
    src: ../imgs/forcings.png
    alt: Sample forcing chart used to demonstrate image questions
    caption: Images stay inside the question box and keep their proportions.
  options:
    - Feedbacks
    - Forcings
  correctIndex: 1
  answer: It's forcings, shown on the x-axis
```

### Metadata
- `lastUpdated`: The date that the question was last updated on. Ideally, give this in YYYY-MM-DD form, but be careful, anything that could be interpreted as a number (such as this) needs wrapping in ""..
- `author`: The question author. If there is more than one author, format this as a YAML list.
- `reviewer`: The question reviewer. If there is more than one author, format this as a YAML list.
- `reference`: References used in the question. Please format these like so: `Author list (Surname, I. N. I. T.): Title, Journal, Issue(Vol), Pages, doi. Because these contain colons and a multitude of other exciting characters, you'll need to format this like so:
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
## YAML layout
The YAML files are designed to be human readable and is formed of indented blocks with variables. Here's an example of a part of a block below, but it's probably easiest to look at a template to work out what to do.
```
chapterTitle: Chapter 02
categories:
  - id: review
    name: Review
    questions:
      - id: question-r01
        type: basic
        prompt: What colour is the sky?
        answer: Blue.
        hint: Look up! (Unless you're doing this at night, in which case go to bed.)
```
`key:value` pairs in a dictionary are split by a colon. Each new item starts with a hyphen and space. If that item is a dictionary, new `key:value` pairs do not have a hyphen.
Make sure your question is in the right part of the nest. If it's a "review" question, it needs to be under "review".
YAML is quite smart and will work out whether you've written a string or a number. One thing you have to watch for though is that it won't automatically parse `:`. It's best to wrap any text with a colon in `""`, or put it on a new, indented line using `>-`, e.g.
```
reference: >-
  Reference, M. Y. etc...
```

## Future plans
Ironically, we'll flesh this out in a bit.

## Other project documentation

### Structure
- `/index.html`: homepage linking to chapter pages.
- `/credit.html`: credits page.
- `/chapters/chapter-01.html`: sample chapter page shell.
- `/chapters/chapter-template.html`: copy this to create additional chapter shells.
- `/data/chapters/*.json`: canonical chapter data loaded by the page script.
- `/data/source/*.yml`: authoring input files for the conversion script.
- `/scripts/questions.js`: reusable question rendering, data loading, and interactions.
- `/scripts/build_question_db.py`: YAML-to-JSON converter and validator.

### Converting YAML data to JSON
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

### Data model
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

### Question template details
All questions can be split into multiple parts which can also adhere to one of these styles. All the metadata fields can be added to each question type.

For multipart containers, parent `prompt` and `answer` are optional, and the same applies to any nested part that itself only groups further `parts`.

### Chapter loading
Chapter pages set `data-chapter` on the `<body>` element and load the matching JSON file from `data/chapters/`.
The renderer also still accepts `window.chapterConfig` for migration compatibility.