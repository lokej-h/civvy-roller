function generateSkillsHTML(attributes) {
  let html = "";

  if (attributes.abilities && attributes.abilities.length > 0) {
    // Add abilities section heading and checkbox
    html += `<h2>Abilities</h2>`;

    // Add abilities with checkbox to each ability
    for (let ability of attributes.abilities) {
      html += `<div class="ability">
                  <label>
                    <input type="checkbox" name="${ability.name}" value="${ability.value}">
                    ${ability.name}:
                  </label>
                  <input type="number" name="${ability.name}_value" value="${ability.value}">
                  <span class="description">${ability.description}</span>
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
                      <input type="checkbox" name="${skill.name}" id="${skill.name}" value="${skill.value}">
                      ${skill.name}
                    </label>
                    <input type="number" name="${skill.name}_value" id="${skill.name}_value" value="${skill.value}">
                    <span class="description">${skill.description}</span>
                 </div>`;
      }
    }
  }

  // Add submit button
  html += '<input type="submit" id="submit-button" value="Submit">';

  return html;
}

function handleFile() {
  const input = document.getElementById("file-input");
  const file = input.files[0];
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function() {
    const csv = reader.result;
    loadCSV(csv);
  }
}

function loadCharacterSheet() {
  readCSV("skills.csv", function (csv) {
    loadCSV(csv);
  });
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
  const abilities = [];
  const skills = [];

  // Find start of skills section
  let skillStartIndex = lines.findIndex((row) => row[0].includes("Skills"));
  if (skillStartIndex === -1) {
    throw new Error("Unable to find start of skills section");
  }

  // Get skill categories
  const skillCategories = lines[skillStartIndex + 1];

  // Parse abilities section
  for (let i = 0; i < skillStartIndex - 1; i += 2) {
    const ability = {
      name: lines[i][0],
      description: lines[i + 1][0],
      value: lines[i + 1][1],
    };
    abilities.push(ability);
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
          description: lines[row + 1][column+1],
          value: lines[row + 1][column],
        };
        skills.push(skill);
        row++;
        row++;
      }
    }
  }

  return { abilities, skills };
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
    let roll = window.crypto.getRandomValues(new Uint8Array(1))[0] % 6 + 1;
    sum += roll;
  }
  return sum;
}

function submitHandler(event) {
  event.preventDefault();

  let totalRoll = 0;
  const selectedAbilities = document.querySelectorAll('input[name="ability"]:checked');
  const selectedSkills = document.querySelectorAll('input[name="skill"]:checked');

  for (let ability of selectedAbilities) {
    totalRoll += calculateRoll(1);
  }

  for (let skill of selectedSkills) {
    totalRoll += calculateRoll(1);
  }

  console.log(`Total roll: ${totalRoll}`);
}

function onSubmit(event) {
  event.preventDefault();

  // Get selected abilities and skills
  const selected = [];
  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
  for (let checkbox of checkboxes) {
    selected.push(document.getElementById(checkbox.id+"_value").valueAsNumber);
  }

  // Generate random numbers and sum
  const totalRoll = calculateRoll(selected.length);
  let snakeEyesComment = "";
  if (totalRoll === selected.length) {
    snakeEyesComment = `SNAKE EYES! ALL ROLLS WERE 1!!!     `
  };

  // Get user input for total roll
  const totalSelected = selected.reduce((prev, curr) => prev + curr, 0);

  // do a little spinny for the UI
  document.getElementById("spinner").style.display = "block";
  document.getElementById("result").style.display = "none";
  document.querySelector('input[type=submit]').disabled = true;

  setTimeout(() => {
    // Compare selected total to user input total
    const resultElement = document.getElementById('result');
    if (totalSelected > totalRoll) {
      resultElement.textContent = snakeEyesComment + `${totalSelected - totalRoll} Successes! 
      Rolled: ${totalRoll} 
      against your stats: ${totalSelected}`;
    } else if (totalSelected === totalRoll) {
      resultElement.textContent = snakeEyesComment + `Match! 
      Rolled: ${totalRoll} 
      against your stats: ${totalSelected}`;
    } else {
      resultElement.textContent = snakeEyesComment + `${totalRoll - totalSelected} Failures... 
        Rolled: ${totalRoll} 
        against your stats: ${totalSelected}`;
    }
    document.getElementById("spinner").style.display = "none";
    document.getElementById("result").style.display = "block";
    document.querySelector('input[type=submit]').disabled = false;
    document.getElementById("result").scrollIntoView({ behavior: 'smooth' });
  }, 500);
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
// fetch("skills.csv")
//   .then((response) => response.text())
//   .then((text) => {
//     const skills = parseCSV(text);
//     console.log(skills);
//   });
