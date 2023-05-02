class BaseProperty {
  constructor(name, value, description) {
    this.name = name;
    this.value = value;
    this.description = description;
  }
}
class Attribute extends BaseProperty {}
class Skill extends BaseProperty {
  constructor(name, value, description, category) {
    super(name, value, description);
    this.name = name;
    this.value = value;
    this.description = description;
    this.category = category;
  }
}
class VehicleStat extends BaseProperty {}
class BaseCollection {
  constructor() {
    this.items = [];
  }

  add(item) {
    this.items.push(item);
  }
}
class AttributeCollection extends BaseCollection {
  makeHTML() {
    let html = "";
    // Add attributes section heading and checkbox
    html += `<h2>Attributes</h2>`;
    // Add attributes with checkbox to each attribute
    for (const attribute of this.items) {
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
    return html;
  }
}
class SkillCollection extends BaseCollection {
  makeHTML() {
    let html = "";
    // Add skills section heading and checkbox
    html += `<h2>Skills</h2>`;
    // Group skills by category
    const groupedSkills = {};
    for (const skill of this.items) {
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
    return html;
  }
}
class Vehicle extends BaseCollection {
  constructor(name, description) {
    super();
    this.name = name;
    this.description = description;
  }

  makeHTML() {
    let html = "";
    // make heading
    html += `<h3>${this.name}</h3>`;
    // make property area
    for (const property of this.items) {
      html += `<div id="${property.name}-properties" class="vehicle-properties">
        <label for=${property.name}>
            <input type="checkbox" name="${property.name}1" id="${property.name}" value="${property.value}">
            <input type="checkbox" name="${property.name}2" id="${property.name}" value="${property.value}">
            ${property.name}
        </label>
        <input type="number" name="${property.name}_value" id="${property.name}_value" value="${property.value}">
        <span class="description">${property.description}</span>
        </div>`;
    }
    return html;
  }
}
class VehicleCollection extends BaseCollection {
  makeHTML() {
    let html = "";
    // make heading
    html += `<h2>Vehicles</h2>`;
    // make selection
    html += `<label for="vehicle-select">Select a vehicle: </label>`;
    html += `<select id="vehicle-select">`;
    html += `<option value="null">No Vehicle</option>`;
    for (const vehicle of this.items) {
      html += `<option value="${vehicle.name}">${vehicle.name}</option>`;
    }
    html += `</select>`;
    // setup the container for vehicle properties
    html += `<div id="vehicle-property-container">`;
    html += `</div>`;
    return html;
  }

  getVehicle(name) {
    return this.items.find((vehicle) => vehicle.name === name);
  }
}
