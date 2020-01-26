DROP DATABASE IF EXISTS employee_dataDB;
CREATE database employee_dataDB;

USE employee_dataDB;

CREATE TABLE DEPARTMENTS (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(30),
  PRIMARY KEY (id)
);

CREATE TABLE ROLES (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(30),
  salary DECIMAL,
  department_id INT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(id)
);

CREATE TABLE EMPLOYEES (
  id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(30),
  last_name VARCHAR(30),
  role_id INT,
  manager_id INT,
  CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES ROLES(id),
  CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES EMPLOYEES(id),
  PRIMARY KEY (id)
);


-- * **department**:

--   * **id** - INT PRIMARY KEY
--   * **name** - VARCHAR(30) to hold department name

-- * **role**:

--   * **id** - INT PRIMARY KEY
--   * **title** -  VARCHAR(30) to hold role title
--   * **salary** -  DECIMAL to hold role salary
--   * **department_id** -  INT to hold reference to department role belongs to

-- * **employee**:

--   * **id** - INT PRIMARY KEY
--   * **first_name** - VARCHAR(30) to hold employee first name
--   * **last_name** - VARCHAR(30) to hold employee last name
--   * **role_id** - INT to hold reference to role employee has
--   * **manager_id** - INT to hold reference to another employee that manager of the current employee. This field may be null if the employee has no manager

-- use employee_dataDB;
-- select * from EMPLOYEES where first_name= "tom";
-- select * from EMPLOYEES JOIN ROLES Join Departments ON EMPLOYEES.role_id=ROLES.id AND roles.department_id=departments.id where first_name= "tom";
-- select roles.department_id as "magicNumber" from employees JOIN ROLES ON EMPLOYEES.role_id=ROLES.id where employees.first_name= "tom";
