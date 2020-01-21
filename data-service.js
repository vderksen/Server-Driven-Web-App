const Sequelize = require('sequelize');

// set up sequelize to point to our postgres database
var sequelize = new Sequelize('dai0tukbg52mf4', 'fsfbxjotyfqcvp', '6d1cc9e96dbbe027085526e640d7f67049641f90a1455508b26c317255b52fcb', {
    host: 'ec2-174-129-253-63.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: true
    }
});

// Define a "Employee" model
var Employee = sequelize.define('Employee', {
    employeeNum: {
       type: Sequelize.INTEGER,
       primaryKey: true, // use "employeeNum" as a primary key
       autoIncrement: true // automatically increment the value
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    Email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.STRING,
    Status: Sequelize.STRING,
    hireDate: Sequelize.STRING
});

// Define a "Department" model
var Department = sequelize.define('Department', {
    departmentId: {
       type: Sequelize.INTEGER,
       primaryKey: true, // use "departmentId" as a primary key
       autoIncrement: true // automatically increment the value
    },
    departmentName: Sequelize.STRING
});

// Define a relationship between Employees and Departments.
// Department can have many employees
Department.hasMany(Employee, {foreignKey: 'department'});

// This function will invoke the sequelize.sync() function, 
// which will ensure that we can connected to the DB
module.exports.initialize = function() {
    return new Promise(function(resolve, reject) {
        sequelize.sync()
        .then(()=>resolve()) 
        .catch(()=>reject("Unable to sync the database"));
    });
}

// This function will invoke the Employee.findAll() function 
module.exports.getAllEmployees = function() {  
    return new Promise(function(resolve, reject) {
        Employee.findAll() 
        .then((data)=>resolve(data))
        .catch(()=>reject("No results returned"));
    });
}

// This function will invoke the Employee.findAll() function 
// and filter the results by "status" 
module.exports.getEmployeesByStatus = function(status) {
    return new Promise(function(resolve, reject) {
        Employee.findAll({
            where: {Status: status}
        }) 
        .then((data)=>resolve(data))
        .catch(()=>reject("No results returned"));
    });
}

// This function will invoke the Employee.findAll() function 
// and filter the results by "department"
module.exports.getEmployeesByDepartment = function(department) {
    return new Promise(function(resolve, reject) {
        Employee.findAll({
            where: {department: department}
        }) 
        .then((data)=>resolve(data))
        .catch(()=>reject("No results returned"));
    });
}

// This function will invoke the Employee.findAll() function
// and filter the results by "employeeManagerNum" 
module.exports.getEmployeesByManager = function(manager) {
    return new Promise(function(resolve, reject) {
        Employee.findAll({
            where: {employeeManagerNum: manager}
        }) 
        .then((data)=>resolve(data))
        .catch(()=>reject("No results returned"));
    });
}

// This function will invoke the Employee.findAll() function 
// and filter the results by "employeeNum"
module.exports.getEmployeeByNum = function(num) {
    return new Promise(function(resolve, reject) {
        Employee.findAll({
            where: {employeeNum: num}
        }) 
        .then((data)=>resolve(data[0]))
        .catch(()=>reject("No results returned"));
    });
}

// This function will invoke the Department.findAll() function 
module.exports.getDepartments = function() {
    return new Promise(function(resolve, reject) {
        Department.findAll() 
        .then((data)=>resolve(data))
        .catch(()=>reject("No results returned"));
    });
}

// this function will add new Employee from the form
module.exports.addEmployee = function(employeeData) {
    // to ensure that isManager value is set correctly
    employeeData.isManager = (employeeData.isManager) ? true : false;
    // to set any blank values for properties to null
    for(var i in employeeData){
            if(employeeData[i]== "") 
            employeeData[i] = null;
    }
    return new Promise((resolve, reject) => {
        Employee.create(employeeData)
        .then(()=>resolve())
        .catch(()=>reject("Unable to create employee"))
    });
}

// this function will overwrite data for the employee
module.exports.updateEmployee = function(employeeData){
    // to ensure that isManager value is set correctly
    employeeData.isManager = (employeeData.isManager) ? true : false;
    // to set any blank values for properties to null
    for(var i in employeeData){
        if(employeeData[i] == "") 
        employeeData[i] = null;
    }
    return new Promise(function(resolve, reject) {
        Employee.update(employeeData, 
            {where: {employeeNum: employeeData.employeeNum}})
       .then(()=>resolve())
        .catch(()=>reject("Unable to update employee"));
    });
}

// This function will delete Department
module.exports.deleteEmployeeByNum = function(num) {
    return new Promise(function(resolve, reject) {
        Employee.destroy({
            where: {employeeNum: num}
        }) 
      .then(()=>resolve())
      .catch(()=>reject("Unable to delete employee"));
    });
}

// this function will add new Department from the form
module.exports.addDepartment = function(departmentData) {
    // to set any blank values for properties to null
    for(var i in departmentData){
            if(departmentData[i] == "") 
            departmentData[i] = null;
    }
    return new Promise((resolve, reject) => {
        Department.create(departmentData)
        .then(()=>resolve())
        .catch(()=>reject("Unable to create department"))
    });
}

// this function will overwrite data for the department
module.exports.updateDepartment = function(departmentData){
    // to set any blank values for properties to null
    for(var i in departmentData){
        if(departmentData[i] == "") 
        departmentData[i] = null;
    }
    return new Promise(function(resolve, reject) {
        Department.update(departmentData, 
            {where: {departmentId: departmentData.departmentId}})
       .then(()=>resolve())
        .catch(()=>reject("Unable to update employee"));
    });
}

// This function will invoke the Department.findAll() function 
// and filter the results by "departmentId"
module.exports.getDepartmentById = function(id) {
    return new Promise(function(resolve, reject) {
        Department.findAll({
            where: {departmentId: id}
        }) 
      .then((data)=>resolve(data[0]))
      .catch(()=>reject("No results returned"));
    });
}

// This function will delete Department
module.exports.deleteDepartmentById = function(id) {
    return new Promise(function(resolve, reject) {
        Department.destroy({
            where: {departmentId: id}
        }) 
      .then(()=>resolve())
      .catch(()=>reject("Unable to delete department"));
    });
}







// this function will provide an array of "employee" objects whose isManager property is true 
module.exports.getManagers = function() {
    return new Promise(function(resolve, reject) {
            reject();
    });
}
