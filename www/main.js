/**
 * The function generates HTML code for a form that includes attributes and skills with checkboxes and
 * input fields, as well as an advantage/disadvantage input and submit buttons.
 * @param {characterObject} attributes - An object containing two properties: "attributes" and "skills".
 * @returns an HTML string that includes checkboxes and input fields for attributes and skills, as well
 * as a label and input field for advantage/disadvantage and submit/odds buttons.
 */
function generateSkillsHTML(attributes) {
  let html = "";

  if (attributes.attributes && attributes.attributes.length > 0) {
    // Add attributes section heading and checkbox
    html += `<h2>Attributes</h2>`;

    // Add attributes with checkbox to each attribute
    for (const attribute of attributes.attributes) {
      html += `<div class="attribute">
                  <label>
                    <input type="checkbox" name="${attribute.name}1" id="${attribute.name}" value="${attribute.value}">
                    <input type="checkbox" name="${attribute.name}2" id="${attribute.name}" value="${attribute.value}">
                    ${attribute.name}:
                  </label>
                  <input type="number" name="${attribute.name}_value" id="${attribute.name}_value" value="${attribute.value}">
                  <span class="description">${attribute.description}</span>
               </div>`;
    }
  }

  if (attributes.skills && attributes.skills.length > 0) {
    // Add skills section heading and checkbox
    html += `<h2>Skills</h2>`;

    // Group skills by category
    const groupedSkills = {};
    for (const skill of attributes.skills) {
      if (!groupedSkills[skill.category]) {
        groupedSkills[skill.category] = [];
      }
      groupedSkills[skill.category].push(skill);
    }
    // console.log(groupedSkills)

    // Add skills with checkbox to each skill
    for (const category in groupedSkills) {
      html += `<h3>${category}</h3>`;
      for (const skill of groupedSkills[category]) {
        html += `<div class="skill">
                    <label>
                      <input type="checkbox" name="${skill.name}1" id="${skill.name}" value="${skill.value}">
                      <input type="checkbox" name="${skill.name}2" id="${skill.name}" value="${skill.value}">
                      ${skill.name}
                    </label>
                    <input type="number" name="${skill.name}_value" id="${skill.name}_value" value="${skill.value}">
                    <span class="description">${skill.description}</span>
                 </div>`;
      }
    }
  }

  html +=
    '<label for="advantage">Enter the advantage/disadvantage to the roll: </label>';
  html +=
    '<input type="number" id="advantage" name="advantage" min="-5" max="5" step="1" value="0"></input>';

  // Add submit button
  html += '<input type="submit" id="submit-button" value="Submit">';

  // Add odds button
  html += '<input type="submit" id="odds-button" value="Show me the Odds">';

  return html;
}

/**
 * This function handles a file input by reading a CSV file and loading its contents.
 */
function handleFile() {
  const input = document.getElementById("file-input");
  const file = input.files[0];
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function () {
    const csv = reader.result;
    loadCSV(csv);
  };
}

/**
 * The function checks if a given cell contains only numbers.
 * @param {str} cell The "cell" parameter is a variable that represents a single cell in a spreadsheet or
 * table. The function "cellIsOnlyNumber" takes this cell as input and checks if it contains only
 * numbers (digits).
 * @returns {bool} The function `cellIsOnlyNumber` is returning a boolean value (`true` or `false`) depending
 * on whether the input `cell` contains only digits (0-9) or not.
 */
function cellIsOnlyNumber(cell) {
  /**
   * The regex is ^d+$ which checks for 1 or more digits. If the regex succeeds on cell,
   * cell only contains digits
   */
  return /^\d+$/.test(cell);
}

/**
 * The function parses a CSV file and extracts attributes and skills data.
 * @param {str} csv - The CSV string that needs to be parsed into an object.
 * @returns {characterObject} An object with two properties: "attributes" and "skills".
 */
function parseCSV(csv) {
  /**
    * bulk of processing, convert the comma delimited csv into "lines"
    * each line is a row so we can index by row-column format e.g. line[row][column]
    */
  const lines = csv.split("\n").map((line) => {
    const cells = [];
    let currentCell = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line.charAt(i);

      if (char === "," && !insideQuotes) {
        cells.push(currentCell);
        currentCell = "";
      } else if (
        char === '"' &&
        i < line.length - 1 &&
        line.charAt(i + 1) === '"'
      ) {
        // Handle escaped quotes
        currentCell += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else {
        currentCell += char;
      }
    }

    cells.push(currentCell.trimEnd());

    return cells;
  });
  const attributes = [];
  const skills = [];
  // const vehicleStats = [][];

  // Find abilities column
  // we know it is in the first row
  const attributeColumnOffset = lines[0].findIndex((cell) =>
    cell.includes("Attributes")
  );
  if (attributeColumnOffset === -1) {
    throw new Error("Unable to find attributes section");
  }

  // Find start of skills section
  const skillStartIndex = lines.findIndex((row) => row[0].includes("Skills"));
  if (skillStartIndex === -1) {
    throw new Error("Unable to find start of skills section");
  }

  // Get skill categories
  const skillCategories = lines[skillStartIndex + 1];

  // Find start of vehicle section
  const vehicleRowHeader = lines.findIndex((row) =>
    row[0].includes("Consumable Stats")
  );
  if (skillStartIndex === -1) {
    throw new Error("Unable to find start of vehicle section");
  }
  // using the first vehicle attribute, find which cell (column) only contains digits
  // we +1 the row to get into vehicle attributes
  const vehicleColumnsStart = lines[vehicleRowHeader + 1].findIndex((cell) =>
    cellIsOnlyNumber(cell)
  );

  // Get vehicles by slicing the array
  const vehicleList = lines[vehicleRowHeader].slice(vehicleColumnsStart);

  // Get vehicle stats start
  // We have the consumable stats above (idk if we even want to show at this stage since we are
  // mostly concerned about rolls only) so now we need the roll-able stats
  // +1 to start at the first stat rather than the header
  const vehicleStatRow =
    lines.findIndex((row) => row[0] === "Base Stats") + 1;

  // Parse attributes section
  for (let i = 3; i < skillStartIndex - 1; i += 2) {
    const attribute = {
      name: lines[i][attributeColumnOffset],
      description: lines[i + 1][attributeColumnOffset],
      value: lines[i + 1][attributeColumnOffset + 1],
    };
    if (attribute.name !== "") attributes.push(attribute);
  }

  // Parse skills section
  for (let column = 0; column < skillCategories.length; column++) {
    let row = skillStartIndex + 3;
    const category = skillCategories[column];
    if (category !== "") {
      while (lines[row][column] !== "") {
        const skill = {
          name: lines[row][column],
          category,
          description: lines[row + 1][column + 1],
          value: lines[row + 1][column],
        };
        skills.push(skill);
        row++;
        row++;
      }
    }
  }

  // Parse vehicle section
  const vehicles = [];
  for (let vehicleColumn = vehicleColumnsStart; vehicleColumn < vehicleList.length; vehicleColumn++) {
    // Parsing vehicle by vehicle...
    // start with the first stat
    let statRow = vehicleStatRow;
    const currentVehicle = lines[vehicleRowHeader][vehicleColumn]
    const vehicle = new Object();
    vehicle.attributes = [];
    // we parse only the base stats
    while (cellIsOnlyNumber(lines[statRow][vehicleColumn])) {
      // add vehicle attribute to object
      vehicle.attributes.push({
        name: lines[statRow][0],
        value: lines[statRow][vehicleColumn],
        // description is under the attribute name, so + 1 to row
        description: lines[statRow + 1][0],
      });
      statRow++;
      statRow++;
    }
    // possibly a special descriptor cell that is in the position of a attribute value
    if (lines[statRow][vehicleColumn] !== "") {
      vehicle.specialDescription = lines[statRow][vehicleColumn];
    }
    vehicle.name = currentVehicle;
    vehicles.push(vehicle);
  }

  return { attributes, skills, vehicles };
}

/**
 * The function reads a CSV file using XMLHttpRequest and passes the data to a callback function.
 * @param file - The file parameter is a string that represents the path to the CSV file that needs to
 * be read.
 * @param callback - The callback parameter is a function that will be called once the CSV file has
 * been successfully retrieved by the XMLHttpRequest. The function will be passed the CSV data as an
 * argument.
 */
function readCSV(file, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", file);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
      const csv = xhr.responseText;
      callback(csv);
    }
  };
  xhr.send();
}

/**
 * The function calculates the sum of n random rolls of a six-sided die using the
 * window.crypto.getRandomValues method.
 * @param n - The parameter "n" represents the number of times a dice is rolled. The function
 * "calculateRoll" uses a loop to roll a dice "n" times and calculates the sum of the values obtained
 * in each roll. The function uses the window.crypto.getRandomValues method to generate a random number
 * between
 * @returns The function `calculateRoll` returns the sum of `n` random dice rolls, where each roll is a
 * random integer between 1 and 6 (inclusive).
 */
function calculateRoll(n) {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (window.crypto.getRandomValues(new Uint8Array(1))[0] % 6) + 1;
  }
  return sum;
}

/**
 * This function calculates the distribution of possible outcomes when rolling a given number of dice
 * with six sides each.
 * @param numDice - The number of dice being rolled.
 * @returns The function `diceRollDistribution` returns an array representing the distribution of
 * possible sums when rolling a given number of dice with six sides. The array has a length of `numDice
 * * 6` and each element represents the number of times a particular sum was rolled.
 */
function diceRollDistribution(numDice) {
  const numSides = 6;
  const distribution = new Array(numDice * 6).fill(0);

  // Define a helper function to recursively calculate the distribution
  function calculateDistribution(rolls, remainingDice) {
    if (remainingDice === 0) {
      // Base case: we have rolled all the dice, so calculate the sum of the rolls
      const sum = rolls.reduce((acc, cur) => acc + cur, 0);
      if (distribution[sum] === undefined) {
        distribution[sum] = 0;
      }
      distribution[sum]++;
    } else {
      // Recursive case: roll one die and recurse with one less die
      for (let i = 1; i <= numSides; i++) {
        calculateDistribution([...rolls, i], remainingDice - 1);
      }
    }
  }

  // Call the helper function to calculate the distribution
  calculateDistribution([], numDice);

  return distribution;
}

/**
 * The function calculates the probability of rolling a target or lower value on a specified number of
 * dice rolls with a given distribution.
 * @param target - The target is the number that we want to roll lower than or equal to in order to
 * count as a success.
 * @param numRolls - The number of times a six-sided die is rolled.
 * @param distribution - The distribution parameter is an array that represents the number of possible
 * outcomes for each possible roll result. For example, if we are rolling a single six-sided die, the
 * distribution array would be [1, 1, 1, 1, 1, 1] because there is one possible
 * @returns the probability (as a percentage) of rolling a value lower than or equal to the target
 * value, given a certain number of rolls and a distribution of outcomes.
 */
function probRollLower(target, numRolls, distribution) {
  let numBelow = 0;
  const totalOutcomes = Math.pow(6, numRolls);

  for (let i = 0; i <= target; i++) {
    numBelow += distribution[i];
  }

  return Math.floor((numBelow / totalOutcomes) * 100);
}

/**
 * The function calculates the probability of success for a given set of dice rolls and displays it on
 * the UI.
 */
function showOddsHandler() {
  // Get selected attributes and skills
  const { numRolls, totalSelectedAdvantage } = extractSelected();

  const distribution = diceRollDistribution(numRolls);
  const rollProbability = probRollLower(
    totalSelectedAdvantage,
    numRolls,
    distribution
  );

  // early return
  if (numRolls === 0) {
    return;
  }

  // do a little spinny for the UI
  startSpinner();

  setTimeout(() => {
    // output probability of success

    const probabilityElement = document.getElementById("probability");
    probabilityElement.textContent = `distribution of rolls is ${distribution.toString()} and the probability success is ${rollProbability}%`;

    stopSpinner();
    // show and scroll to section
    showAndScrollToID("probability");
  }, 500);
}

function rollAgainstSelectedHandler() {
  // Get selected attributes and skills
  const { numRolls, totalSelectedAdvantage } = extractSelected();

  // early return
  if (numRolls === 0) {
    return;
  }

  const totalRoll = calculateRoll(numRolls);
  let snakeEyesComment = "";

  if (totalRoll === numRolls) {
    snakeEyesComment = `SNAKE EYES! Mark your attribute for level up  `;
  }
  if (totalRoll === numRolls * 6) {
    snakeEyesComment = `Crit Fail! Add a Tomino Token because you're gonna have a bad time...`;
  }

  // do a little spinny for the UI
  startSpinner();

  setTimeout(() => {
    // Compare selected total to user input total
    const resultElement = document.getElementById("result");
    if (totalSelectedAdvantage > totalRoll) {
      resultElement.style.color = "green";
      resultElement.textContent =
        snakeEyesComment +
        `${totalSelectedAdvantage - totalRoll} Successes! 
        Rolled: ${totalRoll} 
        against your stats: ${totalSelectedAdvantage}`;
    } else if (totalSelectedAdvantage === totalRoll) {
      resultElement.style.color = "green";
      resultElement.textContent =
        snakeEyesComment +
        `Match! 
        Rolled: ${totalRoll} 
        against your stats: ${totalSelectedAdvantage}`;
    } else {
      resultElement.style.color = "red";
      resultElement.textContent =
        snakeEyesComment +
        `${totalRoll - totalSelectedAdvantage} Failures... 
          Rolled: ${totalRoll} 
          against your stats: ${totalSelectedAdvantage}`;
    }

    stopSpinner();
    showAndScrollToID("result");
  }, 500);
}

function extractSelected() {
  // Get selected attributes and skills
  const selected = [];
  const checkboxes = document.querySelectorAll(
    'input[type="checkbox"]:checked'
  );
  for (const checkbox of checkboxes) {
    selected.push(
      document.getElementById(checkbox.id + "_value").valueAsNumber
    );
  }

  const advantageData = document.getElementById("advantage");
  const advantageValue = Number(advantageData.value);
  const numRolls = selected.length;

  // Generate random numbers and sum
  // Get user input for total roll
  const totalSelected = selected.reduce((prev, curr) => prev + curr, 0);
  const totalSelectedAdvantage = totalSelected + advantageValue;
  return { numRolls, totalSelectedAdvantage };
}

function startSpinner() {
  document.getElementById("spinner-container").style.display = "block";
  // hide divs
  document.getElementById("result").style.display = "none";
  document.getElementById("probability").style.display = "none";
  // disable buttons
  document.querySelector("input[type=submit]").disabled = true;
}

function stopSpinner() {
  document.getElementById("spinner-container").style.display = "none";
  document.querySelector("input[type=submit]").disabled = false;
}

function showAndScrollToID(id) {
  document.getElementById(id).style.display = "block";
  document
    .getElementById(id)
    .scrollIntoView({ behavior: "smooth" });
}

/**
 * The function handles form submission events and delegates to different handlers based on which
 * button was clicked.
 * @param event - The event parameter is an object that represents an event that occurred in the
 * browser, such as a button click or form submission.
 */
function onSubmit(event) {
  event.preventDefault();

  // defer to odds handler if the odds button was clicked
  switch (event.submitter.id) {
    case "submit-button":
      rollAgainstSelectedHandler();
      break;
    case "odds-button":
      showOddsHandler();
      break;
    default:
      console.log("no event handler found for submitter");
  }
}

/**
 * The function loads a CSV file, parses it, generates HTML from the parsed data, adds the HTML to the
 * DOM, and adds an event listener to the skills form.
 * @param csv - a string containing comma-separated values (CSV) representing skills data.
 */
function loadCSV(csv) {
  const skills = parseCSV(csv);
  const skillsHTML = generateSkillsHTML(skills);

  // Add skills to DOM
  document.querySelector("#skills").innerHTML = skillsHTML;

  // add event listener
  document.getElementById("skills").addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(event);
  });
}
