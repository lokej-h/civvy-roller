function generateSkillsHTML(attributes) {
  let html = "";

  if (attributes.attributes && attributes.attributes.length > 0) {
    // Add attributes section heading and checkbox
    html += `<h2>Attributes</h2>`;

    // Add attributes with checkbox to each attribute
    for (let attribute of attributes.attributes) {
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
    for (let skill of attributes.skills) {
      if (!groupedSkills[skill.category]) {
        groupedSkills[skill.category] = [];
      }
      groupedSkills[skill.category].push(skill);
    }
    // console.log(groupedSkills)

    // Add skills with checkbox to each skill
    for (let category in groupedSkills) {
      html += `<h3>${category}</h3>`;
      for (let skill of groupedSkills[category]) {
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

  html += '<label for="advantage">Enter the advantage/disadvantage to the roll: </label>'
  html += '<input type="number" id="advantage" name="advantage" min="-5" max="5" step="1" value="0"></input>'

  // Add submit button
  html += '<input type="submit" id="submit-button" value="Submit">';

  // Add odds button
  html += '<input type="submit" id="odds-button" value="Show me the Odds">';

  return html;
}

function handleFile() {
  const input = document.getElementById("file-input");
  const file = input.files[0];
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function () {
    const csv = reader.result;
    loadCSV(csv);
  }
}

function parseCSV(csv) {
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
  //const vehicleStats = [][];

  // Find abilities column
  // we know it is in the first row
  let attributeColumnOffset = lines[0].findIndex((cell) => cell.includes("Attributes"));
  if (attributeColumnOffset === -1) {
    throw new Error("Unable to find attributes section");
  }
  console.log(attributeColumnOffset);

  // Find start of skills section
  let skillStartIndex = lines.findIndex((row) => row[0].includes("Skills"));
  if (skillStartIndex === -1) {
    throw new Error("Unable to find start of skills section");
  }

  // Get skill categories
  const skillCategories = lines[skillStartIndex + 1];

  // Parse attributes section
  for (let i = 3; i < skillStartIndex - 1; i += 2) {
    const attribute = {
      name: lines[i][attributeColumnOffset],
      description: lines[i + 1][attributeColumnOffset],
      value: lines[i + 1][attributeColumnOffset + 1],
    };
    if (attribute.name !== "")
      attributes.push(attribute);
  }

  // Parse skills section
  for (let column = 0; column < skillCategories.length; column++) {
    let row = skillStartIndex + 3;
    const category = skillCategories[column];
    if (category !== "") {
      while (lines[row][column] !== "") {
        const skill = {
          name: lines[row][column],
          category: category,
          description: lines[row + 1][column + 1],
          value: lines[row + 1][column],
        };
        skills.push(skill);
        row++;
        row++;
      }
    }
  }

  return { attributes, skills };
}

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

function calculateRoll(n) {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += window.crypto.getRandomValues(new Uint8Array(1))[0] % 6 + 1;
  }
  return sum;
}


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



function probRollLower(target, numRolls, distribution) {
  let numBelow = 0;
  const totalOutcomes = Math.pow(6, numRolls);


  for (let i = 0; i <= target; i++) {
    numBelow += distribution[i];
  }

  return Math.floor((numBelow / totalOutcomes) * 100);
}


function onSubmit(event) {
  event.preventDefault();

  if (event.submitter.id === 'odds-button') {
    onOdds(event);
  }
  else {
    // Get selected attributes and skills
    const selected = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    for (let checkbox of checkboxes) {
      selected.push(document.getElementById(checkbox.id + "_value").valueAsNumber);
    }

    var advantageData = document.getElementById('advantage');
    var advantageValue = Number(advantageData.value);
    let numRolls = selected.length;

    if (numRolls != 0) {
      // Generate random numbers and sum
      // Get user input for total roll
      const totalSelected = selected.reduce((prev, curr) => prev + curr, 0);
      const totalSelectedAdvantage = totalSelected + advantageValue;
      const totalRoll = calculateRoll(numRolls);
      let snakeEyesComment = "";

      if (totalRoll === numRolls) {
        snakeEyesComment = `SNAKE EYES! Mark your attribute for level up  `
      };
      if (totalRoll === numRolls * 6) {
        snakeEyesComment = `Crit Fail! Add a Tomino Token because you're gonna have a bad time...`
      };

      // do a little spinny for the UI
      document.getElementById("spinner-container").style.display = "block";
      document.getElementById("result").style.display = "none";
      document.getElementById("probability").style.display = "none";
      document.querySelector('input[type=submit]').disabled = true;

      setTimeout(() => {
        // Compare selected total to user input total
        const resultElement = document.getElementById('result');
        if (totalSelectedAdvantage > totalRoll) {
          resultElement.style.color = "green";
          resultElement.textContent = snakeEyesComment + `${totalSelectedAdvantage - totalRoll} Successes! 
          Rolled: ${totalRoll} 
          against your stats: ${totalSelectedAdvantage}`;
        } else if (totalSelectedAdvantage === totalRoll) {
          resultElement.style.color = "green";
          resultElement.textContent = snakeEyesComment + `Match! 
          Rolled: ${totalRoll} 
          against your stats: ${totalSelectedAdvantage}`;
        } else {
          resultElement.style.color = "red";
          resultElement.textContent = snakeEyesComment + `${totalRoll - totalSelectedAdvantage} Failures... 
            Rolled: ${totalRoll} 
            against your stats: ${totalSelectedAdvantage}`;
        }

        document.getElementById("spinner-container").style.display = "none";
        document.getElementById("result").style.display = "block";
        document.querySelector('input[type=submit]').disabled = false;
        document.getElementById("result").scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }
}

function onOdds(event) {
  event.preventDefault();

  // Get selected attributes and skills
  const selected = [];
  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
  for (let checkbox of checkboxes) {
    selected.push(document.getElementById(checkbox.id + "_value").valueAsNumber);
  }

  var advantageData = document.getElementById('advantage');
  var advantageValue = Number(advantageData.value);
  let numRolls = selected.length;

  if (numRolls != 0) {
    // Generate random numbers and sum
    // Get user input for total roll
    const totalSelected = selected.reduce((prev, curr) => prev + curr, 0);
    const totalSelectedAdvantage = totalSelected + advantageValue;
    const distribution = diceRollDistribution(numRolls);
    const rollProbability = probRollLower(totalSelectedAdvantage, numRolls, distribution);

    // do a little spinny for the UI
    document.getElementById("spinner-container").style.display = "block";
    document.getElementById("result").style.display = "none";
    document.getElementById("probability").style.display = "none";
    document.querySelector('input[type=submit]').disabled = true;

    setTimeout(() => {
      // output probability of success

      const probabilityElement = document.getElementById('probability');
      probabilityElement.textContent = `distribution of rolls is ${distribution.toString()} and the probability success is ${rollProbability}%`;

      document.getElementById("spinner-container").style.display = "none";
      document.getElementById("probability").style.display = "block";
      document.querySelector('input[type=submit]').disabled = false;
      document.getElementById("probability").scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }
}

function loadCSV(csv) {
  const skills = parseCSV(csv);
  const skillsHTML = generateSkillsHTML(skills);

  // Add skills to DOM
  document.querySelector("#skills").innerHTML = skillsHTML;

  // add event listener
  document.getElementById('skills').addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(event);
  });

}