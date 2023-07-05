// add file event listener to show chosen file name
document.getElementById("file-input").addEventListener("change", () => {
  showSelectedFileName();
});

function showSelectedFileName() {
  const input = document.getElementById("file-input");
  const file = input.files[0];
  document.getElementById("file-input-name").textContent = `${file.name}`;
}

showSelectedFileName();

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
 * The function loads a CSV file, parses it, generates HTML from the parsed data, adds the HTML to the
 * DOM, and adds an event listener to the skills form.
 * @param {str} csv - a string containing comma-separated values (CSV) representing skills data.
 */
function loadCSV(csv) {
  const properties = parseCSV(csv);
  const skillsHTML = generateSkillsHTML(properties);

  // Add skills to DOM
  document.querySelector("#skills").innerHTML = skillsHTML;

  // add event listener
  document.getElementById("skills").addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(event);
  });

  // add vehicle event listener
  const vehicleDropdown = document.getElementById("vehicle-select");
  vehicleDropdown.addEventListener("change", () => {
    const selectedVehicle = vehicleDropdown.value;
    const vehicle = properties.vehicles.getVehicle(selectedVehicle);
    if (vehicle === undefined) {
      document.getElementById("vehicle-property-container").innerHTML = "";
    } else {
      document.getElementById("vehicle-property-container").innerHTML =
        vehicle.makeHTML();
    }
  });
}

/**
 * Bulk of processing, convert the comma delimited csv into "lines"
 * Each line is a row so we can index by row-column format e.g. line[row][column]
 * @param {str} csv string csv directly from the uploaded file
 * @returns {Array<Array<str>>} 2D array version of the csv
 */
function csvStrToArray(csv) {
  const totalColumns = csv.split("\n")[0].split(",").length;
  // 2D array
  const lines = [];
  /**
   * key point: cells may span multiple lines
   * therefore lines can be found by two ways:
   *  1. check for an unterminated quote, this seems to be the only case
   *      might not be the only case
   *  2. ensure there are the same number of columns each time
   *      might now work depending on the standard
   */
  /**
   * This is the solution I have
   *
   * State:
   * - insideQuotes: bool
   * - cells: str[] (current row)
   */
  let cells = [];
  let currentCell = "";
  let insideQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    // get char
    const char = csv.charAt(i);
    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }
    if (!insideQuotes) {
      // check for cell delimiter
      if (char === ",") {
        pushCellData();
        // console.log("Cell complete: ", cells[-1]);
        continue;
      }
      /**
       * If we hit the end of the row
       * This is always at the end of a line
       */
      if (char === "\n") {
        pushCellData();
        // add row to 2D array
        lines.push(cells);
        // reset row state
        cells = [];
        // console.log("Row complete: ", lines[-1]);
        continue;
      }
    }
    // not end of cell or end of row, add content to cell
    currentCell += char;
    // console.log("Cell updated: ", currentCell);
  }
  // console.log(lines);
  return lines;

  function pushCellData() {
    // add cell to row, if Windows, there's going to be \r's at the start
    // of some rows
    cells.push(currentCell.trimEnd());
    // reset cell data
    currentCell = "";
  }
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
  // convert the csv string to 2D array
  const lines = csvStrToArray(csv);

  // create collections
  const attributes = new AttributeCollection();
  const skills = new SkillCollection();
  const vehicles = new VehicleCollection();

  // Get attribute section metadata
  const attributeColumnOffset = getAbilityMetadata();

  // Get skill section metadata
  const { skillStartIndex, skillCategories } = getSkillMetadata();

  // Get vehicle section metadata
  const { vehicleColumnsStart, vehicleList, vehicleStatRow, vehicleRowHeader } =
    getVehicleMetadata();

  // Parse attributes section
  parseAttributes();

  // Parse skills section
  parseSkills();

  // Parse vehicle section
  parseVehicles();

  return { attributes, skills, vehicles };

  /**
   * This function finds the offset of the abilities column in a table.
   * @returns the index of the column that contains the "Attributes" section in the first row of a table.
   */
  function getAbilityMetadata() {
    // Find abilities column
    // we know it is in the first row
    const attributeColumnOffset = lines[0].findIndex((cell) =>
      cell.includes("Attributes")
    );
    if (attributeColumnOffset === -1) {
      throw new Error("Unable to find attributes section");
    }
    return attributeColumnOffset;
  }

  /**
   * The function finds the start of the skills section in an array of lines and returns the index and
   * categories of the skills.
   * @returns An object with two properties: `skillStartIndex` and `skillCategories`.
   */
  function getSkillMetadata() {
    // Find start of skills section
    const skillStartIndex = lines.findIndex((row) => row[0].includes("Skills"));
    if (skillStartIndex === -1) {
      throw new Error("Unable to find start of skills section");
    }

    // Get skill categories
    const skillCategories = lines[skillStartIndex + 1];
    return { skillStartIndex, skillCategories };
  }

  /**
   * This function retrieves metadata about a vehicle section in an array of lines.
   * @returns An object containing the following properties: vehicleColumnsStart, vehicleList,
   * vehicleStatRow, and vehicleRowHeader.
   */
  function getVehicleMetadata() {
    // Find start of vehicle section
    const vehicleRowHeader = lines.findIndex((row) =>
      row[0].includes("Consumable Stats")
    );
    if (vehicleRowHeader === -1) {
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
    return {
      vehicleColumnsStart,
      vehicleList,
      vehicleStatRow,
      vehicleRowHeader,
    };
  }

  /**
   * The function parses attributes from lines and adds them to an attribute object.
   */
  function parseAttributes() {
    for (let i = 3; i < skillStartIndex - 2; i += 2) {
      const attribute = {
        name: lines[i][attributeColumnOffset],
        description: lines[i + 1][attributeColumnOffset],
        value: lines[i + 1][attributeColumnOffset + 1],
      };
      attributes.add(
        new Attribute(attribute.name, attribute.value, attribute.description)
      );
      // if (attribute.name !== "") attributes.push(attribute);
    }
  }

  /**
   * The function parses skills from lines and adds them to a set of Skill objects.
   */
  function parseSkills() {
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
          skills.add(
            new Skill(
              skill.name,
              skill.value,
              skill.description,
              skill.category
            )
          );
          // skills.push(skill);
          row++;
          row++;
        }
      }
    }
  }

  /**
   * This function parses vehicle data from lines and creates Vehicle objects with their
   * respective attributes.
   */
  function parseVehicles() {
    // const vehicles = [];
    for (
      let vehicleColumn = vehicleColumnsStart;
      vehicleColumn < vehicleList.length;
      vehicleColumn++
    ) {
      // Parsing vehicle by vehicle...
      // start with the first stat
      let statRow = vehicleStatRow;
      const currentVehicle = lines[vehicleRowHeader][vehicleColumn];

      const vehicle = {};
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

      const vehicleClass = new Vehicle(
        vehicle.name,
        vehicle.specialDescription
      );
      for (const attribute of vehicle.attributes) {
        vehicleClass.add(
          new VehicleStat(
            attribute.name,
            attribute.value,
            attribute.description
          )
        );
      }
      vehicles.add(vehicleClass);
      // vehicles.push(vehicle);
    }
  }
}

/**
 * The function generates HTML code for a form that includes attributes and skills with checkboxes and
 * input fields, as well as an advantage/disadvantage input and submit buttons.
 * @param {characterObject} attributes - An object containing two properties: "attributes" and "skills".
 * @returns an HTML string that includes checkboxes and input fields for attributes and skills, as well
 * as a label and input field for advantage/disadvantage and submit/odds buttons.
 */
function generateSkillsHTML(attributes) {
  let html = "";

  html += attributes.attributes.makeHTML();

  html += attributes.skills.makeHTML();

  html += attributes.vehicles.makeHTML();

  html += `<h2>Advantage</h2>
    <label for="advantage">Enter the advantage/disadvantage to the roll: </label>`;
  html +=
    '<input type="number" id="advantage" name="advantage" min="-5" max="5" step="1" value="0"></input>';

  // Make the floating submission div
  html += '<div class="action-container" id="floating-action-container">';

  // Add odds button
  html +=
    '<input class="action-button" type="submit" id="odds-button" value="Show me the Odds">';

  // Add submit button
  html +=
    '<input class="action-button" type="submit" id="submit-button" value="Submit">';

  // Close action container
  html += "</div>";

  return html;
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
 * The function extracts selected attributes and skills, calculates the total roll with advantage, and
 * returns the number of rolls and the total roll value.
 * @returns an object with two properties: "numRolls" and "totalSelectedAdvantage".
 */
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

/**
 * The function starts a spinner and disables certain buttons while hiding certain divs.
 */
function startSpinner() {
  document.getElementById("spinner-container").style.display = "block";
  // hide divs
  document.getElementById("result").style.display = "none";
  document.getElementById("probability").style.display = "none";
  // disable buttons
  for (const element in document.getElementsByClassName("action-button")) {
    element.disabled = true;
  }
}

/**
 * The function stops a spinner animation and enables a submit button.
 */
function stopSpinner() {
  document.getElementById("spinner-container").style.display = "none";
  document.querySelector("input[type=submit]").disabled = false;
}

/**
 * This function shows an HTML element with a specified ID and scrolls to it smoothly.
 * @param id - The ID of the HTML element that you want to show and scroll to.
 */
function showAndScrollToID(id) {
  document.getElementById(id).style.display = "block";
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
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
 * The function rolls a dice and compares the result to selected attributes and skills, displaying the
 * outcome in the UI.
 * @returns The function `rollAgainstSelectedHandler` does not explicitly return anything, but it may
 * return `undefined` implicitly if the `numRolls` variable is equal to 0.
 */
function rollAgainstSelectedHandler() {
  // Get selected attributes and skills
  const { numRolls, totalSelectedAdvantage } = extractSelected();

  // early return
  if (numRolls === 0) {
    return;
  }

  const totalRoll = calculateRoll(numRolls);
  let rollComment = "";

  if (totalRoll === numRolls) {
    rollComment = `SNAKE EYES! Mark your attribute for level up  `;
  }
  if (totalRoll === numRolls * 6) {
    rollComment = `Crit Fail! Add a Tomino Token because you're gonna have a bad time...`;
  }

  // do a little spinny for the UI
  startSpinner();

  setTimeout(() => {
    const resultElement = document.getElementById("result");

    // clear the div
    resultElement.innerHTML = "";

    if (rollComment !== "") {
      // add the comment on the top line
      const comment = document.createElement("p");
      comment.textContent = rollComment;
      resultElement.appendChild(comment);
    }

    // create a line for the roll
    const roll = document.createElement("p");

    // based on the roll, give different styles and text
    if (totalSelectedAdvantage > totalRoll) {
      resultElement.style.color = "green";
      roll.textContent = `${totalSelectedAdvantage - totalRoll} Successes! 
        Rolled: ${totalRoll} 
        against your stats: ${totalSelectedAdvantage}`;
    } else if (totalSelectedAdvantage === totalRoll) {
      resultElement.style.color = "green";
      roll.textContent = `Match! 
        Rolled: ${totalRoll} 
        against your stats: ${totalSelectedAdvantage}`;
    } else {
      resultElement.style.color = "red";
      roll.textContent = `${totalRoll - totalSelectedAdvantage} Failures... 
          Rolled: ${totalRoll} 
          against your stats: ${totalSelectedAdvantage}`;
    }

    // add line to the div
    resultElement.appendChild(roll);

    stopSpinner();
    showAndScrollToID("result");
  }, 500);
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
