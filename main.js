const inquirer = require("inquirer");
const fs = require("fs");
const mysql = require("mysql");
const consoleTable = require("console.table");
require("dotenv").config();

let connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.MYSQL_PASSWORD,
  database: "employee_dataDB"
});

const cleanUpAndEnd = () => {
  console.log("Goodbye!");
  connection.end();
  process.exit(0);
}

const promptForAction = () => {
  inquirer.prompt({
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: ["FINISH", "Add an employee", "Add a department", "Add a role",
                "View all employees", "View all departments", "View all roles",
                "Change a role for an employee", "Change the manager for an employee"],
      default: "Add Employee"
  })
  .then(answer => {
    console.log("You chose to", answer.action);
    switch(answer.action) {
      case "FINISH": return cleanUpAndEnd();
      case "Add an employee": return addEmployee();
      case "Add a department": return addDepartment();
      case "Add a role": return addRole();
      case "View all employees": return viewTable("EMPLOYEES");
      case "View all departments": return viewTable("DEPARTMENTS");
      case "View all roles": return viewTable("ROLES");
      case "Change a role for an employee": return changeEmployeeRole();
      case "Change the manager for an employee": return changeEmployeeManager();
    }
  });
};

const addEmployee = () => {
  // get a list of roles
  let query = "SELECT (title) FROM ROLES";
  let roles = [];
  connection.query(query, (err, result) => {
    if (err) throw err;
    roles = result.map(element => element.title);
  });
  // get id numbers for people eligible to be managers
  let managerId = 0;
  let idQuery = "SELECT id FROM ROLES WHERE title = 'CEO' OR 'Vice President' OR 'Director' OR 'Manager'";
  connection.query(idQuery, (err, result) => {
    if(err) throw err;
    managerId = result[0].id;
    // get list of managers
    let mgrQuery = "SELECT first_name, last_name FROM EMPLOYEES WHERE role_id = ?";
    let managers = [];
    connection.query(mgrQuery, managerId, (err, result) => {
      if(err) throw err;
      managers = result.map(element => `${element.first_name} ${element.last_name}`);
      employeeQuestions(roles, managers);
    });
  });
};

addEmployee.catch = (err) => {
  console.log("ERROR in addEmployee:", err);
};

const employeeQuestions = (roles, managers) => {
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
    {
      type: "list",
      name: "manager_id",
      message: "Select the employee's manager",
      choices: managers,
      required: "true",
      default: "unknown"
    }
  ])
  .then(answers => {
    // get the role id from the title
    let query = "SELECT id FROM ROLES WHERE title = ?";
    connection.query(query,[answers.role_id], (err, role_id_result) => {
      if (err) throw err;
      answers.role_id = role_id_result[0].id;
      // repetitive: need to figure out how to pull this out
      // get the employee's id from the name
      query = "SELECT id FROM EMPLOYEES WHERE CONCAT(first_name, ' ', last_name) = ?";
      connection.query(query, [answers.manager_id], (err, empl_id_result) => {
        if(err) throw err;
        answers.manager_id = empl_id_result[0].id; // BROKEN
        insertIntoTable(answers, "EMPLOYEES");
      });
    });
  })
  .then(() => promptForAction());
};

employeeQuestions.catch = (err) => {
  console.log("ERROR in employeeQuestions:", err);
};

const addRole = () => {
  let query =  "SELECT (name) from DEPARTMENTS";
  let deptNames = [];
  connection.query(query, (err, result) => {
    if(err) throw err;
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
      message: "Select a department",
      choices: deptNames,
      required: "true",
    }
  ])
  .then(answers => {
    let query = "SELECT id FROM DEPARTMENTS WHERE name = ?";
    connection.query(query, [answers.department_id], (err, result) => {
      if(err) throw err;
      answers.salary = parseFloat(answers.salary);
      answers.department_id = result[0].id;
      insertIntoTable(answers, "ROLES");
    })
  })
  .then(() => promptForAction())
}

roleQuestions.catch = (err) => {
  console.log("ERROR in addRole():", err);
};

const addDepartment = () => {
  inquirer.prompt({
    type: "input",
    name: "name",
    message: "Enter a department name",
    required: "true",
    default: "nothing"
  })
  .then(answer => {
    insertIntoTable(answer, "DEPARTMENTS");
  })
  .then(() => promptForAction());
};

addDepartment.catch = (err) => {
  console.log("ERROR in addDepartment():", err);
};

const changeEmployeeRole = () => {
  // get list of employees
  let mgrQuery = "SELECT first_name, last_name FROM EMPLOYEES";
  connection.query(mgrQuery, (err, result) => {
    if(err) throw err;
    let employeeList = result.map(element => `${element.first_name} ${element.last_name}`);
    // get list of roles
    let roleQuery = "SELECT title FROM ROLES";
    connection.query(roleQuery, (err, result) => {
      if(err) throw err;
      let roleList = result.map(element => `${element.title}`);
      changeRoleQuestions(employeeList, roleList);
    });
  });
};

changeEmployeeRole.catch = (err) => {
  console.log("ERROR in changeEmployeeRole():", err);
};

const changeRoleQuestions = (employeeList, roleList) => {
  inquirer.prompt([
    {
      type: "list",
      name: "employee_name",
      message: "Select the employee whose role you want to change",
      choices: employeeList,
      required: "true",
    },
    {
      type: "list",
      name: "role_title",
      message: "Select the role to assign to that employee",
      choices: roleList,
      required: "true",
    }
  ])
  .then(answers => {
    // get the employee's id from the name
    let query = "SELECT id FROM EMPLOYEES WHERE CONCAT(first_name, ' ', last_name) = ?";
    connection.query(query, [answers.employee_name], (err, empl_id_result) => {
      if(err) throw err;
      // get the role id from the role title
      query = "SELECT id FROM ROLES WHERE title = ?";
      connection.query(query, [answers.role_title], (err, role_id_result) => { // problem here
        if(err) throw err;
        // update the employee's role id
        query = "UPDATE EMPLOYEES SET role_id = ? WHERE id = ?";
        connection.query(query, [role_id_result[0].id, empl_id_result[0].id], (err, result) => {
          if(err) throw err;
          console.log(`       ${result.affectedRows} row(s) affected, ${result.changedRows} changed`)
          promptForAction();
        });
      });
    });
  });
};

changeRoleQuestions.catch = (err) => {
  console.log("ERROR in changeRoleQuestions():", err);
};

const changeEmployeeManager = () => {
    // get list of employees
    let mgrQuery = "SELECT first_name, last_name FROM EMPLOYEES";
    connection.query(mgrQuery, (err, result) => {
      if(err) throw err;
      let employeeList = result.map(element => `${element.first_name} ${element.last_name}`);
      changeManagerQuestions(employeeList);
    });
}

const changeManagerQuestions = (employeeList) => {
  inquirer.prompt([
    {
      type: "list",
      name: "employee_name",
      message: "Select the employee whose manager you want to change",
      choices: employeeList,
      required: "true",
    },
    {
      type: "list",
      name: "manager_name",
      message: "Select the manager to assign to that employee",
      choices: employeeList,
      required: "true",
    }
  ])
  .then(answers => {
    // get the employee's id from the name
    let query = "SELECT id FROM EMPLOYEES WHERE CONCAT(first_name, ' ', last_name) = ?";
    connection.query(query, [answers.employee_name], (err, employee_result) => {
      if(err) throw err;
      // get the manager's id from the name
      query = "SELECT id FROM EMPLOYEES WHERE CONCAT(first_name, ' ', last_name) = ?";
      connection.query(query, [answers.manager_name], (err, manager_result) => {
        if(err) throw err;
        // update the employee's manager id to be the manager's id
        query = "UPDATE EMPLOYEES SET manager_id = ? WHERE id = ?";
        connection.query(query, [manager_result[0].id, employee_result[0].id], (err, result) => {
          if(err) throw err;
          console.log(`       ${result.affectedRows} row(s) affected, ${result.changedRows} changed`)
          promptForAction();
        });
      });
    });
  });
};

changeManagerQuestions.catch = (err) => {
  console.log("ERROR in changeManagerQuestions():", err);
};

const insertIntoTable = ((answers, tableName) => {
  let query = `INSERT INTO ${tableName} SET ?`;
  connection.query(query, answers, (err, result) => {
    if (err) throw err;
  });
});

insertIntoTable.catch = err => {
  console.log("ERROR in insertIntoTable()");
}


const viewTable = (tableName) => {
  let query = `SELECT * FROM ${tableName}`;
  connection.query(query, (err, result) => {
    if (err) throw err;
    const table = consoleTable.getTable(result);
    console.log(table); // this needs to stay
    promptForAction();
  });
};

viewTable.catch = err => {
  console.log("ERROR in ViewTable()", err);
}

const welcomeBanner = () => {
  console.log(`

  *       *     *       *    *       * 
  *             *      *    *         **  *
      *          *      
            Employee Tracker
  *     *   *     *       *           * 
   ** *  *           *          *         *
       *          *      
                            *    
               *  
     *     *      *   
        *              
  *     *                      *      * 
      *           
    *             
            *          
       *                  *             *
  
  `)
}

welcomeBanner();
promptForAction();


// when deleting: delete cascade - it will also delete the employee