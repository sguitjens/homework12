const inquirer = require("inquirer");
const fs = require("fs");
const mysql = require("mysql");
require("dotenv").config();

console.log(process.env.MY_SECRET)

let connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.MYSQL_PASSWORD,
  database: "employee_dataDB"
});

const promptForAction = () => {
  inquirer.prompt({
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: ["Add Employee", "Add Department", "Add Role", "Finish"],
      default: "Add Employee"
  })
  .then(answer => {
    console.log("You chose to", answer.action);
    switch(answer.action) {
      case "Finish": return cleanUpAndEnd();
      case "Add Employee": return addEmployee();
      case "Add Department": return addDepartment();
      case "Add Role": return addRole();
    }
  });
}
const cleanUpAndEnd = () => {
  console.log("Goodbye!");
  connection.end()
  process.exit(0)
}

const getRoles = () => {
  let options = [];
  let query = "SELECT (title) FROM ROLES";
  // let query = "INSERT INTO EMPLOYEES (first_name, last_name, role_id, manager_id) values(?)";
  // console.log("QUERY ROLES", query);
  connection.query(query, (err, result) => {// hmm
    if (err) throw err;
    result.forEach(element => {
      options.push(element.title);
      // console.log("ELEMENT", element.title);
    })
    console.log("record inserted", options);
  })
  console.log("options", options);
  return options; // returns too soon
}

getRoles.catch = (err) => {
  console.log("ERROR in getRoles:", err);
};

const addEmployee = () => {
  inquirer.prompt([
    {
      type: "input",
      name: "firstName",
      message: "Enter the employee's first name",
      required: "true",
      default: "no-first-name"
    },
    {
      type: "input",
      name: "lastName",
      message: "Enter the employee's last name",
      required: "true",
      default: "no-last-name"
    },
    { // TODO: this needs to be a list of options from the roles database
      type: "input",
      name: "role", 
      message: "Enter the employee's role",
      choices: ["temp"], // TODO: create function getRolesList
      required: "true",
      default: "unknown"
    },
    { // TODO: this needs to be a list of options from the managers in the employee database
      type: "input",
      name: "manager",
      message: "Enter the employee's manager", // TODO: create function to get managers list
      required: "true",
      default: "unknown"
    }
  ])
  .then(answers => {
    console.log("Your choices:", answers);
    // put the stuff in the database
    let query = "INSERT INTO EMPLOYEES (first_name, last_name, role_id, manager_id) values(?)";
    connection.query(query,[answers.firstName, answers.lastName, answers.role, answers.manager], (err, result) => {
      if (err) throw err;
      console.log("record inserted");
    })
  })
  .then(result => {
    console.log("result of insertion", result);
    return promptForAction();
  });
}

addEmployee.catch = (err) => {
  console.log("ERROR in addEmployee:", err);
};

const addRole = () => {
  inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: "Enter a department title",
      required: "true",
      default: "default-title"
    },
    {
      type: "input",
      name: "salary",
      message: "Enter the yearly salary for the role",
      required: "true",
      default: "0"
    },
    {
      type: "input",
      name: "id",
      message: "Enter the role id number",
      required: "true",
      default: "000" // needs to be unique: can we validate here?
    }
  ])
  .then(answers => {
    console.log("Your choices:", answers);
  });
}

addRole.catch = (err) => {
  console.log("ERROR in addRole:", err);
};

const addDepartment = () => {
  inquirer.prompt({
    type: "input",
    name: "name",
    message: "Enter a department name",
    required: "true",
    default: "nothing" // auto incremented value
  })
  .then(answer => {
    connection.connect(err => {
      if(err) throw err;
      console.log("connected");
      let query = `INSERT INTO DEPARTMENTS (name) values(?)`;
      connection.query(query,[answer.name], (err, result) => {
        if (err) throw err;
        console.log("record inserted");
      })
    })
  })
  .then(result => {
    console.log("result of insertion", result);
    return promptForAction();
  });
}

addDepartment.catch = (err) => {
  console.log("ERROR in addDepartment:", err);
};


// promptForAction();
// addEmployee();
// addRole();
console.log(getRoles());


// when deleting: delete cascade - it will also delete the employee