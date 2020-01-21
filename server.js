/****************************************************************************************************
*
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Valentina Derksen    Student ID: 153803184      Date: November 28, 2019
*
*  Online (Heroku) Link: https://fathomless-forest-18097.herokuapp.com
*
******************************************************************************************************/ 

//////////////////////////////////////////////////////////////
// ADD REQUIRED MODULES

var express = require("express"); // add Express module (Node web framework)
var app = express(); // access to an Express application object through the variable app
var path = require("path"); // add Path module to handle file paths
var data = require("./data-service.js"); // add Data-Service module
var multer = require("multer"); // add Multer module
var fs = require('fs'); // add the fs module
var bodyParser = require("body-parser"); // add body-parser module
var exphbs=require("express-handlebars"); // add express-handlebars module
var dataServiceAuth = require("./data-service-auth.js"); // add "data-service-auth" module
var clientSessions = require("client-sessions"); // add "client-sessions" module 

var HTTP_PORT = process.env.PORT || 8080; // the server must listen on Port 8080

// call this function after the http server starts listening for requests
function onHttpStart(){
  console.log("Express http server listening on: " + HTTP_PORT);
}

// setup the folder public as default folder
app.use(express.static('public'));

// Setup client-sessions
app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "web322_as6", // this should be a long un-guessable string.
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.use(function(req,res,next){
  res.locals.session=req.session;
  next();
});

// add The middleware to handle url encoded data
app.use(bodyParser.urlencoded({extended:true}));

// This is a helper middleware function that checks if a user is logged in
function ensureLogin(req,res,next){
  if(!req.session.user){
    res.redirect("/login");
  } else {
    next();
  }
}

// ".hbs" files will use the template engine
// make "main.hbs" file as default layout
// register handlebars as the rendering engine for views
app.engine('.hbs', exphbs({
  extname:'.hbs',
  dafaultLayout:'main',
  helpers: {
   // replace existing navbar links with code. 
   // Automatically render the correct <li> element add the class "active"
    navLink: function(url, options){
      return '<li' +
        ((url == app.locals.activeRoute) ? 'class="active"' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    // evaluate conditions for wquality, will render content.
    equal:function(lvalue,rvalue,options){
      if(arguments.length<3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if(lvalue!=rvalue){
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
}))
app.set('view engine','.hbs');

//////////////////////////////////////////////////////////////
// SET UP ROUTES ON /LOGIN, /REGISTER, /LOGOUT, /USERHISTORY 

// this route will return the content of login.hbs file
app.get("/login", function(req,res){
  res.render("login");
})

// this route will return the content of register.hbs file
app.get("/register", function(req,res){
  res.render("register");
})

// This "POST" route will invoke the dataServiceAuth.RegisterUser(userData) method with the POST data
app.post("/register", function(req,res){
  dataServiceAuth.registerUser(req.body)
  .then(()=>res.render("register", {successMessage: "User created"}))
  .catch((err)=>res.render("register", {errorMessage: err, userName: req.body.userName}));
})

// This "POST" route will invoke the dataServiceAuth.CheckUser(userData) method with the POST data 
app.post("/login", function(req,res){
  req.body.userAgent = req.get('User-Agent');
  dataServiceAuth.checkUser(req.body)
  .then((user) => {
    req.session.user = {
    userName: user.userName, // authenticated user's userName
    email: user.email, // authenticated user's email
    loginHistory: user.loginHistory // authenticated user's loginHistory
    } 
    res.redirect('/employees');
   })
  .catch((err)=>res.render("login", {errorMessage: err, userName: req.body.userName}))
})

// This "GET" route will simply "reset" the session 
app.get("/logout", function(req,res){
  req.session.reset();
  res.redirect("/");
})

// This "GET" route simply renders the "userHistory" view 
app.get("/userHistory", ensureLogin,function(req,res){
  res.render("userHistory");
})



//////////////////////////////////////////////////////////////
// SET UP ROUTES ON /HOME, /ABOUT, /EMPLOYEES/ADD, /IMAGE/ADD, 
// /EMPLOYEES, /MANAGERS, /DEPARTMENTS

// this route will return the content of home.hbs file
app.get("/", function(req,res){
    res.render("home");
  })

// this route will return the content of about.hbs file
app.get("/about", function(req,res){
    res.render("about");
  })

// this route will return the content of addEmployee.hbs file
app.get("/employees/add", ensureLogin,function(req,res){
  data.getDepartments()
  .then((data)=>res.render("addEmployee", {departments: data}))
  .catch((err)=>res.render("addEmployee", {departments: []})); 
}) 

// this route will return the content of addDepartment.hbsfile
app.get("/departments/add", ensureLogin,function(req,res){
  res.render("addDepartment");
}) 

// this route will return the content of addImage.hbs file
app.get("/images/add", ensureLogin,function(req,res){
  res.render("addImage");
}) 

// this route will return Employees
// add a 'route' based on query
app.get('/employees', ensureLogin, function(req, res){
  if(req.query.status) {
    data.getEmployeesByStatus(req.query.status)
    .then((data)=> 
    { if(data.length>0)
      res.render("employees",{employees:data});
      else res.render("employees",{message: "no results" });
    })
    .catch((err)=>res.render("employees",{message: "no results"}))
  } else if (req.query.department) {
    data.getEmployeesByDepartment(req.query.department)
    .then((data)=>
    { if(data.length>0)
      res.render("employees",{employees:data});
      else res.render("employees",{message: "no results" });
    })
    .catch((err)=>res.render("employees",{message: "no results"}))
  } else if (req.query.manager) {
    data.getEmployeesByManager(req.query.manager)
    .then((data)=>
    { if(data.length>0)
      res.render("employees",{employees:data});
      else res.render("employees",{message: "no results" });
    })
    .catch((err)=>res.render("employees",{message: "no results"}))
  } else {
    data.getAllEmployees()
    .then((data)=>
    { if(data.length>0)
      res.render("employees",{employees:data});
      else res.render("employees",{message: "no results" });
    })
    .catch((err)=>res.render("employees",{message: "no results"}))
  }
})

// setup "/employee/value" route 
app.get('/employee/:employeeNum', ensureLogin,function(req, res){
  // initialize an empty object to store the values
  let viewData = {};
  data.getEmployeeByNum(req.params.employeeNum)
  .then((data) => {
      if (data) {
          viewData.employee = data; //store employee data in the "viewData" object as "employee"
      } else {
          viewData.employee = null; // set employee to null if none were returned
      }
  }).catch(() => {
      viewData.employee = null; // set employee to null if there was an error 
  }).then(data.getDepartments)
  .then((data) => {
      viewData.departments = data; // store department data in the "viewData" object as "departments"
      // loop through viewData.departments and once we have found the departmentId that matches
      // the employee's "department" value, add a "selected" property to the matching 
      // viewData.departments object
      for (let i = 0; i < viewData.departments.length; i++) {
          if (viewData.departments[i].departmentId == viewData.employee.department) {
              viewData.departments[i].selected = true;
          }
      }
  }).catch(() => {
      viewData.departments = []; // set departments to empty if there was an error
  }).then(() => {
      if (viewData.employee == null) { // if no employee - return an error
          res.status(404).send("Employee Not Found");
      } else {
          res.render("employee", { viewData: viewData }); // render the "employee" view
      }
  });
});

// setup "/employees/delete/:empNum" route
app.get('/employees/delete/:empNum', ensureLogin,function(req,res){
  data.deleteEmployeeByNum(req.params.empNum)
  .then(()=>res.redirect("/employees"))
  .catch((err)=>res.status(500).send("Unable to Remove Employee / Employee not found"))
})

// this route will return Departments
app.get('/departments', ensureLogin,function(req, res) {
  data.getDepartments()
      .then((data)=>
      { if(data.length>0)
        res.render("departments",{departments:data});
        else res.render("departments",{message: "no results"});
      })
      .catch((err)=>res.render("departments",{message: "no results"}))
})

// setup "/department/:departmentId" route 
app.get('/department/:departmentId', ensureLogin,function(req,res){
  data.getDepartmentById(req.params.departmentId)
  .then((data)=>
  { if(data.length<0)
    res.status(404).send("Department Not Found");
    else res.render("department",{department: data});
  })
  .catch((err)=>res.status(404).send("Department Not Found"))
}) 

// setup "/departments/delete/:departmentId" route
app.get('/departments/delete/:departmentId', ensureLogin,function(req,res){
  data.deleteDepartmentById(req.params.departmentId)
  .then(()=>res.redirect("/departments"))
  .catch((err)=>res.status(500).send("Unable to Remove Department / Department not found"))
})

//////////////////////////////////////////////////////////////
// ADD STORAGE FOR IMAGES, POST ROUTES FOR /IMAGES/ADD
// POST ROUTE FOR EMPLOYEES/ADD AND EMPLOYEES/UPDATE
// POST ROUTE FOR DEPARTMENT/ADD AND DEPARTMENT/UPDATE

// Define a storage for images
const storage = multer.diskStorage({
  destination: "./public/images/uploaded/",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
})

// tell multer to use the diskStorage function for naming files instead of the default.
const upload = multer({ storage: storage });

// Add "Post" route for images
app.post("/images/add", ensureLogin,upload.single("imageFile"), function(req, res) {
  res.redirect("/images");
})

// Add "Get" route /images using the "fs" mode
app.get('/images', ensureLogin,function(req, res){
  fs.readdir("./public/images/uploaded/", function(err, imageFile) {
    res.render("images", {data: imageFile, title:"Images"});
  });
})

// Add "Post" route for Add employees
app.post("/employees/add", ensureLogin,function(req, res) {
  data.addEmployee(req.body)
  .then(res.redirect("/employees"))
  .catch((err) => res.json({"message": err}))
})

// Add "Post" route for Update employee
app.post("/employee/update", ensureLogin,function(req, res){
  console.log(req.body);
  data.updateEmployee(req.body)
  .then(res.redirect("/employees"))
  .catch((err) => res.json({"message": err}))
});

// Add "Post" route for Add department
app.post("/departments/add", ensureLogin,function(req, res) {
  data.addDepartment(req.body)
  .then(res.redirect("/departments"))
  .catch((err) => res.json({"message": err}))
})

// Add "Post" route for Update department
app.post("/department/update", ensureLogin,function(req, res){
  console.log(req.body);
  data.updateDepartment(req.body)
  .then(res.redirect("/departments"))
  .catch((err) => res.json({"message": err}))
});

//////////////////////////////////////////////////////////////
// ALWAYS SHOULD BE AT THE END

// Handle 404 error 
app.use(function(req, res) {
  res.status(400);
  res.render('404.jade', {title: 'Error 404: Page Not Found'});
 })

// call initialize function first;
// start the server only if initializaton is successful
/*
data.initialize()
.then(function(){
    app.listen(HTTP_PORT, onHttpStart);
}).catch(function(err){
  console.log("unable to start server: " + err);
});
*/
data.initialize()
.then(dataServiceAuth.initialize)
.then(function(){
    app.listen(HTTP_PORT, onHttpStart);
}).catch(function(err){
    console.log("unable to start server: " + err);
});
