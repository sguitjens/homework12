const inquirer = require("inquirer");
const fs = require("fs");
const mysql = require("mysql");
require("dotenv").config();

let connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.MYSQL_PASSWORD,
  database: "employee_dataDB"
});

const cleanUpAndEnd = () => {
  console.log("Goodbye!");
  connection.end()
  process.exit(0)
}

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
};

const addEmployee = () => {
  let query = "SELECT (title) FROM ROLES";
  let roles = [];
  connection.query(query, (err, result) => {
    if (err) throw err;
    roles = result.map(element => element.title);
    employeeQuestions(roles);
    console.log("ROLES inside query:", roles);
  });
};

addEmployee.catch = (err) => {
  console.log("ERROR in addEmployee:", err);
};

const employeeQuestions = (roles) => {
  console.log("roles?", roles);
  inquirer.prompt([
    {
      type: "input",
      name: "first_name",
      message: "Enter the employee's first name",
      required: "true",
      default: "no-first-name"
    },
    {
      type: "input",
      name: "last_name",
      message: "Enter the employee's last name",
      required: "true",
      default: "no-last-name"
    },
    {
      type: "list",
      name: "role_id", 
      message: "Select the employee's role",
      choices: roles,
      required: "true",
    },
    { // TODO: this needs to be a list of options from the managers in the employee database
      type: "input",
      name: "manager_id",
      message: "Enter the employee's manager", // TODO: create function to get managers list
      required: "true",
      default: "unknown"
    }
  ])
  .then(answers => {
    let query = "SELECT id FROM ROLES WHERE title = ?";
    connection.query(query,[answers.role_id], (err, result) => {
      if (err) throw err;
      answers.manager_id = parseInt(answers.manager_id, 10);
      answers.role_id = result[0].id;
      insertIntoTable(answers, "EMPLOYEES");
    })
  })
  .then(() => {
    return promptForAction();
  });
};

employeeQuestions.catch = (err) => {
  console.log("ERROR in employeeQuestions:", err);
};

const addRole = () => {
  let query =  "SELECT (name) from DEPARTMENTS";
  let deptNames = [];
  connection.query(query, (err, result) => {
    if(err) throw err;
    console.log("RESULT", result);
    deptNames = result.map(element => element.name);
    roleQuestions(deptNames);
  })
}

addRole.catch = (err) => {
  console.log("ERROR in addRole:", err);
};

const roleQuestions = (deptNames) => {
  inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: "Enter a role name",
      required: "true",
      default: "default-role"
    },
    {
      type: "input",
      name: "salary",
      message: "Enter the yearly salary for the role",
      required: "true",
      default: "0"
    },
    {
      type: "list",
      name: "department_id",  // might not matter what this is named
      message: "Select a role name",
      choices: deptNames,
      required: "true",
    }
  ])
  .then(answers => {
    console.log("Your choices:", answers);
    let query = "SELECT id FROM DEPARTMENTS WHERE name = ?";
    connection.query(query, [answers.department_id], (err, result) => {
      if(err) throw err;
      answers.salary = parseFloat(answers.salary);
      answers.department_id = result[0].id;
      insertIntoTable(answers, "ROLES");
    })
  })
  .then(() => {
    promptForAction();
  })
}

roleQuestions.catch = (err) => {
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
    insertIntoTable(answer, "DEPARTMENTS");
  })
  .then(result => {
    console.log("result of insertion", result);
    return promptForAction();
  });
};

addDepartment.catch = (err) => {
  console.log("ERROR in addDepartment:", err);
};

const insertIntoTable = ((answers, tableName) => {
  let query = `INSERT INTO ${tableName} SET ?`;
  connection.query(query, answers, (err, result) => {
    if (err) throw err;
    console.log(`record inserted into ${tableName}`);
    console.log("results:", result);
  })
})


promptForAction();

// when deleting: delete cascade - it will also delete the employee