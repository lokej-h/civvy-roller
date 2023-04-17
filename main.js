function createTable(csvData) {
  const table = document.createElement("table");

  // create table headers
  const headers = ["Name", "Description", "Value"];
  const headerRow = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // create table rows
  csvData.forEach((row) => {
    const tr = document.createElement("tr");
    const nameTd = document.createElement("td");
    const descriptionTd = document.createElement("td");
    const valueTd = document.createElement("td");
    nameTd.textContent = row.name;
    descriptionTd.textContent = row.description;
    valueTd.textContent = row.value;
    tr.appendChild(nameTd);
    tr.appendChild(descriptionTd);
    tr.appendChild(valueTd);
    table.appendChild(tr);
  });

  return table;
}

function generateSkillsHTML(skills) {
  let html = "";

  if (skills.abilities && skills.abilities.length > 0) {
    // Add abilities section heading
    html += `<fieldset>
                <legend>Abilities</legend>`;

    // Add abilities
    for (let ability of skills.abilities) {
      html += `<div class="form-group">
                  <label for="${ability.name}">${ability.name}:</label>
                  <input class="form-control" type="number" id="${ability.name}" name="${ability.name}" value="${ability.value}">
                  <p class="help-text">${ability.description}</p>
               </div>`;
    }

    html += `</fieldset>`;
  }

  if (skills.skills && skills.skills.length > 0) {
    // Add skills section heading
    html += `<fieldset>
                <legend>Skills</legend>`;

    // Group skills by category
    const groupedSkills = {};
    for (let skill of skills.skills) {
      if (!groupedSkills[skill.category]) {
        groupedSkills[skill.category] = [];
      }
      groupedSkills[skill.category].push(skill);
    }

    // Add skills under each category
    for (let category in groupedSkills) {
      html += `<fieldset>
                  <legend>${category}</legend>`;

      for (let skill of groupedSkills[category]) {
        html += `<div class="form-check">
                    <input class="form-check-input" type="checkbox" id="${skill.name}" name="${skill.name}" value="${skill.value}">
                    <label class="form-check-label" for="${skill.name}">${skill.name}</label>
                    <p class="help-text">${skill.description}</p>
                 </div>`;
      }

      html += `</fieldset>`;
    }

    html += `</fieldset>`;
  }

  return html;
}


function loadCharacterSheet() {
  readCSV("skills.csv", function (csv) {
    const skills = parseCSV(csv);
    const skillsHTML = generateSkillsHTML(skills);

    // Add skills to DOM
    document.querySelector("#skills").innerHTML = skillsHTML;
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

    cells.push(currentCell);

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
  let row = skillStartIndex + 3;
  for (let column = 0; column < skillCategories.length; column++) {
    const category = skillCategories[column];
    if (category) {
      while (lines[row][0] !== "") {
        const skill = {
          name: lines[row][column],
          category: category,
          description: lines[row + 1][1],
          value: lines[row + 1][0],
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

fetch("skills.csv")
  .then((response) => response.text())
  .then((text) => {
    const skills = parseCSV(text);
    console.log(skills);
  });
